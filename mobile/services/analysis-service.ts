import { authInstance } from "@/config/api/axios";
import { BaseResponse, IAnalysisWeightInput } from "@/interfaces";
import { AnalysisModel } from "@/models";
import DietService from "./diet-service";

class AnalysisService {
  private static instance: AnalysisService;
  private constructor() {}

  public static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
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
        DietService.getMonthlyNutrition().catch(err => {
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
          return await DietService.getMonthlyNutrition();
        default:
          throw new Error(`Unknown tab type: ${tab}`);
      }
    } catch (error: any) {
      console.error(`❌ Error fetching ${tab} nutrition:`, error);
      throw new Error(`An error occurred while getting ${tab} nutrition data.`);
    }
  }
}

export default AnalysisService.getInstance();

