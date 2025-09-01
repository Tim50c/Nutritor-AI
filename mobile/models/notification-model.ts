import BaseModel from "./base-model";

interface NotificationModel extends BaseModel {
  title: string;
  body: string;
  type: string;
  read: boolean;
  userId?: string;
}

export default NotificationModel;

