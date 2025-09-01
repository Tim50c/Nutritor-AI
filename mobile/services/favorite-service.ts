import { authInstance } from "@/config/api/axios";
import {IFavoriteInput} from "@/interfaces";

class FavoriteService {
  private static instance: FavoriteService;
  private constructor() {}

  public static getInstance(): FavoriteService {
    if (!FavoriteService.instance) {
      FavoriteService.instance = new FavoriteService();
    }
    return FavoriteService.instance;
  }

  public async addFavorite(input: IFavoriteInput): Promise<string[]> {
    try {
      const response = await authInstance.post("/favorites", { foodId: input.foodId });
      return response.data as string[];
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while adding favorite.");
    }
  }

  public async removeFavorite(input: IFavoriteInput): Promise<string[]> {
    try {
      const response = await authInstance.delete(`/favorites/${input.foodId}`);
      return response.data as string[];
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while removing favorite.");
    }
  }

  public async getFavorites(): Promise<string[]> {
    try {
      const response = await authInstance.get("/favorites");
      return response.data as string[];
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while getting favorites.");
    }
  }
}

export default FavoriteService.getInstance();

