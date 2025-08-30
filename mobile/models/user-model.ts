import BaseModel from "@/models/base-model";

interface UserModel extends BaseModel {
  name: string;
  email: string;
  dob: string;
  gender: string;
  height: number;
  weightCurrent: number;
  weightGoal: number;
  targetNutrition: any;
  fcmToken?: string;
  notificationPreferences?: any;
}

export default UserModel;
