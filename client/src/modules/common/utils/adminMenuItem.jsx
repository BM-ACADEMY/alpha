import {
  LayoutDashboard,
  Users,
  CreditCard,
  Star,
  FileBarChart,
  List,
  User,
  LogOut,
} from 'lucide-react';

export const adminMenuItems = {
  user: {
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: '/avatars/admin.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin-dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Users',
      url: '/admin-dashboard/users',
      icon: Users,
    },
    {
      title: 'Payments',
      url: '/admin-dashboard/payments',
      icon: CreditCard,
    },
    {
      title: 'Points',
      url: '/admin-dashboard/points',
      icon: Star,
    },
    {
      title: 'Reports',
      url: '/admin-dashboard/reports',
      icon: FileBarChart,
    },
    {
      title: 'Plans',
      url: '/admin-dashboard/plans',
      icon: List,
    },
  ],
  navSecondary: [
    // {
    //   title: 'Profile',
    //   url: '/admin-dashboard/profile',
    //   icon: User,
    // },
    // {
    //   title: 'Logout',
    //   url: '#',
    //   icon: LogOut,
    // },
  ],
};