import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, BarChart3, Settings, ExternalLink } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import ChatInterface from '@/components/chat/chat-interface';
import ProgressTracker from '@/components/ui/progress-tracker';
import BadgeDisplay from '@/components/gamification/badge-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const Dashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [messages] = useState<Message[]>([
    {
      id: '1',
      text: 'I want to launch my own SaaS product within 6 months',
      isUser: true,
      timestamp: new Date('2024-01-15T10:00:00')
    },
    {
      id: '2',
      text: 'Excellent goal! I\'ve created a comprehensive SMART plan for launching your SaaS product. Here are the key milestones:\n\n1. Market Research & Validation (Month 1)\n2. MVP Development (Months 2-3)\n3. Beta Testing & Iteration (Month 4)\n4. Marketing Strategy & Launch Prep (Month 5)\n5. Official Launch (Month 6)\n\nWould you like me to break down any of these phases in more detail?',
      isUser: false,
      timestamp: new Date('2024-01-15T10:01:00')
    },
    {
      id: '3',
      text: 'Yes, please break down the MVP development phase',
      isUser: true,
      timestamp: new Date('2024-01-15T10:02:00')
    }
  ]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const trelloTasks = [
    { id: 1, title: 'Conduct user interviews', completed: true },
    { id: 2, title: 'Create wireframes', completed: true },
    { id: 3, title: 'Set up development environment', completed: false },
    { id: 4, title: 'Build authentication system', completed: false },
    { id: 5, title: 'Design database schema', completed: false },
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
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar - Progress & Stats */}
            <div className="lg:col-span-3 space-y-6">
              {/* Progress Tracker */}
              <ProgressTracker currentStep={currentStep} />
              
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Goals Set</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Plans Created</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Milestones Hit</span>
                    <span className="font-semibold">7</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Streak</span>
                    <span className="font-semibold text-success">5 days</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  <BadgeDisplay showAll={false} />
                </CardContent>
              </Card>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[calc(100vh-200px)] flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">
                      Goal Assistant
                    </h1>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="glass-card flex-1 p-6">
                  <ChatInterface messages={messages} />
                </div>
              </motion.div>
            </div>

            {/* Right Sidebar - Trello Integration */}
            <div className="lg:col-span-3 space-y-6">
              {/* Trello Preview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Trello Board</CardTitle>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    SaaS Launch Project
                  </div>
                  
                  {trelloTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border ${
                        task.completed 
                          ? 'bg-success-light/20 border-success/30' 
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          task.completed ? 'bg-success' : 'bg-muted-foreground'
                        }`} />
                        <span className={`text-sm ${
                          task.completed 
                            ? 'text-success line-through' 
                            : 'text-foreground'
                        }`}>
                          {task.title}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  <div className="text-center">
                    <Button variant="outline" size="sm" className="w-full">
                      View Full Board
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    Set New Goal
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Review Progress
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Connect Slack
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Export Plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;