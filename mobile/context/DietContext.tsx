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
  toggleFavorite: (foodId: string, food?: DietFood) => Promise<void>;
  isFavorite: (foodId: string) => boolean;
  getFavoriteFoods: () => DietFood[];
  fetchFavoriteFoods: () => Promise<void>;
  targetNutrition: DietSummary;
  loading: boolean;
  refreshSuggestions: () => Promise<void>;
  refreshData: () => Promise<void>;
  goToToday: () => void; // Add function to go to today
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
  const [targetNutrition, setTargetNutrition] = useState<DietSummary>(initialSummary);
  const [loading, setLoading] = useState<boolean>(true);

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

  const refreshSuggestions = () => fetchFoodSuggestions(summary, targetNutrition);

  const refreshData = useCallback(async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const input: IHomeInput = { date: selectedDate.toISOString().split("T")[0] };
      const homeData = await HomeService.getHome(input);
      const actualData = (homeData as any).data;
      
      const consumedNutrition = {
        calories: actualData?.consumpedNutrition?.cal || 0,
        carbs: actualData?.consumpedNutrition?.carbs || 0,
        protein: actualData?.consumpedNutrition?.protein || 0,
        fat: actualData?.consumpedNutrition?.fat || 0,
      };
      setSummary(consumedNutrition);
      
      const allFoods: DietFood[] = (actualData?.diets[0]?.foods || []).map((food: any) => ({
        id: food.id,
        name: food.name || "Unknown Food",
        image: food.imageUrl ? { uri: food.imageUrl } : null,
        calories: food.nutrition?.cal || 0,
        carbs: food.nutrition?.carbs || 0,
        protein: food.nutrition?.protein || 0,
        fat: food.nutrition?.fat || 0,
        description: food.description || "",
      }));
      setFoods(allFoods);

      await fetchFoodSuggestions(consumedNutrition, targetNutrition);
    } catch (error) {
      console.error("❌ [DietContext] Failed to refresh data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, userProfile, targetNutrition]);

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
    async function fetchData() {
      if (isLoadingProfile || !userProfile) {
        if (!isLoadingProfile) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fallbackTarget = {
          calories: userProfile.targetNutrition?.cal || 2000,
          carbs: userProfile.targetNutrition?.carbs || 250,
          protein: userProfile.targetNutrition?.protein || 150,
          fat: userProfile.targetNutrition?.fat || 67,
        };

        const input: IHomeInput = { date: selectedDate.toISOString().split("T")[0] };
        const homeData = await HomeService.getHome(input);
        const actualData = (homeData as any).data;

        const newTarget = {
          calories: actualData?.targetNutrition?.calories ?? fallbackTarget.calories,
          carbs: actualData?.targetNutrition?.carbs ?? fallbackTarget.carbs,
          protein: actualData?.targetNutrition?.protein ?? fallbackTarget.protein,
          fat: actualData?.targetNutrition?.fat ?? fallbackTarget.fat,
        };
        setTargetNutrition(newTarget);

        const consumedNutrition = {
          calories: actualData?.consumpedNutrition?.cal || 0,
          carbs: actualData?.consumpedNutrition?.carbs || 0,
          protein: actualData?.consumpedNutrition?.protein || 0,
          fat: actualData?.consumpedNutrition?.fat || 0,
        };
        setSummary(consumedNutrition);

        const allFoods: DietFood[] = (actualData?.diets[0]?.foods || []).map((food: any) => ({
            id: food.id,
            name: food.name || "Unknown Food",
            image: food.imageUrl ? { uri: food.imageUrl } : null,
            calories: food.nutrition?.cal || 0,
            carbs: food.nutrition?.carbs || 0,
            protein: food.nutrition?.protein || 0,
            fat: food.nutrition?.fat || 0,
            description: food.description || "",
        }));
        setFoods(allFoods);

        await fetchFavoriteFoods();
        await fetchFoodSuggestions(consumedNutrition, newTarget);
      } catch (error) {
        console.error("❌ Error fetching daily diet data:", error);
        setSummary(initialSummary);
        setFoods([]);
        setSuggestedFoods([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedDate, userProfile, isLoadingProfile, fetchFavoriteFoods]);

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

  // Function to navigate to today's date
  const goToToday = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log("📅 [DietContext] goToToday called - setting date to:", today);
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
        refreshSuggestions,
        refreshData,
        goToToday,
      }}
    >
      {children}
    </DietContext.Provider>
  );
}