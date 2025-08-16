class Favorite {
  constructor(id, addedAt) {
    this.id = id;
    this.addedAt = addedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Favorite(doc.id, data.addedAt);
  }

  toFirestore() {
    return {
      addedAt: this.addedAt
    };
  }
}

module.exports = Favorite;