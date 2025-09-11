import CustomHeader from "@/components/CustomHeader";
import CustomSplashScreen from "@/components/CustomSplashScreen";
import LoadingScreen from "@/components/LoadingScreen";
import { auth } from "@/config/firebase";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { DietProvider } from "@/context/DietContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { defaultUser, UserProvider, useUser } from "@/context/UserContext";
import ServerWarmupService from "@/services/server-warmup-service";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { useIsDark } from "@/theme/useIsDark";
import apiClient from "@/utils/apiClients";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged, User } from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform, StatusBar as RNStatusBar, View } from "react-native";
import "./global.css";

// Prevent native splash from auto-hiding
SplashScreen.preventAutoHideAsync().catch(console.warn);

// Note: Removed SplashScreen.preventAutoHideAsync() to fix stuck splash screen in Expo Go

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

function AppContentWithSplashHandling({
  isWarmingUp,
  isAppReady,
}: {
  isWarmingUp: boolean;
  isAppReady: boolean;
}) {
  // Show loading screen if server is still warming up after splash
  if (isWarmingUp && isAppReady) {
    console.log("🎯 [Layout] Showing LoadingScreen (server warming up)");
    return <LoadingScreen showLoadingText={true} />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { userProfile, setUserProfile, isLoadingProfile } = useUser();
  const router = useRouter();
  const segments = useSegments();
  const [allowOnboardingAccess, setAllowOnboardingAccess] = useState(false);

  // Check for onboarding access flag with immediate update capability
  useEffect(() => {
    const checkOnboardingFlag = async () => {
      try {
        const flag = await AsyncStorage.getItem("allowOnboardingAccess");
        const shouldAllow = flag === "true";
        setAllowOnboardingAccess(shouldAllow);
        console.log("🔍 [Layout] Initial flag check:", {
          flag,
          shouldAllow,
          currentSegments: segments,
        });
      } catch (error) {
        console.warn("Error checking onboarding flag:", error);
        setAllowOnboardingAccess(false);
      }
    };
    checkOnboardingFlag();

    // More aggressive monitoring for flag changes
    const checkOnInterval = setInterval(async () => {
      try {
        const flag = await AsyncStorage.getItem("allowOnboardingAccess");
        const shouldAllow = flag === "true";
        setAllowOnboardingAccess((prev) => {
          if (prev !== shouldAllow) {
            console.log("🔄 [Layout] Flag changed:", { prev, shouldAllow });
            return shouldAllow;
          }
          return prev;
        });
      } catch (error) {
        // Silent fail for interval checks
      }
    }, 50); // Check every 50ms for faster response

    // Clear interval after 10 seconds instead of 5 for longer monitoring
    const clearTimer = setTimeout(() => {
      clearInterval(checkOnInterval);
      console.log("🔄 [Layout] Stopping aggressive flag monitoring");
    }, 10000);

    return () => {
      clearInterval(checkOnInterval);
      clearTimeout(clearTimer);
    };
  }, []); // Initial check only

  // Check flag immediately when segments change (especially when entering onboarding)
  useEffect(() => {
    const checkFlagOnNavigation = async () => {
      // Only check if we're navigating to onboarding
      const isNavigatingToOnboarding = segments.includes("(onboarding)");
      if (isNavigatingToOnboarding) {
        try {
          // Multiple quick checks to ensure we catch the flag
          for (let i = 0; i < 3; i++) {
            const flag = await AsyncStorage.getItem("allowOnboardingAccess");
            const shouldAllow = flag === "true";
            console.log(
              `🚀 [Layout] Quick flag check ${i + 1} for onboarding navigation:`,
              { flag, shouldAllow, segments }
            );

            if (shouldAllow) {
              setAllowOnboardingAccess(true);
              console.log("✅ [Layout] Onboarding access granted");
              break;
            }

            // Wait a bit before next check
            if (i < 2) await new Promise((resolve) => setTimeout(resolve, 50));
          }
        } catch (error) {
          console.warn("Error checking onboarding flag on navigation:", error);
        }
      } else {
        // If we're leaving onboarding and flag is still set, clean it up after a delay
        if (allowOnboardingAccess) {
          console.log(
            "🧹 [Layout] Scheduling cleanup of onboarding access flag"
          );
          setTimeout(async () => {
            try {
              await AsyncStorage.removeItem("allowOnboardingAccess");
              setAllowOnboardingAccess(false);
              console.log("✅ [Layout] Cleaned up onboarding access flag");
            } catch (error) {
              console.warn("Error cleaning up onboarding flag:", error);
            }
          }, 2000); // Wait 2 seconds before cleanup
        }
      }
    };

    checkFlagOnNavigation();
  }, [segments, allowOnboardingAccess]); // Watch both segments and flag state

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
        // Check if we have permission to access onboarding (for goal updates)
        if (allowOnboardingAccess && inOnboardingGroup) {
          // Allow access to onboarding for goal updates
          console.log("✅ [Layout] Allowing onboarding access for goal update");
          return; // Don't redirect, stay in onboarding
        }

        // If trying to access onboarding but no permission, check the flag one more time
        if (inOnboardingGroup && !allowOnboardingAccess) {
          // Quick check of the flag before redirecting
          AsyncStorage.getItem("allowOnboardingAccess")
            .then((flag) => {
              if (flag === "true") {
                console.log(
                  "🔄 [Layout] Found onboarding flag on last check, allowing access"
                );
                setAllowOnboardingAccess(true);
                return;
              } else {
                console.log(
                  "❌ [Layout] No onboarding access, redirecting to tabs"
                );
                router.replace("/(tabs)");
              }
            })
            .catch(() => {
              console.log(
                "❌ [Layout] Error checking flag, redirecting to tabs"
              );
              router.replace("/(tabs)");
            });
          return;
        }

        // ONBOARDING COMPLETE: User belongs in the main app.
        if (inAuthGroup || (inOnboardingGroup && !allowOnboardingAccess)) {
          router.replace("/(tabs)");
        }
      } else {
        // ONBOARDING NOT COMPLETE: Force user to the onboarding flow.
        if (!inOnboardingGroup) {
          router.replace("/(onboarding)/age");
        }
      }
    }
  }, [
    user,
    userProfile,
    isAuthLoading,
    isLoadingProfile,
    segments,
    router,
    allowOnboardingAccess,
  ]);

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

function DynamicStatusBar() {
  const isDark = useIsDark();
  return (
    <StatusBar
      style={isDark ? "light" : "dark"}
      backgroundColor={isDark ? "#111214" : "white"}
    />
  );
}

export default function RootLayout() {
  // Track font loading time
  const [fontLoadStartTime] = useState(() => Date.now());
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

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

  const handleSplashComplete = useCallback(() => {
    console.log("🎯 [Layout] Splash animation completed");
    setShowCustomSplash(false);
    setIsAppReady(true);
    // Hide native splash after custom splash completes
    SplashScreen.hideAsync().catch(console.warn);
  }, []);

  useEffect(() => {
    if (error) {
      const loadTime = Date.now() - fontLoadStartTime;
      console.log(`❌ Font loading failed after ${loadTime}ms:`, error);
      throw error;
    }

    if (fontsLoaded) {
      const loadTime = Date.now() - fontLoadStartTime;
      console.log(`✅ Fonts loaded successfully in ${loadTime}ms`);
    }
  }, [fontsLoaded, error, fontLoadStartTime]);

  // Failsafe timeout to hide splash screen after 8 seconds
  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      if (showCustomSplash) {
        console.warn("🚨 [Layout] Splash screen timeout reached, forcing hide");
        handleSplashComplete();
      }
    }, 8000);

    return () => clearTimeout(splashTimeout);
  }, [showCustomSplash, handleSplashComplete]);

  // Warm up the server when the app launches
  useEffect(() => {
    // Start server warmup immediately, don't wait for fonts
    setIsWarmingUp(true);
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
        setIsWarmingUp(false);
      });
  }, []); // Run once on mount

  // Debug current state
  console.log("🎯 [Layout] Render State:", {
    fontsLoaded,
    showCustomSplash,
    isAppReady,
    isWarmingUp,
    error: !!error,
  });

  if (error) {
    const loadTime = Date.now() - fontLoadStartTime;
    console.log(`❌ Font loading failed after ${loadTime}ms:`, error);
    throw error;
  }

  // Always show custom splash screen first, regardless of other states
  if (showCustomSplash) {
    console.log("🎯 [Layout] Showing CustomSplashScreen");
    return (
      <CustomSplashScreen
        onAnimationComplete={handleSplashComplete}
        showLoadingText={true}
      />
    );
  }

  // Don't show the main app until fonts are loaded after splash is complete
  if (!fontsLoaded) {
    console.log(
      "🎯 [Layout] Splash complete but fonts not loaded, showing loading"
    );
    return <LoadingScreen showLoadingText={true} />;
  }

  console.log("🎯 [Layout] Showing main app");

  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <UserProvider>
          <OnboardingProvider>
            <DietProvider>
              <AnalyticsProvider>
                <NotificationProvider>
                  <ThemeProvider>
                    <DynamicStatusBar />
                    <AppContentWithSplashHandling
                      isWarmingUp={isWarmingUp}
                      isAppReady={isAppReady}
                    />
                  </ThemeProvider>
                </NotificationProvider>
              </AnalyticsProvider>
            </DietProvider>
          </OnboardingProvider>
        </UserProvider>
      </AuthProvider>
    </View>
  );
}
