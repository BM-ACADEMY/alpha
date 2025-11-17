import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Code, Copy as CopyIcon, Share2 } from "lucide-react";
import { showToast } from "@/modules/common/toast/customToast";

const ReferralCard = ({ profileData }) => {
  const frontendDomain = import.meta.env.VITE_FRONTEND_URL;

  const referralCode = profileData.referral_code || null;
  const referralLink = referralCode
    ? `${frontendDomain}/signup?ref=${referralCode}`
    : null;

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      showToast("success", "Referral code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      showToast("success", "Referral link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareReferral = async () => {
    if (!referralLink) {
      showToast("error", "Referral link not available");
      return;
    }

    const shareData = {
      title: "Join with my referral link!",
      text: "Sign up using my referral link and start earning rewards!",
      url: referralLink,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast("success", "Referral link shared successfully!");
      } catch (error) {
        console.error("Share failed:", error);
        showToast("error", "Failed to share referral link");
      }
    } else {
      await navigator.clipboard.writeText(referralLink);
      showToast("info", "Referral link copied (sharing not supported)");
    }
  };

  const referralItems = [
    {
      label: "Referral Code",
      value: referralCode || "Not generated",
      copyAction: handleCopyCode,
      copied: copiedCode,
      showShare: false,
    },
    {
      label: "Referred By",
      value: profileData.referred_by?.username || "None",
      copyAction: null,
      copied: false,
      showShare: false,
    },
    {
      label: "Referral Link",
      value: referralLink || "Not generated",
      copyAction: handleCopyLink,
      copied: copiedLink,
      showShare: true,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Code className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-lg">Referral</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {referralItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center px-4 py-3 text-sm ${
                item.label === "Referral Code" && item.value !== "Not generated"
                  ? "bg-yellow-50 border-l-4 border-yellow-400"
                  : "bg-gray-100"
              }`}
            >
              <dt className="w-36 font-medium">{item.label}:</dt>
              <dd className="flex-1 flex items-center justify-between">
                {item.copyAction && item.value !== "Not generated" ? (
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-gray-800">
                      {item.value}
                    </span>
                    <div className="flex gap-1">
                      {/* Copy Button */}
                      <button
                        onClick={item.copyAction}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                      >
                        <CopyIcon className="w-3 h-3" />
                        {item.copied ? "Copied" : "Copy"}
                      </button>

                      {/* Share Button (only for referral link) */}
                      {item.showShare && (
                        <button
                          onClick={handleShareReferral}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
                        >
                          <Share2 className="w-3 h-3" />
                          Share
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-700">{item.value}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
