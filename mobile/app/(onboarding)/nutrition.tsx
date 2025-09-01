// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   SafeAreaView, 
//   StyleSheet, 
//   ScrollView, 
//   TouchableOpacity, 
//   Image,
//   Alert 
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useOnboarding } from '../../context/OnboardingContext';

// import CustomButtonAuth from '../../components/CustomButtonAuth';
// import FormField from '../../components/FormField';

// // Assuming your back arrow image is in the assets/images folder
// const backArrowIcon = require('../../assets/images/back-arrow.png');

// export default function NutritionScreen() {
//   const router = useRouter();
//   const { data, updateData } = useOnboarding();

//   // Initialize state from context, ensuring they are strings for the TextInput
//   const [calories, setCalories] = useState(data.targetNutrition?.calories?.toString() || '2000');
//   const [protein, setProtein] = useState(data.targetNutrition?.protein?.toString() || '200');
//   const [carbs, setCarbs] = useState(data.targetNutrition?.carbs?.toString() || '500');
//   const [fat, setFat] = useState(data.targetNutrition?.fat?.toString() || '50');
//   const [fiber, setFiber] = useState(data.targetNutrition?.fiber?.toString() || '60');

//   const handleNext = () => {
//     // Validate that all fields contain valid, non-negative numbers
//     const numericValues = {
//         calories: Number(calories),
//         protein: Number(protein),
//         carbs: Number(carbs),
//         fat: Number(fat),
//         fiber: Number(fiber),
//     };

//     for (const key in numericValues) {
//         if (isNaN(numericValues[key]) || numericValues[key] < 0) {
//             Alert.alert('Invalid Input', `Please enter a valid, non-negative number for ${key}.`);
//             return;
//         }
//     }

//     updateData({ targetNutrition: numericValues });
//     router.push('/(onboarding)/completion');
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={styles.scrollContainer}>
//         <View style={styles.header}>
//             <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//                 <Image source={backArrowIcon} style={styles.backButtonIcon} resizeMode="contain" />
//             </TouchableOpacity>
//         </View>

//         <Text style={styles.title}>Complete your profile</Text>
//         <Text style={styles.subtitle}>
//           Set up your profile in just four simple steps and start tracking your daily calorie intake with ease.
//         </Text>

//         {/* Form Fields */}
//         <View>
//           <FormField
//             label="Maintenance calories"
//             value={calories}
//             onChangeText={setCalories}
//             keyboardType="number-pad"
//           />
//           <FormField
//             label="Protein goal"
//             value={protein}
//             onChangeText={setProtein}
//             keyboardType="number-pad"
//           />
//           <FormField
//             label="Carb goal"
//             value={carbs}
//             onChangeText={setCarbs}
//             keyboardType="number-pad"
//           />
//           <FormField
//             label="Fat goal"
//             value={fat}
//             onChangeText={setFat}
//             keyboardType="number-pad"
//           />
//           <FormField
//             label="Fiber goal"
//             value={fiber}
//             onChangeText={setFiber}
//             keyboardType="number-pad"
//           />
//         </View>

//         <View style={styles.buttonContainer}>
//           <CustomButtonAuth
//             title="Next"
//             onPress={handleNext}
//           />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: 24,
//     paddingTop: 20,
//   },
//   header: {
//     alignSelf: 'flex-start',
//     marginBottom: 40,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#1E1E1E',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   backButtonIcon: {
//     width: 20,
//     height: 20,
//     tintColor: '#FFFFFF', // Makes the icon white
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1E1E1E',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#8A8A8E',
//     textAlign: 'center',
//     marginBottom: 32,
//     paddingHorizontal: 16,
//   },
//   buttonContainer: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     paddingBottom: 40,
//     marginTop: 20,
//   },
// });