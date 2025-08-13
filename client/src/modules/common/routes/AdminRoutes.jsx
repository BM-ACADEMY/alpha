import PrivateRoute from '@/modules/common/context/PrivateRoute';
import AdminDashboard from '@/modules/admin/pages/dashboard/Dashboard';
import AdminUsers from '@/modules/admin/pages/users/Users';
import AdminPayments from '@/modules/admin/pages/payments/Payments';
import AdminPoints from '@/modules/admin/pages/points/Points';
import AdminReports from '@/modules/admin/pages/reports/Reports';
import AdminPlans from '@/modules/admin/pages/plans/Plans';
import AdminProfile from '@/modules/admin/pages/settings/Profile';

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
];