// import React, { useState } from 'react';
// import { View, Text, SafeAreaView, StyleSheet, Image, Alert } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useOnboarding } from '../../context/OnboardingContext';
// import { useUser } from '../../context/UserContext';
// import { auth } from '../../config/firebase';
// import apiClient from '../../utils/apiClient'; // Ensure this path is correct

// import CustomButtonAuth from '../../components/CustomButtonAuth';

// // Assuming your celebration image is in the assets/images folder
// const celebrationImage = require('../../assets/images/celebration.png');

// export default function CompletionScreen() {
//   const router = useRouter();
//   const { data } = useOnboarding();
//   const { setUserProfile } = useUser();
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleFinishOnboarding = async () => {
//     setIsSubmitting(true);
//     try {
//       const user = auth.currentUser;
//       if (!user) {
//         throw new Error("Authentication error. Please sign in again.");
//       }
//       const idToken = await user.getIdToken();

//       // Convert age to a Date of Birth string (YYYY-MM-DD)
//       const currentYear = new Date().getFullYear();
//       const birthYear = currentYear - data.age;
//       const dob = new Date(birthYear, 0, 1).toISOString();

//       const profilePayload = {
//         dob,
//         gender: data.gender,
//         weightCurrent: data.weightCurrent,
//         weightGoal: data.weightGoal,
//         targetNutrition: data.targetNutrition,
//         onboardingComplete: true, // This flag finalizes the setup
//       };
      
//       // Use PATCH to update the existing user profile
//       const response = await apiClient.patch('/profile', profilePayload, {
//         headers: { Authorization: `Bearer ${idToken}` }
//       });

//       if (response.data.success) {
//         // Fetch the complete, updated profile from the server
//         const updatedProfileResponse = await apiClient.get('/profile', {
//             headers: { Authorization: `Bearer ${idToken}` },
//         });

//         if (updatedProfileResponse.data.success) {
//             // Update the global user context. The useEffect in your _layout.tsx
//             // will detect this change and navigate to the main app.
//             setUserProfile(updatedProfileResponse.data.data);
//         } else {
//              throw new Error('Failed to retrieve updated profile after setup.');
//         }
//       } else {
//         throw new Error(response.data.error || "An unknown error occurred while saving your profile.");
//       }

//     } catch (error: any) {
//       console.error("Onboarding completion failed:", error);
//       Alert.alert(
//         "Setup Failed", 
//         error.message || "Could not complete your profile setup. Please try again."
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.content}>
//         <Image source={celebrationImage} style={styles.image} resizeMode="contain" />
//         <Text style={styles.title}>Profile Setup Complete!</Text>
//         <Text style={styles.subtitle}>
//           Great job — you’re all set to start tracking your meals and reaching your goals.
//         </Text>
//       </View>
//       <View style={styles.buttonContainer}>
//         <CustomButtonAuth
//           title="Start your tracking journey"
//           onPress={handleFinishOnboarding}
//           isLoading={isSubmitting}
//         />
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//   },
//   content: {
//     flex: 3, // Takes more space to center vertically
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   image: {
//     width: 220,
//     height: 220,
//     marginBottom: 48,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#1E1E1E',
//     textAlign: 'center',
//     marginBottom: 16,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#8A8A8E',
//     textAlign: 'center',
//     lineHeight: 24,
//     maxWidth: '95%',
//   },
//   buttonContainer: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     width: '100%',
//     paddingBottom: 40,
//   },
// });