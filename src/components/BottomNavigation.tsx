import { useNavigate, useLocation } from "react-router-dom";
import { Home, Briefcase, MessageSquare, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        
        // Check user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (roleData) {
          setUserRole(roleData.role);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show on auth pages or if not authenticated
  const hideOnPaths = ['/login', '/signup', '/become-provider', '/provider-success'];
  if (hideOnPaths.includes(location.pathname) || !isAuthenticated) {
    return null;
  }

  const getNavItems = (): NavItem[] => {
    const basePath = userRole === 'service_provider' ? '/provider-dashboard' : '/homeowner-dashboard';
    const settingsPath = userRole === 'service_provider' ? '/provider-settings' : '/homeowner-settings';

    // Admin has different navigation
    if (userRole === 'admin') {
      return [
        { icon: Home, label: "Dashboard", path: "/admin/dashboard" },
        { icon: Briefcase, label: "Jobs", path: "/admin/jobs" },
        { icon: User, label: "Users", path: "/admin/users" },
        { icon: Bell, label: "KYC", path: "/admin/kyc-verification" },
      ];
    }

    return [
      { icon: Home, label: "Home", path: basePath },
      { icon: Briefcase, label: "Jobs", path: basePath },
      { icon: MessageSquare, label: "Messages", path: "/messages" },
      { icon: Bell, label: "Alerts", path: basePath },
      { icon: User, label: "Profile", path: settingsPath },
    ];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
