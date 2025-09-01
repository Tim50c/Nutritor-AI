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
      await authInstance.patch("/password", input);
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while changing the password.");
    }
  }
}

export default PasswordService.getInstance();

