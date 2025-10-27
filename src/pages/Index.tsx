import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import genieLamp from "@/assets/genie-lamp.png";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <img 
            src={genieLamp} 
            alt="Genie Lamp" 
            className="w-20 h-20 object-contain animate-glow"
          />
          <h1 className="text-5xl font-bold text-primary">
            Home Genie
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-xl text-muted-foreground mb-8">
          Local Odd Jobs & Service Finder
        </p>

        <p className="text-lg text-foreground/80 mb-12 max-w-lg mx-auto">
          Your trusted platform to find reliable local professionals for all your home service needs.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup">
            <Button 
              size="lg" 
              className="btn-glow w-full sm:w-auto min-w-[160px]"
            >
              Get Started
            </Button>
          </Link>
          <Link to="/login">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto min-w-[160px] border-primary text-primary hover:bg-primary/10"
            >
              Sign In
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-primary mb-2">
              Trusted Professionals
            </h3>
            <p className="text-sm text-muted-foreground">
              Verified local service providers you can count on
            </p>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-primary mb-2">
              Easy Booking
            </h3>
            <p className="text-sm text-muted-foreground">
              Quick and simple scheduling for all your home needs
            </p>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-primary mb-2">
              Local Support
            </h3>
            <p className="text-sm text-muted-foreground">
              Supporting your community, one job at a time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
