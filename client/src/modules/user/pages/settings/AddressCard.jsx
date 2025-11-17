import React, { useState } from 'react';
import { showToast } from '@/modules/common/toast/customToast';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
  Home,
  Building,
  Map,
  MapPin,
  Globe,
  Pin,
  Edit,
  Loader2,
} from 'lucide-react';
import axiosInstance from '@/modules/common/lib/axios';

const AddressCard = ({ addresses, setAddresses, user }) => {
  const [addressOpen, setAddressOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [isAddressSubmitting, setIsAddressSubmitting] = useState(false);

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

  return (
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
  );
};

export default AddressCard;