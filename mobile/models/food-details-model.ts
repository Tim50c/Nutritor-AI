import BaseModel from "./base-model";

interface FoodDetailsModel extends BaseModel {
  description: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  goal: string;
}

export default FoodDetailsModel;

