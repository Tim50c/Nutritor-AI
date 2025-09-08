import React, {useState, useEffect, useRef} from "react";
import {View, TextInput, TouchableOpacity, FlatList, Image, Platform, KeyboardAvoidingView, ScrollView, SafeAreaView} from "react-native";
import { Text } from '../components/CustomText';
import {useRouter} from "expo-router";
import {useDietContext, DietFood} from "@/context/DietContext";
import FoodSection from "@/components/FoodSection";
import {icons} from "@/constants/icons";
import Slider from "@react-native-community/slider";
import {Ionicons} from "@expo/vector-icons";
import { SearchService } from "@/services";
import { ISearchFoodsInput } from "@/interfaces";
import { FoodModel } from "@/models";
import LoadingSpinner from "@/components/LoadingSpinner";

const nutrientRanges = {
  calories: {min: 0, max: 6000, step: 50},
  protein: {min: 0, max: 400, step: 10},
  fat: {min: 0, max: 200, step: 5},
  carbs: {min: 0, max: 300, step: 10},
};

const sortOptions = [
  { key: 'name', label: 'Name' },
  { key: 'calories', label: 'Calories' },
  { key: 'protein', label: 'Protein' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
];

const fallbackText = "No foods found. Try adjusting your search or filters.";

const Search = () => {
  const router = useRouter();
  const {isFavorite, toggleFavorite} = useDietContext();

  const [searchText, setSearchText] = useState<string>("");
  const [calories, setCalories] = useState<number>(nutrientRanges.calories.max);
  const [protein, setProtein] = useState<number>(nutrientRanges.protein.max);
  const [fat, setFat] = useState<number>(nutrientRanges.fat.max);
  const [carbs, setCarbs] = useState<number>(nutrientRanges.carbs.max);
  const [searchResults, setSearchResults] = useState<DietFood[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort results function
  const sortResults = (results: DietFood[], sortKey: string, order: 'asc' | 'desc'): DietFood[] => {
    return results.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortKey) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'calories':
          aValue = a.calories;
          bValue = b.calories;
          break;
        case 'protein':
          aValue = a.protein;
          bValue = b.protein;
          break;
        case 'carbs':
          aValue = a.carbs;
          bValue = b.carbs;
          break;
        case 'fat':
          aValue = a.fat;
          bValue = b.fat;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return order === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });
  };

  // Function to perform search using the backend API
  const performSearch = async (searchQuery: string, filters: any) => {
    try {
      setIsSearching(true);
      
      // Prepare search input according to backend API
      const searchInput: ISearchFoodsInput = {
        query: searchQuery.trim() || undefined,
        calo: filters.calories < nutrientRanges.calories.max ? filters.calories : undefined,
        protein: filters.protein < nutrientRanges.protein.max ? filters.protein : undefined,
        carb: filters.carbs < nutrientRanges.carbs.max ? filters.carbs : undefined,
        fat: filters.fat < nutrientRanges.fat.max ? filters.fat : undefined,
      };

      const searchResponse = await SearchService.searchFoods(searchInput);
      
      // Handle the response - it should be FoodModel[] but let's be defensive
      let foodsArray: FoodModel[] = [];
      
      if (Array.isArray(searchResponse)) {
        foodsArray = searchResponse;
      } else if (searchResponse && typeof searchResponse === 'object') {
        // Handle case where SearchService might return an object with data property
        const responseData = (searchResponse as any).data;
        if (Array.isArray(responseData)) {
          foodsArray = responseData;
        } else {
          foodsArray = [];
        }
      } else {
        foodsArray = [];
      }
      
      // Transform FoodModel[] to DietFood[] format
      const transformedResults: DietFood[] = foodsArray.map((food: FoodModel) => ({
        id: food.id,
        name: food.name,
        image: food.imageUrl ? { uri: food.imageUrl } : null,
        calories: food.nutrition?.cal || 0,
        carbs: food.nutrition?.carbs || 0,
        protein: food.nutrition?.protein || 0,
        fat: food.nutrition?.fat || 0,
        description: food.description || `${food.name} - Nutritional Information`,
      }));

      // Apply sorting
      const sortedResults = sortResults(transformedResults, sortBy, sortOrder);

      setSearchResults(sortedResults);
      setHasSearched(true);
    } catch (error) {
      // Handle errors gracefully without showing alerts
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    
    debounceTimeout.current = setTimeout(() => {
      // Search if there's text OR if filters are active (not at max values)
      const hasActiveFilters = calories < nutrientRanges.calories.max || 
                              protein < nutrientRanges.protein.max || 
                              fat < nutrientRanges.fat.max || 
                              carbs < nutrientRanges.carbs.max;
      
      const shouldSearch = searchText.trim() !== "" || hasActiveFilters;
      
      if (shouldSearch) {
        performSearch(searchText, { calories, protein, fat, carbs });
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchText, calories, protein, fat, carbs]);

  // Re-sort results when sort options change
  useEffect(() => {
    if (searchResults.length > 0) {
      const sortedResults = sortResults([...searchResults], sortBy, sortOrder);
      setSearchResults(sortedResults);
    }
  }, [sortBy, sortOrder]);

  // Handle search text change
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
  };

  // Handle filter changes
  const handleFilterChange = () => {
    // Clear existing timeout since we want immediate search when filters change
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    
    debounceTimeout.current = setTimeout(() => {
      const hasActiveFilters = calories < nutrientRanges.calories.max || 
                              protein < nutrientRanges.protein.max || 
                              fat < nutrientRanges.fat.max || 
                              carbs < nutrientRanges.carbs.max;
      
      const shouldSearch = searchText.trim() !== "" || hasActiveFilters;
      if (shouldSearch) {
        performSearch(searchText, { calories, protein, fat, carbs });
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 100); // Shorter delay for filter changes
  };

  // Handle favorite toggle with proper DietFood structure
  const handleToggleFavorite = async (foodId: string) => {
    const food = searchResults.find(f => f.id === foodId);
    if (food) {
      await toggleFavorite(foodId, food);
    }
  };

  // Determine what to show
  const showInitialState = !hasSearched && searchText.trim() === "";
  const showNoResults = hasSearched && searchResults.length === 0 && !isSearching;
  const showResults = hasSearched && searchResults.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          className="bg-black w-10 h-10 rounded-full justify-center items-center"
          onPress={() => router.back()}
        >
          <View style={{ transform: [{ rotate: "0deg" }] }}>
            <icons.arrow width={20} height={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black">
          Search
        </Text>
        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1 px-4 pt-6" keyboardShouldPersistTaps="handled">
        {/* Search input bar with filter button */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mr-3">
            <View className="mr-2">
              <icons.search width={24} height={24} />
            </View>
            <TextInput
              className="flex-1 text-base"
              placeholder="Search for different food"
              value={searchText}
              onChangeText={handleSearchTextChange}
              autoFocus={false}
            />
          </View>

          {/* Filter toggle button */}
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 items-center justify-center rounded-xl ${
              showFilters ? 'bg-orange-500' : 'bg-gray-100'
            }`}
            activeOpacity={0.7}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={showFilters ? 'white' : '#6B7280'}
            />
          </TouchableOpacity>
        </View>

        {/* Collapsible Sliders for nutrients */}
        {showFilters && (
          <View className="mb-4 p-4 bg-gray-50 rounded-xl">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-800">Filter by Nutrients</Text>
              <TouchableOpacity 
                onPress={() => {
                  setCalories(nutrientRanges.calories.max);
                  setProtein(nutrientRanges.protein.max);
                  setFat(nutrientRanges.fat.max);
                  setCarbs(nutrientRanges.carbs.max);
                }}
                className="px-3 py-1 bg-gray-200 rounded-lg"
              >
                <Text className="text-sm text-gray-600">Reset</Text>
              </TouchableOpacity>
            </View>
            <NutrientSlider 
              label="Calories" 
              value={calories} 
              setValue={setCalories} 
              range={nutrientRanges.calories} 
            />
            <NutrientSlider 
              label="Protein" 
              value={protein} 
              setValue={setProtein} 
              range={nutrientRanges.protein} 
            />
            <NutrientSlider 
              label="Fat" 
              value={fat} 
              setValue={setFat} 
              range={nutrientRanges.fat} 
            />
            <NutrientSlider 
              label="Carbs" 
              value={carbs} 
              setValue={setCarbs} 
              range={nutrientRanges.carbs} 
            />
          </View>
        )}

        {/* Results or fallback */}
        {isSearching ? (
          <View className="flex-1 items-center justify-center py-20">
            <LoadingSpinner isProcessing={true} size={40} color="#F47551" />
            <Text className="text-gray-500 text-base mt-4">Searching foods...</Text>
          </View>
        ) : showInitialState ? (
          <View className="flex-1 py-8">
            <View className="items-center justify-center py-12">
              <Ionicons name="search-outline" size={60} color="#D1D5DB" />
              <Text className="text-gray-400 text-base mt-4">Search for food by name or filter by nutrients</Text>
              <Text className="text-gray-300 text-sm mt-2">Try searching for "chicken", "apple", or use filters</Text>
            </View>
            
            {/* Quick search suggestions */}
            <View className="px-4">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Quick Searches</Text>
              <View className="flex-row flex-wrap">
                {['chicken', 'rice', 'apple', 'salmon', 'broccoli', 'banana'].map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    onPress={() => {
                      setSearchText(suggestion);
                      handleSearchTextChange(suggestion);
                    }}
                    className="bg-gray-100 px-4 py-2 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-gray-600 capitalize">{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : showNoResults ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="sad-outline" size={60} color="#D1D5DB" />
            <Text className="text-gray-400 text-base mt-4">{fallbackText}</Text>
            <Text className="text-gray-300 text-sm mt-2">Try adjusting your search terms or filters</Text>
          </View>
        ) : showResults ? (
          <View>
            {/* Search Results Header */}
            <View className="mb-4 px-4">
              <Text className="text-lg font-bold text-gray-800 mb-3">
                Search Results ({searchResults.length})
              </Text>
              
              {/* Sorting Controls */}
              <View className="flex-row items-center">
                <Text className="text-sm text-gray-600 mr-2">Sort:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => {
                        if (sortBy === 'name') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('name');
                          setSortOrder('asc');
                        }
                      }}
                      className={`px-3 py-1 rounded ${sortBy === 'name' ? 'bg-orange-500' : 'bg-gray-200'}`}
                    >
                      <Text className={`text-xs font-medium ${sortBy === 'name' ? 'text-white' : 'text-gray-800'}`}>
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => {
                        if (sortBy === 'calories') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('calories');
                          setSortOrder('asc');
                        }
                      }}
                      className={`px-3 py-1 rounded ml-2 ${sortBy === 'calories' ? 'bg-orange-500' : 'bg-gray-200'}`}
                    >
                      <Text className={`text-xs font-medium ${sortBy === 'calories' ? 'text-white' : 'text-gray-800'}`}>
                        Cal {sortBy === 'calories' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => {
                        if (sortBy === 'protein') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('protein');
                          setSortOrder('asc');
                        }
                      }}
                      className={`px-3 py-1 rounded ml-2 ${sortBy === 'protein' ? 'bg-orange-500' : 'bg-gray-200'}`}
                    >
                      <Text className={`text-xs font-medium ${sortBy === 'protein' ? 'text-white' : 'text-gray-800'}`}>
                        Pro {sortBy === 'protein' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => {
                        if (sortBy === 'carbs') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('carbs');
                          setSortOrder('asc');
                        }
                      }}
                      className={`px-3 py-1 rounded ml-2 ${sortBy === 'carbs' ? 'bg-orange-500' : 'bg-gray-200'}`}
                    >
                      <Text className={`text-xs font-medium ${sortBy === 'carbs' ? 'text-white' : 'text-gray-800'}`}>
                        Carbs {sortBy === 'carbs' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => {
                        if (sortBy === 'fat') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('fat');
                          setSortOrder('asc');
                        }
                      }}
                      className={`px-3 py-1 rounded ml-2 ${sortBy === 'fat' ? 'bg-orange-500' : 'bg-gray-200'}`}
                    >
                      <Text className={`text-xs font-medium ${sortBy === 'fat' ? 'text-white' : 'text-gray-800'}`}>
                        Fat {sortBy === 'fat' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
            
            <FoodSection
              title=""
              foods={searchResults}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// NutrientSlider component
interface NutrientSliderProps {
  label: string;
  value: number;
  setValue: (val: number) => void;
  range: { min: number; max: number; step: number; };
}

function NutrientSlider({label, value, setValue, range}: NutrientSliderProps) {
  // Handle slider value change with proper rounding
  const handleValueChange = (newValue: number) => {
    setValue(Math.round(newValue));
  };

  // Force re-render when value changes to ensure slider position updates
  const sliderKey = `${label}-${value}-${range.max}`;

  return (
    <View className="mb-6">
      <View className="flex-row justify-between mb-3">
        <Text className="text-sm text-gray-700 font-medium">{label}</Text>
        <View className="flex-row items-center">
          <Text className="text-sm font-semibold text-gray-800 mr-2">{value}</Text>
          <Text className="text-xs text-gray-400">/ {range.max}</Text>
        </View>
      </View>
      
      <View className="px-2">
        <Slider
          key={sliderKey}
          minimumValue={range.min}
          maximumValue={range.max}
          value={value}
          onValueChange={handleValueChange}
          step={range.step}
          minimumTrackTintColor="#F97316"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#F97316"
          style={{
            width: "100%",
            height: 40,
          }}
        />
      </View>
    </View>
  );
}

export default Search;