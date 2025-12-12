import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User as UserIcon,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  CreditCard,
  Code,
} from 'lucide-react';
import ReferralCard from './ReferralCard';

const BasicInfoCard = ({ profileData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <UserIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            {[
              {
                label: "Phone",
                value: profileData.phone_number || "Not provided",
                icon: Mail,
              },
              {
                label: "Joined",
                value: new Date(profileData.created_at).toLocaleDateString(),
                icon: Calendar,
              },
              {
                label: "Role",
                value: (
                  <Badge variant="secondary">
                    {profileData.role_id?.role_name || "Unknown"}
                  </Badge>
                ),
                icon: Users,
              },
            ]?.map((item, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 px-4 py-3 text-sm"
              >
                <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <dt className="w-36 font-medium">{item.label}:</dt>
                <dd className="flex-1">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Verification */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            <div className="flex items-center bg-gray-100 px-4 py-3 text-sm">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              <dt className="w-36 font-medium">Email Verified:</dt>
              <dd>
                {profileData.email_verified ? (
                  <Badge variant="success" className="flex items-center">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center">
                    <XCircle className="mr-1 h-3 w-3" /> No
                  </Badge>
                )}
              </dd>
            </div>
            <div className="flex items-center bg-gray-100 px-4 py-3 text-sm">
              <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <dt className="w-36 font-medium">Admin Verified:</dt>
              <dd>
                {profileData.verified_by_admin ? (
                  <Badge variant="success" className="flex items-center">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center">
                    <XCircle className="mr-1 h-3 w-3" /> No
                  </Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* KYC Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">KYC Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            {[
              {
                label: "PAN Number",
                value: profileData.pan_number || "Not provided",
                icon: CreditCard,
              },
              {
                label: "Aadhar Number",
                value: profileData.aadhar_number || "Not provided",
                icon: FileText,
              },
            ]?.map((item, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 px-4 py-3 text-sm"
              >
                <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <dt className="w-36 font-medium">{item.label}:</dt>
                <dd className="flex-1">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Referral */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Code className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Referral</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferralCard profileData={profileData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicInfoCard;
