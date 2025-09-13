import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange } from '@/services/auth';
import { UserProfile, getUserProfile } from '@/services/auth';
import { setXPCookie, getXPCookie, removeXPCookie, updateXPCookie, incrementXPCookie } from '@/lib/cookies';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateUserProfileXP: (amount: number) => void;
  setUserProfileXP: (xp: number) => void;
  getCurrentXP: () => number;
  refreshKey: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize XP from cookie on app load for immediate display
  useEffect(() => {
    const cookieXP = getXPCookie();
    if (cookieXP > 0) {
      console.log(`Initializing with XP from cookie: ${cookieXP}`);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          
          // Restore XP from cookie if it's higher than database XP (for session persistence)
          const cookieXP = getXPCookie();
          if (cookieXP > (profile?.xp || 0)) {
            console.log(`Restoring XP from cookie: ${profile?.xp || 0} -> ${cookieXP}`);
            const updatedProfile = {
              ...profile,
              xp: cookieXP
            };
            setUserProfile(updatedProfile);
            setRefreshKey(prev => prev + 1);
          } else if (profile?.xp) {
            // Update cookie with database XP if it's higher
            updateXPCookie(profile.xp);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        // Clear XP cookie when user logs out
        removeXPCookie();
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      const { signOutUser } = await import('@/services/auth');
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      try {
        console.log('Refreshing user profile for user:', user.uid);
        const profile = await getUserProfile(user.uid);
        console.log('Retrieved user profile:', profile);
        
        // Update cookie with latest database XP
        if (profile?.xp !== undefined) {
          updateXPCookie(profile.xp);
        }
        
        setUserProfile(profile);
        // Force re-render by updating refresh key
        setRefreshKey(prev => prev + 1);
        console.log('User profile state updated');
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  const updateUserProfileXP = (amount: number) => {
    if (userProfile) {
      const currentXP = userProfile.xp || 0;
      const newXP = Math.max(0, currentXP + amount);
      const updatedProfile = {
        ...userProfile,
        xp: newXP
      };
      setUserProfile(updatedProfile);
      setRefreshKey(prev => prev + 1);
      
      // Save to cookie for session persistence
      updateXPCookie(newXP);
      
      console.log(`Optimistically updated XP: ${currentXP} + ${amount} = ${newXP}`);
    }
  };

  const setUserProfileXP = (xp: number) => {
    if (userProfile) {
      const sanitizedXP = Math.max(0, xp);
      const updatedProfile = {
        ...userProfile,
        xp: sanitizedXP
      };
      setUserProfile(updatedProfile);
      setRefreshKey(prev => prev + 1);
      
      // Save to cookie for session persistence
      updateXPCookie(sanitizedXP);
      
      console.log(`Set XP to: ${sanitizedXP}`);
    }
  };

  const getCurrentXP = (): number => {
    // Return XP from user profile if available, otherwise from cookie
    if (userProfile?.xp !== undefined) {
      return userProfile.xp;
    }
    return getXPCookie();
  };

  const value = {
    user,
    userProfile,
    loading,
    signOut,
    refreshUserProfile,
    updateUserProfileXP,
    setUserProfileXP,
    getCurrentXP,
    refreshKey,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

