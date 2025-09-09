import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text } from "../components/CustomText";
import { useRouter } from "expo-router";
import { useDietContext, DietFood } from "@/context/DietContext";
import FoodSection from "@/components/FoodSection";
import { icons } from "@/constants/icons";
import CustomSlider from "@/components/CustomSlider";
import { Ionicons } from "@expo/vector-icons";
import { SearchService } from "@/services";
import { ISearchFoodsInput } from "@/interfaces";
import { FoodModel } from "@/models";
import LoadingSpinner from "@/components/LoadingSpinner";
import * as Animatable from 'react-native-animatable';

const AnimatableView = Animatable.createAnimatableComponent(View);

const nutrientRanges = {
  calories: { min: 0, max: 6000, step: 10 },
  protein: { min: 0, max: 400, step: 1 },
  fat: { min: 0, max: 200, step: 1 },
  carbs: { min: 0, max: 300, step: 1 },
};

const sortOptions: { key: string; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'calories', label: 'Cal' },
    { key: 'protein', label: 'Pro' },
    { key: 'carbs', label: 'Carbs' },
    { key: 'fat', label: 'Fat' },
];

const fallbackText = "No foods found. Try adjusting your search or filters.";

const Search = () => {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useDietContext();
  const resultsViewRef = useRef<Animatable.View & View>(null);

  const [searchText, setSearchText] = useState<string>("");

  // FIX: Separate state for visual slider value and the value used for searching
  // This resolves the visual reset bug and provides smooth dragging.
  // Initialize both live and search values to maximum to prevent glitching
  const [liveCalories, setLiveCalories] = useState(nutrientRanges.calories.max);
  const [searchCalories, setSearchCalories] = useState(nutrientRanges.calories.max);

  const [liveProtein, setLiveProtein] = useState(nutrientRanges.protein.max);
  const [searchProtein, setSearchProtein] = useState(nutrientRanges.protein.max);

  const [liveFat, setLiveFat] = useState(nutrientRanges.fat.max);
  const [searchFat, setSearchFat] = useState(nutrientRanges.fat.max);
  
  const [liveCarbs, setLiveCarbs] = useState(nutrientRanges.carbs.max);
  const [searchCarbs, setSearchCarbs] = useState(nutrientRanges.carbs.max);



  const [searchResults, setSearchResults] = useState<DietFood[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sliderRefresh, setSliderRefresh] = useState<number>(0); // Force slider refresh
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  


  const sortResults = (results: DietFood[], sortKey: string, order: 'asc' | 'desc'): DietFood[] => {
    return [...results].sort((a, b) => {
        let aValue: any = a[sortKey as keyof DietFood];
        let bValue: any = b[sortKey as keyof DietFood];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return order === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
    });
  };
  
  const performSearch = async (searchQuery: string, filters: any) => {
    try {
      setIsSearching(true);
      
      const trimmedQuery = searchQuery?.trim() || '';
      
      if (!trimmedQuery) {
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }
      
      const searchInput: ISearchFoodsInput = {
        query: trimmedQuery,
        calo: filters.calories < nutrientRanges.calories.max ? filters.calories : undefined,
        protein: filters.protein < nutrientRanges.protein.max ? filters.protein : undefined,
        carbs: filters.carbs < nutrientRanges.carbs.max ? filters.carbs : undefined,
        fat: filters.fat < nutrientRanges.fat.max ? filters.fat : undefined,
      };

      const foodsArray: FoodModel[] = (await SearchService.searchFoods(searchInput)) || [];

      // Ensure foodsArray is always an array
      const safeResultsArray = Array.isArray(foodsArray) ? foodsArray : [];

      const transformedResults: DietFood[] = safeResultsArray.map((food: FoodModel) => ({
        id: food.id,
        name: food.name,
        image: food.imageUrl ? { uri: food.imageUrl } : null,
        calories: food.nutrition?.cal || 0,
        carbs: food.nutrition?.carbs || 0,
        protein: food.nutrition?.protein || 0,
        fat: food.nutrition?.fat || 0,
        description: food.description || `${food.name} - Nutritional Information`,
      }));

      const sortedResults = sortResults(transformedResults, sortBy, sortOrder);
      setSearchResults(sortedResults);
      setHasSearched(true);
    } catch (error) {
      console.error("❌ Search failed:", error);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
     if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    
    debounceTimeout.current = setTimeout(() => {
      const hasActiveFilters = searchCalories < nutrientRanges.calories.max || 
                              searchProtein < nutrientRanges.protein.max || 
                              searchFat < nutrientRanges.fat.max || 
                              searchCarbs < nutrientRanges.carbs.max;
      
      const shouldSearch = searchText.trim() !== "" || hasActiveFilters;
      
      if (shouldSearch) {
        performSearch(searchText, { calories: searchCalories, protein: searchProtein, fat: searchFat, carbs: searchCarbs });
      } else {
        // Clear search results and return to initial state
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchText, searchCalories, searchProtein, searchFat, searchCarbs]);

  useEffect(() => {
    if (searchResults.length > 0 && hasSearched) {
      setSearchResults(prevResults => sortResults(prevResults, sortBy, sortOrder));
      if (resultsViewRef.current) {
        resultsViewRef.current.fadeInUp?.(400);
      }
    }
  }, [sortBy, sortOrder]);

  const handleToggleFavorite = async (foodId: string) => {
    const food = searchResults.find(f => f.id === foodId);
    if (food) await toggleFavorite(foodId, food);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(currentOrder => (currentOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };
  
  const resetFilters = () => {
      const maxCalories = nutrientRanges.calories.max;
      const maxProtein = nutrientRanges.protein.max;
      const maxFat = nutrientRanges.fat.max;
      const maxCarbs = nutrientRanges.carbs.max;
      
      setLiveCalories(maxCalories);
      setSearchCalories(maxCalories);
      setLiveProtein(maxProtein);
      setSearchProtein(maxProtein);
      setLiveFat(maxFat);
      setSearchFat(maxFat);
      setLiveCarbs(maxCarbs);
      setSearchCarbs(maxCarbs);
  };

  // Check if any filters are active (not at maximum values)
  const hasActiveFilters = searchCalories < nutrientRanges.calories.max || 
                          searchProtein < nutrientRanges.protein.max || 
                          searchFat < nutrientRanges.fat.max || 
                          searchCarbs < nutrientRanges.carbs.max;

  const showInitialState = !hasSearched && !isSearching;
  const showNoResults = hasSearched && searchResults.length === 0 && !isSearching;
  const showResults = hasSearched && searchResults.length > 0 && !isSearching;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white">
        <TouchableOpacity
          className="bg-black w-10 h-10 rounded-full justify-center items-center"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">Search</Text>
        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          <View className="px-4 pt-6">
            <View className="flex-row items-center mb-4">
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 h-12 mr-3">
                 <Ionicons name="search" size={22} color="#9CA3AF" />
                <TextInput
                  className="flex-1 text-base ml-2 text-gray-800"
                  placeholder="chicken"
                  placeholderTextColor="#9CA3AF"
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchText('');
                    }}
                    className="ml-2"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (!showFilters) {
                    // Method 1: Direct sync
                    setLiveCalories(searchCalories);
                    setLiveProtein(searchProtein);
                    setLiveFat(searchFat);
                    setLiveCarbs(searchCarbs);
                    
                    // Method 2: Force slider refresh trigger (auto-fix)
                    setTimeout(() => {
                      setSliderRefresh(prev => prev + 1);
                      // Micro-nudge to trigger synchronization
                      setLiveCalories(searchCalories + 0.001);
                      setTimeout(() => {
                        setLiveCalories(searchCalories);
                      }, 10);
                    }, 20);
                  }
                  
                  setShowFilters(!showFilters);
                }}
                className={`w-12 h-12 items-center justify-center rounded-xl ${
                  hasActiveFilters ? 'bg-orange-500' : 'bg-gray-100'
                }`}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="options-outline" 
                  size={24} 
                  color={hasActiveFilters ? 'white' : 'black'} 
                />
              </TouchableOpacity>
            </View>

            {showFilters && (
              <Animatable.View 
                animation="fadeInDown" 
                duration={300} 
                className="mb-4 p-4 bg-gray-50 rounded-xl"
              >
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-lg font-bold text-gray-800">Filter by Nutrients</Text>
                  <TouchableOpacity onPress={resetFilters} className="px-3 py-1 bg-gray-200 rounded-lg">
                    <Text className="text-sm text-gray-600">Reset</Text>
                  </TouchableOpacity>
                </View>
                <NutrientSlider 
                  key={`calories-${sliderRefresh}`}
                  label="Calories" 
                  value={liveCalories} 
                  onValueChange={setLiveCalories} 
                  onSlidingComplete={(val) => setSearchCalories(Math.round(val))}
                  range={nutrientRanges.calories} 
                />
                <NutrientSlider 
                  key={`protein-${sliderRefresh}`}
                  label="Protein" 
                  value={liveProtein} 
                  onValueChange={setLiveProtein} 
                  onSlidingComplete={(val) => setSearchProtein(Math.round(val))}
                  range={nutrientRanges.protein} 
                />
                <NutrientSlider 
                  key={`fat-${sliderRefresh}`}
                  label="Fat" 
                  value={liveFat} 
                  onValueChange={setLiveFat} 
                  onSlidingComplete={(val) => setSearchFat(Math.round(val))}
                  range={nutrientRanges.fat} 
                />
                <NutrientSlider 
                  key={`carbs-${sliderRefresh}`}
                  label="Carbs" 
                  value={liveCarbs} 
                  onValueChange={setLiveCarbs} 
                  onSlidingComplete={(val) => setSearchCarbs(Math.round(val))} 
                  range={nutrientRanges.carbs} 
                />
              </Animatable.View>
            )}
          </View>
          
          <View>
            {isSearching && (
              <View className="items-center justify-center py-20">
                <LoadingSpinner isProcessing={true} size={40} color="#F97316" />
                <Text className="text-gray-500 text-base mt-4">Searching foods...</Text>
              </View>
            )}
            
            {showInitialState && (
              <AnimatableView animation="fadeIn" duration={500} className="items-center justify-center py-16">
                <Ionicons name="search-outline" size={80} color="#E5E7EB" />
                <Text className="text-gray-500 text-base mt-4">Search for food by name or filter by nutrients</Text>
                <Text className="text-gray-400 text-sm mt-1">Try searching for "chicken", "apple", or use filters</Text>
                <View className="px-4 mt-12 w-full">
                  <Text className="text-lg font-semibold text-gray-800 mb-3">Quick Searches</Text>
                  <View className="flex-row flex-wrap">
                    {['chicken', 'rice', 'apple', 'salmon', 'broccoli', 'banana'].map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        onPress={() => setSearchText(suggestion)}
                        className="bg-gray-100 px-4 py-2 rounded-full mr-2 mb-2"
                      >
                        <Text className="text-gray-700 capitalize">{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </AnimatableView>
            )}

            {showNoResults && (
              <AnimatableView animation="fadeIn" duration={500} className="items-center justify-center py-20 px-4">
                <Ionicons name="sad-outline" size={60} color="#D1D5DB" />
                <Text className="text-gray-500 text-base text-center mt-4">{fallbackText}</Text>
                <Text className="text-gray-400 text-sm text-center mt-2">Try a different search term or adjust filters.</Text>
              </AnimatableView>
            )}
            
            {showResults && (
              <AnimatableView ref={resultsViewRef} animation="fadeInUp" duration={500} className="px-4">
                <View className="mb-4">
                  <Text className="text-lg font-bold text-gray-800 mb-3">
                    Search Results ({searchResults.length})
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600 mr-2">Sort:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {sortOptions.map(option => {
                            const isActive = sortBy === option.key;
                            return (
                                <TouchableOpacity key={option.key} onPress={() => handleSort(option.key)} activeOpacity={0.8}
                                    className={`px-3 py-1 rounded-lg mr-2 ${isActive ? 'bg-orange-100' : 'bg-gray-200'}`}>
                                <Text className={`text-sm font-medium ${isActive ? 'text-orange-600' : 'text-gray-700'}`}>
                                    {option.label} {isActive && (sortOrder === 'asc' ? '↑' : '↓')}
                                </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                  </View>
                </View>
                <FoodSection title="" foods={searchResults} isFavorite={isFavorite} onToggleFavorite={handleToggleFavorite} source="search"/>
              </AnimatableView>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

interface NutrientSliderProps {
  label: string;
  value: number;
  onValueChange: (val: number) => void;
  onSlidingComplete: (val: number) => void;
  range: { min: number; max: number; step: number; };
}

function NutrientSlider({ label, value, onValueChange, onSlidingComplete, range }: NutrientSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleValueChange = (val: number) => {
    setIsDragging(true);
    onValueChange(val);
  };
  
  const handleSlidingComplete = (val: number) => {
    setIsDragging(false);
    onSlidingComplete(val);
  };

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-base text-gray-700 font-medium">{label}</Text>
        <Text className="text-base font-semibold text-gray-800">
          {Math.round(value)}
        </Text>
      </View>
      <CustomSlider
        minimumValue={range.min}
        maximumValue={range.max}
        value={value}
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        step={range.step}
        activeTrackColor="#ff5a16"
        trackColor="#E5E7EB"
        thumbColor="#ff5a16"
        style={{ width: "100%", height: 40 }}
      />
    </View>
  );
}

export default Search;