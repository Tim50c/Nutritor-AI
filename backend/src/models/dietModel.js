class Diet {
  constructor(id, totalNutrition, foods) {
    this.id = id;
    this.totalNutrition = totalNutrition;
    this.foods = foods;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Diet(doc.id, data.totalNutrition, data.foods);
  }

  toFirestore() {
    return {
      totalNutrition: this.totalNutrition,
      foods: this.foods
    };
  }
}

module.exports = Diet;