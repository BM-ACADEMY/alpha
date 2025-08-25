import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/modules/common/context/AuthContext';
import axiosInstance from '@/modules/common/lib/axios';
import { showToast } from '@/modules/common/toast/customToast';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
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
  Mail,
  Edit,
  Trash2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import BasicInfoCard from './BasicInfo';
import AddressCard from './AddressSection';
import AccountCard from './AccountSection';

// Fallback for imageCache if Map is unavailable
const imageCache = typeof Map === 'function' ? new Map() : {
  cache: {},
  set(key, value) { this.cache[key] = value; },
  get(key) { return this.cache[key]; },
  has(key) { return key in this.cache; },
  clear() { this.cache = {}; },
};

// Log if Map is unavailable for debugging
if (typeof Map !== 'function') {
  console.warn('Map constructor is not available. Using fallback object for imageCache.');
}

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [imagePreviews, setImagePreviews] = useState({
    profile_image: null,
    pan_image: null,
    aadhar_image: null,
    qrcode: null,
  });
  const [isImageUploading, setIsImageUploading] = useState({
    profile_image: false,
    pan_image: false,
    aadhar_image: false,
    qrcode: false,
  });

  // Function to fetch image as blob and return a blob URL
  const getImageUrl = async (filePath, entityType = 'user') => {
    if (!filePath || !user?.id) {
      console.warn('getImageUrl: Missing filePath or user ID', { filePath, userId: user?.id });
      return '/fallback-image.png';
    }

    if (imageCache.has(filePath)) {
      return imageCache.get(filePath);
    }

    const parts = filePath.split('/');
    const filename = parts[parts.length - 1];

    try {
      const response = await axiosInstance.get(
        `/profile-image/get-image/${entityType}/${user.id}/${encodeURIComponent(filename)}`,
        { responseType: 'blob', withCredentials: true }
      );
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const blobUrl = URL.createObjectURL(blob);
      imageCache.set(filePath, blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('getImageUrl error:', {
        filePath,
        status: error.response?.status,
        message: error.message,
      });
      return '/fallback-image.png';
    }
  };

  // Clean up blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (typeof Map === 'function') {
        imageCache.forEach((url) => URL.revokeObjectURL(url));
        imageCache.clear();
      } else {
        Object.values(imageCache.cache).forEach((url) => URL.revokeObjectURL(url));
        imageCache.clear();
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(`/users/${user.id}`, {
          withCredentials: true,
        });
        const profile = response.data;
        setProfileData(profile);

        const imageFields = ['profile_image', 'pan_image', 'aadhar_image', 'qrcode'];
        const imagePromises = imageFields.map(async (field) => ({
          field,
          url: profile[field] ? await getImageUrl(profile[field], field === 'qrcode' ? 'qr_code' : 'user') : null,
        }));
        const previewsArray = await Promise.all(imagePromises);
        const previews = previewsArray.reduce((acc, { field, url }) => ({ ...acc, [field]: url }), {});
        setImagePreviews(previews);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        showToast('error', 'Failed to load profile data');
      }
    };

    const fetchAddresses = async () => {
      try {
        const response = await axiosInstance.get(`/address/user/${user.id}`, {
        withCredentials: true,
      });
      setAddresses(response.data);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      showToast('error', 'Failed to load addresses');
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axiosInstance.get(`/accounts/user/${user.id}`, {
        withCredentials: true,
      });
      const accountsData = response.data;
      const updatedAccounts = await Promise.all(
        accountsData.map(async (account) => ({
          ...account,
          qrcodeUrl: account.qrcode ? await getImageUrl(account.qrcode, 'qr_code') : null,
        }))
      );
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      showToast('error', 'Failed to load account details');
    }
  };

  setIsLoading(true);
  Promise.all([fetchProfile(), fetchAddresses(), fetchAccounts()]).finally(() =>
    setIsLoading(false)
  );
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
  <div className="">
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {imagePreviews.profile_image ? (
                <img
                  src={imagePreviews.profile_image}
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
              <h2 className="text-2xl font-bold">{profileData.username}</h2>
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
          {['profile_image', 'pan_image', 'aadhar_image', 'qrcode'].map((imageType) => (
            imagePreviews[imageType] && (
              <div key={imageType} className="relative w-[200px] h-[200px] mx-auto">
                <img
                  src={imagePreviews[imageType]}
                  alt={imageType.replace('_', ' ')}
                  className="w-full h-full object-cover rounded-md border"
                  onError={(e) => {
                    console.error(`Failed to load ${imageType}:`, e);
                    e.target.src = '/fallback-image.png';
                  }}
                />
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
      </CardHeader>
      <CardContent className="pt-6">
        <BasicInfoCard profileData={profileData} />
        <AddressCard addresses={addresses} setAddresses={setAddresses} user={user} />
        <AccountCard
          accounts={accounts}
          setAccounts={setAccounts}
          user={user}
          imagePreviews={imagePreviews}
          setImagePreviews={setImagePreviews}
          isImageUploading={isImageUploading}
          handleImageDelete={handleImageDelete}
        />
      </CardContent>
    </Card>
  </div>
);
};

export default Profile;