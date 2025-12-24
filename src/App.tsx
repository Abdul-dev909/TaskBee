import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AIChatWidget from "@/components/AIChatWidget";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import BottomNavigation from "@/components/BottomNavigation";
import AnimatedRoutes from "@/components/AnimatedRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AIChatWidget />
        <PWAInstallPrompt />
        <div className="pb-16 md:pb-0">
          <AnimatedRoutes />
        </div>
        <BottomNavigation />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
