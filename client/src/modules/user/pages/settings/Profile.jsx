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
} from 'lucide-react';

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
    pincode: ''
  });
  const [accountFormData, setAccountFormData] = useState({
    bank_name: '',
    ifsc_code: '',
    account_holder_name: '',
    account_number: '',
    linked_phone_number: '',
    upi_id: '',
    upi_number: '',
  });
  const [qrFile, setQrFile] = useState(null);
  const [addressErrors, setAddressErrors] = useState({});
  const [accountErrors, setAccountErrors] = useState({});
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);

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

      const fetchAccounts = async () => {
        try {
          const response = await axiosInstance.get(`/accounts/user/${user.id}`, {
            withCredentials: true,
          });
          setAccounts(response.data);
        } catch (error) {
          console.error('Failed to fetch accounts:', error);
          showToast('error', 'Failed to load account details');
        }
      };

      setIsLoading(true);
      Promise.all([fetchProfile(), fetchAddresses(), fetchAccounts()]).finally(() =>
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
        ...addressFormData
      }, { withCredentials: true });
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
    } catch (error) {
      console.error('Address update failed:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.statusText || 'Failed to update address';
      showToast('error', errorMessage);
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
      pincode: address.pincode || ''
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
      });
      setQrFile(null);
    } else {
      setAccountFormData({
        bank_name: '',
        ifsc_code: '',
        account_holder_name: '',
        account_number: '',
        linked_phone_number: '',
        upi_id: '',
        upi_number: '',
      });
      setQrFile(null);
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
    const formData = new FormData();
    Object.entries(accountFormData).forEach(([key, value]) => {
      if (value !== '') {
        formData.append(key, value);
      }
    });
    if (qrFile) {
      formData.append('qrcode', qrFile);
    }
    if (!selectedAccount) {
      formData.append('user_id', user.id);
    }

    try {
      let response;
      if (selectedAccount) {
        response = await axiosInstance.put(`/accounts/${selectedAccount._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        setAccounts(accounts.map(acc => acc._id === selectedAccount._id ? response.data : acc));
        showToast('success', 'Account updated successfully');
      } else {
        response = await axiosInstance.post(`/accounts`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        setAccounts([...accounts, response.data]);
        showToast('success', 'Account added successfully');
      }
      setAccountOpen(false);
    } catch (error) {
      console.error('Account operation failed:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.statusText || 'Failed to save account';
      showToast('error', errorMessage);
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
                                <Input
                                  id="qrcode"
                                  type="file"
                                  onChange={(e) => setQrFile(e.target.files[0])}
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
                                  <Label htmlFor="qrcode">QR Code Image (Upload new if needed)</Label>
                                  {selectedAccount?.qrcode && (
                                    <img
                                      src={selectedAccount.qrcode}
                                      alt="Current QR Code"
                                      className="w-32 h-32 object-contain mb-2"
                                    />
                                  )}
                                  <Input
                                    id="qrcode"
                                    type="file"
                                    onChange={(e) => setQrFile(e.target.files[0])}
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
                      <dl className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Banknote className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">Bank Name:</dt>
                          <dd>{account.bank_name || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">Account Number:</dt>
                          <dd>{account.account_number || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">IFSC Code:</dt>
                          <dd>{account.ifsc_code || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">Account Holder:</dt>
                          <dd>{account.account_holder_name || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">Linked Phone:</dt>
                          <dd>{account.linked_phone_number || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <Code className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">UPI ID:</dt>
                          <dd>{account.upi_id || 'N/A'}</dd>
                        </div>
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-32 font-medium">UPI Number:</dt>
                          <dd>{account.upi_number || 'N/A'}</dd>
                        </div>
                        {account.qrcode && (
                          <div>
                            <div className="flex items-center mb-2">
                              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                              <dt className="w-32 font-medium">QR Code:</dt>
                            </div>
                            <img
                              src={account.qrcode}
                              alt="UPI QR Code"
                              className="w-48 rounded-md shadow-sm"
                            />
                          </div>
                        )}
                      </dl>
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