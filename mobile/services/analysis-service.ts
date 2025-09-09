import { authInstance } from "@/config/api/axios";
import { BaseResponse, IAnalysisWeightInput } from "@/interfaces";
import { AnalysisModel } from "@/models";
import DietService from "./diet-service";

class AnalysisService {
  private static instance: AnalysisService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  
  private constructor() {}

  public static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  // Clear cache when diet changes for immediate refresh
  public clearCache(): void {
    console.log("🗑️ [AnalysisService] Clearing cache for fresh data");
    this.cache.clear();
  }

  // Get cached data if available and fresh
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📦 [AnalysisService] Using cached data for: ${key}`);
      return cached.data;
    }
    return null;
  }

  // Set cached data
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public async getAnalysis(): Promise<BaseResponse<AnalysisModel>> {
    try {
      const response = await authInstance.get("/analysis");
      return response.data as BaseResponse<AnalysisModel>;
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while getting the analysis.");
    }
  }

  public async updateWeight(input: IAnalysisWeightInput): Promise<AnalysisModel> {
    try {
      const response = await authInstance.patch("/analysis/weight", input);
      return response.data as AnalysisModel;
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while updating the weight.");
    }
  }

  // New method to get comprehensive analytics data including nutrition
  public async getComprehensiveAnalytics(): Promise<{
    analysisData: AnalysisModel;
    dailyNutrition: any;
    weeklyNutrition: any;
    monthlyNutrition: any;
  }> {
    try {
      console.log("🔄 Fetching comprehensive analytics data...");

      // Fetch basic analysis data and all nutrition data using diet service
      const [analysisResponse, dailyNutrition, weeklyNutrition, monthlyNutrition] = await Promise.all([
        this.getAnalysis(),
        DietService.getDailyNutrition().catch(err => {
          console.warn("Failed to fetch daily nutrition:", err);
          return null;
        }),
        DietService.getWeeklyNutrition().catch(err => {
          console.warn("Failed to fetch weekly nutrition:", err);
          return null;
        }),
        this.getMonthlyNutritionWithRetry().catch(err => {
          console.warn("Failed to fetch monthly nutrition:", err);
          return null;
        })
      ]);

      console.log("✅ Successfully fetched all analytics data");

      return {
        analysisData: analysisResponse.data,
        dailyNutrition,
        weeklyNutrition,
        monthlyNutrition
      };
    } catch (error: any) {
      console.error("❌ Error fetching comprehensive analytics:", error);
      throw new Error("An error occurred while getting comprehensive analytics.");
    }
  }

  // Helper method to get nutrition data by tab type - ALL using diet service
  public async getNutritionByTab(tab: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    try {
      switch (tab) {
        case 'daily':
          return await DietService.getDailyNutrition();
        case 'weekly':
          return await DietService.getWeeklyNutrition();
        case 'monthly':
          // Add retry logic for monthly data due to potential timeouts
          return await this.getMonthlyNutritionWithRetry();
        default:
          throw new Error(`Unknown tab type: ${tab}`);
      }
    } catch (error: any) {
      console.error(`❌ Error fetching ${tab} nutrition:`, error);
      throw new Error(`An error occurred while getting ${tab} nutrition data.`);
    }
  }

  // Helper method for monthly nutrition with retry logic
  private async getMonthlyNutritionWithRetry(maxRetries: number = 2): Promise<any> {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`📅 Attempting monthly nutrition fetch (attempt ${attempt}/${maxRetries + 1})`);
        return await DietService.getMonthlyNutrition();
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Monthly nutrition attempt ${attempt} failed:`, error.message);
        
        if (attempt <= maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

export default AnalysisService.getInstance();

