import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Target, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  currentStep: number;
  className?: string;
}

const steps = [
  { id: 1, title: 'Goal captured', icon: Target },
  { id: 2, title: 'SMART plan generated', icon: Zap },
  { id: 3, title: 'Trello synced', icon: TrendingUp },
  { id: 4, title: 'Milestones tracked', icon: Check },
];

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentStep, className }) => {
  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Progress</h3>
        <span className="text-sm text-muted-foreground">
          {Math.round((currentStep / steps.length) * 100)}% complete
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="progress-bar h-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isCompleted = step.id <= currentStep;
          const isCurrent = step.id === currentStep;
          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-xl transition-all",
                isCompleted && "bg-success-light/20",
                isCurrent && "bg-primary-light/20 ring-2 ring-primary/30"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.id * 0.1 }}
            >
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                isCompleted && "bg-success text-success-foreground",
                isCurrent && "bg-primary text-primary-foreground",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              
              <span className={cn(
                "text-sm font-medium",
                isCompleted && "text-success",
                isCurrent && "text-primary",
                !isCompleted && !isCurrent && "text-muted-foreground"
              )}>
                {step.title}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracker;