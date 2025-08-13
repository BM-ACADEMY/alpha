import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { showToast } from "@/modules/common/toast/customToast";
import axiosInstance from "../../lib/axios";

function VerifyEmail() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("users/verify-email", {
        email: state?.email,
        otp,
      });

      showToast(
        response.data.message || "Your email has been successfully verified.",
        "success"
      );

      if (state?.from === "forgot-password") {
        navigate("/reset-password", { state: { email: state?.email } });
      } else {
        navigate("/user-login");
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Verification failed",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#0F1C3F] to-[#7BA6CC] px-4">
      <Card className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-gray-800 text-lg">Verify Email</CardTitle>
            <CardDescription className="text-gray-600">
              Enter the OTP sent to <b>{state?.email || "your email"}</b>.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* OTP Input */}
            <div className="space-y-1">
              <Label>OTP</Label>
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
              />
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              className="w-full flex items-center gap-2 bg-[#0F1C3F] text-white hover:bg-[#0066CC]"
            >
              <Mail className="w-5 h-5" />
              Verify
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export default VerifyEmail;
