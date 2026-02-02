

# Security Fixes Implementation Plan

## Overview

This plan addresses 11 security issues identified in the Home Genie application. The fixes are organized by priority and impact, focusing on data privacy, access control, and compliance with security best practices.

---

## Security Issues Summary

| Issue | Severity | Status |
|-------|----------|--------|
| Leaked Password Protection Disabled | Warning | Manual Action Required |
| User Emails/Phones Exposed to Authenticated Users | Error | Will Fix |
| Provider Phone Numbers Publicly Accessible | Error | Will Fix |
| National ID Cards (KYC) Accessible | Error | Already Fixed (Signed URLs) |
| Customer Identities in Public Ratings | Error | Will Fix |
| Customer Locations in Job Listings | Warning | Will Fix |
| Users Cannot Delete Messages | Warning | Will Fix |
| Payment Records Cannot Be Corrected | Warning | Design Decision |
| Provider Wallet Update Restrictions | Info | Design Decision (Backend-only) |
| Service Categories Publicly Readable | Info | Intentional - Ignore |
| Rate Limits Table Not Deletable | Info | Intentional - Ignore |

---

## Fixes to Implement

### 1. Restrict Profile Table Access (High Priority)

**Problem**: Any authenticated user can view all profiles including email addresses and phone numbers.

**Solution**: Update RLS policy to allow users to view only their own profile, or profiles of users they have a business relationship with (job connection).

**Database Migration**:
- Drop the overly permissive "Authenticated users can view profiles" policy
- Create a new policy that restricts SELECT to:
  - User's own profile
  - Admins
  - Users with job relationships (homeowner viewing assigned provider's profile, or provider viewing job poster's profile)

---

### 2. Restrict Provider Profiles Access (High Priority)

**Problem**: Provider profiles (with phone numbers and GPS coordinates) are publicly accessible to anonymous users.

**Solution**: Restrict provider profile viewing to authenticated users only, and mask sensitive data from non-related users.

**Database Migration**:
- Drop "Anyone can view provider profiles" policy
- Create policy allowing only authenticated users to view provider profiles
- Create a view that masks phone numbers for general browsing

**Note**: GPS coordinates are needed for proximity calculations but should not include phone numbers for anonymous users.

---

### 3. Restrict Provider Ratings Access (High Priority)

**Problem**: Ratings table is publicly readable and exposes homeowner_id, revealing which customers hired which providers.

**Solution**: Create a secure view that hides homeowner_id for public display while preserving full data for the involved parties.

**Database Migration**:
- Create a view `provider_ratings_public` that excludes homeowner_id
- Drop "Anyone can view ratings" policy
- Create tiered access:
  - Provider can see all ratings for themselves
  - Homeowner can see their own ratings
  - Others can query the public view (ratings without homeowner_id)

---

### 4. Implement Location Fuzzing for Jobs (Medium Priority)

**Problem**: Job listings expose exact latitude/longitude to all providers, revealing homeowner addresses before they're hired.

**Solution**: Create a database function that rounds coordinates to reduce precision until provider is assigned.

**Code Changes**:
- Add a SQL function `get_fuzzy_location()` that rounds lat/long to ~1km precision
- Update job fetching queries to use fuzzy coordinates for unassigned jobs
- Show exact coordinates only after provider is assigned

---

### 5. Allow Users to Delete Their Own Messages (Medium Priority)

**Problem**: Users cannot delete messages they sent, even if they contain sensitive information.

**Solution**: Add a DELETE policy for the messages table.

**Database Migration**:
- Add RLS policy: "Users can delete messages they sent"
- Policy: `auth.uid() = sender_id`

**Code Changes**:
- Add delete message functionality to the Chat interface

---

### 6. Update Frontend Code for Secure Data Access

**Files to Update**:
- `src/pages/Index.tsx` - Stop exposing homeowner_id in ratings queries
- `src/pages/ProviderProfile.tsx` - Use the secure ratings view
- `src/pages/PaymentHistory.tsx` - Ensure profile access is scoped correctly
- `src/pages/Messages.tsx` - Add delete message functionality
- `src/pages/Chat.tsx` - Add delete message button

---

## Items Requiring Manual Action

### Leaked Password Protection

This setting must be enabled manually in the Lovable Cloud backend:

1. Navigate to Authentication → Settings → Password Protection
2. Enable "Leaked Password Protection"
3. This prevents users from signing up with passwords found in data breaches

---

## Items Intentionally Left As-Is

### Service Categories Public Access
- **Reason**: Service categories (plumber, electrician, etc.) are public reference data needed for the marketplace to function. No PII is stored here.

### Rate Limits Not Deletable
- **Reason**: Rate limit records should persist for security auditing. Allowing deletion could enable abuse.

### Provider Wallet Update Restrictions  
- **Reason**: Wallet balances are updated via secure backend functions (edge functions with service role), not directly by users. This is intentional to prevent balance manipulation.

### Payment Update Restrictions
- **Reason**: Payment records are financial audit data. Disputes should be handled through the admin panel or a dedicated dispute system, not direct edits.

---

## Technical Details

### Database Migration SQL

```sql
-- 1. Restrict profiles table access
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create helper function for job relationships
CREATE OR REPLACE FUNCTION public.has_job_relationship(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Viewer is homeowner, profile is assigned provider
    SELECT 1 FROM jobs 
    WHERE posted_by = _viewer_id 
    AND assigned_provider_id = _profile_id
    UNION
    -- Viewer is provider, profile is job poster
    SELECT 1 FROM jobs 
    WHERE assigned_provider_id = _viewer_id 
    AND posted_by = _profile_id
    UNION
    -- Viewer and profile have message history
    SELECT 1 FROM messages
    WHERE (sender_id = _viewer_id AND receiver_id = _profile_id)
       OR (receiver_id = _viewer_id AND sender_id = _profile_id)
  )
$$;

-- Create restricted profile access policy
CREATE POLICY "Users can view own profile or job-related profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id 
  OR is_admin(auth.uid())
  OR has_job_relationship(auth.uid(), id)
);

-- 2. Restrict provider_profiles to authenticated users
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.provider_profiles;

CREATE POLICY "Authenticated users can view provider profiles"
ON public.provider_profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- 3. Secure provider_ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.provider_ratings;

-- Providers can see all ratings for themselves
CREATE POLICY "Providers can view their own ratings"
ON public.provider_ratings FOR SELECT
USING (auth.uid() = provider_id);

-- Homeowners can see ratings they gave
CREATE POLICY "Homeowners can view their own ratings"
ON public.provider_ratings FOR SELECT
USING (auth.uid() = homeowner_id);

-- Admins can see all ratings
CREATE POLICY "Admins can view all ratings"
ON public.provider_ratings FOR SELECT
USING (is_admin(auth.uid()));

-- Create public view for aggregated ratings without homeowner_id
CREATE OR REPLACE VIEW public.provider_ratings_public
WITH (security_invoker=on) AS
SELECT id, provider_id, rating, review, created_at
FROM public.provider_ratings;

-- 4. Add message deletion policy
CREATE POLICY "Users can delete messages they sent"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- 5. Create location fuzzing function
CREATE OR REPLACE FUNCTION public.get_fuzzy_coordinates(
  lat double precision, 
  lon double precision,
  precision_km double precision DEFAULT 1.0
)
RETURNS TABLE(fuzzy_lat double precision, fuzzy_lon double precision)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  lat_precision double precision;
  lon_precision double precision;
BEGIN
  -- Approximate: 1 degree latitude = 111km
  lat_precision := precision_km / 111.0;
  -- Longitude varies with latitude, but use approximate value
  lon_precision := precision_km / (111.0 * COS(RADIANS(lat)));
  
  fuzzy_lat := ROUND(lat / lat_precision) * lat_precision;
  fuzzy_lon := ROUND(lon / lon_precision) * lon_precision;
  RETURN NEXT;
END;
$$;
```

---

## Implementation Order

1. Apply database migration for RLS policy changes
2. Update frontend components to use secure data access patterns
3. Add message deletion UI
4. Test all affected flows
5. Document manual action for Leaked Password Protection

---

## Expected Outcome

After implementation:
- User emails and phone numbers only visible to directly related parties
- Provider contact info hidden from anonymous users
- Customer identities protected in public rating views
- Job locations fuzzy until provider is assigned
- Users can delete their own messages
- All ERROR-level security issues resolved
- WARNING-level issues mitigated or documented

