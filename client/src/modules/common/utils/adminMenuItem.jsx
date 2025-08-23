import {
  LayoutDashboard,
  Users,
  CreditCard,
  Star,
  FileBarChart,
  List,
  User,
  LogOut,
  Percent ,
  MessageSquareWarning
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
      title: 'Profit percentage',
      url: '/admin-dashboard/profit-percentage',
      icon: Percent ,
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
    {
      title: 'Complaints',
      url: '/admin-dashboard/complaint',
      icon: MessageSquareWarning,
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
}

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );

};
