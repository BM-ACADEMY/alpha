import React, { useState, useEffect, useContext } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users as ReferralIcon, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
        console.log(data,'fsdfaslfjlsd');

        // Ensure referralEarnings is set from wallet.referral_amount
        setReferralData({
          referralCount: data.referralCount || 0,
          referralEarnings: data.wallet?.referral_amount || 0, // Use referral_amount from wallet
        });
        setIsAddingToWallet(data.referralCount > 0); // Update based on referral count
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">Your Referrals</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
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