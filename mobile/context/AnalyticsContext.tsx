import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { AnalysisService } from "@/services";
import { useUser } from "./UserContext";
import { analyticsEventEmitter } from "@/utils/analyticsEvents";

interface AnalyticsData {
  analysisData: any;
  dailyNutrition: any;
  weeklyNutrition: any;
  monthlyNutrition: any;
}

interface AnalyticsContextType {
  // Data state
  analyticsData: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  refreshAnalytics: () => Promise<void>;
  refreshNutritionTab: (tab: "daily" | "weekly" | "monthly") => Promise<void>;
  invalidateAnalytics: () => void; // Call this when diet changes

  // Getters for specific data
  getAnalysisData: () => any;
  getNutritionData: (tab: "daily" | "weekly" | "monthly") => any;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
}) => {
  const { userProfile, isLoadingProfile } = useUser();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [shouldInvalidate, setShouldInvalidate] = useState(true);

  // Keep track of ongoing requests to prevent duplicates
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  // Main function to fetch all analytics data
  const refreshAnalytics = useCallback(async (): Promise<void> => {
    if (!userProfile || isLoadingProfile) {
      console.log(
        "📊 [AnalyticsContext] Skipping refresh - user profile not ready"
      );
      return;
    }

    // If there's already a request in progress, return that promise
    if (refreshPromiseRef.current) {
      console.log(
        "📊 [AnalyticsContext] Refresh already in progress, waiting..."
      );
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("📊 [AnalyticsContext] Starting analytics refresh...");

        const comprehensiveData =
          await AnalysisService.getComprehensiveAnalytics();

        setAnalyticsData(comprehensiveData);
        setLastUpdated(new Date());
        setShouldInvalidate(false);

        console.log(
          "✅ [AnalyticsContext] Analytics refresh completed successfully"
        );
      } catch (err: any) {
        console.error("❌ [AnalyticsContext] Analytics refresh failed:", err);
        setError(err.message || "Failed to fetch analytics data");
      } finally {
        setLoading(false);
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [userProfile, isLoadingProfile]);

  // Function to refresh specific nutrition tab data
  const refreshNutritionTab = useCallback(
    async (tab: "daily" | "weekly" | "monthly"): Promise<void> => {
      if (!userProfile || isLoadingProfile || !analyticsData) {
        console.log(
          `📊 [AnalyticsContext] Skipping ${tab} refresh - not ready`
        );
        return;
      }

      try {
        console.log(
          `📊 [AnalyticsContext] Refreshing ${tab} nutrition data...`
        );

        const newTabData = await AnalysisService.getNutritionByTab(tab);

        setAnalyticsData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            [`${tab}Nutrition`]: newTabData,
          };
        });

        setLastUpdated(new Date());
        console.log(
          `✅ [AnalyticsContext] ${tab} nutrition refreshed successfully`
        );
      } catch (err: any) {
        console.error(
          `❌ [AnalyticsContext] ${tab} nutrition refresh failed:`,
          err
        );
        // Don't set global error for tab-specific failures
      }
    },
    [userProfile, isLoadingProfile, analyticsData]
  );

  // Function to mark data as stale (call when diet changes)
  const invalidateAnalytics = useCallback(() => {
    console.log(
      "🔄 [AnalyticsContext] Analytics data invalidated - will refresh on next access"
    );
    setShouldInvalidate(true);

    // Also immediately refresh if we're currently viewing analytics
    // This ensures real-time updates when users add/remove foods
    if (analyticsData && !loading) {
      console.log(
        "🔄 [AnalyticsContext] Triggering immediate refresh for real-time sync"
      );
      refreshAnalytics();
    }
  }, [analyticsData, loading, refreshAnalytics]);

  // Auto-refresh when user profile loads or when invalidated
  useEffect(() => {
    if (shouldInvalidate && userProfile && !isLoadingProfile) {
      console.log("📊 [AnalyticsContext] Auto-refreshing analytics data...");
      refreshAnalytics();
    }
  }, [shouldInvalidate, userProfile, isLoadingProfile, refreshAnalytics]);

  // Listen to diet change events
  useEffect(() => {
    const unsubscribe = analyticsEventEmitter.subscribe((event) => {
      console.log(
        "📊 [AnalyticsContext] Received analytics event:",
        event?.type || "legacy",
        event?.data || "no data"
      );
      invalidateAnalytics();
    });

    return unsubscribe;
  }, [invalidateAnalytics]);

  // Getter functions
  const getAnalysisData = useCallback(() => {
    return analyticsData?.analysisData || null;
  }, [analyticsData]);

  const getNutritionData = useCallback(
    (tab: "daily" | "weekly" | "monthly") => {
      if (!analyticsData) return null;
      return analyticsData[`${tab}Nutrition`] || null;
    },
    [analyticsData]
  );

  // Debug logging
  useEffect(() => {
    console.log("📊 [AnalyticsContext] State update:", {
      hasData: !!analyticsData,
      loading,
      error: error ? "Has error" : "No error",
      lastUpdated: lastUpdated?.toISOString(),
      shouldInvalidate,
      userProfileReady: !!userProfile && !isLoadingProfile,
    });
  }, [
    analyticsData,
    loading,
    error,
    lastUpdated,
    shouldInvalidate,
    userProfile,
    isLoadingProfile,
  ]);

  const contextValue: AnalyticsContextType = {
    analyticsData,
    loading,
    error,
    lastUpdated,
    refreshAnalytics,
    refreshNutritionTab,
    invalidateAnalytics,
    getAnalysisData,
    getNutritionData,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};
