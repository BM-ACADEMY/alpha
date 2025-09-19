import {
  LayoutDashboard,
  BarChart,
  List,
  CreditCard,
  User,
  LogOut,
  Camera,
  FileText,
  File,
  Database,
  FileBarChart,
  FilePen,
  BadgeDollarSign
} from 'lucide-react';

export const userMenuItems = {
  user: {
    name: 'User',
    email: 'user@example.com',
    avatar: '/avatars/user.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/user-dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Complaint',
      url: '/user-dashboard/earnings',
      icon: BarChart,
    },
    {
      title: 'Plans',
      url: '/user-dashboard/plans',
      icon: List,
    },
    {
      title: 'Subscription',
      url: '/user-dashboard/subscription',
      icon: BadgeDollarSign,
    },
    {
      title: 'Wallet',
      url: '/user-dashboard/wallet',
      icon: CreditCard,
    },
    {
      title: 'Profile',
      url: '/user-dashboard/profile',
      icon: User,
    },
  ],
  navSecondary: [
    {
      title: 'Logout',
      url: '#',
      icon: LogOut,
    },
  ],
  navClouds: [
    {
      title: 'Capture',
      icon: Camera,
      isActive: true,
      url: '/user-dashboard/capture',
      items: [
        {
          title: 'Active Proposals',
          url: '/user-dashboard/capture/active',
        },
        {
          title: 'Archived',
          url: '/user-dashboard/capture/archived',
        },
      ],
    },
    {
      title: 'Proposal',
      icon: FileText,
      url: '/user-dashboard/proposal',
      items: [
        {
          title: 'Active Proposals',
          url: '/user-dashboard/proposal/active',
        },
        {
          title: 'Archived',
          url: '/user-dashboard/proposal/archived',
        },
      ],
    },
    {
      title: 'Prompts',
      icon: File,
      url: '/user-dashboard/prompts',
      items: [
        {
          title: 'Active Proposals',
          url: '/user-dashboard/prompts/active',
        },
        {
          title: 'Archived',
          url: '/user-dashboard/prompts/archived',
        },
      ],
    },
  ],
  documents: [
    {
      name: 'Data Library',
      url: '/user-dashboard/data-library',
      icon: Database,
    },
    {
      name: 'Reports',
      url: '/user-dashboard/reports',
      icon: FileBarChart,
    },
    {
      name: 'Word Assistant',
      url: '/user-dashboard/word-assistant',
      icon: FilePen,
    },
  ],
};