import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  closed: boolean;
  lists: TrelloList[];
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  cards: TrelloCard[];
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  dueComplete: boolean;
  idList: string;
  labels: TrelloLabel[];
  url: string;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloGoal {
  id: string;
  name: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  listName: string;
  url: string;
  labels: string[];
}

class TrelloService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.trello.com/1';

  constructor() {
    this.apiKey = import.meta.env.VITE_TRELLO_API_KEY || '';
    this.apiSecret = import.meta.env.VITE_TRELLO_API_SECRET || '';
    
    // Debug logging (commented out for production)
    // console.log('Trello API Key:', this.apiKey ? 'Set' : 'Not set');
    // console.log('Trello API Secret:', this.apiSecret ? 'Set' : 'Not set');
  }

  /**
   * Get Trello OAuth URL for user authentication
   */
  getOAuthUrl(): string {
    const returnUrl = `${window.location.origin}/oauth-callback`;
    const scope = 'read,write';
    const expiration = 'never';
    const name = 'Agilow Goal Forge';
    
    // Use Trello's direct authorization URL (current method)
    const oauthUrl = `https://trello.com/1/authorize?key=${this.apiKey}&response_type=token&scope=${scope}&expiration=${expiration}&name=${encodeURIComponent(name)}&return_url=${encodeURIComponent(returnUrl)}`;
    
    console.log('=== OAuth URL Debug ===');
    console.log('API Key:', this.apiKey ? 'Set' : 'Not set');
    console.log('Return URL:', returnUrl);
    console.log('Full OAuth URL:', oauthUrl);
    console.log('======================');
    
    return oauthUrl;
  }

  /**
   * Handle OAuth callback and extract token from URL
   */
  async handleOAuthCallback(userId: string): Promise<string | null> {
    console.log('handleOAuthCallback called with userId:', userId);
    console.log('Current URL:', window.location.href);
    console.log('Current URL hash:', window.location.hash);
    console.log('Current URL search:', window.location.search);
    
    let token = null;
    
    // Check URL hash first
    const hash = window.location.hash;
    if (hash && hash.includes('token=')) {
      console.log('Token found in URL hash');
      const urlParams = new URLSearchParams(hash.substring(1));
      token = urlParams.get('token');
    }
    
    // Check URL search parameters if not found in hash
    if (!token) {
      const search = window.location.search;
      if (search && search.includes('token=')) {
        console.log('Token found in URL search parameters');
        const urlParams = new URLSearchParams(search.substring(1));
        token = urlParams.get('token');
      }
    }
    
    if (!token) {
      console.log('No token found in URL hash or search parameters');
      return null;
    }
    
    console.log('Extracted token:', token ? token.substring(0, 10) + '...' : 'null');
    
    if (token) {
      await this.setToken(userId, token);
      // Clean up URL immediately to prevent multiple calls
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('Token saved and URL cleaned up');
      return token;
    }
    
    return null;
  }

  /**
   * Check if user has Trello token stored
   */
  async hasToken(userId: string): Promise<boolean> {
    try {
      console.log('Checking Trello token for user:', userId);
      const tokenDoc = await getDoc(doc(db, 'trello_tokens', userId));
      const hasToken = tokenDoc.exists() && !!tokenDoc.data()?.token;
      console.log('Token exists:', hasToken, 'Doc exists:', tokenDoc.exists(), 'Token data:', tokenDoc.data());
      return hasToken;
    } catch (error) {
      console.error('Error checking Trello token:', error);
      return false;
    }
  }

  /**
   * Get stored Trello token
   */
  async getToken(userId: string): Promise<string | null> {
    try {
      const tokenDoc = await getDoc(doc(db, 'trello_tokens', userId));
      if (tokenDoc.exists()) {
        return tokenDoc.data()?.token || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting Trello token:', error);
      return null;
    }
  }

  /**
   * Store Trello token
   */
  async setToken(userId: string, token: string): Promise<void> {
    try {
      console.log('Storing Trello token for user:', userId, 'Token length:', token.length);
      await setDoc(doc(db, 'trello_tokens', userId), {
        token,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Trello token stored successfully');
    } catch (error) {
      console.error('Error storing Trello token:', error);
      throw error;
    }
  }

  /**
   * Remove Trello token
   */
  async removeToken(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'trello_tokens', userId));
    } catch (error) {
      console.error('Error removing Trello token:', error);
      throw error;
    }
  }

  /**
   * Make authenticated request to Trello API
   */
  private async makeRequest(userId: string, endpoint: string, params: Record<string, any> = {}, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): Promise<any> {
    console.log('makeRequest called:', { userId, endpoint, params, method });
    
    const token = await this.getToken(userId);
    console.log('Token retrieved:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.error('No Trello token found for user:', userId);
      throw new Error('No Trello token found. Please authenticate first.');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('token', token);
    
    let requestOptions: RequestInit = {
      method,
    };

    if (method === 'GET') {
      // For GET requests, add parameters to URL
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    } else {
      // For POST/PUT/DELETE requests, add parameters to body
      requestOptions.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      requestOptions.body = new URLSearchParams(params).toString();
    }

    console.log('Making request to:', url.toString());
    console.log('Request options:', requestOptions);
    
    const response = await fetch(url.toString(), requestOptions);
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trello API error response:', errorText);
      
      if (response.status === 401) {
        await this.removeToken(userId);
        throw new Error('Trello authentication expired. Please re-authenticate.');
      }
      throw new Error(`Trello API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Trello API response:', result);
    return result;
  }

  /**
   * Get user's Trello boards
   */
  async getBoards(userId: string): Promise<TrelloBoard[]> {
    const boards = await this.makeRequest(userId, '/members/me/boards', {
      filter: 'open',
      fields: 'id,name,desc,url,closed',
      lists: 'open',
      list_fields: 'id,name,closed'
    });

    // Get cards for each board
    const boardsWithCards = await Promise.all(
      boards.map(async (board: any) => {
        const lists = await this.makeRequest(userId, `/boards/${board.id}/lists`, {
          filter: 'open',
          fields: 'id,name,closed',
          cards: 'open',
          card_fields: 'id,name,desc,due,dueComplete,idList,labels,url'
        });

        return {
          ...board,
          lists: lists.map((list: any) => ({
            ...list,
            cards: list.cards || []
          }))
        };
      })
    );

    return boardsWithCards;
  }

  /**
   * Get goals from Trello boards (cards from all boards)
   */
  async getGoals(userId: string): Promise<TrelloGoal[]> {
    const boards = await this.getBoards(userId);
    const goals: TrelloGoal[] = [];

    boards.forEach(board => {
      board.lists.forEach((list: TrelloList) => {
        list.cards.forEach(card => {
          // Determine status based on list name
          let status: 'todo' | 'in-progress' | 'completed' = 'todo';
          if (list.name.toLowerCase().includes('progress') || list.name.toLowerCase().includes('doing')) {
            status = 'in-progress';
          } else if (list.name.toLowerCase().includes('done') || list.name.toLowerCase().includes('complete')) {
            status = 'completed';
          }

          // Determine priority based on labels
          let priority: 'low' | 'medium' | 'high' = 'medium';
          if (card.labels.some(label => label.name.toLowerCase().includes('high') || label.color === 'red')) {
            priority = 'high';
          } else if (card.labels.some(label => label.name.toLowerCase().includes('low') || label.color === 'green')) {
            priority = 'low';
          }

          goals.push({
            id: card.id,
            name: card.name,
            description: card.desc || '',
            status,
            dueDate: card.due ? new Date(card.due).toISOString().split('T')[0] : undefined,
            priority,
            listName: list.name,
            url: card.url,
            labels: card.labels.map(label => label.name)
          });
        });
      });
    });

    return goals;
  }

  /**
   * Create a new card in a specific list
   */
  async createCard(userId: string, listId: string, name: string, description?: string, dueDate?: string): Promise<TrelloCard> {
    const params: Record<string, any> = {
      name,
      idList: listId
    };

    if (description) {
      params.desc = description;
    }

    if (dueDate) {
      params.due = new Date(dueDate).toISOString();
    }

    return this.makeRequest(userId, '/cards', params, 'POST');
  }

  /**
   * Update a card
   */
  async updateCard(userId: string, cardId: string, updates: Partial<TrelloCard>): Promise<TrelloCard> {
    const params: Record<string, any> = {};
    
    if (updates.name) params.name = updates.name;
    if (updates.desc) params.desc = updates.desc;
    if (updates.due) params.due = new Date(updates.due).toISOString();
    if (updates.idList) params.idList = updates.idList;

    return this.makeRequest(userId, `/cards/${cardId}`, params);
  }

  /**
   * Delete a card
   */
  async deleteCard(userId: string, cardId: string): Promise<void> {
    await this.makeRequest(userId, `/cards/${cardId}`, {});
  }

  /**
   * Create a new board for a goal with AI-generated structure
   */
  async createGoalBoard(userId: string, goalTitle: string, goalDescription: string, weeklyTasks: any[]): Promise<{ boardId: string; boardUrl: string }> {
    console.log('createGoalBoard called with:', { userId, goalTitle, goalDescription, weeklyTasks });
    
    try {
      // Check if user has valid token first
      const hasToken = await this.hasToken(userId);
      if (!hasToken) {
        throw new Error('No Trello token found. Please authenticate first.');
      }

      // Create the main board
      console.log('Creating Trello board...');
      const board = await this.makeRequest(userId, '/boards', {
        name: `🎯 ${goalTitle}`,
        desc: `Goal created by Agilow AI: ${goalDescription}`,
        defaultLists: false
      }, 'POST');
      console.log('Board created successfully:', board);

    const boardId = board.id;
    const boardUrl = board.url;

    // Create lists
    const lists = ['To Do', 'Doing', 'Done', 'BHAG'];
    const listIds: { [key: string]: string } = {};

    for (const listName of lists) {
      const list = await this.makeRequest(userId, '/lists', {
        name: listName,
        idBoard: boardId
      }, 'POST');
      listIds[listName] = list.id;
    }

    // Create weekly tasks in To Do list
    for (const week of weeklyTasks) {
      const weekCard = await this.makeRequest(userId, '/cards', {
        name: `Week ${week.weekNumber}`,
        desc: week.description || `Tasks for Week ${week.weekNumber}`,
        idList: listIds['To Do']
      }, 'POST');

      // Create checklist for the week
      if (week.tasks && week.tasks.length > 0) {
        const checklist = await this.makeRequest(userId, `/cards/${weekCard.id}/checklists`, {
          name: 'Tasks'
        }, 'POST');

        // Add checklist items
        for (const task of week.tasks) {
          await this.makeRequest(userId, `/checklists/${checklist.id}/checkItems`, {
            name: task.name,
            pos: 'bottom'
          }, 'POST');
        }
      }
    }

    return { boardId, boardUrl };
    } catch (error) {
      console.error('Error in createGoalBoard:', error);
      throw error;
    }
  }

  /**
   * Add image to BHAG list
   */
  async addImageToBHAG(userId: string, boardId: string, imageUrl: string, imageName: string): Promise<void> {
    // Get BHAG list
    const lists = await this.makeRequest(userId, `/boards/${boardId}/lists`);
    const bhagList = lists.find((list: any) => list.name === 'BHAG');
    
    if (!bhagList) {
      throw new Error('BHAG list not found');
    }

    // Create card with image attachment
    const card = await this.makeRequest(userId, '/cards', {
      name: imageName,
      desc: 'AI-generated vision for your goal',
      idList: bhagList.id
    }, 'POST');

    // Attach image to card
    await this.makeRequest(userId, `/cards/${card.id}/attachments`, {
      url: imageUrl,
      name: imageName,
      mimeType: 'image/png'
    }, 'POST');
  }

  /**
   * Update card checklist item
   */
  async updateChecklistItem(userId: string, cardId: string, checklistId: string, itemId: string, completed: boolean): Promise<void> {
    await this.makeRequest(userId, `/cards/${cardId}/checklist/${checklistId}/checkItem/${itemId}`, {
      state: completed ? 'complete' : 'incomplete'
    });
  }

  /**
   * Move card between lists
   */
  async moveCard(userId: string, cardId: string, listId: string): Promise<void> {
    await this.makeRequest(userId, `/cards/${cardId}`, {
      idList: listId
    });
  }

  /**
   * Get card with checklists
   */
  async getCardWithChecklists(userId: string, cardId: string): Promise<any> {
    return this.makeRequest(userId, `/cards/${cardId}`, {
      checklists: 'all',
      checklist_fields: 'all'
    });
  }

  /**
   * Move card to a different list
   */
  async moveCardToList(userId: string, cardId: string, listId: string): Promise<void> {
    try {
      await this.makeRequest(userId, `/cards/${cardId}`, {
        idList: listId
      }, 'PUT');
      console.log(`Card ${cardId} moved to list ${listId}`);
    } catch (error) {
      console.error('Error moving card:', error);
      throw error;
    }
  }

  /**
   * Find card by name in a board
   */
  async findCardByName(userId: string, boardId: string, cardName: string): Promise<any> {
    try {
      const lists = await this.makeRequest(userId, `/boards/${boardId}/lists`, {
        filter: 'open',
        fields: 'id,name,closed'
      }, 'GET');

      for (const list of lists) {
        const cards = await this.makeRequest(userId, `/lists/${list.id}/cards`, {
          filter: 'open',
          fields: 'id,name,desc,idList'
        }, 'GET');

        const card = cards.find((card: any) => 
          card.name.toLowerCase().includes(cardName.toLowerCase())
        );

        if (card) {
          return { ...card, listName: list.name };
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding card:', error);
      throw error;
    }
  }

  /**
   * Get lists in a board
   */
  async getBoardLists(userId: string, boardId: string): Promise<any[]> {
    try {
      return await this.makeRequest(userId, `/boards/${boardId}/lists`, {
        filter: 'open',
        fields: 'id,name,closed'
      }, 'GET');
    } catch (error) {
      console.error('Error getting board lists:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const trelloService = new TrelloService();

// Hook for using Trello service
export const useTrello = () => {
  const { user } = useAuth();
  
  return {
    trelloService,
    isAuthenticated: () => user ? trelloService.hasToken(user.uid) : Promise.resolve(false),
    authenticate: () => {
      console.log('authenticate() called');
      const oauthUrl = trelloService.getOAuthUrl();
      console.log('Redirecting to OAuth URL:', oauthUrl);
      window.location.href = oauthUrl;
    },
    disconnect: () => {
      if (user) {
        return trelloService.removeToken(user.uid);
      }
    },
    handleCallback: () => {
      if (!user) throw new Error('User not authenticated');
      return trelloService.handleOAuthCallback(user.uid);
    },
    createGoalBoard: (goalTitle: string, goalDescription: string, weeklyTasks: any[]) => {
      if (!user) throw new Error('User not authenticated');
      return trelloService.createGoalBoard(user.uid, goalTitle, goalDescription, weeklyTasks);
    },
    addImageToBHAG: (boardId: string, imageUrl: string, imageName: string) => {
      if (!user) throw new Error('User not authenticated');
      return trelloService.addImageToBHAG(user.uid, boardId, imageUrl, imageName);
    },
    moveCardToList: (cardId: string, listId: string) => {
      if (!user) throw new Error('User not authenticated');
      return trelloService.moveCardToList(user.uid, cardId, listId);
    },
    findCardByName: (boardId: string, cardName: string) => {
      if (!user) throw new Error('User not authenticated');
      return trelloService.findCardByName(user.uid, boardId, cardName);
    },
    getBoardLists: (boardId: string) => {
      if (!user) throw new Error('User not authenticated');
      return trelloService.getBoardLists(user.uid, boardId);
    }
  };
};
