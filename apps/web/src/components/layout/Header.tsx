import { ChevronRight, User, LogOut, UserCircle } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

const routeNames: Record<string, string> = {
  "/": "仪表盘",
  "/profile": "个人资料",
  "/admin": "系统统计",
  "/admin/users": "用户管理",
  "/showcase": "项目展示",
  "/showcase/my-projects": "我的项目",
};

// Helper function to get route name with wildcard support
function getRouteName(pathname: string): string {
  // Check for exact match first
  if (routeNames[pathname]) {
    return routeNames[pathname];
  }
  // Check for wildcard patterns (e.g., /showcase/:id where :id is numeric)
  // This matches /showcase/123 but not /showcase/my-projects or /showcase/edit
  const showcaseIdMatch = pathname.match(/^\/showcase\/(\d+)$/);
  if (showcaseIdMatch) {
    return "项目详情";
  }
  // Check admin/showcase for pending projects page
  if (pathname.startsWith("/admin/showcase")) {
    return "项目审核";
  }
  return "仪表盘";
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const currentRoute = getRouteName(location.pathname);

  const handleLogout = async () => {
    let apiSuccess = false;
    try {
      await authApi.logout();
      apiSuccess = true;
    } catch (error) {
      console.error('Logout API error:', error);
      toast.error("登出请求失败，但已清除本地状态");
    } finally {
      clearAuth();
      if (apiSuccess) {
        toast.success("已退出登录");
      }
      setTimeout(() => {
        navigate("/login");
      }, 100);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">管理平台</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        <span className="text-foreground font-medium">{currentRoute}</span>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Auth Section */}
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="press-effect">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <UserCircle className="w-4 h-4 mr-2" />
                  个人资料
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 ml-2">
            <Button variant="ghost" asChild>
              <Link to="/login">登录</Link>
            </Button>
            <Button asChild>
              <Link to="/register">注册</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
