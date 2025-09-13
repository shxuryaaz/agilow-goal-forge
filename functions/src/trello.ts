import * as functions from 'firebase-functions';
import axios from 'axios';

interface TrelloMilestone {
  title: string;
  description: string;
  dueDate?: string;
  xpReward: number;
}

export const createTrelloBoard = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { goalId, goalTitle, milestones } = data;
    
    if (!goalId || !goalTitle || !Array.isArray(milestones)) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }

    const trelloApiKey = functions.config().trello?.api_key || process.env.TRELLO_API_KEY;
    const trelloToken = functions.config().trello?.token || process.env.TRELLO_TOKEN;

    if (!trelloApiKey || !trelloToken) {
      console.warn('Trello credentials not configured, skipping Trello integration');
      return { boardUrl: null, boardId: null };
    }

    // Create Trello board
    const boardResponse = await axios.post('https://api.trello.com/1/boards', {
      name: `Agilow Goal: ${goalTitle}`,
      desc: `Goal created by Agilow: ${goalTitle}`,
      defaultLists: false,
      key: trelloApiKey,
      token: trelloToken,
    });

    const boardId = boardResponse.data.id;
    const boardUrl = boardResponse.data.url;

    // Create lists
    const lists = ['To Do', 'In Progress', 'Done'];
    const listIds: { [key: string]: string } = {};

    for (const listName of lists) {
      const listResponse = await axios.post('https://api.trello.com/1/lists', {
        name: listName,
        idBoard: boardId,
        key: trelloApiKey,
        token: trelloToken,
      });
      listIds[listName] = listResponse.data.id;
    }

    // Create cards for milestones
    for (const milestone of milestones as TrelloMilestone[]) {
      const dueDate = milestone.dueDate ? new Date(milestone.dueDate).toISOString() : null;
      
      await axios.post('https://api.trello.com/1/cards', {
        name: milestone.title,
        desc: `${milestone.description}\n\nXP Reward: ${milestone.xpReward}`,
        idList: listIds['To Do'],
        due: dueDate,
        key: trelloApiKey,
        token: trelloToken,
      });
    }

    // Add a welcome card
    await axios.post('https://api.trello.com/1/cards', {
      name: '🎯 Welcome to Your Goal Board!',
      desc: `This board was created by Agilow to help you track your goal: "${goalTitle}"\n\nUse the lists to organize your progress:\n- **To Do**: Tasks to be completed\n- **In Progress**: Currently working on\n- **Done**: Completed tasks\n\nEach milestone card shows the XP reward you'll earn when completed!`,
      idList: listIds['To Do'],
      key: trelloApiKey,
      token: trelloToken,
    });

    return {
      boardUrl,
      boardId,
    };

  } catch (error) {
    console.error('Error creating Trello board:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Don't throw error for Trello integration failures, just log and continue
    console.warn('Trello integration failed, continuing without it');
    return { boardUrl: null, boardId: null };
  }
});

