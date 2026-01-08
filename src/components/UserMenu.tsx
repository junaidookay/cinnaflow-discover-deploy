import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, LayoutDashboard, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const UserMenu = () => {
  const { user, isAdmin, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/auth")}
        className="gap-2"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
    );
  }

  const initials = user.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
          <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{user.email}</p>
          {isAdmin && (
            <p className="text-xs text-primary">Administrator</p>
          )}
        </div>
        <DropdownMenuSeparator />
        
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin" className="cursor-pointer">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="w-4 h-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
