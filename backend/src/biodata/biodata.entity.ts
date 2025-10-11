import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { BiodataApprovalStatus } from './enums/admin-approval-status.enum';
import { BiodataVisibilityStatus } from './enums/user-visibility-status.enum';

@Entity('biodata')
export class Biodata {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 1 })
  step: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @Column('simple-array', { nullable: true })
  completedSteps: number[];

  @Column({ nullable: true })
  partnerAgeMin: number;

  @Column({ nullable: true })
  partnerAgeMax: number;

  @Column({ default: false, nullable: true })
  sameAsPermanent: boolean;

  @Column({ nullable: true })
  religion: string;

  @Column({ nullable: true })
  biodataType: string;

  @Column({ nullable: true })
  maritalStatus: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  height: string;

  @Column({ nullable: true })
  weight: number;

  @Column({ nullable: true })
  complexion: string;

  @Column({ nullable: true })
  profession: string;

  @Column({ nullable: true })
  bloodGroup: string;

  @Column({ nullable: true })
  permanentCountry: string;

  @Column({ nullable: true })
  permanentDivision: string;

  @Column({ nullable: true })
  permanentZilla: string;

  @Column({ nullable: true })
  permanentUpazilla: string;

  @Column({ nullable: true })
  permanentArea: string;

  @Column({ nullable: true })
  presentCountry: string;

  @Column({ nullable: true })
  presentDivision: string;

  @Column({ nullable: true })
  presentZilla: string;

  @Column({ nullable: true })
  presentUpazilla: string;

  @Column({ nullable: true })
  presentArea: string;

  @Column({ nullable: true })
  healthIssues: string;

  @Column({ nullable: true })
  educationMedium: string;

  @Column({ nullable: true })
  highestEducation: string;

  @Column({ nullable: true })
  instituteName: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  passingYear: string;

  @Column({ nullable: true })
  result: string;

  @Column({ nullable: true })
  economicCondition: string;

  @Column({ nullable: true })
  fatherName: string;

  @Column({ nullable: true })
  fatherProfession: string;

  @Column({ nullable: true })
  fatherAlive: string;

  @Column({ nullable: true })
  motherName: string;

  @Column({ nullable: true })
  motherProfession: string;

  @Column({ nullable: true })
  motherAlive: string;

  @Column({ nullable: true })
  brothersCount: number;

  @Column({ nullable: true })
  sistersCount: number;

  @Column({ nullable: true })
  familyDetails: string;

  @Column({ nullable: true })
  partnerComplexion: string;

  @Column({ nullable: true })
  partnerHeight: string;

  @Column({ nullable: true })
  partnerEducation: string;

  @Column({ nullable: true })
  partnerProfession: string;

  @Column({ nullable: true })
  partnerLocation: string;

  @Column({ nullable: true })
  partnerDetails: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ default: false })
  profilePictureVisible: boolean;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  guardianMobile: string;

  @Column({ nullable: true })
  ownMobile: string;

  // Admin's approval decision - only admin can change this
  @Column({
    type: 'enum',
    enum: BiodataApprovalStatus,
    default: BiodataApprovalStatus.IN_PROGRESS
  })
  biodataApprovalStatus: BiodataApprovalStatus;

  // User's visibility preference - user can toggle this if approved
  @Column({
    type: 'enum',
    enum: BiodataVisibilityStatus,
    default: BiodataVisibilityStatus.ACTIVE
  })
  biodataVisibilityStatus: BiodataVisibilityStatus;

  @Column({ default: 0 })
  viewCount: number;

  // Get the effective status for public display
  getEffectiveStatus(): 'active' | 'inactive' | 'in_progress' | 'pending' | 'rejected' {
    // If not approved by admin, show admin approval status
    if (this.biodataApprovalStatus !== BiodataApprovalStatus.APPROVED) {
      return this.biodataApprovalStatus;
    }

    // If approved by admin, show user's visibility choice
    return this.biodataVisibilityStatus;
  }

  // Check if user can toggle their visibility
  canUserToggle(): boolean {
    // User can only toggle if admin has approved the biodata
    return this.biodataApprovalStatus === BiodataApprovalStatus.APPROVED;
  }

  // Check if biodata should be visible to public
  isVisibleToPublic(): boolean {
    return this.biodataApprovalStatus === BiodataApprovalStatus.APPROVED &&
      this.biodataVisibilityStatus === BiodataVisibilityStatus.ACTIVE;
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
