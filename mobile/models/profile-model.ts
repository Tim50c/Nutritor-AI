import BaseModel from "./base-model";

interface ProfileModel extends BaseModel {
  image: string;
  name: string;
  email: string;
  dob: string;
  gender: string;
  height: number;
  weight: number;
}

export default ProfileModel;

