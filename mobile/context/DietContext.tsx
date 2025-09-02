import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import HomeService from "@/services/home-service";
import FoodService from "@/services/food-service";
import FavoriteService from "@/services/favorite-service";
import {
  IHomeInput,
  IFavoriteInput,
  IFoodSuggestionsInput,
} from "@/interfaces";
import { FoodModel } from "@/models";
import { useUser } from "@/context/UserContext";

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
  toggleFavorite: (foodId: string) => Promise<void>;
  isFavorite: (foodId: string) => boolean;
  getFavoriteFoods: () => DietFood[];
  targetNutrition: DietSummary;
  loading: boolean;
  refreshSuggestions: () => Promise<void>;
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

        // Process foods from diets
        const allFoods: DietFood[] = (actualData?.diets || []).flatMap(
          (diet: any) =>
            (diet.foods || []).map((food: any) => ({
              id: food.foodId,
              name: "",
              image: null,
              calories: 0,
              carbs: 0,
              protein: 0,
              fat: 0,
              description: "",
            }))
        );
        setFoods(allFoods);

        // Fetch favorites (non-critical)
        try {
          const favIds = await FavoriteService.getFavorites();
          setFavoriteFoodIds(favIds);
        } catch (error) {
          setFavoriteFoodIds([]);
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
  }, [selectedDate, userProfile, isLoadingProfile]);

  // Favorite management
  const toggleFavorite = async (foodId: string) => {
    try {
      const updatedIds = favoriteFoodIds.includes(foodId)
        ? await FavoriteService.removeFavorite({ foodId })
        : await FavoriteService.addFavorite({ foodId });
      setFavoriteFoodIds(updatedIds);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const isFavorite = (foodId: string) => favoriteFoodIds.includes(foodId);

  const getFavoriteFoods = () => foods.filter((food) => isFavorite(food.id));

  return (
    <DietContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        summary,
        foods,
        suggestedFoods,
        favoriteFoodIds,
        toggleFavorite,
        isFavorite,
        getFavoriteFoods,
        targetNutrition,
        loading,
        refreshSuggestions,
      }}
    >
      {children}
    </DietContext.Provider>
  );
}
