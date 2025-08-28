import React, { createContext, useContext, useState, ReactNode } from "react";

export type User = {
  name: string;
  email: string;
  avatar: any;
  dob: string;
  gender: "Male" | "Female" | "Other";
  height: string;
  weight: string;
  password?: string; // hashed password
};

const defaultUser: User = {
  name: "Jane Cooper",
  email: "janecooper@email.com",
  avatar: require("@/assets/images/placeholder.png"),
  dob: "21-05-2003",
  gender: "Male",
  height: "1.70m",
  weight: "56kg",
  password: "", // default empty
};

const UserContext = createContext<{
  user: User;
  setUser: (user: User) => void;
}>({
  user: defaultUser,
  setUser: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
