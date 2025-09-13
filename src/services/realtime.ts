import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface RealtimeUpdate {
  type: 'xp_update' | 'achievement_unlocked' | 'goal_progress' | 'streak_update' | 'level_up';
  data: any;
  timestamp: Date;
}

class RealtimeService {
  private subscriptions: Map<string, Unsubscribe> = new Map();

  /**
   * Subscribe to user stats updates
   */
  subscribeToUserStats(userId: string, callback: (stats: any) => void): Unsubscribe {
    const key = `userStats_${userId}`;
    
    // Unsubscribe from existing subscription if any
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key)?.();
    }

    const q = query(
      collection(db, 'userStats'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        callback({
          ...data,
          id: snapshot.docs[0].id,
          lastActive: data.lastActive?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      }
    });

    this.subscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to user achievements
   */
  subscribeToUserAchievements(userId: string, callback: (achievements: any[]) => void): Unsubscribe {
    const key = `achievements_${userId}`;
    
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key)?.();
    }

    const q = query(
      collection(db, 'achievements'),
      where('userId', '==', userId),
      orderBy('unlockedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const achievements = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        unlockedAt: doc.data().unlockedAt?.toDate() || new Date()
      }));
      callback(achievements);
    });

    this.subscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to XP transactions
   */
  subscribeToXPTransactions(userId: string, callback: (transactions: any[]) => void, limitCount: number = 10): Unsubscribe {
    const key = `xpTransactions_${userId}`;
    
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key)?.();
    }

    const q = query(
      collection(db, 'xpTransactions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      callback(transactions);
    });

    this.subscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to user goals
   */
  subscribeToUserGoals(userId: string, callback: (goals: any[]) => void): Unsubscribe {
    const key = `goals_${userId}`;
    
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key)?.();
    }

    const q = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goals = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate()
      }));
      callback(goals);
    });

    this.subscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to chat sessions
   */
  subscribeToChatSessions(userId: string, callback: (sessions: any[]) => void): Unsubscribe {
    const key = `chatSessions_${userId}`;
    
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key)?.();
    }

    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        messages: doc.data().messages?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate() || new Date()
        })) || []
      }));
      callback(sessions);
    });

    this.subscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to real-time updates (notifications)
   */
  subscribeToRealtimeUpdates(userId: string, callback: (update: RealtimeUpdate) => void): Unsubscribe {
    const key = `realtimeUpdates_${userId}`;
    
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key)?.();
    }

    // Subscribe to multiple collections for real-time updates
    const subscriptions: Unsubscribe[] = [];

    // XP Transactions for real-time XP updates
    const xpQuery = query(
      collection(db, 'xpTransactions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    let lastXPTransactionId: string | null = null;
    const xpUnsubscribe = onSnapshot(xpQuery, (snapshot) => {
      if (!snapshot.empty) {
        const latestTransaction = snapshot.docs[0];
        if (latestTransaction.id !== lastXPTransactionId) {
          lastXPTransactionId = latestTransaction.id;
          const data = latestTransaction.data();
          callback({
            type: 'xp_update',
            data: {
              amount: data.amount,
              reason: data.reason,
              source: data.source
            },
            timestamp: data.timestamp?.toDate() || new Date()
          });
        }
      }
    });

    // Achievements for real-time achievement unlocks
    const achievementsQuery = query(
      collection(db, 'achievements'),
      where('userId', '==', userId),
      orderBy('unlockedAt', 'desc'),
      limit(1)
    );

    let lastAchievementId: string | null = null;
    const achievementsUnsubscribe = onSnapshot(achievementsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const latestAchievement = snapshot.docs[0];
        if (latestAchievement.id !== lastAchievementId) {
          lastAchievementId = latestAchievement.id;
          const data = latestAchievement.data();
          callback({
            type: 'achievement_unlocked',
            data: {
              title: data.title,
              description: data.description,
              xpReward: data.xpReward,
              rarity: data.rarity
            },
            timestamp: data.unlockedAt?.toDate() || new Date()
          });
        }
      }
    });

    subscriptions.push(xpUnsubscribe, achievementsUnsubscribe);

    const unsubscribe = () => {
      subscriptions.forEach(sub => sub());
    };

    this.subscriptions.set(key, unsubscribe);
    return unsubscribe;
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }

  /**
   * Unsubscribe from specific subscription
   */
  unsubscribe(key: string): void {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Create singleton instance
export const realtimeService = new RealtimeService();

// Hook for using realtime service
export const useRealtime = () => {
  const { user } = useAuth();
  
  return {
    realtimeService,
    subscribeToUserStats: (callback: (stats: any) => void) => 
      user ? realtimeService.subscribeToUserStats(user.uid, callback) : () => {},
    subscribeToUserAchievements: (callback: (achievements: any[]) => void) => 
      user ? realtimeService.subscribeToUserAchievements(user.uid, callback) : () => {},
    subscribeToXPTransactions: (callback: (transactions: any[]) => void, limitCount?: number) => 
      user ? realtimeService.subscribeToXPTransactions(user.uid, callback, limitCount) : () => {},
    subscribeToUserGoals: (callback: (goals: any[]) => void) => 
      user ? realtimeService.subscribeToUserGoals(user.uid, callback) : () => {},
    subscribeToChatSessions: (callback: (sessions: any[]) => void) => 
      user ? realtimeService.subscribeToChatSessions(user.uid, callback) : () => {},
    subscribeToRealtimeUpdates: (callback: (update: RealtimeUpdate) => void) => 
      user ? realtimeService.subscribeToRealtimeUpdates(user.uid, callback) : () => {},
    unsubscribeAll: () => realtimeService.unsubscribeAll(),
    unsubscribe: (key: string) => realtimeService.unsubscribe(key)
  };
};
