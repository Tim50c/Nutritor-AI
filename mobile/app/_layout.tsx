import React, { createContext, useContext, useState, useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/config/firebase";
import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StatusBar as RNStatusBar,
  View,
  ActivityIndicator,
} from "react-native";
import "./global.css";
import CustomHeader from "@/components/CustomHeader";
import LoadingScreen from "@/components/LoadingScreen";
import CustomSplashScreen from "@/components/CustomSplashScreen";
import { NotificationProvider } from "@/context/NotificationContext";
import { UserProvider, useUser, defaultUser } from "@/context/UserContext";
import { DietProvider } from "@/context/DietContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import apiClient from "@/utils/apiClients";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import ServerWarmupService from "@/services/server-warmup-service";

SplashScreen.preventAutoHideAsync();

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
          // Add a small delay to allow backend registration to complete during sign-up
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const idToken = await user.getIdToken();
          const response = await apiClient.get("/api/v1/profile", {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (response.data.success) {
            setUserProfile(response.data.data);
          } else {
            console.warn(
              "User profile not found on backend. Using default profile."
            );
            setUserProfile(defaultUser);
          }
        } catch (error: any) {
          // If it's a 404, the profile might not be created yet. Retry once after a longer delay.
          if (error.response?.status === 404) {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            try {
              const idToken = await user.getIdToken();
              const retryResponse = await apiClient.get("/api/v1/profile", {
                headers: { Authorization: `Bearer ${idToken}` },
              });

              if (retryResponse.data.success) {
                setUserProfile(retryResponse.data.data);
                return;
              }
            } catch (retryError) {
              // Retry failed, fall through to default
            }
          }

          // Use default profile on any error
          setUserProfile(defaultUser);
        }
      };
      fetchUserProfile();
    } else if (!user) {
      setUserProfile(null);
    }
  }, [user, setUserProfile]);

  // Effect 2: Handles all navigation logic based on auth and profile state
  useEffect(() => {
    // Wait until BOTH Firebase auth and our profile fetch are finished
    if (isAuthLoading || isLoadingProfile) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    // Case 1: No user. Must be on an auth screen.
    if (!user) {
      if (!inAuthGroup) router.replace("/(auth)/sign_in");
      return;
    }

    // Case 2: User exists but not verified. Must be on an auth screen.
    if (!user.emailVerified) {
      if (!inAuthGroup) router.replace("/(auth)/sign_in");
      return;
    }

    // Case 3: User is verified. Now check their profile for onboarding.
    if (userProfile) {
      if (userProfile.onboardingComplete) {
        // ONBOARDING COMPLETE: User belongs in the main app.
        if (inAuthGroup || inOnboardingGroup) {
          router.replace("/(tabs)");
        }
      } else {
        // ONBOARDING NOT COMPLETE: Force user to the onboarding flow.
        if (!inOnboardingGroup) {
          router.replace("/(onboarding)/age");
        }
      }
    }
  }, [user, userProfile, isAuthLoading, isLoadingProfile, segments, router]);

  if (isAuthLoading || isLoadingProfile) {
    return <LoadingScreen showLoadingText={true} />;
  }

  return (
    <Stack
      screenOptions={{
        // ✅ Add this to prevent Android status bar overlay
        contentStyle: {
          paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
        },
        headerShown: false, // Default header setting
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="food/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerShown: false,
          header: ({ options }) => <CustomHeader title={options.title || ""} />,
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  // Track font loading time
  const [fontLoadStartTime] = useState(() => Date.now());
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowCustomSplash(false);
    SplashScreen.hideAsync();
  };

  const [fontsLoaded, error] = useFonts({
    "SF-Pro-Display-Black": require("../assets/fonts/SF-Pro-Display-Black.otf"),
    "SF-Pro-Display-BlackItalic": require("../assets/fonts/SF-Pro-Display-BlackItalic.otf"),
    "SF-Pro-Display-Bold": require("../assets/fonts/SF-Pro-Display-Bold.otf"),
    "SF-Pro-Display-BoldItalic": require("../assets/fonts/SF-Pro-Display-BoldItalic.otf"),
    "SF-Pro-Display-Heavy": require("../assets/fonts/SF-Pro-Display-Heavy.otf"),
    "SF-Pro-Display-HeavyItalic": require("../assets/fonts/SF-Pro-Display-HeavyItalic.otf"),
    "SF-Pro-Display-Light": require("../assets/fonts/SF-Pro-Display-Light.otf"),
    "SF-Pro-Display-LightItalic": require("../assets/fonts/SF-Pro-Display-LightItalic.otf"),
    "SF-Pro-Display-Medium": require("../assets/fonts/SF-Pro-Display-Medium.otf"),
    "SF-Pro-Display-MediumItalic": require("../assets/fonts/SF-Pro-Display-MediumItalic.otf"),
    "SF-Pro-Display-Regular": require("../assets/fonts/SF-Pro-Display-Regular.otf"),
    "SF-Pro-Display-RegularItalic": require("../assets/fonts/SF-Pro-Display-RegularItalic.otf"),
    "SF-Pro-Display-Semibold": require("../assets/fonts/SF-Pro-Display-Semibold.otf"),
    "SF-Pro-Display-SemiboldItalic": require("../assets/fonts/SF-Pro-Display-SemiboldItalic.otf"),
    "SF-Pro-Display-Thin": require("../assets/fonts/SF-Pro-Display-Thin.otf"),
    "SF-Pro-Display-ThinItalic": require("../assets/fonts/SF-Pro-Display-ThinItalic.otf"),
    "SF-Pro-Display-Ultralight": require("../assets/fonts/SF-Pro-Display-Ultralight.otf"),
    "SF-Pro-Display-UltralightItalic": require("../assets/fonts/SF-Pro-Display-UltralightItalic.otf"),
  });

  useEffect(() => {
    if (error) {
      const loadTime = Date.now() - fontLoadStartTime;
      console.log(`❌ Font loading failed after ${loadTime}ms:`, error);
      throw error;
    }

    if (fontsLoaded) {
      const loadTime = Date.now() - fontLoadStartTime;
      console.log(`✅ Fonts loaded successfully in ${loadTime}ms`);
      // Don't hide splash screen immediately, let custom splash handle it
    }
  }, [fontsLoaded, error, fontLoadStartTime]);

  // Warm up the server when the app launches
  useEffect(() => {
    if (fontsLoaded) {
      setIsWarmingUp(true);
      // Start server warmup in the background
      ServerWarmupService.warmupServer()
        .then(() => {
          console.log("🚀 [App] Server warmup completed successfully");
        })
        .catch((error) => {
          console.warn(
            "🚀 [App] Server warmup failed, but app will continue:",
            error.message
          );
        })
        .finally(() => {
          // Add a small delay so user can see the loading text
          setTimeout(() => {
            setIsWarmingUp(false);
          }, 1000);
        });
    }
  }, [fontsLoaded]);

  // Show custom splash screen first (before fonts are loaded)
  if (showCustomSplash) {
    return (
      <CustomSplashScreen 
        onAnimationComplete={handleSplashComplete}
        showLoadingText={true}
      />
    );
  }

  if (!fontsLoaded) {
    return null;
  }

  if (!fontsLoaded && !error) {
    return null;
  }

  // Show loading screen during server warmup
  if (isWarmingUp) {
    return <LoadingScreen showLoadingText={true} />;
  }

  return (
    <AuthProvider>
      <UserProvider>
        <DietProvider>
          <AnalyticsProvider>
            <NotificationProvider>
              <StatusBar style="dark" backgroundColor="white" />
              <RootLayoutNav />
            </NotificationProvider>
          </AnalyticsProvider>
        </DietProvider>
      </UserProvider>
    </AuthProvider>
  );
}
