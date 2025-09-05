export interface TimePreference {
  hour: number;
  minute: number;
}

export interface MealSetting {
  enabled: boolean;
  time: TimePreference;
  days: string[];
}

export interface MealReminders {
  enabled: boolean;
  breakfast: MealSetting;
  lunch: MealSetting;
  dinner: MealSetting;
}

export interface WeeklyProgress {
  enabled: boolean;
  time: TimePreference;
  day: string;
}

export interface GoalAchievements {
  enabled: boolean;
  time: TimePreference;
  days: string[];
}

export interface NotificationPreferencesModel {
  mealReminders: MealReminders;
  weeklyProgress: WeeklyProgress;
  goalAchievements: GoalAchievements;
}

export default NotificationPreferencesModel;