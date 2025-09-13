import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy,
  Award,
  Star,
  Download,
  Share2,
  Eye,
  Calendar,
  Sparkles
} from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface Certificate {
  id: string;
  title: string;
  description: string;
  type: 'goal_completion' | 'milestone' | 'streak' | 'achievement';
  earnedDate: Date;
  xpReward: number;
  imageUrl?: string;
  nftMinted: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const Certificates: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Mock certificates data
  const certificates: Certificate[] = [
    {
      id: '1',
      title: 'Goal Master',
      description: 'Completed your first major goal',
      type: 'goal_completion',
      earnedDate: new Date('2024-01-15'),
      xpReward: 500,
      nftMinted: true,
      rarity: 'epic'
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Completed a full week of tasks',
      type: 'milestone',
      earnedDate: new Date('2024-01-10'),
      xpReward: 100,
      nftMinted: true,
      rarity: 'common'
    },
    {
      id: '3',
      title: 'Consistency Champion',
      description: '7-day streak of daily progress',
      type: 'streak',
      earnedDate: new Date('2024-01-08'),
      xpReward: 200,
      nftMinted: false,
      rarity: 'rare'
    },
    {
      id: '4',
      title: 'Speed Demon',
      description: 'Completed a week\'s tasks in 3 days',
      type: 'achievement',
      earnedDate: new Date('2024-01-05'),
      xpReward: 300,
      nftMinted: true,
      rarity: 'legendary'
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      default: return 'text-green-400 border-green-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal_completion': return <Trophy className="w-5 h-5" />;
      case 'milestone': return <Star className="w-5 h-5" />;
      case 'streak': return <Sparkles className="w-5 h-5" />;
      case 'achievement': return <Award className="w-5 h-5" />;
      default: return <Trophy className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'goal_completion': return 'bg-yellow-500/20 text-yellow-400';
      case 'milestone': return 'bg-blue-500/20 text-blue-400';
      case 'streak': return 'bg-green-500/20 text-green-400';
      case 'achievement': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <TopBar onSidebarToggle={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
      
      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isSidebarCollapsed ? '80px' : '250px',
          marginTop: '64px'
        }}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-foreground">Certificates & NFTs</h1>
              <p className="text-muted-foreground">Your achievements and Proof-of-Commitment NFTs</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                <Trophy className="w-3 h-3 mr-1" />
                {certificates.length} Certificates
              </Badge>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="premium-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{certificates.length}</p>
                      <p className="text-sm text-muted-foreground">Total Certificates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="premium-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Award className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {certificates.filter(c => c.nftMinted).length}
                      </p>
                      <p className="text-sm text-muted-foreground">NFTs Minted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="premium-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Star className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {certificates.reduce((sum, c) => sum + c.xpReward, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total XP Earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="premium-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Sparkles className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {certificates.filter(c => c.rarity === 'legendary').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Legendary</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Certificates Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Your Certificates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map((cert, index) => (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="group"
                    >
                      <Card className="premium-card hover:shadow-glow transition-all duration-300 cursor-pointer">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Certificate Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${getTypeColor(cert.type)}`}>
                                  {getTypeIcon(cert.type)}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {cert.title}
                                  </h3>
                                  <Badge className={`text-xs ${getRarityColor(cert.rarity)}`}>
                                    {cert.rarity}
                                  </Badge>
                                </div>
                              </div>
                              {cert.nftMinted && (
                                <Badge variant="outline" className="text-green-400 border-green-400">
                                  NFT
                                </Badge>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground">
                              {cert.description}
                            </p>

                            {/* XP Reward */}
                            <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm font-medium text-foreground">
                                +{cert.xpReward} XP
                              </span>
                            </div>

                            {/* Date */}
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>Earned {cert.earnedDate.toLocaleDateString()}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                              >
                                <Share2 className="w-3 h-3 mr-1" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* NFT Gallery Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>NFT Gallery</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Your Proof-of-Commitment NFTs
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Each certificate can be minted as an NFT to prove your achievements on the blockchain
                  </p>
                  <Button className="bg-gradient-primary text-white hover:shadow-glow">
                    <Sparkles className="w-4 h-4 mr-2" />
                    View NFT Gallery
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Certificates;
