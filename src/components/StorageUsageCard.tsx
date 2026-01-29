import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StorageUsage {
  used_bytes: number;
  max_bytes: number;
  used_mb: number;
  max_mb: number;
  percentage: number;
  is_estimate: boolean;
  total_rows?: number;
}

interface StorageUsageCardProps {
  className?: string;
  autoRefreshInterval?: number; // in milliseconds, 0 to disable
}

export const StorageUsageCard = ({ 
  className,
  autoRefreshInterval = 30000 // 30 seconds default
}: StorageUsageCardProps) => {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStorageUsage = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-storage-usage");
      
      if (fnError) throw fnError;
      
      setUsage(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Failed to fetch storage usage:", err);
      setError(err.message || "Failed to fetch storage usage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorageUsage();
    
    // Set up auto-refresh if enabled
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchStorageUsage(false); // Don't show loading spinner for auto-refresh
      }, autoRefreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [fetchStorageUsage, autoRefreshInterval]);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-orange-500";
    if (percentage >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-orange-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 75) {
      return <AlertTriangle className={cn("h-5 w-5", getStatusColor(percentage))} />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} B`;
  };

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Database Storage
          </CardTitle>
          <CardDescription className="text-xs">
            {lastUpdated && (
              <>Updated {lastUpdated.toLocaleTimeString()}</>
            )}
            {usage?.is_estimate && " (estimated)"}
          </CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => fetchStorageUsage()}
          disabled={loading}
          className="h-8 w-8"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : loading && !usage ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : usage ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(usage.percentage)}
                <span className={cn("text-2xl font-bold", getStatusColor(usage.percentage))}>
                  {usage.percentage.toFixed(1)}%
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatBytes(usage.used_bytes)} / {formatBytes(usage.max_bytes)}
              </span>
            </div>
            
            <div className="relative">
              <Progress 
                value={usage.percentage} 
                className="h-3"
              />
              <div 
                className={cn(
                  "absolute inset-0 h-3 rounded-full transition-all",
                  getProgressColor(usage.percentage)
                )}
                style={{ 
                  width: `${Math.min(usage.percentage, 100)}%`,
                  opacity: 0.9
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used: {usage.used_mb.toFixed(2)} MB</span>
              <span>Free: {(usage.max_mb - usage.used_mb).toFixed(2)} MB</span>
            </div>

            {usage.percentage >= 75 && (
              <div className={cn(
                "text-xs p-2 rounded-md",
                usage.percentage >= 90 
                  ? "bg-destructive/10 text-destructive" 
                  : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
              )}>
                {usage.percentage >= 90 
                  ? "⚠️ Critical: Storage nearly full! Run cleanup immediately."
                  : "⚠️ Warning: Consider running cleanup to free up space."}
              </div>
            )}

            {usage.total_rows !== undefined && (
              <p className="text-xs text-muted-foreground">
                Total records: {usage.total_rows.toLocaleString()}
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};
