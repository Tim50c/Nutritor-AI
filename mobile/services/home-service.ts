import { authInstance } from "@/config/api/axios";
import HomeModel from "@/models/home-model";
import { IHomeInput } from "@/interfaces";

class HomeService {
  private static instance: HomeService;
  
  private constructor() {}

  public static getInstance(): HomeService {
    if (!this.instance) {
      this.instance = new HomeService();
    }
    return this.instance;
  }

  public async getHome(input: IHomeInput): Promise<HomeModel> {
    try {
      const response = await authInstance.get(`/api/v1/home?date=${input.date}`);
      return response.data as HomeModel;
    } catch (error: any) {
      console.error("Failed to fetch home data:", error.message);
      throw new Error("An error occurred while getting the home data.");
    }
  }
}

export default HomeService.getInstance();
