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
  weightGoal: number;
  currentWeight: number;
  bmi: number;
  totalNutrition: NutritionModel;
  dailyStats: AnalysisStats[];
  weeklyStats: AnalysisStats[];
  monthlyStats: AnalysisStats[];
}

export default AnalysisModel;

