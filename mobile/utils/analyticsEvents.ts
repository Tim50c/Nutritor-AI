// Enhanced event emitter for analytics invalidation with nutritional data
export type AnalyticsEventType = 'diet_change' | 'food_added' | 'food_removed';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  data?: {
    nutritionChange?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    foodId?: string;
    foodName?: string;
  };
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

  emit(event?: AnalyticsEvent): void {
    console.log("📡 [AnalyticsEventEmitter] Emitting event:", event);
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error("Error in analytics invalidation listener:", error);
      }
    });
  }

  // Convenience methods for common events
  emitFoodAdded(nutritionChange: { calories: number; protein: number; carbs: number; fat: number }, foodName?: string): void {
    this.emit({
      type: 'food_added',
      data: { nutritionChange, foodName }
    });
  }

  emitFoodRemoved(nutritionChange: { calories: number; protein: number; carbs: number; fat: number }, foodName?: string): void {
    this.emit({
      type: 'food_removed',
      data: { 
        nutritionChange: {
          calories: -nutritionChange.calories,
          protein: -nutritionChange.protein,
          carbs: -nutritionChange.carbs,
          fat: -nutritionChange.fat,
        }, 
        foodName 
      }
    });
  }

  emitDietChange(): void {
    this.emit({ type: 'diet_change' });
  }
}

export const analyticsEventEmitter = new AnalyticsEventEmitter();
