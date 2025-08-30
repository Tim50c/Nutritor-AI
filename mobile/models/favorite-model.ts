import BaseModel from "./base-model";

interface FavoriteModel extends BaseModel {
  addedAt: Date | string | number;
}

export default FavoriteModel;
