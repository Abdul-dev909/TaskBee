import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Briefcase, 
  Plus, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import genieLamp from "@/assets/genie-lamp.png";

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const mockJobs = [
    { id: 1, title: "Kitchen Sink Repair", status: "pending", location: "Downtown", budget: "$150", date: "2025-01-15" },
    { id: 2, title: "Bathroom Painting", status: "in-progress", location: "Suburb Area", budget: "$300", date: "2025-01-18" },
    { id: 3, title: "Electrical Wiring", status: "completed", location: "North Side", budget: "$500", date: "2025-01-10" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={genieLamp} alt="Genie Lamp" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-2xl font-semibold text-primary">Home Genie</h1>
                <p className="text-xs text-muted-foreground">Service Provider Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">Welcome back, Provider!</h2>
          <p className="text-muted-foreground">Manage your services and jobs from your dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <Card className="glass-card hover-scale">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">5</div>
                <Briefcase className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-scale">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">24</div>
                <CheckCircle className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-scale">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Earnings (Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">$2,450</div>
                <DollarSign className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-scale">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">4.8</div>
                <div className="text-2xl">⭐</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">My Jobs</TabsTrigger>
            <TabsTrigger value="post-service">Post Service</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest job updates and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">New job request received</p>
                      <p className="text-sm text-muted-foreground">Kitchen Sink Repair - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Job completed</p>
                      <p className="text-sm text-muted-foreground">Bathroom Painting - Yesterday</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6 animate-fade-in">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Assigned Jobs</CardTitle>
                <CardDescription>Manage and track your ongoing jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockJobs.map((job) => (
                    <div key={job.id} className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {job.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {job.budget}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          job.status === 'in-progress' ? 'bg-primary/20 text-primary' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {job.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        {job.status !== 'completed' && (
                          <Button size="sm" className="btn-glow">Update Status</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Post Service Tab */}
          <TabsContent value="post-service" className="animate-fade-in">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Post New Service</CardTitle>
                <CardDescription>List a new service you can provide to homeowners</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="service-title">Service Title</Label>
                    <Input 
                      id="service-title" 
                      placeholder="e.g., Professional Plumbing Services"
                      className="input-elegant"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input 
                      id="category" 
                      placeholder="e.g., Plumbing, Electrical, Painting"
                      className="input-elegant"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe your service and expertise..."
                      rows={4}
                      className="input-elegant"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price Range</Label>
                      <Input 
                        id="price" 
                        placeholder="e.g., $50 - $200"
                        className="input-elegant"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability</Label>
                      <Input 
                        id="availability" 
                        placeholder="e.g., Weekdays 9am-5pm"
                        className="input-elegant"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Service Area</Label>
                    <Input 
                      id="location" 
                      placeholder="e.g., Downtown, Suburbs"
                      className="input-elegant"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full btn-glow"
                    onClick={(e) => {
                      e.preventDefault();
                      toast({
                        title: "Service Posted!",
                        description: "Your service has been listed successfully.",
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post Service
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProviderDashboard;