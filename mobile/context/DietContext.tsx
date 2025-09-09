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

  // Functions
  refreshSuggestions: () => Promise<void>;
  refreshHomeData: (forceRefresh?: boolean) => Promise<void>;
  refreshDietData: (date: Date, forceRefresh?: boolean) => Promise<void>;
  goToToday: () => void;
  addFoodToTodayDiet: (food: DietFood) => Promise<void>;
  removeFoodFromTodayDiet: (foodId: string) => Promise<void>;

  // Diet screen specific functions
  setDietDate: (date: Date) => void;
  addFoodToDietDate: (food: DietFood, date: Date) => Promise<void>;
  removeFoodFromDietDate: (foodId: string, date: Date) => Promise<void>;
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
          (food: any) => ({
            id: food.id,
            name: food.name || "Unknown Food",
            image: food.imageUrl ? { uri: food.imageUrl } : null,
            calories: food.nutrition?.cal || 0,
            carbs: food.nutrition?.carbs || 0,
            protein: food.nutrition?.protein || 0,
            fat: food.nutrition?.fat || 0,
            description: food.description || "",
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
          (food: any) => ({
            id: food.id,
            name: food.name || "Unknown Food",
            image: food.imageUrl ? { uri: food.imageUrl } : null,
            calories: food.nutrition?.cal || 0,
            carbs: food.nutrition?.carbs || 0,
            protein: food.nutrition?.protein || 0,
            fat: food.nutrition?.fat || 0,
            description: food.description || "",
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
    async (food: DietFood) => {
      console.log("🍽️ [DietContext] Adding food to today's diet:", food.name);

      // IMMEDIATE UI UPDATES - All synchronous for instant feedback

      // 1. Update foods list immediately
      setHomeFoods((prevFoods: DietFood[]) => {
        // Prevent duplicate food entries
        const exists = prevFoods.some((f) => f.id === food.id);
        if (exists) {
          console.log(
            "⚠️ [DietContext] Food already exists, skipping addition"
          );
          return prevFoods;
        }
        return [...prevFoods, food];
      });

      // 2. Update nutrition summary immediately
      setHomeSummary((prevSummary: DietSummary) => ({
        calories: prevSummary.calories + (food.calories || 0),
        carbs: prevSummary.carbs + (food.carbs || 0),
        protein: prevSummary.protein + (food.protein || 0),
        fat: prevSummary.fat + (food.fat || 0),
      }));

      // BACKGROUND TASKS - All async operations

      // Clear cache for current date to ensure fresh data on next refresh
      const dateString = formatDateForAPI(homeDate);
      const cacheKey = `home_${dateString}`;
      setDataCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });

      // Invalidate analytics data for immediate update
      analyticsEventEmitter.emit();

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
          console.log("✅ [DietContext] Food suggestions updated successfully");
        })
        .catch((error) => {
          console.error(
            "❌ [DietContext] Failed to update food suggestions:",
            error
          );
        });
    },
    [homeSummary, targetNutrition, homeDate]
  );

  // Remove food from today's diet with immediate UI update and background sync
  const removeFoodFromTodayDiet = useCallback(
    async (foodId: string) => {
      console.log("🗑️ [DietContext] Removing food from today's diet:", foodId);

      // Find the food to remove for nutrition calculation
      const foodToRemove = homeFoods.find((f) => f.id === foodId);
      if (!foodToRemove) {
        console.log("⚠️ [DietContext] Food not found, skipping removal");
        return;
      }

      // IMMEDIATE UI UPDATES - All synchronous for instant feedback

      // 1. Remove food from list immediately
      setHomeFoods((prevFoods: DietFood[]) =>
        prevFoods.filter((f) => f.id !== foodId)
      );

      // 2. Update nutrition summary immediately
      setHomeSummary((prevSummary: DietSummary) => ({
        calories: Math.max(
          0,
          prevSummary.calories - (foodToRemove.calories || 0)
        ),
        carbs: Math.max(0, prevSummary.carbs - (foodToRemove.carbs || 0)),
        protein: Math.max(0, prevSummary.protein - (foodToRemove.protein || 0)),
        fat: Math.max(0, prevSummary.fat - (foodToRemove.fat || 0)),
      }));

      // BACKGROUND TASKS - All async operations

      // Clear cache for current date to ensure fresh data on next refresh
      const dateString = formatDateForAPI(homeDate);
      const cacheKey = `home_${dateString}`;
      setDataCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });

      // Invalidate analytics data for immediate update
      analyticsEventEmitter.emit();

      // Update food suggestions based on new nutrition data (non-blocking)
      const updatedSummary = {
        calories: Math.max(
          0,
          homeSummary.calories - (foodToRemove.calories || 0)
        ),
        carbs: Math.max(0, homeSummary.carbs - (foodToRemove.carbs || 0)),
        protein: Math.max(0, homeSummary.protein - (foodToRemove.protein || 0)),
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
    },
    [homeSummary, targetNutrition, homeDate, homeFoods]
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
          const exists = prevFoods.some((f) => f.id === food.id);
          if (exists) return prevFoods;
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
    async (foodId: string, date: Date) => {
      console.log(
        "🗑️ [DietContext] Removing food from diet date:",
        foodId,
        date
      );

      // If it's today's date, update home state as well
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();

      if (isToday) {
        await removeFoodFromTodayDiet(foodId);
      }

      // Update diet state if viewing the same date
      if (date.toDateString() === dietDate.toDateString()) {
        const foodToRemove = dietFoods.find((f) => f.id === foodId);
        if (!foodToRemove) return;

        setDietFoods((prevFoods: DietFood[]) =>
          prevFoods.filter((f) => f.id !== foodId)
        );

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
