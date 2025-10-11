export enum BiodataApprovalStatus {
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  INACTIVE = 'inactive'
}

export enum BiodataVisibilityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export const BIODATA_APPROVAL_STATUS_DESCRIPTIONS = {
  [BiodataApprovalStatus.IN_PROGRESS]: 'Form is being filled - not yet complete',
  [BiodataApprovalStatus.PENDING]: 'Waiting for admin review',
  [BiodataApprovalStatus.APPROVED]: 'Approved by admin - ready to go live',
  [BiodataApprovalStatus.REJECTED]: 'Rejected by admin - needs corrections',
  [BiodataApprovalStatus.INACTIVE]: 'Deactivated by admin'
};

export const BIODATA_VISIBILITY_STATUS_DESCRIPTIONS = {
  [BiodataVisibilityStatus.ACTIVE]: 'Visible to other users',
  [BiodataVisibilityStatus.INACTIVE]: 'Hidden from other users'
};

export const BIODATA_STATUS_COLORS = {
  [BiodataApprovalStatus.IN_PROGRESS]: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    dot: 'bg-blue-500'
  },
  [BiodataApprovalStatus.PENDING]: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500'
  },
  [BiodataApprovalStatus.APPROVED]: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    dot: 'bg-green-500'
  },
  [BiodataApprovalStatus.REJECTED]: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    dot: 'bg-red-500'
  },
  [BiodataApprovalStatus.INACTIVE]: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-800',
    dot: 'bg-gray-500'
  }
};

export interface BiodataProfile {
  id: number;
  step: number;
  userId: number | null;
  completedSteps: number[] | null;
  partnerAgeMin: number;
  partnerAgeMax: number;
  sameAsPermanent: boolean;
  religion: string;
  biodataType: string;
  maritalStatus: string;
  dateOfBirth: string;
  age: number;
  height: string;
  weight: number;
  complexion: string;
  profession: string;
  bloodGroup: string;
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
  healthIssues: string;
  educationMedium: string;
  highestEducation: string;
  instituteName: string;
  subject: string;
  passingYear: string;
  result: string;
  economicCondition: string;
  fatherName: string;
  fatherProfession: string;
  fatherAlive: string;
  motherName: string;
  motherProfession: string;
  motherAlive: string;
  brothersCount: number;
  sistersCount: number;
  familyDetails: string;
  partnerComplexion: string;
  partnerHeight: string;
  partnerEducation: string;
  partnerProfession: string;
  partnerLocation: string;
  partnerDetails: string;
  fullName: string;
  profilePicture: string | null;
  profilePictureVisible: boolean;
  email: string;
  guardianMobile: string;
  ownMobile: string;
  biodataApprovalStatus: BiodataApprovalStatus;
  biodataVisibilityStatus: BiodataVisibilityStatus;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}