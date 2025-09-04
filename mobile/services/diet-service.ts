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
        timestamp: new Date().toISOString(),
      });

      const response = await authInstance.get(`/diet/nutrition?date=${date}`);

      if (response.data.success) {
        return response.data.data.consumedNutrition;
      } else {
        // Return zero nutrition if no data found
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
    } catch (error: any) {
      console.log("❌ Error fetching consumed nutrition:", {
        message: error.message,
        status: error.response?.status || "No response",
        statusText: error.response?.statusText || "No status text",
        url: `/diet/nutrition?date=${date}`,
        responseData: error.response?.data || "No response data",
        hasResponse: !!error.response,
        errorType: error.constructor.name,
        code: error.code,
        fullError: {
          name: error.name,
          message: error.message,
          code: error.code,
          config: error.config
            ? {
                url: error.config.url,
                method: error.config.method,
                headers: error.config.headers,
              }
            : "No config",
        },
      });
      // Return zero nutrition on error
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  }
}

export default DietService.getInstance();
