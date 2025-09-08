import { router } from "expo-router";
import FoodModel from "@/models/food-model";

class NavigationUtils {
  /**
   * Navigate to food detail screen with proper parameters
   */
  public static navigateToFoodDetail(
    food: FoodModel,
    foodId: string,
    capturedImage?: string,
    source?: string
  ): void {
    const navigationParams: any = {
      id: foodId,
      foodData: JSON.stringify(food),
    };

    // Only pass capturedImage if backend didn't return an imageUrl
    if (!food.imageUrl && capturedImage) {
      navigationParams.capturedImage = capturedImage;
    }

    // Pass source if provided
    if (source) {
      navigationParams.source = source;
    }

    router.push({
      pathname: "/food/[id]" as any,
      params: navigationParams,
    });
  }

  /**
   * Navigate back to previous screen
   */
  public static goBack(): void {
    router.back();
  }

  /**
   * Navigate to specific route
   */
  public static navigate(pathname: string, params?: Record<string, any>): void {
    router.push({
      pathname: pathname as any,
      params,
    });
  }
}

export default NavigationUtils;
