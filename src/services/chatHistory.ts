import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  trelloActions?: any[];
  isTyping?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  goalId?: string;
  messages: ChatMessage[];
  fourWOneHAnswers?: {
    what?: string;
    why?: string;
    when?: string;
    where?: string;
    who?: string;
    how?: string;
  };
  currentStep: 'welcome' | 'trello-connect' | '4w1h' | 'goal-creation' | 'active';
  trelloBoardId?: string;
  trelloBoardUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'paused';
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  trelloBoardId: string;
  trelloBoardUrl: string;
  fourWOneHAnswers: {
    what: string;
    why: string;
    when: string;
    where: string;
    who: string;
    how: string;
  };
  weeklyTasks: any[];
  status: 'active' | 'completed' | 'paused';
  progress: number;
  xpEarned: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

class ChatHistoryService {
  private collectionName = 'chatSessions';
  private goalsCollectionName = 'goals';

  /**
   * Save chat session to Firebase
   */
  async saveChatSession(session: ChatSession): Promise<string> {
    try {
      const sessionData = {
        ...session,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp
        }))
      };

      if (session.id && session.id !== 'new') {
        // Update existing session
        await updateDoc(doc(db, this.collectionName, session.id), {
          ...sessionData,
          updatedAt: serverTimestamp()
        });
        return session.id;
      } else {
        // Create new session
        const docRef = await addDoc(collection(db, this.collectionName), sessionData);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving chat session:', error);
      throw error;
    }
  }

  /**
   * Load chat session from Firebase
   */
  async loadChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const sessionDoc = await getDocs(
        query(
          collection(db, this.collectionName),
          where('id', '==', sessionId)
        )
      );

      if (sessionDoc.empty) {
        return null;
      }

      const sessionData = sessionDoc.docs[0].data();
      return {
        ...sessionData,
        id: sessionDoc.docs[0].id,
        createdAt: sessionData.createdAt?.toDate() || new Date(),
        updatedAt: sessionData.updatedAt?.toDate() || new Date(),
        messages: sessionData.messages?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate() || new Date()
        })) || []
      } as ChatSession;
    } catch (error) {
      console.error('Error loading chat session:', error);
      return null;
    }
  }

  /**
   * Get user's chat sessions
   */
  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      const sessionsQuery = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        limit(20)
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        messages: doc.data().messages?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate() || new Date()
        })) || []
      })) as ChatSession[];

      // Sort by updatedAt in descending order (most recent first)
      return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error loading user chat sessions:', error);
      return [];
    }
  }

  /**
   * Save goal to Firebase
   */
  async saveGoal(goal: Goal): Promise<string> {
    try {
      const goalData = {
        ...goal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (goal.id && goal.id !== 'new') {
        // Update existing goal
        await updateDoc(doc(db, this.goalsCollectionName, goal.id), {
          ...goalData,
          updatedAt: serverTimestamp()
        });
        return goal.id;
      } else {
        // Create new goal
        const docRef = await addDoc(collection(db, this.goalsCollectionName), goalData);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      throw error;
    }
  }

  /**
   * Get user's goals
   */
  async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      const goalsQuery = query(
        collection(db, this.goalsCollectionName),
        where('userId', '==', userId)
      );

      const goalsSnapshot = await getDocs(goalsQuery);
      const goals = goalsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate()
      })) as Goal[];

      // Sort by createdAt in descending order (most recent first)
      return goals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error loading user goals:', error);
      return [];
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string, progress: number, xpEarned: number): Promise<void> {
    try {
      await updateDoc(doc(db, this.goalsCollectionName, goalId), {
        progress,
        xpEarned,
        updatedAt: serverTimestamp(),
        ...(progress >= 100 && { 
          status: 'completed',
          completedAt: serverTimestamp()
        })
      });
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  /**
   * Add XP to user
   */
  async addUserXP(userId: string, xpAmount: number, reason: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastXPEarned: xpAmount,
        lastXPReason: reason,
        lastXPDate: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding user XP:', error);
      // Don't throw error for XP tracking failures
    }
  }

  /**
   * Get user XP
   */
  async getUserXP(userId: string): Promise<number> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? (userDoc.data().totalXP || 0) : 0;
    } catch (error) {
      console.error('Error getting user XP:', error);
      return 0;
    }
  }

  /**
   * Create new chat session
   */
  createNewSession(userId: string): ChatSession {
    return {
      id: 'new',
      userId,
      messages: [], // Start with empty messages - the AI will add the first message based on context
      currentStep: 'welcome',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };
  }

  /**
   * Add message to session
   */
  addMessageToSession(session: ChatSession, message: ChatMessage): ChatSession {
    return {
      ...session,
      messages: [...session.messages, message],
      updatedAt: new Date()
    };
  }

  /**
   * Update session step
   */
  updateSessionStep(session: ChatSession, step: ChatSession['currentStep']): ChatSession {
    return {
      ...session,
      currentStep: step,
      updatedAt: new Date()
    };
  }

  /**
   * Update 4W1H answers
   */
  update4W1HAnswers(session: ChatSession, answers: Partial<ChatSession['fourWOneHAnswers']>): ChatSession {
    return {
      ...session,
      fourWOneHAnswers: { ...session.fourWOneHAnswers, ...answers },
      updatedAt: new Date()
    };
  }

  /**
   * Set Trello board info
   */
  setTrelloBoardInfo(session: ChatSession, boardId: string, boardUrl: string): ChatSession {
    return {
      ...session,
      trelloBoardId: boardId,
      trelloBoardUrl: boardUrl,
      updatedAt: new Date()
    };
  }
}

// Create singleton instance
export const chatHistoryService = new ChatHistoryService();

// Hook for using chat history service
export const useChatHistory = () => {
  const { user } = useAuth();
  
  return {
    chatHistoryService,
    saveSession: (session: ChatSession) => chatHistoryService.saveChatSession(session),
    loadSession: (sessionId: string) => chatHistoryService.loadChatSession(sessionId),
    getUserSessions: () => user ? chatHistoryService.getUserChatSessions(user.uid) : Promise.resolve([]),
    saveGoal: (goal: Goal) => chatHistoryService.saveGoal(goal),
    getUserGoals: () => user ? chatHistoryService.getUserGoals(user.uid) : Promise.resolve([]),
    updateGoalProgress: (goalId: string, progress: number, xpEarned: number) => 
      chatHistoryService.updateGoalProgress(goalId, progress, xpEarned),
    createNewSession: () => user ? chatHistoryService.createNewSession(user.uid) : null,
    addUserXP: (xpAmount: number, reason: string) => 
      user ? chatHistoryService.addUserXP(user.uid, xpAmount, reason) : Promise.resolve(),
    getUserXP: () => user ? chatHistoryService.getUserXP(user.uid) : Promise.resolve(0)
  };
};
