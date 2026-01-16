import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users as UsersIcon,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

const navigation = [
  { name: "仪表盘", href: "/", icon: LayoutDashboard },
];

// Admin only navigation
const adminNav = [
  { name: "系统统计", href: "/admin", icon: BarChart3 },
  { name: "用户管理", href: "/admin/users", icon: UsersIcon },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="w-16 lg:w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col py-6 transition-all duration-200">
      {/* Logo */}
      <div className="px-4 lg:px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="hidden lg:block text-foreground font-semibold text-lg tracking-tight">
            管理平台
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 lg:px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "sidebar-active"
                  : "text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              <span className="hidden lg:block">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Admin Navigation - Only for ADMIN users */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <p className="hidden lg:block px-3 text-xs font-medium text-muted-foreground mb-2">
              管理员
            </p>
            {adminNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "sidebar-active"
                      : "text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                  <span className="hidden lg:block">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
