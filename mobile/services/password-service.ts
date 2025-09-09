import { authInstance } from "@/config/api/axios";
import { IChangePasswordInput } from "@/interfaces";

class PasswordService {
  private static instance: PasswordService;
  private constructor() {}

  public static getInstance(): PasswordService {
    if (!PasswordService.instance) {
      PasswordService.instance = new PasswordService();
    }
    return PasswordService.instance;
  }

  public async changePassword(input: IChangePasswordInput): Promise<void> {
    try {
      const response = await authInstance.patch("/password", input);
      
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Password change error:", error);
      
      // Handle specific error responses
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 400) {
        throw new Error("Invalid password. Password must be at least 8 characters long and contain a letter, number, and special character.");
      } else if (error.response?.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      } else {
        throw new Error(error.message || "An error occurred while changing the password.");
      }
    }
  }
}

export default PasswordService.getInstance();

