import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { auth } from "../config/firebase";
import NutritionModel from "@/models/nutrition-model";
import { onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { SearchService, AnalysisService } from "@/services";

// 1. Define a type that accurately reflects the backend data model
export type User = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar: string | null;
  dob: any;
  gender: "Male" | "Female" | "Other" | null;
  height: number | null; // Stored as cm
  weightCurrent: number | null; // Stored as kg
  weightGoal: number | null;
  targetNutrition?: NutritionModel;
  onboardingComplete: boolean;
  unitPreferences: {
    weight: "kg" | "lbs";
    height: "cm" | "ft";
  };
};

// Default user object for fallback scenarios
export const defaultUser: User = {
  id: "",
  firstname: "",
  lastname: "",
  email: "",
  avatar: null,
  dob: null,
  gender: null,
  height: null,
  weightCurrent: null,
  weightGoal: null,
  onboardingComplete: false,
  unitPreferences: {
    weight: "kg",
    height: "cm",
  },
};

type UserContextType = {
  userProfile: User | null;
  setUserProfile: (profile: User | null) => void;
  isLoadingProfile: boolean;
  logout: () => Promise<void>;
  refetchUserProfile: () => void; // Add a refetch function
};

const UserContext = createContext<UserContextType>({
  userProfile: null,
  setUserProfile: () => {},
  isLoadingProfile: true,
  logout: async () => {},
  refetchUserProfile: () => {}, // Default empty function
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(
    null
  );

  // Effect to listen for authentication changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user); // Store the current firebase user
      if (user) {
        // User is signed in, fetch their profile from our backend
        fetchUserProfile(user);
      } else {
        // User is signed out, clear profile
        setUserProfile(null);
        setIsLoadingProfile(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (
    user: FirebaseAuthUser,
    skipCache: boolean = false
  ) => {
    setIsLoadingProfile(true);
    try {
      const token = await user.getIdToken();
      const API_URL = process.env.EXPO_PUBLIC_API_URL;

      const response = await fetch(`${API_URL}/api/v1/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If response is not ok, try to read it as text to see the HTML error
        const errorText = await response.text();
        console.error(
          "Failed to fetch profile. Server responded with:",
          errorText
        );
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUserProfile(result.data);

        // Only load foods cache on initial load, not on refresh
        if (!skipCache) {
          try {
            console.log("🔄 Loading foods cache...");
            const cacheResult = await SearchService.loadFoodsCache();
            if (cacheResult.success) {
              console.log(`✅ Foods cache loaded: ${cacheResult.count} foods`);
            } else {
              console.log(
                "⚠️ Failed to load foods cache:",
                cacheResult.message
              );
            }
          } catch (cacheError) {
            console.error("❌ Error loading foods cache:", cacheError);
            // Don't throw here - profile loading should still succeed even if cache fails
          }
        }
      } else {
        throw new Error(result.error || "Could not get user data");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null); // Clear profile on error
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUserProfile(null); // This is handled by onAuthStateChanged, but good for immediate feedback
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Function to allow manual refetching from other components if needed
  const handleRefetch = async () => {
    if (firebaseUser) {
      // Clear analytics cache before refetching profile to ensure fresh analytics data
      AnalysisService.clearCache();
      console.log(
        "🗑️ [UserContext] Analytics cache cleared before profile refetch"
      );

      // Don't set isLoadingProfile to true during refresh to avoid navigation issues
      // Just refresh the profile data silently
      try {
        const token = await firebaseUser.getIdToken();
        const API_URL = process.env.EXPO_PUBLIC_API_URL;

        const response = await fetch(`${API_URL}/api/v1/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUserProfile(result.data);
            console.log("✅ [UserContext] Profile refreshed successfully");
          }
        }
      } catch (error) {
        console.error("❌ [UserContext] Error refreshing profile:", error);
        // Don't clear profile on error during refresh
      }
    }
  };

  const value = {
    userProfile,
    setUserProfile,
    isLoadingProfile,
    logout: handleLogout,
    refetchUserProfile: handleRefetch,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
