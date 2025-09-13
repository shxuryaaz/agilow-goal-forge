import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TypingIndicator from '@/components/ui/typing-indicator';
import { useAuth } from '@/contexts/AuthContext';
import { createGoal } from '@/services/goals';
import { useGamification } from '@/services/gamification';
import { useToast } from '@/hooks/use-toast';
import agliowLogo from '@/assets/agilow-logo.png';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onGoalSubmit?: (goal: string) => void;
  isLandingPage?: boolean;
  messages?: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  onGoalSubmit,
  isLandingPage = false,
  messages = []
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [isProcessingGoal, setIsProcessingGoal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { awardXP } = useGamification();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    // Only scroll when there are messages and not during initial load
    if (localMessages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [localMessages.length, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessingGoal) return;

    const goalText = inputValue.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      text: goalText,
      isUser: true,
      timestamp: new Date()
    };

    setLocalMessages(prev => [...prev, newMessage]);
    setInputValue('');

    if (isLandingPage || !user) {
      // Call onGoalSubmit if provided (for landing page)
      if (onGoalSubmit) {
        onGoalSubmit(goalText);
      }
      
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "That's a great ambition! Let's make a plan together. Please sign in to continue.",
          isUser: false,
          timestamp: new Date()
        };
        setLocalMessages(prev => [...prev, aiResponse]);
      }, 2000);
      return;
    }

    // Process goal with Firebase
    setIsProcessingGoal(true);
    setIsTyping(true);

    try {
      const goal = await createGoal(user.uid, goalText, userProfile?.wallet?.publicAddress);
      
      // Award XP for goal creation
      await awardXP(50, 'Goal created', 'milestone', goal.id);
      
      setIsTyping(false);
      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `🎉 Amazing! I've created a structured plan for "${goal.goal}". You earned 50 XP! ${goal.nft ? 'A Proof-of-Commitment NFT has been minted to your wallet!' : ''} Check your dashboard to see your milestones, Trello board, and NFT gallery.`,
        isUser: false,
        timestamp: new Date()
      };
      setLocalMessages(prev => [...prev, successMessage]);
      
      toast({
        title: "Goal Created! 🎯",
        description: "Your goal has been processed and a Trello board has been created.",
      });
      
      onGoalSubmit?.(goalText);
    } catch (error: any) {
      console.error('Error creating goal:', error);
      setIsTyping(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error while processing your goal. Please try again or contact support if the issue persists.",
        isUser: false,
        timestamp: new Date()
      };
      setLocalMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingGoal(false);
    }
  };

  return (
    <div className={`flex flex-col ${isLandingPage ? 'max-w-2xl mx-auto' : 'flex-1'}`}>
      {/* Chat Messages */}
      {localMessages.length > 0 && (
        <div className={`flex-1 ${isLandingPage ? 'max-h-96' : 'min-h-0'} overflow-y-auto mb-6 space-y-4 scrollbar-chat`}>
          <AnimatePresence>
            {localMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!message.isUser && (
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <img src={agliowLogo} alt="Agilow" className="w-5 h-5" />
                    </div>
                  </div>
                )}
                
                <div className={message.isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  <p className="text-sm">{message.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <img src={agliowLogo} alt="Agilow" className="w-5 h-5" />
                </div>
              </div>
              <TypingIndicator />
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex items-center glass-card p-2 rounded-2xl">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isLandingPage ? "What's your big goal? (e.g., Launch my startup, Learn French, Run a marathon...)" : "Type your message..."}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-4 py-3"
          />
          
          <Button
            type="submit"
            disabled={!inputValue.trim() || isProcessingGoal}
            className="rounded-xl px-4 py-2 bg-gradient-primary text-white hover:shadow-glow transition-all duration-300"
          >
            {isProcessingGoal ? (
              <Sparkles className="w-4 h-4 animate-pulse" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {isLandingPage && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            <MessageCircle className="inline w-4 h-4 mr-1" />
            Share your dream and we'll help you make it happen
          </p>
        )}
      </motion.form>
    </div>
  );
};

export default ChatInterface;