import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { showToast } from "@/modules/common/toast/customToast";
import axiosInstance from "../../lib/axios";

function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("users/reset-password", {
        email: state?.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      showToast(response.data.message, "success");
      navigate("/user-login");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Password reset failed",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-cyan-500 to-indigo-600 px-4">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-gray-800 text-lg">Reset Password</CardTitle>
            <CardDescription className="text-gray-600">
              Enter the OTP and your new password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* OTP Field */}
            <div className="space-y-1">
              <Label>OTP</Label>
              <Input
                type="text"
                value={formData.otp}
                onChange={(e) =>
                  setFormData({ ...formData, otp: e.target.value })
                }
                placeholder="Enter 6-digit OTP"
                required
              />
            </div>

            {/* New Password Field */}
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                placeholder="Enter new password"
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirm new password"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex items-center gap-2 bg-[#0F1C3F] text-white hover:bg-[#0066CC]"
            >
              <Lock className="w-5 h-5" />
              Reset Password
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export default ResetPassword;
