import BaseModel from "./base-model";
import NutritionModel from "@/models/nutrition-model";
import FoodModel from "@/models/food-model";

interface DietModel extends BaseModel {
  totalNutrition: NutritionModel;
  foods: FoodModel[];
}

export default DietModel;
