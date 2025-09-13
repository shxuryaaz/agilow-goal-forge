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
      return 'https://via.placeholder.com/1024x1024/4ADE80/FFFFFF?text=Goal+Vision';
    }

    try {
      // Enhanced prompt for DALL-E 3
      const imagePrompt = `
        Create a stunning, high-quality, professional motivational image that represents this ambitious goal:
        
        GOAL: ${answers.what}
        PURPOSE: ${answers.why}
        TIMELINE: ${answers.when}
        LOCATION: ${answers.where}
        
        Style requirements:
        - Ultra-realistic, cinematic quality
        - Professional photography style
        - Modern, clean aesthetic
        - Inspiring and motivational atmosphere
        - High contrast and vibrant colors
        - 4K quality, detailed composition
        - Corporate/professional setting
        - Success and achievement theme
        
        The image should look like a premium motivational poster or corporate vision board that would inspire someone to achieve this specific goal.
      `;

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          response_format: 'url',
          style: 'natural'
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('DALL-E 3 API Error:', data.error);
        return 'https://via.placeholder.com/1024x1024/4ADE80/FFFFFF?text=Goal+Vision';
      }
      
      return data.data[0]?.url || 'https://via.placeholder.com/1024x1024/4ADE80/FFFFFF?text=Goal+Vision';
    } catch (error) {
      console.error('DALL-E 3 Image generation error:', error);
      return 'https://via.placeholder.com/1024x1024/4ADE80/FFFFFF?text=Goal+Vision';
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
    processProgressUpdate: (message: string, cards: any[]) => aiService.processProgressUpdate(message, cards)
  };
};
