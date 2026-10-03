'use client';
import { useStepForm } from "@/hooks/use-step-form";
import { StepIndicator } from "@/components/profile/marriage/step-indicator";
import { PersonalInfoStep } from "@/components/profile/marriage/personal-info-step";
import { EducationalInfoStep } from "@/components/profile/marriage/educational-info-step";
import { FamilyInfoStep } from "@/components/profile/marriage/family-info-step";
import { ContactInfoStep } from "@/components/profile/marriage/contact-info-step";
import { PartnerPreferencesStep } from "@/components/profile/marriage/partner-preferences-step";
import { Button, Card, CardBody, addToast } from "@heroui/react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/services/queryClient";
import { useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';

const steps = [
    { title: "Personal Information", subtitle: "Basic details about you" },
    { title: "Educational Information", subtitle: "Your academic background" },
    { title: "Family Information", subtitle: "About your family" },
    { title: "Desired Life Partner", subtitle: "Partner preferences" },
    { title: "Contact Information", subtitle: "Final details" },
];

// Total number of steps - can be easily modified to add more steps
const TOTAL_STEPS = steps.length;

export default function BiodataForm() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const params = useParams();
    const biodataId = params.id as string;
    const biodataIdRef = useRef<number | null>(null);
    const hasLoadedInitialData = useRef(false);

    // Check if this is create mode (id = "new") or edit mode (id = actual ID)
    const isCreateMode = biodataId === "new";

    const {
        currentStep,
        highestStepReached,
        formData,
        errors,
        nextStep,
        prevStep,
        goToStep,
        updateFormData,
        validateCurrentStep,
        isLastStep,
        isFirstStep,
        loadFormData,
    } = useStepForm(TOTAL_STEPS);

    // Query to fetch existing biodata for editing
    const { data: existingBiodata, isLoading, error } = useQuery({
        queryKey: ['biodata', biodataId],
        queryFn: async () => {
            const token = localStorage.getItem('regular_user_access_token');
            if (!token) {
                throw new Error('Authentication required');
            }

            if (isCreateMode) {
                // For create mode, try to fetch current user's biodata to see if they already have one
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/biodatas/current`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // If user already has biodata, redirect to edit mode
                        if (data && data.id) {
                            router.replace(`/profile/biodatas/edit/${data.id}`);
                            return { redirecting: true };
                        }
                    }
                    return null; // No existing biodata, proceed with create
                } catch (error) {
                    return null; // Error fetching, proceed with create
                }
            } else {
                // Edit mode - fetch specific biodata by ID (owner endpoint)
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/biodatas/owner/${biodataId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        }
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Failed to fetch biodata:', {
                            status: response.status,
                            statusText: response.statusText,
                            error: errorText,
                            biodataId: biodataId
                        });
                        
                        // If it's a 404, the biodata doesn't exist
                        if (response.status === 404) {
                            router.replace('/profile/biodatas/edit/new');
                            return { redirecting: true };
                        }
                        
                        // If it's a 403, user doesn't own this biodata
                        if (response.status === 403) {
                            // Try to get their own biodata instead
                            const currentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/biodatas/current`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                }
                            });
                            
                            if (currentResponse.ok) {
                                const currentData = await currentResponse.json();
                                if (currentData && currentData.id) {
                                    router.replace(`/profile/biodatas/edit/${currentData.id}`);
                                    return { redirecting: true };
                                }
                            }
                            
                            // If no current biodata, redirect to create
                            router.replace('/profile/biodatas/edit/new');
                            return { redirecting: true };
                        }
                        
                        throw new Error(`Failed to fetch biodata: ${response.status} ${response.statusText}`);
                    }

                    const data = await response.json();
                    return data;
                } catch (error) {
                    throw new Error('Failed to load biodata for editing');
                }
            }
        },
        enabled: !!biodataId,
    });

    // Function to convert new field names back to old field names for backend compatibility
    const convertToBackendFormat = (data: Record<string, unknown>) => {
        const convertedData = { ...data };

        // Convert permanentLocation back to individual fields
        if (data.permanentLocation && typeof data.permanentLocation === 'string') {
            const parts = (data.permanentLocation as string).split(' > ');
            if (parts.length >= 4) {
                convertedData.permanentCountry = parts[0];
                convertedData.permanentDivision = parts[1];
                convertedData.permanentZilla = parts[2];
                convertedData.permanentUpazilla = parts[3];
            } else {
                // If the format is not as expected, set default values
                console.warn('Permanent location format not as expected:', data.permanentLocation);
                convertedData.permanentCountry = 'Bangladesh';
                convertedData.permanentDivision = 'Dhaka';
                convertedData.permanentZilla = 'Dhaka';
                convertedData.permanentUpazilla = 'Dhanmondi';
            }
        }

        // Convert presentLocation back to individual fields
        if (data.presentLocation && typeof data.presentLocation === 'string') {
            const parts = (data.presentLocation as string).split(' > ');
            if (parts.length >= 4) {
                convertedData.presentCountry = parts[0];
                convertedData.presentDivision = parts[1];
                convertedData.presentZilla = parts[2];
                convertedData.presentUpazilla = parts[3];
            } else {
                // If the format is not as expected, set default values
                console.warn('Present location format not as expected:', data.presentLocation);
                convertedData.presentCountry = 'Bangladesh';
                convertedData.presentDivision = 'Dhaka';
                convertedData.presentZilla = 'Dhaka';
                convertedData.presentUpazilla = 'Dhanmondi';
            }
        }

        // Remove new field names to avoid confusion
        delete convertedData.permanentLocation;
        delete convertedData.presentLocation;

        console.log('🔄 Converted data for backend:', convertedData);
        return convertedData;
    };

    // Mutation for saving step data
    const saveStepMutation = useMutation({
        mutationFn: async ({ stepData, step }: { stepData: Record<string, unknown>; step: number }) => {
            console.log('🚀 saveStepMutation called with:', { stepData, step });

            // Convert new field names to backend format
            const convertedStepData = convertToBackendFormat(stepData);

            // For both create and edit mode, we use PUT /current to update user's biodata
            // This endpoint will create if doesn't exist, or update if exists
            // Calculate completed steps properly
            const currentCompletedSteps = existingBiodata?.completedSteps || [];
            const parsedCurrentCompleted = Array.isArray(currentCompletedSteps)
                ? currentCompletedSteps.map((s: any) => {
                    const num = typeof s === 'string' ? parseInt(s) : s;
                    return isNaN(num) ? null : num;
                }).filter((n: any) => n !== null) as number[]
                : [];

            // When completing a step, mark only the current step as completed
            // This ensures that each step is only marked complete when actually completed
            const newCompletedSteps = [...new Set([...parsedCurrentCompleted, step])].sort((a, b) => a - b);

            // Determine the approval status based on completion
            const isAllStepsCompleted = newCompletedSteps.length === TOTAL_STEPS &&
                newCompletedSteps.every((s, index) => s === index + 1);

            const approvalStatus = isAllStepsCompleted ? 'pending' : 'in_progress';

            const payload = {
                ...convertedStepData,
                step,
                completedSteps: newCompletedSteps,
                biodataApprovalStatus: approvalStatus,
            };

            console.log('📤 Sending payload to backend:', payload);
            console.log('Profile picture in step data:', {
                value: (convertedStepData as any).profilePicture,
                isNull: (convertedStepData as any).profilePicture === null,
                isUndefined: (convertedStepData as any).profilePicture === undefined,
                type: typeof (convertedStepData as any).profilePicture
            });
            const response = await apiRequest("PUT", "/api/biodatas/current", payload);
            const result = await response.json();
            console.log('📥 Received response from backend:', result);

            // Update biodataIdRef if we got an ID back
            if (result.id && !biodataIdRef.current) {
                biodataIdRef.current = result.id;
            }

            return result;
        },
        onSuccess: async (data) => {
            console.log('✅ saveStepMutation onSuccess called with:', data);

            // Store the current step before moving to next
            const completedStep = currentStep;
            const nextStepNumber = currentStep + 1;

            // Move to next step
            nextStep();

            // Update the query cache to reflect the completed step and new current step
            queryClient.setQueryData(['biodata', biodataId], (oldData: any) => {
                if (!oldData) return oldData;

                // Calculate the new completedSteps based on the completed step
                const currentCompletedSteps = oldData.completedSteps || [];
                const parsedCurrentCompleted = Array.isArray(currentCompletedSteps)
                    ? currentCompletedSteps.map((s: any) => {
                        const num = typeof s === 'string' ? parseInt(s) : s;
                        return isNaN(num) ? null : num;
                    }).filter((n: any) => n !== null) as number[]
                    : [];

                // When completing a step, mark only the completed step as completed
                const newCompletedSteps = [...new Set([...parsedCurrentCompleted, completedStep])].sort((a, b) => a - b);

                return {
                    ...oldData,
                    ...data,
                    completedSteps: newCompletedSteps,
                    step: nextStepNumber // The new current step
                };
            });
        },
        onError: (error: unknown) => {
            console.log('❌ saveStepMutation onError called with:', error);
            const stepError = handleApiError(error, 'BiodataEdit');
            logger.error('saveStepMutation error', stepError, 'BiodataEdit');
            // No toast for step save errors - user will see validation errors in the form
        },
    });

    // Final submission mutation
    const submitMutation = useMutation({
        mutationFn: async (data: Record<string, unknown>) => {
            // Convert new field names to backend format
            const convertedData = convertToBackendFormat(data);

            // For both create and edit mode, use PUT /current for final submission
            // This ensures the biodata is associated with the current logged-in user
            const payload = {
                ...convertedData,
                biodataApprovalStatus: 'pending', // Final submission always sets to pending
                biodataVisibilityStatus: 'active',
                completedSteps: Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1), // Mark all steps as completed
            };

            const response = await apiRequest("PUT", "/api/biodatas/current", payload);
            const result = await response.json();
            return result;
        },
        onSuccess: (data) => {
            // Update the query cache to reflect the final submission
            queryClient.setQueryData(['biodata', biodataId], (oldData: any) => {
                if (!oldData) return data;
                return {
                    ...oldData,
                    ...data,
                    completedSteps: Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1),
                    biodataApprovalStatus: 'pending',
                    biodataVisibilityStatus: 'active'
                };
            });

            // Show HeroUI success toast
            addToast({
                title: "Success!",
                color: "success",
                description: isCreateMode
                    ? "Your biodata has been created and submitted successfully!"
                    : "Your biodata has been updated and submitted successfully!",
                timeout: 4000,
            });

            // Redirect to the biodata view page after successful create/update
            setTimeout(() => {
                const targetId = isCreateMode ? (data.id || biodataIdRef.current) : biodataId;
                router.push(`/profile/biodatas/${targetId}`);
            }, 2000);
        },
        onError: (error: unknown) => {
            const submitError = handleApiError(error, 'BiodataEdit');
            logger.error('submitMutation.onError called with', submitError, 'BiodataEdit');
            const errorMessage = (error as Error)?.message ||
                (isCreateMode ? "Failed to create biodata. Please try again." : "Failed to update biodata. Please try again.");
            addToast({
                title: "Error",
                description: errorMessage,
            });
        },
    });

    // Load existing data when component mounts (only once)
    useEffect(() => {
        if (existingBiodata && !existingBiodata.redirecting && !hasLoadedInitialData.current) {
            biodataIdRef.current = existingBiodata.id;

            // Normalize completedSteps (numbers, ascending) on a copy; the query cache must not be mutated
            let biodataToLoad = existingBiodata;
            if (Array.isArray(existingBiodata.completedSteps)) {
                const sortedSteps = existingBiodata.completedSteps
                    .map((s: any) => (typeof s === 'string' ? parseInt(s, 10) : s))
                    .filter((n: any) => typeof n === 'number' && !isNaN(n))
                    .sort((a: number, b: number) => a - b);
                biodataToLoad = { ...existingBiodata, completedSteps: sortedSteps };
            }

            loadFormData(biodataToLoad, false); // Don't preserve step for initial load
            hasLoadedInitialData.current = true;
        }
    }, [existingBiodata?.id, existingBiodata?.redirecting]); // Only depend on stable values

    // Show loading state if we're redirecting
    if (existingBiodata?.redirecting) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to your biodata...</p>
                </div>
            </div>
        );
    }

    const handleNext = async () => {
        console.log('🔄 handleNext called, currentStep:', currentStep);

        // Prevent multiple clicks
        if (saveStepMutation.isPending) {
            console.log('⏳ Mutation is pending, skipping');
            return;
        }

        const isValid = validateCurrentStep();
        console.log('✅ Validation result:', isValid);

        if (!isValid) {
            console.log('❌ Validation failed, stopping');
            return; // Stop here if validation fails
        }

        console.log('🚀 Calling saveStepMutation.mutate');
        // Save current step data - nextStep() will be called in onSuccess callback
        saveStepMutation.mutate({
            stepData: formData,
            step: currentStep,
        });
    };

    const handleSubmit = async () => {
        const isValid = validateCurrentStep();
        if (!isValid) {
            return;
        }

        try {
            await submitMutation.mutateAsync(formData);
        } catch (error) {
            const submissionError = handleApiError(error, 'BiodataEdit');
            logger.error('Submission error', submissionError, 'BiodataEdit');
            // Error is handled by the mutation's onError
        }
    };

    const handleStepClick = (stepNumber: number) => {
        // Ensure completedSteps is always an array of numbers in correct order
        let completedSteps: number[] = [];
        if (existingBiodata?.completedSteps) {
            if (Array.isArray(existingBiodata.completedSteps)) {
                // Handle array of strings or numbers
                completedSteps = existingBiodata.completedSteps.map((s: any) => {
                    const num = typeof s === 'string' ? parseInt(s) : s;
                    return isNaN(num) ? null : num;
                }).filter((n: any) => n !== null) as number[];
            } else if (typeof existingBiodata.completedSteps === 'string') {
                // Parse string representation of array
                try {
                    const parsed = JSON.parse(existingBiodata.completedSteps);
                    if (Array.isArray(parsed)) {
                        completedSteps = parsed.map((s: any) => {
                            const num = typeof s === 'string' ? parseInt(s) : s;
                            return isNaN(num) ? null : num;
                        }).filter((n: any) => n !== null) as number[];
                    }
                } catch (e) {
                    // If JSON parsing fails, try splitting by comma
                    completedSteps = existingBiodata.completedSteps.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
                }
            } else if (typeof existingBiodata.completedSteps === 'number') {
                // If it's a single number, convert to array
                completedSteps = [existingBiodata.completedSteps];
            }
        }

        // Always sort to ensure correct order
        completedSteps = completedSteps.sort((a, b) => a - b);

        // Enhanced fallback logic that considers both server-side completed steps 
        // and client-side progress (highest step reached in current session)
        const getEffectiveCompletedSteps = () => {
            const effective = [...completedSteps];

            // If we have any completed steps from server, infer that previous steps are also completed
            if (completedSteps.length > 0) {
                const maxCompletedStep = Math.max(...completedSteps);
                for (let i = 1; i <= maxCompletedStep; i++) {
                    if (!effective.includes(i)) {
                        effective.push(i);
                    }
                }
            }

            // Consider steps up to the highest step reached in current session as accessible
            // This is the key fix: use highestStepReached instead of currentStep
            if (highestStepReached > 1) {
                for (let i = 1; i < highestStepReached; i++) {
                    if (!effective.includes(i)) {
                        effective.push(i);
                    }
                }
            }

            return effective.sort((a, b) => a - b);
        };

        const effectiveCompletedSteps = getEffectiveCompletedSteps();

        console.log('🔄 handleStepClick:', {
            stepNumber,
            currentStep,
            highestStepReached,
            completedSteps,
            effectiveCompletedSteps,
            canNavigate: effectiveCompletedSteps.includes(stepNumber) || stepNumber === currentStep
        });

        // Allow navigation to completed steps, current step, or if we've reached this step before
        if (effectiveCompletedSteps.includes(stepNumber) || stepNumber === currentStep || stepNumber <= highestStepReached) {
            goToStep(stepNumber);
        }
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <PersonalInfoStep
                        data={formData}
                        errors={errors}
                        updateData={updateFormData}
                    />
                );
            case 2:
                return (
                    <EducationalInfoStep
                        data={formData}
                        errors={errors}
                        updateData={updateFormData}
                    />
                );
            case 3:
                return (
                    <FamilyInfoStep
                        data={formData}
                        errors={errors}
                        updateData={updateFormData}
                    />
                );
            case 4:
                return (
                    <PartnerPreferencesStep
                        data={formData}
                        errors={errors}
                        updateData={updateFormData}
                    />
                );
            case 5:
                return (
                    <ContactInfoStep
                        data={formData}
                        errors={errors}
                        updateData={updateFormData}
                    />
                );
            default:
                return null;
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <Card className="max-w-md mx-auto">
                    <CardBody className="p-8 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Biodata</h2>
                        <p className="text-gray-600 mb-6">
                            {(error as Error)?.message || "Failed to load biodata for editing"}
                        </p>
                        <div className="space-y-3">
                            <Button onClick={() => window.location.reload()} className="w-full">
                                Try Again
                            </Button>
                            <Button variant="bordered" as={Link} href="/profile/biodatas" className="w-full">
                                View Biodatas
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-5xl mx-auto px-3 md:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <div className="text-center mb-6">
                    <Button
                        variant="bordered"
                        as={Link}
                        href={isCreateMode ? "/profile/biodatas" : `/profile/biodatas/${biodataId}`}
                        startContent={<ArrowLeft className="w-4 h-4" />}
                    >
                        {isCreateMode ? "View Biodatas" : "View Bioadata"}
                    </Button>
                </div>

                {/* Modern Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {isCreateMode ? "Create Your Biodata" : "Edit Your Biodata"}
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {isCreateMode
                            ? "Fill out your information step by step to create a complete and beautiful profile"
                            : "Update your information to keep your profile current and attractive"
                        }
                    </p>
                </div>

                {/* Step Indicator */}
                <StepIndicator
                    steps={steps}
                    currentStep={currentStep}
                    highestStepReached={highestStepReached}
                    completedSteps={existingBiodata?.completedSteps || []}
                    onStepClick={handleStepClick}
                    className="mb-8"
                />


                {/* Form Content */}
                <Card className="shadow-sm">
                    <CardBody className="p-4 md:p-8">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-slate-600">Loading your biodata...</p>
                                </div>
                            </div>
                        ) : (
                            renderCurrentStep()
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-8">
                            <Button
                                className="px-3"
                                variant="bordered"
                                onClick={prevStep}
                                isDisabled={isFirstStep}
                                startContent={<ChevronLeft className="w-4 h-4" />}
                            >
                                Previous
                            </Button>

                            <div className="text-sm text-slate-500">
                                Step {currentStep} of {steps.length}
                            </div>

                            {isLastStep ? (
                                <Button
                                    className="px-3"
                                    color="primary"
                                    onClick={handleSubmit}
                                    isDisabled={submitMutation.isPending || saveStepMutation.isPending}
                                >
                                    {submitMutation.isPending
                                        ? (isCreateMode ? "Creating..." : "Updating...")
                                        : (isCreateMode ? "Create Biodata" : "Update Biodata")}
                                </Button>
                            ) : (
                                <Button
                                    color="primary"
                                    onClick={handleNext}
                                    isDisabled={saveStepMutation.isPending}
                                    endContent={<ChevronRight className="w-4 h-4" />}
                                >
                                    {saveStepMutation.isPending ? "Saving..." : "Next"}
                                </Button>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}