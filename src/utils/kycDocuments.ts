import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a signed URL for accessing KYC documents from the private bucket.
 * Signed URLs expire after the specified duration for security.
 * 
 * @param path - The file path in the kyc_documents bucket
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns The signed URL or null if generation fails
 */
export async function getSignedKycUrl(
  path: string, 
  expiresIn: number = 3600
): Promise<string | null> {
  if (!path) return null;
  
  // If it's already a full URL, extract the path
  let cleanPath = path;
  if (path.includes('/kyc_documents/')) {
    cleanPath = path.split('/kyc_documents/').pop() || path;
  }
  
  try {
    const { data, error } = await supabase.storage
      .from('kyc_documents')
      .createSignedUrl(cleanPath, expiresIn);

    if (error) {
      console.error('Failed to generate signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * Loads signed URLs for all KYC document fields
 */
export async function loadKycSignedUrls(kycRecord: {
  cnic_front_url: string;
  cnic_back_url: string;
  selfie_url: string;
}): Promise<{
  front: string | null;
  back: string | null;
  selfie: string | null;
}> {
  const [front, back, selfie] = await Promise.all([
    getSignedKycUrl(kycRecord.cnic_front_url),
    getSignedKycUrl(kycRecord.cnic_back_url),
    getSignedKycUrl(kycRecord.selfie_url),
  ]);

  return { front, back, selfie };
}
