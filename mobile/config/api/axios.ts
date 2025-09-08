import { apiDomain } from "@/constants";
import { AuthStore } from "@/stores";
import { auth } from "@/config/firebase";
import axios, { type AxiosInstance } from "axios";

class AxiosService {
  private static authInstance: AxiosInstance;
  private static commonInstance: AxiosInstance;
  private static readonly TIMEOUT = 10000;
  private static readonly LONG_TIMEOUT = 30000; // For longer operations like monthly data

  public static getAuthInstance(): AxiosInstance {
    if (!this.authInstance) {
      this.createAuthInstance();
    }
    return this.authInstance;
  }

  public static getAuthInstanceWithLongTimeout(): AxiosInstance {
    const longTimeoutInstance = axios.create({
      baseURL: apiDomain,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.LONG_TIMEOUT,
    });

    // Add the same interceptors as the regular auth instance
    longTimeoutInstance.interceptors.request.use(async (request) => {
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken(true); // always refresh
          request.headers.Authorization = `Bearer ${token}`;
          console.log("✅ Token added for UID (long timeout):", auth.currentUser.uid);
        } catch (error) {
          console.error("❌ Failed to fetch fresh token (long timeout):", error);
        }
      } else {
        console.warn("⚠️ No current user. Request may fail (long timeout).");
      }
      return request;
    });

    longTimeoutInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error?.config;

        // Handle 401 errors with token refresh
        if (error?.response?.status === 401 && !originalRequest?._retry && auth.currentUser) {
          originalRequest._retry = true;
          
          try {
            const freshToken = await auth.currentUser.getIdToken(true);
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            return longTimeoutInstance(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed (long timeout):", refreshError);
            await AuthStore.removeTokens();
          }
        }
        
        throw error;
      }
    );

    return longTimeoutInstance;
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
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken(true); // always refresh
          request.headers.Authorization = `Bearer ${token}`;
          console.log("✅ Token added for UID:", auth.currentUser.uid);
        } catch (error) {
          console.error("❌ Failed to fetch fresh token:", error);
        }
      } else {
        console.warn("⚠️ No current user. Request may fail.");
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
const authInstanceLongTimeout = AxiosService.getAuthInstanceWithLongTimeout();
const commonInstance = AxiosService.getCommonInstance();

export { authInstance, authInstanceLongTimeout, commonInstance };
export default AxiosService;
