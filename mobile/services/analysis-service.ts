import { authInstance } from "@/config/api/axios";
import { IAnalysisWeightInput } from "@/interfaces";
import { AnalysisModel } from "@/models";

class AnalysisService {
  private static instance: AnalysisService;
  private constructor() {}

  public static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  public async getAnalysis(): Promise<AnalysisModel> {
    try {
      const response = await authInstance.get("/analysis");
      return response.data as AnalysisModel;
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while getting the analysis.");
    }
  }

  public async updateWeight(input: IAnalysisWeightInput): Promise<AnalysisModel> {
    try {
      const response = await authInstance.patch("/analysis/weight", input);
      return response.data as AnalysisModel;
    } catch (error: any) {
      console.log(error);
      throw new Error("An error occurred while updating the weight.");
    }
  }
}

export default AnalysisService.getInstance();

