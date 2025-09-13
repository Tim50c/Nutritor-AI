import { apiDomain } from "@/constants";
import { AuthStore } from "@/stores";
import { auth } from "@/config/firebase";
import axios, { type AxiosInstance } from "axios";

class AxiosService {
  private static authInstance: AxiosInstance;
  private static commonInstance: AxiosInstance;
  private static readonly TIMEOUT = 10000;
  private static readonly LONG_TIMEOUT = 30000; // For longer operations like monthly data
  
  // Token caching to prevent quota exhaustion
  private static tokenCache: { token: string | null; expiry: number } = { token: null, expiry: 0 };
  private static readonly TOKEN_BUFFER_TIME = 5 * 60 * 1000; // 5 minutes before expiry

  private static async getCachedToken(): Promise<string | null> {
    if (!auth.currentUser) return null;

    const now = Date.now();
    
    // Return cached token if still valid (with buffer time)
    if (this.tokenCache.token && now < this.tokenCache.expiry - this.TOKEN_BUFFER_TIME) {
      return this.tokenCache.token;
    }

    try {
      // Get fresh token only when needed
      const token = await auth.currentUser.getIdToken(false); // Don't force refresh unless necessary
      
      // Cache the token with 1-hour expiry (Firebase tokens are valid for 1 hour)
      this.tokenCache = {
        token,
        expiry: now + (60 * 60 * 1000), // 1 hour
      };
      
      return token;
    } catch (error) {
      console.error("❌ Failed to get cached token:", error);
      // Clear cache on error
      this.tokenCache = { token: null, expiry: 0 };
      return null;
    }
  }

  public static clearTokenCache(): void {
    this.tokenCache = { token: null, expiry: 0 };
  }

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
          const token = await this.getCachedToken();
          if (token) {
            request.headers.Authorization = `Bearer ${token}`;
            console.log("✅ Cached token added for UID (long timeout):", auth.currentUser.uid);
          }
        } catch (error) {
          console.error("❌ Failed to get cached token (long timeout):", error);
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
            // Clear cache and force refresh on 401
            this.clearTokenCache();
            const freshToken = await auth.currentUser.getIdToken(true);
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            
            // Update cache with fresh token
            const now = Date.now();
            this.tokenCache = {
              token: freshToken,
              expiry: now + (60 * 60 * 1000), // 1 hour
            };
            
            return longTimeoutInstance(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed (long timeout):", refreshError);
            this.clearTokenCache();
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
          const token = await this.getCachedToken();
          if (token) {
            request.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("❌ Failed to get cached token:", error);
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
            // Clear cache and force refresh on 401
            this.clearTokenCache();
            const freshToken = await auth.currentUser.getIdToken(true);
            await AuthStore.storeAccessToken(freshToken);
            
            // Update cache with fresh token
            const now = Date.now();
            this.tokenCache = {
              token: freshToken,
              expiry: now + (60 * 60 * 1000), // 1 hour
            };
            
            // Update the authorization header for retry
            originalRequest.headers.Authorization = `Bearer ${freshToken}`;
            
            return AxiosService.authInstance(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            this.clearTokenCache();
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
