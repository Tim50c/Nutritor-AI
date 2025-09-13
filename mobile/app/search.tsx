import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text } from "../components/CustomText";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useDietContext, DietFood } from "@/context/DietContext";
import FoodSection from "@/components/FoodSection";
import CustomSlider from "@/components/CustomSlider";
import { Ionicons } from "@expo/vector-icons";
import { SearchService } from "@/services";
import { ISearchFoodsInput } from "@/interfaces";
import { FoodModel } from "@/models";
import LoadingSpinner from "@/components/LoadingSpinner";
import * as Animatable from "react-native-animatable";
import { foodCacheEvents } from "@/utils/foodCacheEvents";
import { useIsDark } from "@/theme/useIsDark";

const AnimatableView = Animatable.createAnimatableComponent(View);

const nutrientRanges = {
  calories: { min: 0, max: 6000, step: 10 },
  protein: { min: 0, max: 400, step: 1 },
  fat: { min: 0, max: 200, step: 1 },
  carbs: { min: 0, max: 300, step: 1 },
};

const sortOptions: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "calories", label: "Cal" },
  { key: "protein", label: "Pro" },
  { key: "carbs", label: "Carbs" },
  { key: "fat", label: "Fat" },
];

const fallbackText = "No foods found. Try adjusting your search or filters.";

const Search = () => {
  const router = useRouter();
  const isDark = useIsDark();
  const { isFavorite, toggleFavorite } = useDietContext();
  const resultsViewRef = useRef<Animatable.View & View>(null);

  const [searchText, setSearchText] = useState<string>("");

  // FIX: Separate state for visual slider value and the value used for searching
  // This resolves the visual reset bug and provides smooth dragging.
  // Initialize both live and search values to maximum to prevent glitching
  const [liveCalories, setLiveCalories] = useState(nutrientRanges.calories.max);
  const [searchCalories, setSearchCalories] = useState(
    nutrientRanges.calories.max
  );

  const [liveProtein, setLiveProtein] = useState(nutrientRanges.protein.max);
  const [searchProtein, setSearchProtein] = useState(
    nutrientRanges.protein.max
  );

  const [liveFat, setLiveFat] = useState(nutrientRanges.fat.max);
  const [searchFat, setSearchFat] = useState(nutrientRanges.fat.max);

  const [liveCarbs, setLiveCarbs] = useState(nutrientRanges.carbs.max);
  const [searchCarbs, setSearchCarbs] = useState(nutrientRanges.carbs.max);

  const [searchResults, setSearchResults] = useState<DietFood[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<DietFood[]>([]); // Store all results
  const [displayedResults, setDisplayedResults] = useState<DietFood[]>([]); // Currently displayed results
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sliderRefresh, setSliderRefresh] = useState<number>(0); // Force slider refresh
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagination constants
  const ITEMS_PER_PAGE = 15;

  // Pagination functions
  const updateDisplayedResults = (results: DietFood[], page: number = 1) => {
    const startIndex = 0;
    const endIndex = page * ITEMS_PER_PAGE;
    const newDisplayedResults = results.slice(startIndex, endIndex);
    setDisplayedResults(newDisplayedResults);
    setCurrentPage(page);
  };

  const loadMoreResults = () => {
    const nextPage = currentPage + 1;
    updateDisplayedResults(allSearchResults, nextPage);
  };

  const hasMoreResults = allSearchResults.length > displayedResults.length;

  const sortResults = (
    results: DietFood[],
    sortKey: string,
    order: "asc" | "desc"
  ): DietFood[] => {
    return [...results].sort((a, b) => {
      let aValue: any = a[sortKey as keyof DietFood];
      let bValue: any = b[sortKey as keyof DietFood];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return order === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return order === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  };

  const performSearch = async (searchQuery: string, filters: any) => {
    try {
      setIsSearching(true);

      const trimmedQuery = searchQuery?.trim() || "";

      if (!trimmedQuery) {
        setAllSearchResults([]);
        setSearchResults([]);
        setDisplayedResults([]);
        setCurrentPage(1);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      const searchInput: ISearchFoodsInput = {
        query: trimmedQuery,
        calo:
          filters.calories < nutrientRanges.calories.max
            ? filters.calories
            : undefined,
        protein:
          filters.protein < nutrientRanges.protein.max
            ? filters.protein
            : undefined,
        carbs:
          filters.carbs < nutrientRanges.carbs.max ? filters.carbs : undefined,
        fat: filters.fat < nutrientRanges.fat.max ? filters.fat : undefined,
      };

      const foodsArray: FoodModel[] =
        (await SearchService.searchFoods(searchInput)) || [];

      // Ensure foodsArray is always an array
      const safeResultsArray = Array.isArray(foodsArray) ? foodsArray : [];

      const transformedResults: DietFood[] = safeResultsArray.map(
        (food: FoodModel) => ({
          id: food.id,
          name: food.name,
          image: food.imageUrl ? { uri: food.imageUrl } : null,
          calories: food.nutrition?.cal || 0,
          carbs: food.nutrition?.carbs || 0,
          protein: food.nutrition?.protein || 0,
          fat: food.nutrition?.fat || 0,
          description:
            food.description || `${food.name} - Nutritional Information`,
        })
      );

      const sortedResults = sortResults(transformedResults, sortBy, sortOrder);

      // Store all results and set up pagination
      setAllSearchResults(sortedResults);
      setSearchResults(sortedResults); // Keep for backward compatibility
      updateDisplayedResults(sortedResults, 1); // Show first page
      setHasSearched(true);
    } catch (error) {
      console.error("❌ Search failed:", error);
      setAllSearchResults([]);
      setSearchResults([]);
      setDisplayedResults([]);
      setCurrentPage(1);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      const hasActiveFilters =
        searchCalories < nutrientRanges.calories.max ||
        searchProtein < nutrientRanges.protein.max ||
        searchFat < nutrientRanges.fat.max ||
        searchCarbs < nutrientRanges.carbs.max;

      const shouldSearch = searchText.trim() !== "" || hasActiveFilters;

      if (shouldSearch) {
        performSearch(searchText, {
          calories: searchCalories,
          protein: searchProtein,
          fat: searchFat,
          carbs: searchCarbs,
        });
      } else {
        // Clear search results and return to initial state
        setAllSearchResults([]);
        setSearchResults([]);
        setDisplayedResults([]);
        setCurrentPage(1);
        setHasSearched(false);
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchText, searchCalories, searchProtein, searchFat, searchCarbs]);

  useEffect(() => {
    if (allSearchResults.length > 0 && hasSearched) {
      const sortedResults = sortResults(allSearchResults, sortBy, sortOrder);
      setAllSearchResults(sortedResults);
      setSearchResults(sortedResults); // Keep for backward compatibility
      updateDisplayedResults(sortedResults, 1); // Reset to first page after sort
      if (resultsViewRef.current) {
        resultsViewRef.current.fadeInUp?.(400);
      }
    }
  }, [sortBy, sortOrder]);

  // Function to update a specific food item in search results cache
  const updateFoodInSearchCache = useCallback(
    (foodId: string, imageUrl: string) => {
      console.log("🔄 [Search] Updating food in cache:", { foodId, imageUrl });

      const updateFoodItem = (food: DietFood) => {
        if (food.id === foodId) {
          return {
            ...food,
            image: imageUrl ? { uri: imageUrl } : null,
          };
        }
        return food;
      };

      // Update all search result arrays
      setAllSearchResults((prev) => prev.map(updateFoodItem));
      setSearchResults((prev) => prev.map(updateFoodItem));
      setDisplayedResults((prev) => prev.map(updateFoodItem));

      console.log("✅ [Search] Food cache updated successfully");
    },
    []
  );

  // Function to refresh current search results (fallback method)
  const refreshCurrentSearch = useCallback(() => {
    if (
      hasSearched &&
      (searchText.trim() !== "" ||
        searchCalories < nutrientRanges.calories.max ||
        searchProtein < nutrientRanges.protein.max ||
        searchFat < nutrientRanges.fat.max ||
        searchCarbs < nutrientRanges.carbs.max)
    ) {
      console.log("🔄 [Search] Refreshing current search results...");
      performSearch(searchText, {
        calories: searchCalories,
        protein: searchProtein,
        fat: searchFat,
        carbs: searchCarbs,
      });
    }
  }, [
    hasSearched,
    searchText,
    searchCalories,
    searchProtein,
    searchFat,
    searchCarbs,
  ]);

  // Listen for food image updates from other screens
  useEffect(() => {
    const handleFoodImageUpdate = ({
      foodId,
      imageUrl,
    }: {
      foodId: string;
      imageUrl: string;
    }) => {
      console.log("📡 [Search] Received food image update event:", {
        foodId,
        imageUrl,
      });
      updateFoodInSearchCache(foodId, imageUrl);
    };

    foodCacheEvents.onFoodImageUpdated(handleFoodImageUpdate);

    return () => {
      foodCacheEvents.offFoodImageUpdated(handleFoodImageUpdate);
    };
  }, [updateFoodInSearchCache]);

  // Optional: Refresh search results when returning to this screen (fallback)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have active search results and no recent cache updates
      if (hasSearched && displayedResults.length > 0) {
        console.log("🔍 [Search] Screen focused with existing results");
        // Note: We now rely on event-based updates instead of full refresh
      }
    }, [hasSearched, displayedResults.length])
  );

  const handleToggleFavorite = async (foodId: string) => {
    const food = searchResults.find((f) => f.id === foodId);
    if (food) await toggleFavorite(foodId, food);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((currentOrder) => (currentOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
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
  const hasActiveFilters =
    searchCalories < nutrientRanges.calories.max ||
    searchProtein < nutrientRanges.protein.max ||
    searchFat < nutrientRanges.fat.max ||
    searchCarbs < nutrientRanges.carbs.max;

  const showInitialState = !hasSearched && !isSearching;
  const showNoResults =
    hasSearched && allSearchResults.length === 0 && !isSearching;
  const showResults =
    hasSearched && allSearchResults.length > 0 && !isSearching;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-row items-center justify-between px-6 py-3 bg-white dark:bg-black">
          <TouchableOpacity
            className="bg-black dark:bg-white w-10 h-10 rounded-full justify-center items-center"
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={isDark ? "black" : "white"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black dark:text-white">
            Search
          </Text>
          <View className="w-10 h-10" />
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 30 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-6 pt-6">
              <View className="flex-row items-center mb-4">
                <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 h-12 mr-3">
                  <Ionicons
                    name="search"
                    size={22}
                    color={isDark ? "#A0AEC0" : "#9CA3AF"}
                  />
                  <TextInput
                    className="flex-1 text-base ml-2 text-gray-800 dark:text-gray-200"
                    placeholder="chicken"
                    placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchText("");
                      }}
                      className="ml-2"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={isDark ? "#A0AEC0" : "#9CA3AF"}
                      />
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
                        setSliderRefresh((prev) => prev + 1);
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
                    hasActiveFilters
                      ? "bg-orange-500"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="options-outline"
                    size={24}
                    color={
                      hasActiveFilters ? "white" : isDark ? "white" : "black"
                    }
                  />
                </TouchableOpacity>
              </View>

              {showFilters && (
                <Animatable.View
                  animation="fadeInDown"
                  duration={300}
                  className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      Filter by Nutrients
                    </Text>
                    <TouchableOpacity
                      onPress={resetFilters}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    >
                      <Text className="text-sm text-gray-600 dark:text-gray-400">
                        Reset
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <NutrientSlider
                    key={`calories-${sliderRefresh}`}
                    label="Calories"
                    value={liveCalories}
                    onValueChange={setLiveCalories}
                    onSlidingComplete={(val) =>
                      setSearchCalories(Math.round(val))
                    }
                    range={nutrientRanges.calories}
                  />
                  <NutrientSlider
                    key={`protein-${sliderRefresh}`}
                    label="Protein"
                    value={liveProtein}
                    onValueChange={setLiveProtein}
                    onSlidingComplete={(val) =>
                      setSearchProtein(Math.round(val))
                    }
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
                  <LoadingSpinner
                    isProcessing={true}
                    size={40}
                    color="#F97316"
                  />
                  <Text className="text-gray-500 dark:text-gray-400 text-base mt-4">
                    Searching foods...
                  </Text>
                </View>
              )}

              {showInitialState && (
                <AnimatableView
                  animation="fadeIn"
                  duration={500}
                  className="items-center justify-center py-16"
                >
                  <Ionicons name="search-outline" size={80} color="#E5E7EB" />
                  <Text className="text-gray-500 dark:text-gray-400 text-base text-center mt-4">
                    Search for food by name or filter by nutrients
                  </Text>
                  <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Try searching for &quot;chicken&quot;, &quot;apple&quot;, or
                    use filters
                  </Text>
                  <View className="px-6 mt-12 w-full">
                    <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                      Quick Searches
                    </Text>
                    <View className="flex-row flex-wrap">
                      {[
                        "chicken",
                        "rice",
                        "apple",
                        "salmon",
                        "broccoli",
                        "banana",
                      ].map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion}
                          onPress={() => setSearchText(suggestion)}
                          className="bg-gray-100 dark:bg-gray-700 px-6 py-2 rounded-full mr-2 mb-2"
                        >
                          <Text className="text-gray-700 dark:text-gray-300 capitalize">
                            {suggestion}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </AnimatableView>
              )}

              {showNoResults && (
                <AnimatableView
                  animation="fadeIn"
                  duration={500}
                  className="items-center justify-center py-20 px-6"
                >
                  <Ionicons name="sad-outline" size={60} color="#D1D5DB" />
                  <Text className="text-gray-500 dark:text-gray-400 text-base text-center mt-4">
                    {fallbackText}
                  </Text>
                  <Text className="text-gray-400 dark:text-gray-500 text-sm text-center mt-2">
                    Try a different search term or adjust filters.
                  </Text>
                </AnimatableView>
              )}

              {showResults && (
                <AnimatableView
                  ref={resultsViewRef}
                  animation="fadeInUp"
                  duration={500}
                  className="px-6"
                >
                  <View className="mb-4">
                    <Text className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                      Search Results ({allSearchResults.length})
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                        Sort:
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        {sortOptions.map((option) => {
                          const isActive = sortBy === option.key;
                          return (
                            <TouchableOpacity
                              key={option.key}
                              onPress={() => handleSort(option.key)}
                              activeOpacity={0.8}
                              className={`px-3 py-1 rounded-lg mr-2 ${
                                isActive
                                  ? "bg-orange-100 dark:bg-orange-900"
                                  : "bg-gray-200 dark:bg-gray-700"
                              }`}
                            >
                              <Text
                                className={`text-sm font-medium ${
                                  isActive
                                    ? "text-orange-600 dark:text-orange-300"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {option.label}{" "}
                                {isActive && (sortOrder === "asc" ? "↑" : "↓")}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                  <FoodSection
                    title=""
                    foods={displayedResults}
                    isFavorite={isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    source="search"
                  />

                  {hasMoreResults && (
                    <TouchableOpacity
                      onPress={loadMoreResults}
                      className="mx-6 my-4 py-3 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg"
                      activeOpacity={0.7}
                    >
                      <Text className="text-center text-orange-600 dark:text-orange-300 font-semibold text-base">
                        See More (
                        {allSearchResults.length - displayedResults.length}{" "}
                        remaining)
                      </Text>
                    </TouchableOpacity>
                  )}
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
  range: { min: number; max: number; step: number };
}

function NutrientSlider({
  label,
  value,
  onValueChange,
  onSlidingComplete,
  range,
}: NutrientSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isDark = useIsDark();

  const handleValueChange = (val: number) => {
    setIsDragging(true);
    onValueChange(val);
  };

  const handleSlidingComplete = (val: number) => {
    setIsDragging(false);
    onSlidingComplete(val);
  };

  // Define dark mode colors for the slider
  const trackColor = isDark ? "#374151" : "#E5E7EB";
  const activeTrackColor = "#ff5a16";
  const thumbColor = "#ff5a16";

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-base text-gray-700 dark:text-gray-300 font-medium">
          {label}
        </Text>
        <Text className="text-base font-semibold text-gray-800 dark:text-gray-200">
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
        activeTrackColor={activeTrackColor}
        trackColor={trackColor}
        thumbColor={thumbColor}
        style={{ width: "100%", height: 40 }}
      />
    </View>
  );
}

export default Search;
