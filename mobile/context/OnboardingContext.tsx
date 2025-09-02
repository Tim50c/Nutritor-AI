import React, { createContext, useContext, useState, ReactNode } from 'react';

// (Assuming TargetNutrition is already defined as in the previous step)
interface TargetNutrition {
  calories: number; protein: number; carbs: number; fat: number; fiber: number;
}

interface OnboardingData {
  age: number;
  gender: 'Female' | 'Male' | 'Other' | null;
  weightCurrent: number;
  weightGoal: number;
  weightUnit: 'kg' | 'lbs'; 
  height: number; // <-- ADD THIS
  heightUnit: 'cm' | 'ft'; // <-- ADD THIS
  targetNutrition: TargetNutrition;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<OnboardingData>({
    age: 25,
    gender: null,
    weightCurrent: 60,
    weightGoal: 55,
    weightUnit: 'kg',
    height: 170, // <-- ADD DEFAULT
    heightUnit: 'cm', // <-- ADD DEFAULT
    targetNutrition: { calories: 2000, protein: 200, carbs: 500, fat: 50, fiber: 60 },
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prevData) => ({ ...prevData, ...updates }));
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};