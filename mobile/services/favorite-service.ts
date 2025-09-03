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
      console.log("🚀 Adding favorite for foodId:", input.foodId);
      await authInstance.post("/favorites", { foodId: input.foodId });
      // After adding, fetch the updated favorites list
      return this.getFavorites();
    } catch (error: any) {
      console.error("❌ Error adding favorite:", error);
      throw new Error("An error occurred while adding favorite.");
    }
  }

  public async removeFavorite(input: IFavoriteInput): Promise<string[]> {
    try {
      console.log("🗑️ Removing favorite for foodId:", input.foodId);
      await authInstance.delete(`/favorites/${input.foodId}`);
      // After removing, fetch the updated favorites list
      return this.getFavorites();
    } catch (error: any) {
      console.error("❌ Error removing favorite:", error);
      throw new Error("An error occurred while removing favorite.");
    }
  }

  public async getFavorites(): Promise<string[]> {
    try {
      console.log("📋 Fetching favorites from API...");
      const response = await authInstance.get("/favorites");
      console.log("✅ Favorites API response:", response.data);
      const data = response.data?.data || [];
      // Extract just the food IDs from the favorite objects
      // Backend Favorite model uses 'id' field for foodId
      const favoriteIds = Array.isArray(data) ? data.map((favorite: any) => favorite.id || favorite.foodId || favorite) : [];
      console.log("📋 Extracted favorite IDs:", favoriteIds);
      return favoriteIds;
    } catch (error: any) {
      console.error("❌ Error getting favorites:", error);
      return []; // Return empty array instead of throwing
    }
  }

  public async getFavoriteFoodsWithDetails(): Promise<any[]> {
    try {
      console.log("🍽️ Fetching favorite foods with complete details...");
      const favoriteIds = await this.getFavorites();
      
      if (favoriteIds.length === 0) {
        console.log("📋 No favorite IDs found");
        return [];
      }

      // For each favorite ID, get the complete food details
      const favoriteFoodsDetails = [];
      for (const foodId of favoriteIds) {
        try {
          console.log(`🔍 Fetching details for favorite food: ${foodId}`);
          const response = await authInstance.get(`/foods/${foodId}`);
          console.log(`📋 Raw response for ${foodId}:`, response.data);
          
          // The backend returns { success: true, data: foodObject }
          const foodData = response.data?.data;
          
          if (foodData) {
            // Map the food data to our DietFood format
            const mappedFood = {
              id: foodData.id || foodId,
              name: foodData.name || "Unknown Food",
              image: foodData.imageUrl ? { uri: foodData.imageUrl } : null,
              calories: foodData.nutrition?.cal || 0,
              carbs: foodData.nutrition?.carbs || 0,
              protein: foodData.nutrition?.protein || 0,
              fat: foodData.nutrition?.fat || 0,
              description: foodData.description || "",
            };
            favoriteFoodsDetails.push(mappedFood);
            console.log(`✅ Added favorite food: ${mappedFood.name} (${mappedFood.calories} cal)`);
          } else {
            console.log(`⚠️ No food data found for ${foodId}`);
          }
        } catch (error) {
          console.error(`❌ Error fetching details for food ${foodId}:`, error);
        }
      }
      
      console.log(`🎉 Total favorite foods fetched: ${favoriteFoodsDetails.length}`);
      return favoriteFoodsDetails;
    } catch (error: any) {
      console.error("❌ Error getting favorite foods with details:", error);
      return [];
    }
  }
}

export default FavoriteService.getInstance();

