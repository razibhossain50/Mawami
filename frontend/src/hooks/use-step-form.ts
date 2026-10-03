'use client';
import { useState, useCallback, useRef } from "react";
import { z } from "zod";

const biodataSchema = z.object({
  // Personal Information
  religion: z.string().min(1, "Religion is required"),
  biodataType: z.string().min(1, "Biodata type is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().min(18, "Age must be at least 18").max(70, "Age must be at most 70"),
  height: z.string().min(1, "Height is required"),
  weight: z.number().min(1, "Weight is required"),
  complexion: z.string().min(1, "Complexion is required"),
  profession: z.string().min(1, "Profession is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),

  // Address Information - Using new LocationSelector field names
  permanentLocation: z.string().min(1, "Permanent location is required"),
  permanentArea: z.string().min(1, "Permanent area is required"),

  presentLocation: z.string().min(1, "Present location is required"),
  presentArea: z.string().min(1, "Present area is required"),
  sameAsPermanent: z.boolean().default(false),

  healthIssues: z.string().min(1, "Health issues field is required"),

  // Educational Information
  educationMedium: z.string().min(1, "Education medium is required"),
  highestEducation: z.string().min(1, "Highest education is required"),
  instituteName: z.string().min(1, "Institute name is required"),
  subject: z.string().min(1, "Subject is required"),
  passingYear: z.string().min(1, "Passing year is required"),
  result: z.string().min(1, "Result is required"),

  // Family Information
  economicCondition: z.string().min(1, "Economic condition is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  fatherProfession: z.string().min(1, "Father's profession is required"),
  fatherAlive: z.string().min(1, "Father's status is required"),
  motherName: z.string().min(1, "Mother's name is required"),
  motherProfession: z.string().min(1, "Mother's profession is required"),
  motherAlive: z.string().min(1, "Mother's status is required"),
  brothersCount: z.number().min(0, "Invalid number").max(10, "Invalid number"),
  sistersCount: z.number().min(0, "Invalid number").max(10, "Invalid number"),
  familyDetails: z.string().optional(),

  // Partner Preferences
  partnerAgeMin: z.number().min(18, "Minimum age should be 18").max(70, "Maximum age should be 70"),
  partnerAgeMax: z.number().min(18, "Minimum age should be 18").max(70, "Maximum age should be 70"),
  partnerComplexion: z.string().min(1, "Partner complexion preference is required"),
  partnerHeight: z.string().min(1, "Partner height preference is required"),
  partnerEducation: z.string().min(1, "Partner education preference is required"),
  partnerProfession: z.string().min(1, "Partner profession preference is required"),
  partnerLocation: z.string().min(1, "Partner location preference is required"),
  partnerDetails: z.string().optional(),

  // Contact Information
  fullName: z.string().min(1, "Full name is required"),
  profilePicture: z.string().optional(),
  profilePictureVisible: z.boolean().default(false),
  email: z.string().email("Invalid email address"),
  guardianMobile: z.string().min(1, "Guardian's mobile is required"),
  ownMobile: z.string().min(1, "Own mobile is required"),
});

const stepSchemas = [
  // Step 1: Personal Information
  biodataSchema.pick({
    religion: true,
    biodataType: true,
    maritalStatus: true,
    dateOfBirth: true,
    age: true,
    height: true,
    weight: true,
    complexion: true,
    profession: true,
    bloodGroup: true,
    permanentLocation: true,
    permanentArea: true,
    presentLocation: true,
    presentArea: true,
    healthIssues: true,
  }),

  // Step 2: Educational Information
  biodataSchema.pick({
    educationMedium: true,
    highestEducation: true,
    instituteName: true,
    subject: true,
    passingYear: true,
    result: true,
  }),

  // Step 3: Family Information
  biodataSchema.pick({
    economicCondition: true,
    fatherName: true,
    fatherProfession: true,
    fatherAlive: true,
    motherName: true,
    motherProfession: true,
    motherAlive: true,
    brothersCount: true,
    sistersCount: true,
  }),

  // Step 4: Partner Preferences
  biodataSchema.pick({
    partnerAgeMin: true,
    partnerAgeMax: true,
    partnerComplexion: true,
    partnerHeight: true,
    partnerEducation: true,
    partnerProfession: true,
    partnerLocation: true,
  }),

  // Step 5: Contact Information
  biodataSchema.pick({
    fullName: true,
    profilePictureVisible: true,
    email: true,
    guardianMobile: true,
    ownMobile: true,
  }),
];

export function useStepForm(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(1);
  const currentStepRef = useRef(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const highestStepReachedRef = useRef(1);
  const [formData, setFormData] = useState<any>({
    partnerAgeMin: 18,
    partnerAgeMax: 35,
    sameAsPermanent: false,
    profilePictureVisible: false,
  });
  const [errors, setErrors] = useState<any>({});

  const updateFormData = (data: Partial<any>) => {
    // Only log significant updates, not undefined values
    if (Object.values(data).some(value => value !== undefined)) {
      console.log('📝 Form data update:', data);
    }

    setFormData((prev: any) => {
      const newData = { ...prev, ...data };
      return newData;
    });

    // Clear errors for updated fields
    const newErrors = { ...errors };
    Object.keys(data).forEach(key => {
      delete newErrors[key];
    });
    setErrors(newErrors);
  };

  const loadFormData = useCallback((data: any, preserveStep: boolean = false) => {
    console.log('🔄 loadFormData called with:', { data, preserveStep, currentStep: currentStepRef.current });
    console.log('📍 loadFormData call stack:', new Error().stack);
    
    // Convert old address field names to new field names
    const convertedData = { ...data };
    
    // Convert passingYear to string if it's a number (for backward compatibility)
    if (convertedData.passingYear && typeof convertedData.passingYear === 'number') {
      convertedData.passingYear = convertedData.passingYear.toString();
    }

    // Convert permanent address fields
    if (data.permanentCountry && data.permanentDivision && data.permanentZilla && data.permanentUpazilla) {
      convertedData.permanentLocation = `${data.permanentCountry} > ${data.permanentDivision} > ${data.permanentZilla} > ${data.permanentUpazilla}`;
    }

    // Convert present address fields
    if (data.presentCountry && data.presentDivision && data.presentZilla && data.presentUpazilla) {
      convertedData.presentLocation = `${data.presentCountry} > ${data.presentDivision} > ${data.presentZilla} > ${data.presentUpazilla}`;
    }

    setFormData((prev: any) => ({
      ...prev,
      ...convertedData,
      // Ensure default values are preserved if not in loaded data
      partnerAgeMin: convertedData.partnerAgeMin || 18,
      partnerAgeMax: convertedData.partnerAgeMax || 35,
      sameAsPermanent: convertedData.sameAsPermanent || false,
    }));
    // Clear any existing errors when loading data
    setErrors({});
    
    // Only reset step if not preserving it (for initial load)
    // Check both 'step' and 'currentStep' fields for backward compatibility
    const stepToLoad = data.step || data.currentStep;
    if (!preserveStep && stepToLoad) {
      console.log('⚠️ Resetting step from', currentStepRef.current, 'to', stepToLoad);
      setCurrentStep(stepToLoad);
      currentStepRef.current = stepToLoad;
      
      // Set highest step reached based on completed steps or current step
      const completedSteps = data.completedSteps || [];
      let maxCompletedStep = 1;
      
      if (Array.isArray(completedSteps) && completedSteps.length > 0) {
        const parsedSteps = completedSteps.map((s: any) => {
          const num = typeof s === 'string' ? parseInt(s) : s;
          return isNaN(num) ? 1 : num;
        });
        maxCompletedStep = Math.max(...parsedSteps);
      }
      
      // Use the higher of stepToLoad or maxCompletedStep
      const highestReached = Math.max(stepToLoad, maxCompletedStep);
      setHighestStepReached(highestReached);
      highestStepReachedRef.current = highestReached;
      console.log('📈 Set highest step reached on data load:', highestReached);
    } else {
      console.log('✅ Preserving current step:', currentStepRef.current);
    }
  }, []);

  const validateCurrentStep = () => {
    const stepSchema = stepSchemas[currentStep - 1];
    if (!stepSchema) return true;

    console.log(`🔍 Validating step ${currentStep}`, { formData, currentStep });
    console.log('🔍 Form data keys:', Object.keys(formData));
    console.log('🔍 sameAsPermanent value:', formData.sameAsPermanent);

    try {
      // For step 1, handle conditional validation for present address
      if (currentStep === 1) {
        const validationData = { ...formData };

        // Additional validation: ensure required fields are present
        const requiredFields = [
          'religion', 'biodataType', 'maritalStatus', 'dateOfBirth', 'age',
          'height', 'weight', 'complexion', 'profession', 'bloodGroup',
          'permanentLocation', 'permanentArea', 'healthIssues'
        ];

        // Check if all required fields are present and not empty
        console.log('🔍 Checking required fields:', requiredFields);
        for (const field of requiredFields) {
          const value = validationData[field];
          console.log(`🔍 Checking field ${field}:`, { value, type: typeof value });
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            console.log(`❌ Validation failed: ${field} is missing or empty`, { field, value });
            setErrors({ [field]: `${field} is required` });
            return false;
          }
        }

        // Special validation for age
        if (validationData.age === undefined || validationData.age === null) {
          console.log(`❌ Validation failed: Age is missing`, { age: validationData.age });
          setErrors({ age: 'Please enter a valid date of birth to calculate your age' });
          return false;
        }

        if (validationData.age < 18) {
          console.log(`❌ Validation failed: Age is too low`, { age: validationData.age });
          setErrors({ age: 'You must be at least 18 years old' });
          return false;
        }

        if (validationData.age > 70) {
          console.log(`❌ Validation failed: Age is too high`, { age: validationData.age });
          setErrors({ age: 'Age must be 70 years or less' });
          return false;
        }

        // Check present address requirements
        if (!validationData.sameAsPermanent) {
          const presentAddressErrors: any = {};
          let hasPresentAddressError = false;

          // Check present location
          if (!validationData.presentLocation || validationData.presentLocation.trim() === '') {
            presentAddressErrors.presentLocation = 'Present location is required';
            hasPresentAddressError = true;
          }

          // Check present area
          if (!validationData.presentArea || validationData.presentArea.trim() === '') {
            presentAddressErrors.presentArea = 'Present area is required';
            hasPresentAddressError = true;
          }

          if (hasPresentAddressError) {
            console.log('❌ Validation failed: Present address errors', presentAddressErrors);
            setErrors(presentAddressErrors);
            return false;
          }
        } else {
          // If sameAsPermanent is true, copy permanent data to present data for validation
          if (validationData.permanentLocation && validationData.permanentArea &&
            validationData.permanentLocation.trim() !== '' && validationData.permanentArea.trim() !== '') {
            validationData.presentLocation = validationData.permanentLocation;
            validationData.presentArea = validationData.permanentArea;
            console.log('🏠 Copied permanent address to present for validation:', {
              presentLocation: validationData.presentLocation,
              presentArea: validationData.presentArea
            });
          } else {
            // If sameAsPermanent is true but permanent data is missing, that's an error
            console.log('❌ Validation failed: Permanent address missing when sameAsPermanent is true');
            setErrors({
              permanentLocation: 'Permanent location is required when present address is same as permanent',
              permanentArea: 'Permanent area is required when present address is same as permanent'
            });
            return false;
          }
        }

        console.log('🔍 Final validation data before Zod:', {
          presentLocation: validationData.presentLocation,
          presentArea: validationData.presentArea,
          sameAsPermanent: validationData.sameAsPermanent
        });

        // Now run Zod validation with the prepared data
        stepSchema.parse(validationData);
      } else {
        stepSchema.parse(formData);
      }

      console.log('✅ Validation passed for step', currentStep);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: any = {};
        error.issues.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        console.log('❌ Zod validation failed:', fieldErrors);
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const nextStep = () => {
    console.log(`🚀 nextStep called: ${currentStep} -> ${currentStep + 1} (max: ${totalSteps})`);
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      currentStepRef.current = newStep;
      
      // Update highest step reached if we're going to a new step
      if (newStep > highestStepReached) {
        setHighestStepReached(newStep);
        highestStepReachedRef.current = newStep;
        console.log(`📈 New highest step reached: ${newStep}`);
      }
      
      console.log(`✅ Step changed successfully to ${newStep}`);
      // Add a small delay to ensure state update is processed
      setTimeout(() => {
        console.log(`🔍 Step state after update: ${newStep}`);
      }, 100);
    } else {
      console.log(`⚠️ Already at last step (${currentStep}), cannot go further`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      currentStepRef.current = newStep;
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      currentStepRef.current = step;
      
      // Update highest step reached if we're going to a new step
      if (step > highestStepReached) {
        setHighestStepReached(step);
        highestStepReachedRef.current = step;
        console.log(`📈 New highest step reached via goToStep: ${step}`);
      }
    }
  };

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return {
    currentStep,
    highestStepReached,
    formData,
    errors,
    updateFormData,
    loadFormData,
    validateCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep,
    isLastStep,
  };
}
