import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Wallet {
  publicAddress: string;
  createdAt: Date;
}

interface WalletDisplayProps {
  wallet: Wallet;
  mnemonic?: string;
}

const WalletDisplay: React.FC<WalletDisplayProps> = ({ wallet, mnemonic }) => {
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: 'address' | 'mnemonic') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedMnemonic(true);
        setTimeout(() => setCopiedMnemonic(false), 2000);
      }
      toast({
        title: "Copied to clipboard",
        description: `${type === 'address' ? 'Wallet address' : 'Mnemonic phrase'} copied successfully.`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Wallet Address */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Wallet Address</span>
            <Badge variant="outline" className="text-green-400 border-green-400">
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar-accent/20 border border-sidebar-border">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-foreground break-all">
                {wallet.publicAddress}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Created: {wallet.createdAt.toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2 ml-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(wallet.publicAddress, 'address')}
                className="p-2"
              >
                {copiedAddress ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://sepolia.etherscan.io/address/${wallet.publicAddress}`, '_blank')}
                className="p-2"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mnemonic Phrase */}
      {mnemonic && (
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recovery Phrase</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMnemonic(!showMnemonic)}
                className="p-1 h-8 w-8"
              >
                {showMnemonic ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-sidebar-accent/20 border border-sidebar-border">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {mnemonic.split(' ').map((word, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center space-x-2 p-2 rounded bg-background/50"
                  >
                    <span className="text-xs text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-mono text-foreground">
                      {showMnemonic ? word : '••••••'}
                    </span>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {showMnemonic 
                    ? "Keep this phrase safe and never share it with anyone."
                    : "Click the eye icon to reveal your recovery phrase."
                  }
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(mnemonic, 'mnemonic')}
                  className="p-2"
                >
                  {copiedMnemonic ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Warning */}
      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-400 text-lg">⚠️</div>
          <div>
            <h4 className="font-medium text-yellow-400 mb-1">Important Security Notice</h4>
            <p className="text-sm text-muted-foreground">
              Your wallet is now ready to receive Proof-of-Commitment NFTs. Keep your recovery phrase safe and never share it with anyone. 
              This wallet will be used to mint NFTs when you complete your goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDisplay;
