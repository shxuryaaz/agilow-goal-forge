import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  Edit, 
  Share, 
  Settings,
  Bell,
  Shield,
  Palette,
  Download,
  Upload,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react';
import Sidebar from '@/components/layout/sidebar';
import TopBar from '@/components/layout/topbar';
import BadgeDisplay from '@/components/gamification/badge-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const Profile: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: false,
    achievements: true
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const goals = [
    {
      id: 1,
      title: 'Launch SaaS Product',
      progress: 65,
      deadline: '2024-07-15',
      status: 'active',
      category: 'Business',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Learn French',
      progress: 30,
      deadline: '2024-12-31',
      status: 'active',
      category: 'Learning',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Run Marathon',
      progress: 100,
      deadline: '2024-03-15',
      status: 'completed',
      category: 'Health',
      priority: 'high'
    }
  ];

  const stats = [
    { label: 'Total XP', value: '1,250', icon: Star, color: 'text-warning' },
    { label: 'Goals Completed', value: '5', icon: CheckCircle, color: 'text-success' },
    { label: 'Active Streak', value: '12 days', icon: TrendingUp, color: 'text-primary' },
    { label: 'Plans Generated', value: '8', icon: Target, color: 'text-accent-green' }
  ];

  const recentActivity = [
    { id: 1, action: 'Completed milestone', goal: 'Launch SaaS Product', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'Earned badge', goal: 'Planning Master', time: '1 day ago', type: 'achievement' },
    { id: 3, action: 'Created new goal', goal: 'Learn French', time: '2 days ago', type: 'info' },
    { id: 4, action: 'Updated progress', goal: 'Run Marathon', time: '3 days ago', type: 'update' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      
      <TopBar 
        onSidebarToggle={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      
      <main 
        className="transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: isSidebarCollapsed ? '80px' : '250px',
          marginTop: '64px'
        }}
      >
        <div className="p-6 space-y-6">
          
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-8"
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="text-3xl bg-gradient-primary text-white">JD</AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                      John Doe
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Goal Achiever • Member since January 2024
                    </p>
                    <div className="flex items-center justify-center lg:justify-start space-x-4 mt-2">
                      <Badge className="bg-success/10 text-success border-success/20">
                        Level 3 Achiever
                      </Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        12 day streak
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 mt-6 lg:mt-0">
                    <Button variant="outline" className="hover-lift">
                      <Share className="w-4 h-4 mr-2" />
                      Share Profile
                    </Button>
                    <Button className="btn-primary">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </div>
                
                {/* XP Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress to Level 4</span>
                    <span className="text-foreground font-medium">1,250 / 2,000 XP</span>
                  </div>
                  <Progress value={62.5} className="h-3" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="premium-card p-6 hover-lift"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-primary/10 ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Left Column - Goals & Activity */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Goals Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="premium-card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Target className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">My Goals</h2>
                  </div>
                  <Button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Goal
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {goals.map((goal, index) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-medium ${
                        goal.status === 'completed' 
                          ? 'bg-success/5 border-success/20' 
                          : 'bg-secondary/30 border-border hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg mb-1">
                            {goal.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Due: {new Date(goal.deadline).toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {goal.category}
                            </Badge>
                            <Badge className={
                              goal.priority === 'high' ? 'bg-error/10 text-error border-error/20' :
                              goal.priority === 'medium' ? 'bg-warning/10 text-warning border-warning/20' :
                              'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20'
                            }>
                              {goal.priority}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={
                          goal.status === 'completed' ? 'status-completed' : 'status-active'
                        }>
                          {goal.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-foreground font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="premium-card p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
                  </div>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        activity.type === 'success' ? 'bg-success' :
                        activity.type === 'achievement' ? 'bg-warning' :
                        activity.type === 'info' ? 'bg-primary' :
                        'bg-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.goal}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Settings & Achievements */}
            <div className="space-y-6">
              
              {/* Achievements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="premium-card p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Trophy className="w-6 h-6 text-warning" />
                  <h2 className="text-xl font-semibold text-foreground">Achievements</h2>
                </div>
                <BadgeDisplay showAll={true} />
              </motion.div>

              {/* Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="premium-card p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Settings className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Settings</h2>
                </div>
                
                <Tabs defaultValue="notifications" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="notifications" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Email Notifications</Label>
                          <p className="text-xs text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch 
                          checked={notifications.email}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Push Notifications</Label>
                          <p className="text-xs text-muted-foreground">Get real-time updates</p>
                        </div>
                        <Switch 
                          checked={notifications.push}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Weekly Reports</Label>
                          <p className="text-xs text-muted-foreground">Summary of your progress</p>
                        </div>
                        <Switch 
                          checked={notifications.weekly}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weekly: checked }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Achievement Alerts</Label>
                          <p className="text-xs text-muted-foreground">Celebrate your wins</p>
                        </div>
                        <Switch 
                          checked={notifications.achievements}
                          onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, achievements: checked }))}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="privacy" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Public Profile</Label>
                          <p className="text-xs text-muted-foreground">Make your profile visible to others</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Goal Sharing</Label>
                          <p className="text-xs text-muted-foreground">Allow others to see your goals</p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Analytics Sharing</Label>
                          <p className="text-xs text-muted-foreground">Share anonymous usage data</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="premium-card p-6"
              >
                <h2 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start hover-lift">
                    <Download className="w-4 h-4 mr-3" />
                    Export Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover-lift">
                    <Upload className="w-4 h-4 mr-3" />
                    Import Goals
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover-lift text-error hover:text-error">
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete Account
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;