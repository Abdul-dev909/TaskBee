import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Wrench, Paintbrush, Home, Zap, Droplets, CheckCircle, Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import genieLamp from "@/assets/genie-lamp.png";
import dashboardBg from "@/assets/dashboard-bg.jpg";

const HomeownerDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Animation variants for scroll-triggered animations
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  const fadeInScale = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
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
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const services = [
    { icon: Wrench, title: "Plumbing", description: "Expert plumbers for all your needs" },
    { icon: Paintbrush, title: "Painting", description: "Professional painting services" },
    { icon: Home, title: "Carpentry", description: "Skilled carpenters for repairs" },
    { icon: Zap, title: "Electrical", description: "Licensed electricians" },
    { icon: Droplets, title: "Cleaning", description: "Thorough cleaning services" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Homeowner",
      content: "Found an amazing plumber within minutes! The service was excellent and reasonably priced.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Property Manager",
      content: "Home Genie has become my go-to platform for finding reliable service professionals.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-5"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/98 via-background/97 to-background/98" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
              <img src={genieLamp} alt="Genie Lamp" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-semibold text-primary">Home Genie</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection("services")} className="text-muted-foreground hover:text-primary transition-colors">
                Services
              </button>
              <button onClick={() => scrollToSection("how-it-works")} className="text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection("testimonials")} className="text-muted-foreground hover:text-primary transition-colors">
                Testimonials
              </button>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            Find Local Home Service
            <span className="text-primary block mt-2">Professionals</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Connect with trusted professionals for all your home repair and maintenance needs
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-card p-4 rounded-2xl shadow-lg">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    placeholder="What service do you need? (e.g., plumber, electrician)"
                    className="pl-12 input-elegant"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="lg" className="btn-glow">
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Popular Services */}
      <section id="services" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-4xl font-bold text-center mb-4"
          >
            Popular Services
          </motion.h2>
          <motion.p 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center text-muted-foreground mb-12"
          >
            Browse our most requested home services
          </motion.p>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"
            style={{ perspective: "1000px" }}
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                variants={float3D}
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 5,
                  rotateX: -5,
                  z: 20,
                  transition: { duration: 0.3 }
                }}
                className="glass-card p-6 rounded-xl cursor-pointer group"
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div 
                  className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotateZ: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <service.icon className="w-7 h-7 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-4xl font-bold text-center mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center text-muted-foreground mb-12"
          >
            Get started in three simple steps
          </motion.p>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {[
              { step: "1", title: "Search", description: "Tell us what service you need" },
              { step: "2", title: "Compare", description: "Review profiles and ratings" },
              { step: "3", title: "Book", description: "Connect with your chosen professional" },
            ].map((item, index) => (
              <motion.div 
                key={index} 
                variants={float3D}
                className="text-center"
              >
                <motion.div 
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4"
                  whileHover={{ 
                    scale: 1.15, 
                    rotateY: 360,
                    transition: { duration: 0.6 }
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {item.step}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-4xl font-bold text-center mb-12"
          >
            Why Choose Home Genie
          </motion.h2>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            style={{ perspective: "1200px" }}
          >
            {[
              { icon: CheckCircle, title: "Verified Professionals", description: "All service providers are background checked" },
              { icon: Star, title: "Rated & Reviewed", description: "Real reviews from real customers" },
              { icon: Zap, title: "Quick Response", description: "Get responses within minutes" },
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                variants={float3D}
                whileHover={{ 
                  y: -10,
                  rotateX: 5,
                  rotateY: -5,
                  z: 30,
                  transition: { duration: 0.3 }
                }}
                className="glass-card p-8 rounded-xl text-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div 
                  className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                  whileHover={{ 
                    scale: 1.2,
                    rotateZ: 360,
                    transition: { duration: 0.5 }
                  }}
                >
                  <feature.icon className="w-7 h-7 text-primary" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-4xl font-bold text-center mb-4"
          >
            What Our Customers Say
          </motion.h2>
          <motion.p 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center text-muted-foreground mb-12"
          >
            Real experiences from real people
          </motion.p>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index} 
                variants={fadeInScale}
                whileHover={{ 
                  scale: 1.03,
                  rotateY: 2,
                  z: 10,
                  transition: { duration: 0.3 }
                }}
                className="glass-card p-8 rounded-xl"
                style={{ transformStyle: "preserve-3d" }}
              >
                <Quote className="w-10 h-10 text-primary/20 mb-4" />
                <p className="text-lg mb-6">{testimonial.content}</p>
                <div className="flex items-center gap-2 mb-2">
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
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={genieLamp} alt="Genie Lamp" className="w-8 h-8 object-contain" />
                <span className="text-xl font-semibold text-primary">Home Genie</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting homeowners with trusted service professionals
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Professionals</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Join as Pro</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Success Stories</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Safety</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Home Genie. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default HomeownerDashboard;