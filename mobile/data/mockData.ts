// Simple data generator so the chart
import {images} from "@/constants/images";

export function generateMockCalories() {
// generate sample daily entries for a month
  const base = new Date(2025, 3, 1); // Apr 1 2025 (month is 0-based)
  const entries: { date: string; value: number }[] = [];


// using the exact numbers seen in screenshot for a single week
  const weekVals = [1000, 1200, 1100, 1600, 1400, 2600, 1800];
  for (let i = 0; i < weekVals.length; i++) {
    const d = new Date(2025, 3, 1 + i);
    entries.push({ date: d.toISOString(), value: weekVals[i] });
  }


// add more sample days across the month
  for (let i = 7; i < 30; i++) {
    const d = new Date(2025, 3, 1 + i);
    entries.push({ date: d.toISOString(), value: Math.round(800 + Math.random() * 2200) });
  }


  return entries;
}

export const FOODS = [
  {
    id: "1",
    name: "Beef Noodle Soup - 400g",
    image: images.pho,
    calories: 2000,
    protein: 180,
    fat: 80,
    carbs: 150,
  },
  {
    id: "2",
    name: "Chicken Salad - 300g",
    image: images.chicken_salad,
    calories: 800,
    protein: 70,
    fat: 30,
    carbs: 50,
  },
  {
    id: "3",
    name: "Avocado Toast - 250g",
    image: images.avocado_toast,
    calories: 600,
    protein: 20,
    fat: 40,
    carbs: 50,
  },
  {
    id: "4",
    name: "Fruit Smoothie - 350g",
    image: images.fruit_smoothie,
    calories: 500,
    protein: 10,
    fat: 5,
    carbs: 100,
  },
  {
    id: "5",
    name: "Grilled Salmon - 300g",
    image: images.grilled_salmon,
    calories: 700,
    protein: 60,
    fat: 40,
    carbs: 20,
  },
  {
    id: "6",
    name: "Veggie Stir-fry - 400g",
    image: images.veggie_stirfry,
    calories: 550,
    protein: 25,
    fat: 15,
    carbs: 80,
  },
  {
    id: "7",
    name: "Yogurt Parfait - 200g",
    image: images.yogurt_parfait,
    calories: 300,
    protein: 15,
    fat: 5,
    carbs: 40,
  },
  {
    id: "8",
    name: "Quinoa Bowl - 350g",
    image: images.quinoa_bowl,
    calories: 650,
    protein: 30,
    fat: 20,
    carbs: 70,
  },
  {
    id: "9",
    name: "Pancakes with Syrup - 300g",
    image: images.pancakes,
    calories: 900,
    protein: 20,
    fat: 25,
    carbs: 150,
  },
  {
    id: "10",
    name: "Turkey Sandwich - 250g",
    image: images.turkey_sandwich,
    calories: 750,
    protein: 50,
    fat: 20,
    carbs: 60,
  }
];