import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Star, Calendar, Download } from 'lucide-react';
import { Certificate } from '@/services/certificates';
import { certificatePDFService } from '@/services/certificatePDF';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CertificateNotificationProps {
  certificate: Certificate | null;
  onClose: () => void;
  onView: () => void;
}

const CertificateNotification: React.FC<CertificateNotificationProps> = ({
  certificate,
  onClose,
  onView
}) => {
  if (!certificate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="fixed top-4 right-4 z-50 w-96"
      >
        <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 shadow-2xl">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-yellow-400/20">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    🎖️ Certificate Earned!
                  </h3>
                  <Badge className="bg-yellow-400 text-yellow-900 text-xs">
                    BHAG COMPLETION
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Certificate Details */}
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground text-base">
                  {certificate.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {certificate.description}
                </p>
              </div>

              {/* XP Reward */}
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-foreground">
                  +{certificate.xpAwarded} XP Bonus!
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>
                  Completed on {new Date(certificate.completionDate).toLocaleDateString()}
                </span>
              </div>

              {/* Certificate Image Preview */}
              {certificate.imageUrl && (
                <div className="mt-4">
                  <img
                    src={certificate.imageUrl}
                    alt="Certificate Preview"
                    className="w-full h-32 object-cover rounded-lg border-2 border-yellow-200"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-3">
                <Button
                  onClick={onView}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  View Certificate
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      if (certificate.imageUrl) {
                        await certificatePDFService.downloadCertificatePDFFromImage(certificate);
                      } else {
                        await certificatePDFService.downloadCertificatePDF(certificate);
                      }
                    } catch (error) {
                      console.error('Error downloading certificate:', error);
                    }
                  }}
                  className="flex-1"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Dismiss
                </Button>
              </div>
            </div>

            {/* Celebration Animation */}
            <div className="absolute -top-2 -right-2">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="text-2xl"
              >
                🎉
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default CertificateNotification;
