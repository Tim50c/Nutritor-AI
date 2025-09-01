import BaseModel from "./base-model";
import NutritionModel from "@/models/nutrition-model";

interface FoodInDiet {
  foodId: string;
  quantity: number;
  addedAt: Date | string | number;
}

interface DietModel extends BaseModel {
  totalNutrition: NutritionModel;
  foods: FoodInDiet[];
}

export default DietModel;
