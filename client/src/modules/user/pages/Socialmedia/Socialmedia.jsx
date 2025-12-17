import React, { useState, useEffect } from "react";
import { MessageCircle, Instagram, Send, Users } from "lucide-react"; // Added Users icon
import axiosInstance from "@/modules/common/lib/axios";
import { showToast } from "@/modules/common/toast/customToast";

const Socialmedia = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration for standard fixed platforms
  const platformConfig = {
    whatsapp: {
      name: "WhatsApp",
      icon: <MessageCircle className="w-8 h-8 text-green-600" />,
      description: "Chat with us on WhatsApp",
      linkBuilder: (value) => `https://wa.me/${value}`,
      gradient: "from-green-100 via-green-50 to-white border-green-200",
    },
    instagram: {
      name: "Instagram",
      icon: <Instagram className="w-8 h-8 text-pink-600" />,
      description: "Follow us on Instagram",
      linkBuilder: (value) => {
        if (value.startsWith("http")) return value;
        const cleanValue = value.replace("@", "").replace(/\/$/, "");
        return `https://instagram.com/${cleanValue}`;
      },
      gradient: "from-pink-100 via-pink-50 to-white border-pink-200",
    },
    telegram: {
      name: "Telegram",
      icon: <Send className="w-8 h-8 text-sky-600" />,
      description: "Join our Telegram channel",
      linkBuilder: (value) => {
        if (value.startsWith("http")) return value;
        const cleanValue = value.replace("@", "").replace(/\/$/, "");
        return `https://t.me/${cleanValue}`;
      },
      gradient: "from-sky-100 via-sky-50 to-white border-sky-200",
    },
  };

  const fetchSocialMedia = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/socialmedia");
      const data = response.data.data || [];

      const collectedLinks = [];

      // We iterate through the data (usually strictly one document, but handling array just in case)
      data.forEach((social) => {
        
        // 1. Process Standard Platforms (WhatsApp, Insta, Telegram)
        Object.keys(platformConfig).forEach((platform) => {
          if (social[platform] && social[platform].trim()) {
            const config = platformConfig[platform];
            collectedLinks.push({
              id: platform, // Use platform name as ID
              ...config,
              link: config.linkBuilder(social[platform]),
            });
          }
        });

        // 2. Process Dynamic Communities
        if (social.communities && Array.isArray(social.communities)) {
          social.communities.forEach((community) => {
            collectedLinks.push({
              id: community._id, // Use DB ID as ID
              name: community.name,
              icon: <Users className="w-8 h-8 text-indigo-600" />, // Distinct Icon
              description: "Join our Community",
              link: community.link, // Direct link from DB
              gradient: "from-indigo-100 via-indigo-50 to-white border-indigo-200", // Distinct Color
            });
          });
        }
      });

      // Filter duplicates if any (based on ID)
      const uniqueLinks = collectedLinks.filter(
        (link, index, self) =>
          index === self.findIndex((l) => l.id === link.id)
      );

      setSocialLinks(uniqueLinks);
    } catch (err) {
      console.error("Error fetching social media:", err);
      const msg = err.response?.data?.message || "Failed to fetch social media links";
      setError(msg);
      showToast?.("error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialMedia();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-8 text-gray-800">
            Connect With Us
          </h2>
          <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
            {[...Array(3)]?.map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 bg-gray-50 text-center">
        <h2 className="text-3xl font-semibold mb-6 text-gray-800">
          Connect With Us
        </h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchSocialMedia}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-10 text-gray-800">
          Connect With Us
        </h2>

        {socialLinks?.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {socialLinks?.map((item) => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative overflow-hidden border ${item.gradient} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl flex flex-col items-center justify-center p-6`}
              >
                <div className="flex justify-center mb-3">{item.icon}</div>
                <h3 className="text-xl text-gray-800 font-semibold">
                  {item.name}
                </h3>
                <p className="text-gray-500 text-sm mt-2">{item.description}</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <MessageCircle className="w-14 h-14 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-lg">
              No social links configured yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Socialmedia;