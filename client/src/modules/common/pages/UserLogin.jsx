import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import logo from "@/assets/images/alphalogo.png";
import bg from "@/assets/images/bg.jpg";

function UserLogin() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    access: "user",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!credentials.email.trim()) newErrors.email = "Email is required";
    if (!credentials.password.trim())
      newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;
  setLoading(true);
  try {
    await login(credentials, false);
  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false); // always reset
  }
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

      {/* Login Form */}
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
          Welcome to Alpha R
        </h1>
        <p className="text-gray-200 text-sm mt-2">
          Enter your credentials to access the dashboard
        </p>

        {/* Email */}
        <div className="flex items-center w-full mt-8 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <svg
            width="16"
            height="11"
            viewBox="0 0 16 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z"
              fill="#6B7280"
            />
          </svg>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email id"
            value={credentials.email}
            onChange={(e) =>
              setCredentials({ ...credentials, email: e.target.value })
            }
            className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-full"
            required
          />
        </div>
        {errors.email && (
          <p className="text-red-500 text-xs text-left mt-1">{errors.email}</p>
        )}

        {/* Password */}
        <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <svg
            width="13"
            height="17"
            viewBox="0 0 13 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 
              8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 
              0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 
              0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 
              2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z"
              fill="#6B7280"
            />
          </svg>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials({ ...credentials, password: e.target.value })
            }
            className="bg-transparent text-gray-700 placeholder-gray-500 outline-none text-sm w-full h-full"
            required
          />
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs text-left mt-1">
            {errors.password}
          </p>
        )}

        {/* Forgot Password */}
        <div className="mt-3 text-left">
          <span
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-gray-200 hover:underline cursor-pointer"
          >
            Forgot password?
          </span>
        </div>

        {/* Submit */}
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
                d="M4 12a8 8 0 018-8V0C5.373 
                0 0 5.373 0 12h4zm2 5.291A7.962 
                7.962 0 014 12H0c0 3.042 1.135 
                5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            "Login"
          )}
        </button>

        {/* Register link */}
        {/* Register link */}
        <p className="text-gray-200 text-sm mt-4">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-grey-200 cursor-pointer hover:underline"
          >
            Register
          </span>
        </p>

        {/* Support link */}
        <p className="text-gray-300 text-xs mt-2">
          Need help?{" "}
          <a
            href="mailto:alphareturns2025@gmail.com"
            className="text-[#82b6e7] hover:underline"
          >
            Contact Support
          </a>
        </p>
      </form>
    </div>
  );
}

export default UserLogin;
