import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { showToast } from "@/modules/common/toast/customToast";
import { User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/images/file.png";
import bg from "@/assets/images/bg.jpg";
import axiosInstance from "../lib/axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TermsAndConditions from "@/modules/Homepage/Terms"; // Import the TermsAndConditions component


const ReferalRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const referralCode = queryParams.get("ref") || "";

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    referral_code: referralCode,
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [hasReadTerms, setHasReadTerms] = useState(false);

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone_number.trim())
      newErrors.phone_number = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm password is required";
    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
      showToast("error", "Passwords do not match");
    }
    if (!formData.agreeTerms)
      newErrors.agreeTerms = "You must agree to the Terms & Conditions";
    if (!hasReadTerms)
      newErrors.agreeTerms = "You must read the Terms & Conditions before agreeing";

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

  const getInputProps = (field, type = "text") => ({
    type,
    placeholder:
      errors[field] ||
      field.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: formData[field],
    onChange: (e) => setFormData({ ...formData, [field]: e.target.value }),
    className: `bg-transparent text-gray-700 outline-none text-sm w-full h-full px-2 ${
      errors[field]
        ? "placeholder-red-500 border-red-500"
        : "placeholder-gray-500"
    }`,
  });

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
        <h1 className="text-gray-100 text-3xl font-semibold">Create Account</h1>
        <p className="text-gray-200 text-sm mt-2">
          Enter your details to register
        </p>

        {/* Username */}
        <div className="flex items-center mt-6 w-full bg-white border h-12 rounded-full overflow-hidden pl-4 gap-2">
          <User className="w-5 h-5 text-gray-500" />
          <input {...getInputProps("username")} />
        </div>
        {errors.username && (
          <p className="text-xs text-red-500 mt-1 text-left">{errors.username}</p>
        )}

        {/* Email */}
        <div className="flex items-center mt-4 w-full bg-white border h-12 rounded-full overflow-hidden pl-4 gap-2">
          <Mail className="w-5 h-5 text-gray-500" />
          <input {...getInputProps("email", "email")} />
        </div>
        {errors.email && (
          <p className="text-xs text-red-500 mt-1 text-left">{errors.email}</p>
        )}

        {/* Phone */}
        <div className="flex items-center mt-4 w-full bg-white border h-12 rounded-full overflow-hidden pl-4 gap-2">
          <Phone className="w-5 h-5 text-gray-500" />
          <input {...getInputProps("phone_number", "tel")} />
        </div>
        {errors.phone_number && (
          <p className="text-xs text-red-500 mt-1 text-left">{errors.phone_number}</p>
        )}

        {/* Password */}
        <div className="flex items-center mt-4 w-full bg-white border h-12 rounded-full overflow-hidden pl-4 pr-4 gap-2">
          <Lock className="w-5 h-5 text-gray-500" />
          <input
            {...getInputProps("password", showPassword ? "text" : "password")}
            onChange={(e) => {
              const val = e.target.value;
              setFormData({ ...formData, password: val });
              setPasswordStrength(checkPasswordStrength(val));
            }}
          />
          <button
            type="button"
            className="cursor-pointer text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-1 text-left">{errors.password}</p>
        )}

        {/* Password Strength */}
        {formData.password && (
          <div className="mt-2 px-4 w-full">
            <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
              <div
                className={`h-2 ${passwordStrength.color} transition-all duration-300`}
                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
              />
            </div>
            <p
              className={`text-xs mt-1 text-left ${passwordStrength.color.replace(
                "bg-",
                "text-"
              )}`}
            >
              {passwordStrength.label}
            </p>
          </div>
        )}

        {/* Confirm Password */}
        <div className="flex items-center mt-4 w-full bg-white border h-12 rounded-full overflow-hidden pl-4 pr-4 gap-2">
          <Lock className="w-5 h-5 text-gray-500" />
          <input
            {...getInputProps(
              "confirmPassword",
              showConfirmPassword ? "text" : "password"
            )}
          />
          <button
            type="button"
            className="cursor-pointer text-gray-500"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1 text-left">{errors.confirmPassword}</p>
        )}

        {/* Referral Code */}
        <div className="flex items-center mt-4 w-full bg-white border h-12 rounded-full overflow-hidden pl-4 gap-2">
          <User className="w-5 h-5 text-gray-500" />
          <input {...getInputProps("referral_code")} />
        </div>

        {/* Terms */}
 <div className="mt-6 flex flex-col items-start w-full">
           
           <label className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer mt-2">
             <input
               type="checkbox"
               checked={formData.agreeTerms}
               disabled={!hasReadTerms} // Disable checkbox until terms are read
               onChange={(e) => {
                 if (!hasReadTerms) {
                   showToast("error", "Please read the Terms & Conditions first");
                   return;
                 }
                 setFormData({ ...formData, agreeTerms: e.target.checked });
               }}
               className={`w-4 h-4 accent-[#7e9cba] ${!hasReadTerms ? 'opacity-50 cursor-not-allowed' : ''}`}
             />
             I agree to the <Dialog
             onOpenChange={(open) => {
               if (!open) setHasReadTerms(true); // Mark terms as read when modal is closed
             }}
           >
             <DialogTrigger asChild>
               <span className="text-gray-200 underline hover:text-gray-300 cursor-pointer">
                 Terms & Conditions
               </span>
             </DialogTrigger>
             <DialogContent className="max-h-[80vh] overflow-y-auto">
               <DialogHeader>
                 <DialogTitle>Terms & Conditions</DialogTitle>
               </DialogHeader>
               <TermsAndConditions />
             </DialogContent>
           </Dialog>
           </label>
           {errors.agreeTerms && (
             <p className="text-xs text-red-500 mt-1">{errors.agreeTerms}</p>
           )}
         </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full h-12 rounded-full text-white bg-[#0F1C3F] hover:bg-[#1A2B5C] transition-colors shadow-md hover:shadow-lg font-medium disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
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
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                />
              </svg>
              <span>Registering...</span>
            </div>
          ) : (
            "Register"
          )}
        </button>

        {/* Login Link */}
        <p className="text-gray-200 text-sm mt-4">
          Already have an account?{" "}
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
};

export default ReferalRegister;