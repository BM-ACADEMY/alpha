import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import logo from "@/assets/images/file.png";
import bg from "@/assets/images/bg.jpg";
import { AuthContext } from "../context/AuthContext";

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
    if (!credentials.password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(credentials, false);
      setLoading(false);
    } catch (error) {
      console.log(error);

    }
  };
  return (
    <div className="relative min-h-screen bg-gray-100 overflow-hidden">
      {/* Wave Background */}
      <div
        className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-r from-[#0F1C3F] to-[#7BA6CC]"
        style={{ clipPath: "ellipse(80% 100% at 50% 0%)" }}
      />

      {/* Logo */}
      <div className="absolute top-5 left-8 z-10">
        <img src={logo} alt="Logo" className="h-[60px]" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center min-h-screen px-6">
        {/* Left Illustration */}
        <div className="hidden md:block flex-1">
          <img src={bg} alt="Login Illustration" className="w-[70%] h-[70%] object-contain mx-auto" />
        </div>

        {/* Login Card */}
        <Card className="max-w-sm w-full flex-1 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-[#0F1C3F]">Welcome to Alpha R</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !credentials.email || !credentials.password}
                className="bg-[#0F1C3F] hover:bg-[#0066CC] text-lg flex gap-2"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                         5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 
                         5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    Login
                  </>
                )}
              </Button>

              {/* Links */}
              <div className="flex justify-between text-sm pt-2">
                <span
                  onClick={() => navigate("/forgot-password")}
                  className="text-[#0F1C3F] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </span>
                <span
                  onClick={() => navigate("/register")}
                  className="text-[#0F1C3F] hover:underline cursor-pointer"
                >
                  Register
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UserLogin;
