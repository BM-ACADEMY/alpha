import * as React from 'react';
import { useContext } from 'react';
import { AuthContext } from '@/modules/common/context/AuthContext';
import { userMenuItems } from '@/modules/common/utils/userMenuItem';
import { adminMenuItems } from '@/modules/common/utils/adminMenuItem';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';

export function AppSidebar({ ...props }) {
  const { user, logout, loading } = useContext(AuthContext);

  // Determine role: admin, user, or fallback to guest
  const role = user?.role_id?.role_id === 2 ? 'admin' : user ? 'user' : 'guest';

  // Select menu items based on role
  const menuData =
    role === 'admin'
      ? adminMenuItems
      : role === 'user'
      ? userMenuItems
      : {
          user: { name: 'Guest', email: '', avatar: '' },
          navMain: [],
          navSecondary: [],
          navClouds: [],
          documents: [],
        };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader />
      <SidebarContent className=" bg-[#0F1C3F]">
        <NavMain items={menuData.navMain} />
      </SidebarContent>
      <SidebarFooter className=" bg-[#0F1C3F]">
        <NavUser user={user} logout={logout} />
      </SidebarFooter>
    </Sidebar>
  );
}
