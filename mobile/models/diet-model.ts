import NutritionModel from "@/models/nutrition-model";
import BaseModel from "./base-model";
import FoodModel from "./food-model";

interface FoodInDiet {
  foodId: string;
  quantity: number;
  addedAt: Date | string | number;
}

interface DietModel extends BaseModel {
  date: Date | string | number;
  totalNutrition: NutritionModel;
  foods: FoodModel[];
}

export default DietModel;
