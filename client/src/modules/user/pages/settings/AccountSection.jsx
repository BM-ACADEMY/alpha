import React, { useState, useEffect } from 'react';
import { showToast } from '@/modules/common/toast/customToast';
import { Card, CardContent } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Banknote,
  CreditCard,
  Code,
  User as UserIcon,
  Phone,
  Edit,
  Trash2,
  Loader2,
  Copy,
  PlusCircle,
} from 'lucide-react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import axiosInstance from '@/modules/common/lib/axios';
import { getImageUrl } from '@/modules/admin/pages/settings/ImageUtils';

const AccountSection = ({ user, accounts, setAccounts, imagePreviews, setImagePreviews }) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountFormData, setAccountFormData] = useState({
    account_type: 'INR',
    bank_name: '',
    ifsc_code: '',
    account_holder_name: '',
    account_number: '',
    linked_phone_number: '',
    upi_id: '',
    upi_number: '',
    usdt_account_number: '',
    qrcode: null,
  });
  const [accountErrors, setAccountErrors] = useState({});
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);

  const validateAccountForm = () => {
    const newErrors = {};
    if (accountFormData.account_type === 'INR') {
      if (!accountFormData.bank_name.trim()) newErrors.bank_name = 'Bank Name is required';
      if (!accountFormData.ifsc_code.trim()) newErrors.ifsc_code = 'IFSC Code is required';
      if (!accountFormData.account_holder_name.trim()) newErrors.account_holder_name = 'Account Holder Name is required';
      if (!accountFormData.account_number.trim()) newErrors.account_number = 'Account Number is required';
      if (!accountFormData.linked_phone_number.trim()) newErrors.linked_phone_number = 'Linked Phone Number is required';
      if (accountFormData.upi_id && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(accountFormData.upi_id)) {
        newErrors.upi_id = 'Invalid UPI ID format';
      }
      if (accountFormData.upi_number && !/^\d{10}$/.test(accountFormData.upi_number)) {
        newErrors.upi_number = 'UPI Number must be 10 digits';
      }
    } else if (accountFormData.account_type === 'USDT') {
      if (!accountFormData.usdt_account_number.trim()) newErrors.usdt_account_number = 'USDT Account Number is required';
    }
    setAccountErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData((prev) => ({ ...prev, [name]: value }));
    if (accountErrors[name]) {
      setAccountErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAccountTypeChange = (value) => {
    setAccountFormData((prev) => ({
      ...prev,
      account_type: value,
      bank_name: value === 'USDT' ? '' : prev.bank_name,
      ifsc_code: value === 'USDT' ? '' : prev.ifsc_code,
      account_holder_name: value === 'USDT' ? '' : prev.account_holder_name,
      account_number: value === 'USDT' ? '' : prev.account_number,
      linked_phone_number: value === 'USDT' ? '' : prev.linked_phone_number,
      upi_id: value === 'USDT' ? '' : prev.upi_id,
      upi_number: value === 'USDT' ? '' : prev.upi_number,
      usdt_account_number: value === 'INR' ? '' : prev.usdt_account_number,
    }));
    setAccountErrors({});
  };

  const handleAccountFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (imagePreviews.qrcode) {
        URL.revokeObjectURL(imagePreviews.qrcode); // Clean up previous URL
      }
      setAccountFormData((prev) => ({ ...prev, qrcode: file }));
      setImagePreviews({
        ...imagePreviews,
        qrcode: URL.createObjectURL(file),
      });
    }
  };

  const handleImageDelete = async () => {
    if (!user?.id || !selectedAccount?.qrcode) {
      showToast('error', 'No image to delete or user ID missing');
      return;
    }
    try {
      await axiosInstance.delete('/profile-image/delete-image', {
        data: {
          entity_type: 'qr_code',
          user_id: user.id,
          filename: selectedAccount.qrcode.split('/').pop(),
        },
        withCredentials: true,
      });
      setAccountFormData((prev) => ({ ...prev, qrcode: null }));
      setImagePreviews((prev) => ({ ...prev, qrcode: null }));
      showToast('success', 'QR Code deleted successfully');
    } catch (error) {
      console.error('QR code delete failed:', error);
      showToast('error', 'Failed to delete QR code');
    }
  };

  const openAccountEdit = (account = null) => {
    setSelectedAccount(account);
    if (account) {
      setAccountFormData({
        account_type: account.account_type || 'INR',
        bank_name: account.bank_name || '',
        ifsc_code: account.ifsc_code || '',
        account_holder_name: account.account_holder_name || '',
        account_number: account.account_number || '',
        linked_phone_number: account.linked_phone_number || '',
        upi_id: account.upi_id || '',
        upi_number: account.upi_number || '',
        usdt_account_number: account.usdt_account_number || '',
        qrcode: null,
      });
      setImagePreviews({
        ...imagePreviews,
        qrcode: account.qrcodeUrl || null,
      });
    } else {
      setAccountFormData({
        account_type: 'INR',
        bank_name: '',
        ifsc_code: '',
        account_holder_name: '',
        account_number: '',
        linked_phone_number: '',
        upi_id: '',
        upi_number: '',
        usdt_account_number: '',
        qrcode: null,
      });
      setImagePreviews({ ...imagePreviews, qrcode: null });
    }
    setAccountErrors({});
    setAccountOpen(true);
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      showToast('error', 'You must be logged in with a valid user ID to submit account details');
      return;
    }
    if (!validateAccountForm()) {
      showToast('error', 'Please fill in all required fields correctly');
      return;
    }

    // Check account limits
    const hasINR = accounts.some((acc) => acc.account_type === 'INR');
    const hasUSDT = accounts.some((acc) => acc.account_type === 'USDT');
    if (!selectedAccount) {
      if (accountFormData.account_type === 'INR' && hasINR) {
        showToast('error', 'You can only have one INR account');
        return;
      }
      if (accountFormData.account_type === 'USDT' && hasUSDT) {
        showToast('error', 'You can only have one USDT account');
        return;
      }
    }

    setIsAccountSubmitting(true);
    let qrcodeUrl = selectedAccount?.qrcode || null;

    // Handle QR code upload/update
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
        setImagePreviews({ ...imagePreviews, qrcode: await getImageUrl(qrcodeUrl, user.id, 'qr_code') });
      } catch (error) {
        console.error('QR code upload failed:', error);
        showToast('error', `Failed to upload QR code: ${error.response?.data?.message || error.message}`);
        setIsAccountSubmitting(false);
        return;
      }
    } else if (imagePreviews.qrcode && !accountFormData.qrcode) {
      qrcodeUrl = imagePreviews.qrcode;
    }

    const formData = new FormData();
    formData.append('account_type', accountFormData.account_type);
    formData.append('user_id', user.id);
    if (accountFormData.account_type === 'INR') {
      ['bank_name', 'ifsc_code', 'account_holder_name', 'account_number', 'linked_phone_number', 'upi_id', 'upi_number'].forEach((key) => {
        if (accountFormData[key]) formData.append(key, accountFormData[key]);
      });
    } else {
      if (accountFormData.usdt_account_number) formData.append('usdt_account_number', accountFormData.usdt_account_number);
    }
    if (qrcodeUrl) {
      formData.append('qrcode', qrcodeUrl);
    }

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
        console.log(response);
        
        showToast('success', 'Account added successfully');
      }
      const accountsResponse = await axiosInstance.get(`/accounts/user/${user.id}`, {
        withCredentials: true,
      });
      const updatedAccounts = await Promise.all(
        accountsResponse.data.map(async (account) => ({
          ...account,
          qrcodeUrl: account.qrcode ? await getImageUrl(account.qrcode, user.id, 'qr_code') : null,
        }))
      );
      setAccounts(updatedAccounts);
      setAccountOpen(false);
      setAccountFormData({
        account_type: 'INR',
        bank_name: '',
        ifsc_code: '',
        account_holder_name: '',
        account_number: '',
        linked_phone_number: '',
        upi_id: '',
        upi_number: '',
        usdt_account_number: '',
        qrcode: null,
      });
      setImagePreviews({ ...imagePreviews, qrcode: null });
      setAccountErrors({});
    } catch (error) {
      console.error('Account operation failed:', error.response?.data || error.message);
      showToast('error', error.response?.data?.message || 'Failed to save account');
    } finally {
      setIsAccountSubmitting(false);
    }
  };

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      if (imagePreviews.qrcode) {
        URL.revokeObjectURL(imagePreviews.qrcode);
      }
    };
  }, [imagePreviews.qrcode]);

  return (
    <section className="mt-8">
      <h3 className="font-semibold text-lg mb-4 flex items-center">
        <Banknote className="mr-2 h-5 w-5" />
        Account Details
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {accounts.length === 0 ? (
          <Card className="shadow-sm relative">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">No account details added yet.</p>
              <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => openAccountEdit()}
                  >
                    <PlusCircle className="h-5 w-5" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Banknote className="h-6 w-6 text-blue-600" />
                      {selectedAccount ? 'Edit Account Details' : 'Add Account Details'}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedAccount ? 'Update your account details here.' : 'Add your account details here.'} Click save when you're done.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_type">Account Type <span className="text-red-500">*</span></Label>
                      <Select
                        name="account_type"
                        value={accountFormData.account_type}
                        onValueChange={handleAccountTypeChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {accountFormData.account_type === 'INR' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bank_name">Bank Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="bank_name"
                            name="bank_name"
                            value={accountFormData.bank_name}
                            onChange={handleAccountChange}
                            placeholder="Bank Name"
                            className={accountErrors.bank_name ? 'border-red-500' : ''}
                            aria-invalid={!!accountErrors.bank_name}
                            aria-describedby={accountErrors.bank_name ? 'bank_name-error' : undefined}
                          />
                          {accountErrors.bank_name && <p id="bank_name-error" className="text-red-500 text-sm">{accountErrors.bank_name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ifsc_code">IFSC Code <span className="text-red-500">*</span></Label>
                          <Input
                            id="ifsc_code"
                            name="ifsc_code"
                            value={accountFormData.ifsc_code}
                            onChange={handleAccountChange}
                            placeholder="IFSC Code"
                            className={accountErrors.ifsc_code ? 'border-red-500' : ''}
                            aria-invalid={!!accountErrors.ifsc_code}
                            aria-describedby={accountErrors.ifsc_code ? 'ifsc_code-error' : undefined}
                          />
                          {accountErrors.ifsc_code && <p id="ifsc_code-error" className="text-red-500 text-sm">{accountErrors.ifsc_code}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="account_holder_name">Account Holder Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="account_holder_name"
                            name="account_holder_name"
                            value={accountFormData.account_holder_name}
                            onChange={handleAccountChange}
                            placeholder="Account Holder Name"
                            className={accountErrors.account_holder_name ? 'border-red-500' : ''}
                            aria-invalid={!!accountErrors.account_holder_name}
                            aria-describedby={accountErrors.account_holder_name ? 'account_holder_name-error' : undefined}
                          />
                          {accountErrors.account_holder_name && <p id="account_holder_name-error" className="text-red-500 text-sm">{accountErrors.account_holder_name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="account_number">Account Number <span className="text-red-500">*</span></Label>
                          <Input
                            id="account_number"
                            name="account_number"
                            value={accountFormData.account_number}
                            onChange={handleAccountChange}
                            placeholder="Account Number"
                            className={accountErrors.account_number ? 'border-red-500' : ''}
                            aria-invalid={!!accountErrors.account_number}
                            aria-describedby={accountErrors.account_number ? 'account_number-error' : undefined}
                          />
                          {accountErrors.account_number && <p id="account_number-error" className="text-red-500 text-sm">{accountErrors.account_number}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linked_phone_number">Linked Phone Number <span className="text-red-500">*</span></Label>
                          <Input
                            id="linked_phone_number"
                            name="linked_phone_number"
                            value={accountFormData.linked_phone_number}
                            onChange={handleAccountChange}
                            placeholder="Linked Phone Number"
                            className={accountErrors.linked_phone_number ? 'border-red-500' : ''}
                            aria-invalid={!!accountErrors.linked_phone_number}
                            aria-describedby={accountErrors.linked_phone_number ? 'linked_phone_number-error' : undefined}
                          />
                          {accountErrors.linked_phone_number && <p id="linked_phone_number-error" className="text-red-500 text-sm">{accountErrors.linked_phone_number}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="upi_id">UPI ID</Label>
                          <Input
                            id="upi_id"
                            name="upi_id"
                            value={accountFormData.upi_id}
                            onChange={handleAccountChange}
                            placeholder="UPI ID"
                            className={accountErrors.upi_id ? 'border-red-500' : ''}
                            aria-invalid={!!accountErrors.upi_id}
                            aria-describedby={accountErrors.upi_id ? 'upi_id-error' : undefined}
                          />
                          {accountErrors.upi_id && <p id="upi_id-error" className="text-red-500 text-sm">{accountErrors.upi_id}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="upi_number">UPI Number</Label>
                          <Input
                            id="upi_number"
                            name="upi_number"
                            value={accountFormData.upi_number}
                            onChange={handleAccountChange}
                            placeholder="UPI Number"
                            className={accountErrors.upi_number ? 'border-red-500' : ''}
                            aria-invalid={!!accountErrors.upi_number}
                            aria-describedby={accountErrors.upi_number ? 'upi_number-error' : undefined}
                          />
                          {accountErrors.upi_number && <p id="upi_number-error" className="text-red-500 text-sm">{accountErrors.upi_number}</p>}
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
                                onClick={handleImageDelete}
                              >
                                <Trash2 className="h-4 w-4 text-white" />
                              </Button>
                            </div>
                          )}
                          <Input
                            id="qrcode"
                            type="file"
                            accept="image/*"
                            onChange={handleAccountFileChange}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="usdt_account_number">USDT Account Number <span className="text-red-500">*</span></Label>
                          <Input
                            id="usdt_account_number"
                            name="usdt_account_number"
                            value={accountFormData.usdt_account_number}
                            onChange={handleAccountChange}
                            placeholder="USDT Account Number"
                            className={accountErrors.usdt_account_number ? 'border-red-500' : ''}
                            aria-invalid={!!accountErrors.usdt_account_number}
                            aria-describedby={accountErrors.usdt_account_number ? 'usdt_account_number-error' : undefined}
                          />
                          {accountErrors.usdt_account_number && <p id="usdt_account_number-error" className="text-red-500 text-sm">{accountErrors.usdt_account_number}</p>}
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
                                onClick={handleImageDelete}
                              >
                                <Trash2 className="h-4 w-4 text-white" />
                              </Button>
                            </div>
                          )}
                          <Input
                            id="qrcode"
                            type="file"
                            accept="image/*"
                            onChange={handleAccountFileChange}
                          />
                        </div>
                      </div>
                    )}
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
            </CardContent>
          </Card>
        ) : (
          <>
            {accounts.map((account) => (
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
                          <div className="space-y-2">
                            <Label htmlFor="account_type">Account Type <span className="text-red-500">*</span></Label>
                            <Select
                              name="account_type"
                              value={accountFormData.account_type}
                              onValueChange={handleAccountTypeChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="INR">INR</SelectItem>
                                <SelectItem value="USDT">USDT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {accountFormData.account_type === 'INR' ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="bank_name">Bank Name <span className="text-red-500">*</span></Label>
                                <Input
                                  id="bank_name"
                                  name="bank_name"
                                  value={accountFormData.bank_name}
                                  onChange={handleAccountChange}
                                  placeholder="Bank Name"
                                  className={accountErrors.bank_name ? 'border-red-500' : ''}
                                  aria-invalid={!!accountErrors.bank_name}
                                  aria-describedby={accountErrors.bank_name ? 'bank_name-error' : undefined}
                                />
                                {accountErrors.bank_name && <p id="bank_name-error" className="text-red-500 text-sm">{accountErrors.bank_name}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="ifsc_code">IFSC Code <span className="text-red-500">*</span></Label>
                                <Input
                                  id="ifsc_code"
                                  name="ifsc_code"
                                  value={accountFormData.ifsc_code}
                                  onChange={handleAccountChange}
                                  placeholder="IFSC Code"
                                  className={accountErrors.ifsc_code ? 'border-red-500' : ''}
                                  aria-invalid={!!accountErrors.ifsc_code}
                                  aria-describedby={accountErrors.ifsc_code ? 'ifsc_code-error' : undefined}
                                />
                                {accountErrors.ifsc_code && <p id="ifsc_code-error" className="text-red-500 text-sm">{accountErrors.ifsc_code}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="account_holder_name">Account Holder Name <span className="text-red-500">*</span></Label>
                                <Input
                                  id="account_holder_name"
                                  name="account_holder_name"
                                  value={accountFormData.account_holder_name}
                                  onChange={handleAccountChange}
                                  placeholder="Account Holder Name"
                                  className={accountErrors.account_holder_name ? 'border-red-500' : ''}
                                  aria-invalid={!!accountErrors.account_holder_name}
                                  aria-describedby={accountErrors.account_holder_name ? 'account_holder_name-error' : undefined}
                                />
                                {accountErrors.account_holder_name && <p id="account_holder_name-error" className="text-red-500 text-sm">{accountErrors.account_holder_name}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="account_number">Account Number <span className="text-red-500">*</span></Label>
                                <Input
                                  id="account_number"
                                  name="account_number"
                                  value={accountFormData.account_number}
                                  onChange={handleAccountChange}
                                  placeholder="Account Number"
                                  className={accountErrors.account_number ? 'border-red-500' : ''}
                                  aria-invalid={!!accountErrors.account_number}
                                  aria-describedby={accountErrors.account_number ? 'account_number-error' : undefined}
                                />
                                {accountErrors.account_number && <p id="account_number-error" className="text-red-500 text-sm">{accountErrors.account_number}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="linked_phone_number">Linked Phone Number <span className="text-red-500">*</span></Label>
                                <Input
                                  id="linked_phone_number"
                                  name="linked_phone_number"
                                  value={accountFormData.linked_phone_number}
                                  onChange={handleAccountChange}
                                  placeholder="Linked Phone Number"
                                  className={accountErrors.linked_phone_number ? 'border-red-500' : ''}
                                  aria-invalid={!!accountErrors.linked_phone_number}
                                  aria-describedby={accountErrors.linked_phone_number ? 'linked_phone_number-error' : undefined}
                                />
                                {accountErrors.linked_phone_number && <p id="linked_phone_number-error" className="text-red-500 text-sm">{accountErrors.linked_phone_number}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="upi_id">UPI ID</Label>
                                <Input
                                  id="upi_id"
                                  name="upi_id"
                                  value={accountFormData.upi_id}
                                  onChange={handleAccountChange}
                                  placeholder="UPI ID"
                                  className={accountErrors.upi_id ? 'border-red-500' : ''}
                                  aria-invalid={!!accountErrors.upi_id}
                                  aria-describedby={accountErrors.upi_id ? 'upi_id-error' : undefined}
                                />
                                {accountErrors.upi_id && <p id="upi_id-error" className="text-red-500 text-sm">{accountErrors.upi_id}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="upi_number">UPI Number</Label>
                                <Input
                                  id="upi_number"
                                  name="upi_number"
                                  value={accountFormData.upi_number}
                                  onChange={handleAccountChange}
                                  placeholder="UPI Number"
                                  className={accountErrors.upi_number ? 'border-red-500' : ''}
                                  aria-invalid={!!accountErrors.upi_number}
                                  aria-describedby={accountErrors.upi_number ? 'upi_number-error' : undefined}
                                />
                                {accountErrors.upi_number && <p id="upi_number-error" className="text-red-500 text-sm">{accountErrors.upi_number}</p>}
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
                                      onClick={handleImageDelete}
                                    >
                                      <Trash2 className="h-4 w-4 text-white" />
                                    </Button>
                                  </div>
                                )}
                                <Input
                                  id="qrcode"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAccountFileChange}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="usdt_account_number">USDT Account Number <span className="text-red-500">*</span></Label>
                                <Input
                                  id="usdt_account_number"
                                  name="usdt_account_number"
                                  value={accountFormData.usdt_account_number}
                                  onChange={handleAccountChange}
                                  placeholder="USDT Account Number"
                                  className={accountErrors.usdt_account_number ? 'border-red-500' : ''}
                                  aria-invalid={!!accountErrors.usdt_account_number}
                                  aria-describedby={accountErrors.usdt_account_number ? 'usdt_account_number-error' : undefined}
                                />
                                {accountErrors.usdt_account_number && <p id="usdt_account_number-error" className="text-red-500 text-sm">{accountErrors.usdt_account_number}</p>}
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
                                      onClick={handleImageDelete}
                                    >
                                      <Trash2 className="h-4 w-4 text-white" />
                                    </Button>
                                  </div>
                                )}
                                <Input
                                  id="qrcode"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleAccountFileChange}
                                />
                              </div>
                            </div>
                          )}
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
                    <dl className="flex-1 divide-y divide-gray-200 rounded-lg border border-gray-200">
                      {(account.account_type === 'INR'
                        ? [
                            { label: 'Bank Name', value: account.bank_name, icon: Banknote },
                            { label: 'Account Number', value: account.account_number, icon: CreditCard },
                            { label: 'IFSC Code', value: account.ifsc_code, icon: Code },
                            { label: 'Holder Name', value: account.account_holder_name, icon: UserIcon },
                            { label: 'Linked Phone', value: account.linked_phone_number, icon: Phone },
                            { label: 'UPI ID', value: account.upi_id, icon: Code },
                            { label: 'UPI Number', value: account.upi_number, icon: Phone },
                          ]
                        : [
                            { label: 'USDT Account Number', value: account.usdt_account_number, icon: CreditCard },
                          ]
                      ).map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-gray-100 px-4 py-3 text-sm"
                        >
                          <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <dt className="w-36 font-medium">{item.label}:</dt>
                          <dd className="flex-1 flex items-center justify-between">
                            <span>{item.value || 'N/A'}</span>
                            {item.value && (
                              <Copy
                                className="ml-2 h-4 w-4 cursor-pointer text-gray-400 hover:text-blue-600"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.value);
                                  showToast('success', `${item.label} copied to clipboard`);
                                }}
                              />
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {account.qrcodeUrl && (
                      <div className="flex flex-col items-center lg:items-start">
                        <span className="text-sm font-medium mb-2">QR Code ({account.account_type}):</span>
                        <Zoom>
                          <img
                            src={account.qrcodeUrl}
                            alt={`${account.account_type} QR Code`}
                            className="w-[200px] h-[200px] object-contain border rounded-lg shadow cursor-pointer"
                            onError={(e) => {
                              console.error(`Failed to load ${account.account_type} qrcode:`, e);
                              e.target.src = '/fallback-image.png';
                            }}
                          />
                        </Zoom>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {accounts.length < 2 && (
              <div className="mt-4">
                <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => openAccountEdit()}
                    >
                      <PlusCircle className="h-5 w-5" />
                      Add New Account
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
                      <div className="space-y-2">
                        <Label htmlFor="account_type">Account Type <span className="text-red-500">*</span></Label>
                        <Select
                          name="account_type"
                          value={accountFormData.account_type}
                          onValueChange={handleAccountTypeChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            {!accounts.some((acc) => acc.account_type === 'INR') && (
                              <SelectItem value="INR">INR</SelectItem>
                            )}
                            {!accounts.some((acc) => acc.account_type === 'USDT') && (
                              <SelectItem value="USDT">USDT</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {accountFormData.account_type === 'INR' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bank_name">Bank Name <span className="text-red-500">*</span></Label>
                            <Input
                              id="bank_name"
                              name="bank_name"
                              value={accountFormData.bank_name}
                              onChange={handleAccountChange}
                              placeholder="Bank Name"
                              className={accountErrors.bank_name ? 'border-red-500' : ''}
                              aria-invalid={!!accountErrors.bank_name}
                              aria-describedby={accountErrors.bank_name ? 'bank_name-error' : undefined}
                            />
                            {accountErrors.bank_name && <p id="bank_name-error" className="text-red-500 text-sm">{accountErrors.bank_name}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ifsc_code">IFSC Code <span className="text-red-500">*</span></Label>
                            <Input
                              id="ifsc_code"
                              name="ifsc_code"
                              value={accountFormData.ifsc_code}
                              onChange={handleAccountChange}
                              placeholder="IFSC Code"
                              className={accountErrors.ifsc_code ? 'border-red-500' : ''}
                              aria-invalid={!!accountErrors.ifsc_code}
                              aria-describedby={accountErrors.ifsc_code ? 'ifsc_code-error' : undefined}
                            />
                            {accountErrors.ifsc_code && <p id="ifsc_code-error" className="text-red-500 text-sm">{accountErrors.ifsc_code}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="account_holder_name">Account Holder Name <span className="text-red-500">*</span></Label>
                            <Input
                              id="account_holder_name"
                              name="account_holder_name"
                              value={accountFormData.account_holder_name}
                              onChange={handleAccountChange}
                              placeholder="Account Holder Name"
                              className={accountErrors.account_holder_name ? 'border-red-500' : ''}
                              aria-invalid={!!accountErrors.account_holder_name}
                              aria-describedby={accountErrors.account_holder_name ? 'account_holder_name-error' : undefined}
                            />
                            {accountErrors.account_holder_name && <p id="account_holder_name-error" className="text-red-500 text-sm">{accountErrors.account_holder_name}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="account_number">Account Number <span className="text-red-500">*</span></Label>
                            <Input
                              id="account_number"
                              name="account_number"
                              value={accountFormData.account_number}
                              onChange={handleAccountChange}
                              placeholder="Account Number"
                              className={accountErrors.account_number ? 'border-red-500' : ''}
                              aria-invalid={!!accountErrors.account_number}
                              aria-describedby={accountErrors.account_number ? 'account_number-error' : undefined}
                            />
                            {accountErrors.account_number && <p id="account_number-error" className="text-red-500 text-sm">{accountErrors.account_number}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="linked_phone_number">Linked Phone Number <span className="text-red-500">*</span></Label>
                            <Input
                              id="linked_phone_number"
                              name="linked_phone_number"
                              value={accountFormData.linked_phone_number}
                              onChange={handleAccountChange}
                              placeholder="Linked Phone Number"
                              className={accountErrors.linked_phone_number ? 'border-red-500' : ''}
                              aria-invalid={!!accountErrors.linked_phone_number}
                              aria-describedby={accountErrors.linked_phone_number ? 'linked_phone_number-error' : undefined}
                            />
                            {accountErrors.linked_phone_number && <p id="linked_phone_number-error" className="text-red-500 text-sm">{accountErrors.linked_phone_number}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="upi_id">UPI ID</Label>
                            <Input
                              id="upi_id"
                              name="upi_id"
                              value={accountFormData.upi_id}
                              onChange={handleAccountChange}
                              placeholder="UPI ID"
                              className={accountErrors.upi_id ? 'border-red-500' : ''}
                              aria-invalid={!!accountErrors.upi_id}
                              aria-describedby={accountErrors.upi_id ? 'upi_id-error' : undefined}
                            />
                            {accountErrors.upi_id && <p id="upi_id-error" className="text-red-500 text-sm">{accountErrors.upi_id}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="upi_number">UPI Number</Label>
                            <Input
                              id="upi_number"
                              name="upi_number"
                              value={accountFormData.upi_number}
                              onChange={handleAccountChange}
                              placeholder="UPI Number"
                              className={accountErrors.upi_number ? 'border-red-500' : ''}
                              aria-invalid={!!accountErrors.upi_number}
                              aria-describedby={accountErrors.upi_number ? 'upi_number-error' : undefined}
                            />
                            {accountErrors.upi_number && <p id="upi_number-error" className="text-red-500 text-sm">{accountErrors.upi_number}</p>}
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
                                  onClick={handleImageDelete}
                                >
                                  <Trash2 className="h-4 w-4 text-white" />
                                </Button>
                              </div>
                            )}
                            <Input
                              id="qrcode"
                              type="file"
                              accept="image/*"
                              onChange={handleAccountFileChange}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="usdt_account_number">USDT Account Number <span className="text-red-500">*</span></Label>
                            <Input
                              id="usdt_account_number"
                              name="usdt_account_number"
                              value={accountFormData.usdt_account_number}
                              onChange={handleAccountChange}
                              placeholder="USDT Account Number"
                              className={accountErrors.usdt_account_number ? 'border-red-500' : ''}
                              aria-invalid={!!accountErrors.usdt_account_number}
                              aria-describedby={accountErrors.usdt_account_number ? 'usdt_account_number-error' : undefined}
                            />
                            {accountErrors.usdt_account_number && <p id="usdt_account_number-error" className="text-red-500 text-sm">{accountErrors.usdt_account_number}</p>}
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
                                  onClick={handleImageDelete}
                                >
                                  <Trash2 className="h-4 w-4 text-white" />
                                </Button>
                              </div>
                            )}
                            <Input
                              id="qrcode"
                              type="file"
                              accept="image/*"
                              onChange={handleAccountFileChange}
                            />
                          </div>
                        </div>
                      )}
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
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default AccountSection;