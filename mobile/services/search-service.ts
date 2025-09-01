import { authInstance } from "@/config/api/axios";
import { ISearchFoodsInput } from "@/interfaces";
import { FoodModel } from "@/models";

class SearchService {
  private static instance: SearchService;
  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public async searchFoods(input: ISearchFoodsInput): Promise<FoodModel[]> {
    try {
      const params = { ...input };
      const response = await authInstance.get("/search", { params });
      return response.data as FoodModel[];
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while searching foods.");
    }
  }
}

export default SearchService.getInstance();

