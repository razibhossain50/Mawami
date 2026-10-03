// Comprehensive API type definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// User types
export interface User {
  id: number;
  email: string;
  fullName: string | null;
  role: 'user' | 'admin' | 'superadmin';
  profilePicture?: string;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  message?: string;
}

// Biodata types with complete field definitions
export interface BiodataProfile {
  id: number;
  step: number;
  userId: number | null;
  completedSteps: number[] | null;
  
  // Status fields
  biodataApprovalStatus: BiodataApprovalStatus;
  biodataVisibilityStatus: BiodataVisibilityStatus;
  
  // Partner Preferences
  partnerAgeMin: number;
  partnerAgeMax: number;
  partnerComplexion: string;
  partnerHeight: string;
  partnerEducation: string;
  partnerProfession: string;
  partnerLocation: string;
  partnerDetails: string;
  
  // Basic Information
  sameAsPermanent: boolean;
  religion: string;
  biodataType: 'Male' | 'Female' | 'Groom' | 'Bride';
  maritalStatus: string;
  dateOfBirth: string;
  age: number;
  height: string;
  weight: number;
  complexion: string;
  profession: string;
  bloodGroup: string;
  
  // Location Information
  permanentCountry: string;
  permanentDivision: string;
  permanentZilla: string;
  permanentUpazilla: string;
  permanentArea: string;
  presentCountry: string;
  presentDivision: string;
  presentZilla: string;
  presentUpazilla: string;
  presentArea: string;
  
  // Health & Education
  healthIssues: string;
  educationMedium: string;
  highestEducation: string;
  instituteName: string;
  subject: string;
  passingYear: string;
  result: string;
  economicCondition: string;
  
  // Family Information
  fatherName: string;
  fatherProfession: string;
  fatherAlive: string;
  motherName: string;
  motherProfession: string;
  motherAlive: string;
  brothersCount: number;
  sistersCount: number;
  familyDetails: string;
  
  // Contact Information
  fullName: string;
  profilePicture: string | null;
  profilePictureVisible?: boolean;
  email: string;
  guardianMobile: string;
  ownMobile: string;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export enum BiodataApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  INACTIVE = 'inactive'
}

export enum BiodataVisibilityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// Search and filter types
export interface BiodataSearchFilters {
  gender?: string;
  maritalStatus?: string;
  location?: string;
  biodataNumber?: string;
  ageMin?: number;
  ageMax?: number;
  profession?: string;
  education?: string;
  page?: number;
  limit?: number;
}

export type BiodataSearchResponse = PaginatedResponse<BiodataProfile>;

// Favorites
export interface FavoriteItem {
  id: number;
  userId: number;
  biodataId: number;
  biodata: BiodataProfile;
  createdAt: string;
}

export interface FavoritesResponse {
  data: FavoriteItem[];
}

// File upload
export interface FileUploadResponse {
  message: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
}

// Statistics
export interface AdminStats {
  totalUsers: number;
  totalBiodatas: number;
  pendingApprovals: number;
  activeProfiles: number;
}

export interface UserStats {
  profileViews: number;
  favoriteCount: number;
  messagesCount: number;
}

// Location data
export interface LocationData {
  country: string;
  divisions: {
    [key: string]: {
      name: string;
      districts: {
        [key: string]: {
          name: string;
          upazilas: string[];
        };
      };
    };
  };
}

// Form validation
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}