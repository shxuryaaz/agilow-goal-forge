import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { trelloService } from '@/services/trello';

const OAuthCallback: React.FC = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Handle Trello OAuth callback
    console.log('OAuthCallback component mounted');
    console.log('Current URL hash:', window.location.hash);
    console.log('Current URL search:', window.location.search);
    console.log('Current URL:', window.location.href);
    console.log('User:', user?.uid);
    
    if (user) {
      // Add a small delay to ensure the URL is fully loaded
      setTimeout(() => {
        trelloService.handleOAuthCallback(user.uid).then((token) => {
          if (token) {
            console.log('Trello token saved successfully:', token.substring(0, 10) + '...');
          } else {
            console.log('No token found in URL');
          }
          setIsProcessing(false);
          setShouldRedirect(true);
        }).catch((error) => {
          console.error('Error handling OAuth callback:', error);
          setIsProcessing(false);
          setShouldRedirect(true);
        });
      }, 100);
    }
  }, [user]);

  if (shouldRedirect) {
    return <Navigate to="/chat" replace />;
  }

  // Show loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Processing Trello connection...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
