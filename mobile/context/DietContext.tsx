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

  // Fetch food suggestions
  const refreshSuggestions = async () => {
    try {
      if (targetNutrition.calories > 0) {
        const suggestionsInput: IFoodSuggestionsInput = {
          targetNutrition: {
            calories: targetNutrition.calories,
            protein: targetNutrition.protein,
            carbs: targetNutrition.carbs,
            fat: targetNutrition.fat,
          },
          consumedNutrition: {
            calories: summary.calories,
            protein: summary.protein,
            carbs: summary.carbs,
            fat: summary.fat,
          },
        };

        const suggestionsData =
          await FoodService.getFoodSuggestions(suggestionsInput);

        // Map suggested foods to DietFood format
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

        setSuggestedFoods(mappedSuggestions);
      }
    } catch (error) {
      // Silently handle error for suggestions
    }
  };

  // Fetch home data and favorites from backend
  useEffect(() => {
    async function fetchData() {
      // Don't fetch if user profile is still loading or user is not authenticated
      if (isLoadingProfile || !userProfile) {
        console.log(
          "👤 DietContext: User successfully fetched, starting data fetch:",
          {
            userId: userProfile?.id || "no-user",
            email: userProfile?.email || "no-email",
            firstname: userProfile?.firstname || "no-firstname",
            onboardingComplete: userProfile?.onboardingComplete || false,
            targetNutrition: userProfile?.targetNutrition,
            selectedDate: selectedDate.toISOString().split("T")[0],
          }
        );
        setLoading(false); // Set loading to false to show empty state
        return;
      }

      console.log(
        "👤 DietContext: User successfully fetched, starting data fetch:",
        {
          userId: userProfile.id,
          email: userProfile.email,
          firstname: userProfile.firstname,
          onboardingComplete: userProfile.onboardingComplete,
          targetNutrition: userProfile.targetNutrition,
          selectedDate: selectedDate.toISOString().split("T")[0],
        }
      );

      // Use user profile target nutrition as fallback
      const fallbackTargetNutrition = {
        calories: userProfile.targetNutrition?.cal || 2000,
        carbs: userProfile.targetNutrition?.carbs || 250,
        protein: userProfile.targetNutrition?.protein || 150,
        fat: userProfile.targetNutrition?.fat || 67,
      };

      setTargetNutrition(fallbackTargetNutrition);

      setLoading(true);

      try {
        const input: IHomeInput = {
          date: selectedDate.toISOString().split("T")[0],
        };

        const homeData = await HomeService.getHome(input);
        // Map backend nutrition model to DietSummary
        const newSummary = {
          calories: homeData.totals.cal,
          carbs: homeData.totals.carbs,
          protein: homeData.totals.protein,
          fat: homeData.totals.fat,
        };
        const newTargetNutrition = {
          calories: homeData.targetNutrition.cal,
          carbs: homeData.targetNutrition.carbs,
          protein: homeData.targetNutrition.protein,
          fat: homeData.targetNutrition.fat,
        };

        setSummary(newSummary);
        setTargetNutrition(newTargetNutrition);

        // Flatten foods from diets
        const allFoods: DietFood[] = homeData.diets.flatMap((diet) =>
          diet.foods.map((food) => ({
            id: food.foodId,
            name: "", // You may want to fetch food details for name/image
            image: null,
            calories: 0,
            carbs: 0,
            protein: 0,
            fat: 0,
            description: "",
            ...food,
          }))
        );
        setFoods(allFoods);

        // Fetch favorites
        const favIds = await FavoriteService.getFavorites();
        setFavoriteFoodIds(favIds);

        // Fetch food suggestions with the new nutrition data
        if (newTargetNutrition.calories > 0) {
          try {
            const suggestionsInput: IFoodSuggestionsInput = {
              targetNutrition: {
                calories: newTargetNutrition.calories,
                protein: newTargetNutrition.protein,
                carbs: newTargetNutrition.carbs,
                fat: newTargetNutrition.fat,
              },
              consumedNutrition: {
                calories: newSummary.calories,
                protein: newSummary.protein,
                carbs: newSummary.carbs,
                fat: newSummary.fat,
              },
            };

            const suggestionsData =
              await FoodService.getFoodSuggestions(suggestionsInput);

            // Map suggested foods to DietFood format
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

            setSuggestedFoods(mappedSuggestions);
          } catch (error) {
            // Silently handle suggestions error
          }
        }
      } catch (err) {
        // Handle error (optional)
      }
      setLoading(false);
    }
    fetchData();
  }, [selectedDate, userProfile, isLoadingProfile]);

  // Favorite logic using backend
  const toggleFavorite = async (foodId: string) => {
    try {
      let updatedIds: string[];
      if (favoriteFoodIds.includes(foodId)) {
        updatedIds = await FavoriteService.removeFavorite({ foodId });
      } else {
        updatedIds = await FavoriteService.addFavorite({ foodId });
      }
      setFavoriteFoodIds(updatedIds);
    } catch (err) {
      // Handle error (optional)
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
