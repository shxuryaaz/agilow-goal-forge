import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Target, RefreshCw, Calendar, CheckSquare, MessageSquare, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trelloService } from '@/services/trello';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TrelloIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrelloIntegration: React.FC<TrelloIntegrationProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trelloUrl, setTrelloUrl] = useState<string>('');
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [isLoadingCardDetails, setIsLoadingCardDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      // Load user's boards when component opens
      loadBoards();
      
      // Set up auto-refresh every 30 seconds
      const refreshInterval = setInterval(() => {
        if (isOpen && user) {
          refreshBoards();
        }
      }, 30000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [isOpen, user]);

  const loadBoards = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userBoards = await trelloService.getBoards(user.uid);
      setBoards(userBoards);
      
      // Select the latest board by default (most recently created)
      if (userBoards.length > 0 && !selectedBoardId) {
        // Sort boards by creation date (newest first) and select the first one
        const sortedBoards = userBoards.sort((a, b) => {
          const dateA = new Date(a.dateLastActivity || a.dateLastView || 0);
          const dateB = new Date(b.dateLastActivity || b.dateLastView || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setSelectedBoardId(sortedBoards[0].id);
        setTrelloUrl(`https://trello.com/b/${sortedBoards[0].id}`);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading boards:', error);
      toast({
        title: "Error",
        description: "Failed to load Trello boards.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const refreshBoards = async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      const userBoards = await trelloService.getBoards(user.uid);
      setBoards(userBoards);
      
      // Check if the currently selected board still exists
      const currentBoardExists = userBoards.find(b => b.id === selectedBoardId);
      if (!currentBoardExists && userBoards.length > 0) {
        setSelectedBoardId(userBoards[0].id);
        setTrelloUrl(`https://trello.com/b/${userBoards[0].id}`);
      }
      
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error refreshing boards:', error);
      setIsRefreshing(false);
    }
  };

  const handleCardClick = async (card: any) => {
    setSelectedCard(card);
    setIsLoadingCardDetails(true);
    
    try {
      // Get detailed card information including checklists
      const detailedCard = await trelloService.getCardWithChecklists(user.uid, card.id);
      setCardDetails(detailedCard);
    } catch (error) {
      console.error('Error loading card details:', error);
      toast({
        title: "Error",
        description: "Failed to load card details.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCardDetails(false);
    }
  };

  const closeCardDetails = () => {
    setSelectedCard(null);
    setCardDetails(null);
  };

  if (!isOpen) return null;

  return (
    <div className="h-full w-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <img 
              src="https://i.ibb.co/7tsFM7d3/agilowlogosmall.png" 
              alt="Agilow" 
              className="w-6 h-6"
            />
            <h2 className="text-lg font-bold text-foreground">
              Trello Integration
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://trello.com', '_blank')}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Trello</span>
            </Button>
          </div>
        </div>

        {/* Board Selector */}
        {boards.length > 0 && (
          <div className="p-4 border-b border-border">
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Board:
            </label>
            <select
              value={selectedBoardId}
              onChange={(e) => {
                setSelectedBoardId(e.target.value);
                setTrelloUrl(`https://trello.com/b/${e.target.value}`);
              }}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Content */}
        <div className="h-full p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground">Loading your Trello boards...</p>
              </div>
            </div>
          ) : boards.length > 0 && selectedBoardId ? (
            <div className="h-full flex flex-col">
              {/* Board Actions */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  {boards.find(b => b.id === selectedBoardId)?.name || 'Board'}
                </h3>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refreshBoards}
                    disabled={isRefreshing}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://trello.com/b/${selectedBoardId}`, '_blank')}
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </Button>
                </div>
              </div>
              
              {/* Trello Board Container - Trello UI Style */}
              <div className="flex-1 bg-[#0079BF] rounded-lg overflow-hidden">
                {/* Trello Board Header */}
                <div className="bg-[#0079BF] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {boards.find(b => b.id === selectedBoardId)?.name || 'Board'}
                        </h3>
                        <p className="text-white/80 text-sm">Trello Board</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(`https://trello.com/b/${selectedBoardId}`, '_blank')}
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in Trello</span>
                    </button>
                  </div>
                </div>
                
                {/* Trello Board Content - Horizontal Lists */}
                <div className="flex-1 p-4 overflow-x-auto">
                  <div className="flex space-x-4 min-w-max">
                    {boards.find(b => b.id === selectedBoardId)?.lists?.map((list: any) => (
                      <div key={list.id} className="w-72 bg-[#f4f5f7] rounded-lg p-3 flex-shrink-0">
                        {/* List Header */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-[#172b4d] text-sm px-2 py-1 bg-white/50 rounded">
                            {list.name}
                          </h4>
                          <span className="text-[#5e6c84] text-xs bg-white/30 px-2 py-1 rounded">
                            {list.cards?.length || 0}
                          </span>
                        </div>
                        
                        {/* Cards */}
                        <div className="space-y-2">
                          {list.cards?.map((card: any) => (
                            <div 
                              key={card.id} 
                              className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                              onClick={() => handleCardClick(card)}
                            >
                              {/* Labels */}
                              {card.labels && card.labels.length > 0 && (
                                <div className="flex space-x-1 mb-2">
                                  {card.labels.slice(0, 6).map((label: any, index: number) => (
                                    <div
                                      key={index}
                                      className="h-2 rounded-full flex-1"
                                      style={{ 
                                        backgroundColor: label.color === 'red' ? '#eb5a46' :
                                                       label.color === 'yellow' ? '#f2d600' :
                                                       label.color === 'orange' ? '#ff9f1a' :
                                                       label.color === 'green' ? '#61bd4f' :
                                                       label.color === 'blue' ? '#0079bf' :
                                                       label.color === 'purple' ? '#c377e0' :
                                                       label.color === 'pink' ? '#ff78cb' :
                                                       label.color === 'sky' ? '#00c2e0' :
                                                       label.color === 'lime' ? '#51e898' :
                                                       '#d9d9d9'
                                      }}
                                      title={label.name}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {/* Card Title */}
                              <h5 className="text-[#172b4d] text-sm font-normal leading-5 mb-2">
                                {card.name}
                              </h5>
                              
                              {/* Card Description */}
                              {card.desc && (
                                <p className="text-[#5e6c84] text-xs leading-4 mb-2 line-clamp-2">
                                  {card.desc}
                                </p>
                              )}
                              
                              {/* Card Footer */}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-2">
                                  {/* Due Date */}
                                  {card.due && (
                                    <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                                      new Date(card.due) < new Date() ? 'bg-[#eb5a46] text-white' :
                                      new Date(card.due).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 ? 'bg-[#f2d600] text-[#172b4d]' :
                                      'bg-[#61bd4f] text-white'
                                    }`}>
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                                      </svg>
                                      <span>
                                        {new Date(card.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Card Actions */}
                                <div className="flex items-center space-x-1">
                                  {card.dueComplete && (
                                    <div className="w-5 h-5 bg-[#61bd4f] rounded flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add Card Button */}
                          <div className="bg-white/50 hover:bg-white/70 rounded-lg p-2 text-[#5e6c84] text-sm cursor-pointer transition-colors">
                            + Add a card
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add List Button */}
                    <div className="w-72 bg-white/20 hover:bg-white/30 rounded-lg p-3 flex-shrink-0 cursor-pointer transition-colors">
                      <div className="flex items-center space-x-2 text-white">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        <span className="text-sm font-medium">Add another list</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <img 
                    src="https://i.ibb.co/7tsFM7d3/agilowlogosmall.png" 
                    alt="Agilow" 
                    className="w-8 h-8"
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No Boards Found</h3>
                <p className="text-muted-foreground">Create a board in Trello to get started.</p>
                <Button
                  onClick={() => window.open('https://trello.com', '_blank')}
                  className="flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Go to Trello</span>
                </Button>
              </div>
            </div>
          )}
        </div>

      {/* Card Details Modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0"
              onClick={closeCardDetails}
            />
            
            <motion.div
              className="relative z-10 w-full max-w-2xl mx-4 bg-background rounded-xl shadow-2xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-xl font-bold text-foreground">
                  {selectedCard.name}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeCardDetails}
                  className="rounded-full w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Card Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {isLoadingCardDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-muted-foreground">Loading card details...</p>
                    </div>
                  </div>
                ) : cardDetails ? (
                  <div className="space-y-6">
                    {/* Description */}
                    {cardDetails.desc && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Description</h4>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-foreground whitespace-pre-wrap">{cardDetails.desc}</p>
                        </div>
                      </div>
                    )}

                    {/* Due Date */}
                    {cardDetails.due && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2 flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Due Date</span>
                        </h4>
                        <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                          new Date(cardDetails.due) < new Date() ? 'bg-red-100 text-red-800' :
                          new Date(cardDetails.due).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(cardDetails.due).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                          {cardDetails.dueComplete && (
                            <span className="text-green-600">✓ Completed</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Checklists */}
                    {cardDetails.checklists && cardDetails.checklists.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                          <CheckSquare className="w-4 h-4" />
                          <span>Checklists</span>
                        </h4>
                        <div className="space-y-4">
                          {cardDetails.checklists.map((checklist: any) => (
                            <div key={checklist.id} className="bg-muted/50 rounded-lg p-4">
                              <h5 className="font-medium text-foreground mb-3">{checklist.name}</h5>
                              <div className="space-y-2">
                                {checklist.checkItems.map((item: any) => (
                                  <div key={item.id} className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      item.state === 'complete' 
                                        ? 'bg-green-500 border-green-500 text-white' 
                                        : 'border-gray-300'
                                    }`}>
                                      {item.state === 'complete' && (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                        </svg>
                                      )}
                                    </div>
                                    <span className={`text-sm ${
                                      item.state === 'complete' ? 'line-through text-muted-foreground' : 'text-foreground'
                                    }`}>
                                      {item.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {cardDetails.attachments && cardDetails.attachments.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-3 flex items-center space-x-2">
                          <Paperclip className="w-4 h-4" />
                          <span>Attachments</span>
                        </h4>
                        <div className="space-y-2">
                          {cardDetails.attachments.map((attachment: any) => (
                            <div key={attachment.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                              <Paperclip className="w-4 h-4 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground">{attachment.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {attachment.mimeType} • {attachment.bytes ? `${Math.round(attachment.bytes / 1024)} KB` : 'Unknown size'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(attachment.url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedCard.url, '_blank')}
                        className="flex items-center space-x-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open in Trello</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Failed to load card details</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrelloIntegration;
