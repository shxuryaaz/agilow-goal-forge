import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Zap, Award, Crown } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  earned: boolean;
  earnedAt?: Date;
}

interface BadgeDisplayProps {
  badges?: Badge[];
  showAll?: boolean;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ 
  badges = [], 
  showAll = false 
}) => {
  const displayBadges = showAll ? badges : badges.filter(b => b.earned);

  if (displayBadges.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Trophy className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Achievements Yet</h3>
        <p className="text-muted-foreground">Start creating goals and completing milestones to earn your first achievements!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {displayBadges.map((badge, index) => {
        const Icon = badge.icon;
        
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`
              glass-card p-4 text-center relative group cursor-pointer
              ${badge.earned ? 'hover:shadow-glow' : 'opacity-60'}
            `}
          >
            {/* Badge Icon */}
            <div className={`
              w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center
              ${badge.earned 
                ? 'bg-gradient-primary text-white shadow-medium' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              <Icon className="w-6 h-6" />
            </div>

            {/* Badge Info */}
            <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
            <p className="text-xs text-muted-foreground">{badge.description}</p>

            {/* Earned Date */}
            {badge.earned && badge.earnedAt && (
              <p className="text-xs text-success mt-2">
                Earned {badge.earnedAt.toLocaleDateString()}
              </p>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-popover text-popover-foreground text-xs rounded-lg px-3 py-2 shadow-strong">
                {badge.description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BadgeDisplay;