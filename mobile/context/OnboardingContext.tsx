import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useUser } from "./UserContext";

// (Assuming TargetNutrition is already defined as in the previous step)
interface TargetNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface OnboardingData {
  age: number;
  gender: "Female" | "Male" | "Other" | null;
  weightCurrent: number;
  weightGoal: number;
  weightUnit: "kg" | "lbs";
  height: number; // <-- ADD THIS
  heightUnit: "cm" | "ft"; // <-- ADD THIS
  targetNutrition: TargetNutrition;
  isGoalUpdate?: boolean; // Flag to indicate this is just a goal update
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  initializeFromProfile: (userProfile: any) => void; // New method to populate from existing profile
  resetToDefaults: () => void; // Method to reset to fresh onboarding state
}

const OnboardingContext = createContext<OnboardingContextType>({
  data: {
    age: 25,
    gender: null,
    weightCurrent: 60,
    weightGoal: 55,
    weightUnit: "kg",
    height: 170,
    heightUnit: "cm",
    targetNutrition: {
      calories: 2000,
      protein: 200,
      carbs: 500,
      fat: 50,
      fiber: 60,
    },
  },
  updateData: () => {},
  initializeFromProfile: () => {},
  resetToDefaults: () => {},
});

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { userProfile } = useUser();
  const [data, setData] = useState<OnboardingData>({
    age: 25,
    gender: null,
    weightCurrent: 60,
    weightGoal: 55,
    weightUnit: "kg",
    height: 170, // <-- ADD DEFAULT
    heightUnit: "cm", // <-- ADD DEFAULT
    targetNutrition: {
      calories: 2000,
      protein: 200,
      carbs: 500,
      fat: 50,
      fiber: 60,
    },
  });

  // Auto-initialize from user profile when available
  useEffect(() => {
    if (userProfile && userProfile.gender && userProfile.onboardingComplete) {
      console.log("🔄 [OnboardingContext] Auto-initializing from user profile");
      initializeFromProfile(userProfile);
    }
  }, [userProfile]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prevData) => ({ ...prevData, ...updates }));
  };

  const resetToDefaults = () => {
    setData({
      age: 25,
      gender: null,
      weightCurrent: 60,
      weightGoal: 55,
      weightUnit: "kg",
      height: 170,
      heightUnit: "cm",
      targetNutrition: {
        calories: 2000,
        protein: 200,
        carbs: 500,
        fat: 50,
        fiber: 60,
      },
      // Don't set isGoalUpdate for fresh reset
    });
  };

  const initializeFromProfile = (userProfile: any) => {

    // Handle Firebase Timestamp object for dob
    let age = 25; // Default fallback
    if (userProfile.dob && userProfile.dob._seconds) {
      // Firebase Timestamp object
      const dobDate = new Date(userProfile.dob._seconds * 1000);
      const currentYear = new Date().getFullYear();
      const birthYear = dobDate.getFullYear();
      age = currentYear - birthYear;
    } else if (userProfile.dob) {
      // Regular date
      const currentYear = new Date().getFullYear();
      const birthYear = new Date(userProfile.dob).getFullYear();
      age = currentYear - birthYear;
    }

    const newData = {
      age,
      gender: userProfile.gender,
      weightCurrent: userProfile.weightCurrent,
      weightGoal: userProfile.weightGoal, // Keep existing goal initially, will be updated later
      height: userProfile.height,
      weightUnit: userProfile.unitPreferences?.weight || "kg",
      heightUnit: userProfile.unitPreferences?.height || "cm",
      targetNutrition: userProfile.targetNutrition,
      isGoalUpdate: true, // Mark this as a goal update flow
      activityLevel: "moderate", // Add default activity level for nutrition API
    };

    setData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  };

  return (
    <OnboardingContext.Provider
      value={{ data, updateData, initializeFromProfile, resetToDefaults }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
