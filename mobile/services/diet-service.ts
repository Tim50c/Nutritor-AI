import { authInstance, authInstanceLongTimeout } from "@/config/api/axios";
import { BaseResponse, IAddDietInput, IDietsInput } from "@/interfaces";
import { DietModel } from "@/models";

class DietService {
  private static instance: DietService;

  private constructor() {}

  public static getInstance(): DietService {
    if (!this.instance) {
      this.instance = new DietService();
    }
    return this.instance;
  }

  public async getDiets(input: IDietsInput): Promise<BaseResponse<DietModel>> {
    try {
      const response = await authInstance.get(`/diet?date=${input.date}`);
      return response.data as BaseResponse<DietModel>;
    } catch (error: any) {
      // Log error silently for debugging, don't show to user
      console.log("ℹ️ [DietService] Get diets operation failed:", error?.response?.status || 'Network error');
      throw error; // Re-throw to let caller handle appropriately
    }
  }

  public async addFoodToTodayDiet(input: IAddDietInput): Promise<DietModel[]> {
    try {
      // ⏰ LOG: Time tracking for timezone debugging
      const now = new Date();
      const isoString = now.toISOString();
      const localString = now.toString();
      
      // Use local date components to avoid timezone issues
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const dateOnly = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      console.log("🍽️ [DietService] addFoodToTodayDiet called:");
      console.log("  ⏰ Current time (ISO):", isoString);
      console.log("  ⏰ Current time (Local):", localString);
      console.log("  📅 Local components - Year:", year, "Month:", month, "Day:", day);
      console.log("  📅 Today's date (for backend):", dateOnly);
      console.log("  🥘 Food ID:", input.foodId);
      console.log("  🌐 API endpoint: POST /diet");
      
      const response = await authInstance.post(`/diet`, {
        foodId: input.foodId,
      });

      console.log("✅ [DietService] Food added to diet successfully");
      
      return response.data as DietModel[];
    } catch (error: any) {
      // Log error silently for debugging, don't show to user
      console.log("ℹ️ [DietService] Add food operation failed:", error?.response?.status || 'Network error');
      throw error; // Re-throw to let caller handle appropriately
    }
  }

  public async removeFoodFromTodayDiet(
    input: IAddDietInput & { addedAt?: string; index?: number }
  ): Promise<DietModel[]> {
    try {
      // Build query parameters for specific food instance removal
      const params = new URLSearchParams();
      if (input.addedAt) {
        params.append('addedAt', input.addedAt);
      }
      if (input.index !== undefined) {
        params.append('index', input.index.toString());
      }
      
      const queryString = params.toString();
      const url = `/diet/${input.foodId}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`🗑️ [DietService] Removing specific food instance:`, {
        foodId: input.foodId,
        addedAt: input.addedAt,
        index: input.index,
        url
      });

      const response = await authInstance.delete(url);

      return response.data as DietModel[];
    } catch (error: any) {
      // Log error silently for debugging, don't show to user
      console.log("ℹ️ [DietService] Remove food operation failed:", error?.response?.status || 'Network error');
      throw error; // Re-throw to let caller handle appropriately
    }
  }

  public async getDailyNutrition(startDate?: string): Promise<{
    success: boolean;
    data: {
      weekPeriod: string;
      dailyNutritionArray: Array<{
        date: string;
        totalNutrition: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
      }>;
      weeklyTotal: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    };
  }> {
    try {
      console.log("📊 Starting getDailyNutrition call:", {
        startDate,
        url: `/diet/nutrition/daily${startDate ? `?startDate=${startDate}` : ''}`,
        timestamp: new Date().toISOString(),
      });

      const response = await authInstance.get(
        `/diet/nutrition/daily${startDate ? `?startDate=${startDate}` : ''}`
      );

      return response.data;
    } catch (error: any) {
      console.log("❌ Error fetching daily nutrition:", error);
      throw new Error("An error occurred while fetching daily nutrition.");
    }
  }

  public async getWeeklyNutrition(startDate?: string, endDate?: string): Promise<{
    success: boolean;
    data: {
      weekPeriod: string;
      weeklyNutritionArray: Array<{
        week: string;
        totalNutrition: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
      }>;
      monthlyTotal: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    };
  }> {
    try {
      console.log("📈 Starting getWeeklyNutrition call:", {
        startDate,
        endDate,
        timestamp: new Date().toISOString(),
      });

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const queryString = params.toString();
      const url = `/diet/nutrition/weekly${queryString ? `?${queryString}` : ''}`;

      const response = await authInstance.get(url);

      return response.data;
    } catch (error: any) {
      console.log("❌ Error fetching weekly nutrition:", error);
      throw new Error("An error occurred while fetching weekly nutrition.");
    }
  }

  public async getMonthlyNutrition(month?: string, year?: string): Promise<{
    success: boolean;
    data: {
      monthPeriod: string;
      monthlyNutritionArray: Array<{
        month: string;
        totalNutrition: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
      }>;
      yearlyTotal: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    };
  }> {
    try {
      console.log("📅 Starting getMonthlyNutrition call:", {
        month,
        year,
        timestamp: new Date().toISOString(),
      });

      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      
      const queryString = params.toString();
      const url = `/diet/nutrition/monthly${queryString ? `?${queryString}` : ''}`;

      // Use long timeout instance for monthly data as it can take longer to process
      const response = await authInstanceLongTimeout.get(url);

      return response.data;
    } catch (error: any) {
      console.log("❌ Error fetching monthly nutrition:", error);
      throw new Error("An error occurred while fetching monthly nutrition.");
    }
  }
}

export default DietService.getInstance();
