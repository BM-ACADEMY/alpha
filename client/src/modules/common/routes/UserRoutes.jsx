import PrivateRoute from '@/modules/common/context/PrivateRoute';
import UserDashboard from '@/modules/user/pages/dashboard/Dashboard';
import UserEarnings from '@/modules/user/pages/earnings/Earnings';
import UserPlans from '@/modules/user/pages/plans/Plans';
import UserWallet from '@/modules/user/pages/wallet/Wallet';
import UserProfile from '@/modules/user/pages/settings/Profile';


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
        <UserProfile />
      </PrivateRoute>
    ),
  },

];