import { apiDomain } from "@/constants";
import { AuthStore } from "@/stores";
import { auth } from "@/config/firebase";
import axios, { type AxiosInstance } from "axios";

class AxiosService {
  private static authInstance: AxiosInstance;
  private static commonInstance: AxiosInstance;
  private static readonly TIMEOUT = 10000;

  public static getAuthInstance(): AxiosInstance {
    if (!this.authInstance) {
      this.createAuthInstance();
    }
    return this.authInstance;
  }

  private static createAuthInstance(): void {
    this.authInstance = axios.create({
      baseURL: apiDomain,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.TIMEOUT,
    });

    AxiosService.authInstance.interceptors.request.use(async (request) => {
      let accessToken = await AuthStore.getAccessToken();
      
      // Get fresh token from Firebase if none exists
      if (!accessToken && auth.currentUser) {
        try {
          accessToken = await auth.currentUser.getIdToken(true);
          await AuthStore.storeAccessToken(accessToken);
        } catch (error) {
          console.error("Failed to get fresh token:", error);
        }
      }
      
      if (accessToken) {
        request.headers.Authorization = `Bearer ${accessToken}`;
      }
      return request;
    });

    AxiosService.authInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config;

        // Handle 401 errors with token refresh
        if (error?.response?.status === 401 && !originalRequest?._retry && auth.currentUser) {
          originalRequest._retry = true;
          
          try {
            // Get fresh token from Firebase
            const freshToken = await auth.currentUser.getIdToken(true);
            await AuthStore.storeAccessToken(freshToken);
            
            // Update the authorization header for retry
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            
            return AxiosService.authInstance(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            await AuthStore.removeTokens();
          }
        }
        
        throw error;
      }
    );
  }

  public static getCommonInstance(): AxiosInstance {
    if (!this.commonInstance) {
      this.createCommonInstance();
    }
    return this.commonInstance;
  }

  private static createCommonInstance(): void {
    this.commonInstance = axios.create({
      baseURL: apiDomain,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.TIMEOUT,
    });
  }
}

const authInstance = AxiosService.getAuthInstance();
const commonInstance = AxiosService.getCommonInstance();

export { authInstance, commonInstance };
export default AxiosService;
