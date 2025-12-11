import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Briefcase, 
  CheckCircle2, 
  Shield, 
  Calendar,
  MessageSquare,
  Clock
} from "lucide-react";
import genieLamp from "@/assets/home-genie-logo.png";

interface ProviderData {
  user_id: string;
  full_name: string;
  skill_category: string;
  city: string;
  phone: string;
  bio: string;
  profile_image_url: string | null;
  is_verified: boolean;
  created_at: string;
}

interface Rating {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  homeowner_id: string;
}

interface CompletedJob {
  id: string;
  title: string;
  category: string;
  completed_at: string;
}

const ProviderProfile = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (providerId) {
      fetchProviderData();
    }
  }, [providerId]);

  const fetchProviderData = async () => {
    setIsLoading(true);
    try {
      // Fetch provider profile
      const { data: providerData, error: providerError } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", providerId)
        .single();

      if (providerError) throw providerError;
      setProvider(providerData);

      // Fetch ratings and reviews
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("provider_ratings")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });

      if (!ratingsError && ratingsData) {
        setRatings(ratingsData);
        if (ratingsData.length > 0) {
          const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
          setAvgRating(Math.round(avg * 10) / 10);
        }
      }

      // Fetch completed jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, category, updated_at")
        .eq("assigned_provider_id", providerId)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(10);

      if (!jobsError && jobsData) {
        setCompletedJobs(jobsData.map(j => ({
          id: j.id,
          title: j.title,
          category: j.category,
          completed_at: j.updated_at
        })));
      }
    } catch (error) {
      console.error("Error fetching provider data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="glass-card rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="w-32 h-32 rounded-full mx-auto md:mx-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card max-w-md text-center p-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Provider Not Found</h2>
          <p className="text-muted-foreground mb-6">The provider you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <nav className="glass-card sticky top-0 z-40 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-primary/10">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={genieLamp} alt="Home Genie" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-primary">Provider Profile</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card overflow-hidden">
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent h-24 md:h-32" />
            <CardContent className="relative px-6 pb-6">
              <div className="flex flex-col md:flex-row gap-6 -mt-12 md:-mt-16">
                {/* Avatar */}
                <div className="relative mx-auto md:mx-0">
                  <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-xl">
                    <AvatarImage src={provider.profile_image_url || undefined} alt={provider.full_name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                      {provider.full_name?.split(' ').map(n => n[0]).join('') || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  {provider.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-amber-500/30">
                      <Shield className="w-5 h-5 text-white drop-shadow-sm" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left pt-4 md:pt-8">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{provider.full_name}</h1>
                    {provider.is_verified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-semibold shadow-sm w-fit mx-auto md:mx-0">
                        <Shield className="w-4 h-4" />
                        Verified Pro
                      </span>
                    )}
                  </div>
                  
                  <Badge variant="secondary" className="mb-3 capitalize">
                    {provider.skill_category}
                  </Badge>

                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{provider.city}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>Joined {new Date(provider.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {provider.bio && (
                    <p className="text-muted-foreground leading-relaxed">{provider.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          <Card className="glass-card text-center p-4">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold text-foreground">{avgRating || '-'}</span>
            </div>
            <p className="text-xs text-muted-foreground">{ratings.length} Reviews</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{completedJobs.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Jobs Done</p>
          </Card>
          <Card className="glass-card text-center p-4">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">
                {Math.floor((Date.now() - new Date(provider.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Months Active</p>
          </Card>
        </motion.div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <MessageSquare className="w-5 h-5 text-primary" />
                Reviews & Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ratings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {ratings.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 rounded-xl bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.review && (
                        <p className="text-sm text-foreground/80">{review.review}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Completed Jobs Section */}
        {completedJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Completed Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedJobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">{job.title}</p>
                        <Badge variant="outline" className="text-xs mt-1 capitalize">{job.category}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs">Completed</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProviderProfile;
