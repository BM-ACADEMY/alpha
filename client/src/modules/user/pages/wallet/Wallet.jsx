
import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Wallet, Send, AlertCircle, Loader2 } from 'lucide-react';
import axiosInstance from '@/modules/common/lib/axios';
import { showToast } from '@/modules/common/toast/customToast';
import { Label } from '@/components/ui/label';
import { AuthContext } from '@/modules/common/context/AuthContext';

const WalletPage = () => {
  const {user}=useContext(AuthContext);
  const userId=user?.id
  const [wallet, setWallet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [accountType, setAccountType] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch wallet data
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await axiosInstance.get(`/redeem/wallet/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setWallet(response.data);
      } catch (error) {
        showToast('error', 'Failed to fetch wallet data');
      }
    };
    fetchWallet();
  }, [userId]);

  // Handle redeem amount change with validation
  const handleAmountChange = (value) => {
    setRedeemAmount(value);
    if (!value || parseFloat(value) <= 0) {
      setError('Please enter a valid amount');
    } else if (wallet && parseFloat(value) > wallet.dailyProfitAmount) {
      setError('Amount exceeds available daily profit');
    } else {
      setError('');
    }
  };

  // Handle redeem request
  const handleRedeem = async () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (parseFloat(redeemAmount) > wallet.dailyProfitAmount) {
      setError('Amount exceeds available daily profit');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        '/redeem/redeem-amount',
        { user_id: userId, redeem_amount: parseFloat(redeemAmount), accountType },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      showToast('success', 'Redeem request submitted successfully');
      setIsModalOpen(false);
      setRedeemAmount('');
      setAccountType('INR');
      setError('');
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to submit redeem request');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="flex items-center justify-center p-6">
        <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
        <p>Loading wallet data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Wallet className="h-6 w-6 mr-2 text-blue-600" />
        Wallet Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="border p-4 rounded-md bg-gray-50">
          <Label className="text-sm text-gray-500">User</Label>
          <p className="text-lg font-semibold">
            {wallet.user_id?.username || 'N/A'} ({wallet.user_id?.email || 'N/A'})
          </p>
        </div>
        <div className="border p-4 rounded-md bg-gray-50">
          <Label className="text-sm text-gray-500">Capital Amount</Label>
          <p className="text-lg font-semibold">{wallet.userPlanCapitalAmount.toFixed(2)}</p>
        </div>
        <div className="border p-4 rounded-md bg-gray-50">
          <Label className="text-sm text-gray-500">Daily Profit Amount</Label>
          <p className="text-lg font-semibold">{wallet.dailyProfitAmount.toFixed(2)}</p>
        </div>
        <div className="border p-4 rounded-md bg-gray-50">
          <Label className="text-sm text-gray-500">Total Wallet Points</Label>
          <p className="text-lg font-semibold">{wallet.totalWalletPoint.toFixed(2)}</p>
        </div>
      </div>
      <Button
        disabled={wallet.dailyProfitAmount < 1000}
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <Send className="h-5 w-5 mr-2" />
        Redeem Amount
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Redeem Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="redeemAmount" className="block text-sm font-medium text-gray-700">
                Redeem Amount
              </Label>
              <Input
                id="redeemAmount"
                type="number"
                value={redeemAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
                className="mt-1"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby="redeemAmount-error"
              />
              {error && (
                <p id="redeemAmount-error" className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                Account Type
              </Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger id="accountType" className="mt-1">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setRedeemAmount('');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={loading || !redeemAmount || redeemAmount <= 0 || error}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Request Amount'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;
