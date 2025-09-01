import BaseModel from "@/models/base-model";
import NutritionModel from "@/models/nutrition-model";
import NotificationPreferencesModel from "@/models/notification-preferences-model";

interface UserModel extends BaseModel {
  firstname?: string;
  lastname?: string;
  email?: string;
  dob?: Date | string | number;
  gender?: string;
  height?: number;
  weightCurrent?: number;
  weightGoal?: number;
  targetNutrition?: NutritionModel;
  fcmToken?: string;
  notificationPreferences?: NotificationPreferencesModel;
}

export default UserModel;
