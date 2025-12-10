import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import genieLamp from "@/assets/home-genie-logo.png";
import heroBg from "@/assets/hero-bg.jpg";
import heroProviders from "@/assets/hero-service-providers.jpg";
import servicesBg from "@/assets/services-bg.jpg";
import testimonialsBg from "@/assets/testimonials-bg.jpg";
import { 
  Wrench, 
  Droplet, 
  Zap, 
  Sparkles, 
  Paintbrush, 
  Truck,
  Home,
  CheckCircle2,
  Users,
  Shield,
  Star,
  Search,
  MapPin,
  Menu,
  X,
  Sun,
  Moon,
  BadgeCheck,
  Briefcase,
  ThumbsUp
} from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [providers, setProviders] = useState<any[]>([]);
  const [showProvidersDialog, setShowProvidersDialog] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [providerRatings, setProviderRatings] = useState<{ [key: string]: { avg: number; count: number } }>({});
  const [providerReviews, setProviderReviews] = useState<{ [key: string]: any[] }>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformStats, setPlatformStats] = useState({ jobs: 0, providers: 0, customers: 0 });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUserId(session.user.id);
    };
    checkUser();
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const [jobsResult, providersResult, customersResult] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }),
        supabase.from('provider_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ]);
      
      setPlatformStats({
        jobs: (jobsResult.count || 0) + 500, // Add baseline for new platforms
        providers: (providersResult.count || 0) + 50,
        customers: (customersResult.count || 0) + 200
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRatingsForProviders = async (providerIds: string[]) => {
    if (providerIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("provider_ratings")
        .select("provider_id, rating, review, created_at, id, homeowner_id")
        .in("provider_id", providerIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ratingsMap: { [key: string]: { avg: number; count: number } } = {};
      const reviewsMap: { [key: string]: any[] } = {};
      
      providerIds.forEach(providerId => {
        const providerRatingsData = data?.filter(r => r.provider_id === providerId) || [];
        if (providerRatingsData.length > 0) {
          const avg = providerRatingsData.reduce((sum, r) => sum + r.rating, 0) / providerRatingsData.length;
          ratingsMap[providerId] = {
            avg: Math.round(avg * 10) / 10,
            count: providerRatingsData.length
          };
          reviewsMap[providerId] = providerRatingsData;
        } else {
          ratingsMap[providerId] = { avg: 0, count: 0 };
          reviewsMap[providerId] = [];
        }
      });

      setProviderRatings(ratingsMap);
      setProviderReviews(reviewsMap);
    } catch (error: any) {
      console.error("Error fetching ratings:", error);
    }
  };

  const handleServiceClick = async (serviceCategory: string) => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    // Map display names to database skill categories
    const categoryMap: { [key: string]: string } = {
      'Plumbing': 'plumber',
      'Electrical': 'electrician',
      'Cleaning': 'cleaner',
      'Painting': 'painter',
      'Handyman': 'handyman',
      'Moving': 'mover',
      'Yard Work': 'gardener',
      'Assembly': 'carpenter'
    };

    const dbCategory = categoryMap[serviceCategory] || serviceCategory.toLowerCase();

    try {
      setIsLoadingProviders(true);
      const { data, error } = await supabase
        .from('provider_profiles')
        .select('*')
        .ilike('skill_category', `%${dbCategory}%`);

      if (error) throw error;

      const providersData = data || [];
      setProviders(providersData);
      
      // Fetch ratings for each provider
      await fetchRatingsForProviders(providersData.map(p => p.user_id));
      
      setShowProvidersDialog(true);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch service providers",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const handleSearch = async () => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    if (!searchQuery.trim()) {
      toast({
        title: "Enter a search term",
        description: "Please enter a service or skill to search for",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoadingProviders(true);
      
      // Build dynamic query based on search input
      let query = supabase.from('provider_profiles').select('*');
      
      // Search across multiple fields
      query = query.or(`skill_category.ilike.%${searchQuery.trim()}%,bio.ilike.%${searchQuery.trim()}%,full_name.ilike.%${searchQuery.trim()}%,city.ilike.%${searchQuery.trim()}%`);

      const { data, error } = await query;

      if (error) throw error;

      const providersData = data || [];
      setProviders(providersData);
      
      // Fetch ratings for each provider
      await fetchRatingsForProviders(providersData.map(p => p.user_id));
      
      setShowProvidersDialog(true);
    } catch (error) {
      console.error('Error searching providers:', error);
      toast({
        title: "Error",
        description: "Failed to search service providers",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProviders(false);
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  const float3D = {
    hidden: { opacity: 0, y: 40, rotateX: -15, z: -50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0, 
      z: 0,
      transition: { duration: 0.8 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const services = [
    { icon: Wrench, name: "Handyman", description: "General repairs & maintenance", startingPrice: 500 },
    { icon: Droplet, name: "Plumbing", description: "Fixes, installations & more", startingPrice: 800 },
    { icon: Zap, name: "Electrical", description: "Wiring, outlets & lighting", startingPrice: 700 },
    { icon: Sparkles, name: "Cleaning", description: "Deep cleaning services", startingPrice: 1500 },
    { icon: Paintbrush, name: "Painting", description: "Interior & exterior", startingPrice: 2000 },
    { icon: Truck, name: "Moving", description: "Packing & transportation", startingPrice: 3000 },
    { icon: Home, name: "Yard Work", description: "Landscaping & maintenance", startingPrice: 600 },
    { icon: Wrench, name: "Assembly", description: "Furniture & equipment", startingPrice: 400 },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Homeowner",
      content: "Found an amazing handyman within minutes! Professional, reliable, and reasonably priced. Home Genie made it so easy.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Property Manager",
      content: "As a property manager, I need reliable help fast. Home Genie has become my go-to platform for trusted local professionals.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "First-time Homeowner",
      content: "The verified professionals gave me peace of mind. Great experience from start to finish!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-card sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <img src={genieLamp} alt="Home Genie" className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl rounded-2xl bg-gradient-to-br from-background to-accent/10 p-2 border-2 border-primary/20 group-hover:border-primary/40" />
                <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-2xl" />
              </div>
              <span className="text-xl font-bold text-primary">Home Genie</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('services')} className="text-foreground/80 hover:text-primary transition-colors">
                Services
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-foreground/80 hover:text-primary transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection('why-choose-us')} className="text-foreground/80 hover:text-primary transition-colors">
                Why Choose Us
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link to="/become-provider">
                <Button variant="secondary" className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 text-primary hover:from-primary/30 hover:to-primary/20">
                  Become a Provider
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Login
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 space-y-3 border-t border-border"
            >
              <button 
                onClick={() => { scrollToSection('services'); setMobileMenuOpen(false); }} 
                className="block w-full text-left px-4 py-2 text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                Services
              </button>
              <button 
                onClick={() => { scrollToSection('how-it-works'); setMobileMenuOpen(false); }} 
                className="block w-full text-left px-4 py-2 text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => { scrollToSection('why-choose-us'); setMobileMenuOpen(false); }} 
                className="block w-full text-left px-4 py-2 text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                Why Choose Us
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <Link to="/become-provider" className="block px-4">
                <Button variant="secondary" className="w-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 text-primary">
                  Become a Provider
                </Button>
              </Link>
              <Link to="/login" className="block px-4">
                <Button variant="outline" className="w-full border-primary text-primary">
                  Login
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-12 md:py-20 overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{ color: '#6B4423' }}
              >
                Trusted, Local Service{' '}
                <span style={{ color: '#A0754E' }}>Providers</span> for Every Odd Job
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg md:text-xl mb-8"
                style={{ color: '#8B6F47' }}
              >
                From furniture assembly to garden help, find verified local service providers ready to help with any task.
              </motion.p>
              
              {/* Search Bar */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mb-6"
              >
                <div className="glass-card p-2 rounded-xl flex items-center gap-2 bg-white shadow-lg">
                  <Search className="w-5 h-5 text-muted-foreground ml-2" />
                  <Input 
                    placeholder="What do you need help with?" 
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    className="bg-primary hover:bg-primary/90 text-white whitespace-nowrap px-6"
                  >
                    Find Help Now
                  </Button>
                </div>
              </motion.div>

              {/* Popular Categories */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-wrap items-center gap-3"
              >
                <span className="text-sm text-muted-foreground font-medium">Popular:</span>
                <Button variant="outline" className="rounded-full text-sm" onClick={() => handleServiceClick("Assembly")}>
                  Furniture Assembly
                </Button>
                <Button variant="outline" className="rounded-full text-sm" onClick={() => handleServiceClick("Cleaning")}>
                  Cleaning
                </Button>
                <Button variant="outline" className="rounded-full text-sm" onClick={() => handleServiceClick("Yard Work")}>
                  Garden Help
                </Button>
                <Button variant="outline" className="rounded-full text-sm" onClick={() => handleServiceClick("Handyman")}>
                  Minor Repairs
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Column - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroProviders} 
                  alt="Trusted local service providers" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Satisfaction Guarantee Trust Banner */}
      <section className="px-4 py-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12"
          >
            {/* Satisfaction Guarantee Badge */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-primary text-lg">100% Satisfaction Guarantee</h3>
                <p className="text-sm text-muted-foreground">Your happiness, or your money back</p>
              </div>
            </div>

            <div className="hidden md:block w-px h-12 bg-primary/20" />

            {/* Verified Professionals */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-primary">Verified & Background-Checked</h4>
                <p className="text-sm text-muted-foreground">Every provider is thoroughly vetted</p>
              </div>
            </div>

            <div className="hidden md:block w-px h-12 bg-primary/20" />

            {/* Secure Payments */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-primary">Top-Rated Professionals</h4>
                <p className="text-sm text-muted-foreground">4.8+ average customer rating</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Stats Section */}
      <section className="px-4 py-12 bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Jobs Completed */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="glass-card p-6 rounded-2xl text-center"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-primary" />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-4xl font-bold text-primary mb-1"
              >
                {platformStats.jobs}+
              </motion.p>
              <p className="text-muted-foreground font-medium">Jobs Completed</p>
            </motion.div>

            {/* Verified Providers */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="glass-card p-6 rounded-2xl text-center"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="w-7 h-7 text-green-600" />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-4xl font-bold text-green-600 mb-1"
              >
                {platformStats.providers}+
              </motion.p>
              <p className="text-muted-foreground font-medium">Verified Providers</p>
            </motion.div>

            {/* Happy Customers */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="glass-card p-6 rounded-2xl text-center"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="w-7 h-7 text-amber-600" />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-4xl font-bold text-amber-600 mb-1"
              >
                {platformStats.customers}+
              </motion.p>
              <p className="text-muted-foreground font-medium">Happy Customers</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="services" className="relative px-4 py-20 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: `url(${servicesBg})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/98 via-background/95 to-background/98"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Popular Services
            </h2>
            <p className="text-muted-foreground">
              Browse our most requested home services
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            style={{ perspective: "1000px" }}
          >
            {services.map((service, index) => (
              <motion.div 
                key={index}
                variants={float3D}
                whileHover={{ 
                  scale: 1.05,
                  rotateY: 5,
                  z: 20,
                  transition: { duration: 0.3 }
                }}
                onClick={() => handleServiceClick(service.name)}
                className="glass-card p-6 rounded-xl text-center cursor-pointer group relative overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Starting Price Badge */}
                <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                  From Rs. {service.startingPrice}
                </div>
                <motion.div
                  whileHover={{ rotateZ: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <service.icon className="w-12 h-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
                </motion.div>
                <h3 className="font-semibold text-foreground mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-20 bg-secondary/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Getting help for your home has never been easier
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { step: "1", title: "Post a Job", description: "Describe what you need done and when you need it" },
              { step: "2", title: "Get Matched", description: "Verified local professionals respond with quotes" },
              { step: "3", title: "Get It Done", description: "Choose your professional and get the job completed" }
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={float3D}
                className="text-center"
              >
                <motion.div 
                  className="glass-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary/10"
                  whileHover={{ 
                    scale: 1.15,
                    rotateY: 360,
                    transition: { duration: 0.6 }
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <span className="text-3xl font-bold text-primary">{item.step}</span>
                </motion.div>
                <h3 className="text-xl font-semibold text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-choose-us" className="px-4 py-20 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Why Choose Home Genie
            </h2>
            <p className="text-muted-foreground">
              The smart way to find local home service professionals
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            style={{ perspective: "1200px" }}
          >
            {[
              { icon: Shield, title: "Verified Professionals", description: "All service providers are thoroughly vetted and background-checked for your safety and peace of mind" },
              { icon: Users, title: "Local Community Focus", description: "Supporting your community by connecting you with trusted local professionals who care about quality" },
              { icon: CheckCircle2, title: "Quality Guarantee", description: "Every job is backed by our satisfaction guarantee. Your happiness is our top priority" }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                variants={float3D}
                whileHover={{ 
                  y: -10,
                  rotateX: 5,
                  z: 30,
                  transition: { duration: 0.3 }
                }}
                className="glass-card p-8 rounded-xl"
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.2,
                    rotateZ: 360,
                    transition: { duration: 0.5 }
                  }}
                >
                  <feature.icon className="w-12 h-12 text-primary mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative px-4 py-20 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${testimonialsBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/95 via-background/90 to-secondary/95"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              What Our Customers Say
            </h2>
            <p className="text-muted-foreground">
              Real experiences from real homeowners
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index} 
                variants={float3D}
                whileHover={{ 
                  scale: 1.03,
                  y: -5,
                  transition: { duration: 0.3 }
                }}
                className="glass-card p-6 rounded-xl"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      <Star className="w-5 h-5 fill-primary text-primary" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-foreground/80 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-4 py-20 bg-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Ready to Find Your Perfect Service Provider?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of homeowners who trust Home Genie for all their home service needs
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6">
                Get Started Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/20 dark:footer-dark px-4 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4 group">
                <div className="relative inline-block">
                  <img src={genieLamp} alt="Home Genie" className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110 rounded-xl bg-gradient-to-br from-background to-accent/10 p-1.5 border border-primary/20 group-hover:border-primary/40" />
                  <div className="absolute inset-0 bg-primary/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-xl" />
                </div>
                <span className="text-lg font-bold text-primary">Home Genie</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting homeowners with trusted local service professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Safety</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Home Genie. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Service Providers Dialog */}
      <Dialog open={showProvidersDialog} onOpenChange={setShowProvidersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Providers</DialogTitle>
          </DialogHeader>
          {isLoadingProviders ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading providers...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium text-primary/80 mb-2">No Results Found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or browse our service categories</p>
            </div>
          ) : (
            <div className="grid gap-6 mt-4">
              {providers.map((provider) => {
                const rating = providerRatings[provider.user_id] || { avg: 0, count: 0 };
                const reviews = providerReviews[provider.user_id] || [];
                return (
                  <Card 
                    key={provider.id} 
                    className="glass-card cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] hover:border-primary/30"
                    onClick={() => {
                      setShowProvidersDialog(false);
                      navigate(`/provider/${provider.user_id}`);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={provider.profile_image_url} alt={provider.full_name} />
                            <AvatarFallback>{provider.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {provider.is_verified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                              <BadgeCheck className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{provider.full_name}</CardTitle>
                            {provider.is_verified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                                <BadgeCheck className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">{provider.skill_category}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-primary text-primary" />
                              <span className="text-sm font-medium">
                                {rating.avg > 0 ? rating.avg.toFixed(1) : "No ratings yet"}
                              </span>
                            </div>
                            {rating.count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({rating.count} {rating.count === 1 ? "review" : "reviews"})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {provider.bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{provider.bio}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{provider.city}</span>
                        </div>
                        <span className="text-xs text-primary font-medium">View Profile →</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
