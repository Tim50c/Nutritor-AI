import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthStore = {
  getAccessToken: async () => {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (e) {
      console.log(e);
    }
  },
  storeAccessToken: async (value: string) => {
    try {
      await AsyncStorage.setItem('access_token', value);
    } catch (e) {
      console.log(e);
    }
  },
  getRefreshToken: async () => {
    try {
      await AsyncStorage.getItem('refresh_token');
    } catch (e) {
      console.log(e);
    }
  },
  storeRefreshToken: async (value: string) => {
    try {
      await AsyncStorage.setItem('refresh_token', value);
    } catch (e) {
      console.log(e);
    }
  },
  removeTokens: async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
    } catch (e) {
      console.log(e);
    }
  }
}

export default AuthStore;