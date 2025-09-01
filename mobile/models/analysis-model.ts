import BaseModel from "./base-model";
import NutritionModel from "@/models/nutrition-model";

interface AnalysisStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AnalysisModel extends BaseModel {
  goalWeight: number;
  currentWeight: number;
  nutritionConsumed: NutritionModel;
  bmi: number;
  dailyStats: AnalysisStats[];
  weeklyStats: AnalysisStats[];
  monthlyStats: AnalysisStats[];
}

export default AnalysisModel;

