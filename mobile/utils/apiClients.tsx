import axios from 'axios';

// 1. Get the base URL from your environment variables
const baseURL = process.env.EXPO_PUBLIC_API_URL;

// 2. Create an instance of Axios with a custom configuration
const apiClient = axios.create({
  baseURL: baseURL,
  // 3. Set a longer timeout. 60000ms = 60 seconds.
  // This gives Render's free instance plenty of time to "wake up".
  timeout: 60000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;