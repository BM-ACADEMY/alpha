import React, { useState, useEffect } from 'react';
import { showToast } from '@/modules/common/toast/customToast';
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
  Trash2,
} from 'lucide-react';
import ReferralCard from '@/modules/user/pages/settings/ReferralCard';
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import axiosInstance from '@/modules/common/lib/axios';

const BasicInfo = ({
  user,
  profileData,
  setProfileData,
  imagePreviews,
  setImagePreviews,
  isImageUploading,
  setIsImageUploading,
  getImageUrl,
}) => {
  const [editData, setEditData] = useState({});
  const [open, setOpen] = useState(false);

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

  const handleFileChange = (e, imageType) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setEditData({ ...editData, [imageType]: file });
      const tempPreview = URL.createObjectURL(file);
      setImagePreviews({
        ...imagePreviews,
        [imageType]: tempPreview,
      });
    }
  };

  const handleImageUpload = async (imageType, file) => {
    if (!user?.id) {
      showToast('error', 'User ID is required');
      return null;
    }
    setIsImageUploading({ ...isImageUploading, [imageType]: true });
    const formData = new FormData();
    formData.append(imageType, file);
    formData.append('entity_type', imageType === 'qrcode' ? 'qr_code' : 'user');
    formData.append('user_id', user.id);
    if (profileData[imageType]) {
      formData.append('old_filename', profileData[imageType].split('/').pop());
    }
    try {
      const endpoint = profileData[imageType]
        ? `/profile-image/update-${imageType.replace('_', '-')}`
        : `/profile-image/upload-${imageType.replace('_', '-')}`;
      const response = await axiosInstance[profileData[imageType] ? 'put' : 'post'](
        endpoint,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        }
      );
      const fileUrl = response.data.fileUrl;
      setProfileData({ ...profileData, [imageType]: fileUrl });
      setImagePreviews({ ...imagePreviews, [imageType]: await getImageUrl(fileUrl, imageType === 'qrcode' ? 'qr_code' : 'user') });
      showToast('success', `${imageType.replace('_', ' ')} uploaded successfully`);
      return fileUrl;
    } catch (error) {
      console.error(`${imageType} upload failed:`, error);
      showToast('error', `Failed to upload ${imageType.replace('_', ' ')}: ${error.response?.data?.message || error.message}`);
      setImagePreviews({ ...imagePreviews, [imageType]: '/fallback-image.png' });
      return null;
    } finally {
      setIsImageUploading({ ...isImageUploading, [imageType]: false });
    }
  };

  const handleImageDelete = async (imageType) => {
    if (!user?.id || !profileData[imageType]) {
      showToast('error', 'No image to delete or user ID missing');
      return;
    }
    try {
      const entityType = imageType === 'qrcode' ? 'qr_code' : 'user';
      await axiosInstance.delete('/profile-image/delete-image', {
        data: {
          entity_type: entityType,
          user_id: user.id,
          filename: profileData[imageType].split('/').pop(),
        },
        withCredentials: true,
      });
      setProfileData({ ...profileData, [imageType]: null });
      setImagePreviews({ ...imagePreviews, [imageType]: null });
      setEditData({ ...editData, [imageType]: null });
      showToast('success', `${imageType.replace('_', ' ')} deleted successfully`);
    } catch (error) {
      console.error(`${imageType} delete failed:`, error);
      showToast('error', `Failed to delete ${imageType.replace('_', ' ')}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      showToast('error', 'User ID is required');
      return;
    }
    const formData = new FormData();
    const imageFields = ['profile_image', 'pan_image', 'aadhar_image', 'qrcode'];

    for (const imageType of imageFields) {
      if (editData[imageType] instanceof File) {
        const fileUrl = await handleImageUpload(imageType, editData[imageType]);
        if (fileUrl) {
          formData.append(imageType, fileUrl);
        }
      } else if (profileData[imageType]) {
        formData.append(imageType, profileData[imageType]);
      }
    }

    for (const key in editData) {
      if (!imageFields.includes(key) && editData[key] !== undefined && editData[key] !== '') {
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
      showToast('error', `Failed to update profile: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            {imagePreviews.profile_image ? (
              <img
                src={imagePreviews?.profile_image}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error('Failed to load profile_image:', e);
                  e.target.src = '/fallback-image.png';
                }}
              />
            ) : (
              <AvatarFallback className="text-xl">
                {profileData.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{profileData.username}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{profileData.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Edit className="h-5 w-5 text-red-500" />
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
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'pan_image')}
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
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'aadhar_image')}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="profile_image" className="text-right">
                      Profile Image
                    </Label>
                    <Input
                      id="profile_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'profile_image')}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="qrcode" className="text-right">
                      QR Code Image
                    </Label>
                    <Input
                      id="qrcode"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'qrcode')}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isImageUploading.profile_image || isImageUploading.pan_image || isImageUploading.aadhar_image || isImageUploading.qrcode}>
                    Save changes
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 w-full sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {['profile_image', 'pan_image', 'aadhar_image', 'qrcode']?.map((imageType) => (
          imagePreviews[imageType] && (
            <div key={imageType} className="relative w-[200px] h-[200px] mx-auto">
              <Zoom>
                <img
                  src={imagePreviews[imageType]}
                  alt={imageType.replace('_', ' ')}
                  className="w-full h-full object-cover rounded-md border cursor-pointer"
                  onError={(e) => {
                    console.error(`Failed to load ${imageType}:`, e);
                    e.target.src = '/fallback-image.png';
                  }}
                />
              </Zoom>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600"
                onClick={() => handleImageDelete(imageType)}
                disabled={isImageUploading[imageType]}
              >
                <Trash2 className="h-4 w-4 text-white" />
              </Button>
            </div>
          )
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                  icon: Phone,
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
        <ReferralCard profileData={profileData} />
      </div>
    </div>
  );
};

export default BasicInfo;
