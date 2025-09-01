import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import HomeService from "@/services/home-service";
import FavoriteService from "@/services/favorite-service";
import { IHomeInput, IFavoriteInput } from "@/interfaces";

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
  favoriteFoodIds: string[];
  toggleFavorite: (foodId: string) => Promise<void>;
  isFavorite: (foodId: string) => boolean;
  getFavoriteFoods: () => DietFood[];
  targetNutrition: DietSummary;
  loading: boolean;
}

const DietContext = createContext<DietContextType | undefined>(undefined);

export function useDietContext() {
  const ctx = useContext(DietContext);
  if (!ctx) throw new Error("useDietContext must be used within DietProvider");
  return ctx;
}

export function DietProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summary, setSummary] = useState<DietSummary>({ calories: 0, carbs: 0, protein: 0, fat: 0 });
  const [foods, setFoods] = useState<DietFood[]>([]);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<string[]>([]);
  const [targetNutrition, setTargetNutrition] = useState<DietSummary>({ calories: 0, carbs: 0, protein: 0, fat: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch home data and favorites from backend
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const input: IHomeInput = { date: selectedDate.toISOString().split("T")[0] };
        const homeData = await HomeService.getHome(input);
        // Map backend nutrition model to DietSummary
        setSummary({
          calories: homeData.totals.cal,
          carbs: homeData.totals.carbs,
          protein: homeData.totals.protein,
          fat: homeData.totals.fat,
        });
        setTargetNutrition({
          calories: homeData.targetNutrition.cal,
          carbs: homeData.targetNutrition.carbs,
          protein: homeData.targetNutrition.protein,
          fat: homeData.targetNutrition.fat,
        });
        // Flatten foods from diets
        const allFoods: DietFood[] = homeData.diets.flatMap(diet =>
          diet.foods.map(food => ({
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
      } catch (err) {
        // Handle error (optional)
      }
      setLoading(false);
    }
    fetchData();
  }, [selectedDate]);

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
        favoriteFoodIds,
        toggleFavorite,
        isFavorite,
        getFavoriteFoods,
        targetNutrition,
        loading,
      }}
    >
      {children}
    </DietContext.Provider>
  );
}
