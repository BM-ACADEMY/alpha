import React, { useState, useEffect, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users as ReferralIcon, Wallet, CheckCircle, AlertCircle, Link as LinkIcon, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { showToast } from '@/modules/common/toast/customToast';
import axiosInstance from '@/modules/common/lib/axios';
import { AuthContext } from '@/modules/common/context/AuthContext';

const ReferralPage = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const [isLoading, setIsLoading] = useState(true);
  const [referralData, setReferralData] = useState({
    referralCount: 0,
    referralEarnings: 0,
    referralCode: '',
  });
  const [isAddingToWallet, setIsAddingToWallet] = useState(true);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        setIsLoading(true);
        const dashboardResponse = await axiosInstance.get(
          `/users/user-dashboards/${userId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        const data = dashboardResponse.data;

        const userResponse = await axiosInstance.get(`/users/${userId}`);
        const fullUser = userResponse.data;

        setReferralData({
          referralCount: data.referralCount || 0,
          referralEarnings: data.wallet?.referral_amount || 0,
          referralCode: fullUser.referral_code || '',
        });
        setIsAddingToWallet(data.referralCount > 0);
        showToast('success', 'Referral data loaded successfully!');
      } catch (error) {
        console.error('Error fetching referral data:', error);
        showToast('error', error.response?.data?.message || 'Failed to load referral data');
        setIsAddingToWallet(false);
      } finally {
        setIsLoading(false);
      }
    };

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
      // Fallback to copying the link
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">Your Referrals</h1>
        {referralData.referralCode && (
          <div className="flex gap-2">
            <Button
              onClick={copyReferralLink}
              className="flex items-center gap-2 bg-[#d09d42] text-[white] hover:bg-[#b88b3a]"
            >
              <LinkIcon className="h-4 w-4" />
              Invite Link
            </Button>
            <Button
              onClick={shareReferralLink}
              className="flex items-center gap-2 bg-[#d09d42] text-[white] hover:bg-[#b88b3a]"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <ReferralIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralData.referralCount}</div>
                <p className="text-sm text-muted-foreground">Users referred by you</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referral Earnings</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralData.referralEarnings.toFixed(2)} INR</div>
                <p className="text-sm text-muted-foreground">
                  {referralData.referralCount > 0
                    ? 'Accumulated from referred users\' profits'
                    : 'No referral earnings yet. Invite users to start earning!'}
                </p>
                {referralData.referralCount > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    Earnings are 1% of referred users' daily profits
                  </Badge>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Adding to Wallet Status</CardTitle>
                {isAddingToWallet ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {isAddingToWallet ? 'Working' : 'Not Working'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Referral earnings are automatically added to your wallet daily at 12:00 AM (Asia/Kolkata).
                  {referralData.referralCount === 0
                    ? ' No earnings until you refer users.'
                    : ' Earnings are functioning as expected.'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Referral Earnings Explanation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You earn 1% of the daily profit from each active subscription of users you referred.
            Earnings are added to your wallet daily at 12:00 AM (Asia/Kolkata). If you haven't referred any users, you won't earn referral profits.
            {referralData.referralCount === 0 && (
              <span className="font-semibold"> Start referring users to earn rewards!</span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralPage;