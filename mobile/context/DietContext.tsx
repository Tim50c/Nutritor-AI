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
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  summary: DietSummary;
  foods: DietFood[];
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
  refreshSuggestions: () => Promise<void>;
  refreshData: (forceRefresh?: boolean) => Promise<void>;
  goToToday: () => void;
  addFoodToTodayDiet: (food: DietFood) => Promise<void>;
  removeFoodFromTodayDiet: (foodId: string) => Promise<void>;
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summary, setSummary] = useState<DietSummary>(initialSummary);
  const [foods, setFoods] = useState<DietFood[]>([]);
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
    () => fetchFoodSuggestions(summary, targetNutrition),
    [summary, targetNutrition]
  );

  const refreshData = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!userProfile) return;

      const dateString = formatDateForAPI(selectedDate);
      const cacheKey = `diet_${dateString}`;
      const now = new Date();
      const CACHE_DURATION = 30000; // 30 seconds

      // Use cached data if available and fresh
      if (!forceRefresh && dataCache.has(cacheKey) && lastFetchTime) {
        const timeDiff = now.getTime() - lastFetchTime.getTime();
        if (timeDiff < CACHE_DURATION) {
          console.log(
            "🏠 [DietContext] Using cached data for date:",
            dateString
          );
          const cachedData = dataCache.get(cacheKey);
          setSummary(cachedData.summary);
          setFoods(cachedData.foods);
          setTargetNutrition(cachedData.targetNutrition);
          setLoading(false);
          return;
        }
      }

      // Determine appropriate loading state
      const hasExistingData = foods.length > 0 || summary.calories > 0;
      if (hasExistingData) {
        setRefreshing(true); // Background refresh
      } else {
        setLoading(true); // Initial load
      }

      try {
        console.log(
          "🏠 [DietContext] refreshData - fetching for date:",
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
        setSummary(consumedNutrition);

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
        setFoods(allFoods);

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
          "📊 [DietContext] Diet data refreshed, invalidating analytics"
        );
        analyticsEventEmitter.emit();
      } catch (error) {
        console.error("❌ [DietContext] Failed to refresh data:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      selectedDate,
      userProfile,
      targetNutrition,
      dataCache,
      lastFetchTime,
      foods.length,
      summary.calories,
    ]
  );

  // Add food to today's diet with immediate UI update and background sync
  const addFoodToTodayDiet = useCallback(
    async (food: DietFood) => {
      console.log("🍽️ [DietContext] Adding food to today's diet:", food.name);

      // IMMEDIATE UI UPDATES - All synchronous for instant feedback

      // 1. Update foods list immediately
      setFoods((prevFoods) => {
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
      setSummary((prevSummary) => ({
        calories: prevSummary.calories + (food.calories || 0),
        carbs: prevSummary.carbs + (food.carbs || 0),
        protein: prevSummary.protein + (food.protein || 0),
        fat: prevSummary.fat + (food.fat || 0),
      }));

      // BACKGROUND TASKS - All async operations

      // Clear cache for current date to ensure fresh data on next refresh
      const dateString = formatDateForAPI(selectedDate);
      const cacheKey = `diet_${dateString}`;
      setDataCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });

      // Invalidate analytics data for immediate update
      analyticsEventEmitter.emit();

      // Update food suggestions based on new nutrition data (non-blocking)
      const updatedSummary = {
        calories: summary.calories + (food.calories || 0),
        carbs: summary.carbs + (food.carbs || 0),
        protein: summary.protein + (food.protein || 0),
        fat: summary.fat + (food.fat || 0),
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
    [summary, targetNutrition, selectedDate]
  );

  // Remove food from today's diet with immediate UI update and background sync
  const removeFoodFromTodayDiet = useCallback(
    async (foodId: string) => {
      console.log("🗑️ [DietContext] Removing food from today's diet:", foodId);

      // Find the food to remove for nutrition calculation
      const foodToRemove = foods.find((f) => f.id === foodId);
      if (!foodToRemove) {
        console.log("⚠️ [DietContext] Food not found, skipping removal");
        return;
      }

      // IMMEDIATE UI UPDATES - All synchronous for instant feedback

      // 1. Remove food from list immediately
      setFoods((prevFoods) => prevFoods.filter((f) => f.id !== foodId));

      // 2. Update nutrition summary immediately
      setSummary((prevSummary) => ({
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
      const dateString = formatDateForAPI(selectedDate);
      const cacheKey = `diet_${dateString}`;
      setDataCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });

      // Invalidate analytics data for immediate update
      analyticsEventEmitter.emit();

      // Update food suggestions based on new nutrition data (non-blocking)
      const updatedSummary = {
        calories: Math.max(0, summary.calories - (foodToRemove.calories || 0)),
        carbs: Math.max(0, summary.carbs - (foodToRemove.carbs || 0)),
        protein: Math.max(0, summary.protein - (foodToRemove.protein || 0)),
        fat: Math.max(0, summary.fat - (foodToRemove.fat || 0)),
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
    [summary, targetNutrition, selectedDate, foods]
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

      // Load data using cache when possible for better performance
      await refreshData(false);
      await fetchFavoriteFoods();
    };

    initializeData();
  }, [
    selectedDate,
    userProfile,
    isLoadingProfile,
    refreshData,
    fetchFavoriteFoods,
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

  // Navigate to today's date
  const goToToday = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log("📅 [DietContext] Navigating to today:", today.toDateString());
    setSelectedDate(today);
  }, []);

  return (
    <DietContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        summary,
        foods,
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
        refreshData,
        goToToday,
        addFoodToTodayDiet,
        removeFoodFromTodayDiet,
      }}
    >
      {children}
    </DietContext.Provider>
  );
}
