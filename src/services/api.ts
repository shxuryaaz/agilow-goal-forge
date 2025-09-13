import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { trelloService } from './trello';
import { aiService } from './ai';
import { gamificationService } from './gamification';
import { notificationService } from './notifications';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class APIService {
  /**
   * Complete goal creation flow
   */
  async createGoalWithAI(
    userId: string, 
    fourWOneHAnswers: any, 
    chatSessionId: string
  ): Promise<APIResponse<{ goalId: string; boardUrl: string }>> {
    try {
      // Process 4W1H answers with AI
      const goalStructure = await aiService.process4W1HAnswers(fourWOneHAnswers);
      
      // Create Trello board
      const { boardId, boardUrl } = await trelloService.createGoalBoard(
        goalStructure.title,
        goalStructure.description,
        goalStructure.weeklyTasks
      );

      // Generate BHAG image
      const imageUrl = await aiService.generateGoalImage(fourWOneHAnswers);
      await trelloService.addImageToBHAG(boardId, imageUrl, `${goalStructure.title} Vision`);

      // Save goal to database
      const goalData = {
        userId,
        title: goalStructure.title,
        description: goalStructure.description,
        trelloBoardId: boardId,
        trelloBoardUrl: boardUrl,
        fourWOneHAnswers,
        weeklyTasks: goalStructure.weeklyTasks,
        status: 'active',
        progress: 0,
        xpEarned: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const goalRef = await addDoc(collection(db, 'goals'), goalData);
      const goalId = goalRef.id;

      // Update chat session with goal ID
      await updateDoc(doc(db, 'chatSessions', chatSessionId), {
        goalId,
        trelloBoardId: boardId,
        trelloBoardUrl: boardUrl,
        currentStep: 'active',
        updatedAt: serverTimestamp()
      });

      // Award initial XP for goal creation
      await gamificationService.awardXP(userId, 50, 'Goal created', 'milestone', goalId);

      // Show success notification
      notificationService.success(
        'Goal Created!',
        `Your goal "${goalStructure.title}" has been created successfully.`
      );

      return {
        success: true,
        data: { goalId, boardUrl },
        message: 'Goal created successfully'
      };
    } catch (error) {
      console.error('Error creating goal:', error);
      notificationService.error(
        'Goal Creation Failed',
        'There was an error creating your goal. Please try again.'
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process user progress update
   */
  async processProgressUpdate(
    userId: string,
    goalId: string,
    userMessage: string
  ): Promise<APIResponse<{ actions: any[]; response: string }>> {
    try {
      // Get goal data
      const goalQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId),
        where('id', '==', goalId)
      );
      const goalSnapshot = await getDocs(goalQuery);
      
      if (goalSnapshot.empty) {
        throw new Error('Goal not found');
      }

      const goal = goalSnapshot.docs[0].data();

      // Get current Trello cards
      const trelloGoals = await trelloService.getGoals();
      const currentCards = trelloGoals.filter(g => g.id === goalId);

      // Process with AI
      const aiResponse = await aiService.processProgressUpdate(userMessage, currentCards);

      // Execute Trello actions
      for (const action of aiResponse.actions) {
        switch (action.type) {
          case 'update_checklist':
            await trelloService.updateChecklistItem(
              action.cardId,
              action.checklistId!,
              action.itemId!,
              action.completed!
            );
            break;
          case 'move_card':
            await trelloService.moveCard(action.cardId, action.newListId!);
            break;
        }
      }

      // Update goal progress
      const newProgress = Math.min(goal.progress + 10, 100); // Simple progress calculation
      await updateDoc(doc(db, 'goals', goalId), {
        progress: newProgress,
        updatedAt: serverTimestamp()
      });

      // Award XP for progress
      const xpReward = 25; // Base XP for progress updates
      await gamificationService.awardXP(userId, xpReward, 'Progress update', 'milestone', goalId);

      // Check for goal completion
      if (newProgress >= 100) {
        await this.completeGoal(userId, goalId);
      }

      // Show progress notification
      notificationService.info(
        'Progress Updated!',
        `+${xpReward} XP - ${aiResponse.response}`
      );

      return {
        success: true,
        data: aiResponse,
        message: 'Progress updated successfully'
      };
    } catch (error) {
      console.error('Error processing progress update:', error);
      notificationService.error(
        'Progress Update Failed',
        'There was an error updating your progress. Please try again.'
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Complete a goal
   */
  async completeGoal(userId: string, goalId: string): Promise<APIResponse> {
    try {
      // Get goal data
      const goalDoc = doc(db, 'goals', goalId);
      const goalData = await getDocs(query(collection(db, 'goals'), where('id', '==', goalId)));
      
      if (goalData.empty) {
        throw new Error('Goal not found');
      }

      const goal = goalData.docs[0].data();

      // Update goal status
      await updateDoc(goalDoc, {
        status: 'completed',
        progress: 100,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Award completion XP
      const completionXP = 500; // Base XP for goal completion
      await gamificationService.markGoalCompleted(userId, goalId, completionXP);

      // Update user stats
      await updateDoc(doc(db, 'userStats', userId), {
        goalsCompleted: increment(1),
        updatedAt: serverTimestamp()
      });

      // Show completion notification
      notificationService.success(
        'Goal Completed!',
        `Congratulations! You've completed "${goal.title}" and earned ${completionXP} XP!`
      );

      return {
        success: true,
        message: 'Goal completed successfully'
      };
    } catch (error) {
      console.error('Error completing goal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user dashboard data
   */
  async getUserDashboardData(userId: string): Promise<APIResponse<{
    stats: any;
    recentGoals: any[];
    achievements: any[];
    xpTransactions: any[];
  }>> {
    try {
      // Get user stats
      const userStats = await gamificationService.getUserStats(userId);
      
      // Get recent goals
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const goalsSnapshot = await getDocs(goalsQuery);
      const recentGoals = goalsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      }));

      // Get recent achievements
      const achievements = await gamificationService.getUserAchievements(userId);

      // Get recent XP transactions
      const xpTransactions = await gamificationService.getUserXPTransactions(userId, 10);

      return {
        success: true,
        data: {
          stats: userStats,
          recentGoals,
          achievements: achievements.slice(0, 5),
          xpTransactions
        }
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update user streak
   */
  async updateUserStreak(userId: string, incrementStreak: boolean = true): Promise<APIResponse> {
    try {
      await gamificationService.updateStreak(userId, incrementStreak);
      
      return {
        success: true,
        message: 'Streak updated successfully'
      };
    } catch (error) {
      console.error('Error updating streak:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mint NFT for achievement
   */
  async mintAchievementNFT(userId: string, achievementId: string): Promise<APIResponse<{ tokenId: string; txHash: string }>> {
    try {
      // This would integrate with your NFT minting service
      // For now, we'll simulate the process
      
      // Update achievement with NFT info
      await updateDoc(doc(db, 'achievements', achievementId), {
        nftMinted: true,
        nftTokenId: `token_${Date.now()}`,
        updatedAt: serverTimestamp()
      });

      // Show success notification
      notificationService.success(
        'NFT Minted!',
        'Your achievement has been minted as an NFT on the blockchain!'
      );

      return {
        success: true,
        data: {
          tokenId: `token_${Date.now()}`,
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`
        },
        message: 'NFT minted successfully'
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      notificationService.error(
        'NFT Minting Failed',
        'There was an error minting your NFT. Please try again.'
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch operations for performance
   */
  async batchUpdateUserData(userId: string, updates: any[]): Promise<APIResponse> {
    try {
      const batch = writeBatch(db);
      
      for (const update of updates) {
        const { collection: collectionName, docId, data } = update;
        const docRef = doc(db, collectionName, docId);
        batch.update(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

      return {
        success: true,
        message: 'Batch update completed successfully'
      };
    } catch (error) {
      console.error('Error in batch update:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Create singleton instance
export const apiService = new APIService();

// Hook for using API service
export const useAPI = () => {
  const { user } = useAuth();
  
  return {
    apiService,
    createGoalWithAI: (fourWOneHAnswers: any, chatSessionId: string) => 
      user ? apiService.createGoalWithAI(user.uid, fourWOneHAnswers, chatSessionId) : Promise.resolve({ success: false, error: 'User not authenticated' }),
    processProgressUpdate: (goalId: string, userMessage: string) => 
      user ? apiService.processProgressUpdate(user.uid, goalId, userMessage) : Promise.resolve({ success: false, error: 'User not authenticated' }),
    completeGoal: (goalId: string) => 
      user ? apiService.completeGoal(user.uid, goalId) : Promise.resolve({ success: false, error: 'User not authenticated' }),
    getUserDashboardData: () => 
      user ? apiService.getUserDashboardData(user.uid) : Promise.resolve({ success: false, error: 'User not authenticated' }),
    updateUserStreak: (incrementStreak?: boolean) => 
      user ? apiService.updateUserStreak(user.uid, incrementStreak) : Promise.resolve({ success: false, error: 'User not authenticated' }),
    mintAchievementNFT: (achievementId: string) => 
      user ? apiService.mintAchievementNFT(user.uid, achievementId) : Promise.resolve({ success: false, error: 'User not authenticated' }),
    batchUpdateUserData: (updates: any[]) => 
      user ? apiService.batchUpdateUserData(user.uid, updates) : Promise.resolve({ success: false, error: 'User not authenticated' })
  };
};
