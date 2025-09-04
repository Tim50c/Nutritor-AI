import BaseModel from "./base-model";
import NutritionModel from "@/models/nutrition-model";

interface FoodModel extends BaseModel {
  name: string;
  description?: string;
  barcode: string | null;
  imageUrl?: string;
  nutrition: NutritionModel;
  source?: string;
  userId?: string;
  addedAt: Date | string | number;
}

export default FoodModel;
