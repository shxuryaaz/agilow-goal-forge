import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { UserProfile, WalletData } from '@/types/firebase';
import { generateWallet } from './wallet';

// Auth state management
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Email/Password Authentication
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await updateUserLastLogin(userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user profile in Firestore
    await createUserProfile(userCredential.user, name);
    
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Google Authentication
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user profile exists, create if not
    const userProfile = await getUserProfile(user.uid);
    if (!userProfile) {
      await createUserProfile(user, user.displayName || 'User');
    } else {
      await updateUserLastLogin(user.uid);
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// User Profile Management
export const createUserProfile = async (user: User, name: string) => {
  try {
    // Generate wallet for new user
    const walletInfo = generateWallet();
    
    const walletData: WalletData = {
      publicAddress: walletInfo.address,
      createdAt: serverTimestamp() as any,
    };

    const userProfile: Omit<UserProfile, 'uid'> = {
      name,
      email: user.email || '',
      xp: 0,
      streak: 0,
      badges: [],
      wallet: walletData,
      createdAt: serverTimestamp() as any,
      lastLoginAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    // Return wallet info for display to user (only once)
    return {
      mnemonic: walletInfo.mnemonic,
      address: walletInfo.address,
    };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid, ...userDoc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserLastLogin = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

export const updateUserXP = async (uid: string, xpToAdd: number) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentXP = userDoc.data().xp || 0;
      await updateDoc(userRef, {
        xp: currentXP + xpToAdd,
      });
      return currentXP + xpToAdd;
    }
    return 0;
  } catch (error) {
    console.error('Error updating user XP:', error);
    throw error;
  }
};

export const updateUserStreak = async (uid: string, newStreak: number) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      streak: newStreak,
    });
  } catch (error) {
    console.error('Error updating user streak:', error);
    throw error;
  }
};

export const addUserBadge = async (uid: string, badgeId: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentBadges = userDoc.data().badges || [];
      if (!currentBadges.includes(badgeId)) {
        await updateDoc(userRef, {
          badges: [...currentBadges, badgeId],
        });
      }
    }
  } catch (error) {
    console.error('Error adding user badge:', error);
    throw error;
  }
};
