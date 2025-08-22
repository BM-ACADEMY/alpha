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
} from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);

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

      setIsLoading(true);
      Promise.all([fetchProfile(), fetchAddresses()]).finally(() =>
        setIsLoading(false)
      );
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
  console.log('User:', user);
  console.log('Selected Address ID:', selectedAddress?._id);
  console.log('Form Data:', addressFormData);

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
    console.log('Sending PATCH request to:', `/address/${selectedAddress._id}`); // Updated URL
    const response = await axiosInstance.patch(`/address/${selectedAddress._id}`, {
      user_id: user.id,
      ...addressFormData
    }, { withCredentials: true });
    console.log('Response:', response.data);

    if (response.data) {
      setAddresses(addresses.map(addr => addr._id === selectedAddress._id ? response.data : addr));
      setAddressOpen(false);
      showToast('success', 'Address updated successfully');
      setAddressFormData({
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        country: '',
        pincode: ''
      });
    }
  } catch (error) {
    console.error('Address update failed:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || error.response?.statusText || 'Failed to update address';
    showToast('error', errorMessage);
  } finally {
    setIsAddressSubmitting(false);
  }
};

  const openAddressEdit = (address) => {
    console.log('Editing Address:', address);
    setSelectedAddress(address);
    setAddressFormData({
      address_line_1: address.address_line_1 || '',
      address_line_2: address.address_line_2 || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || '',
      pincode: address.pincode || ''
    });
    setAddressOpen(true);
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

          {/* Addresses Section */}
          <section className="mt-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Addresses
            </h3>
            {addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No addresses added yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <Card key={address._id} className="shadow-sm relative">
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
                      <dl className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">Line 1:</dt>
                          <dd>{address.address_line_1 || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">Line 2:</dt>
                          <dd>{address.address_line_2 || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <Map className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">City:</dt>
                          <dd>{address.city || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">State:</dt>
                          <dd>{address.state || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">Country:</dt>
                          <dd>{address.country || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <Pin className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">Pincode:</dt>
                          <dd>{address.pincode || 'N/A'}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;