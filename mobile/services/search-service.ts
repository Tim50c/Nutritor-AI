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

  public async loadFoodsCache(): Promise<{ success: boolean; count?: number; message?: string }> {
    try {
      const response = await authInstance.get("/search/load-cache");
      
      if (response.data && response.data.success) {
        return {
          success: true,
          count: response.data.count,
          message: response.data.message
        };
      } else {
        return { success: false, message: "Failed to load cache" };
      }
    } catch (error: any) {
      console.error("❌ [SearchService] Failed to load foods cache:", error);
      return { success: false, message: "Error loading foods cache" };
    }
  }

  public async searchFoods(input: ISearchFoodsInput): Promise<FoodModel[]> {
    try {
      const params = { ...input };
      
      const response = await authInstance.get("/search", { params });
      
      // Backend returns { success: true, data: foods[] } format
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data as FoodModel[];
      } else {
        return [];
      }
    } catch (error: any) {
      throw new Error("An error occurred while searching foods.");
    }
  }
}

export default SearchService.getInstance();

