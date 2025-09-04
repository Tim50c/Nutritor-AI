import { authInstance } from "@/config/api/axios";
import NotificationModel from "@/models/notification-model";
import NotificationPreferencesModel from "@/models/notification-preferences-model";
import {IDeleteNotificationInput, INotificationInput} from "@/interfaces";

class NotificationService {
  private static instance: NotificationService;
  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // GET /notifications
  public async getNotifications(): Promise<NotificationModel[]> {
    try {
      const response = await authInstance.get("/notifications");
      return response.data as NotificationModel[];
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while getting notifications.");
    }
  }

  // POST /notifications/send
  public async sendNotification(input: INotificationInput): Promise<any> {
    try {
      const response = await authInstance.post("/notifications/send", input);
      return response.data;
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while sending notification.");
    }
  }

  // PATCH /notifications/preferences
  public async updatePreferences(preferences: NotificationPreferencesModel): Promise<NotificationPreferencesModel> {
    try {
      console.log("🔄 Sending preferences to backend:", JSON.stringify(preferences, null, 2));
      const response = await authInstance.patch("/notifications/preferences", preferences);
      console.log("✅ Backend response:", response.data);
      return response.data as NotificationPreferencesModel;
    } catch (error: any) {
      console.error("❌ Error updating preferences:", error.response?.data || error.message);
      throw new Error("An error occurred while updating notification preferences.");
    }
  }

  // DELETE /notifications/{id}
  public async deleteOrMarkNotification(input: IDeleteNotificationInput): Promise<any> {
    try {
      const response = await authInstance.delete(`/notifications/${input.id}`);
      return response.data;
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while deleting or marking notification as read.");
    }
  }
}

export default NotificationService.getInstance();

