import PrivateRoute from '@/modules/common/context/PrivateRoute';
import AdminDashboard from '@/modules/admin/pages/dashboard/Dashboard';
import AdminUsers from '@/modules/admin/pages/users/Users';
import AdminPayments from '@/modules/admin/pages/payments/Payments';
import AdminPoints from '@/modules/admin/pages/points/Points';
import AdminReports from '@/modules/admin/pages/reports/Reports';
import AdminPlans from '@/modules/admin/pages/plans/Plans';
import AdminProfile from '@/modules/admin/pages/settings/Profile';
import PercentageManager from '@/modules/admin/pages/profit-percentage/PercentageManager';
import ComplaintsTable from '@/modules/admin/pages/complaint/ComplaintsTable';
import Profile from '@/modules/admin/pages/settings/Profile';
import AdminRedeemRequests from '@/modules/admin/pages/redeem/AdminRedeemRequests';
import UserVerificationTabs from '@/modules/admin/pages/verified/VerifiedUser';
import Social from '@/modules/admin/pages/Social/Social';
import Blogs from '@/modules/admin/pages/blogs/blogs';

export const adminRoutes = [
  {
    path: '/admin-dashboard',
    element: (
      <PrivateRoute allowedRole="admin">
        <AdminDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/users',
    element: (
      <PrivateRoute allowedRole="admin">
        <AdminUsers />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/payments',
    element: (
      <PrivateRoute allowedRole="admin">
        <AdminPayments />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/points',
    element: (
      <PrivateRoute allowedRole="admin">
        <AdminPoints />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/profit-percentage',
    element: (
      <PrivateRoute allowedRole="admin">
        <PercentageManager />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/reports',
    element: (
      <PrivateRoute allowedRole="admin">
        <AdminReports />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/plans',
    element: (
      <PrivateRoute allowedRole="admin">
        <AdminPlans />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/profile',
    element: (
      <PrivateRoute allowedRole="admin">
        <AdminProfile />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/complaint',
    element: (
      <PrivateRoute allowedRole="admin">
        <ComplaintsTable />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/settings',
    element: (
      <PrivateRoute allowedRole="admin">
        <Profile />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/redeem',
    element: (
      <PrivateRoute allowedRole="admin">
        <AdminRedeemRequests />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/user-verified',
    element: (
      <PrivateRoute allowedRole="admin">
        <UserVerificationTabs />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/user-verified',
    element: (
      <PrivateRoute allowedRole="admin">
        <UserVerificationTabs />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/socialmedia',
    element: (
      <PrivateRoute allowedRole="admin">
        <Social />
      </PrivateRoute>
    ),
  },
  {
    path: '/admin-dashboard/blogs',
    element: (
      <PrivateRoute allowedRole="admin">
        <Blogs />
      </PrivateRoute>
    ),
  },
];