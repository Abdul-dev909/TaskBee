import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import AuthLayout from "@/components/AuthLayout";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [successMessage, setSuccessMessage] = useState("");

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (validateForm()) {
      setSuccessMessage("Login Successful! Welcome back.");
      // Here you would typically handle actual login
      console.log("Login attempt:", { email, rememberMe });
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Welcome Back
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-elegant"
            />
            {errors.email && (
              <p className="error-text">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-elegant"
            />
            {errors.password && (
              <p className="error-text">{errors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Remember me
              </Label>
            </div>
            <Link 
              to="/forgot-password" 
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="success-message animate-fade-in">
              {successMessage}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full btn-glow"
            size="lg"
          >
            Sign In
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              to="/signup" 
              className="text-primary font-medium hover:underline"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
