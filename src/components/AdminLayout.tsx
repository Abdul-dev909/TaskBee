import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, Grid, LayoutDashboard, LogOut, AlertCircle, DollarSign, Sun, Moon, Shield, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import genieLamp from "@/assets/home-genie-logo.png";
import { NotificationBell } from "@/components/NotificationBell";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [adminName, setAdminName] = useState("");
  const [adminId, setAdminId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/login");
      return;
    }

    // Check if user is admin
    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (error || roleData?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    // Get admin email
    setAdminName(session.user.email || "Admin");
    setAdminId(session.user.id);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Manage Users", path: "/admin/users" },
    { icon: Briefcase, label: "Manage Jobs", path: "/admin/jobs" },
    { icon: Grid, label: "Manage Categories", path: "/admin/categories" },
    { icon: Shield, label: "KYC Verification", path: "/admin/kyc-verification" },
    { icon: AlertCircle, label: "Manage Complaints", path: "/admin/complaints" },
    { icon: DollarSign, label: "Payments", path: "/admin/payments" },
    { icon: Archive, label: "Archived Data", path: "/admin/archived" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 glass-card border-r border-border/50 flex flex-col">
        {/* Brand Header */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src={genieLamp} alt="TaskBee" className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl rounded-2xl bg-gradient-to-br from-background to-accent/10 p-2 border-2 border-primary/20 group-hover:border-primary/40" />
              <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-2xl" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary">TaskBee</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Admin Info & Logout */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="glass-card p-4 rounded-lg">
            <p className="text-sm font-medium text-foreground mb-1">Logged in as</p>
            <p className="text-xs text-muted-foreground mb-3 truncate">{adminName}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex-1"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
