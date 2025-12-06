import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Briefcase, 
  Search, 
  Receipt, 
  Wallet, 
  Shield, 
  FileText,
  MessageSquare
} from "lucide-react";

interface QuickAction {
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant?: "default" | "primary" | "secondary";
}

interface QuickActionsProps {
  role: "homeowner" | "provider";
  onTabChange?: (tab: string) => void;
  isKycVerified?: boolean;
}

const QuickActions = ({ role, onTabChange, isKycVerified = true }: QuickActionsProps) => {
  const navigate = useNavigate();

  const homeownerActions: QuickAction[] = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: "Post a Job",
      description: "Create a new job posting",
      onClick: () => onTabChange?.("post-job"),
      variant: "primary",
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      label: "My Jobs",
      description: "View your posted jobs",
      onClick: () => onTabChange?.("my-jobs"),
    },
    {
      icon: <Search className="w-5 h-5" />,
      label: "Find Providers",
      description: "Browse service providers",
      onClick: () => onTabChange?.("overview"),
    },
    {
      icon: <Receipt className="w-5 h-5" />,
      label: "Payments",
      description: "View payment history",
      onClick: () => navigate("/payment-history"),
    },
  ];

  const providerActions: QuickAction[] = [
    {
      icon: <Search className="w-5 h-5" />,
      label: "Browse Jobs",
      description: "Find available jobs",
      onClick: () => onTabChange?.("browse"),
      variant: "primary",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "My Offers",
      description: "View submitted offers",
      onClick: () => onTabChange?.("applications"),
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      label: "My Wallet",
      description: "Check your earnings",
      onClick: () => navigate("/provider/wallet"),
    },
    !isKycVerified ? {
      icon: <Shield className="w-5 h-5" />,
      label: "Complete KYC",
      description: "Verify your identity",
      onClick: () => navigate("/provider/verify"),
      variant: "secondary" as const,
    } : {
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Messages",
      description: "Chat with clients",
      onClick: () => navigate("/chat"),
    },
  ];

  const actions = role === "homeowner" ? homeownerActions : providerActions;

  return (
    <Card className="glass-card mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant={action.variant === "primary" ? "default" : "outline"}
                className={`w-full h-auto flex flex-col items-center gap-2 py-4 px-3 hover-scale ${
                  action.variant === "primary" 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 btn-glow" 
                    : action.variant === "secondary"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                    : ""
                }`}
                onClick={action.onClick}
              >
                <div className={`p-2 rounded-lg ${
                  action.variant === "primary" 
                    ? "bg-primary-foreground/20" 
                    : action.variant === "secondary"
                    ? "bg-amber-500/20"
                    : "bg-primary/10"
                }`}>
                  {action.icon}
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-[10px] opacity-70 hidden sm:block">{action.description}</p>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
