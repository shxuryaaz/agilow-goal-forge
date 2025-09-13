import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Target, 
  Trophy,
  TrendingUp,
  Calendar,
  CheckCircle
} from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import TrelloIntegration from '@/components/trello/trello-integration';
import { trelloService } from '@/services/trello';

const Dashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showTrelloIntegration, setShowTrelloIntegration] = useState(false);

  // OAuth callback is now handled in OAuthCallback.tsx component

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Mock data for dashboard metrics
  const stats = [
    {
      title: 'Total Goals',
      value: '12',
      change: '+2 this week',
      icon: Target,
      color: 'text-blue-400'
    },
    {
      title: 'Completed',
      value: '8',
      change: '+3 this week',
      icon: CheckCircle,
      color: 'text-green-400'
    },
    {
      title: 'In Progress',
      value: '4',
      change: '2 active',
      icon: TrendingUp,
      color: 'text-yellow-400'
    },
    {
      title: 'Total XP',
      value: '2,450',
      change: '+300 this week',
      icon: Trophy,
      color: 'text-purple-400'
    }
  ];

  const recentGoals = [
    {
      id: '1',
      name: 'Complete React Course',
      progress: 75,
      status: 'in-progress',
      dueDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Run 5K Marathon',
      progress: 45,
      status: 'in-progress',
      dueDate: '2024-02-01'
    },
    {
      id: '3',
      name: 'Read 12 Books',
      progress: 100,
      status: 'completed',
      dueDate: '2024-01-10'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <TopBar onSidebarToggle={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
      
      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isSidebarCollapsed ? '80px' : '320px',
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
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Track your goals and progress</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-400 border-green-400">
                <Trophy className="w-3 h-3 mr-1" />
                Level 5
              </Badge>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="premium-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Recent Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Recent Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-4 rounded-lg bg-sidebar-accent/20 border border-sidebar-border">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground">{goal.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={
                            goal.status === 'completed' 
                              ? 'text-green-400 border-green-400' 
                              : 'text-yellow-400 border-yellow-400'
                          }
                        >
                          {goal.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                      <Progress value={goal.progress} className="mb-2" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{goal.progress}% complete</span>
                        <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-sidebar-accent/20 border border-sidebar-border hover:bg-sidebar-accent/30 transition-colors cursor-pointer">
                    <Target className="w-8 h-8 text-blue-400 mb-2" />
                    <h3 className="font-medium text-foreground mb-1">Create New Goal</h3>
                    <p className="text-sm text-muted-foreground">Start a new goal with AI assistance</p>
                  </div>
                  <div className="p-4 rounded-lg bg-sidebar-accent/20 border border-sidebar-border hover:bg-sidebar-accent/30 transition-colors cursor-pointer">
                    <Calendar className="w-8 h-8 text-green-400 mb-2" />
                    <h3 className="font-medium text-foreground mb-1">View Calendar</h3>
                    <p className="text-sm text-muted-foreground">See your goal timeline</p>
                  </div>
                  <div className="p-4 rounded-lg bg-sidebar-accent/20 border border-sidebar-border hover:bg-sidebar-accent/30 transition-colors cursor-pointer">
                    <Trophy className="w-8 h-8 text-purple-400 mb-2" />
                    <h3 className="font-medium text-foreground mb-1">View Achievements</h3>
                    <p className="text-sm text-muted-foreground">Check your progress and rewards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Trello Integration Modal */}
      <TrelloIntegration
        isOpen={showTrelloIntegration}
        onClose={() => setShowTrelloIntegration(false)}
      />
    </div>
  );
};

export default Dashboard;