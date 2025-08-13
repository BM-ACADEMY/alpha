import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { User, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0F1C3F] to-[#5B9BD5]">
      {/* Wave Background */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg
          viewBox="0 0 1440 320"
          className="w-full"
          preserveAspectRatio="none"
          style={{ height: "200px" }}
        >
          <path
            fill="#F4F6F8"
            fillOpacity="1"
            d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,213.3C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      {/* Card Container */}
      <Card className="relative z-10 bg-[#F4F6F8] p-6 rounded-xl shadow-2xl max-w-lg w-full mx-4">
        <CardHeader>
          <CardTitle className="text-center text-4xl font-extrabold bg-gradient-to-r from-[#5B9BD5] to-[#0F1C3F] bg-clip-text text-transparent">
            Welcome to Your Dashboard
          </CardTitle>
          <CardDescription className="text-center text-gray-700">
            Choose your role to log in and access your personalized dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={() => navigate("/user-login")}
            className="w-full flex items-center gap-2 bg-[#5B9BD5] text-white hover:bg-[#0066CC] hover:shadow-lg transition"
          >
            <User className="w-5 h-5" />
            Login as User
          </Button>

          <Button
            onClick={() => navigate("/admin-login")}
            className="w-full flex items-center gap-2 bg-[#0F1C3F] text-white hover:bg-[#0066CC] hover:shadow-lg transition"
          >
            <Shield className="w-5 h-5" />
            Login as Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default LandingPage;
