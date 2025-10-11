import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { BiodataApprovalStatus } from '../enums/admin-approval-status.enum';
import { BiodataVisibilityStatus } from '../enums/user-visibility-status.enum';

export class CreateBiodataDto {
  @IsNumber()
  @IsOptional()
  step?: number;

  @IsNumber()
  @IsOptional()
  partnerAgeMin?: number;

  @IsNumber()
  @IsOptional()
  partnerAgeMax?: number;

  @IsBoolean()
  @IsOptional()
  sameAsPermanent?: boolean;

  @IsString()
  @IsOptional()
  religion?: string;

  @IsString()
  @IsOptional()
  biodataType?: string;

  @IsString()
  @IsOptional()
  maritalStatus?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  height?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  complexion?: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @IsString()
  @IsOptional()
  permanentCountry?: string;

  @IsString()
  @IsOptional()
  permanentDivision?: string;

  @IsString()
  @IsOptional()
  permanentZilla?: string;

  @IsString()
  @IsOptional()
  permanentUpazilla?: string;

  @IsString()
  @IsOptional()
  permanentArea?: string;

  @IsString()
  @IsOptional()
  presentCountry?: string;

  @IsString()
  @IsOptional()
  presentDivision?: string;

  @IsString()
  @IsOptional()
  presentZilla?: string;

  @IsString()
  @IsOptional()
  presentUpazilla?: string;

  @IsString()
  @IsOptional()
  presentArea?: string;

  @IsString()
  @IsOptional()
  healthIssues?: string;

  @IsString()
  @IsOptional()
  educationMedium?: string;

  @IsString()
  @IsOptional()
  highestEducation?: string;

  @IsString()
  @IsOptional()
  instituteName?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  passingYear?: string;

  @IsString()
  @IsOptional()
  result?: string;

  @IsString()
  @IsOptional()
  economicCondition?: string;

  @IsString()
  @IsOptional()
  fatherName?: string;

  @IsString()
  @IsOptional()
  fatherProfession?: string;

  @IsString()
  @IsOptional()
  fatherAlive?: string;

  @IsString()
  @IsOptional()
  motherName?: string;

  @IsString()
  @IsOptional()
  motherProfession?: string;

  @IsString()
  @IsOptional()
  motherAlive?: string;

  @IsNumber()
  @IsOptional()
  brothersCount?: number;

  @IsNumber()
  @IsOptional()
  sistersCount?: number;

  @IsString()
  @IsOptional()
  familyDetails?: string;

  @IsString()
  @IsOptional()
  partnerComplexion?: string;

  @IsString()
  @IsOptional()
  partnerHeight?: string;

  @IsString()
  @IsOptional()
  partnerEducation?: string;

  @IsString()
  @IsOptional()
  partnerProfession?: string;

  @IsString()
  @IsOptional()
  partnerLocation?: string;

  @IsString()
  @IsOptional()
  partnerDetails?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsBoolean()
  @IsOptional()
  profilePictureVisible?: boolean;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  guardianMobile?: string;

  @IsString()
  @IsOptional()
  ownMobile?: string;

  @IsOptional()
  completedSteps?: number[];

  @IsEnum(BiodataApprovalStatus)
  @IsOptional()
  biodataApprovalStatus?: BiodataApprovalStatus;

  @IsEnum(BiodataVisibilityStatus)
  @IsOptional()
  biodataVisibilityStatus?: BiodataVisibilityStatus;
}
