import { authInstance } from "@/config/api/axios";
import { BaseResponse, IProfileUpdateInput } from "@/interfaces";
import { ProfileModel } from "@/models";

class ProfileService {
  private static instance: ProfileService;
  private constructor() {}

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  public async getProfile(): Promise<BaseResponse<ProfileModel>> {
    try {
      const response = await authInstance.get("/profile");
      return response.data as BaseResponse<ProfileModel>;
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while getting the profile.");
    }
  }

  public async updateProfile(input: IProfileUpdateInput): Promise<ProfileModel> {
    try {
      const response = await authInstance.patch("/profile", input);
      return response.data as ProfileModel;
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while updating the profile.");
    }
  }
}

export default ProfileService.getInstance();

