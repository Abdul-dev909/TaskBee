import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthLayout from "@/components/AuthLayout";

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  role?: string;
}

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.role) {
      newErrors.role = "Please select your role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (validateForm()) {
      setSuccessMessage("Account created successfully! Welcome to Home Genie.");
      console.log("Signup data:", formData);
      // Here you would typically handle actual signup
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Create Your Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Join Home Genie and get started today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className="input-elegant"
            />
            {errors.fullName && (
              <p className="error-text">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="input-elegant"
            />
            {errors.email && (
              <p className="error-text">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="input-elegant"
            />
            {errors.phone && (
              <p className="error-text">{errors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="input-elegant"
            />
            {errors.password && (
              <p className="error-text">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className="input-elegant"
            />
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">
              I am a
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleInputChange("role", value)}
            >
              <SelectTrigger className="input-elegant">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homeowner">Homeowner</SelectItem>
                <SelectItem value="service-provider">Service Provider</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="error-text">{errors.role}</p>
            )}
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
            className="w-full btn-glow mt-6"
            size="lg"
          >
            Create Account
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-primary font-medium hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;
