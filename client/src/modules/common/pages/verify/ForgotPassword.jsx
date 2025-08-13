import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { showToast } from "@/modules/common/toast/customToast";
import axiosInstance from "../../lib/axios";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("users/forgot-password", { email });

      showToast(response.data.message, "success");
      navigate("/verify-email", { state: { email, from: "forgot-password" } });
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to send OTP", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-cyan-500 to-indigo-600 px-4">
      <Card className="w-full max-w-md bg-white p-6 rounded-lg shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-gray-800 text-lg">Forgot Password</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your email to receive a password reset OTP.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex items-center gap-2 bg-[#0F1C3F] text-white hover:bg-[#0066CC]"
            >
              <MailCheck className="w-5 h-5" />
              Send OTP
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export default ForgotPassword;
