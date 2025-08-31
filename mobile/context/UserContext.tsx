// import React, { createContext, useContext, useState, ReactNode } from "react";

// export type User = {
//   name: string;
//   email: string;
//   avatar: any;
//   dob: string;
//   gender: "Male" | "Female" | "Other";
//   height: string;
//   weight: string;
//   password?: string; // hashed password
// };

import { UserProfile } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
// const defaultUser: User = {
//   name: "Jane Cooper",
//   email: "janecooper@email.com",
//   avatar: require("@/assets/images/placeholder.png"),
//   dob: "21-05-2003",
//   gender: "Male",
//   height: "1.70m",
//   weight: "56kg",
//   password: "", // default empty
// };

// const UserContext = createContext<{
//   user: User;
//   setUser: (user: User) => void;
// }>({
//   user: defaultUser,
//   setUser: () => {},
// });

// export const useUser = () => useContext(UserContext);

// export const UserProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User>(defaultUser);
//   return (
//     <UserContext.Provider value={{ user, setUser }}>
//       {children}
//     </UserContext.Provider>
//   );
// };


// context/UserContext.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";

// 1. Define a type that MATCHES your Firestore user document
export type User = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar: any;
  dob: string;
  gender: "Male" | "Female" | "Other" | null;
  height: string | null;
  weightCurrent: string | null;
  weightGoal: string | null;
  onboardingComplete: boolean; 
  password?: string; // hashed password
};

// export type User = {
//   name: string;
//   email: string;
//   avatar: any;
//   dob: string;
//   gender: "Male" | "Female" | "Other";
//   height: string;
//   weight: string;
//   password?: string; // hashed password
// };

// 2. Define the type for the context's value
type UserContextType = {
  userProfile: User | null;
  setUserProfile: (profile: User | null) => void;
  isLoadingProfile: boolean;
};

// 3. Create the context with a default state
const UserContext = createContext<UserContextType>({
  userProfile: null,         // Initially, there is no user profile
  setUserProfile: () => {},  // A placeholder function
  isLoadingProfile: true,    // We start in a loading state until we check
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
  // This loading state is true until we fetch the profile for the first time
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // We create a wrapper function so that whenever we set a profile,
  // we automatically mark loading as complete.
  const handleSetUserProfile = (profile: User | null) => {
    setUserProfile(profile);
    setIsLoadingProfile(false);
  };

  const value = {
    userProfile,
    setUserProfile: handleSetUserProfile,
    isLoadingProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
