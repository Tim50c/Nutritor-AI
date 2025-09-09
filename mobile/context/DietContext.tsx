import { useUser } from "@/context/UserContext";
import { IFoodSuggestionsInput, IHomeInput } from "@/interfaces";
import { FoodModel } from "@/models";
import DietService from "@/services/diet-service";
import FavoriteService from "@/services/favorite-service";
import FoodService from "@/services/food-service";
import HomeService from "@/services/home-service";
import { analyticsEventEmitter } from "@/utils/analyticsEvents";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type DietFood = {
  id: string;
  name: string;
  image: any;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  description: string;
  addedAt?: string; // ISO timestamp when food was added to diet
  dietIndex?: number; // Index position in the diet array for precise removal
};

export type DietSummary = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

interface DietContextType {
  // Home screen state (always today)
  homeDate: Date;
  homeSummary: DietSummary;
  homeFoods: DietFood[];

  // Diet screen state (user-selectable date)
  dietDate: Date;
  dietSummary: DietSummary;
  dietFoods: DietFood[];

  // Shared states
  suggestedFoods: DietFood[];
  favoriteFoodIds: string[];
  favoriteFoods: DietFood[];
  toggleFavorite: (foodId: string, food?: DietFood) => Promise<void>;
  isFavorite: (foodId: string) => boolean;
  getFavoriteFoods: () => DietFood[];
  fetchFavoriteFoods: () => Promise<void>;
  targetNutrition: DietSummary;
  loading: boolean; // Initial data loading state
  refreshing: boolean; // Background refresh state
  syncing: boolean; // Sync operations state

  // Functions
  refreshSuggestions: () => Promise<void>;
  refreshHomeData: (forceRefresh?: boolean) => Promise<void>;
  refreshDietData: (date: Date, forceRefresh?: boolean) => Promise<void>;
  goToToday: () => void;
  addFoodToTodayDiet: (
    food: DietFood,
    onAlert?: (
      title: string,
      message: string,
      type: "success" | "error" | "info"
    ) => void
  ) => Promise<void>;
  removeFoodFromTodayDiet: (
    foodId: string,
    foodInstance?: { addedAt?: string; index?: number },
    onAlert?: (
      title: string,
      message: string,
      type: "success" | "error" | "info"
    ) => void
  ) => Promise<void>;

  // Diet screen specific functions
  setDietDate: (date: Date) => void;
  addFoodToDietDate: (food: DietFood, date: Date) => Promise<void>;
  removeFoodFromDietDate: (
    foodId: string,
    date: Date,
    foodInstance?: { addedAt?: string; index?: number }
  ) => Promise<void>;
}

const DietContext = createContext<DietContextType | undefined>(undefined);

export function useDietContext() {
  const ctx = useContext(DietContext);
  if (!ctx) throw new Error("useDietContext must be used within DietProvider");
  return ctx;
}

const initialSummary = { calories: 0, carbs: 0, protein: 0, fat: 0 };

export function DietProvider({ children }: { children: ReactNode }) {
  const { userProfile, isLoadingProfile } = useUser();

  // Home screen state (always today)
  const [homeDate] = useState<Date>(new Date());
  const [homeSummary, setHomeSummary] = useState<DietSummary>(initialSummary);
  const [homeFoods, setHomeFoods] = useState<DietFood[]>([]);

  // Diet screen state (user-selectable date)
  const [dietDate, setDietDate] = useState<Date>(new Date());
  const [dietSummary, setDietSummary] = useState<DietSummary>(initialSummary);
  const [dietFoods, setDietFoods] = useState<DietFood[]>([]);

  // Shared states
  const [suggestedFoods, setSuggestedFoods] = useState<DietFood[]>([]);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<string[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<DietFood[]>([]);
  const [targetNutrition, setTargetNutrition] =
    useState<DietSummary>(initialSummary);
  const [loading, setLoading] = useState<boolean>(true); // Initial data loading
  const [refreshing, setRefreshing] = useState<boolean>(false); // Background refresh

  // Track recent additions to prevent rapid duplicates
  const recentAdditionsRef = useRef<Map<string, number>>(new Map());
  const [syncing, setSyncing] = useState<boolean>(false); // Sync operations

  // Cache system to improve performance
  const [dataCache, setDataCache] = useState<Map<string, any>>(new Map());
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Helper function to format date safely (timezone-aware)
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchFoodSuggestions = async (
    consumedNutrition: DietSummary,
    targetNutrition: DietSummary
  ) => {
    try {
      if (targetNutrition.calories <= 0) return;

      const suggestionsInput: IFoodSuggestionsInput = {
        targetNutrition,
        consumedNutrition,
      };

      const suggestionsData =
        await FoodService.getFoodSuggestions(suggestionsInput);

      const mappedSuggestions: DietFood[] = suggestionsData.map(
        (food: FoodModel) => ({
          id: food.id,
          name: food.name,
          image: food.imageUrl ? { uri: food.imageUrl } : null,
          calories: food.nutrition.cal,
          carbs: food.nutrition.carbs,
          protein: food.nutrition.protein,
          fat: food.nutrition.fat,
          description: food.description || "",
        })
      );

      console.log("✅ Food suggestions fetched:", mappedSuggestions.length);
      setSuggestedFoods(mappedSuggestions);
    } catch (error) {
      console.error("❌ Error fetching food suggestions:", error);
      setSuggestedFoods([]);
    }
  };

  const refreshSuggestions = useCallback(
    () => fetchFoodSuggestions(homeSummary, targetNutrition),
    [homeSummary, targetNutrition]
  );

  const refreshHomeData = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!userProfile) return;

      const dateString = formatDateForAPI(homeDate);
      const cacheKey = `home_${dateString}`;
      const now = new Date();
      const CACHE_DURATION = 30000; // 30 seconds

      // Use cached data if available and fresh
      if (!forceRefresh && dataCache.has(cacheKey) && lastFetchTime) {
        const timeDiff = now.getTime() - lastFetchTime.getTime();
        if (timeDiff < CACHE_DURATION) {
          console.log(
            "🏠 [DietContext] Using cached home data for date:",
            dateString
          );
          const cachedData = dataCache.get(cacheKey);
          setHomeSummary(cachedData.summary);
          setHomeFoods(cachedData.foods);
          setTargetNutrition(cachedData.targetNutrition);
          setLoading(false);
          return;
        }
      }

      // Determine appropriate loading state
      const hasExistingData = homeFoods.length > 0 || homeSummary.calories > 0;
      if (hasExistingData) {
        setRefreshing(true); // Background refresh
      } else {
        setLoading(true); // Initial load
      }

      try {
        console.log(
          "🏠 [DietContext] refreshHomeData - fetching for date:",
          dateString
        );

        const input: IHomeInput = { date: dateString };
        const homeData = await HomeService.getHome(input);
        const actualData = (homeData as any).data;

        const consumedNutrition = {
          calories: actualData?.consumpedNutrition?.cal || 0,
          carbs: actualData?.consumpedNutrition?.carbs || 0,
          protein: actualData?.consumpedNutrition?.protein || 0,
          fat: actualData?.consumpedNutrition?.fat || 0,
        };
        setHomeSummary(consumedNutrition);

        const allFoods: DietFood[] = (actualData?.diets[0]?.foods || []).map(
          (food: any, index: number) => ({
            id: food.id,
            name: food.name || "Unknown Food",
            image: food.imageUrl ? { uri: food.imageUrl } : null,
            calories: food.nutrition?.cal || 0,
            carbs: food.nutrition?.carbs || 0,
            protein: food.nutrition?.protein || 0,
            fat: food.nutrition?.fat || 0,
            description: food.description || "",
            addedAt:
              typeof food.addedAt === "string" ? food.addedAt : undefined, // Ensure addedAt is a string or undefined
            dietIndex: index, // Include array index for specific removal
          })
        );
        setHomeFoods(allFoods);

        // Update target nutrition
        const fallbackTarget = {
          calories: userProfile.targetNutrition?.cal || 2000,
          carbs: userProfile.targetNutrition?.carbs || 250,
          protein: userProfile.targetNutrition?.protein || 150,
          fat: userProfile.targetNutrition?.fat || 67,
        };

        const newTarget = {
          calories:
            actualData?.targetNutrition?.calories ?? fallbackTarget.calories,
          carbs: actualData?.targetNutrition?.carbs ?? fallbackTarget.carbs,
          protein:
            actualData?.targetNutrition?.protein ?? fallbackTarget.protein,
          fat: actualData?.targetNutrition?.fat ?? fallbackTarget.fat,
        };
        setTargetNutrition(newTarget);

        // Cache the fetched data for performance
        setDataCache(
          (prev) =>
            new Map(
              prev.set(cacheKey, {
                summary: consumedNutrition,
                foods: allFoods,
                targetNutrition: newTarget,
              })
            )
        );
        setLastFetchTime(now);

        await fetchFoodSuggestions(consumedNutrition, newTarget);

        // Notify analytics system of data changes
        console.log(
          "📊 [DietContext] Home data refreshed, invalidating analytics"
        );
        analyticsEventEmitter.emit();
      } catch (error) {
        console.error("❌ [DietContext] Failed to refresh home data:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      homeDate,
      userProfile,
      targetNutrition,
      dataCache,
      lastFetchTime,
      homeFoods.length,
      homeSummary.calories,
    ]
  );

  const refreshDietData = useCallback(
    async (date: Date, forceRefresh: boolean = false) => {
      if (!userProfile) return;

      const dateString = formatDateForAPI(date);
      const cacheKey = `diet_${dateString}`;
      const now = new Date();
      const CACHE_DURATION = 30000; // 30 seconds

      // Use cached data if available and fresh
      if (!forceRefresh && dataCache.has(cacheKey) && lastFetchTime) {
        const timeDiff = now.getTime() - lastFetchTime.getTime();
        if (timeDiff < CACHE_DURATION) {
          console.log(
            "🍽️ [DietContext] Using cached diet data for date:",
            dateString
          );
          const cachedData = dataCache.get(cacheKey);
          setDietSummary(cachedData.summary);
          setDietFoods(cachedData.foods);
          return;
        }
      }

      try {
        console.log(
          "🍽️ [DietContext] refreshDietData - fetching for date:",
          dateString
        );

        const input: IHomeInput = { date: dateString };
        const homeData = await HomeService.getHome(input);
        const actualData = (homeData as any).data;

        const consumedNutrition = {
          calories: actualData?.consumpedNutrition?.cal || 0,
          carbs: actualData?.consumpedNutrition?.carbs || 0,
          protein: actualData?.consumpedNutrition?.protein || 0,
          fat: actualData?.consumpedNutrition?.fat || 0,
        };
        setDietSummary(consumedNutrition);

        const allFoods: DietFood[] = (actualData?.diets[0]?.foods || []).map(
          (food: any, index: number) => ({
            id: food.id,
            name: food.name || "Unknown Food",
            image: food.imageUrl ? { uri: food.imageUrl } : null,
            calories: food.nutrition?.cal || 0,
            carbs: food.nutrition?.carbs || 0,
            protein: food.nutrition?.protein || 0,
            fat: food.nutrition?.fat || 0,
            description: food.description || "",
            addedAt: food.addedAt, // Include timestamp for specific removal
            dietIndex: index, // Include array index for specific removal
          })
        );
        setDietFoods(allFoods);

        // Cache the fetched data for performance
        setDataCache(
          (prev) =>
            new Map(
              prev.set(cacheKey, {
                summary: consumedNutrition,
                foods: allFoods,
              })
            )
        );
        setLastFetchTime(now);
      } catch (error) {
        console.error("❌ [DietContext] Failed to refresh diet data:", error);
      }
    },
    [userProfile, dataCache, lastFetchTime]
  );

  // Add food to today's diet with immediate UI update and background sync
  const addFoodToTodayDiet = useCallback(
    async (
      food: DietFood,
      onAlert?: (
        title: string,
        message: string,
        type: "success" | "error" | "info"
      ) => void
    ) => {
      console.log("🍽️ [DietContext] Adding food to today's diet:", food.name);

      // Prevent rapid duplicate additions (within 2 seconds)
      const now = Date.now();
      const recentTime = recentAdditionsRef.current.get(food.id);
      if (recentTime && now - recentTime < 2000) {
        console.log(
          "⚠️ [DietContext] Preventing duplicate addition within 2 seconds:",
          food.name
        );
        if (onAlert) {
          onAlert(
            "Already Added",
            `${food.name} was just added to your diet.`,
            "info"
          );
        }
        return;
      }

      // Track this addition
      recentAdditionsRef.current.set(food.id, now);

      setSyncing(true);

      try {
        // IMMEDIATE UI UPDATES - All synchronous for instant feedback

        // Create enhanced food object with timestamp for targeting
        const enhancedFood: DietFood = {
          ...food,
          addedAt: new Date().toISOString(), // Add timestamp for precise removal targeting
        };

        // 1. Update foods list immediately - Allow multiple instances of same food
        setHomeFoods((prevFoods: DietFood[]) => {
          console.log(
            "🍽️ [DietContext] Adding food to home foods list:",
            enhancedFood.name
          );
          return [...prevFoods, enhancedFood];
        });

        // 2. Update nutrition summary immediately
        setHomeSummary((prevSummary: DietSummary) => ({
          calories: prevSummary.calories + (food.calories || 0),
          carbs: prevSummary.carbs + (food.carbs || 0),
          protein: prevSummary.protein + (food.protein || 0),
          fat: prevSummary.fat + (food.fat || 0),
        }));

        // 3. If diet screen is viewing today's date, sync diet state too
        const today = new Date();
        const isViewingToday = dietDate.toDateString() === today.toDateString();
        if (isViewingToday) {
          console.log(
            "📅 [DietContext] Syncing diet state with today's addition"
          );
          setDietFoods((prevFoods: DietFood[]) => {
            console.log(
              "🍽️ [DietContext] Adding food to diet foods list:",
              enhancedFood.name
            );
            return [...prevFoods, enhancedFood];
          });

          setDietSummary((prevSummary: DietSummary) => ({
            calories: prevSummary.calories + (food.calories || 0),
            carbs: prevSummary.carbs + (food.carbs || 0),
            protein: prevSummary.protein + (food.protein || 0),
            fat: prevSummary.fat + (food.fat || 0),
          }));
        }

        // Show success alert if callback is provided
        if (onAlert) {
          onAlert(
            "Success!",
            `${food.name} has been added to your diet successfully.`,
            "success"
          );
        }

        // BACKGROUND TASKS - Call the API to persist changes
        try {
          console.log(
            "🌐 [DietContext] Calling backend API to add food:",
            food.id
          );
          await DietService.addFoodToTodayDiet({ foodId: food.id });
          console.log("✅ [DietContext] Food added to backend successfully");

          // Only clear cache on successful API call to prevent duplicates
          // This ensures the next natural refresh will get fresh data
          const dateString = formatDateForAPI(homeDate);
          const cacheKey = `home_${dateString}`;
          setDataCache((prev) => {
            const newCache = new Map(prev);
            newCache.delete(cacheKey);
            return newCache;
          });

          // Also clear diet cache if viewing today
          if (isViewingToday) {
            const dietCacheKey = `diet_${dateString}`;
            setDataCache((prev) => {
              const newCache = new Map(prev);
              newCache.delete(dietCacheKey);
              return newCache;
            });
          }
        } catch (error) {
          console.error(
            "❌ [DietContext] Failed to add food to backend:",
            error
          );
          // Note: We don't revert the UI changes as they provide better UX
          // We also don't clear cache since the backend addition failed
        }

        // Invalidate analytics data for immediate update
        analyticsEventEmitter.emit();

        // Clean up old tracking entries (older than 5 seconds)
        setTimeout(() => {
          const cutoff = Date.now() - 5000;
          for (const [
            foodId,
            timestamp,
          ] of recentAdditionsRef.current.entries()) {
            if (timestamp < cutoff) {
              recentAdditionsRef.current.delete(foodId);
            }
          }
        }, 5000);

        // Update food suggestions based on new nutrition data (non-blocking)
        const updatedSummary = {
          calories: homeSummary.calories + (food.calories || 0),
          carbs: homeSummary.carbs + (food.carbs || 0),
          protein: homeSummary.protein + (food.protein || 0),
          fat: homeSummary.fat + (food.fat || 0),
        };

        // Run suggestions update in background without blocking UI
        fetchFoodSuggestions(updatedSummary, targetNutrition)
          .then(() => {
            console.log(
              "✅ [DietContext] Food suggestions updated successfully"
            );
          })
          .catch((error) => {
            console.error(
              "❌ [DietContext] Failed to update food suggestions:",
              error
            );
          });
      } finally {
        setSyncing(false);
      }
    },
    [homeSummary, targetNutrition, homeDate, dietDate, homeFoods]
  );

  // Remove food from today's diet with immediate UI update and background sync
  const removeFoodFromTodayDiet = useCallback(
    async (
      foodId: string,
      foodInstance?: { addedAt?: string; index?: number },
      onAlert?: (
        title: string,
        message: string,
        type: "success" | "error" | "info"
      ) => void
    ) => {
      console.log(
        "🗑️ [DietContext] Removing food from today's diet:",
        foodId,
        foodInstance
      );

      setSyncing(true);

      try {
        // Find the food to remove for nutrition calculation
        let foodToRemove: DietFood | undefined;
        let removalIndex: number = -1;

        if (foodInstance?.index !== undefined) {
          // Remove by specific index (most precise)
          removalIndex = foodInstance.index;
          foodToRemove = homeFoods[removalIndex];
          if (!foodToRemove || foodToRemove.id !== foodId) {
            console.log(
              "⚠️ [DietContext] Food at index not found or ID mismatch"
            );
            if (onAlert) {
              onAlert(
                "Food Not Found",
                "This food is not in your diet today. It may have already been removed.",
                "error"
              );
            }
            return;
          }
        } else if (foodInstance?.addedAt) {
          // Remove by timestamp (fallback)
          removalIndex = homeFoods.findIndex(
            (f) => f.id === foodId && f.addedAt === foodInstance.addedAt
          );
          if (removalIndex !== -1) {
            foodToRemove = homeFoods[removalIndex];
          }
        } else {
          // Remove first occurrence by ID (legacy behavior)
          removalIndex = homeFoods.findIndex((f) => f.id === foodId);
          if (removalIndex !== -1) {
            foodToRemove = homeFoods[removalIndex];
          }
        }

        if (!foodToRemove || removalIndex === -1) {
          console.log("⚠️ [DietContext] Food not found, skipping removal");
          if (onAlert) {
            onAlert(
              "Food Not Found",
              "This food is not in your diet today. It may have already been removed.",
              "error"
            );
          }
          return;
        }

        // IMMEDIATE UI UPDATES - All synchronous for instant feedback

        // 1. Remove specific food instance from list immediately
        setHomeFoods((prevFoods: DietFood[]) => {
          const newFoods = [...prevFoods];
          newFoods.splice(removalIndex, 1);
          return newFoods;
        });

        // 2. Update nutrition summary immediately
        setHomeSummary((prevSummary: DietSummary) => ({
          calories: Math.max(
            0,
            prevSummary.calories - (foodToRemove.calories || 0)
          ),
          carbs: Math.max(0, prevSummary.carbs - (foodToRemove.carbs || 0)),
          protein: Math.max(
            0,
            prevSummary.protein - (foodToRemove.protein || 0)
          ),
          fat: Math.max(0, prevSummary.fat - (foodToRemove.fat || 0)),
        }));

        // 3. If diet screen is viewing today's date, sync diet state too
        const today = new Date();
        const isViewingToday = dietDate.toDateString() === today.toDateString();
        if (isViewingToday) {
          console.log(
            "📅 [DietContext] Syncing diet state with today's removal"
          );
          setDietFoods((prevFoods: DietFood[]) => {
            const targetIndex =
              foodInstance?.index !== undefined
                ? foodInstance.index
                : prevFoods.findIndex(
                    (f, idx) =>
                      f.id === foodId &&
                      (foodInstance?.addedAt
                        ? f.addedAt === foodInstance.addedAt
                        : idx === removalIndex)
                  );

            if (targetIndex !== -1) {
              const newFoods = [...prevFoods];
              newFoods.splice(targetIndex, 1);
              return newFoods;
            }
            return prevFoods;
          });

          setDietSummary((prevSummary: DietSummary) => ({
            calories: Math.max(
              0,
              prevSummary.calories - (foodToRemove.calories || 0)
            ),
            carbs: Math.max(0, prevSummary.carbs - (foodToRemove.carbs || 0)),
            protein: Math.max(
              0,
              prevSummary.protein - (foodToRemove.protein || 0)
            ),
            fat: Math.max(0, prevSummary.fat - (foodToRemove.fat || 0)),
          }));
        }

        // Show success alert if callback is provided
        if (onAlert) {
          onAlert(
            "Removed!",
            `${foodToRemove.name} has been removed from your diet successfully.`,
            "success"
          );
        }

        // BACKGROUND TASKS - Call the API with specific instance details
        try {
          await DietService.removeFoodFromTodayDiet({
            foodId,
            addedAt: foodInstance?.addedAt,
            index: foodInstance?.index,
          });
          console.log(
            "✅ [DietContext] Food removed from backend successfully"
          );
        } catch (error) {
          console.error(
            "❌ [DietContext] Failed to remove food from backend:",
            error
          );
          // Note: We don't revert the UI changes as they provide better UX
          // The next refresh will sync with server state if needed
        }

        // Clear cache for current date to ensure fresh data on next refresh
        const dateString = formatDateForAPI(homeDate);
        const cacheKey = `home_${dateString}`;
        setDataCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(cacheKey);
          return newCache;
        });

        // Also clear diet cache if viewing today
        if (isViewingToday) {
          const dietCacheKey = `diet_${dateString}`;
          setDataCache((prev) => {
            const newCache = new Map(prev);
            newCache.delete(dietCacheKey);
            return newCache;
          });
        }

        // Invalidate analytics data for immediate update
        analyticsEventEmitter.emit();

        // Update food suggestions based on new nutrition data (non-blocking)
        const updatedSummary = {
          calories: Math.max(
            0,
            homeSummary.calories - (foodToRemove.calories || 0)
          ),
          carbs: Math.max(0, homeSummary.carbs - (foodToRemove.carbs || 0)),
          protein: Math.max(
            0,
            homeSummary.protein - (foodToRemove.protein || 0)
          ),
          fat: Math.max(0, homeSummary.fat - (foodToRemove.fat || 0)),
        };

        // Run suggestions update in background without blocking UI
        fetchFoodSuggestions(updatedSummary, targetNutrition)
          .then(() => {
            console.log(
              "✅ [DietContext] Food suggestions updated after removal"
            );
          })
          .catch((error) => {
            console.error(
              "❌ [DietContext] Failed to update food suggestions after removal:",
              error
            );
          });
      } finally {
        setSyncing(false);
      }
    },
    [homeSummary, targetNutrition, homeDate, homeFoods, dietDate]
  );

  // Add food to specific diet date
  const addFoodToDietDate = useCallback(
    async (food: DietFood, date: Date) => {
      console.log(
        "🍽️ [DietContext] Adding food to diet date:",
        food.name,
        date
      );

      // If it's today's date, update home state as well
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      if (isToday) {
        await addFoodToTodayDiet(food);
      }

      // Update diet state if viewing the same date
      if (date.toDateString() === dietDate.toDateString()) {
        setDietFoods((prevFoods: DietFood[]) => {
          console.log(
            "🍽️ [DietContext] Adding food to diet foods for date:",
            food.name
          );
          return [...prevFoods, food];
        });

        setDietSummary((prevSummary: DietSummary) => ({
          calories: prevSummary.calories + (food.calories || 0),
          carbs: prevSummary.carbs + (food.carbs || 0),
          protein: prevSummary.protein + (food.protein || 0),
          fat: prevSummary.fat + (food.fat || 0),
        }));
      }
    },
    [addFoodToTodayDiet, dietDate]
  );

  // Remove food from specific diet date
  const removeFoodFromDietDate = useCallback(
    async (
      foodId: string,
      date: Date,
      foodInstance?: { addedAt?: string; index?: number }
    ) => {
      console.log(
        "🗑️ [DietContext] Removing food from diet date:",
        foodId,
        date,
        foodInstance
      );

      // If it's today's date, update home state as well
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      if (isToday) {
        await removeFoodFromTodayDiet(foodId, foodInstance);
      }

      // Update diet state if viewing the same date
      if (date.toDateString() === dietDate.toDateString()) {
        // Find the specific food instance to remove
        let removalIndex = -1;
        let foodToRemove: DietFood | undefined;

        if (foodInstance?.index !== undefined) {
          // Remove by specific index
          removalIndex = foodInstance.index;
          foodToRemove = dietFoods[removalIndex];
          if (!foodToRemove || foodToRemove.id !== foodId) {
            console.log(
              "⚠️ [DietContext] Diet food at index not found or ID mismatch"
            );
            return;
          }
        } else if (foodInstance?.addedAt) {
          // Remove by timestamp
          removalIndex = dietFoods.findIndex(
            (f) => f.id === foodId && f.addedAt === foodInstance.addedAt
          );
          if (removalIndex !== -1) {
            foodToRemove = dietFoods[removalIndex];
          }
        } else {
          // Remove first occurrence by ID
          removalIndex = dietFoods.findIndex((f) => f.id === foodId);
          if (removalIndex !== -1) {
            foodToRemove = dietFoods[removalIndex];
          }
        }

        if (!foodToRemove || removalIndex === -1) return;

        setDietFoods((prevFoods: DietFood[]) => {
          const newFoods = [...prevFoods];
          newFoods.splice(removalIndex, 1);
          return newFoods;
        });

        setDietSummary((prevSummary: DietSummary) => ({
          calories: Math.max(
            0,
            prevSummary.calories - (foodToRemove.calories || 0)
          ),
          carbs: Math.max(0, prevSummary.carbs - (foodToRemove.carbs || 0)),
          protein: Math.max(
            0,
            prevSummary.protein - (foodToRemove.protein || 0)
          ),
          fat: Math.max(0, prevSummary.fat - (foodToRemove.fat || 0)),
        }));
      }
    },
    [removeFoodFromTodayDiet, dietDate, dietFoods]
  );

  const fetchFavoriteFoods = useCallback(async () => {
    try {
      const favFoods = await FavoriteService.getFavoriteFoodsWithDetails();
      setFavoriteFoods(favFoods);
      setFavoriteFoodIds(favFoods.map((f) => f.id));
    } catch (error) {
      console.error("❌ Error fetching favorite foods:", error);
      setFavoriteFoods([]);
      setFavoriteFoodIds([]);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      if (isLoadingProfile || !userProfile) {
        if (!isLoadingProfile) setLoading(false);
        return;
      }

      // Load home data on initialization
      await refreshHomeData(false);
      await fetchFavoriteFoods();
    };

    initializeData();
  }, [userProfile, isLoadingProfile, refreshHomeData, fetchFavoriteFoods]);

  // Sync diet state with home state when viewing today's date
  useEffect(() => {
    const today = new Date();
    const isViewingToday = dietDate.toDateString() === today.toDateString();

    if (isViewingToday && !loading && !syncing) {
      console.log("📅 [DietContext] Checking if diet state sync is needed");

      // Only sync if there's a meaningful difference or if diet state is empty
      const shouldSync =
        dietFoods.length === 0 ||
        homeFoods.length !== dietFoods.length ||
        Math.abs(homeSummary.calories - dietSummary.calories) > 1;

      if (shouldSync) {
        console.log(
          "� [DietContext] Syncing diet state - foods:",
          homeFoods.length,
          "calories:",
          homeSummary.calories
        );
        setDietFoods([...homeFoods]);
        setDietSummary({ ...homeSummary });
      }
    } else if (!isViewingToday) {
      // When viewing a different date, refresh that date's data
      refreshDietData(dietDate);
    }
  }, [
    dietDate,
    homeFoods,
    homeSummary,
    loading,
    syncing, // Add syncing to dependencies to avoid overriding during sync operations
    dietFoods.length,
    dietSummary.calories,
    refreshDietData,
  ]);

  const toggleFavorite = async (foodId: string, food?: DietFood) => {
    const prevIds = favoriteFoodIds;
    const isFav = prevIds.includes(foodId);

    if (isFav) {
      setFavoriteFoodIds(prevIds.filter((id) => id !== foodId));
      try {
        await FavoriteService.removeFavorite({ foodId });
      } catch (error) {
        setFavoriteFoodIds(prevIds); // Revert on error
      }
    } else {
      setFavoriteFoodIds([...prevIds, foodId]);
      try {
        await FavoriteService.addFavorite({ foodId });
      } catch (error) {
        setFavoriteFoodIds(prevIds); // Revert on error
      }
    }
    // Refresh detailed list in the background
    fetchFavoriteFoods();
  };

  const isFavorite = (foodId: string) => favoriteFoodIds.includes(foodId);
  const getFavoriteFoods = () => favoriteFoods;

  // Navigate to today's date (for compatibility)
  const goToToday = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log("📅 [DietContext] Navigating to today:", today.toDateString());
    // Home always shows today, so this doesn't change anything for home
  }, []);

  return (
    <DietContext.Provider
      value={{
        homeDate,
        homeSummary,
        homeFoods,
        dietDate,
        dietSummary,
        dietFoods,
        suggestedFoods,
        favoriteFoodIds,
        favoriteFoods,
        toggleFavorite,
        isFavorite,
        getFavoriteFoods,
        fetchFavoriteFoods,
        targetNutrition,
        loading,
        refreshing,
        syncing,
        refreshSuggestions,
        refreshHomeData,
        refreshDietData,
        goToToday,
        addFoodToTodayDiet,
        removeFoodFromTodayDiet,
        setDietDate,
        addFoodToDietDate,
        removeFoodFromDietDate,
      }}
    >
      {children}
    </DietContext.Provider>
  );
}
