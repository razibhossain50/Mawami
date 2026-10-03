import { renderHook, act } from '@testing-library/react';
import { useStepForm } from '../../frontend/src/hooks/use-step-form';

describe('useStepForm', () => {
  const totalSteps = 5;

  beforeEach(() => {
    // Clear console mocks before each test
    jest.clearAllMocks();
  });

  it('should initialize with step 1', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
  });

  it('should have default form data', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    expect(result.current.formData).toEqual({
      partnerAgeMin: 18,
      partnerAgeMax: 35,
      sameAsPermanent: false,
      profilePictureVisible: false,
    });
  });

  it('should update form data correctly', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    act(() => {
      result.current.updateFormData({
        religion: 'Islam',
        biodataType: 'Male',
        age: 25,
      });
    });
    
    expect(result.current.formData).toEqual({
      partnerAgeMin: 18,
      partnerAgeMax: 35,
      sameAsPermanent: false,
      profilePictureVisible: false,
      religion: 'Islam',
      biodataType: 'Male',
      age: 25,
    });
  });

  it('should progress to next step', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    act(() => {
      result.current.nextStep();
    });
    
    expect(result.current.currentStep).toBe(2);
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);
  });

  it('should not progress beyond last step', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    // Go to last step one by one
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(2);
    
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(3);
    
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(4);
    
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(5);
    expect(result.current.isLastStep).toBe(true);
    
    // Try to go beyond last step
    act(() => {
      result.current.nextStep();
    });
    
    expect(result.current.currentStep).toBe(5);
  });

  it('should go to previous step', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    // Go to step 3 one by one
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(2);
    
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(3);
    
    // Go back to step 2
    act(() => {
      result.current.prevStep();
    });
    
    expect(result.current.currentStep).toBe(2);
  });

  it('should not go below step 1', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    expect(result.current.currentStep).toBe(1);
    
    act(() => {
      result.current.prevStep();
    });
    
    expect(result.current.currentStep).toBe(1);
  });

  it('should go to specific step', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    act(() => {
      result.current.goToStep(3);
    });
    
    expect(result.current.currentStep).toBe(3);
  });

  it('should not go to invalid steps', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    act(() => {
      result.current.goToStep(0);
    });
    expect(result.current.currentStep).toBe(1);
    
    act(() => {
      result.current.goToStep(totalSteps + 1);
    });
    expect(result.current.currentStep).toBe(1);
  });

  it('should validate step 1 correctly', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    // Test with missing required fields
    act(() => {
      result.current.updateFormData({
        religion: 'Islam',
        // Missing other required fields
      });
    });
    
    let isValid;
    act(() => {
      isValid = result.current.validateCurrentStep();
    });
    
    expect(isValid).toBe(false);
    // The errors should be set after validation
    expect(result.current.errors).not.toEqual({});
  });

  it('should validate step 1 with all required fields', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    act(() => {
      result.current.updateFormData({
        religion: 'Islam',
        biodataType: 'Male',
        maritalStatus: 'Single',
        dateOfBirth: '1995-01-01',
        age: 29,
        height: '5.6',
        weight: 70,
        complexion: 'Wheatish',
        profession: 'Engineer',
        bloodGroup: 'A+',
        permanentLocation: 'Bangladesh > Dhaka > Dhaka > Dhanmondi',
        permanentArea: 'Test Area',
        healthIssues: 'None',
        sameAsPermanent: true,
      });
    });
    
    const isValid = result.current.validateCurrentStep();
    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('should load form data correctly', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    const testData = {
      religion: 'Islam',
      biodataType: 'Female',
      age: 25,
      permanentCountry: 'Bangladesh',
      permanentDivision: 'Dhaka',
      permanentZilla: 'Dhaka',
      permanentUpazilla: 'Dhanmondi',
    };
    
    act(() => {
      result.current.loadFormData(testData, false);
    });
    
    expect(result.current.formData.religion).toBe('Islam');
    expect(result.current.formData.biodataType).toBe('Female');
    expect(result.current.formData.age).toBe(25);
    expect(result.current.formData.permanentLocation).toBe('Bangladesh > Dhaka > Dhaka > Dhanmondi');
  });

  it('should preserve step when loading data with preserveStep=true', () => {
    const { result } = renderHook(() => useStepForm(totalSteps));
    
    // Go to step 3 one by one
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(2);
    
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(3);
    
    const testData = {
      religion: 'Islam',
      currentStep: 1, // This should be ignored
    };
    
    act(() => {
      result.current.loadFormData(testData, true);
    });
    
    // Step should remain 3
    expect(result.current.currentStep).toBe(3);
  });
});
