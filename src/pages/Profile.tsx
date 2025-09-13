import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Target, Calendar, Edit, Share } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import BadgeDisplay from '@/components/gamification/badge-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

const Profile: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const goals = [
    {
      id: 1,
      title: 'Launch SaaS Product',
      progress: 65,
      deadline: '2024-07-15',
      status: 'active'
    },
    {
      id: 2,
      title: 'Learn French',
      progress: 30,
      deadline: '2024-12-31',
      status: 'active'
    },
    {
      id: 3,
      title: 'Run Marathon',
      progress: 100,
      deadline: '2024-03-15',
      status: 'completed'
    }
  ];

  const stats = [
    { label: 'Total XP', value: '1,250' },
    { label: 'Goals Completed', value: '5' },
    { label: 'Active Streak', value: '12 days' },
    { label: 'Plans Generated', value: '8' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        isLoggedIn={true}
        userXP={1250}
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
      />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 mb-8"
            >
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                <Avatar className="w-24 h-24">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="text-2xl">JD</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">
                        John Doe
                      </h1>
                      <p className="text-muted-foreground">
                        Goal Achiever • Member since January 2024
                      </p>
                    </div>
                    
                    <div className="flex space-x-2 mt-4 md:mt-0">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                  
                  {/* XP Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Level 3 Achiever</span>
                      <span>1,250 / 2,000 XP</span>
                    </div>
                    <Progress value={62.5} className="h-2" />
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column - Stats & Goals */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {stat.value}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {stat.label}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Active Goals */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-primary" />
                        <span>My Goals</span>
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        New Goal
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {goals.map((goal, index) => (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-xl border ${
                          goal.status === 'completed' 
                            ? 'bg-success-light/20 border-success/30' 
                            : 'bg-muted/50 border-border'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-foreground">
                            {goal.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            goal.status === 'completed'
                              ? 'bg-success text-success-foreground'
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {goal.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground mt-3">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Badges */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-accent-green" />
                      <span>Achievements</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BadgeDisplay showAll={true} />
                  </CardContent>
                </Card>

                {/* Activity Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <span className="text-sm">Completed milestone: MVP wireframes</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-sm">Created new SMART plan</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-accent-green rounded-full" />
                      <span className="text-sm">Earned "Planning Master" badge</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                      <span className="text-sm">Set new goal: Launch SaaS</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;