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
import { analyticsEventEmitter, AnalyticsEvent } from "@/utils/analyticsEvents";

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

  // Goal achievement state
  showGoalAchievedModal: boolean;
  setShowGoalAchievedModal: (show: boolean) => void;

  // Actions
  refreshAnalytics: () => Promise<void>;
  refreshNutritionTab: (tab: "daily" | "weekly" | "monthly") => Promise<void>;
  invalidateAnalytics: () => void; // Call this when diet changes
  updateTodayNutritionOptimistically: (nutritionChange: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void; // Optimistic update for immediate feedback

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
  const [showGoalAchievedModal, setShowGoalAchievedModal] = useState(false);

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
  }, []);

  // Optimistic update for today's nutrition - immediate UI feedback
  const updateTodayNutritionOptimistically = useCallback(
    (nutritionChange: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }) => {
      console.log(
        "⚡ [AnalyticsContext] Applying optimistic nutrition update:",
        nutritionChange
      );

      setAnalyticsData((prevData) => {
        if (!prevData) return prevData;

        // Update daily nutrition data if available
        const updatedData = { ...prevData };

        // Update daily nutrition array (find today's entry and update it)
        if (updatedData.dailyNutrition?.data?.dailyNutritionArray) {
          const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

          updatedData.dailyNutrition = {
            ...updatedData.dailyNutrition,
            data: {
              ...updatedData.dailyNutrition.data,
              dailyNutritionArray:
                updatedData.dailyNutrition.data.dailyNutritionArray.map(
                  (day: any) => {
                    if (day.date === today) {
                      return {
                        ...day,
                        totalNutrition: {
                          calories:
                            (day.totalNutrition?.calories || 0) +
                            nutritionChange.calories,
                          protein:
                            (day.totalNutrition?.protein || 0) +
                            nutritionChange.protein,
                          carbs:
                            (day.totalNutrition?.carbs || 0) +
                            nutritionChange.carbs,
                          fat:
                            (day.totalNutrition?.fat || 0) +
                            nutritionChange.fat,
                        },
                      };
                    }
                    return day;
                  }
                ),
            },
          };

          // Also update weekly total if available
          if (updatedData.dailyNutrition.data.weeklyTotal) {
            updatedData.dailyNutrition.data.weeklyTotal = {
              calories:
                (updatedData.dailyNutrition.data.weeklyTotal.calories || 0) +
                nutritionChange.calories,
              protein:
                (updatedData.dailyNutrition.data.weeklyTotal.protein || 0) +
                nutritionChange.protein,
              carbs:
                (updatedData.dailyNutrition.data.weeklyTotal.carbs || 0) +
                nutritionChange.carbs,
              fat:
                (updatedData.dailyNutrition.data.weeklyTotal.fat || 0) +
                nutritionChange.fat,
            };
          }
        }

        return updatedData;
      });

      // Schedule a real refresh after optimistic update for accuracy
      setTimeout(() => {
        console.log("🔄 [AnalyticsContext] Refreshing after optimistic update");
        refreshAnalytics();
      }, 2000); // Allow time for backend to process the change
    },
    [refreshAnalytics]
  );

  // Auto-refresh when user profile loads or when invalidated
  useEffect(() => {
    if (shouldInvalidate && userProfile && !isLoadingProfile) {
      console.log("📊 [AnalyticsContext] Auto-refreshing analytics data...");
      refreshAnalytics();
    }
  }, [shouldInvalidate, userProfile?.id, isLoadingProfile, refreshAnalytics]); // Only depend on user ID, not entire profile

  // Listen to diet change events with immediate optimistic updates
  useEffect(() => {
    const unsubscribe = analyticsEventEmitter.subscribe(
      (event?: AnalyticsEvent) => {
        console.log("📊 [AnalyticsContext] Received analytics event:", event);

        // Handle different event types
        if (event?.type === "food_added" || event?.type === "food_removed") {
          // Apply optimistic update immediately for food changes
          if (event.data?.nutritionChange) {
            updateTodayNutritionOptimistically(event.data.nutritionChange);
          }

          // Clear analytics service cache for fresh data on next request
          AnalysisService.clearCache();
        } else if (event?.type === "weight_goal_achieved") {
          // Handle weight goal achievement
          console.log(
            "🎯 [AnalyticsContext] Weight goal achieved!",
            event.data?.weightGoalAchieved
          );
          setShowGoalAchievedModal(true);

          // Also refresh analytics to update weight data
          setTimeout(() => {
            refreshAnalytics();
          }, 1000);
        } else {
          // For general diet changes, clear cache and refresh immediately
          AnalysisService.clearCache();

          if (userProfile && !isLoadingProfile) {
            console.log(
              "📊 [AnalyticsContext] Triggering immediate analytics refresh"
            );
            // Use a shorter timeout for immediate response
            setTimeout(() => {
              refreshAnalytics();
            }, 100); // Very short delay to batch multiple rapid changes
          } else {
            // Fallback to invalidation if user not ready
            invalidateAnalytics();
          }
        }
      }
    );

    return unsubscribe;
  }, [
    userProfile,
    isLoadingProfile,
    refreshAnalytics,
    invalidateAnalytics,
    updateTodayNutritionOptimistically,
  ]);

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

  // Debug logging - reduce frequency
  useEffect(() => {
    if (loading || error) {
      console.log("📊 [AnalyticsContext] State update:", {
        hasData: !!analyticsData,
        loading,
        error: error ? "Has error" : "No error",
        lastUpdated: lastUpdated?.toISOString(),
        shouldInvalidate,
        userProfileReady: !!userProfile && !isLoadingProfile,
      });
    }
  }, [loading, error]); // Only log when loading or error changes

  const contextValue: AnalyticsContextType = {
    analyticsData,
    loading,
    error,
    lastUpdated,
    showGoalAchievedModal,
    setShowGoalAchievedModal,
    refreshAnalytics,
    refreshNutritionTab,
    invalidateAnalytics,
    updateTodayNutritionOptimistically,
    getAnalysisData,
    getNutritionData,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};
