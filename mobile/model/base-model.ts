class BaseModel {
  id?: string;
  _id?: string; // Optional internal ID

  createdAt?: Date;
  updatedAt?: Date;

  constructor(id: string) {
    this.id = id;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  save() {
    this.updatedAt = new Date();
    // Logic to save the model instance to a database or storage
  }

  delete() {
    // Logic to delete the model instance from a database or storage
  }
}

export default BaseModel;