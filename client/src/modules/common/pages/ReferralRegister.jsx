import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ useLocation for query params
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { showToast } from "@/modules/common/toast/customToast";
import logo from "@/assets/images/file.png";
import bg from "@/assets/images/bg.jpg";
import axiosInstance from "../lib/axios";

const ReferalRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const referralCode = queryParams.get("ref") || ""; // ✅ get ?ref=...

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    referral_code: referralCode, // ✅ auto-fill
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password is required";
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await axiosInstance.post("users/register", formData);
      showToast("success", response.data.message);
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (error) {
      showToast("error", error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F4F6F8] overflow-hidden">
      {/* Wave Background */}
      <div
        className="absolute top-0 left-0 w-full h-[300px] z-0"
        style={{
          background: "linear-gradient(120deg, #0F1C3F, #7BA6CC)",
          clipPath: "ellipse(80% 100% at 50% 0%)",
        }}
      />

      {/* Logo */}
      <div className="absolute top-5 left-8 z-10">
        <img src={logo} alt="Alpha R Logo" className="h-14" />
      </div>
      {/* Main Layout */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center min-h-screen px-6">
        {/* Left Illustration */}
        <div className="hidden md:block flex-1">
          <img src={bg} alt="Register Illustration" className="mx-auto w-3/4 object-contain" />
        </div>
        {/* Form */}

        <Card className="bg-white max-w-sm w-full flex-1 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5 p-8">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-[#0F1C3F] text-xl">Create Your Account</CardTitle>
              <CardDescription className="text-gray-500">
                Enter details to register your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Username */}
              <div>
                <Label className="mb-2">Username</Label>
                <Input
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <Label className="mb-2">Email</Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <Label className="mb-2">Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
                {errors.phone_number && <p className="text-xs text-red-500">{errors.phone_number}</p>}
              </div>

              {/* Password */}
              <div className="mb-2">
                <Label className="mb-2">Password</Label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <Label className="mb-2">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              {/* Referral Code */}
              {referralCode && (
                <div>
                  <Label className="mb-2">Referral Code</Label>
                  <Input value={formData.referral_code} readOnly className="bg-gray-100 cursor-not-allowed" />
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-[#0F1C3F] text-white hover:bg-[#0066CC]"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default ReferalRegister;
