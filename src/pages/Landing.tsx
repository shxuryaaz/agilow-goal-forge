import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Target, Zap, TrendingUp, Users } from 'lucide-react';
import Navbar from '@/components/layout/navbar';
import ChatInterface from '@/components/chat/chat-interface';
import AuthModal from '@/components/auth/auth-modal';
import Confetti from '@/components/ui/confetti';
import heroIllustration from '@/assets/hero-illustration.png';

const Landing: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleGoalSubmit = (goal: string) => {
    // Show confetti for ambitious goals
    if (goal.length > 20) {
      setShowConfetti(true);
    }
    
    // Show auth modal after a brief delay
    setTimeout(() => {
      setShowAuthModal(true);
    }, 3000);
  };

  const handleAuthSuccess = () => {
    // In a real app, this would redirect to the main app
    console.log('Authentication successful');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const features = [
    {
      icon: Target,
      title: 'Smart Goal Setting',
      description: 'Transform vague dreams into SMART, actionable goals'
    },
    {
      icon: Zap,
      title: 'AI-Powered Plans',
      description: 'Get personalized roadmaps created by advanced AI'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor milestones and celebrate achievements'
    },
    {
      icon: Users,
      title: 'Team Integration',
      description: 'Sync with Trello and Slack for seamless collaboration'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
      />
      
      <Confetti 
        active={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* Hero Section */}
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                What's your{' '}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  big goal?
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Agilow helps you dream big and turn ambition into an actionable roadmap.
              </p>

              {/* Hero Illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mb-12"
              >
                <img 
                  src={heroIllustration} 
                  alt="Goal Planning Illustration" 
                  className="mx-auto max-w-md w-full animate-bounce-gentle"
                />
              </motion.div>
            </motion.div>

            {/* Chat Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mb-16"
            >
              <ChatInterface
                isLandingPage={true}
                onGoalSubmit={handleGoalSubmit}
              />
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Turn dreams into reality
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our AI-powered platform guides you from ambitious goals to concrete action plans
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                    className="glass-card p-6 text-center group hover:shadow-medium transition-all duration-300"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ready to achieve your goals?
              </h2>
              
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of goal-achievers who've turned their dreams into reality with Agilow
              </p>
              
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-hero inline-flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Landing;