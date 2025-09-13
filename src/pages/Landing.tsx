import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Target, 
  TrendingUp, 
  Users, 
  Play,
  BarChart3,
  Shield,
  Github,
  Twitter,
  Linkedin,
  Zap,
  CheckCircle,
  Plus,
  Send,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/auth-modal';

const Landing: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);
  const [goalInput, setGoalInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatedTextIndex, setAnimatedTextIndex] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const { user } = useAuth();

  // Animated placeholder text options
  const placeholderTexts = [
    'I want to launch a successful startup, learn Spanish fluently, run a marathon, or...',
    'I want to build my dream business, master a new skill, travel the world, or...',
    'I want to write a book, start a podcast, learn to code, or...',
    'I want to get in shape, learn an instrument, start a side project, or...',
    'I want to achieve financial freedom, learn a language, start a blog, or...'
  ];

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;

    // Show auth modal immediately with sign-in message
    setAuthModalMessage("Sign in to keep track of your goals");
    setShowAuthModal(true);
  };

  const features = [
    {
      icon: Target,
      title: 'Smart Goal Setting',
      description: 'Break big ambitions into actionable milestones and track real progress.',
      graphic: 'dashboard-preview'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor achievements with visual dashboards and intelligent insights.',
      graphic: 'analytics-preview'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with shared goals and real-time updates.',
      graphic: 'collaboration-preview'
    }
  ];


  // Typing animation effect
  useEffect(() => {
    let typingTimer: NodeJS.Timeout;
    
    const startTypingAnimation = () => {
      const currentText = placeholderTexts[animatedTextIndex];
      setTypingText('');
      setIsTypingAnimation(true);
      
      let charIndex = 0;
      const typeChar = () => {
        if (charIndex < currentText.length) {
          setTypingText(currentText.slice(0, charIndex + 1));
          charIndex++;
          typingTimer = setTimeout(typeChar, 50); // 50ms delay between characters
        } else {
          setIsTypingAnimation(false);
          // Wait 2 seconds before starting next text
          setTimeout(() => {
            setAnimatedTextIndex((prev) => (prev + 1) % placeholderTexts.length);
          }, 2000);
        }
      };
      
      typeChar();
    };
    
    startTypingAnimation();
    
    return () => {
      if (typingTimer) clearTimeout(typingTimer);
    };
  }, [animatedTextIndex]);


  return (
    <div className="min-h-screen bg-background">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth, 
                y: window.innerHeight + 10,
                rotate: 0 
              }}
              animate={{ 
                y: -10, 
                rotate: 360,
                opacity: [1, 1, 0]
              }}
              transition={{ 
                duration: 3,
                delay: Math.random() * 0.5,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
      {/* Sticky Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-end space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-3 mr-auto ml-8">
              <img 
                src="https://i.ibb.co/7tsFM7d3/agilowlogosmall.png" 
                alt="Agilow" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-foreground">Agilow</span>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="#login" className="text-muted-foreground hover:text-foreground transition-colors">Login</a>
            </div>

            {/* CTA Button */}
            <Button 
              onClick={() => {
                setAuthModalMessage(undefined);
                setShowAuthModal(true);
              }}
              className="btn-primary"
            >
              Get Started
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Lovable Style with Animated Text */}
      <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Gradient - Matching UI Theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-accent opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-secondary/10"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-12"
            >
              {/* Single Line Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-center space-x-2 whitespace-nowrap"
              >
                <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                  Achieve your goals using
                </h1>
                
                <img 
                  src="https://i.ibb.co/7tsFM7d3/agilowlogosmall.png" 
                  alt="Agilow" 
                  className="w-12 h-12"
                />
                
                <span className="text-5xl lg:text-6xl font-extrabold tracking-tight text-orange-600 animate-pulse">
                  gilow
                </span>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
              >
                Achieve your goals easily
              </motion.p>
            </motion.div>
          </div>

          {/* Lovable-Style Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.8 }}
            className="max-w-4xl mx-auto mt-16"
          >
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-2xl">
              {/* AI Response Placeholder */}
              {isTyping && (
                <div className="space-y-6 mb-8 min-h-[120px] flex items-center">
                  <div className="flex items-start space-x-4 w-full">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-gradient-to-r from-primary/20 to-secondary/10 rounded-3xl rounded-tl-lg p-6 max-w-[85%] shadow-md">
                      <div className="flex items-center space-x-3">
                        <div className="typing-dots">
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                        <span className="text-foreground text-base">Creating your personalized plan...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Goal Input Form */}
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div className="relative">
                  <div className="relative">
                    <textarea
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="w-full bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl px-6 py-5 pr-16 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none text-lg shadow-lg transition-all duration-500"
                      rows={3}
                      disabled={isTyping}
                    />
                    {!goalInput && (
                      <div className="absolute top-5 left-6 text-muted-foreground text-lg pointer-events-none">
                        {typingText}
                        {isTypingAnimation && (
                          <span className="animate-pulse">|</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={!goalInput.trim() || isTyping}
                    className="absolute bottom-3 right-3 w-11 h-11 p-0 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  {isTyping ? 'Analyzing your goal and creating a plan...' : 'Press Enter or click Send to get started'}
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section - Alternating Layout */}
      <section id="features" className="py-24 bg-card">
          <div className="container mx-auto max-w-7xl px-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className={`grid lg:grid-cols-2 gap-16 items-center mb-32 ${index === features.length - 1 ? 'mb-0' : ''}`}
                >
                  {/* Text Content */}
                  <div className={isEven ? 'lg:order-1' : 'lg:order-2'}>
                    <div className="max-w-lg">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-6">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      
                      <h2 className="text-4xl font-bold text-foreground mb-6">
                        {feature.title}
                      </h2>
                      
                      <p className="text-xl text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Graphic/Illustration */}
                  <div className={isEven ? 'lg:order-2' : 'lg:order-1'}>
                    <div className="bg-gradient-to-br from-accent to-card rounded-3xl p-8 ring-1 ring-border/20 shadow-md hover:shadow-xl transition-shadow duration-300">
                      <div className="space-y-6">
                        {/* Mock Dashboard Elements */}
                        <div className="flex items-center justify-between">
                          <div className="h-6 bg-primary/20 rounded w-40"></div>
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-background/50 rounded-lg p-4 border border-border">
                              <div className="h-4 bg-primary/20 rounded w-20 mb-2"></div>
                              <div className="h-2 bg-border rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-secondary"
                                  style={{ width: `${40 + i * 15}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>


        {/* CTA Section - Full Width Gradient */}
        <section className="py-24 bg-gradient-to-r from-primary via-primary to-secondary">
          <div className="container mx-auto max-w-7xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-5xl font-bold text-white mb-6">
                Ready to achieve your goals?
              </h2>
              
              <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                Join teams and individuals who use Agilow to plan smarter and track better.
              </p>
              
              <div className="flex justify-center items-center mb-8">
                <Button
                  onClick={() => {
                    setAuthModalMessage(undefined);
                    setShowAuthModal(true);
                  }}
                  className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Let's Get You Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border">
        <div className="container mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Product */}
            <div>
              <h3 className="font-semibold text-foreground mb-6">Product</h3>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-foreground mb-6">Company</h3>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#about" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-foreground mb-6">Support</h3>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-semibold text-foreground mb-6">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Agilow. All rights reserved.
            </p>
            <div className="flex space-x-8 mt-4 md:mt-0 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        customMessage={authModalMessage}
      />
    </div>
  );
};

export default Landing;