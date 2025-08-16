class Food {
  constructor(id, name, description, barcode, imageUrl, nutrition, source, userId) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.barcode = barcode;
    this.imageUrl = imageUrl;
    this.nutrition = nutrition;
    this.source = source;
    this.userId = userId;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Food(doc.id, data.name, data.description, data.barcode, data.imageUrl, data.nutrition, data.source, data.userId);
  }

  toFirestore() {
    return {
      name: this.name,
      description: this.description,
      barcode: this.barcode,
      imageUrl: this.imageUrl,
      nutrition: this.nutrition,
      source: this.source,
      userId: this.userId
    };
  }
}

module.exports = Food;