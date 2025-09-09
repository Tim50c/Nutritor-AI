// Enhanced event emitter for analytics invalidation with event types
export type AnalyticsEventType = 'diet_change' | 'food_added' | 'food_removed' | 'general_update';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  data?: any;
  timestamp: number;
}

class AnalyticsEventEmitter {
  private listeners: ((event?: AnalyticsEvent) => void)[] = [];

  subscribe(callback: (event?: AnalyticsEvent) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(type: AnalyticsEventType = 'general_update', data?: any): void {
    const event: AnalyticsEvent = {
      type,
      data,
      timestamp: Date.now()
    };

    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error("Error in analytics invalidation listener:", error);
      }
    });
  }

  // Backward compatibility method
  emitDietChange(data?: any): void {
    this.emit('diet_change', data);
  }

  emitFoodAdded(food?: any): void {
    this.emit('food_added', food);
  }

  emitFoodRemoved(food?: any): void {
    this.emit('food_removed', food);
  }
}

export const analyticsEventEmitter = new AnalyticsEventEmitter();
