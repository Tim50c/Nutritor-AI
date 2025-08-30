import { apiDomain } from "@/constants";
import { AuthStore } from "@/stores";
import axios, { type AxiosInstance } from "axios";

class AxiosService {
  private static authInstance: AxiosInstance;
  private static commonInstance: AxiosInstance;

  public static getAuthInstance(): AxiosInstance {
    if (!AxiosService.authInstance) {
      AxiosService.createAuthInstance();
    }
    return AxiosService.authInstance;
  }

  public static createAuthInstance() {
    AxiosService.authInstance = axios.create({
      baseURL: apiDomain,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    AxiosService.authInstance.interceptors.request.use((request) => {
      const accessToken = AuthStore.getAccessToken();
      if (accessToken) {
        request.headers.Authorization = `Bearer ${accessToken}`;
      }
      return request;
    });

    AxiosService.authInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error) {
          const originalRequest = error?.config;
          if (error?.response?.status === 401) {
            originalRequest.sent = true;
          } else {
            throw error;
          }
        }
      }
    );
  }

  public static getCommonInstance(): AxiosInstance {
    if (!AxiosService.commonInstance) {
      AxiosService.createCommonInstance();
    }
    return AxiosService.commonInstance;
  }

  public static createCommonInstance() {
    AxiosService.commonInstance = axios.create({
      baseURL: apiDomain,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
  }
}

const authInstance = AxiosService.getAuthInstance();
const commonInstance = AxiosService.getCommonInstance();

export { authInstance, commonInstance };
export default AxiosService;
