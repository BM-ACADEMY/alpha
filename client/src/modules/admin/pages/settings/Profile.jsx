import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/modules/common/context/AuthContext';
import axiosInstance from '@/modules/common/lib/axios';
import { showToast } from '@/modules/common/toast/customToast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BasicInfo from './BasicInfo';
import AddressSection from './AddressSection';
import AccountSection from './AccountSection';

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

// Function to fetch image as blob and return a blob URL
const getImageUrl = async (filePath, userId, entityType = 'user') => {
  if (!filePath || !userId) {
    console.warn('getImageUrl: Missing filePath or user ID', { filePath, userId });
    return '/fallback-image.png';
  }

  // Check cache first
  if (imageCache.has(filePath)) {
    return imageCache.get(filePath);
  }

  const parts = filePath.split('/');
  const filename = parts[parts.length - 1];

  try {
    const response = await axiosInstance.get(
      `/profile-image/get-image/${entityType}/${userId}/${encodeURIComponent(filename)}`,
      { responseType: 'blob', withCredentials: true }
    );
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const blobUrl = URL.createObjectURL(blob);
    imageCache.set(filePath, blobUrl); // Cache the blob URL
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

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
        const imagePromises = imageFields?.map(async (field) => ({
          field,
          url: profile[field] ? await getImageUrl(profile[field], user.id, field === 'qrcode' ? 'qr_code' : 'user') : null,
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
          accountsData?.map(async (account) => ({
            ...account,
            qrcodeUrl: account.qrcode ? await getImageUrl(account.qrcode, user.id, 'qr_code') : null,
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
          <BasicInfo
            user={user}
            profileData={profileData}
            setProfileData={setProfileData}
            imagePreviews={imagePreviews}
            setImagePreviews={setImagePreviews}
            isImageUploading={isImageUploading}
            setIsImageUploading={setIsImageUploading}
            getImageUrl={getImageUrl}
          />
        </CardHeader>
        <CardContent className="pt-6">
          <AddressSection
            user={user}
            addresses={addresses}
            setAddresses={setAddresses}
          />
          <AccountSection
            user={user}
            accounts={accounts}
            setAccounts={setAccounts}
            imagePreviews={imagePreviews}
            setImagePreviews={setImagePreviews}
            isImageUploading={isImageUploading}
            setIsImageUploading={setIsImageUploading}
            getImageUrl={getImageUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
