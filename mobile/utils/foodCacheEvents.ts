// Simple event emitter for food cache updates
class FoodCacheEventEmitter {
  private static instance: FoodCacheEventEmitter;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  private constructor() {}

  public static getInstance(): FoodCacheEventEmitter {
    if (!FoodCacheEventEmitter.instance) {
      FoodCacheEventEmitter.instance = new FoodCacheEventEmitter();
    }
    return FoodCacheEventEmitter.instance;
  }

  // Emit an event
  private emit(eventName: string, data: any) {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Add listener
  private on(eventName: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)?.push(callback);
  }

  // Remove listener
  private off(eventName: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Emit when a food image is updated
  public emitFoodImageUpdated(foodId: string, imageUrl: string) {
    console.log("📡 [FoodCacheEvents] Emitting food image update:", { foodId, imageUrl });
    this.emit('foodImageUpdated', { foodId, imageUrl });
  }

  // Listen for food image updates
  public onFoodImageUpdated(callback: (data: { foodId: string; imageUrl: string }) => void) {
    this.on('foodImageUpdated', callback);
  }

  // Remove listener
  public offFoodImageUpdated(callback: (data: { foodId: string; imageUrl: string }) => void) {
    this.off('foodImageUpdated', callback);
  }
}

export const foodCacheEvents = FoodCacheEventEmitter.getInstance();
