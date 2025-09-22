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
import { useNavigate } from 'react-router-dom';

const WalletPage = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [accountType, setAccountType] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(null);

  // Fetch wallet data
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await axiosInstance.get(`/redeem/wallet/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setWallet(response.data);
      } catch (error) {
        console.error('Fetch wallet error:', error);
        showToast('error', 'Failed to fetch wallet data');
      }
    };
    if (userId) fetchWallet();
  }, [userId]);

  // Fetch user profile to check KYC details and admin verification
  useEffect(() => {
    if (!userId) {
      showToast('error', 'User not logged in');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        showToast('error', 'Failed to load profile data');
      }
    };

    fetchProfile();
  }, [userId]);

  // Calculate available profit
  const availableProfit = wallet ? wallet.totalWalletPoint - wallet.userPlanCapitalAmount : 0;

  // Handle redeem amount change with validation
  const handleAmountChange = (value) => {
    setRedeemAmount(value);
    if (!value || parseFloat(value) <= 0) {
      setError('Please enter a valid amount');
    } else if (wallet && parseFloat(value) > availableProfit) {
      setError(`Amount cannot exceed available profit (${availableProfit.toFixed(2)} INR)`);
    } else if (accountType === 'INR' && parseFloat(value) < 1000) {
      setError('Minimum redeem amount is 1000 INR');
    } else if (accountType === 'USDT' && parseFloat(value) < 10) {
      setError('Minimum redeem amount is 10 USDT');
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
    if (parseFloat(redeemAmount) > availableProfit) {
      setError(`Amount cannot exceed available profit (${availableProfit.toFixed(2)} INR)`);
      return;
    }
    if (accountType === 'INR' && parseFloat(redeemAmount) < 1000) {
      setError('Minimum redeem amount is 1000 INR');
      return;
    }
    if (accountType === 'USDT' && parseFloat(redeemAmount) < 10) {
      setError('Minimum redeem amount is 10 USDT');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(
        '/redeem/redeem-amount',
        { user_id: userId, redeem_amount: parseFloat(redeemAmount), accountType },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      showToast('success', 'Redeem request submitted successfully');
      setIsModalOpen(false);
      setRedeemAmount('');
      setAccountType('INR');
      setError('');

      // Refresh wallet data
      const updatedWallet = await axiosInstance.get(`/redeem/wallet/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setWallet(updatedWallet.data);
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to submit redeem request');
    } finally {
      setLoading(false);
    }
  };

  // Handle redeem button click with KYC and admin verification check
  const handleOpenRedeemDialog = () => {
    // Check KYC details
    if (
      !profileData?.pan_number ||
      !profileData?.pan_image ||
      !profileData?.aadhar_number ||
      !profileData?.aadhar_image
    ) {
      showToast('error', 'Please complete your KYC verification first');
      setTimeout(() => {
        navigate('/user-dashboard/profile');
      }, 2000);
      return;
    }

    // Check admin verification
    if (!profileData?.verified_by_admin) {
      showToast('error', 'Account must be verified by admin. Wait 24-48 hrs.');
      return;
    }

    // Open the modal with instructions
    setShowInstructions(true);
    setIsModalOpen(true);
  };

  if (!wallet) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 text-blue-500 mr-2 animate-spin" />
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
          <p className="text-lg font-semibold">{wallet.userPlanCapitalAmount.toFixed(2)} INR</p>
        </div>
        <div className="border p-4 rounded-md bg-gray-50">
          <Label className="text-sm text-gray-500">Daily Profit Amount</Label>
          <p className="text-lg font-semibold">{wallet.dailyProfitAmount.toFixed(2)} INR</p>
        </div>
        <div className="border p-4 rounded-md bg-gray-50">
          <Label className="text-sm text-gray-500">Total Wallet Points</Label>
          <p className="text-lg font-semibold">{wallet.totalWalletPoint.toFixed(2)} INR</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-gray-700">
          <strong>Redeemable Amount:</strong> You can redeem up to{' '}
          <strong>{availableProfit.toFixed(2)} INR</strong> from your accumulated profit.
          {availableProfit < 1000 && accountType === 'INR' && (
            <span className="text-red-600 block mt-1">
              Your accumulated profit ({availableProfit.toFixed(2)} INR) is below the minimum redeem amount of 1000 INR. 
              Please wait for more profit to accumulate or increase your investment.
            </span>
          )}
          {availableProfit < 10 && accountType === 'USDT' && (
            <span className="text-red-600 block mt-1">
              Your accumulated profit ({availableProfit.toFixed(2)} INR) is below the minimum redeem amount of 10 USDT. 
              Please wait for more profit to accumulate or increase your investment.
            </span>
          )}
        </p>
      </div>

      <Button
        disabled={(accountType === 'INR' && availableProfit < 1000) || (accountType === 'USDT' && availableProfit < 10)}
        onClick={handleOpenRedeemDialog}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <Send className="h-5 w-5 mr-2" />
        Redeem Amount
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-6">
          {showInstructions ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">Withdrawal Instructions</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4 text-sm text-gray-700">
                <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
                  <h3 className="font-semibold text-lg text-indigo-600 mb-2">INR Withdrawal Policy</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Payout Time:</strong> Within 0 to 7 days from withdrawal request</li>
                    <li><strong>Request Days:</strong> Any day (Monday to Sunday)</li>
                    <li><strong>Limit:</strong> 1 withdrawal per investor per day</li>
                    <li><strong>Minimum Withdrawal:</strong> ₹1,000</li>
                    <li><strong>Maximum Limit:</strong> No maximum limit</li>
                    <li><strong>Payout Mode:</strong> Bank Transfer (NEFT / IMPS / RTGS)</li>
                    <li><strong>Withdrawal Fee:</strong> 3%</li>
                    <li><strong>Platform Fee:</strong> 2%</li>
                    <li><strong>Total Fee:</strong> 5% deducted from withdrawal amount</li>
                    <li><strong>Queue:</strong> First-Come, First-Serve</li>
                    <li><strong>Example:</strong> ₹10,000 request &gt; ₹500 fees &gt; ₹9,500 credited</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
                  <h3 className="font-semibold text-lg text-green-600 mb-2">USDT Withdrawal Policy</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Payout Time:</strong> Within 0 to 7 days</li>
                    <li><strong>Request Days:</strong> Any day (24/7)</li>
                    <li><strong>Limit:</strong> 1 withdrawal per day per wallet</li>
                    <li><strong>Minimum Withdrawal:</strong> 10 USDT</li>
                    <li><strong>Maximum Limit:</strong> No maximum limit</li>
                    <li><strong>Payout Mode:</strong> USDT (TRC20) Wallet</li>
                    <li><strong>Fees:</strong> No withdrawal or platform fees</li>
                    <li><strong>Requirement:</strong> Wallet must be verified during onboarding</li>
                  </ul>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button onClick={() => setShowInstructions(false)} className="w-full">
                  Proceed to Redeem
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Redeem Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="redeemAmount" className="block text-sm font-medium text-gray-700">
                    Redeem Amount (Max: {availableProfit.toFixed(2)} INR)
                  </Label>
                  <Input
                    id="redeemAmount"
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder={accountType === 'INR' ? 'Enter amount (min 1000 INR)' : 'Enter amount (min 10 USDT)'}
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
                  <Select value={accountType} onValueChange={(value) => {
                    setAccountType(value);
                    handleAmountChange(redeemAmount); // Re-validate amount when account type changes
                  }}>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;