import React, { createContext, useContext, useState, ReactNode } from "react";
import { auth } from "../config/firebase"; // <-- 1. Import Firebase auth

// 1. Define a type that MATCHES your Firestore user document
export type User = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar: any | null;
  dob: string;
  gender: "Male" | "Female" | "Other" | null;
  height: string | null;
  weightCurrent: string | null;
  weightGoal: string | null;
  onboardingComplete: boolean; 
  password?: string; // hashed password
};


// 2. Define the type for the context's value
type UserContextType = {
  userProfile: User | null;
  setUserProfile: (profile: User | null) => void;
  isLoadingProfile: boolean;
  logout: () => Promise<void>; // <-- 2. Add logout to the type definition
};

// 3. Create the context with a default state
const UserContext = createContext<UserContextType>({
  userProfile: null,
  setUserProfile: () => {},
  isLoadingProfile: true,
  logout: async () => {}, // <-- 3. Add a default async function
});

// 4. Create the custom hook to use the context
export const useUser = () => useContext(UserContext);

export const defaultUser: User = {
  id: "default-id",
  firstname: "Jane",
  lastname: "Cooper",
  email: "janecooper@email.com",
  avatar: require("@/assets/images/placeholder.png"),
  dob: "21-05-2003",
  gender: "Male",
  height: "1.70m",
  weightCurrent: "56kg",
  weightGoal: "60kg",
  onboardingComplete: true,
  password: "",
};

// 5. Create the Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const handleSetUserProfile = (profile: User | null) => {
    setUserProfile(profile);
    setIsLoadingProfile(false);
  };

  // <-- 4. Implement the logout function
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out from Firebase
      handleSetUserProfile(null); // Clear the user profile in the app state
    } catch (error) {
      console.error("Error signing out: ", error);
      // You could optionally re-throw the error or handle it here
    }
  };

  const value = {
    userProfile,
    setUserProfile: handleSetUserProfile,
    isLoadingProfile,
    logout: handleLogout, // <-- 5. Provide the logout function in the context value
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};