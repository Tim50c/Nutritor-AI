import React, { createContext, useContext, useState, ReactNode } from "react";

export type DietFood = {
  id: string;
  name: string;
  image: any;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
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
  toggleFavorite: (foodId: string) => void;
  isFavorite: (foodId: string) => boolean;
  getFavoriteFoods: () => DietFood[];
}

const DietContext = createContext<DietContextType | undefined>(undefined);

export function useDietContext() {
  const ctx = useContext(DietContext);
  if (!ctx) throw new Error("useDietContext must be used within DietProvider");
  return ctx;
}

export function DietProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<string[]>([]);

  // Demo/mock data
  const summary: DietSummary = {
    calories: 49.05,
    carbs: 11.83,
    protein: 0.35,
    fat: 0.35,
  };

  const foods: DietFood[] = [
    {
      id: "1",
      name: "Beef Noodle Soup - 400g",
      image: require("@/assets/images/pho.png"),
      calories: 2000,
      carbs: 150,
      protein: 180,
      fat: 80,
    },
    {
      id: "2",
      name: "Beef Noodle Soup - 400g",
      image: require("@/assets/images/pho.png"),
      calories: 2000,
      carbs: 150,
      protein: 180,
      fat: 80,
    },
  ];

  // Favorite logic
  const toggleFavorite = (foodId: string) => {
    setFavoriteFoodIds((prev) =>
      prev.includes(foodId)
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId]
    );
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
      }}
    >
      {children}
    </DietContext.Provider>
  );
}
