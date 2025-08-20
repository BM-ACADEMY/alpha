import * as React from 'react';
import { useContext } from 'react';
import { AuthContext } from '@/modules/common/context/AuthContext';
import { userMenuItems } from '@/modules/common/utils/userMenuItem';
import { adminMenuItems } from '@/modules/common/utils/adminMenuItem';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavDocuments } from '@/components/nav-documents';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Home } from 'lucide-react';

export function AppSidebar({ ...props }) {
  const { user, logout, loading } = useContext(AuthContext);

  // Determine role: admin, user, or fallback to guest
  const role = user?.role_id?.role_id === 2 ? 'admin' : user ? 'user' : 'guest';

  // Select menu items based on role
  const menuData = role === 'admin' ? adminMenuItems : role === 'user' ? userMenuItems : {
    user: { name: 'Guest', email: '', avatar: '' },
    navMain: [],
    navSecondary: [],
    navClouds: [],
    documents: [],
  };

  // Handle logout
  const handleLogout = async () => {
    if (role !== 'guest' && menuData.navSecondary.some((item) => item.title === 'Logout')) {
      await logout();
    }
  };

  // Override navSecondary to attach logout handler
  const navSecondaryWithLogout = menuData.navSecondary.map((item) => {
    if (item.title === 'Logout') {
      return { ...item, onClick: handleLogout };
    }
    return item;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/">
                <Home className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuData.navMain} />
       
       

      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ ...menuData.user, handleLogout, role }} />
      </SidebarFooter>
    </Sidebar>
  );
}