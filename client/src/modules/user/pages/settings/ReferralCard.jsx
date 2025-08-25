import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Code, Users, Copy } from "lucide-react"
import { showToast } from "@/modules/common/toast/customToast"

const ReferralCard = ({ profileData }) => {
  const [copied, setCopied] = useState(false)

  const frontendDomain = import.meta.env.VITE_FRONTEND_URL // keep this in your .env

  const referralCode = profileData.referral_code || null
  const referralLink = referralCode
    ? `${frontendDomain}/signup?ref=${referralCode}`
    : null

  const handleCopy = async () => {
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      showToast("success",
        "Referral link copied to clipboard!",
      )
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const referralItems = [
    {
      label: "Referral Code",
      value: referralCode || "Not generated",
      icon: Code,
      isLink: true,
    },
    {
      label: "Referred By",
      value: profileData.referred_by?.username || "None",
      icon: Users,
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
                {item.isLink && referralLink ? (
                  <button
                    onClick={handleCopy}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {item.value}
                    <Copy className="h-4 w-4" />
                  </button>
                ) : (
                  item.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

export default ReferralCard;