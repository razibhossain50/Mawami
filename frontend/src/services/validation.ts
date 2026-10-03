// Comprehensive validation utilities
import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

export const phoneSchema = z.string()
  .regex(/^(\+88)?01[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number');

export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, dots, apostrophes, and hyphens');

// File validation
export const imageFileSchema = z.object({
  name: z.string(),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(type),
    'Only JPEG, PNG, and WebP images are allowed'
  ),
});

// Biodata validation schemas
export const basicInfoSchema = z.object({
  fullName: nameSchema,
  biodataType: z.enum(['Male', 'Female', 'Groom', 'Bride'], { error: (iss) => (iss.input === undefined ? 'Please select biodata type' : undefined) }),
  maritalStatus: z.string().min(1, 'Marital status is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  height: z.string().min(1, 'Height is required'),
  weight: z.number().min(30, 'Weight must be at least 30 kg').max(200, 'Weight must not exceed 200 kg'),
  complexion: z.string().min(1, 'Complexion is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  profession: z.string().min(1, 'Profession is required'),
  religion: z.string().min(1, 'Religion is required'),
});

export const locationInfoSchema = z.object({
  permanentCountry: z.string().min(1, 'Permanent country is required'),
  permanentDivision: z.string().min(1, 'Permanent division is required'),
  permanentZilla: z.string().min(1, 'Permanent district is required'),
  permanentUpazilla: z.string().min(1, 'Permanent upazilla is required'),
  permanentArea: z.string().min(1, 'Permanent area is required'),
  presentCountry: z.string().min(1, 'Present country is required'),
  presentDivision: z.string().min(1, 'Present division is required'),
  presentZilla: z.string().min(1, 'Present district is required'),
  presentUpazilla: z.string().min(1, 'Present upazilla is required'),
  presentArea: z.string().min(1, 'Present area is required'),
  sameAsPermanent: z.boolean().optional(),
});

export const educationInfoSchema = z.object({
  educationMedium: z.string().min(1, 'Education medium is required'),
  highestEducation: z.string().min(1, 'Highest education is required'),
  instituteName: z.string().min(1, 'Institute name is required'),
  subject: z.string().min(1, 'Subject is required'),
  passingYear: z.string().min(1, 'Passing year is required'),
  result: z.string().min(1, 'Result is required'),
  economicCondition: z.string().min(1, 'Economic condition is required'),
});

export const familyInfoSchema = z.object({
  fatherName: nameSchema,
  fatherProfession: z.string().min(1, 'Father\'s profession is required'),
  fatherAlive: z.enum(['Yes', 'No'], { error: (iss) => (iss.input === undefined ? 'Please specify if father is alive' : undefined) }),
  motherName: nameSchema,
  motherProfession: z.string().min(1, 'Mother\'s profession is required'),
  motherAlive: z.enum(['Yes', 'No'], { error: (iss) => (iss.input === undefined ? 'Please specify if mother is alive' : undefined) }),
  brothersCount: z.number().min(0, 'Brothers count cannot be negative').max(20, 'Brothers count seems too high'),
  sistersCount: z.number().min(0, 'Sisters count cannot be negative').max(20, 'Sisters count seems too high'),
  familyDetails: z.string().max(1000, 'Family details must not exceed 1000 characters'),
});

export const contactInfoSchema = z.object({
  email: emailSchema,
  ownMobile: phoneSchema,
  guardianMobile: phoneSchema,
  profilePicture: z.string().optional(),
});

export const partnerPreferencesSchema = z.object({
  partnerAgeMin: z.number().min(18, 'Minimum age must be at least 18').max(80, 'Minimum age must not exceed 80'),
  partnerAgeMax: z.number().min(18, 'Maximum age must be at least 18').max(80, 'Maximum age must not exceed 80'),
  partnerComplexion: z.string().min(1, 'Partner complexion preference is required'),
  partnerHeight: z.string().min(1, 'Partner height preference is required'),
  partnerEducation: z.string().min(1, 'Partner education preference is required'),
  partnerProfession: z.string().min(1, 'Partner profession preference is required'),
  partnerLocation: z.string().min(1, 'Partner location preference is required'),
  partnerDetails: z.string().max(1000, 'Partner details must not exceed 1000 characters'),
});

// Complete biodata schema
export const biodataSchema = z.object({
  ...basicInfoSchema.shape,
  ...locationInfoSchema.shape,
  ...educationInfoSchema.shape,
  ...familyInfoSchema.shape,
  ...contactInfoSchema.shape,
  ...partnerPreferencesSchema.shape,
  healthIssues: z.string().max(500, 'Health issues must not exceed 500 characters'),
}).refine(
  (data) => data.partnerAgeMin <= data.partnerAgeMax,
  {
    message: 'Minimum age must be less than or equal to maximum age',
    path: ['partnerAgeMax'],
  }
);

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// Search filters schema
export const searchFiltersSchema = z.object({
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  location: z.string().optional(),
  biodataNumber: z.string().optional(),
  ageMin: z.number().min(18).max(80).optional(),
  ageMax: z.number().min(18).max(80).optional(),
  profession: z.string().optional(),
  education: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
}).refine(
  (data) => !data.ageMin || !data.ageMax || data.ageMin <= data.ageMax,
  {
    message: 'Minimum age must be less than or equal to maximum age',
    path: ['ageMax'],
  }
);

// Utility functions
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const validateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const validateBangladeshiPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\s+/g, '');
  return /^(\+88)?01[3-9]\d{8}$/.test(cleanPhone);
};

export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('88')) {
    return `+${cleanPhone}`;
  }
  if (cleanPhone.startsWith('01')) {
    return `+88${cleanPhone}`;
  }
  return phone;
};

// Form validation helper
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};