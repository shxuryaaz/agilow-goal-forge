import { useAuth } from '@/contexts/AuthContext';

export interface FourWOneHAnswers {
  what: string;
  why: string;
  when: string;
  where: string;
  who: string;
  how: string;
}

export interface WeeklyTask {
  weekNumber: number;
  description: string;
  tasks: {
    name: string;
    description?: string;
    estimatedTime?: string;
  }[];
}

export interface GoalStructure {
  title: string;
  description: string;
  weeklyTasks: WeeklyTask[];
  totalWeeks: number;
  estimatedCompletion: string;
}

class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  /**
   * Generate 4W1H questions based on initial goal input
   */
  generate4W1HQuestions(initialGoal: string): string[] {
    return [
      `What exactly do you want to achieve with "${initialGoal}"? Be as specific as possible.`,
      `Why is this goal important to you? What's your motivation behind it?`,
      `When do you want to achieve this goal? What's your target timeline?`,
      `Where will you be working on this goal? What's your environment?`,
      `Who else might be involved in helping you achieve this goal?`,
      `How do you plan to approach this goal? What's your strategy?`
    ];
  }

  /**
   * Process 4W1H answers and create goal structure
   */
  async process4W1HAnswers(answers: FourWOneHAnswers): Promise<GoalStructure> {
    if (!this.apiKey) {
      // Fallback to mock data if no API key
      return this.generateMockGoalStructure(answers);
    }

    try {
      const prompt = `
        Based on these 4W1H answers, create a detailed goal structure:
        
        What: ${answers.what}
        Why: ${answers.why}
        When: ${answers.when}
        Where: ${answers.where}
        Who: ${answers.who}
        How: ${answers.how}
        
        Please create a weekly breakdown with specific tasks. Return as JSON with this structure:
        {
          "title": "Goal title",
          "description": "Detailed description",
          "weeklyTasks": [
            {
              "weekNumber": 1,
              "description": "Week 1 focus",
              "tasks": [
                {
                  "name": "Task name",
                  "description": "Task description",
                  "estimatedTime": "Time estimate"
                }
              ]
            }
          ],
          "totalWeeks": 4,
          "estimatedCompletion": "Completion date"
        }
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert goal-setting coach. Create detailed, actionable weekly breakdowns for goals.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('AI service error:', error);
    }

    // Fallback to mock data
    return this.generateMockGoalStructure(answers);
  }

  /**
   * Generate image based on 4W1H answers
   */
  async generateGoalImage(answers: FourWOneHAnswers): Promise<string> {
    if (!this.apiKey) {
      // Return a placeholder image URL
      return 'https://via.placeholder.com/400x300/4ADE80/FFFFFF?text=Goal+Vision';
    }

    try {
      const imagePrompt = `
        Create an inspiring, motivational image representing this goal:
        What: ${answers.what}
        Why: ${answers.why}
        When: ${answers.when}
        Where: ${answers.where}
        
        The image should be professional, inspiring, and represent achievement and success.
        Style: modern, clean, motivational poster style.
      `;

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          n: 1,
          size: '512x512',
          response_format: 'url'
        })
      });

      const data = await response.json();
      return data.data[0]?.url || 'https://via.placeholder.com/400x300/4ADE80/FFFFFF?text=Goal+Vision';
    } catch (error) {
      console.error('Image generation error:', error);
      return 'https://via.placeholder.com/400x300/4ADE80/FFFFFF?text=Goal+Vision';
    }
  }

  /**
   * Process user progress update and determine Trello actions
   */
  async processProgressUpdate(userMessage: string, currentCards: any[]): Promise<{
    actions: Array<{
      type: 'update_checklist' | 'move_card' | 'complete_week';
      cardId: string;
      checklistId?: string;
      itemId?: string;
      completed?: boolean;
      newListId?: string;
    }>;
    response: string;
  }> {
    if (!this.apiKey) {
      return this.generateMockProgressResponse(userMessage);
    }

    try {
      const prompt = `
        User said: "${userMessage}"
        
        Available cards: ${JSON.stringify(currentCards.map(card => ({
          id: card.id,
          name: card.name,
          listName: card.listName,
          checklists: card.checklists
        })))}
        
        Determine what Trello actions to take. Return JSON:
        {
          "actions": [
            {
              "type": "update_checklist",
              "cardId": "card_id",
              "checklistId": "checklist_id", 
              "itemId": "item_id",
              "completed": true
            }
          ],
          "response": "Encouraging response to user"
        }
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a goal-tracking assistant. Analyze user progress and determine Trello actions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Progress processing error:', error);
    }

    return this.generateMockProgressResponse(userMessage);
  }

  /**
   * Generate mock goal structure for fallback
   */
  private generateMockGoalStructure(answers: FourWOneHAnswers): GoalStructure {
    return {
      title: answers.what,
      description: `Goal: ${answers.what}\nWhy: ${answers.why}\nTimeline: ${answers.when}`,
      totalWeeks: 4,
      estimatedCompletion: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      weeklyTasks: [
        {
          weekNumber: 1,
          description: 'Foundation and planning',
          tasks: [
            { name: 'Research and gather resources', estimatedTime: '2 hours' },
            { name: 'Create initial plan', estimatedTime: '1 hour' },
            { name: 'Set up workspace', estimatedTime: '30 minutes' }
          ]
        },
        {
          weekNumber: 2,
          description: 'Initial implementation',
          tasks: [
            { name: 'Start core work', estimatedTime: '3 hours' },
            { name: 'Track progress', estimatedTime: '30 minutes' },
            { name: 'Adjust plan if needed', estimatedTime: '1 hour' }
          ]
        },
        {
          weekNumber: 3,
          description: 'Deep work and refinement',
          tasks: [
            { name: 'Continue core work', estimatedTime: '4 hours' },
            { name: 'Review and refine', estimatedTime: '1 hour' },
            { name: 'Prepare for completion', estimatedTime: '1 hour' }
          ]
        },
        {
          weekNumber: 4,
          description: 'Finalization and completion',
          tasks: [
            { name: 'Complete remaining work', estimatedTime: '2 hours' },
            { name: 'Final review', estimatedTime: '1 hour' },
            { name: 'Celebrate achievement', estimatedTime: '30 minutes' }
          ]
        }
      ]
    };
  }

  /**
   * Generate context-aware response for progress discussion
   */
  async generateProgressDiscussionResponse(
    userMessage: string, 
    userGoals: any[], 
    trelloBoards: any[], 
    chatHistory: any[]
  ): Promise<string> {
    if (!this.apiKey) {
      return this.generateMockProgressDiscussion(userMessage, userGoals);
    }

    try {
      const prompt = `
        You are an AI goal coach and progress tracker. The user is discussing their progress with you.
        
        User message: "${userMessage}"
        
        User's Goals: ${JSON.stringify(userGoals.map(goal => ({
          title: goal.title,
          description: goal.description,
          status: goal.status,
          progress: goal.progress,
          createdAt: goal.createdAt
        })))}
        
        User's Trello Boards: ${JSON.stringify(trelloBoards.map(board => ({
          name: board.name,
          lists: board.lists?.map((list: any) => ({
            name: list.name,
            cards: list.cards?.map((card: any) => ({
              name: card.name,
              due: card.due,
              dueComplete: card.dueComplete
            }))
          }))
        })))}
        
        Recent Chat History: ${JSON.stringify(chatHistory.slice(-5).map(msg => ({
          type: msg.type,
          content: msg.content.substring(0, 100) + '...'
        })))}
        
        Provide a helpful, encouraging response that:
        1. Acknowledges their progress
        2. References their specific goals and Trello boards
        3. Offers actionable advice or motivation
        4. Asks relevant follow-up questions
        5. Shows understanding of their context
        
        Be conversational, supportive, and specific to their situation.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert goal coach and progress tracker. You help users stay motivated and on track with their goals by providing personalized, context-aware advice and encouragement.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.8
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        return content;
      }
    } catch (error) {
      console.error('Progress discussion error:', error);
    }

    return this.generateMockProgressDiscussion(userMessage, userGoals);
  }

  /**
   * Analyze progress and provide insights
   */
  async analyzeProgress(userGoals: any[], trelloBoards: any[]): Promise<{
    insights: string[];
    recommendations: string[];
    progressSummary: string;
  }> {
    if (!this.apiKey) {
      return this.generateMockProgressAnalysis(userGoals);
    }

    try {
      const prompt = `
        Analyze the user's progress across their goals and Trello boards:
        
        Goals: ${JSON.stringify(userGoals.map(goal => ({
          title: goal.title,
          status: goal.status,
          progress: goal.progress,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt
        })))}
        
        Trello Boards: ${JSON.stringify(trelloBoards.map(board => ({
          name: board.name,
          lists: board.lists?.map((list: any) => ({
            name: list.name,
            cards: list.cards?.map((card: any) => ({
              name: card.name,
              due: card.due,
              dueComplete: card.dueComplete
            }))
          }))
        })))}
        
        Provide analysis in JSON format:
        {
          "insights": ["insight 1", "insight 2", "insight 3"],
          "recommendations": ["recommendation 1", "recommendation 2"],
          "progressSummary": "Overall progress summary"
        }
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a data analyst specializing in goal tracking and productivity. Analyze progress patterns and provide actionable insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Progress analysis error:', error);
    }

    return this.generateMockProgressAnalysis(userGoals);
  }

  /**
   * Generate mock progress response for fallback
   */
  private generateMockProgressResponse(userMessage: string): {
    actions: any[];
    response: string;
  } {
    return {
      actions: [],
      response: `Great progress! I understand you've been working on your goal. Keep up the excellent work! 🎯`
    };
  }

  /**
   * Generate mock progress discussion for fallback
   */
  private generateMockProgressDiscussion(userMessage: string, userGoals: any[]): string {
    const activeGoals = userGoals.filter(goal => goal.status === 'active');
    
    if (activeGoals.length === 0) {
      return "I'd love to help you discuss your progress! It looks like you don't have any active goals yet. Would you like to create a new goal to work towards?";
    }

    return `I can see you're working on ${activeGoals.length} goal${activeGoals.length > 1 ? 's' : ''}. That's fantastic! 

Based on your message about "${userMessage}", it sounds like you're making good progress. Keep up the momentum! 

Would you like me to help you:
- Review your current progress on your goals?
- Suggest next steps for your active goals?
- Create a new goal to work towards?

I'm here to support you every step of the way! 🚀`;
  }

  /**
   * Generate mock progress analysis for fallback
   */
  private generateMockProgressAnalysis(userGoals: any[]): {
    insights: string[];
    recommendations: string[];
    progressSummary: string;
  } {
    const activeGoals = userGoals.filter(goal => goal.status === 'active');
    const completedGoals = userGoals.filter(goal => goal.status === 'completed');
    
    return {
      insights: [
        `You have ${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''} in progress`,
        `You've completed ${completedGoals.length} goal${completedGoals.length !== 1 ? 's' : ''} so far`,
        activeGoals.length > 0 ? `Your most recent goal is "${activeGoals[0].title}"` : 'No active goals currently'
      ],
      recommendations: [
        'Set specific daily or weekly milestones for your active goals',
        'Review your progress regularly to stay on track',
        'Celebrate small wins along the way to maintain motivation'
      ],
      progressSummary: `You're making great progress! ${completedGoals.length > 0 ? `You've already completed ${completedGoals.length} goal${completedGoals.length !== 1 ? 's' : ''}. ` : ''}${activeGoals.length > 0 ? `Keep working on your ${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''}!` : 'Consider setting a new goal to continue your growth journey.'}`
    };
  }
}

// Create singleton instance
export const aiService = new AIService();

// Hook for using AI service
export const useAI = () => {
  const { user } = useAuth();
  
  return {
    aiService,
    generate4W1HQuestions: (goal: string) => aiService.generate4W1HQuestions(goal),
    process4W1HAnswers: (answers: FourWOneHAnswers) => aiService.process4W1HAnswers(answers),
    generateGoalImage: (answers: FourWOneHAnswers) => aiService.generateGoalImage(answers),
    processProgressUpdate: (message: string, cards: any[]) => aiService.processProgressUpdate(message, cards),
    generateProgressDiscussionResponse: (message: string, goals: any[], boards: any[], history: any[]) => 
      aiService.generateProgressDiscussionResponse(message, goals, boards, history),
    analyzeProgress: (goals: any[], boards: any[]) => aiService.analyzeProgress(goals, boards)
  };
};
