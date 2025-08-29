import React, {useState, useEffect, useRef} from "react";
import {View, Text, TextInput, TouchableOpacity, FlatList, Image, Platform, KeyboardAvoidingView, ScrollView} from "react-native";
import {useRouter} from "expo-router";
import {useDietContext, DietFood} from "@/context/DietContext";
import FoodSuggestionCard from "@/components/FoodSuggestionCard";
import {icons} from "@/constants/icons";
import Slider from "@react-native-community/slider";
import {Ionicons} from "@expo/vector-icons";

const nutrientRanges = {
  calories: {min: 0, max: 2500, step: 50},
  protein: {min: 0, max: 200, step: 10},
  fat: {min: 0, max: 100, step: 5},
  carbs: {min: 0, max: 200, step: 10},
};

const fallbackText = "No foods found. Try adjusting your search or filters.";

const Search = () => {
  const router = useRouter();
  const {foods, isFavorite, toggleFavorite} = useDietContext();

  const [searchText, setSearchText] = useState<string>("");
  const [calories, setCalories] = useState<number>(nutrientRanges.calories.max);
  const [protein, setProtein] = useState<number>(nutrientRanges.protein.max);
  const [fat, setFat] = useState<number>(nutrientRanges.fat.max);
  const [carbs, setCarbs] = useState<number>(nutrientRanges.carbs.max);
  const [filteredFoods, setFilteredFoods] = useState<DietFood[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced filter
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      const text = searchText.trim().toLowerCase();
      const results = foods.filter(food => {
        const matchesText = text === "" || food.name.toLowerCase().includes(text);
        const matchesFilters =
          food.calories <= calories &&
          food.protein <= protein &&
          food.fat <= fat &&
          food.carbs <= carbs;
        return matchesText && matchesFilters;
      });
      setFilteredFoods(results);
    }, 200);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchText, calories, protein, fat, carbs, foods]);

  // Initial blank state fallback
  const showFallback = searchText.trim() === "" && filteredFoods.length === 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1 px-4 pt-6" keyboardShouldPersistTaps="handled">
        {/* Search input bar with filter button */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mr-3">
            <Image source={icons.search} className="w-5 h-5 mr-2" />
            <TextInput
              className="flex-1 text-base"
              placeholder="Search for different food"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={false}
            />
          </View>

          {/* Filter toggle button */}
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 items-center justify-center rounded-xl ${
              showFilters ? 'bg-primary-100' : 'bg-gray-100'
            }`}
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
            <Text className="text-lg font-semibold text-gray-800 mb-3">Filter by Nutrients</Text>
            <NutrientSlider label="Calories" value={calories} setValue={setCalories} range={nutrientRanges.calories} />
            <NutrientSlider label="Protein" value={protein} setValue={setProtein} range={nutrientRanges.protein} />
            <NutrientSlider label="Fat" value={fat} setValue={setFat} range={nutrientRanges.fat} />
            <NutrientSlider label="Carbs" value={carbs} setValue={setCarbs} range={nutrientRanges.carbs} />
          </View>
        )}

        {/* Results or fallback */}
        {showFallback ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-base">Search for food by name or filter by nutrients.</Text>
          </View>
        ) : filteredFoods.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-base">{fallbackText}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredFoods}
            keyExtractor={(item: DietFood) => item.id}
            renderItem={({item}: {item: DietFood}) => (
              <FoodSuggestionCard
                food={item}
                isFavorite={isFavorite(item.id)}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            )}
            contentContainerStyle={{paddingBottom: 24}}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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

  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-2">
        <Text className="text-sm text-gray-700 font-medium">{label}: {value}</Text>
        <Text className="text-xs text-gray-400">Max: {range.max}</Text>
      </View>
      <Slider
        minimumValue={range.min}
        maximumValue={range.max}
        value={range.max}
        onValueChange={handleValueChange}
        step={range.step}
        minimumTrackTintColor="#F47551"
        maximumTrackTintColor="#FFBDA2"
        thumbTintColor="#F47551"
        style={{
          width: "100%",
          height: 30,
        }}
      />

    </View>
  );
}

export default Search;