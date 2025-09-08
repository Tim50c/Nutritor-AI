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
      // ⏰ LOG: Time tracking for timezone debugging
      console.log("🏠 [HomeService] getHome called:");
      console.log("  📅 Requested date:", input.date);
      console.log("  🌐 API endpoint: GET /home?date=" + input.date);
      
      const response = await authInstance.get(`/home?date=${input.date}`);
      
      console.log("✅ [HomeService] Home data received successfully");
      console.log("  📊 Response data keys:", Object.keys(response.data?.data || {}));
      
      return response.data as HomeModel;
    } catch (error: any) {
      console.error("❌ [HomeService] Failed to fetch home data:", error.message);
      throw new Error("An error occurred while getting the home data.");
    }
  }
}

export default HomeService.getInstance();
