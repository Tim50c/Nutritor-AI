class WeightLog {
  constructor(id, date, weight) {
    this.id = id;
    this.date = date;
    this.weight = weight;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new WeightLog(doc.id, data.date, data.weight);
  }

  toFirestore() {
    return {
      date: this.date,
      weight: this.weight
    };
  }
}

module.exports = WeightLog;