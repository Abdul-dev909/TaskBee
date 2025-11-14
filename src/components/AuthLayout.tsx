import { ReactNode } from "react";
import genieLamp from "@/assets/home-genie-logo.png";

interface AuthLayoutProps {
  children: ReactNode;
  backgroundImage?: string;
}

const AuthLayout = ({ children, backgroundImage }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Image with Overlay and Gentle Motion */}
      {backgroundImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-pan"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/92 via-background/88 to-background/92" />
        </>
      )}
      
      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="relative group inline-block">
              <img 
                src={genieLamp} 
                alt="Home Genie" 
                className="w-16 h-16 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl rounded-2xl bg-gradient-to-br from-background to-accent/10 p-2 border-2 border-primary/20 group-hover:border-primary/40"
              />
              <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-2xl" />
            </div>
            <h1 className="text-3xl font-semibold text-primary">
              Home Genie
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Local Odd Jobs & Service Finder
          </p>
        </div>

        {/* Content Card */}
        <div className="glass-card rounded-2xl p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
