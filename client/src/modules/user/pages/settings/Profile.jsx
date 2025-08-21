// Updated frontend: src/pages/Profile.jsx (assuming path; adjust as needed)
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/modules/common/context/AuthContext'; // Adjust path to your AuthContext
import axiosInstance from '@/modules/common/lib/axios';
import { showToast } from '@/modules/common/toast/customToast'; // Adjust path if needed
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User as UserIcon,
  Mail,
  Phone,
  CreditCard,
  FileText,
  CheckCircle2,
  XCircle,
  Calendar,
  Code,
  Users,
  Edit,
} from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const fetchProfile = async () => {
        try {
          const response = await axiosInstance.get(`/users/${user.id}`, {
            withCredentials: true,
          });
          setProfileData(response.data);
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          showToast('error', 'Failed to load profile data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (profileData) {
      setEditData({
        username: profileData.username || '',
        email: profileData.email || '',
        phone_number: profileData.phone_number || '',
        pan_number: profileData.pan_number || '',
        aadhar_number: profileData.aadhar_number || '',
      });
    }
  }, [profileData]);

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.id]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setEditData({ ...editData, [e.target.id]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (const key in editData) {
      if (editData[key] !== undefined && editData[key] !== '') {
        formData.append(key, editData[key]);
      }
    }
    try {
      const response = await axiosInstance.patch(`/users/${user.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setProfileData(response.data);
      setOpen(false);
      showToast('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast('error', 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-32 w-full mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return <div className="container mx-auto p-4">No profile data available.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {profileData.username?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profileData.username}</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{profileData.email}</span>
                </div>
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Edit className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={editData.username}
                        onChange={handleChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={editData.email}
                        onChange={handleChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone_number" className="text-right">
                        Phone
                      </Label>
                      <Input
                        id="phone_number"
                        value={editData.phone_number}
                        onChange={handleChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pan_number" className="text-right">
                        PAN Number
                      </Label>
                      <Input
                        id="pan_number"
                        value={editData.pan_number}
                        onChange={handleChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pan_image" className="text-right">
                        PAN Image
                      </Label>
                      <Input
                        id="pan_image"
                        type="file"
                        onChange={handleFileChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="aadhar_number" className="text-right">
                        Aadhar Number
                      </Label>
                      <Input
                        id="aadhar_number"
                        value={editData.aadhar_number}
                        onChange={handleChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="aadhar_image" className="text-right">
                        Aadhar Image
                      </Label>
                      <Input
                        id="aadhar_image"
                        type="file"
                        onChange={handleFileChange}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <section>
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <UserIcon className="mr-2 h-5 w-5" />
                Personal Information
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <dt className="w-32 font-medium">Phone:</dt>
                  <dd>{profileData.phone_number || 'Not provided'}</dd>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <dt className="w-32 font-medium">Joined:</dt>
                  <dd>{new Date(profileData.created_at).toLocaleDateString()}</dd>
                </div>
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <dt className="w-32 font-medium">Role:</dt>
                  <dd>
                    <Badge variant="secondary">{profileData.role_id?.role_name || 'Unknown'}</Badge>
                  </dd>
                </div>
              </dl>
            </section>

            {/* Verification Status */}
            <section>
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Verification
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <dt className="w-32 font-medium">Email Verified:</dt>
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
                <div className="flex items-center">
                  <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <dt className="w-32 font-medium">Admin Verified:</dt>
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
            </section>

            {/* KYC Documents */}
            <section>
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                KYC Documents
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center mb-2">
                    <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                    <dt className="w-32 font-medium">PAN Number:</dt>
                    <dd>{profileData.pan_number || 'Not provided'}</dd>
                  </div>
                  {profileData.pan_image && (
                    <img
                      src={profileData.pan_image}
                      alt="PAN Document"
                      className="w-48 rounded-md shadow-sm"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <dt className="w-32 font-medium">Aadhar Number:</dt>
                    <dd>{profileData.aadhar_number || 'Not provided'}</dd>
                  </div>
                  {profileData.aadhar_image && (
                    <img
                      src={profileData.aadhar_image}
                      alt="Aadhar Document"
                      className="w-48 rounded-md shadow-sm"
                    />
                  )}
                </div>
              </dl>
            </section>

            {/* Referral Information */}
            <section>
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Code className="mr-2 h-5 w-5" />
                Referral
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Code className="mr-2 h-4 w-4 text-muted-foreground" />
                  <dt className="w-32 font-medium">Referral Code:</dt>
                  <dd>{profileData.referral_code || 'Not generated'}</dd>
                </div>
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <dt className="w-32 font-medium">Referred By:</dt>
                  <dd>{profileData.referred_by?.username || 'None'}</dd>
                </div>
              </dl>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;