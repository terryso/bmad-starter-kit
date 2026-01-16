import { Bell, ChevronRight, Search, User, LogOut } from "lucide-react";
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
  "/videos": "视频管理",
  "/albums": "视频专辑",
  "/upload": "上传视频",
  "/qr-generator": "二维码生成器",
  "/settings": "设置",
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const currentRoute = routeNames[location.pathname] || "仪表盘";

  const handleLogout = async () => {
    let apiSuccess = false;
    try {
      // 1. 调用后端登出 API (清除 HttpOnly Cookie)
      await authApi.logout();
      apiSuccess = true;
    } catch (error) {
      // API 失败时记录错误，但继续清除本地状态
      console.error('Logout API error:', error);
      toast.error("登出请求失败，但已清除本地状态");
    } finally {
      // 2. 无论 API 是否成功，都清除本地状态
      clearAuth();
      // 3. 显示成功消息
      if (apiSuccess) {
        toast.success("已退出登录");
      }
      // 4. 使用 setTimeout 确保状态更新后再导航
      setTimeout(() => {
        navigate("/login");
      }, 100);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">视频管理平台</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        <span className="text-foreground font-medium">{currentRoute}</span>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground press-effect">
          <Search className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground press-effect relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Auth Section */}
        {isAuthenticated && user ? (
          /* Logged in - show user dropdown */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 press-effect">
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
                <Link to="/settings">个人资料</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* Not logged in - show login/register buttons */
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
