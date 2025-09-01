import React, { createContext, useContext, useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';

import "./global.css";
import { StatusBar } from "expo-status-bar";
import CustomHeader from "@/components/CustomHeader";
import { NotificationProvider } from "@/context/NotificationContext";
import { UserProvider, useUser, defaultUser } from "@/context/UserContext";
import { DietProvider } from "@/context/DietContext";
import apiClient from '@/utils/apiClients';

// --- No changes needed in AuthContext, useAuth, or AuthProvider ---

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []); // <-- Small optimization: dependencies not needed here

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}


function RootLayoutNav() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { userProfile, setUserProfile, isLoadingProfile } = useUser();
  const router = useRouter();
  const segments = useSegments();

  // Effect 1: Fetches the user's Firestore profile when they log in
  useEffect(() => {
    if (user && !userProfile) {
      const fetchUserProfile = async () => {
        try {
          const idToken = await user.getIdToken();
          const response = await apiClient.get('/api/v1/profile', {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (response.data.success) {
            setUserProfile(response.data.data);
          } else {
            console.warn("User profile not found on backend. Using default profile.");
            setUserProfile(defaultUser);
          }
        } catch (error) {
          console.error("Layout: Failed to fetch user profile:", error);
          setUserProfile(defaultUser);
        }
      };
      fetchUserProfile();
    } else if (!user) {
      setUserProfile(null);
    }
    // FIX 1: The dependency array should ONLY react to the user's auth state changing.
    // Including `userProfile` can cause unnecessary re-runs and race conditions.
  }, [user, setUserProfile]);

  // Effect 2: Handles all navigation logic based on auth and profile state
  useEffect(() => {
    if (isAuthLoading || isLoadingProfile) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/sign_in');
      return;
    }

    if (!user.emailVerified) {
      if (!inAuthGroup) router.replace('/(auth)/sign_in');
      return;
    }

    if (userProfile) {
      if (userProfile.onboardingComplete) {
        // ONBOARDING COMPLETE: User belongs in the main app.
        // FIX 2: Redirect if the user is in EITHER the auth OR onboarding group.
        // This ensures that after completing onboarding, they are correctly moved to the app.
        if (inAuthGroup || inOnboardingGroup) {
          router.replace('/(tabs)');
        }
      } else {
        // ONBOARDING NOT COMPLETE: Force user to the onboarding flow.
        if (!inOnboardingGroup) {
            router.replace('/(onboarding)/age');
        }
      }
    }
  }, [user, userProfile, isAuthLoading, isLoadingProfile, segments, router]);

  if (isAuthLoading || isLoadingProfile) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="food/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: "Settings", headerShown: false }} />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          header: ({ options }) => <CustomHeader title={options.title || ""} />,
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: "Search",
          header: ({ options }) => <CustomHeader title={options.title || ""} />,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <UserProvider>
        <DietProvider>
          <NotificationProvider>
            <StatusBar style="auto" />
            <RootLayoutNav />
          </NotificationProvider>
        </DietProvider>
      </UserProvider>
    </AuthProvider>
  );
}