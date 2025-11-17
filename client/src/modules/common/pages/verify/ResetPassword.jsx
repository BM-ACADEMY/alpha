import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { showToast } from "@/modules/common/toast/customToast";
import axiosInstance from "../../lib/axios";
import logo from "@/assets/images/alphalogo.png";
import bg from "@/assets/images/bg.jpg";

function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });

  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^A-Za-z0-9]/)) score++;

    let label = "";
    let color = "";
    switch (score) {
      case 0:
      case 1:
        label = "Weak";
        color = "bg-red-500";
        break;
      case 2:
        label = "Fair";
        color = "bg-yellow-500";
        break;
      case 3:
        label = "Good";
        color = "bg-blue-500";
        break;
      case 4:
        label = "Strong";
        color = "bg-green-500";
        break;
      default:
        label = "";
        color = "";
    }

    return { score, label, color };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!state?.email || state?.from !== "verify-otp") {
      showToast("error", "Invalid access. Please verify OTP first.");
      navigate("/forgot-password");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post("users/reset-password", {
        email: state?.email,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      showToast("success", response?.data?.message || "Password reset successful.");
      navigate("/user-login");
    } catch (error) {
      showToast("error", error.response?.data?.message || "Password reset failed.");
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
        <h1 className="text-gray-100 text-3xl font-semibold">Reset Password</h1>
        <p className="text-gray-200 text-sm mt-2">
          Set your new password
        </p>
        <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 pr-4 gap-2">
          <Lock className="w-5 h-5 text-gray-500" />
          <input
            type={showPassword ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) => {
              const val = e.target.value;
              setFormData({ ...formData, newPassword: val });
              setPasswordStrength(checkPasswordStrength(val));
            }}
            placeholder="Enter new password"
            className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-full"
            required
          />
          <span
            className="cursor-pointer text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </span>
        </div>
        {formData.newPassword && (
          <div className="mt-2 px-4 w-full">
            <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
              <div
                className={`h-2 ${passwordStrength.color} transition-all`}
                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
              />
            </div>
            <p
              className={`text-xs mt-1 text-left ${
                passwordStrength.color.replace("bg-", "text-")
              }`}
            >
              {passwordStrength.label}
            </p>
          </div>
        )}
        <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 pr-4 gap-2">
          <LockKeyhole className="w-5 h-5 text-gray-500" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            placeholder="Confirm new password"
            className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-full"
            required
          />
          <span
            className="cursor-pointer text-gray-500"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </span>
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
            <>
              <Lock className="w-5 h-5" />
              Reset Password
            </>
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

export default ResetPassword;