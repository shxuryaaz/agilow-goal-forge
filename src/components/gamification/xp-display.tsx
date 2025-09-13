import React from 'react';
import { motion } from 'framer-motion';
import { Star, Trophy, Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface XPDisplayProps {
  xp: number;
  streak: number;
  badges: string[];
  level?: number;
  className?: string;
}

const XPDisplay: React.FC<XPDisplayProps> = ({ 
  xp, 
  streak, 
  badges, 
  level = 1,
  className = '' 
}) => {
  // Calculate XP needed for next level (simple progression)
  const xpForCurrentLevel = (level - 1) * 1000;
  const xpForNextLevel = level * 1000;
  const xpProgress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  return (
    <motion.div 
      className={`glass-card p-4 space-y-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* XP and Level */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold text-foreground">{xp.toLocaleString()} XP</span>
        </div>
        <Badge variant="secondary" className="bg-gradient-primary text-white">
          Level {level}
        </Badge>
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress to Level {level + 1}</span>
          <span>{Math.round(xpProgress)}%</span>
        </div>
        <Progress value={xpProgress} className="h-2" />
        <div className="text-xs text-muted-foreground text-center">
          {xpForNextLevel - xp} XP to next level
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center space-x-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <span className="text-foreground">
          <span className="font-semibold">{streak}</span> day streak
        </span>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">Badges</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.slice(0, 5).map((badge, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {badge}
              </Badge>
            ))}
            {badges.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{badges.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default XPDisplay;

