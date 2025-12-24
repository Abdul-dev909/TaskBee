import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";

import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import BecomeProvider from "@/pages/BecomeProvider";
import ProviderSuccess from "@/pages/ProviderSuccess";
import HomeownerDashboard from "@/pages/HomeownerDashboard";
import ProviderDashboard from "@/pages/ProviderDashboard";
import ProviderSettings from "@/pages/ProviderSettings";
import HomeownerSettings from "@/pages/HomeownerSettings";
import JobDetails from "@/pages/JobDetails";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminJobs from "@/pages/AdminJobs";
import AdminCategories from "@/pages/AdminCategories";
import AdminComplaints from "@/pages/AdminComplaints";
import AdminPayments from "@/pages/AdminPayments";
import AdminKycVerification from "@/pages/AdminKycVerification";
import FileComplaint from "@/pages/FileComplaint";
import ProviderComplaints from "@/pages/ProviderComplaints";
import Chat from "@/pages/Chat";
import Messages from "@/pages/Messages";
import Payment from "@/pages/Payment";
import PaymentHistory from "@/pages/PaymentHistory";
import ProviderWallet from "@/pages/ProviderWallet";
import ProviderVerify from "@/pages/ProviderVerify";
import ProviderProfile from "@/pages/ProviderProfile";
import NotFound from "@/pages/NotFound";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/become-provider" element={<PageTransition><BecomeProvider /></PageTransition>} />
        <Route path="/provider-success" element={<PageTransition><ProviderSuccess /></PageTransition>} />
        <Route path="/homeowner-dashboard" element={<PageTransition><HomeownerDashboard /></PageTransition>} />
        <Route path="/provider-dashboard" element={<PageTransition><ProviderDashboard /></PageTransition>} />
        <Route path="/provider-settings" element={<PageTransition><ProviderSettings /></PageTransition>} />
        <Route path="/homeowner-settings" element={<PageTransition><HomeownerSettings /></PageTransition>} />
        <Route path="/job/:jobId" element={<PageTransition><JobDetails /></PageTransition>} />
        <Route path="/admin/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
        <Route path="/admin/users" element={<PageTransition><AdminUsers /></PageTransition>} />
        <Route path="/admin/jobs" element={<PageTransition><AdminJobs /></PageTransition>} />
        <Route path="/admin/categories" element={<PageTransition><AdminCategories /></PageTransition>} />
        <Route path="/admin/complaints" element={<PageTransition><AdminComplaints /></PageTransition>} />
        <Route path="/admin/payments" element={<PageTransition><AdminPayments /></PageTransition>} />
        <Route path="/admin/kyc-verification" element={<PageTransition><AdminKycVerification /></PageTransition>} />
        <Route path="/complaints/new" element={<PageTransition><FileComplaint /></PageTransition>} />
        <Route path="/provider/complaints" element={<PageTransition><ProviderComplaints /></PageTransition>} />
        <Route path="/provider/wallet" element={<PageTransition><ProviderWallet /></PageTransition>} />
        <Route path="/provider/verify" element={<PageTransition><ProviderVerify /></PageTransition>} />
        <Route path="/provider/:providerId" element={<PageTransition><ProviderProfile /></PageTransition>} />
        <Route path="/chat" element={<PageTransition><Chat /></PageTransition>} />
        <Route path="/messages" element={<PageTransition><Messages /></PageTransition>} />
        <Route path="/payment" element={<PageTransition><Payment /></PageTransition>} />
        <Route path="/payment-history" element={<PageTransition><PaymentHistory /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
