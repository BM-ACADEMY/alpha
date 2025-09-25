import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Code, Users, Copy as CopyIcon } from "lucide-react";
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
      setTimeout(() => setCopiedCode(false), 2000); // revert after 2s
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

  const referralItems = [
    {
      label: "Referral Code",
      value: referralCode || "Not generated",
      copyAction: handleCopyCode,
      copied: copiedCode,
    },
    {
      label: "Referred By",
      value: profileData.referred_by?.username || "None",
      copyAction: null,
      copied: false,
    },
    {
      label: "Referral Link",
      value: referralLink || "Not generated",
      copyAction: handleCopyLink,
      copied: copiedLink,
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
              className="flex items-center bg-gray-100 px-4 py-3 text-sm"
            >
              <span className="mr-2 w-4 h-4 flex-shrink-0" />
              <dt className="w-36 font-medium">{item.label}:</dt>
              <dd className="flex-1 flex items-center justify-between">
                {item.copyAction && item.value !== "Not generated" ? (
                  <div className="flex items-center gap-2">
                    <span className="truncate">{item.value}</span>
                    <button
                      onClick={item.copyAction}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                    >
                      <CopyIcon className="w-3 h-3" />
                      {item.copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                ) : (
                  <span>{item.value}</span>
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
