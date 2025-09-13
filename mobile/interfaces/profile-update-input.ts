interface IProfileUpdateInput {
  image?: string;
  name?: string; // Keep for backward compatibility
  firstname?: string; // Add separate firstname field
  lastname?: string; // Add separate lastname field
  email?: string;
  dob?: string;
  gender?: string;
  height?: number;
  weight?: number;
  onboardingComplete?: boolean;
}

export default IProfileUpdateInput;

