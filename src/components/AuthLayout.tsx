import { ReactNode } from "react";
import genieLamp from "@/assets/genie-lamp.png";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src={genieLamp} 
              alt="Genie Lamp" 
              className="w-12 h-12 object-contain"
            />
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
