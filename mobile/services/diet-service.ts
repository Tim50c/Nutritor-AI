import { authInstance } from "@/config/api/axios";
import { IAddDietInput, IDietsInput } from "@/interfaces";
import { DietModel } from "@/models";

class DietService {
  private static instance: DietService;
  private constructor() {}

  public static getInstance(): DietService {
    if (!DietService.instance) {
      DietService.instance = new DietService();
    }
    return DietService.instance;
  }

  public async getDiets(input: IDietsInput): Promise<DietModel[]> {
    try {
      const response = await authInstance.get(`/diet/${input.date}`);

      return response.data as DietModel[];
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while getting the diets.");
    }
  }

  public async addFoodToTodayDiet(input: IAddDietInput): Promise<DietModel[]> {
    try {
      const response = await authInstance.post(`/diet`, {
        food: input.foodId,
      });

      return response.data as DietModel[];
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while getting the diets.");
    }
  }

  public async removeFoodFromTodayDiet(input: IAddDietInput): Promise<DietModel[]> {
    try {
      const response = await authInstance.delete(`/diet/${input.foodId}`);

      return response.data as DietModel[];
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while getting the diets.");
    }
  }

  public async getConsumedNutrition(date: string): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }> {
    try {
      console.log("🍎 Starting getConsumedNutrition call:", {
        date,
        url: `/diet/nutrition?date=${date}`,
        timestamp: new Date().toISOString()
      });

      const response = await authInstance.get(`/diet/nutrition?date=${date}`);
      
      console.log("🍎 Consumed nutrition API response:", {
        status: response.status,
        success: response.data?.success,
        hasData: !!response.data?.data,
        fullResponse: response.data
      });

      if (response.data.success) {
        const consumedNutrition = response.data.data.consumedNutrition;
        console.log("✅ Successfully fetched consumed nutrition:", {
          consumedNutrition,
          totalFoods: response.data.data.totalFoods,
          foodNames: response.data.data.foodNames
        });
        return consumedNutrition;
      } else {
        console.log("⚠️ API returned success: false, using zero nutrition");
        // Return zero nutrition if no data found
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
    } catch (error: any) {
      console.log("❌ Error fetching consumed nutrition:", {
        message: error.message,
        status: error.response?.status || 'No response',
        statusText: error.response?.statusText || 'No status text',
        url: `/diet/nutrition?date=${date}`,
        responseData: error.response?.data || 'No response data',
        hasResponse: !!error.response,
        errorType: error.constructor.name,
        code: error.code,
        fullError: {
          name: error.name,
          message: error.message,
          code: error.code,
          config: error.config ? {
            url: error.config.url,
            method: error.config.method,
            headers: error.config.headers
          } : 'No config'
        }
      });
      // Return zero nutrition on error
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  }
};

export default DietService.getInstance();
