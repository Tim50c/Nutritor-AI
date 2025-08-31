import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingData {
  age: number;
  gender: 'Female' | 'Male' | 'Other' | null;
  weightCurrent: number;
  weightGoal: number;
  weightUnit: 'Kg' | 'Lbs';
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
    weightUnit: 'Kg',
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