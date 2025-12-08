import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AIChatWidget from "@/components/AIChatWidget";
import BottomNavigation from "@/components/BottomNavigation";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BecomeProvider from "./pages/BecomeProvider";
import ProviderSuccess from "./pages/ProviderSuccess";
import HomeownerDashboard from "./pages/HomeownerDashboard";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderSettings from "./pages/ProviderSettings";
import HomeownerSettings from "./pages/HomeownerSettings";
import JobDetails from "./pages/JobDetails";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminJobs from "./pages/AdminJobs";
import AdminCategories from "./pages/AdminCategories";
import AdminComplaints from "./pages/AdminComplaints";
import AdminPayments from "./pages/AdminPayments";
import AdminKycVerification from "./pages/AdminKycVerification";
import FileComplaint from "./pages/FileComplaint";
import ProviderComplaints from "./pages/ProviderComplaints";
import Chat from "./pages/Chat";
import Messages from "./pages/Messages";
import Payment from "./pages/Payment";
import PaymentHistory from "./pages/PaymentHistory";
import ProviderWallet from "./pages/ProviderWallet";
import ProviderVerify from "./pages/ProviderVerify";
import ProviderProfile from "./pages/ProviderProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AIChatWidget />
        <div className="pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/become-provider" element={<BecomeProvider />} />
            <Route path="/provider-success" element={<ProviderSuccess />} />
            <Route path="/homeowner-dashboard" element={<HomeownerDashboard />} />
            <Route path="/provider-dashboard" element={<ProviderDashboard />} />
            <Route path="/provider-settings" element={<ProviderSettings />} />
            <Route path="/homeowner-settings" element={<HomeownerSettings />} />
            <Route path="/job/:jobId" element={<JobDetails />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/jobs" element={<AdminJobs />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/kyc-verification" element={<AdminKycVerification />} />
            <Route path="/complaints/new" element={<FileComplaint />} />
            <Route path="/provider/complaints" element={<ProviderComplaints />} />
            <Route path="/provider/wallet" element={<ProviderWallet />} />
            <Route path="/provider/verify" element={<ProviderVerify />} />
            <Route path="/provider/:providerId" element={<ProviderProfile />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <BottomNavigation />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
