import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Code, Users, Copy } from "lucide-react"
import { showToast } from "@/modules/common/toast/customToast"

const ReferralCard = ({ profileData }) => {
  const frontendDomain = import.meta.env.VITE_FRONTEND_URL

  const referralCode = profileData.referral_code || null
  const referralLink = referralCode
    ? `${frontendDomain}/signup?ref=${referralCode}`
    : null

  const handleCopyCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode)
      showToast("success", "Referral code copied to clipboard!")
    }
  }

  const handleCopyLink = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink)
      showToast("success", "Referral link copied to clipboard!")
    }
  }

  const referralItems = [
    {
      label: "Referral Code",
      value: referralCode || "Not generated",
      icon: Code,
      copyAction: handleCopyCode,
    },
    {
      label: "Referred By",
      value: profileData.referred_by?.username || "None",
      icon: Users,
      copyAction: null,
    },
    {
      label: "Referral Link",
      value: referralLink || "Not generated",
      icon: Copy,
      copyAction: handleCopyLink,
    },
  ]

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
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <dt className="w-36 font-medium">{item.label}:</dt>
              <dd className="flex-1 flex items-center justify-between">
                {item.copyAction && item.value !== "Not generated" ? (
                  <div className="flex items-center gap-1">
                    <span className="truncate">{item.value}</span>
                    <button
                      onClick={item.copyAction}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="h-4 w-4" />
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
  )
}

export default ReferralCard