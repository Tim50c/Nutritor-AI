interface IFoodSuggestionsInput {
  targetNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  consumedNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default IFoodSuggestionsInput;
