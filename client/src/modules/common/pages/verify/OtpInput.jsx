import { useState,useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { KeyRound } from "lucide-react";
import logo from "@/assets/images/alphalogo.png";
import bg from "@/assets/images/bg.jpg";
import axiosInstance from "../../lib/axios";
import { showToast } from "@/modules/common/toast/customToast";

// Custom OTP Input Component (Reused from ResetPassword)
const OtpInput = ({ value, onChange }) => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputsRef = useRef([]);

  const handleChange = (index, val) => {
    if (!/^[0-9]?$/.test(val)) return; // Allow only digits
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    onChange(newOtp.join(""));

    if (val && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = Array(6).fill("");
    paste.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    onChange(newOtp.join(""));
    inputsRef.current[Math.min(paste.length, 5)].focus();
  };

  return (
    <div className="flex gap-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          maxLength="1"
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center bg-white border border-gray-300/80 rounded-lg text-gray-700 outline-none text-lg font-medium"
          required
        />
      ))}
    </div>
  );
};

function VerifyOtp() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.post("users/verify-otp", {
        email: state?.email,
        otp,
      });
      showToast(
        "success",
        response?.data?.message || "OTP verified successfully"
      );
      navigate("/reset-password", {
        state: { email: state?.email, from: "verify-otp" },
      });
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Invalid OTP. Please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute top-5 left-8 z-20 flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-[50px]" />
        <span className="text-[#7f9ebb] text-xl font-bold">ALPHA R</span>
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative z-20 w-full max-w-md text-center border border-white/20 rounded-2xl px-8 py-10 bg-white/10 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        <h1 className="text-gray-100 text-3xl font-semibold">Verify OTP</h1>
        <p className="text-gray-200 text-sm mt-2">
          Enter the OTP sent to your registered email
        </p>
        <div className="flex items-center w-full mt-8 gap-2">
          <KeyRound className="w-5 h-5 text-gray-200" />
          <OtpInput value={otp} onChange={setOtp} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full h-11 rounded-full text-white bg-[#0f1c3f] hover:bg-[#0e1a3bd5] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
            "Verify OTP"
          )}
        </button>
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

export default VerifyOtp;