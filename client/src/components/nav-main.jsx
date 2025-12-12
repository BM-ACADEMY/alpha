import { NavLink, Link } from "react-router-dom";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import logo from "@/assets/images/alpha-logo.png";

export function NavMain({ items }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-4">
        {/* Logo at the top */}
        <div className="flex justify-center">
          <Link to="/admin-dashboard">
            <img src={logo} alt="Alpha R." className="h-40 w-40" />
          </Link>
        </div>

        {/* Menu items */}
        <SidebarMenu>
          {items?.map((item) => (
            <SidebarMenuItem key={item.title}>
              <NavLink to={item.url} end={item.url === "/admin-dashboard"}>
                {({ isActive }) => (
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors
        ${isActive
                        ? "bg-gray-700 text-white"
                        : "text-white hover:bg-gray-600 hover:text-white"
                      }`}
                  >
                    {item.icon && (
                      <item.icon className="w-6 h-6 text-[#d5a046]" />
                    )}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}
              </NavLink>

            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
