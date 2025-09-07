import { authInstance } from "@/config/api/axios";
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
      console.error("Error getting diets:", error);
      throw new Error("An error occurred while getting the diets.");
    }
  }

  public async addFoodToTodayDiet(input: IAddDietInput): Promise<DietModel[]> {
    try {
      const response = await authInstance.post(`/diet`, {
        foodId: input.foodId,
      });

      return response.data as DietModel[];
    } catch (error: any) {
      console.error("Error adding food to diet:", error);
      throw new Error("An error occurred while adding food to diet.");
    }
  }

  public async removeFoodFromTodayDiet(
    input: IAddDietInput
  ): Promise<DietModel[]> {
    try {
      const response = await authInstance.delete(`/diet/${input.foodId}`);

      return response.data as DietModel[];
    } catch (error: any) {
      console.error("Error removing food from diet:", error);
      throw new Error("An error occurred while removing food from diet.");
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

      const response = await authInstance.get(url);

      return response.data;
    } catch (error: any) {
      console.log("❌ Error fetching monthly nutrition:", error);
      throw new Error("An error occurred while fetching monthly nutrition.");
    }
  }
}

export default DietService.getInstance();
