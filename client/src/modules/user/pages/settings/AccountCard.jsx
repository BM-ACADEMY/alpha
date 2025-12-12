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
  Banknote,
  CreditCard,
  Code,
  User as UserIcon,
  Phone,
  Edit,
  Loader2,
  Trash2,
} from 'lucide-react';
import axiosInstance from '@/modules/common/lib/axios';

const AccountCard = ({ accounts, setAccounts, user, imagePreviews, setImagePreviews, isImageUploading, handleImageDelete }) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
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
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData((prev) => ({ ...prev, [name]: value }));
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

  const getImageUrl = async (filePath, entityType = 'user') => {
    if (!filePath || !user?.id) {
      console.warn('getImageUrl: Missing filePath or user ID', { filePath, userId: user?.id });
      return '/fallback-image.png';
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

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
      showToast('error', 'You must be logged in with a valid user ID to submit account details');
      return;
    }
    setIsAccountSubmitting(true);
    let qrcodeUrl = selectedAccount?.qrcode || null;

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
        accountsResponse.data?.map(async (account) => ({
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

  return (
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
          accounts?.map((account) => (
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
                  <dl className="flex-1 divide-y divide-gray-200 rounded-lg border border-gray-200">
                    {[
                      { label: "Bank Name", value: account.bank_name, icon: Banknote },
                      { label: "Account Number", value: account.account_number, icon: CreditCard },
                      { label: "IFSC Code", value: account.ifsc_code, icon: Code },
                      { label: "Holder Name", value: account.account_holder_name, icon: UserIcon },
                      { label: "Linked Phone", value: account.linked_phone_number, icon: Phone },
                      { label: "UPI ID", value: account.upi_id, icon: Code },
                      { label: "UPI Number", value: account.upi_number, icon: Phone },
                    ]?.map((item, index) => (
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
                  {account.qrcodeUrl && (
                    <div className="flex flex-col items-center lg:items-start">
                      <span className="text-sm font-medium mb-2">QR Code:</span>
                      <img
                        src={account.qrcodeUrl}
                        alt="QR Code"
                        className="w-[200px] h-[200px] object-contain border rounded-lg shadow"
                        onError={(e) => {
                          console.error("Failed to load account qrcode:", e);
                          e.target.src = "/fallback-image.png";
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
  );
};

export default AccountCard;
