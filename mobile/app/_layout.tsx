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
import { auth } from '../config/firebase'; // Adjust this path if necessary

// Your existing imports
import "./global.css";
import { StatusBar } from "expo-status-bar";
import CustomHeader from "@/components/CustomHeader";
import { NotificationProvider } from "@/context/NotificationContext";
import { UserProvider } from "@/context/UserContext";
import { DietProvider } from "@/context/DietContext";

// --- START: Authentication Logic ---

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
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- END: Authentication Logic ---

// This component now contains your original Stack navigator and the redirection logic
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return; // Wait until Firebase check is complete

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
      // User is logged in
      if (user.emailVerified) {
        // --- User's email IS verified ---
        // If they are on an auth screen, send them to the main app.
        if (inAuthGroup) {
          router.replace('/(tabs)');
        }
      } else {
        // --- User's email IS NOT verified ---
        // They should be in the auth flow. If they somehow escape to
        // a screen outside of the '(auth)' group, force them back to sign_in.
        // On the sign_in screen, they can be prompted to resend verification.
        if (!inAuthGroup) {
          router.replace('/sign_in');
        }
        // If they are already in the auth group (e.g., on the prompt_verification screen),
        // we do nothing and let them stay there.
      }
    } else {
      // --- User is NOT logged in ---
      // If they are not on an auth screen, send them to the sign-in page.
      if (!inAuthGroup) {
        router.replace('/sign_in');
      }
    }
  }, [user, isLoading, segments]);

  // While loading auth state, you can show a splash screen or null
  if (isLoading) {
    return null; 
  }

  // This is YOUR original Stack navigator, now with the (auth) screen added
  return (
    <Stack>
      {/* THIS IS THE KEY FIX: Declares the auth group to TypeScript */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />

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