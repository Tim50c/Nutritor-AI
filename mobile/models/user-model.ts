import BaseModel from "@/models/base-model";

interface UserModel extends BaseModel {
  firstname?: string;
  lastname?: string;
  email?: string;
  dob?: Date | string | number;
  gender?: string;
  height?: number;
  weightCurrent?: number;
  weightGoal?: number;
  targetNutrition?: any;
  fcmToken?: string;
  notificationPreferences?: any;
}

export default UserModel;
