import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { Fragment } from "react";

interface BreadcrumbRoute {
  label: string;
  path: string;
}

const routeMap: Record<string, BreadcrumbRoute[]> = {
  "/homeowner-dashboard": [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/homeowner-dashboard" },
  ],
  "/homeowner-settings": [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/homeowner-dashboard" },
    { label: "Settings", path: "/homeowner-settings" },
  ],
  "/payment": [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/homeowner-dashboard" },
    { label: "Payment", path: "/payment" },
  ],
  "/payment-history": [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/homeowner-dashboard" },
    { label: "Payment History", path: "/payment-history" },
  ],
  "/provider-dashboard": [
    { label: "Home", path: "/" },
    { label: "Provider Dashboard", path: "/provider-dashboard" },
  ],
  "/provider-settings": [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/provider-dashboard" },
    { label: "Settings", path: "/provider-settings" },
  ],
  "/provider/wallet": [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/provider-dashboard" },
    { label: "Wallet", path: "/provider/wallet" },
  ],
  "/provider/verify": [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/provider-dashboard" },
    { label: "KYC Verification", path: "/provider/verify" },
  ],
  "/provider/complaints": [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/provider-dashboard" },
    { label: "Complaints", path: "/provider/complaints" },
  ],
  "/chat": [
    { label: "Home", path: "/" },
    { label: "Messages", path: "/chat" },
  ],
  "/complaints/new": [
    { label: "Home", path: "/" },
    { label: "File Complaint", path: "/complaints/new" },
  ],
  "/admin/dashboard": [
    { label: "Admin", path: "/admin/dashboard" },
    { label: "Dashboard", path: "/admin/dashboard" },
  ],
  "/admin/users": [
    { label: "Admin", path: "/admin/dashboard" },
    { label: "Users", path: "/admin/users" },
  ],
  "/admin/jobs": [
    { label: "Admin", path: "/admin/dashboard" },
    { label: "Jobs", path: "/admin/jobs" },
  ],
  "/admin/categories": [
    { label: "Admin", path: "/admin/dashboard" },
    { label: "Categories", path: "/admin/categories" },
  ],
  "/admin/complaints": [
    { label: "Admin", path: "/admin/dashboard" },
    { label: "Complaints", path: "/admin/complaints" },
  ],
  "/admin/payments": [
    { label: "Admin", path: "/admin/dashboard" },
    { label: "Payments", path: "/admin/payments" },
  ],
  "/admin/kyc-verification": [
    { label: "Admin", path: "/admin/dashboard" },
    { label: "KYC Verification", path: "/admin/kyc-verification" },
  ],
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Handle dynamic routes like /job/:jobId
  let breadcrumbs: BreadcrumbRoute[] = routeMap[pathname] || [];

  if (pathname.startsWith("/job/")) {
    breadcrumbs = [
      { label: "Home", path: "/" },
      { label: "Dashboard", path: "/provider-dashboard" },
      { label: "Job Details", path: pathname },
    ];
  }

  // Don't show breadcrumbs on home, login, signup pages
  const hiddenPaths = ["/", "/login", "/signup", "/become-provider", "/provider-success"];
  if (hiddenPaths.includes(pathname) || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <Fragment key={crumb.path}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.path} className="flex items-center gap-1">
                      {isFirst && <Home className="w-3.5 h-3.5" />}
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
