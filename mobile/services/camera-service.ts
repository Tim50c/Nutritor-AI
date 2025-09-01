import { getAuth } from "firebase/auth";
import app from "@/config/firebase";
import FoodModel from "@/models/food-model";
import ImageUtils from "@/utils/ImageUtils";

export interface CameraRecognitionResult {
  success: boolean;
  data: FoodModel | null;
  foodId?: string;
  message?: string;
}

export interface BarcodeResult {
  success: boolean;
  data: FoodModel | null;
  foodId?: string;
  message?: string;
}

class CameraService {
  private static instance: CameraService;
  private readonly BASE_URL = "https://nutritor-ai.onrender.com";
  private auth = getAuth(app);

  private constructor() {}

  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Get Firebase authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const user = this.auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      console.warn("No authenticated user found");
      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  /**
   * Get headers for API requests with optional authentication
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Recognize food from image using AI
   */
  public async recognizeFood(imageUri: string): Promise<CameraRecognitionResult> {
    try {
      console.log("🖼️ Starting food recognition for:", imageUri);

      // Validate image URI
      if (!ImageUtils.isValidImageUri(imageUri)) {
        throw new Error("Invalid image URI");
      }

      // Process image for optimal upload
      const processedImage = await ImageUtils.processImageForUpload(imageUri);
      
      // Create FormData with processed image
      const formData = ImageUtils.createImageFormData(processedImage.uri);

      // Get auth headers
      const headers = await this.getAuthHeaders();

      // Send request to backend
      const response = await fetch(`${this.BASE_URL}/api/v1/camera/recognize-details`, {
        method: "POST",
        headers,
        body: formData,
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = JSON.parse(responseText);
      console.log("🖼️ Image URL from backend:", result.data?.imageUrl);

      return {
        success: result.success || response.ok,
        data: result.data,
        foodId: result.foodId || result.data?.id,
        message: result.message,
      };
    } catch (error) {
      console.error("❌ Food recognition error:", error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Look up food by barcode
   */
  public async lookupBarcode(barcode: string): Promise<BarcodeResult> {
    try {
      console.log("🔍 Looking up barcode:", barcode);

      const headers = await this.getAuthHeaders();
      headers["Content-Type"] = "application/json";

      const response = await fetch(`${this.BASE_URL}/api/v1/camera/barcode`, {
        method: "POST",
        headers,
        body: JSON.stringify({ barcode }),
      });

      const result = await response.json();

      return {
        success: result.success && !!result.data,
        data: result.data,
        foodId: result.foodId || result.data?.id,
        message: result.message,
      };
    } catch (error) {
      console.error("❌ Barcode lookup error:", error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default CameraService.getInstance();
