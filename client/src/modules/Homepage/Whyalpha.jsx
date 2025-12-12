import {
  ShieldCheck,
  RefreshCw,
  UserCheck,
  BarChart4,
  Lock,
  Users
} from "lucide-react";
import BgImage from "@/assets/images/whyalpha.jpeg"; // <- your background image

const WhyAlphaR = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-500 group-hover:text-blue-600 transition-colors duration-300" />,
      title: "Transparent Investment",
      description: "Crystal-clear process you can trust."
    },
    {
      icon: <RefreshCw className="w-8 h-8 text-green-500 group-hover:text-green-600 transition-colors duration-300" />,
      title: "Dual Currency Support",
      description: "Seamless INR + Crypto transactions."
    },
    {
      icon: <UserCheck className="w-8 h-8 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-300" />,
      title: "Verified & Secure Accounts",
      description: "PAN, Aadhaar & Bank details for safety."
    },
    {
      icon: <BarChart4 className="w-8 h-8 text-orange-500 group-hover:text-orange-600 transition-colors duration-300" />,
      title: "Daily Tracking & Earnings",
      description: "Real-time updates + referral rewards."
    },
    {
      icon: <Lock className="w-8 h-8 text-red-500 group-hover:text-red-600 transition-colors duration-300" />,
      title: "Safe & User-Friendly",
      description: "Modern, intuitive design you’ll love."
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500 group-hover:text-purple-600 transition-colors duration-300" />,
      title: "Professional Support Team",
      description: "Always here to guide and assist you."
    }
  ];

  return (
    <section id="whyalpha" className="relative py-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src={BgImage}
          alt="Alpha R Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0f1c3f]/70"></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-center text-white mb-6">
          Why Alpha R?
        </h2>

        <p className="text-center text-gray-200 mb-14 max-w-2xl mx-auto">
          At Alpha R, we don’t just offer plans — we build{" "}
          <span className="font-semibold text-[#d29e45]">trust, security, and financial growth</span>.
          Together, let’s step into the future of smart investments.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features?.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg p-6
                         hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>


            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyAlphaR;
