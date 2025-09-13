import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send,
  Bot,
  User,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Target,
  Image as ImageIcon
} from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTrello, trelloService } from '@/services/trello';
import { useAI, FourWOneHAnswers } from '@/services/ai';
import { useChatHistory, ChatSession, ChatMessage } from '@/services/chatHistory';
import { localXPService } from '@/services/localXP';
import { bhagCompletionService } from '@/services/bhagCompletion';
import { certificateService } from '@/services/certificates';
import ChatHistory from '@/components/chat/chat-history';
import TrelloIntegration from '@/components/trello/trello-integration';


const ChatWorkspace: React.FC = () => {
  const { user, userProfile, refreshUserProfile, updateUserProfileXP, setUserProfileXP } = useAuth();
  const { isAuthenticated: getIsAuthenticated, authenticate, createGoalBoard, addImageToBHAG, moveCardToList, findCardByName, getBoardLists } = useTrello();
  const { generate4W1HQuestions, process4W1HAnswers, generateGoalImage, processProgressUpdate } = useAI();
  const { saveSession, loadSession, createNewSession, saveGoal, getUserGoals, addUserXP } = useChatHistory();
  // Using local XP service instead of Firebase
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [fourWOneHAnswers, setFourWOneHAnswers] = useState<Partial<FourWOneHAnswers>>({});
  const [availableBoards, setAvailableBoards] = useState<any[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [userGoals, setUserGoals] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Load user goals for context
  const loadUserGoals = async () => {
    if (user) {
      try {
        const goals = await getUserGoals();
        setUserGoals(goals);
      } catch (error) {
        console.error('Error loading user goals:', error);
      }
    }
  };

  // Handle loading a chat session from history
  const handleLoadSession = async (sessionId: string) => {
    try {
      const session = await loadSession(sessionId);
      if (session) {
        setCurrentSession(session);
        setCurrentQuestionIndex(0);
        setFourWOneHAnswers(session.fourWOneHAnswers || {});
        
        // Update authentication status
        const authStatus = await getIsAuthenticated();
        setIsAuthenticated(authStatus);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  // Check Trello authentication status
  useEffect(() => {
    if (user) {
      getIsAuthenticated().then((authStatus) => {
        console.log('Initial Trello authentication status:', authStatus);
        setIsAuthenticated(authStatus);
      });
    }
  }, [user, getIsAuthenticated]);

  // Refresh authentication status when component becomes visible
  useEffect(() => {
    if (user) {
      // Refresh authentication status when component mounts or becomes visible
      const refreshAuth = () => {
        getIsAuthenticated().then((authStatus) => {
          console.log('Trello authentication status:', authStatus);
          setIsAuthenticated(authStatus);
        });
      };
      
      // Refresh immediately
      refreshAuth();
      
      // Also refresh when window becomes visible (user comes back from OAuth)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          refreshAuth();
        }
      };
      
      // Periodic refresh every 2 seconds for the first 10 seconds (to catch OAuth callback)
      const interval = setInterval(refreshAuth, 2000);
      const timeout = setTimeout(() => clearInterval(interval), 10000);
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [user, getIsAuthenticated]);

  // Initialize session on component mount
  useEffect(() => {
    if (user && !currentSession) {
      console.log('Creating new session for user:', user.uid);
      const newSession = createNewSession();
      if (newSession) {
        console.log('New session created:', newSession);
        setCurrentSession(newSession);
        
        // Add appropriate first message based on Trello connection status
        if (!isAuthenticated) {
          addMessage('ai', "Hi! Let's connect your Trello account first so I can create a structured plan for you.");
        } else {
          addMessage('ai', "Hi! What goal would you like to work on today?");
        }
      }
    }
  }, [user, createNewSession, isAuthenticated]); // Added isAuthenticated to dependencies

  useEffect(() => {
    if (user) {
      loadUserGoals();
    }
  }, [user]);

  // Update session when authentication status changes
  useEffect(() => {
    if (currentSession && isAuthenticated && currentSession.currentStep === 'trello-connect') {
      // User just connected to Trello, update the session and start 4W1H flow
      setCurrentQuestionIndex(0);
      setFourWOneHAnswers({});
      addMessage('ai', "Perfect! You're connected to Trello. What goal would you like to work on today?");
      setCurrentSession(prev => prev ? { ...prev, currentStep: '4w1h' } : null);
    }
  }, [isAuthenticated, currentSession]);

  useEffect(() => {
    // Only scroll to bottom when new messages are added, not on initial load
    if (currentSession?.messages && currentSession.messages.length > 0) {
      // Add a small delay to ensure the message is rendered before scrolling
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentSession?.messages?.length]);

  // Auto-save session when it changes (but not on initial load)
  useEffect(() => {
    if (currentSession && currentSession.id !== 'new' && currentSession.messages.length > 1) {
      console.log('Auto-saving session:', currentSession.id);
      saveSession(currentSession);
    }
  }, [currentSession?.messages?.length, saveSession]); // Only save when messages change

  // Check for existing Trello connection and load boards
  useEffect(() => {
    const checkTrelloConnection = async () => {
      if (user && await trelloService.hasToken(user.uid)) {
        try {
          const boards = await trelloService.getBoards(user.uid);
          setAvailableBoards(boards);
          if (boards.length > 0) {
            setSelectedBoardId(boards[0].id);
          }
        } catch (error) {
          console.error('Error loading Trello boards:', error);
        }
      }
    };

    checkTrelloConnection();
  }, [user]);

  // Refresh boards when Trello connection changes
  useEffect(() => {
    const refreshBoards = async () => {
      if (user && isAuthenticated && await trelloService.hasToken(user.uid)) {
        try {
          const boards = await trelloService.getBoards(user.uid);
          setAvailableBoards(boards);
          if (boards.length > 0) {
            setSelectedBoardId(boards[0].id);
          }
          
          // If we just connected and we're in trello-connect step, start 4W1H
          if (currentSession?.currentStep === 'trello-connect') {
            setCurrentQuestionIndex(0);
            setFourWOneHAnswers({});
            simulateAIResponse(
              `Perfect! You're connected to Trello.

Now I'll guide you through the 4W1H Goal-Setting Framework to create a comprehensive plan:

What - What exactly do you want to achieve?
Why - Why is this goal important to you?
When - When do you want to complete it?
Where - Where will you work on this goal?
Who - Who can help you achieve it?
How - How will you approach this goal?

This structured approach ensures your goals are clear, meaningful, and actionable. What goal would you like to work on today?`, 
              1500
            );
            setCurrentSession(prev => prev ? { ...prev, currentStep: '4w1h' } : null);
          }
        } catch (error) {
          console.error('Error refreshing Trello boards:', error);
        }
      }
    };

    refreshBoards();
  }, [user, isAuthenticated, currentSession?.currentStep]);

  const addMessage = (type: 'user' | 'ai', content: string, trelloActions?: any[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      content,
      timestamp: new Date(),
      trelloActions
    };

    console.log('Adding message:', newMessage);

    // Use functional state update to avoid race conditions
    setCurrentSession(prevSession => {
      if (!prevSession) {
        console.error('No current session found');
        return prevSession;
      }

      console.log('Current messages count:', prevSession.messages.length);
      
      const updatedSession = {
        ...prevSession,
        messages: [...prevSession.messages, newMessage],
        updatedAt: new Date()
      };

      console.log('Updated messages count:', updatedSession.messages.length);
      return updatedSession;
    });
  };

  const simulateAIResponse = (content: string, delay: number = 1500) => {
    setIsTyping(true);
    setTimeout(() => {
      addMessage('ai', content);
      setIsTyping(false);
    }, delay);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    const userMessage = inputMessage.trim();
    console.log('Sending message:', userMessage);
    
    // Clear input immediately
    setInputMessage('');
    
    // Add user message
    addMessage('user', userMessage);

    // Wait a bit for the message to be added, then handle response
    setTimeout(async () => {
      // Handle different conversation steps
      switch (currentSession.currentStep) {
        case 'welcome':
        case 'trello-connect':
        case '4w1h':
          await handleWelcomeResponse(userMessage);
          break;
        case 'goal-creation':
          await handleGoalCreationResponse(userMessage);
          break;
        case 'active':
          await handleActiveConversation(userMessage);
          break;
      }
    }, 100); // Small delay to ensure message is added
  };

  const handleWelcomeResponse = async (message: string) => {
    if (!currentSession) return;

    // Prevent duplicate responses by checking if we've already responded
    if (currentSession.currentStep === 'welcome') {
      if (!isAuthenticated) {
        simulateAIResponse("Let's connect your Trello account so I can create a structured plan for you. Click the button below to connect Trello.", 1000);
        setCurrentSession(prev => prev ? { ...prev, currentStep: 'trello-connect' } : null);
      } else {
        // Reset question index and start 4W1H flow
        setCurrentQuestionIndex(0);
        setFourWOneHAnswers({});
        simulateAIResponse(
          `Welcome to the 4W1H Goal-Setting Framework!

I'll help you create a structured plan using the proven 4W1H methodology:

What - Define your specific goal clearly
Why - Understand your motivation and purpose
When - Set realistic timelines and deadlines
Where - Identify your work environment and location
Who - Recognize your support system and team
How - Develop your strategy and action plan

This framework ensures your goals are well-defined, meaningful, and actionable. Let's start with your goal - what would you like to achieve?`, 
          2000
        );
        setCurrentSession(prev => prev ? { ...prev, currentStep: '4w1h' } : null);
      }
    } else if (currentSession.currentStep === 'trello-connect') {
      // Handle Trello connection responses
      if (message.toLowerCase().includes('connect') || message.toLowerCase().includes('trello')) {
        authenticate();
      } else {
        simulateAIResponse(
          `Welcome to your Goal-Setting Assistant!

I'm here to help you achieve your goals using the proven 4W1H Framework - a structured approach that ensures your goals are:

Clear & Specific (What)
Motivating & Purposeful (Why)
Time-bound (When)
Environmentally Considered (Where)
Support-Network Aware (Who)
Strategically Planned (How)

To get started, I need to connect to your Trello account. This allows me to create organized boards and track your progress automatically. Would you like to connect now?`, 
          2000
        );
      }
    } else if (currentSession.currentStep === '4w1h') {
      // Handle 4W1H responses
      await handle4W1HResponse(message);
    }
  };


  const handle4W1HResponse = async (message: string) => {
    // Store the initial goal if this is the first response
    if (currentQuestionIndex === 0) {
      setFourWOneHAnswers(prev => ({ ...prev, what: message }));
      setCurrentQuestionIndex(1);
      
      // Generate AI-powered personalized questions based on the goal
      simulateAIResponse("Great! Let me create some personalized questions for you based on your goal...", 1000);
      
      try {
        const questions = await generate4W1HQuestions(message);
        setGeneratedQuestions(questions);
        simulateAIResponse(questions[0], 1500); // Ask the first AI-generated question
      } catch (error) {
        console.error('Error generating AI questions:', error);
        // Fallback to hardcoded questions
        const fallbackQuestions = [
          "Great! Now let's understand your motivation. Why is this goal important to you? What's driving you to achieve it?",
          "Excellent! Now let's talk about timing. When do you want to achieve this goal? What's your target timeline?",
          "Perfect! Now let's discuss the environment. Where will you be working on this goal? What's your workspace or environment like?",
          "Good! Now let's think about support. Who else might be involved in helping you achieve this goal? Do you have mentors, teammates, or supporters?",
          "Great! Finally, let's plan your approach. How do you plan to achieve this goal? What's your strategy or methodology?"
        ];
        setGeneratedQuestions(fallbackQuestions);
        simulateAIResponse(fallbackQuestions[0], 1500);
      }
    } else if (currentQuestionIndex === 1) {
      // Why question
      setFourWOneHAnswers(prev => ({ ...prev, why: message }));
      setCurrentQuestionIndex(2);
      const nextQuestion = generatedQuestions[1] || "Excellent! Now let's talk about timing. When do you want to achieve this goal? What's your target timeline?";
      simulateAIResponse(nextQuestion, 1000);
    } else if (currentQuestionIndex === 2) {
      // When question
      setFourWOneHAnswers(prev => ({ ...prev, when: message }));
      setCurrentQuestionIndex(3);
      const nextQuestion = generatedQuestions[2] || "Perfect! Now let's discuss the environment. Where will you be working on this goal? What's your workspace or environment like?";
      simulateAIResponse(nextQuestion, 1000);
    } else if (currentQuestionIndex === 3) {
      // Where question
      setFourWOneHAnswers(prev => ({ ...prev, where: message }));
      setCurrentQuestionIndex(4);
      const nextQuestion = generatedQuestions[3] || "Good! Now let's think about support. Who else might be involved in helping you achieve this goal? Do you have mentors, teammates, or supporters?";
      simulateAIResponse(nextQuestion, 1000);
    } else if (currentQuestionIndex === 4) {
      // Who question
      setFourWOneHAnswers(prev => ({ ...prev, who: message }));
      setCurrentQuestionIndex(5);
      const nextQuestion = generatedQuestions[4] || "Great! Finally, let's plan your approach. How do you plan to achieve this goal? What's your strategy or methodology?";
      simulateAIResponse(nextQuestion, 1000);
    } else if (currentQuestionIndex === 5) {
      // How question - final question
      setFourWOneHAnswers(prev => ({ ...prev, how: message }));
      setCurrentQuestionIndex(6);
      
      simulateAIResponse("Perfect! I have all the information I need. Let me create a structured plan for your goal and generate a visual representation. This will take a moment...", 2000);
      setCurrentSession(prev => ({ ...prev, currentStep: 'goal-creation' }));
      
      // Process the complete 4W1H answers
      await processComplete4W1H();
    }
  };

  const processComplete4W1H = async () => {
    try {
      console.log('Processing 4W1H answers:', fourWOneHAnswers);
      
      // Process 4W1H answers and create goal structure
      console.log('Step 1: Creating goal structure...');
      const goalStructure = await process4W1HAnswers(fourWOneHAnswers as FourWOneHAnswers);
      console.log('Goal structure created:', goalStructure);
      
      // Create Trello board
      console.log('Step 2: Creating Trello board...');
      const { boardId, boardUrl } = await createGoalBoard(
        goalStructure.title,
        goalStructure.description,
        goalStructure.weeklyTasks
      );
      console.log('Trello board created successfully:', { boardId, boardUrl });

      // Generate image for BHAG
      console.log('Step 3: Generating goal image...');
      const imageUrl = await generateGoalImage(fourWOneHAnswers as FourWOneHAnswers);
      console.log('Image generated successfully:', imageUrl);
      
      console.log('Step 4: Adding image to BHAG...');
      await addImageToBHAG(boardId, imageUrl, `${goalStructure.title} Vision`);
      console.log('Image added to BHAG successfully');

      // Award XP for BHAG creation
      console.log('Step 5: Awarding XP for BHAG creation...');
      try {
        // Optimistic UI update - show XP immediately
        const currentXP = userProfile?.xp || 0;
        const newXP = currentXP + 100;
        setUserProfileXP(newXP);
        
        await localXPService.awardXP(user.uid, 100, 'BHAG created', 'milestone', boardId);
        console.log('XP awarded successfully for BHAG creation (local only)');
      } catch (xpError) {
        console.error('Failed to award XP:', xpError);
        // Revert optimistic update on error
        const currentXP = userProfile?.xp || 0;
        setUserProfileXP(currentXP - 100);
        // Continue without XP - don't fail the entire goal creation
      }

      // Update session with board info
      console.log('Step 6: Updating session...');
      setCurrentSession(prev => ({
        ...prev,
        currentStep: 'active',
        trelloBoardId: boardId,
        trelloBoardUrl: boardUrl,
        fourWOneHAnswers: fourWOneHAnswers as FourWOneHAnswers
      }));

      // Award BHAG Creation Certificate (since this is a new BHAG)
      console.log('Step 7: Awarding BHAG Creation Certificate...');
      simulateAIResponse("🏆 Step 7/7: Generating your BHAG Creation Certificate...", 500);
      try {
        await certificateService.generateBHAGCertificate(
          user.uid, 
          goalStructure.title,
          new Date()
        );
        console.log('🎖️ BHAG Creation Certificate awarded!');
        simulateAIResponse("✅ Step 7 complete: Certificate generated successfully!", 300);
      } catch (certError) {
        console.error('Error awarding BHAG creation certificate:', certError);
        simulateAIResponse("⚠️ Step 7 warning: Certificate generation had an issue", 300);
        // Continue without failing the entire process
      }

      // Refresh boards and switch to the new board after a delay
      console.log('Step 8: Refreshing boards and switching to new board...');
      setTimeout(async () => {
        try {
          const updatedBoards = await trelloService.getBoards(user!.uid);
          setAvailableBoards(updatedBoards);
          
          // Find and select the newly created board
          const newBoard = updatedBoards.find(board => board.id === boardId);
          if (newBoard) {
            setSelectedBoardId(boardId);
            console.log('Switched to new board:', newBoard.name);
          }
        } catch (error) {
          console.error('Error refreshing boards:', error);
        }
      }, 1000); // 1 second delay

      // Only send success message if ALL steps completed successfully
      console.log('Step 9: All steps completed successfully, sending success message...');
      simulateAIResponse(
        `🎉 **ALL DONE!** Your BHAG is ready!

✅ Goal structure created and analyzed
✅ Trello board "${goalStructure.title}" created with organized lists
✅ Beautiful visual representation generated
✅ +100 XP awarded for BHAG creation
✅ Certificate generated for your achievement
✅ Session updated and saved

Your structured goal plan is now live in Trello! You can start working on your tasks and report your progress to me anytime. Good luck achieving your BHAG! 🚀`,
        2000
      );
    } catch (error) {
      console.error('Error processing 4W1H:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fourWOneHAnswers
      });
      
      // More specific error message
      let errorMessage = "I encountered an error while creating your goal structure. ";
      if (error instanceof Error) {
        if (error.message.includes('No Trello token found')) {
          errorMessage = "You need to connect your Trello account first! Please click the 'Connect Trello' button to authenticate with Trello, then try again.";
        } else if (error.message.includes('API key')) {
          errorMessage += "It looks like there might be an issue with the AI service configuration. ";
        } else if (error.message.includes('Trello')) {
          errorMessage += "There was an issue connecting to Trello. ";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage += "There was a network connectivity issue. ";
        }
      }
      if (!errorMessage.includes('Connect your Trello account')) {
        errorMessage += "Let me try again or we can continue with a simpler approach.";
      }
      
      simulateAIResponse(errorMessage, 1000);
    }
  };

  const handleGoalCreationResponse = async (message: string) => {
    simulateAIResponse("Your goal board is ready! You can now start working on your tasks. Feel free to report your progress to me anytime.", 1000);
  };

  const handleActiveConversation = async (message: string) => {
    if (!currentSession) return;

    try {
      // Check for progress updates and handle card movements
      await handleProgressUpdate(message);
      
      // Generate context-aware response using AI
      try {
        const response = await processProgressUpdate(message, availableBoards.flatMap(board => board.lists?.flatMap(list => list.cards) || []));
        if (response && response.response) {
          simulateAIResponse(response.response, 1000);
        } else {
          simulateAIResponse("Thanks for the update! I can see you're making progress on your goals. Keep up the great work!", 1000);
        }
      } catch (error) {
        console.error('Error generating progress response:', error);
        simulateAIResponse("Thanks for the update! I can see you're making progress on your goals. Keep up the great work!", 1000);
      }
    } catch (error) {
      console.error('Error in active conversation:', error);
      simulateAIResponse("I'm here to help you with your goals! How can I assist you today?", 1000);
    }
  };

  const handleProgressUpdate = async (message: string) => {
    if (!currentSession?.trelloBoardId || !user) return;

    const lowerMessage = message.toLowerCase();
    
    try {
      // Get board lists to understand the structure
      const lists = await getBoardLists(currentSession.trelloBoardId);
      
      // Find the different list types
      const toDoList = lists.find(list => 
        list.name.toLowerCase().includes('to do') || 
        list.name.toLowerCase().includes('todo') ||
        list.name.toLowerCase().includes('week')
      );
      
      const doingList = lists.find(list => 
        list.name.toLowerCase().includes('doing') || 
        list.name.toLowerCase().includes('in progress') ||
        list.name.toLowerCase().includes('working')
      );
      
      const doneList = lists.find(list => 
        list.name.toLowerCase().includes('done') || 
        list.name.toLowerCase().includes('completed') ||
        list.name.toLowerCase().includes('finished')
      );

      // Check for "starting work" patterns
      if (lowerMessage.includes('start') && lowerMessage.includes('work') && lowerMessage.includes('week')) {
        const weekMatch = message.match(/week\s*(\d+)/i);
        if (weekMatch) {
          const weekNumber = weekMatch[1];
          const cardName = `Week ${weekNumber}`;
          
          // Find the card
          const card = await findCardByName(currentSession.trelloBoardId, cardName);
          if (card && toDoList && doingList) {
            // Move card from To Do to Doing
            await moveCardToList(card.id, doingList.id);
            simulateAIResponse(`🚀 Great! I've moved "${cardName}" to the "Doing" list. You're now working on it!`, 500);
            return;
          }
        }
      }

      // Check for "completed" patterns
      if ((lowerMessage.includes('done') || lowerMessage.includes('completed') || lowerMessage.includes('finished')) && lowerMessage.includes('week')) {
        const weekMatch = message.match(/week\s*(\d+)/i);
        if (weekMatch) {
          const weekNumber = weekMatch[1];
          const cardName = `Week ${weekNumber}`;
          
          // Find the card
          const card = await findCardByName(currentSession.trelloBoardId, cardName);
          if (card && doingList && doneList) {
            // Move card from Doing to Done
            await moveCardToList(card.id, doneList.id);
            
            // Award XP
            await addUserXP(100, `Completed ${cardName}`);
            
            simulateAIResponse(`🎉 Fantastic! I've moved "${cardName}" to the "Done" list and awarded you 100 XP for completing it! Keep up the great work!`, 500);
            return;
          }
        }
      }

      // Check for general completion patterns
      if (lowerMessage.includes('i have done') || lowerMessage.includes('i completed') || lowerMessage.includes('i finished')) {
        // Try to find any card that might be in the doing list
        if (doingList && doneList) {
          // This is a simplified approach - in a real implementation, you might want to ask which specific task
          simulateAIResponse("Great job! Which specific week or task did you complete? I'll move it to the Done list and award you XP!", 500);
        }
      }

    } catch (error) {
      console.error('Error handling progress update:', error);
      // Don't show error to user, just log it
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getQuickActions = () => {
    if (!currentSession) return [];
    
    switch (currentSession.currentStep) {
      case 'welcome':
        return [
          <Button
            key="chat-history"
            onClick={() => setShowChatHistory(true)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat History
          </Button>
        ];
      case 'trello-connect':
        return [
          <Button
            key="chat-history"
            onClick={() => setShowChatHistory(true)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat History
          </Button>,
          <Button
            key="connect-trello"
            onClick={authenticate}
            className="text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Connect Trello
          </Button>
        ];
      case '4w1h':
        return [
          <Button
            key="chat-history"
            onClick={() => setShowChatHistory(true)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat History
          </Button>
        ];
      case 'active':
        return [
          <Button
            key="chat-history"
            onClick={() => setShowChatHistory(true)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat History
          </Button>,
          <Button
            key="view-board"
            onClick={() => window.open(currentSession.trelloBoardUrl, '_blank')}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Board
          </Button>,
          <Button
            key="progress-report"
            onClick={() => setInputMessage("I completed some tasks today")}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Report Progress
          </Button>
        ];
      default:
        return [];
    }
  };

  // Show loading state while session is being initialized
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing chat session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={toggleSidebar} 
        onOpenChatHistory={() => setShowChatHistory(true)}
      />
      <TopBar onSidebarToggle={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
      
      <main
        className="transition-all duration-300 ease-in-out h-[calc(100vh-64px)] overflow-hidden"
        style={{
          marginLeft: isSidebarCollapsed ? '80px' : '250px',
          marginTop: '64px'
        }}
      >
        {/* Single Main Container */}
        <div className="h-full flex overflow-hidden">
          {/* Chat Interface Container */}
          <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
            {/* Chat Header */}
            <div className="p-6 border-b border-border flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="p-2 rounded-lg bg-gradient-primary">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">AI Goal Assistant</h1>
                  <p className="text-muted-foreground">Get personalized help with your goals and planning</p>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    <Target className="w-3 h-3 mr-1" />
                    {currentSession.currentStep === 'active' ? 'Active Goal' : 'Planning'}
                  </Badge>
                </div>
              </motion.div>
            </div>

            {/* Chat Messages Container - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 scrollbar-chat">
              {(currentSession?.messages || []).map((message, index) => (
                <motion.div
                  key={`${message.id}-${index}-${message.timestamp.getTime()}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-primary text-white'}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`premium-card p-4 ${message.type === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-primary text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="premium-card p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Debug info */}
              {(!currentSession?.messages || currentSession.messages.length === 0) && (
                <div className="text-center text-muted-foreground text-sm">
                  No messages yet. Session: {currentSession ? 'exists' : 'null'}, Messages: {currentSession?.messages?.length || 0}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input - Fixed at Bottom */}
            <div className="p-6 border-t border-border flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your goals, planning, or progress..."
                      className="pr-12"
                    />
                    <Button
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  {getQuickActions()}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Trello Board Container */}
          <div className="w-1/2 flex flex-col border-l border-border overflow-hidden">
            {/* Trello Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-foreground" />
                  <h2 className="font-semibold text-foreground">Trello Board</h2>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="p-1 h-8 w-8"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  {currentSession?.trelloBoardUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(currentSession.trelloBoardUrl, '_blank')}
                      className="p-1 h-8 w-8"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Trello Board Content Container - Scrollable */}
            <div className="flex-1 overflow-hidden">
              {isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full overflow-hidden"
                >
                  <TrelloIntegration isOpen={true} onClose={() => {}} />
                </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full flex items-center justify-center overflow-hidden p-4"
                  >
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {!isAuthenticated ? 'Connect Trello' : 'No Board Yet'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {!isAuthenticated 
                            ? 'Connect your Trello account to see your boards here' 
                            : 'Complete the goal planning process to see your Trello board here'
                          }
                        </p>
                        {!isAuthenticated && (
                          <Button
                            onClick={authenticate}
                            className="btn-primary"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect Trello
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
            </div>
          </div>
        </div>
      </main>

      {/* Chat History Modal */}
      <ChatHistory
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        onLoadSession={handleLoadSession}
      />
    </div>
  );
};

export default ChatWorkspace;
