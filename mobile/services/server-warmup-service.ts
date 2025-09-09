interface WarmupResponse {
  status: string;
  message: string;
}

class ServerWarmupService {
  private static readonly WARMUP_URL = "https://nutritor-ai.onrender.com/";
  private static readonly TIMEOUT_MS = 30000; // 30 seconds timeout
  private static isWarmedUp = false;
  private static warmupPromise: Promise<void> | null = null;

  /**
   * Warm up the server by sending a GET request to the health check endpoint
   * This should be called when the app launches to wake up the server
   */
  static async warmupServer(): Promise<void> {
    // If already warmed up or warming up, return existing promise
    if (this.isWarmedUp) {
      console.log("🚀 [ServerWarmup] Server already warmed up");
      return;
    }

    if (this.warmupPromise) {
      console.log("🚀 [ServerWarmup] Warmup already in progress, waiting...");
      return this.warmupPromise;
    }

    // Create the warmup promise
    this.warmupPromise = this.performWarmup();
    return this.warmupPromise;
  }

  /**
   * Perform the actual warmup request
   */
  private static async performWarmup(): Promise<void> {
    try {
      console.log("🚀 [ServerWarmup] Starting server warmup...");
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(this.WARMUP_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WarmupResponse = await response.json();
      const duration = Date.now() - startTime;

      // Verify the expected response
      if (data.status === "ok" && data.message?.includes("Nutritor-AI backend is running")) {
        this.isWarmedUp = true;
        console.log(`✅ [ServerWarmup] Server warmed up successfully in ${duration}ms`);
        console.log(`✅ [ServerWarmup] Response: ${data.message}`);
      } else {
        console.warn("⚠️ [ServerWarmup] Unexpected response format:", data);
      }
    } catch (error: any) {
      const errorMessage = error.name === "AbortError" 
        ? "Request timed out" 
        : error.message || "Unknown error";
      
      // console.error("❌ [ServerWarmup] Failed to warm up server:", errorMessage);
      
      // Don't throw the error - let the app continue even if warmup fails
      // The actual API calls will handle server startup if needed
    } finally {
      this.warmupPromise = null;
    }
  }

  /**
   * Check if the server has been warmed up
   */
  static isServerWarmedUp(): boolean {
    return this.isWarmedUp;
  }

  /**
   * Reset the warmup state (for testing purposes)
   */
  static resetWarmupState(): void {
    this.isWarmedUp = false;
    this.warmupPromise = null;
  }

  /**
   * Get the warmup URL (for testing purposes)
   */
  static getWarmupUrl(): string {
    return this.WARMUP_URL;
  }
}

export default ServerWarmupService;