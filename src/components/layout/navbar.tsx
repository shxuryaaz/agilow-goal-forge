import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Trophy, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import agliowLogo from '@/assets/agilow-logo.png';

interface NavbarProps {
  isLoggedIn?: boolean;
  userXP?: number;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  isLoggedIn = false, 
  userXP = 0,
  onThemeToggle,
  isDarkMode = false
}) => {
  const { user, userProfile, signOut, refreshKey, getCurrentXP } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src={agliowLogo} alt="Agilow" className="w-8 h-8" />
            <span className="text-xl font-bold text-foreground">Agilow</span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={onThemeToggle}
              className="rounded-full w-10 h-10 p-0"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {user ? (
              <>
                {/* XP Display */}
                <div className="flex items-center space-x-2 px-3 py-1 bg-success-light/20 rounded-full">
                  <Trophy className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success" key={refreshKey}>
                    {getCurrentXP()} XP
                  </span>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full w-10 h-10 p-0">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>
                          {userProfile?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="outline" className="rounded-full">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;