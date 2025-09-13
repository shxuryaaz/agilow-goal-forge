import * as functions from 'firebase-functions';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: functions.config().openai?.api_key || process.env.OPENAI_API_KEY,
});

export const processGoalWithAI = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { goal } = data;
    if (!goal || typeof goal !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'Goal is required and must be a string');
    }

    const systemPrompt = `You are Agilow, an AI assistant that transforms ambitious goals into structured SMART plans with milestones, risks, and timelines. 

Your task is to analyze the user's goal and return a comprehensive plan in JSON format with the following structure:

{
  "goal": "The refined and clarified version of the user's goal",
  "SMART_summary": "A SMART (Specific, Measurable, Achievable, Relevant, Time-bound) summary of the goal",
  "milestones": [
    {
      "title": "Milestone title",
      "description": "Detailed description of what needs to be accomplished",
      "dueDate": "YYYY-MM-DD format or null if not specified",
      "xpReward": 20
    }
  ],
  "risks": [
    {
      "description": "Potential risk or challenge",
      "impact": "low|medium|high",
      "mitigation": "Strategy to mitigate this risk"
    }
  ],
  "timeline": [
    {
      "title": "Phase or stage title",
      "description": "What happens in this phase",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD"
    }
  ]
}

Guidelines:
- Create 3-7 meaningful milestones that break down the goal
- Identify 2-5 realistic risks with practical mitigation strategies
- Create a timeline with 3-5 phases covering the entire goal duration
- Make milestones specific and actionable
- Consider realistic timeframes (weeks to months, not years)
- Focus on practical, achievable steps
- Each milestone should be worth 20 XP
- Return ONLY valid JSON, no additional text`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: goal }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new functions.https.HttpsError('internal', 'No response from AI');
    }

    try {
      const parsedResponse = JSON.parse(responseText);
      
      // Validate the response structure
      if (!parsedResponse.goal || !parsedResponse.SMART_summary || !Array.isArray(parsedResponse.milestones)) {
        throw new Error('Invalid response structure');
      }

      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', responseText);
      
      // Fallback response if parsing fails
      return {
        goal: goal,
        SMART_summary: `Transform "${goal}" into a structured, achievable plan with clear milestones and timelines.`,
        milestones: [
          {
            title: "Initial Planning",
            description: "Define specific objectives and create a detailed action plan",
            dueDate: null,
            xpReward: 20
          },
          {
            title: "Implementation Phase",
            description: "Execute the core activities to achieve the goal",
            dueDate: null,
            xpReward: 20
          },
          {
            title: "Review and Adjust",
            description: "Evaluate progress and make necessary adjustments",
            dueDate: null,
            xpReward: 20
          }
        ],
        risks: [
          {
            description: "Lack of clear direction",
            impact: "medium",
            mitigation: "Break down the goal into smaller, specific tasks"
          },
          {
            description: "Time management challenges",
            impact: "high",
            mitigation: "Create a detailed schedule and set regular check-ins"
          }
        ],
        timeline: [
          {
            title: "Planning Phase",
            description: "Research, planning, and preparation",
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            title: "Execution Phase",
            description: "Active work towards the goal",
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            title: "Completion Phase",
            description: "Final review and goal completion",
            startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ]
      };
    }

  } catch (error) {
    console.error('Error in processGoalWithAI:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to process goal with AI');
  }
});

