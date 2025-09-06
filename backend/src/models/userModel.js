class User {
  constructor(id, firstname, lastname, email, dob, gender, height, weightCurrent, weightGoal, 
    targetNutrition, fcmToken, notificationPreferences, onboardingComplete, avatar = null, 
    unitPreferences = { weight: 'kg', height: 'cm' }) {
    this.id = id;
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.dob = dob;
    this.gender = gender;
    this.height = height;
    this.weightCurrent = weightCurrent;
    this.weightGoal = weightGoal;
    this.targetNutrition = targetNutrition;
    this.fcmToken = fcmToken;
    this.notificationPreferences = notificationPreferences;
    this.onboardingComplete = onboardingComplete;
    this.avatar = avatar;
    this.unitPreferences = unitPreferences;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new User(
      doc.id, 
      data.firstname, 
      data.lastname, 
      data.email, 
      data.dob, 
      data.gender, 
      data.height, 
      data.weightCurrent, 
      data.weightGoal, 
      data.targetNutrition, 
      data.fcmToken, 
      data.notificationPreferences, 
      data.onboardingComplete,
      data.avatar || null,
      data.unitPreferences || { weight: 'kg', height: 'cm' }
    );
  }

  toFirestore() {
    return {
      firstname: this.firstname,
      lastname: this.lastname,
      email: this.email,
      dob: this.dob,
      gender: this.gender,
      height: this.height,
      weightCurrent: this.weightCurrent,
      weightGoal: this.weightGoal,
      targetNutrition: this.targetNutrition,
      fcmToken: this.fcmToken,
      notificationPreferences: this.notificationPreferences,
      onboardingComplete: this.onboardingComplete,
      avatar: this.avatar,
      unitPreferences: this.unitPreferences,
    };
  }
}

module.exports = User;