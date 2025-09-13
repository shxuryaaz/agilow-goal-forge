// BHAG completion detection and certificate awarding service
import { certificateService } from './certificates';
import { trelloService } from './trello';

export interface BHAGProgress {
  boardId: string;
  goalTitle: string;
  totalCards: number;
  completedCards: number;
  completionPercentage: number;
  isCompleted: boolean;
}

class BHAGCompletionService {
  /**
   * Check if a BHAG board is completed based on Trello progress
   */
  async checkBHAGCompletion(userId: string, boardId: string, goalTitle: string): Promise<BHAGProgress> {
    try {
      // Get all lists and cards for the board using the user's token
      const lists = await trelloService.getBoardLists(userId, boardId);
      
      let totalCards = 0;
      let completedCards = 0;

      // Count cards in each list
      for (const list of lists) {
        if (list.cards) {
          totalCards += list.cards.length;
          
          // Count cards in "Done" list as completed
          if (list.name.toLowerCase().includes('done') || 
              list.name.toLowerCase().includes('completed') ||
              list.name.toLowerCase().includes('finished')) {
            completedCards += list.cards.length;
          }
        }
      }

      const completionPercentage = totalCards > 0 ? (completedCards / totalCards) * 100 : 0;
      const isCompleted = completionPercentage >= 80; // 80% completion threshold

      return {
        boardId,
        goalTitle,
        totalCards,
        completedCards,
        completionPercentage,
        isCompleted
      };

    } catch (error) {
      console.error('Error checking BHAG completion:', error);
      return {
        boardId,
        goalTitle,
        totalCards: 0,
        completedCards: 0,
        completionPercentage: 0,
        isCompleted: false
      };
    }
  }

  /**
   * Award certificate if BHAG is completed
   */
  async awardCompletionCertificate(userId: string, boardId: string, goalTitle: string): Promise<boolean> {
    try {
      const progress = await this.checkBHAGCompletion(userId, boardId, goalTitle);
      
      if (progress.isCompleted) {
        // Check if certificate already exists for this BHAG
        const existingCertificates = certificateService.getUserCertificates(userId);
        const alreadyAwarded = existingCertificates.some(cert => 
          cert.type === 'bhag_completion' && cert.goalTitle === goalTitle
        );

        if (!alreadyAwarded) {
          // Award certificate
          await certificateService.generateBHAGCertificate(userId, goalTitle);
          console.log(`🎖️ BHAG Completion Certificate awarded for: ${goalTitle}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error awarding completion certificate:', error);
      return false;
    }
  }

  /**
   * Get completion progress for a specific BHAG
   */
  async getBHAGProgress(userId: string, boardId: string, goalTitle: string): Promise<BHAGProgress> {
    return await this.checkBHAGCompletion(userId, boardId, goalTitle);
  }

  /**
   * Check all user's BHAGs for completion (for periodic checks)
   */
  async checkAllBHAGsForCompletion(userId: string): Promise<void> {
    try {
      // This would need to be implemented based on how you store user's BHAG boards
      // For now, this is a placeholder for future implementation
      console.log(`Checking all BHAGs for completion for user: ${userId}`);
    } catch (error) {
      console.error('Error checking all BHAGs for completion:', error);
    }
  }
}

// Create singleton instance
export const bhagCompletionService = new BHAGCompletionService();
