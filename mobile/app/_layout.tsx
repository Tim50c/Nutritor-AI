// import {Stack} from "expo-router";
// import "./global.css";
// import {StatusBar} from "expo-status-bar";
// import CustomHeader from "@/components/CustomHeader";
// import {NotificationProvider} from "@/context/NotificationContext";
// import {UserProvider} from "@/context/UserContext";
// import {DietProvider} from "@/context/DietContext";

// export default function RootLayout() {
//   return (
//     <UserProvider>
//       <DietProvider>
//         <NotificationProvider>
//           <StatusBar style="auto"/>
//           <Stack>
//             <Stack.Screen
//               name="(tabs)"
//               options={{
//                 headerShown: false,
//               }}
//             />
//             <Stack.Screen
//               name="food/[id]"
//               options={{
//                 headerShown: false,
//               }}
//             />
//             <Stack.Screen
//               name="settings"
//               options={{
//                 title: "Settings",
//                 headerShown: false,
//               }}
//             />
//             <Stack.Screen
//               name="notifications"
//               options={{
//                 title: "Notifications",
//                 header: ({options}) => (
//                   <CustomHeader title={options.title || ""}/>
//                 ),
//               }}
//             />
//             <Stack.Screen
//               name="search"
//               options={{
//                 title: "Search",
//                 header: ({options}) => (
//                   <CustomHeader title={options.title || ""}/>
//                 )
//               }}
//             />
//           </Stack>
//         </NotificationProvider>
//       </DietProvider>
//     </UserProvider>
//   );
// }


import React, { createContext, useContext, useState, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase'; // Adjust this path if necessary

// Your existing imports
import "./global.css";
import { StatusBar } from "expo-status-bar";
import CustomHeader from "@/components/CustomHeader";
import { NotificationProvider } from "@/context/NotificationContext";
import { UserProvider , useUser, defaultUser } from "@/context/UserContext";
import { DietProvider } from "@/context/DietContext";

 
import apiClient from '@/utils/apiClients'; // Import your api client


// 1. Define and Create the Auth Context
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

// 2. Custom hook to easily access auth state
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. The Auth Provider Component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  },[user, isLoading] );

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}


// This component now contains your original Stack navigator and the redirection logic
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

          // --- CHANGE START ---
          if (response.data.success) {
            // Happy path: Profile found, store it in the context.
            setUserProfile(response.data.data);
          } else {
            // Sad path 1: Backend says profile not found. Use the default.
            console.warn("User profile not found on backend. Using default profile.");
            setUserProfile(defaultUser);
          }
          // --- CHANGE END ---

        } catch (error) {
          // --- CHANGE START ---
          // Sad path 2: Network error or server crash. Use the default.
          console.error("Layout: Failed to fetch user profile:", error);
          setUserProfile(defaultUser);
          // --- CHANGE END ---
        }
      };
      fetchUserProfile();
    } else if (!user) {
      // When the user explicitly logs out, clear the profile to null.
      setUserProfile(null);
    }
  }, [setUserProfile, user, userProfile]);

  // Effect 2: Handles all navigation logic based on auth and profile state
  useEffect(() => {
    // Wait until BOTH Firebase auth and our profile fetch are finished
    if (isAuthLoading || isLoadingProfile) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    // Case 1: No user. Must be on an auth screen.
    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/sign_in');
      return;
    }

    // Case 2: User exists but not verified. Must be on an auth screen.
    if (!user.emailVerified) {
      if (!inAuthGroup) router.replace('/(auth)/sign_in');
      return;
    }

    // Case 3: User is verified. Now check their profile for onboarding.
    if (userProfile) {
      if (userProfile.onboardingComplete) {
        // ONBOARDING COMPLETE: User belongs in the main app.
        if (inAuthGroup) {
          router.replace('/(tabs)');
        }
      } else {
        // ONBOARDING NOT COMPLETE: Force user to the onboarding flow.
        // This check prevents an infinite redirect loop to the onboarding screen.
        const inOnboardingGroup = segments[0] === '(onboarding)';
        if (!inOnboardingGroup) {
            router.replace('/(onboarding)/age');
        }
      }
    }
  }, [user, userProfile, isAuthLoading, isLoadingProfile, segments, router]);

  // Show nothing while loading to prevent screen flicker
  if (isAuthLoading || isLoadingProfile) {
    return null;
  }

  // This is YOUR original Stack navigator, now with the (auth) screen added
  return (
    <Stack>
      {/* THIS IS THE KEY FIX: Declares the auth group to TypeScript */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      {/* Your existing screens */}
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


// The final export wraps everything in the correct provider order
export default function RootLayout() {
  return (
    // AuthProvider should wrap other providers that might need user data
    <AuthProvider>
      <UserProvider>
        <DietProvider>
          <NotificationProvider>
            <StatusBar style="auto" />
            {/* The component with the navigation logic and your stack */}
            <RootLayoutNav />
          </NotificationProvider>
        </DietProvider>
      </UserProvider>
    </AuthProvider>
  );
}