// Simple event emitter for analytics invalidation
class AnalyticsEventEmitter {
  private listeners: (() => void)[] = [];

  subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error("Error in analytics invalidation listener:", error);
      }
    });
  }
}

export const analyticsEventEmitter = new AnalyticsEventEmitter();
