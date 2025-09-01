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
};

export default DietService.getInstance();
