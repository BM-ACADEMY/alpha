import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import logo from "@/assets/images/alphalogo.png";
import bg from "@/assets/images/bg.jpg";
import axiosInstance from "../../lib/axios";
import { showToast } from "@/modules/common/toast/customToast";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.post("users/forgot-password", {
        email,
      });
      showToast(
        "success",
        response?.data?.message || "OTP sent successfully to your email"
      );
      navigate("/verify-otp", {
        state: { email, from: "forgot-password" },
      });
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to send OTP. Please try again"
      );
    }
    setLoading(false);
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Logo */}
      <div className="absolute top-5 left-8 z-20 flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-[50px]" />
        <span className="text-[#7f9ebb] text-xl font-bold">ALPHA R</span>
      </div>

      {/* Forgot Password Form */}
      <form
        onSubmit={handleSubmit}
        className="relative z-20 w-full max-w-md text-center 
                   border border-white/20 
                   rounded-2xl px-8 py-10 
                   bg-white/10 backdrop-blur-xl 
                   shadow-lg hover:shadow-xl 
                   transition-shadow duration-300"
      >
        <h1 className="text-gray-100 text-3xl font-semibold">
          Forgot Password
        </h1>
        <p className="border-l-4 border-yellow-400 bg-gray-900 text-white text-sm font-medium pl-4 mt-2">
          Enter your email to receive an OTP to your registered email. Please check your spam folder if not received.
        </p>


        {/* Email Input */}
        <div className="flex items-center w-full mt-8 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <MailCheck className="w-5 h-5 text-gray-500" />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-full"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full h-11 rounded-full text-white bg-[#0f1c3f] hover:bg-[#0e1a3bd5] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            "Send OTP"
          )}
        </button>

        {/* Back to Login */}
        <p className="text-gray-200 text-sm mt-4">
          Remembered your password?{" "}
          <span
            onClick={() => navigate("/user-login")}
            className="text-gray-200 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;
