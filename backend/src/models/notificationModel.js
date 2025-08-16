class Notification {
  constructor(id, title, body, type, read, createdAt) {
    this.id = id;
    this.title = title;
    this.body = body;
    this.type = type;
    this.read = read;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Notification(doc.id, data.title, data.body, data.type, data.read, data.createdAt);
  }

  toFirestore() {
    return {
      title: this.title,
      body: this.body,
      type: this.type,
      read: this.read,
      createdAt: this.createdAt
    };
  }
}

module.exports = Notification;