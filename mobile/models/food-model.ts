import BaseModel from "./base-model";

interface FoodModel extends BaseModel {
  name: string;
  description: string;
  barcode: string;
  imageUrl: string;
  nutrition: any;
  source: string;
  userId: string;
}

export default FoodModel;
