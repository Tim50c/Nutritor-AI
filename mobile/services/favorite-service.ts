import { authInstance } from "@/config/api/axios";
import {IFavoriteInput} from "@/interfaces";

class FavoriteService {
  private static instance: FavoriteService;
  
  private constructor() {}

  public static getInstance(): FavoriteService {
    if (!this.instance) {
      this.instance = new FavoriteService();
    }
    return this.instance;
  }

  public async addFavorite(input: IFavoriteInput): Promise<string[]> {
    try {
      await authInstance.post("/api/v1/favorites", { foodId: input.foodId });
      // After adding, fetch the updated favorites list
      return this.getFavorites();
    } catch (error: any) {
      console.error("Error adding favorite:", error);
      throw new Error("An error occurred while adding favorite.");
    }
  }

  public async removeFavorite(input: IFavoriteInput): Promise<string[]> {
    try {
      await authInstance.delete(`/api/v1/favorites/${input.foodId}`);
      // After removing, fetch the updated favorites list
      return this.getFavorites();
    } catch (error: any) {
      console.error("Error removing favorite:", error);
      throw new Error("An error occurred while removing favorite.");
    }
  }

  public async getFavorites(): Promise<string[]> {
    try {
      const response = await authInstance.get("/favorites");
      const data = response.data?.data || [];
      // Extract just the food IDs from the favorite objects
      return Array.isArray(data) ? data.map((favorite: any) => favorite.foodId || favorite.id || favorite) : [];
    } catch (error: any) {
      console.error("Error getting favorites:", error);
      return []; // Return empty array instead of throwing
    }
  }
}

export default FavoriteService.getInstance();

