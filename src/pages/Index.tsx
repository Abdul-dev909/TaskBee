import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import genieLamp from "@/assets/genie-lamp.png";
import heroBg from "@/assets/hero-bg.jpg";
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
  Search
} from "lucide-react";

const Index = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const services = [
    { icon: Wrench, name: "Handyman", description: "General repairs & maintenance" },
    { icon: Droplet, name: "Plumbing", description: "Fixes, installations & more" },
    { icon: Zap, name: "Electrical", description: "Wiring, outlets & lighting" },
    { icon: Sparkles, name: "Cleaning", description: "Deep cleaning services" },
    { icon: Paintbrush, name: "Painting", description: "Interior & exterior" },
    { icon: Truck, name: "Moving", description: "Packing & transportation" },
    { icon: Home, name: "Yard Work", description: "Landscaping & maintenance" },
    { icon: Wrench, name: "Assembly", description: "Furniture & equipment" },
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
            <div className="flex items-center gap-3">
              <img src={genieLamp} alt="Home Genie" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-primary">Home Genie</span>
            </div>
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden">
        {/* Animated Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-pan"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in">
            <img 
              src={genieLamp} 
              alt="Genie Lamp" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain animate-glow"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 animate-fade-in">
            Find Trusted Local Experts<br />for Every Home Project
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your trusted platform to find reliable local professionals for all your home service needs
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="glass-card p-2 rounded-xl flex items-center gap-2">
              <Search className="w-5 h-5 text-muted-foreground ml-2" />
              <Input 
                placeholder="What do you need help with?" 
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Link to="/signup">
                <Button className="btn-glow whitespace-nowrap">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
            <p>Join thousands of homeowners finding trusted local help</p>
            <span className="hidden sm:inline">|</span>
            <Link to="/become-provider" className="text-primary font-medium hover:underline">
              Are you a service provider? Join us →
            </Link>
          </div>
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Popular Services
            </h2>
            <p className="text-muted-foreground">
              Browse our most requested home services
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {services.map((service, index) => (
              <div 
                key={index}
                className="glass-card p-6 rounded-xl text-center hover:shadow-[0_12px_40px_hsla(var(--primary),0.15)] transition-all duration-300 cursor-pointer group"
              >
                <service.icon className="w-12 h-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-20 bg-secondary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Getting help for your home has never been easier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="glass-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary/10">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Post a Job
              </h3>
              <p className="text-muted-foreground">
                Describe what you need done and when you need it
              </p>
            </div>

            <div className="text-center">
              <div className="glass-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary/10">
                <span className="text-3xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Get Matched
              </h3>
              <p className="text-muted-foreground">
                Verified local professionals respond with quotes
              </p>
            </div>

            <div className="text-center">
              <div className="glass-card w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary/10">
                <span className="text-3xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Get It Done
              </h3>
              <p className="text-muted-foreground">
                Choose your professional and get the job completed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-choose-us" className="px-4 py-20 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Why Choose Home Genie
            </h2>
            <p className="text-muted-foreground">
              The smart way to find local home service professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-xl">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-3">
                Verified Professionals
              </h3>
              <p className="text-muted-foreground">
                All service providers are thoroughly vetted and background-checked for your safety and peace of mind
              </p>
            </div>

            <div className="glass-card p-8 rounded-xl">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-3">
                Local Community Focus
              </h3>
              <p className="text-muted-foreground">
                Supporting your community by connecting you with trusted local professionals who care about quality
              </p>
            </div>

            <div className="glass-card p-8 rounded-xl">
              <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-3">
                Quality Guarantee
              </h3>
              <p className="text-muted-foreground">
                Every job is backed by our satisfaction guarantee. Your happiness is our top priority
              </p>
            </div>
          </div>
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              What Our Customers Say
            </h2>
            <p className="text-muted-foreground">
              Real experiences from real homeowners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-card p-6 rounded-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/80 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of homeowners who trust Home Genie for their home service needs
          </p>
          <Link to="/signup">
            <Button size="lg" className="btn-glow text-lg px-8">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={genieLamp} alt="Home Genie" className="w-8 h-8 object-contain" />
                <span className="font-bold text-primary">Home Genie</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted platform for local home services
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">For Professionals</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/become-provider" className="text-muted-foreground hover:text-primary transition-colors">Become a Provider</Link></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Provider Resources</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Success Stories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Home Genie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
