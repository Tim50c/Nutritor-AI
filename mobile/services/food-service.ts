import { authInstance } from "@/config/api/axios";
import { IFoodDetailsInput, IFoodSuggestionsInput } from "@/interfaces";
import { FoodDetailsModel, FoodModel } from "@/models";

class FoodService {
  private static instance: FoodService;
  private constructor() {}

  public static getInstance(): FoodService {
    if (!FoodService.instance) {
      FoodService.instance = new FoodService();
    }
    return FoodService.instance;
  }

  public async getFoodDetails(input: IFoodDetailsInput): Promise<FoodDetailsModel> {
    try {
      const response = await authInstance.get(`/foods/${input.foodId}`);
      return response.data as FoodDetailsModel;
    } catch (error: any) {
      throw new Error("An error occurred while getting food details.");
    }
  }

  public async getFoodSuggestions(input: IFoodSuggestionsInput): Promise<FoodModel[]> {
    try {
      const response = await authInstance.post("/foods/suggestions", {
        targetNutrition: input.targetNutrition,
        consumedNutrition: input.consumedNutrition
      });
      
      const suggestions = response.data.data.suggestions as FoodModel[];
      return suggestions;
    } catch (error: any) {
      throw new Error("An error occurred while getting food suggestions.");
    }
  }
}

export default FoodService.getInstance();

