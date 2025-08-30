import BaseModel from "./base-model";

interface DietModel extends BaseModel {
  totalNutrition: any;
  foods: any[];
}

export default DietModel;
