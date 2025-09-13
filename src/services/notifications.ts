import { useToast } from '@/hooks/use-toast';
import { RealtimeUpdate } from './realtime';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  /**
   * Add notification
   */
  addNotification(notification: Omit<Notification, 'id'>): string {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();

    // Auto-remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }

  /**
   * Remove notification
   */
  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  /**
   * Handle real-time updates and show notifications
   */
  handleRealtimeUpdate(update: RealtimeUpdate): void {
    switch (update.type) {
      case 'xp_update':
        this.addNotification({
          type: 'success',
          title: 'XP Earned!',
          description: `+${update.data.amount} XP - ${update.data.reason}`,
          duration: 3000
        });
        break;

      case 'achievement_unlocked':
        this.addNotification({
          type: 'info',
          title: 'Achievement Unlocked!',
          description: `${update.data.title} - ${update.data.description}`,
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => {
              // Navigate to achievements page
              window.location.href = '/certificates';
            }
          }
        });
        break;

      case 'level_up':
        this.addNotification({
          type: 'success',
          title: 'Level Up!',
          description: `Congratulations! You've reached level ${update.data.newLevel}`,
          duration: 5000
        });
        break;

      case 'goal_progress':
        this.addNotification({
          type: 'info',
          title: 'Goal Progress',
          description: `Your goal "${update.data.goalTitle}" is ${update.data.progress}% complete`,
          duration: 4000
        });
        break;

      case 'streak_update':
        this.addNotification({
          type: 'success',
          title: 'Streak Updated!',
          description: `Current streak: ${update.data.currentStreak} days`,
          duration: 3000
        });
        break;
    }
  }

  /**
   * Show success notification
   */
  success(title: string, description: string, duration?: number): string {
    return this.addNotification({
      type: 'success',
      title,
      description,
      duration
    });
  }

  /**
   * Show info notification
   */
  info(title: string, description: string, duration?: number): string {
    return this.addNotification({
      type: 'info',
      title,
      description,
      duration
    });
  }

  /**
   * Show warning notification
   */
  warning(title: string, description: string, duration?: number): string {
    return this.addNotification({
      type: 'warning',
      title,
      description,
      duration
    });
  }

  /**
   * Show error notification
   */
  error(title: string, description: string, duration?: number): string {
    return this.addNotification({
      type: 'error',
      title,
      description,
      duration
    });
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Hook for using notification service
export const useNotifications = () => {
  const { toast } = useToast();
  
  return {
    notificationService,
    addNotification: (notification: Omit<Notification, 'id'>) => 
      notificationService.addNotification(notification),
    removeNotification: (id: string) => 
      notificationService.removeNotification(id),
    clearAll: () => 
      notificationService.clearAll(),
    getNotifications: () => 
      notificationService.getNotifications(),
    subscribe: (listener: (notifications: Notification[]) => void) => 
      notificationService.subscribe(listener),
    success: (title: string, description: string, duration?: number) => 
      notificationService.success(title, description, duration),
    info: (title: string, description: string, duration?: number) => 
      notificationService.info(title, description, duration),
    warning: (title: string, description: string, duration?: number) => 
      notificationService.warning(title, description, duration),
    error: (title: string, description: string, duration?: number) => 
      notificationService.error(title, description, duration),
    // Also provide toast integration
    toast
  };
};
