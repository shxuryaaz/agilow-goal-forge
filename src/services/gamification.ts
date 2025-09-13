import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface Achievement {
  id: string;
  userId: string;
  type: 'goal_completion' | 'streak' | 'milestone' | 'special';
  title: string;
  description: string;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  unlockedAt: Date;
  nftMinted: boolean;
  nftTokenId?: string;
}

export interface UserStats {
  userId: string;
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  goalsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  source: 'goal_completion' | 'streak' | 'achievement' | 'milestone' | 'bonus';
  goalId?: string;
  achievementId?: string;
  timestamp: Date;
}

class GamificationService {
  private achievementsCollection = 'achievements';
  private userStatsCollection = 'userStats';
  private xpTransactionsCollection = 'xpTransactions';

  /**
   * Award XP to user
   */
  async awardXP(userId: string, amount: number, reason: string, source: XPTransaction['source'], goalId?: string, achievementId?: string): Promise<void> {
    try {
      // Add XP transaction - only include defined fields
      const transactionData: any = {
        userId,
        amount,
        reason,
        source,
        timestamp: serverTimestamp()
      };

      // Only add optional fields if they're defined
      if (goalId) {
        transactionData.goalId = goalId;
      }
      if (achievementId) {
        transactionData.achievementId = achievementId;
      }

      await addDoc(collection(db, this.xpTransactionsCollection), transactionData);

      // Update user stats
      const userStatsRef = doc(db, this.userStatsCollection, userId);
      await updateDoc(userStatsRef, {
        totalXP: increment(amount),
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Also update user profile XP (for UI display) - get current value first for immediate UI update
      const userProfileRef = doc(db, 'users', userId);
      const userProfileDoc = await getDoc(userProfileRef);
      const currentXP = userProfileDoc.exists() ? (userProfileDoc.data().xp || 0) : 0;
      const newXP = currentXP + amount;
      
      await updateDoc(userProfileRef, {
        xp: newXP
      });
      
      console.log(`Updated user profile XP: ${currentXP} + ${amount} = ${newXP} for user ${userId}`);

      // Check for level up
      await this.checkLevelUp(userId);
    } catch (error) {
      console.error('Error awarding XP:', error);
      throw error;
    }
  }

  /**
   * Check if user leveled up and award achievements
   */
  async checkLevelUp(userId: string): Promise<{ leveledUp: boolean; newLevel?: number }> {
    try {
      const userStats = await this.getUserStats(userId);
      if (!userStats) return { leveledUp: false };

      const newLevel = this.calculateLevel(userStats.totalXP);
      const leveledUp = newLevel > userStats.level;

      if (leveledUp) {
        // Update level
        await updateDoc(doc(db, this.userStatsCollection, userId), {
          level: newLevel,
          currentLevelXP: userStats.totalXP - this.getXPForLevel(newLevel - 1),
          nextLevelXP: this.getXPForLevel(newLevel) - userStats.totalXP,
          updatedAt: serverTimestamp()
        });

        // Award level up achievement
        await this.unlockAchievement(userId, 'level_up', {
          title: `Level ${newLevel} Reached!`,
          description: `Congratulations! You've reached level ${newLevel}`,
          xpReward: newLevel * 50,
          rarity: newLevel >= 10 ? 'epic' : newLevel >= 5 ? 'rare' : 'common'
        });

        return { leveledUp: true, newLevel };
      }

      return { leveledUp: false };
    } catch (error) {
      console.error('Error checking level up:', error);
      return { leveledUp: false };
    }
  }

  /**
   * Unlock achievement for user
   */
  async unlockAchievement(userId: string, achievementType: string, achievementData: Partial<Achievement>): Promise<string> {
    try {
      // Check if achievement already exists
      const existingAchievement = await this.getUserAchievement(userId, achievementType);
      if (existingAchievement) {
        return existingAchievement.id;
      }

      // Create new achievement
      const achievementRef = await addDoc(collection(db, this.achievementsCollection), {
        userId,
        type: achievementData.type || 'milestone',
        title: achievementData.title || 'New Achievement',
        description: achievementData.description || 'You unlocked a new achievement!',
        xpReward: achievementData.xpReward || 0,
        rarity: achievementData.rarity || 'common',
        icon: achievementData.icon || '🏆',
        unlockedAt: serverTimestamp(),
        nftMinted: false
      });

      // Award XP for achievement
      if (achievementData.xpReward && achievementData.xpReward > 0) {
        await this.awardXP(userId, achievementData.xpReward, `Achievement: ${achievementData.title}`, 'achievement', undefined, achievementRef.id);
      }

      // Update user stats
      await updateDoc(doc(db, this.userStatsCollection, userId), {
        achievementsUnlocked: increment(1),
        updatedAt: serverTimestamp()
      });

      return achievementRef.id;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  /**
   * Get user stats
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const userStatsDoc = await getDocs(
        query(
          collection(db, this.userStatsCollection),
          where('userId', '==', userId)
        )
      );

      if (userStatsDoc.empty) {
        // Create initial user stats
        return await this.createUserStats(userId);
      }

      const data = userStatsDoc.docs[0].data();
      return {
        ...data,
        id: userStatsDoc.docs[0].id,
        lastActive: data.lastActive?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as UserStats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Create initial user stats
   */
  async createUserStats(userId: string): Promise<UserStats> {
    try {
      const initialStats: Omit<UserStats, 'id'> = {
        userId,
        totalXP: 0,
        level: 1,
        currentLevelXP: 0,
        nextLevelXP: 100,
        goalsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievementsUnlocked: 0,
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.userStatsCollection), {
        ...initialStats,
        lastActive: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Ensure user profile also has XP field initialized
      const userProfileRef = doc(db, 'users', userId);
      await updateDoc(userProfileRef, {
        xp: 0
      }).catch(() => {
        // If update fails, the user profile might not exist yet, which is fine
        console.log('User profile not found, XP will be set when profile is created');
      });

      return { ...initialStats, id: docRef.id };
    } catch (error) {
      console.error('Error creating user stats:', error);
      throw error;
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const achievementsQuery = query(
        collection(db, this.achievementsCollection),
        where('userId', '==', userId),
        orderBy('unlockedAt', 'desc')
      );

      const achievementsSnapshot = await getDocs(achievementsQuery);
      return achievementsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        unlockedAt: doc.data().unlockedAt?.toDate() || new Date()
      })) as Achievement[];
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * Get user XP transactions
   */
  async getUserXPTransactions(userId: string, limitCount: number = 20): Promise<XPTransaction[]> {
    try {
      const transactionsQuery = query(
        collection(db, this.xpTransactionsCollection),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const transactionsSnapshot = await getDocs(transactionsQuery);
      return transactionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as XPTransaction[];
    } catch (error) {
      console.error('Error getting XP transactions:', error);
      return [];
    }
  }

  /**
   * Update streak
   */
  async updateStreak(userId: string, incrementStreak: boolean = true): Promise<void> {
    try {
      const userStats = await this.getUserStats(userId);
      if (!userStats) return;

      const newStreak = incrementStreak ? userStats.currentStreak + 1 : 0;
      const newLongestStreak = Math.max(userStats.longestStreak, newStreak);

      await updateDoc(doc(db, this.userStatsCollection, userId), {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Award streak achievements
      if (newStreak > 0) {
        if (newStreak === 7) {
          await this.unlockAchievement(userId, 'week_streak', {
            title: 'Week Warrior',
            description: '7-day streak achieved!',
            xpReward: 100,
            rarity: 'rare'
          });
        } else if (newStreak === 30) {
          await this.unlockAchievement(userId, 'month_streak', {
            title: 'Consistency Champion',
            description: '30-day streak achieved!',
            xpReward: 500,
            rarity: 'epic'
          });
        }
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }

  /**
   * Mark goal as completed
   */
  async markGoalCompleted(userId: string, goalId: string, xpReward: number): Promise<void> {
    try {
      // Award XP for goal completion
      await this.awardXP(userId, xpReward, 'Goal completed', 'goal_completion', goalId);

      // Update user stats
      await updateDoc(doc(db, this.userStatsCollection, userId), {
        goalsCompleted: increment(1),
        updatedAt: serverTimestamp()
      });

      // Award goal completion achievements
      const userStats = await this.getUserStats(userId);
      if (userStats) {
        if (userStats.goalsCompleted === 1) {
          await this.unlockAchievement(userId, 'first_goal', {
            title: 'Goal Master',
            description: 'Completed your first goal!',
            xpReward: 200,
            rarity: 'epic'
          });
        } else if (userStats.goalsCompleted === 10) {
          await this.unlockAchievement(userId, 'ten_goals', {
            title: 'Goal Crusher',
            description: 'Completed 10 goals!',
            xpReward: 1000,
            rarity: 'legendary'
          });
        }
      }
    } catch (error) {
      console.error('Error marking goal completed:', error);
      throw error;
    }
  }

  /**
   * Calculate level from XP
   */
  private calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / 100) + 1;
  }

  /**
   * Get XP required for a specific level
   */
  private getXPForLevel(level: number): number {
    return (level - 1) * 100;
  }

  /**
   * Get user achievement by type
   */
  private async getUserAchievement(userId: string, achievementType: string): Promise<Achievement | null> {
    try {
      const achievementQuery = query(
        collection(db, this.achievementsCollection),
        where('userId', '==', userId),
        where('type', '==', achievementType)
      );

      const achievementSnapshot = await getDocs(achievementQuery);
      if (achievementSnapshot.empty) return null;

      const data = achievementSnapshot.docs[0].data();
      return {
        ...data,
        id: achievementSnapshot.docs[0].id,
        unlockedAt: data.unlockedAt?.toDate() || new Date()
      } as Achievement;
    } catch (error) {
      console.error('Error getting user achievement:', error);
      return null;
    }
  }
}

// Create singleton instance
export const gamificationService = new GamificationService();

// Hook for using gamification service
export const useGamification = () => {
  const { user } = useAuth();
  
  return {
    gamificationService,
    awardXP: (amount: number, reason: string, source: XPTransaction['source'], goalId?: string) => 
      user ? gamificationService.awardXP(user.uid, amount, reason, source, goalId) : Promise.resolve(),
    getUserStats: () => user ? gamificationService.getUserStats(user.uid) : Promise.resolve(null),
    getUserAchievements: () => user ? gamificationService.getUserAchievements(user.uid) : Promise.resolve([]),
    getUserXPTransactions: (limitCount?: number) => 
      user ? gamificationService.getUserXPTransactions(user.uid, limitCount) : Promise.resolve([]),
    updateStreak: (incrementStreak?: boolean) => 
      user ? gamificationService.updateStreak(user.uid, incrementStreak) : Promise.resolve(),
    markGoalCompleted: (goalId: string, xpReward: number) => 
      user ? gamificationService.markGoalCompleted(user.uid, goalId, xpReward) : Promise.resolve(),
    unlockAchievement: (achievementType: string, achievementData: Partial<Achievement>) => 
      user ? gamificationService.unlockAchievement(user.uid, achievementType, achievementData) : Promise.resolve('')
  };
};