// Local XP service - completely bypasses Firebase for XP management
import { setXPCookie, getXPCookie, updateXPCookie, incrementXPCookie } from '@/lib/cookies';

export interface LocalXPTransaction {
  id: string;
  amount: number;
  reason: string;
  source: 'milestone' | 'achievement' | 'streak' | 'goal_completion';
  timestamp: Date;
  goalId?: string;
  achievementId?: string;
}

class LocalXPService {
  private transactions: LocalXPTransaction[] = [];

  /**
   * Award XP locally (no Firebase)
   */
  async awardXP(userId: string, amount: number, reason: string, source: LocalXPTransaction['source'], goalId?: string, achievementId?: string): Promise<void> {
    try {
      // Create local transaction
      const transaction: LocalXPTransaction = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        reason,
        source,
        timestamp: new Date(),
        goalId,
        achievementId
      };

      // Store transaction locally
      this.transactions.push(transaction);

      // Update XP in cookies
      const currentXP = getXPCookie();
      const newXP = currentXP + amount;
      updateXPCookie(newXP);

      console.log(`✅ Local XP awarded: +${amount} (${reason}) - Total: ${newXP}`);
      
      // Save transactions to localStorage for persistence
      this.saveTransactionsToStorage();
      
    } catch (error) {
      console.error('Error awarding local XP:', error);
      throw error;
    }
  }

  /**
   * Get current XP from cookies
   */
  getCurrentXP(): number {
    return getXPCookie();
  }

  /**
   * Get all transactions
   */
  getTransactions(): LocalXPTransaction[] {
    return this.transactions;
  }

  /**
   * Get transactions for a specific user
   */
  getUserTransactions(userId: string): LocalXPTransaction[] {
    // For local storage, we'll return all transactions since we're single-user
    return this.transactions;
  }

  /**
   * Save transactions to localStorage
   */
  private saveTransactionsToStorage(): void {
    try {
      localStorage.setItem('agilow_xp_transactions', JSON.stringify(this.transactions));
    } catch (error) {
      console.error('Error saving transactions to localStorage:', error);
    }
  }

  /**
   * Load transactions from localStorage
   */
  private loadTransactionsFromStorage(): void {
    try {
      const stored = localStorage.getItem('agilow_xp_transactions');
      if (stored) {
        this.transactions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading transactions from localStorage:', error);
      this.transactions = [];
    }
  }

  /**
   * Initialize the service
   */
  init(): void {
    this.loadTransactionsFromStorage();
    console.log(`Local XP service initialized with ${this.transactions.length} transactions`);
  }

  /**
   * Clear all data (for testing)
   */
  clearAllData(): void {
    this.transactions = [];
    localStorage.removeItem('agilow_xp_transactions');
    console.log('All local XP data cleared');
  }
}

// Create singleton instance
export const localXPService = new LocalXPService();

// Initialize on import
localXPService.init();
