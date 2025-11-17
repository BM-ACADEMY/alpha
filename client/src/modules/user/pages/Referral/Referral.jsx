import React, { useState, useEffect, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users as ReferralIcon, Wallet, CheckCircle, AlertCircle, Link as LinkIcon, Share2, RefreshCw, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { showToast } from '@/modules/common/toast/customToast';
import axiosInstance from '@/modules/common/lib/axios';
import { AuthContext } from '@/modules/common/context/AuthContext';

const ReferralPage = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referralData, setReferralData] = useState({
    referralCount: 0,
    referralEarnings: 0,
    referralCode: '',
    dailyReferralProfit: 0,
    monthlyReferralProfit: 0,
  });
  const [referredUsers, setReferredUsers] = useState([]);
  const [isAddingToWallet, setIsAddingToWallet] = useState(true);

  const fetchReferralData = async () => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      setIsLoading(false);
      showToast('error', 'User ID not found. Please log in again.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching data for userId:', userId);

      // Fetch dashboard data
      const dashboardResponse = await axiosInstance.get(
        `/users/user-dashboards/${userId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = dashboardResponse.data;
      console.log('Dashboard Response:', data);

      // Fetch user data
      const userResponse = await axiosInstance.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const fullUser = userResponse.data;
      console.log('User Response:', fullUser);

      // Fetch referred users
      const referralUsersResponse = await axiosInstance.get(
        `/users/fetch-all-users-details-referral?referred_by=${userId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      console.log('Referral Users Response:', referralUsersResponse.data);

      setReferralData({
        referralCount: data.referralCount || 0,
        referralEarnings: data.wallet?.referral_amount || 0,
        referralCode: fullUser.referral_code || '',
        dailyReferralProfit: data.dailyReferralProfit || 0,
        monthlyReferralProfit: data.monthlyReferralProfit || 0,
      });
      setReferredUsers(Array.isArray(referralUsersResponse.data) ? referralUsersResponse.data : []);
      setIsAddingToWallet(data.referralCount > 0);
      showToast('success', 'Referral data loaded successfully!');
    } catch (error) {
      console.error('Error fetching referral data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load referral data';
      setError(errorMessage);
      showToast('error', errorMessage);
      setIsAddingToWallet(false);
      setReferredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchReferralData();
  }, [userId]);

  const copyReferralLink = () => {
    if (!referralData.referralCode) {
      showToast('error', 'No referral code available');
      return;
    }
    const frontendDomain = import.meta.env.VITE_FRONTEND_URL;
    const referralLink = `${frontendDomain}/signup?ref=${referralData.referralCode}`;
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        showToast('success', 'Referral link copied to clipboard!');
      })
      .catch((error) => {
        console.error('Failed to copy referral link:', error);
        showToast('error', 'Failed to copy referral link');
      });
  };

  const shareReferralLink = async () => {
    if (!referralData.referralCode) {
      showToast('error', 'No referral code available');
      return;
    }
    const frontendDomain = import.meta.env.VITE_FRONTEND_URL;
    const referralLink = `${frontendDomain}/signup?ref=${referralData.referralCode}`;
    const shareData = {
      title: 'Join with my referral link!',
      text: 'Sign up using my referral link and start earning rewards!',
      url: referralLink,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('success', 'Referral link shared successfully!');
      } catch (error) {
        console.error('Error sharing referral link:', error);
        showToast('error', 'Failed to share referral link');
      }
    } else {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          showToast('success', 'Referral link copied to clipboard (sharing not supported)!');
        })
        .catch((error) => {
          console.error('Failed to copy referral link:', error);
          showToast('error', 'Failed to copy referral link');
        });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-[#0f1c3f] to-[#1a2a6c] text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold">Referral Dashboard</h1>
        {referralData.referralCode && (
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button
              onClick={copyReferralLink}
              className="flex items-center gap-2 bg-[#d09d42] text-white hover:bg-[#b88b3a] transition-colors duration-200"
              aria-label="Copy referral link"
            >
              <LinkIcon className="h-5 w-5" />
              Copy Link
            </Button>
            <Button
              onClick={shareReferralLink}
              className="flex items-center gap-2 bg-[#d09d42] text-white hover:bg-[#b88b3a] transition-colors duration-200"
              aria-label="Share referral link"
            >
              <Share2 className="h-5 w-5" />
              Share
            </Button>
            <Button
              onClick={fetchReferralData}
              className="flex items-center gap-2 bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-200"
              aria-label="Refresh referral data"
            >
              <RefreshCw className="h-5 w-5" />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border-red-300 shadow-md">
          <CardContent className="pt-6 flex items-center justify-between">
            <p className="text-red-700 font-medium">{error}</p>
            <Button
              onClick={fetchReferralData}
              className="bg-red-500 text-white hover:bg-red-600"
              aria-label="Retry fetching referral data"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))
        ) : (
          <>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Total Referrals</CardTitle>
                <ReferralIcon className="h-5 w-5 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#d09d42]">{referralData.referralCount}</div>
                <p className="text-sm text-gray-600 mt-1">Users referred by you</p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Total Referral Earnings</CardTitle>
                <Wallet className="h-5 w-5 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#d09d42]">{referralData.referralEarnings.toFixed(2)} INR</div>
                <p className="text-sm text-gray-600 mt-1">
                  {referralData.referralCount > 0
                    ? 'Accumulated from referred users\' profits'
                    : 'No referral earnings yet. Invite users to start earning!'}
                </p>
                {referralData.referralCount > 0 && (
                  <Badge variant="secondary" className="mt-2 bg-[#d09d42] text-white">
                    1% of referred users' daily profits
                  </Badge>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Adding to Wallet Status</CardTitle>
                {isAddingToWallet ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold text-gray-800">
                  {isAddingToWallet ? 'Working' : 'Not Working'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Referral earnings are added to your wallet daily at 12:00 AM (Asia/Kolkata).
                  {referralData.referralCount === 0
                    ? ' No earnings until you refer users.'
                    : ' Earnings are functioning as expected.'}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">Earning Breakdown</CardTitle>
                <DollarSign className="h-5 w-5 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Daily Referral Profit</p>
                    <p className="text-xl font-bold text-[#d09d42]">{referralData.dailyReferralProfit.toFixed(2)} INR</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Referral Profit (Est.)</p>
                    <p className="text-xl font-bold text-[#d09d42]">{referralData.monthlyReferralProfit.toFixed(2)} INR</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Daily profit is 1% of your referred users' daily profits. Monthly estimate assumes 30 days.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Referred Users Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Referred Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : error ? (
            <p className="text-sm text-red-600 font-medium">Error loading referred users: {error}</p>
          ) : referredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 font-semibold text-gray-800">Username</th>
                    <th className="p-3 font-semibold text-gray-800">Email</th>
                    <th className="p-3 font-semibold text-gray-800">Joined</th>
                    <th className="p-3 font-semibold text-gray-800">Plan Status</th>
                    <th className="p-3 font-semibold text-gray-800">Active Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.map((referredUser) => (
                    <tr
                      key={referredUser._id}
                      className="border-b hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="p-3">{referredUser.username || 'Unknown'}</td>
                      <td className="p-3">{referredUser.email || 'No email'}</td>
                      <td className="p-3">
                        {referredUser.created_at
                          ? new Date(referredUser.created_at).toLocaleDateString()
                          : 'Unknown'}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={referredUser.subscriptionStatus === 'Active' ? 'success' : 'destructive'}
                          className={referredUser.subscriptionStatus === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'}
                        >
                          {referredUser.subscriptionStatus || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-3">{referredUser.activePlan || 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No users have been referred yet. Share your referral link to invite users!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Referral Earnings Explanation */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">How Referral Earnings Work</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Earn <span className="font-semibold text-[#d09d42]">1% of the daily profit</span> from each active subscription of users you refer. Earnings are automatically added to your wallet daily at 12:00 AM (Asia/Kolkata). Start referring users to unlock rewards!
            {referralData.referralCount === 0 && (
              <span className="block mt-2 font-semibold text-[#d09d42]">
                Invite your first user to begin earning!
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralPage;