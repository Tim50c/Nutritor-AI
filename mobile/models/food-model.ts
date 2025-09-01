import BaseModel from "./base-model";
import NutritionModel from "@/models/nutrition-model";

interface FoodModel extends BaseModel {
  name: string;
  description?: string;
  barcode?: string;
  imageUrl?: string;
  nutrition: NutritionModel;
  source?: string;
  userId?: string;
}

export default FoodModel;
