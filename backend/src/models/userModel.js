class User {
  constructor(id, name, email, dob, gender, height, weightCurrent, weightGoal, targetNutrition, fcmToken, notificationPreferences) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.dob = dob;
    this.gender = gender;
    this.height = height;
    this.weightCurrent = weightCurrent;
    this.weightGoal = weightGoal;
    this.targetNutrition = targetNutrition;
    this.fcmToken = fcmToken;
    this.notificationPreferences = notificationPreferences;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new User(doc.id, data.name, data.email, data.dob, data.gender, data.height, data.weightCurrent, data.weightGoal, data.targetNutrition, data.fcmToken, data.notificationPreferences);
  }

  toFirestore() {
    return {
      name: this.name,
      email: this.email,
      dob: this.dob,
      gender: this.gender,
      height: this.height,
      weightCurrent: this.weightCurrent,
      weightGoal: this.weightGoal,
      targetNutrition: this.targetNutrition,
      fcmToken: this.fcmToken,
      notificationPreferences: this.notificationPreferences
    };
  }
}

module.exports = User;