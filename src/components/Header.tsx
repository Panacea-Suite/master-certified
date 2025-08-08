import { useAuth } from '@/hooks/useAuth';
import { useViewMode } from '@/hooks/useViewMode';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Building, Users, LogOut, Eye, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { isViewingAsBrand, toggleViewMode, effectiveRole, canViewAsBrand } = useViewMode();

  const getRoleIcon = () => {
    switch (effectiveRole) {
      case 'master_admin':
        return <Shield className="w-4 h-4" />;
      case 'brand_admin':
        return <Building className="w-4 h-4" />;
      case 'customer':
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = () => {
    switch (effectiveRole) {
      case 'master_admin':
        return 'destructive';
      case 'brand_admin':
        return 'default';
      case 'customer':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = () => {
    switch (effectiveRole) {
      case 'master_admin':
        return 'Master Admin';
      case 'brand_admin':
        return 'Brand Admin';
      case 'customer':
        return 'Customer';
      default:
        return 'User';
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Certified Platform</h1>
              <p className="text-sm text-muted-foreground">
                Product Authentication & QR Code Management
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {canViewAsBrand && (
              <Button
                variant={isViewingAsBrand ? "default" : "outline"}
                size="sm"
                onClick={toggleViewMode}
                className="flex items-center space-x-2"
              >
                {isViewingAsBrand ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{isViewingAsBrand ? 'Exit Brand View' : 'View as Brand'}</span>
              </Button>
            )}
            
            <Badge variant={getRoleBadgeVariant()} className="flex items-center space-x-1">
              {getRoleIcon()}
              <span>{getRoleLabel()}{isViewingAsBrand && ' (Brand View)'}</span>
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.brand_logo_url || undefined} alt={profile.display_name || 'User'} />
                    <AvatarFallback>
                      {profile.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile.display_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {profile.company_name && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile.company_name}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};