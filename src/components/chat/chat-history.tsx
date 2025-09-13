import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Calendar, Target, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatHistory } from '@/services/chatHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession: (sessionId: string) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ isOpen, onClose, onLoadSession }) => {
  const { user } = useAuth();
  const { getUserSessions } = useChatHistory();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      loadSessions();
    }
  }, [isOpen, user]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const userSessions = await getUserSessions();
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSession = (sessionId: string) => {
    onLoadSession(sessionId);
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'active':
        return <Target className="w-4 h-4" />;
      case 'paused':
        return <Clock className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background overlay */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-4xl mx-4 bg-background rounded-xl shadow-2xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Chat History
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground">Loading chat history...</p>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Chat History</h3>
              <p className="text-muted-foreground">Start a conversation to see your chat history here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {sessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleLoadSession(session.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Session Info */}
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                            {getSessionStatusIcon(session.status)}
                            <span className="capitalize">{session.status}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {session.currentStep === '4w1h' ? 'Goal Planning' :
                             session.currentStep === 'goal-creation' ? 'Creating Goal' :
                             session.currentStep === 'active' ? 'Active Goal' :
                             session.currentStep === 'trello-connect' ? 'Connecting Trello' :
                             'Welcome'}
                          </span>
                        </div>

                        {/* Goal Title */}
                        {session.fourWOneHAnswers?.what && (
                          <h3 className="font-semibold text-foreground mb-1">
                            {session.fourWOneHAnswers.what}
                          </h3>
                        )}

                        {/* Last Message Preview */}
                        {session.messages && session.messages.length > 0 && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {session.messages[session.messages.length - 1].content}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{session.messages?.length || 0} messages</span>
                          </div>
                          {session.trelloBoardId && (
                            <div className="flex items-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>Trello Board</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(session.updatedAt)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadSession(session.id);
                          }}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatHistory;
