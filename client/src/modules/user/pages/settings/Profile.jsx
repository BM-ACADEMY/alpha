import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/modules/common/context/AuthContext';
import axiosInstance from '@/modules/common/lib/axios';
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
  MapPin,
  Home,
  Building,
  Map,
  Globe,
  Pin,
  Loader2,
  Banknote,
  Trash2,
} from 'lucide-react';
import ReferralCard from './ReferralCard';

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
  const [addressOpen, setAddressOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  });
  const [accountFormData, setAccountFormData] = useState({
    bank_name: '',
    ifsc_code: '',
    account_holder_name: '',
    account_number: '',
    linked_phone_number: '',
    upi_id: '',
    upi_number: '',
    qrcode: null,
  });
  const [imagePreviews, setImagePreviews] = useState({
    profile_image: null,
    pan_image: null,
    aadhar_image: null,
    qrcode: null,
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [accountErrors, setAccountErrors] = useState({});
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
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

    // Check cache first
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
          })
          ));
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

  const handleAccountFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setAccountFormData({ ...accountFormData, qrcode: file });
      setImagePreviews({
        ...imagePreviews,
        qrcode: URL.createObjectURL(file),
      });
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

  const validateAddressForm = () => {
    const newErrors = {};
    if (!addressFormData.address_line_1.trim()) newErrors.address_line_1 = 'Address Line 1 is required';
    if (!addressFormData.city.trim()) newErrors.city = 'City is required';
    if (!addressFormData.state.trim()) newErrors.state = 'State is required';
    if (!addressFormData.country.trim()) newErrors.country = 'Country is required';
    if (!addressFormData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{5,10}$/.test(addressFormData.pincode)) newErrors.pincode = 'Pincode must be 5-10 digits';
    setAddressErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData((prev) => ({ ...prev, [name]: value }));
    if (addressErrors[name]) {
      setAddressErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      showToast('error', 'You must be logged in with a valid user ID to submit an address');
      return;
    }
    if (!validateAddressForm()) {
      showToast('error', 'Please fill in all required fields correctly');
      return;
    }
    setIsAddressSubmitting(true);
    try {
      const response = await axiosInstance.patch(`/address/${selectedAddress._id}`, {
        user_id: user.id,
        ...addressFormData,
      }, { withCredentials: true });
      setAddresses(addresses.map((addr) => (addr._id === selectedAddress._id ? response.data : addr)));
      setAddressOpen(false);
      showToast('success', 'Address updated successfully');
      setAddressFormData({
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
      });
    } catch (error) {
      console.error('Address update failed:', error.response?.data || error.message);
      showToast('error', error.response?.data?.message || 'Failed to update address');
    } finally {
      setIsAddressSubmitting(false);
    }
  };

  const openAddressEdit = (address) => {
    setSelectedAddress(address);
    setAddressFormData({
      address_line_1: address.address_line_1 || '',
      address_line_2: address.address_line_2 || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || '',
      pincode: address.pincode || '',
    });
    setAddressOpen(true);
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData((prev) => ({ ...prev, [name]: value }));
    if (accountErrors[name]) {
      setAccountErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const openAccountEdit = (account = null) => {
    setSelectedAccount(account);
    if (account) {
      setAccountFormData({
        bank_name: account.bank_name || '',
        ifsc_code: account.ifsc_code || '',
        account_holder_name: account.account_holder_name || '',
        account_number: account.account_number || '',
        linked_phone_number: account.linked_phone_number || '',
        upi_id: account.upi_id || '',
        upi_number: account.upi_number || '',
        qrcode: null,
      });
      setImagePreviews({
        ...imagePreviews,
        qrcode: account.qrcodeUrl || null,
      });
    } else {
      setAccountFormData({
        bank_name: '',
        ifsc_code: '',
        account_holder_name: '',
        account_number: '',
        linked_phone_number: '',
        upi_id: '',
        upi_number: '',
        qrcode: null,
      });
      setImagePreviews({ ...imagePreviews, qrcode: null });
    }
    setAccountOpen(true);
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      showToast('error', 'You must be logged in with a valid user ID to submit account details');
      return;
    }
    setIsAccountSubmitting(true);
    let qrcodeUrl = selectedAccount?.qrcode || null;

    // Handle QR code upload/update separately
    if (accountFormData.qrcode instanceof File) {
      const formData = new FormData();
      formData.append('qrcode', accountFormData.qrcode);
      formData.append('entity_type', 'qr_code');
      formData.append('user_id', user.id);
      if (selectedAccount?.qrcode) {
        formData.append('old_filename', selectedAccount.qrcode.split('/').pop());
      }
      try {
        const endpoint = selectedAccount?.qrcode
          ? '/profile-image/update-qrcode-image'
          : '/profile-image/upload-qrcode-image';
        const response = await axiosInstance[selectedAccount?.qrcode ? 'put' : 'post'](
          endpoint,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
          }
        );
        qrcodeUrl = response.data.fileUrl;
        setImagePreviews({ ...imagePreviews, qrcode: await getImageUrl(qrcodeUrl, 'qr_code') });
      } catch (error) {
        console.error('QR code upload failed:', error);
        showToast('error', `Failed to upload QR code: ${error.response?.data?.message || error.message}`);
        setIsAccountSubmitting(false);
        return;
      }
    }

    const formData = new FormData();
    Object.entries(accountFormData).forEach(([key, value]) => {
      if (key !== 'qrcode' && value !== '') {
        formData.append(key, value);
      }
    });
    if (qrcodeUrl) {
      formData.append('qrcode', qrcodeUrl);
    }
    formData.append('user_id', user.id);

    try {
      let response;
      if (selectedAccount) {
        response = await axiosInstance.put(`/accounts/${selectedAccount._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        showToast('success', 'Account updated successfully');
      } else {
        response = await axiosInstance.post(`/accounts`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        showToast('success', 'Account added successfully');
      }
      const accountsResponse = await axiosInstance.get(`/accounts/user/${user.id}`, {
        withCredentials: true,
      });
      const updatedAccounts = await Promise.all(
        accountsResponse.data.map(async (account) => ({
          ...account,
          qrcodeUrl: account.qrcode ? await getImageUrl(account.qrcode, 'qr_code') : null,
        })
        ));
      setAccounts(updatedAccounts);
      setAccountOpen(false);
      setAccountFormData({
        bank_name: '',
        ifsc_code: '',
        account_holder_name: '',
        account_number: '',
        linked_phone_number: '',
        upi_id: '',
        upi_number: '',
        qrcode: null,
      });
      setImagePreviews({ ...imagePreviews, qrcode: null });
    } catch (error) {
      console.error('Account operation failed:', error.response?.data || error.message);
      showToast('error', error.response?.data?.message || 'Failed to save account');
    } finally {
      setIsAccountSubmitting(false);
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
                  ].map((item, index) => (
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
                  ].map((item, index) => (
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
            {/* <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Code className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Referral</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                  {[
                    {
                      label: "Referral Code",
                      value: profileData.referral_code || "Not generated",
                      icon: Code,
                    },
                    {
                      label: "Referred By",
                      value: profileData.referred_by?.username || "None",
                      icon: Users,
                    },
                  ].map((item, index) => (
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
            </Card> */}
            <ReferralCard profileData={profileData} />
          </div>

          <section className="mt-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Addresses
            </h3>
            {addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No addresses added yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {addresses.map((address) => (
                  <Card key={address._id} className="shadow-sm relative w-full">
                    <CardContent className="p-4">
                      <div className="absolute top-2 right-2">
                        <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openAddressEdit(address)}>
                              <Edit className="h-5 w-5 text-red-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <MapPin className="h-6 w-6 text-blue-600" />
                                Edit Address
                              </DialogTitle>
                              <DialogDescription>
                                Update your address details here. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddressSubmit} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="address_line_1">Address Line 1 <span className="text-red-500">*</span></Label>
                                <Input
                                  id="address_line_1"
                                  name="address_line_1"
                                  value={addressFormData.address_line_1}
                                  onChange={handleAddressChange}
                                  placeholder="123 Main St"
                                  className={addressErrors.address_line_1 ? 'border-red-500' : ''}
                                />
                                {addressErrors.address_line_1 && <p className="text-red-500 text-sm">{addressErrors.address_line_1}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="address_line_2">Address Line 2</Label>
                                <Input
                                  id="address_line_2"
                                  name="address_line_2"
                                  value={addressFormData.address_line_2}
                                  onChange={handleAddressChange}
                                  placeholder="Apt, Suite, etc. (optional)"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                                  <Input
                                    id="city"
                                    name="city"
                                    value={addressFormData.city}
                                    onChange={handleAddressChange}
                                    placeholder="New York"
                                    className={addressErrors.city ? 'border-red-500' : ''}
                                  />
                                  {addressErrors.city && <p className="text-red-500 text-sm">{addressErrors.city}</p>}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                                  <Input
                                    id="state"
                                    name="state"
                                    value={addressFormData.state}
                                    onChange={handleAddressChange}
                                    placeholder="NY"
                                    className={addressErrors.state ? 'border-red-500' : ''}
                                  />
                                  {addressErrors.state && <p className="text-red-500 text-sm">{addressErrors.state}</p>}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                                  <Input
                                    id="country"
                                    name="country"
                                    value={addressFormData.country}
                                    onChange={handleAddressChange}
                                    placeholder="United States"
                                    className={addressErrors.country ? 'border-red-500' : ''}
                                  />
                                  {addressErrors.country && <p className="text-red-500 text-sm">{addressErrors.country}</p>}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="pincode">Pincode <span className="text-red-500">*</span></Label>
                                  <Input
                                    id="pincode"
                                    name="pincode"
                                    value={addressFormData.pincode}
                                    onChange={handleAddressChange}
                                    placeholder="12345"
                                    className={addressErrors.pincode ? 'border-red-500' : ''}
                                  />
                                  {addressErrors.pincode && <p className="text-red-500 text-sm">{addressErrors.pincode}</p>}
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  type="submit"
                                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                                  disabled={isAddressSubmitting}
                                >
                                  {isAddressSubmitting ? (
                                    <>
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    'Save Address'
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                        {[
                          { label: "Line 1", value: address.address_line_1, icon: Home },
                          { label: "Line 2", value: address.address_line_2, icon: Building },
                          { label: "City", value: address.city, icon: Map },
                          { label: "State", value: address.state, icon: MapPin },
                          { label: "Country", value: address.country, icon: Globe },
                          { label: "Pincode", value: address.pincode, icon: Pin },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center bg-gray-100 px-4 py-3 text-sm"
                          >
                            <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <dt className="w-36 font-medium">{item.label}:</dt>
                            <dd className="flex-1">{item.value || "N/A"}</dd>
                          </div>
                        ))}
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <Banknote className="mr-2 h-5 w-5" />
              Account Details
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {accounts.length === 0 ? (
                <Card className="shadow-sm relative">
                  <CardContent className="p-4">
                    <div className="absolute top-2 right-2">
                      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => openAccountEdit()}>
                            <Edit className="h-5 w-5 text-red-500" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Banknote className="h-6 w-6 text-blue-600" />
                              Add Account Details
                            </DialogTitle>
                            <DialogDescription>
                              Add your account details here. Click save when you're done.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAccountSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="bank_name">Bank Name</Label>
                                <Input
                                  id="bank_name"
                                  name="bank_name"
                                  value={accountFormData.bank_name}
                                  onChange={handleAccountChange}
                                  placeholder="Bank Name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="ifsc_code">IFSC Code</Label>
                                <Input
                                  id="ifsc_code"
                                  name="ifsc_code"
                                  value={accountFormData.ifsc_code}
                                  onChange={handleAccountChange}
                                  placeholder="IFSC Code"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="account_holder_name">Account Holder Name</Label>
                                <Input
                                  id="account_holder_name"
                                  name="account_holder_name"
                                  value={accountFormData.account_holder_name}
                                  onChange={handleAccountChange}
                                  placeholder="Account Holder Name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="account_number">Account Number</Label>
                                <Input
                                  id="account_number"
                                  name="account_number"
                                  value={accountFormData.account_number}
                                  onChange={handleAccountChange}
                                  placeholder="Account Number"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="linked_phone_number">Linked Phone Number</Label>
                                <Input
                                  id="linked_phone_number"
                                  name="linked_phone_number"
                                  value={accountFormData.linked_phone_number}
                                  onChange={handleAccountChange}
                                  placeholder="Linked Phone Number"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="upi_id">UPI ID</Label>
                                <Input
                                  id="upi_id"
                                  name="upi_id"
                                  value={accountFormData.upi_id}
                                  onChange={handleAccountChange}
                                  placeholder="UPI ID"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="upi_number">UPI Number</Label>
                                <Input
                                  id="upi_number"
                                  name="upi_number"
                                  value={accountFormData.upi_number}
                                  onChange={handleAccountChange}
                                  placeholder="UPI Number"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="qrcode">QR Code Image</Label>
                                {imagePreviews.qrcode && (
                                  <div className="relative">
                                    <img
                                      src={imagePreviews.qrcode}
                                      alt="Current QR Code"
                                      className="w-32 h-32 object-contain mb-2"
                                      onError={(e) => {
                                        console.error('Failed to load qrcode:', e);
                                        e.target.src = '/fallback-image.png';
                                      }}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute top-0 right-0 bg-red-500 hover:bg-red-600"
                                      onClick={() => handleImageDelete('qrcode')}
                                      disabled={isImageUploading.qrcode}
                                    >
                                      <Trash2 className="h-4 w-4 text-white" />
                                    </Button>
                                  </div>
                                )}
                                <Input
                                  id="qrcode"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleAccountFileChange(e)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                                disabled={isAccountSubmitting}
                              >
                                {isAccountSubmitting ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save Account'
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <p className="text-sm text-muted-foreground">No account details added yet.</p>
                  </CardContent>
                </Card>
              ) : (
                accounts.map((account) => (
                  <Card key={account._id} className="shadow-sm relative">
                    <CardContent className="p-4">
                      <div className="absolute top-2 right-2">
                        <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openAccountEdit(account)}>
                              <Edit className="h-5 w-5 text-red-500" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Banknote className="h-6 w-6 text-blue-600" />
                                Edit Account Details
                              </DialogTitle>
                              <DialogDescription>
                                Update your account details here. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAccountSubmit} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="bank_name">Bank Name</Label>
                                  <Input
                                    id="bank_name"
                                    name="bank_name"
                                    value={accountFormData.bank_name}
                                    onChange={handleAccountChange}
                                    placeholder="Bank Name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="ifsc_code">IFSC Code</Label>
                                  <Input
                                    id="ifsc_code"
                                    name="ifsc_code"
                                    value={accountFormData.ifsc_code}
                                    onChange={handleAccountChange}
                                    placeholder="IFSC Code"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="account_holder_name">Account Holder Name</Label>
                                  <Input
                                    id="account_holder_name"
                                    name="account_holder_name"
                                    value={accountFormData.account_holder_name}
                                    onChange={handleAccountChange}
                                    placeholder="Account Holder Name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="account_number">Account Number</Label>
                                  <Input
                                    id="account_number"
                                    name="account_number"
                                    value={accountFormData.account_number}
                                    onChange={handleAccountChange}
                                    placeholder="Account Number"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="linked_phone_number">Linked Phone Number</Label>
                                  <Input
                                    id="linked_phone_number"
                                    name="linked_phone_number"
                                    value={accountFormData.linked_phone_number}
                                    onChange={handleAccountChange}
                                    placeholder="Linked Phone Number"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="upi_id">UPI ID</Label>
                                  <Input
                                    id="upi_id"
                                    name="upi_id"
                                    value={accountFormData.upi_id}
                                    onChange={handleAccountChange}
                                    placeholder="UPI ID"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="upi_number">UPI Number</Label>
                                  <Input
                                    id="upi_number"
                                    name="upi_number"
                                    value={accountFormData.upi_number}
                                    onChange={handleAccountChange}
                                    placeholder="UPI Number"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="qrcode">QR Code Image</Label>
                                  {imagePreviews.qrcode && (
                                    <div className="relative">
                                      <img
                                        src={imagePreviews.qrcode}
                                        alt="Current QR Code"
                                        className="w-32 h-32 object-contain mb-2"
                                        onError={(e) => {
                                          console.error('Failed to load qrcode:', e);
                                          e.target.src = '/fallback-image.png';
                                        }}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-0 right-0 bg-red-500 hover:bg-red-600"
                                        onClick={() => handleImageDelete('qrcode')}
                                        disabled={isImageUploading.qrcode}
                                      >
                                        <Trash2 className="h-4 w-4 text-white" />
                                      </Button>
                                    </div>
                                  )}
                                  <Input
                                    id="qrcode"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleAccountFileChange(e)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  type="submit"
                                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                                  disabled={isAccountSubmitting}
                                >
                                  {isAccountSubmitting ? (
                                    <>
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    'Save Account'
                                  )}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Side - Account Details */}
                        <dl className="flex-1 divide-y divide-gray-200 rounded-lg border border-gray-200">
                          {[
                            { label: "Bank Name", value: account.bank_name, icon: Banknote },
                            { label: "Account Number", value: account.account_number, icon: CreditCard },
                            { label: "IFSC Code", value: account.ifsc_code, icon: Code },
                            { label: "Holder Name", value: account.account_holder_name, icon: UserIcon },
                            { label: "Linked Phone", value: account.linked_phone_number, icon: Phone },
                            { label: "UPI ID", value: account.upi_id, icon: Code },
                            { label: "UPI Number", value: account.upi_number, icon: Phone },
                          ].map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-gray-100 px-4 py-3 text-sm"
                            >
                              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                              <dt className="w-36 font-medium">{item.label}:</dt>
                              <dd className="flex-1">{item.value || "N/A"}</dd>
                            </div>
                          ))}
                        </dl>

                        {/* Right Side - QR Code */}
                        {account.qrcodeUrl && (
                          <div className="flex flex-col items-center lg:items-start">
                            <span className="text-sm font-medium mb-2">QR Code:</span>
                            <img
                              src={account.qrcodeUrl}
                              alt="QR Code"
                              className="w-[200px] h-[200px] object-contain border rounded-lg shadow"
                              onError={(e) => {
                                console.error("Failed to load account qrcode:", e)
                                e.target.src = "/fallback-image.png"
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;