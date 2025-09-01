import { authInstance } from "@/config/api/axios";
import { IFoodDetailsInput } from "@/interfaces";
import { FoodDetailsModel } from "@/models";

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
      console.log(error);
      throw new Error("An error occurred while getting food details.");
    }
  }
}

export default FoodService.getInstance();

