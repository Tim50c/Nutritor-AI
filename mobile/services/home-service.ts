import { authInstance } from "@/config/api/axios";
import HomeModel from "@/models/home-model";
import {IHomeInput} from "@/interfaces";

class HomeService {
  private static instance: HomeService;
  private constructor() {}

  public static getInstance(): HomeService {
    if (!HomeService.instance) {
      HomeService.instance = new HomeService();
    }
    return HomeService.instance;
  }

  public async getHome(input: IHomeInput): Promise<HomeModel> {
    try {
      const response = await authInstance.get(`/home/${input.date}`);
      return response.data as HomeModel;
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while getting the home data.");
    }
  }
}

export default HomeService.getInstance();
