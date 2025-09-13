import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import WalletDisplay from '@/components/wallet/wallet-display';
import { trelloService } from '@/services/trello';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  customMessage?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, customMessage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [walletInfo, setWalletInfo] = useState<{ mnemonic: string; address: string } | null>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        
        // Redirect to Trello OAuth after successful sign-in
        setTimeout(() => {
          window.location.href = trelloService.getOAuthUrl();
        }, 1000);
      } else {
        if (!name.trim()) {
          toast({
            title: "Name required",
            description: "Please enter your name to create an account.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        const walletData = await signUpWithEmail(email, password, name);
        toast({
          title: "Welcome to Agilow!",
          description: "Your account has been created successfully.",
        });
        
        // Show wallet setup for new users
        if (walletData) {
          setWalletInfo(walletData);
          setShowWalletSetup(true);
          return;
        } else {
          // Redirect to Trello OAuth after successful sign-up (no wallet)
          setTimeout(() => {
            window.location.href = trelloService.getOAuthUrl();
          }, 1000);
          return;
        }
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication failed",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome to Agilow!",
        description: "You've successfully signed in with Google.",
      });
      
      // Redirect to Trello OAuth after successful Google sign-in
      setTimeout(() => {
        window.location.href = trelloService.getOAuthUrl();
      }, 1000);
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast({
        title: "Google sign-in failed",
        description: error.message || "An error occurred during Google authentication.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletSetupComplete = () => {
    setShowWalletSetup(false);
    setWalletInfo(null);
    
    // Redirect to Trello OAuth after wallet setup completion
    setTimeout(() => {
      window.location.href = trelloService.getOAuthUrl();
    }, 1000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        className={`relative z-10 w-full mx-4 ${
          showWalletSetup ? 'max-w-2xl' : 'max-w-md'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="glass-card p-6">
          {/* Header */}
          <div className="relative mb-6">
            <div className="text-center">
              {customMessage && (
                <img 
                  src="https://i.ibb.co/7tsFM7d3/agilowlogosmall.png" 
                  alt="Agilow" 
                  className="w-12 h-12 mx-auto mb-3"
                />
              )}
              <h2 className={`${customMessage ? 'text-2xl' : 'text-2xl'} font-bold text-foreground`}>
                {showWalletSetup ? 'Your Wallet is Ready!' : (customMessage || (isLogin ? 'Welcome back' : 'Join Agilow'))}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-0 right-0 rounded-full w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Wallet Setup Content */}
          {showWalletSetup && walletInfo && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-foreground">
                  Welcome to Agilow!
                </h3>
                <p className="text-muted-foreground">
                  We've created a personal wallet for you. This wallet will receive Proof-of-Commitment NFTs for your goals.
                </p>
              </div>

              <WalletDisplay 
                wallet={{
                  publicAddress: walletInfo.address,
                  createdAt: new Date() as any,
                }}
                mnemonic={walletInfo.mnemonic}
              />

              <div className="flex space-x-3">
                <Button
                  onClick={handleWalletSetupComplete}
                  className="flex-1 bg-gradient-primary text-white hover:shadow-glow"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Regular Auth Content */}
          {!showWalletSetup && (
            <>
          {/* Google Auth */}
          <Button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full mb-4 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
          >
            <Chrome className="w-4 h-4 mr-2" />
            Continue with Google
          </Button>

          <div className="flex items-center my-4">
            <Separator className="flex-1" />
            <span className="px-3 text-sm text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-primary text-white hover:shadow-glow"
            >
              {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuthModal;