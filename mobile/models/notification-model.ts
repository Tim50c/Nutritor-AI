import BaseModel from "./base-model";

interface NotificationModel extends BaseModel {
  title: string;
  body: string;
  type: string;
  read: boolean;
}

export default NotificationModel;

