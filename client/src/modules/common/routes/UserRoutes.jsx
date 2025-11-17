import PrivateRoute from '@/modules/common/context/PrivateRoute';
import UserDashboard from '@/modules/user/pages/dashboard/Dashboard';
import UserEarnings from '@/modules/user/pages/Complaint/Complaint';
import UserPlans from '@/modules/user/pages/plans/Plans';
import UserWallet from '@/modules/user/pages/wallet/Wallet';
import UserProfile from '@/modules/user/pages/settings/UserProfile';
import Profile from '@/modules/user/pages/settings/Profile';
import Subscription from '@/modules/user/pages/Subscription/Subscription';
import HistoryPage from '@/modules/user/pages/History/History';
import ReferralPage from '@/modules/user/pages/Referral/Referral';
import Socialmedia from '@/modules/user/pages/Socialmedia/Socialmedia';


export const userRoutes = [
  {
    path: '/user-dashboard',
    element: (
      <PrivateRoute allowedRole="user">
        <UserDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/user-dashboard/earnings',
    element: (
      <PrivateRoute allowedRole="user">
        <UserEarnings />
      </PrivateRoute>
    ),
  },
  {
    path: '/user-dashboard/plans',
    element: (
      <PrivateRoute allowedRole="user">
        <UserPlans />
      </PrivateRoute>
    ),
  },
  {
    path: '/user-dashboard/subscription',
    element: (
      <PrivateRoute allowedRole="user">
        <Subscription />
      </PrivateRoute>
    ),
  },
  {
    path: '/user-dashboard/wallet',
    element: (
      <PrivateRoute allowedRole="user">
        <UserWallet />
      </PrivateRoute>
    ),
  },
  {
    path: '/user-dashboard/profile',
    element: (
      <PrivateRoute allowedRole="user">
        <Profile />
      </PrivateRoute>
    ),
  },
  {
    path: '/user-dashboard/history',
    element: (
      <PrivateRoute allowedRole="user">
        <HistoryPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/user-dashboard/referral',
    element: (
      <PrivateRoute allowedRole="user">
        <ReferralPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/user-dashboard/social',
    element: (
      <PrivateRoute allowedRole="user">
        <Socialmedia />
      </PrivateRoute>
    ),
  },

];