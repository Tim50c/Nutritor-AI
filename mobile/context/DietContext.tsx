import { useUser } from "@/context/UserContext";
import { IFoodSuggestionsInput, IHomeInput } from "@/interfaces";
import { FoodModel } from "@/models";
import FavoriteService from "@/services/favorite-service";
import FoodService from "@/services/food-service";
import HomeService from "@/services/home-service";
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
  toggleFavorite: (foodId: string, food?: DietFood) => Promise<void>; // optional food for optimistic add
  isFavorite: (foodId: string) => boolean;
  getFavoriteFoods: () => DietFood[];
  fetchFavoriteFoods: () => Promise<void>;
  targetNutrition: DietSummary;
  loading: boolean;
  refreshSuggestions: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const DietContext = createContext<DietContextType | undefined>(undefined);

export function useDietContext() {
  const ctx = useContext(DietContext);
  if (!ctx) throw new Error("useDietContext must be used within DietProvider");
  return ctx;
}

export function DietProvider({ children }: { children: ReactNode }) {
  const { userProfile, isLoadingProfile } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summary, setSummary] = useState<DietSummary>({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });
  const [foods, setFoods] = useState<DietFood[]>([]);
  const [suggestedFoods, setSuggestedFoods] = useState<DietFood[]>([]);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<string[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<DietFood[]>([]);
  const [targetNutrition, setTargetNutrition] = useState<DietSummary>({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch food suggestions using consumed nutrition
  const fetchFoodSuggestions = async (
    consumedNutrition: DietSummary,
    targetNutrition: DietSummary
  ) => {
    try {
      if (targetNutrition.calories <= 0) {
        console.log("⚠️ Skipping suggestions - no target nutrition");
        return;
      }

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
          image: food.imageUrl || null,
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

  // Refresh suggestions using current state
  const refreshSuggestions = async () => {
    await fetchFoodSuggestions(summary, targetNutrition);
  };

  // Refresh all data (nutrition and suggestions)
  const refreshData = async () => {
    try {
      setLoading(true);

      // Fetch home data which includes nutrition for selected date
      const homeData = await HomeService.getHome({
        date: selectedDate.toISOString().split("T")[0],
      });

      if (homeData && homeData.totals) {
        // Convert NutritionModel to DietSummary format
        const nutritionSummary = {
          calories: homeData.totals.cal,
          carbs: homeData.totals.carbs,
          protein: homeData.totals.protein,
          fat: homeData.totals.fat,
        };
        setSummary(nutritionSummary);

        if (homeData.targetNutrition) {
          const targetSummary = {
            calories: homeData.targetNutrition.cal,
            carbs: homeData.targetNutrition.carbs,
            protein: homeData.targetNutrition.protein,
            fat: homeData.targetNutrition.fat,
          };
          setTargetNutrition(targetSummary);
        }
      }

      // Also refresh food suggestions
      await fetchFoodSuggestions(
        homeData?.totals
          ? {
              calories: homeData.totals.cal,
              carbs: homeData.totals.carbs,
              protein: homeData.totals.protein,
              fat: homeData.totals.fat,
            }
          : summary,
        homeData?.targetNutrition
          ? {
              calories: homeData.targetNutrition.cal,
              carbs: homeData.targetNutrition.carbs,
              protein: homeData.targetNutrition.protein,
              fat: homeData.targetNutrition.fat,
            }
          : targetNutrition
      );
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch complete favorite foods independently
  const fetchFavoriteFoods = useCallback(async () => {
    try {
      console.log("🔄 Fetching all favorite foods with details...");
      const favoriteFoodsWithDetails =
        await FavoriteService.getFavoriteFoodsWithDetails();
      const favoriteIds = favoriteFoodsWithDetails.map((food) => food.id);

      setFavoriteFoods(favoriteFoodsWithDetails);
      setFavoriteFoodIds(favoriteIds);

      console.log(
        "✅ Favorite foods updated:",
        favoriteFoodsWithDetails.length
      );
    } catch (error) {
      console.error("❌ Error fetching favorite foods:", error);
      setFavoriteFoods([]);
      setFavoriteFoodIds([]);
    }
  }, []); // Empty dependency array since this function doesn't depend on any state

  // Fetch home data and favorites
  useEffect(() => {
    async function fetchData() {
      if (isLoadingProfile || !userProfile) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fallback target nutrition from user profile
        const fallbackTargetNutrition = {
          calories: userProfile.targetNutrition?.cal || 2000,
          carbs: userProfile.targetNutrition?.carbs || 250,
          protein: userProfile.targetNutrition?.protein || 150,
          fat: userProfile.targetNutrition?.fat || 67,
        };

        // Fetch home data
        const input: IHomeInput = {
          date: selectedDate.toISOString().split("T")[0],
        };

        const homeData = await HomeService.getHome(input);
        const actualData = (homeData as any).data;

        // Extract nutrition data with fallbacks
        const newTargetNutrition = {
          calories:
            actualData?.targetNutrition?.calories ||
            fallbackTargetNutrition.calories,
          carbs:
            actualData?.targetNutrition?.carbs || fallbackTargetNutrition.carbs,
          protein:
            actualData?.targetNutrition?.protein ||
            fallbackTargetNutrition.protein,
          fat: actualData?.targetNutrition?.fat || fallbackTargetNutrition.fat,
        };

        const consumedNutrition = {
          calories: actualData?.consumpedNutrition?.cal || 0,
          carbs: actualData?.consumpedNutrition?.carbs || 0,
          protein: actualData?.consumpedNutrition?.protein || 0,
          fat: actualData?.consumpedNutrition?.fat || 0,
        };

        // Update state
        setTargetNutrition(newTargetNutrition);
        setSummary(consumedNutrition);

        // Process foods from diets - now with populated food data
        const allFoods: DietFood[] = (actualData?.diets || []).flatMap(
          (diet: any) =>
            (diet.foods || []).map((food: any) => ({
              id: food.id || food.foodId, // Use populated id or fallback to foodId
              name: food.name || "Unknown Food",
              image: food.imageUrl ? { uri: food.imageUrl } : null,
              calories: food.nutrition?.cal || 0,
              carbs: food.nutrition?.carbs || 0,
              protein: food.nutrition?.protein || 0,
              fat: food.nutrition?.fat || 0,
              description: food.description || "",
            }))
        );
        setFoods(allFoods);

        // Fetch favorites (non-critical)
        try {
          await fetchFavoriteFoods();
        } catch {
          setFavoriteFoodIds([]);
          setFavoriteFoods([]);
        }

        // Fetch food suggestions
        await fetchFoodSuggestions(consumedNutrition, newTargetNutrition);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedDate, userProfile, isLoadingProfile, fetchFavoriteFoods]);

  // Favorite management
  const toggleFavorite = async (foodId: string, food?: DietFood) => {
    // Keep previous state for potential revert
    const prevIds = Array.isArray(favoriteFoodIds) ? favoriteFoodIds : [];
    const prevFoods = favoriteFoods;

    const alreadyFavorite = prevIds.includes(foodId);

    if (alreadyFavorite) {
      // Optimistically remove
      setFavoriteFoodIds(prevIds.filter((id) => id !== foodId));
      setFavoriteFoods(prevFoods.filter((f) => f.id !== foodId));
      try {
        await FavoriteService.removeFavorite({ foodId });
        // Background refresh (don't await to keep UI snappy)
        fetchFavoriteFoods();
      } catch (error) {
        console.error("Error removing favorite:", error);
        // Revert
        setFavoriteFoodIds(prevIds);
        setFavoriteFoods(prevFoods);
      }
    } else {
      // Optimistically add
      setFavoriteFoodIds([...prevIds, foodId]);
      if (food && !prevFoods.some((f) => f.id === foodId)) {
        setFavoriteFoods([...prevFoods, food]);
      }
      try {
        await FavoriteService.addFavorite({ foodId });
        // Background refresh
        fetchFavoriteFoods();
      } catch (error) {
        console.error("Error adding favorite:", error);
        // Revert
        setFavoriteFoodIds(prevIds);
        setFavoriteFoods(prevFoods);
      }
    }
  };

  const isFavorite = (foodId: string) => {
    if (!Array.isArray(favoriteFoodIds)) return false;
    return favoriteFoodIds.includes(foodId);
  };

  const getFavoriteFoods = () => favoriteFoods;

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
        refreshSuggestions,
        refreshData,
      }}
    >
      {children}
    </DietContext.Provider>
  );
}
