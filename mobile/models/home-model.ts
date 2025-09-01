import DietModel from "./diet-model";
import NutritionModel from "@/models/nutrition-model";

interface HomeModel {
  totals: NutritionModel;
  diets: DietModel[];
  targetNutrition: NutritionModel;
}

export default HomeModel;

