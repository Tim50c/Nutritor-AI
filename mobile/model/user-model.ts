import BaseModel from "@/model/base-model";

class UserModel extends BaseModel {
  username: string;
  email: string;
  password?: string; // Optional password field
  avatarUrl?: string; // Optional avatar URL
  bio?: string; // Optional biography field
  isActive: boolean;

  constructor(
    id: string,
    username: string,
    email: string,
    isActive: boolean = true,
    password?: string,
    avatarUrl?: string,
    bio?: string
  ) {
    super(id);
    this.username = username;
    this.email = email;
    this.isActive = isActive;
    this.password = password;
    this.avatarUrl = avatarUrl;
    this.bio = bio;
  }
}