interface NotificationPreferencesModel {
  mealReminders: {
    enabled: boolean;
    breakfast: {
      enabled: boolean;
      time: { hour: number; minute: number; };
      days: string[];
    };
    lunch: {
      enabled: boolean;
      time: { hour: number; minute: number; };
      days: string[];
    };
    dinner: {
      enabled: boolean;
      time: { hour: number; minute: number; };
      days: string[];
    };
  };
  weeklyProgress: {
    enabled: boolean;
    time: { hour: number; minute: number; };
    day: string;
  };
  goalAchievements: {
    enabled: boolean;
    time: { hour: number; minute: number; };
    days: string[];
  };
}

export default NotificationPreferencesModel;