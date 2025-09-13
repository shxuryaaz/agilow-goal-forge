import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { Goal, Milestone, OpenAIGoalResponse, NFTData } from '@/types/firebase';
import { mintGoalNFT } from './nft';
import { gamificationService } from './gamification';

// Cloud Functions
const processGoalWithAI = httpsCallable(functions, 'processGoalWithAI');
const createTrelloBoard = httpsCallable(functions, 'createTrelloBoard');
const sendSlackNotification = httpsCallable(functions, 'sendSlackNotification');

// Create a new goal
export const createGoal = async (userId: string, goalText: string, walletAddress?: string): Promise<Goal> => {
  try {
    // Call AI processing function
    const aiResult = await processGoalWithAI({ goal: goalText });
    const aiData = aiResult.data as OpenAIGoalResponse;

    // Create goal document
    const goalData: Omit<Goal, 'id'> = {
      userId,
      goal: aiData.goal,
      smartSummary: aiData.SMART_summary,
      milestones: aiData.milestones.map((milestone, index) => ({
        ...milestone,
        id: `milestone_${Date.now()}_${index}`,
        status: 'pending' as const,
        xpReward: 20,
      })),
      risks: aiData.risks.map((risk, index) => ({
        ...risk,
        id: `risk_${Date.now()}_${index}`,
        status: 'identified' as const,
      })),
      timeline: aiData.timeline.map((item, index) => ({
        ...item,
        id: `timeline_${Date.now()}_${index}`,
        status: 'pending' as const,
      })),
      status: 'active',
      xpAwarded: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const goalRef = await addDoc(collection(db, 'goals'), goalData);
    const goalId = goalRef.id;

    // Create Trello board
    try {
      const trelloResult = await createTrelloBoard({
        goalId,
        goalTitle: aiData.goal,
        milestones: goalData.milestones,
      });
      
      const trelloData = trelloResult.data as { boardUrl: string; boardId: string };
      
      // Update goal with Trello information
      await updateDoc(doc(db, 'goals', goalId), {
        trelloBoardUrl: trelloData.boardUrl,
        trelloBoardId: trelloData.boardId,
      });
    } catch (trelloError) {
      console.error('Trello integration failed:', trelloError);
      // Continue without Trello integration
    }

    // Send Slack notification
    try {
      await sendSlackNotification({
        goalId,
        goalTitle: aiData.goal,
        trelloBoardUrl: goalData.trelloBoardUrl,
      });
    } catch (slackError) {
      console.error('Slack notification failed:', slackError);
      // Continue without Slack notification
    }

    // Mint Proof-of-Commitment NFT if wallet address is provided
    let nftData: NFTData | undefined;
    if (walletAddress) {
      try {
        const nftResult = await mintGoalNFT(
          goalId,
          aiData.goal,
          aiData.SMART_summary,
          aiData.milestones.map(m => m.title),
          userId,
          walletAddress
        );

        if (nftResult.success && nftResult.tokenId && nftResult.contractAddress && nftResult.metadataURL) {
          nftData = {
            tokenId: nftResult.tokenId,
            contractAddress: nftResult.contractAddress,
            metadataURL: nftResult.metadataURL,
            transactionHash: nftResult.transactionHash,
            mintedAt: serverTimestamp() as any,
          };

          // Update goal with NFT information
          await updateDoc(doc(db, 'goals', goalId), {
            nft: nftData,
          });
        }
      } catch (nftError) {
        console.error('NFT minting failed:', nftError);
        // Continue without NFT minting
      }
    }

    // Award BHAG creation achievement
    try {
      await gamificationService.unlockAchievement(userId, 'bhag_creator', {
        title: 'BHAG Creator',
        description: 'Created your first Big Hairy Audacious Goal!',
        xpReward: 50,
        rarity: 'epic',
        icon: '🎯'
      });
    } catch (achievementError) {
      console.error('BHAG achievement failed:', achievementError);
      // Continue without achievement
    }

    return { 
      id: goalId, 
      ...goalData,
      nft: nftData,
    };
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
};

// Get user's goals
export const getUserGoals = async (userId: string): Promise<Goal[]> => {
  try {
    const goalsQuery = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(goalsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Goal[];
  } catch (error) {
    console.error('Error getting user goals:', error);
    throw error;
  }
};

// Get a specific goal
export const getGoal = async (goalId: string): Promise<Goal | null> => {
  try {
    const goalDoc = await getDoc(doc(db, 'goals', goalId));
    if (goalDoc.exists()) {
      return { id: goalDoc.id, ...goalDoc.data() } as Goal;
    }
    return null;
  } catch (error) {
    console.error('Error getting goal:', error);
    throw error;
  }
};

// Update goal status
export const updateGoalStatus = async (goalId: string, status: Goal['status']) => {
  try {
    const goalRef = doc(db, 'goals', goalId);
    await updateDoc(goalRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating goal status:', error);
    throw error;
  }
};

// Update milestone status
export const updateMilestoneStatus = async (
  goalId: string,
  milestoneId: string,
  status: Milestone['status']
) => {
  try {
    const goalDoc = await getDoc(doc(db, 'goals', goalId));
    if (goalDoc.exists()) {
      const goalData = goalDoc.data() as Goal;
      const updatedMilestones = goalData.milestones.map(milestone =>
        milestone.id === milestoneId ? { ...milestone, status } : milestone
      );

      await updateDoc(doc(db, 'goals', goalId), {
        milestones: updatedMilestones,
        updatedAt: serverTimestamp(),
      });

      // Award XP for milestone completion
      if (status === 'completed') {
        const milestone = updatedMilestones.find(m => m.id === milestoneId);
        if (milestone) {
          // This will be handled by the gamification service
          return milestone.xpReward;
        }
      }
    }
    return 0;
  } catch (error) {
    console.error('Error updating milestone status:', error);
    throw error;
  }
};

// Delete a goal
export const deleteGoal = async (goalId: string) => {
  try {
    await deleteDoc(doc(db, 'goals', goalId));
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

// Get goals by status
export const getGoalsByStatus = async (userId: string, status: Goal['status']): Promise<Goal[]> => {
  try {
    const goalsQuery = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(goalsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Goal[];
  } catch (error) {
    console.error('Error getting goals by status:', error);
    throw error;
  }
};
