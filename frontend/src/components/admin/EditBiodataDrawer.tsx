"use client"
import { FormInput, FormTextarea, FormSelect, FormDatePicker } from "@/components/ui/form-fields";
import React from "react";
import { Drawer, Button, Card, Checkbox, Tooltip, Switch, toast } from "@heroui/react";
import { AgeRangeSlider } from "@/components/ui/age-range-slider";
import { Info, Upload, Trash2 } from "lucide-react";
import { LocationSelector } from '@/components/form/LocationSelector';
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { adminApi } from '@/services/api-client';
import { ageFromDob } from '@/services/utils';
import { FileUploadResponse } from '@/types/api';
import { ImageUploadWithCrop } from '@/components/common/ImageUploadWithCrop';
import { ImageCropResult } from '@/hooks/useImageCrop';

import { BiodataProfile, BiodataApprovalStatus, BiodataVisibilityStatus } from '@/types/biodata';

// Create a compatible type that matches the drawer's needs
interface Biodata extends Omit<BiodataProfile, 'email' | 'biodataApprovalStatus' | 'biodataVisibilityStatus'> {
    username?: string | null;
    email: string | null; // Allow null for compatibility
    biodataApprovalStatus: string; // Use string for compatibility
    biodataVisibilityStatus: string; // Use string for compatibility
}

interface EditBiodataDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedBiodata: Biodata | null;
    onBiodataUpdated: (updatedBiodata: Biodata) => void;
    onBiodataCreated?: (newBiodata: Biodata) => void;
}

export default function EditBiodataDrawer({
    isOpen,
    onClose,
    selectedBiodata,
    onBiodataUpdated,
    onBiodataCreated
}: EditBiodataDrawerProps) {
    const [editFormData, setEditFormData] = React.useState<Partial<Biodata>>({});
    const [isUpdatingBiodata, setIsUpdatingBiodata] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);

    // Re-initialize the form when selectedBiodata changes (during render, not in an effect)
    const [initializedFor, setInitializedFor] = React.useState<typeof selectedBiodata | undefined>(undefined);
    if (initializedFor !== selectedBiodata) {
        setInitializedFor(selectedBiodata);
        setTouchedFields(new Set());
        setHasAttemptedSubmit(false);

        if (selectedBiodata) {
            setEditFormData(selectedBiodata);
        } else {
            // Initialize with default values for new biodata
            setEditFormData({
                step: 1,
                completedSteps: [1],
                partnerAgeMin: 18,
                partnerAgeMax: 35,
                sameAsPermanent: false,
                religion: '',
                biodataType: '',
                maritalStatus: '',
                dateOfBirth: '',
                age: 0,
                height: '',
                weight: undefined,
                complexion: '',
                profession: '',
                bloodGroup: '',
                permanentCountry: 'Bangladesh',
                permanentDivision: '',
                permanentZilla: '',
                permanentUpazilla: '',
                permanentArea: '',
                presentCountry: 'Bangladesh',
                presentDivision: '',
                presentZilla: '',
                presentUpazilla: '',
                presentArea: '',
                healthIssues: 'None',
                educationMedium: '',
                highestEducation: '',
                instituteName: '',
                subject: '',
                passingYear: '',
                result: '',
                economicCondition: '',
                fatherName: '',
                fatherProfession: '',
                fatherAlive: 'Yes',
                motherName: '',
                motherProfession: '',
                motherAlive: 'Yes',
                brothersCount: 0,
                sistersCount: 0,
                familyDetails: '',
                partnerComplexion: '',
                partnerHeight: '',
                partnerEducation: '',
                partnerProfession: '',
                partnerLocation: '',
                partnerDetails: '',
                fullName: '',
                profilePicture: null,
                profilePictureVisible: false,
                email: '',
                guardianMobile: '',
                ownMobile: '',
                biodataApprovalStatus: 'pending',
                biodataVisibilityStatus: 'active'
            });
        }
    }

    // Cleanup object URLs to prevent memory leaks

    // Age is derived from the date of birth
    const calculatedAge = ageFromDob(editFormData.dateOfBirth);

    // Handle save biodata (create or update)
    const handleSaveBiodata = async () => {
        console.log('🚀 handleSaveBiodata called');
        if (!editFormData) {
            console.log('❌ No form data');
            return;
        }

        setHasAttemptedSubmit(true);

        // Debug: Log form data to see what's missing
        console.log('🔍 Form data before validation:', editFormData);

        // Comprehensive validation check - Core required fields only
        const missingFields = [];

        // Personal Information (Core)
        if (!editFormData.fullName?.trim()) missingFields.push('Your full name');
        if (!editFormData.biodataType?.trim()) missingFields.push('Biodata Type');
        if (!editFormData.religion?.trim()) missingFields.push('Religion');
        if (!editFormData.maritalStatus?.trim()) missingFields.push('Marital Status');
        if (!editFormData.dateOfBirth?.trim()) missingFields.push('Date of Birth');
        if (!editFormData.height?.trim()) missingFields.push('Height');
        if (!editFormData.weight || editFormData.weight <= 0) missingFields.push('Weight');
        if (!editFormData.complexion?.trim()) missingFields.push('Complexion');
        if (!editFormData.profession?.trim()) missingFields.push('Profession');
        if (!editFormData.bloodGroup?.trim()) missingFields.push('Blood Group');



        // Address Information (Core)
        if (!editFormData.permanentArea?.trim()) missingFields.push('Permanent Area');
        if (!editFormData.presentArea?.trim()) missingFields.push('Present Area');

        // Address Location Check (more lenient)
        if (!editFormData.permanentDivision?.trim() && !editFormData.permanentCountry?.trim()) {
            missingFields.push('Permanent Address Location (please select from dropdown)');
        }
        if (!editFormData.presentDivision?.trim() && !editFormData.presentCountry?.trim()) {
            missingFields.push('Present Address Location (please select from dropdown)');
        }

        // Education & Family (Core)
        if (!editFormData.educationMedium?.trim()) missingFields.push('Education Medium');
        if (!editFormData.highestEducation?.trim()) missingFields.push('Highest Education');
        if (!editFormData.instituteName?.trim()) missingFields.push('Institute Name');
        if (!editFormData.subject?.trim()) missingFields.push('Subject');
        if (!editFormData.passingYear?.trim()) missingFields.push('Passing Year');
        if (!editFormData.result?.trim()) missingFields.push('Result');
        if (!editFormData.economicCondition?.trim()) missingFields.push('Economic Condition');
        if (!editFormData.fatherName?.trim()) missingFields.push("Father's Name");
        if (!editFormData.fatherProfession?.trim()) missingFields.push("Father's Profession");
        if (!editFormData.fatherAlive?.trim()) missingFields.push("Father's Status");
        if (!editFormData.motherName?.trim()) missingFields.push("Mother's Name");
        if (!editFormData.motherProfession?.trim()) missingFields.push("Mother's Profession");
        if (!editFormData.motherAlive?.trim()) missingFields.push("Mother's Status");
        if (editFormData.brothersCount === undefined) missingFields.push('Brothers Count');
        if (editFormData.sistersCount === undefined) missingFields.push('Sisters Count');

        // Partner Preferences (Core)
        if (!editFormData.partnerComplexion?.trim()) missingFields.push('Partner Complexion');
        if (!editFormData.partnerHeight?.trim()) missingFields.push('Partner Height');
        if (!editFormData.partnerEducation?.trim()) missingFields.push('Partner Education');
        if (!editFormData.partnerProfession?.trim()) missingFields.push('Partner Profession');
        if (!editFormData.partnerLocation?.trim()) missingFields.push('Partner Location');

        // Contact Information (Core)
        if (!editFormData.email?.trim()) missingFields.push('Email');
        if (!editFormData.guardianMobile?.trim()) missingFields.push("Guardian's Mobile");
        if (!editFormData.ownMobile?.trim()) missingFields.push('Own Mobile');

        // Health Information (with default)
        if (!editFormData.healthIssues?.trim()) {
            // Auto-fill with "None" if empty
            setEditFormData(prev => ({ ...prev, healthIssues: 'None' }));
        }

        if (missingFields.length > 0) {
            const errorMessage = `Please fill the following required fields: ${missingFields.join(', ')}`;
            setError(errorMessage);
            toast.danger(errorMessage);
            console.log('❌ Missing fields:', missingFields);
            console.log('📋 Current form data:', {
                permanentDivision: editFormData.permanentDivision,
                permanentCountry: editFormData.permanentCountry,
                presentDivision: editFormData.presentDivision,
                presentCountry: editFormData.presentCountry,
                permanentArea: editFormData.permanentArea,
                presentArea: editFormData.presentArea,
                healthIssues: editFormData.healthIssues
            });
            return;
        }



        console.log('✅ Validation passed, proceeding with API call');

        try {
            setIsUpdatingBiodata(true);
            setError(null);

            if (selectedBiodata) {
                // Update existing biodata
                logger.info('Updating biodata', {
                    biodataId: selectedBiodata.id,
                    updates: editFormData
                }, 'EditBiodataDrawer');

                const cleanData = prepareDataForApi(editFormData);
                console.log('🔧 Admin drawer sending update data:', cleanData);
                console.log('🖼️ Profile picture in admin update:', {
                    original: editFormData.profilePicture,
                    cleaned: cleanData.profilePicture,
                    isNull: cleanData.profilePicture === null
                });
                await adminApi.put(`/biodatas/${selectedBiodata.id}`, cleanData);

                // Show success toast
                toast.success('Biodata updated successfully!');

                // Call the parent callback to update the list
                onBiodataUpdated({ ...selectedBiodata, ...editFormData });

                logger.info('Biodata updated successfully', {
                    biodataId: selectedBiodata.id
                }, 'EditBiodataDrawer');
            } else {
                // Create new biodata
                const cleanData = prepareDataForApi(editFormData);
                logger.info('Creating new biodata', {
                    originalData: editFormData,
                    cleanData: cleanData
                }, 'EditBiodataDrawer');

                console.log('🚀 Sending biodata to API:', cleanData);
                console.log('📊 Data summary:', {
                    totalFields: Object.keys(cleanData).length,
                    requiredFieldsPresent: {
                        fullName: !!cleanData.fullName,
                        biodataType: !!cleanData.biodataType,
                        religion: !!cleanData.religion,
                        maritalStatus: !!cleanData.maritalStatus,
                        dateOfBirth: !!cleanData.dateOfBirth,
                        height: !!cleanData.height,
                        weight: !!cleanData.weight,
                        complexion: !!cleanData.complexion,
                        profession: !!cleanData.profession,
                        bloodGroup: !!cleanData.bloodGroup
                    },
                    addressFields: {
                        permanentCountry: cleanData.permanentCountry,
                        permanentDivision: cleanData.permanentDivision,
                        permanentArea: cleanData.permanentArea,
                        presentCountry: cleanData.presentCountry,
                        presentDivision: cleanData.presentDivision,
                        presentArea: cleanData.presentArea
                    }
                });

                const newBiodata = await adminApi.post('/biodatas', cleanData) as Biodata;

                // Show success toast
                toast.success('Biodata created successfully!');

                // Call the parent callback to add to the list
                if (onBiodataCreated) {
                    onBiodataCreated(newBiodata);
                }

                logger.info('Biodata created successfully', {
                    biodataId: newBiodata.id
                }, 'EditBiodataDrawer');
            }

            // Close drawer immediately
            handleClose();
        } catch (error) {
            const appError = handleApiError(error, 'EditBiodataDrawer');
            const action = selectedBiodata ? 'update' : 'create';

            // Log detailed error information
            logger.error(`Failed to ${action} biodata`, {
                error: appError,
                originalData: editFormData,
                cleanData: prepareDataForApi(editFormData),
                errorDetails: error
            }, 'EditBiodataDrawer');

            // Show detailed error message
            const errorMessage = appError.message;

            // Log the actual error for debugging
            console.error('❌ API Error:', {
                message: appError.message,
                status: (error as any)?.response?.status,
                data: (error as any)?.response?.data,
                formData: editFormData
            });

            setError(errorMessage);
            toast.danger(`Failed to ${action} biodata: ` + errorMessage);
        } finally {
            setIsUpdatingBiodata(false);
        }
    };

    // Helper function to mark field as touched
    const markFieldAsTouched = (fieldName: string) => {
        setTouchedFields(prev => new Set([...prev, fieldName]));
    };

    // Helper function to check if field should show validation error
    const shouldShowValidationError = (fieldName: string, isValid: boolean) => {
        return (touchedFields.has(fieldName) || hasAttemptedSubmit) && !isValid;
    };

    // Helper function to prepare data for API
    const prepareDataForApi = (data: Partial<Biodata>) => {
        const cleanData: any = { ...data };

        // Ensure completedSteps is an array or undefined
        if (cleanData.completedSteps === null) {
            cleanData.completedSteps = undefined;
        } else if (typeof cleanData.completedSteps === 'number') {
            cleanData.completedSteps = [cleanData.completedSteps];
        }

        // Ensure numeric fields are properly typed
        if (cleanData.age !== undefined && cleanData.age !== null) {
            cleanData.age = Number(cleanData.age);
        }
        if (cleanData.weight !== undefined && cleanData.weight !== null) {
            cleanData.weight = Number(cleanData.weight);
        }
        if (cleanData.partnerAgeMin !== undefined && cleanData.partnerAgeMin !== null) {
            cleanData.partnerAgeMin = Number(cleanData.partnerAgeMin);
        }
        if (cleanData.partnerAgeMax !== undefined && cleanData.partnerAgeMax !== null) {
            cleanData.partnerAgeMax = Number(cleanData.partnerAgeMax);
        }
        if (cleanData.passingYear !== undefined && cleanData.passingYear !== null) {
            cleanData.passingYear = String(cleanData.passingYear);
        }
        if (cleanData.brothersCount !== undefined && cleanData.brothersCount !== null) {
            cleanData.brothersCount = Number(cleanData.brothersCount);
        }
        if (cleanData.sistersCount !== undefined && cleanData.sistersCount !== null) {
            cleanData.sistersCount = Number(cleanData.sistersCount);
        }
        if (cleanData.step !== undefined && cleanData.step !== null) {
            cleanData.step = Number(cleanData.step);
        }

        // Ensure boolean fields are properly set
        if (cleanData.sameAsPermanent === undefined || cleanData.sameAsPermanent === null) {
            cleanData.sameAsPermanent = false;
        }
        if (cleanData.profilePictureVisible === undefined || cleanData.profilePictureVisible === null) {
            cleanData.profilePictureVisible = false;
        }

        // Ensure required string fields are not empty
        const requiredStringFields = [
            'fullName', 'biodataType', 'religion', 'maritalStatus', 'dateOfBirth',
            'height', 'complexion', 'profession', 'bloodGroup', 'permanentArea', 'presentArea',
            'educationMedium', 'highestEducation', 'instituteName', 'subject', 'passingYear', 'result',
            'economicCondition', 'fatherName', 'fatherProfession', 'fatherAlive',
            'motherName', 'motherProfession', 'motherAlive',
            'partnerComplexion', 'partnerHeight', 'partnerEducation', 'partnerProfession', 'partnerLocation',
            'email', 'guardianMobile', 'ownMobile'
        ];

        requiredStringFields.forEach(field => {
            if (!cleanData[field] || cleanData[field].trim() === '') {
                console.warn(`⚠️ Required field '${field}' is missing or empty`);
            }
        });

        // Ensure address fields are properly set
        if (!cleanData.permanentCountry) cleanData.permanentCountry = 'Bangladesh';
        if (!cleanData.presentCountry) cleanData.presentCountry = 'Bangladesh';

        // Ensure enum fields have valid values
        if (cleanData.biodataApprovalStatus && !['in_progress', 'pending', 'approved', 'rejected', 'inactive'].includes(cleanData.biodataApprovalStatus)) {
            console.warn(`⚠️ Invalid biodataApprovalStatus: ${cleanData.biodataApprovalStatus}, setting to 'pending'`);
            cleanData.biodataApprovalStatus = 'pending';
        }

        if (cleanData.biodataVisibilityStatus && !['active', 'inactive'].includes(cleanData.biodataVisibilityStatus)) {
            console.warn(`⚠️ Invalid biodataVisibilityStatus: ${cleanData.biodataVisibilityStatus}, setting to 'active'`);
            cleanData.biodataVisibilityStatus = 'active';
        }

        // Set default enum values if not provided
        if (!cleanData.biodataApprovalStatus) cleanData.biodataApprovalStatus = 'pending';
        if (!cleanData.biodataVisibilityStatus) cleanData.biodataVisibilityStatus = 'active';

        // Remove undefined fields, but keep null values for nullable fields
        const nullableFields = ['profilePicture', 'email', 'guardianMobile', 'ownMobile', 'familyDetails', 'partnerDetails', 'healthIssues'];
        
        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined) {
                delete cleanData[key];
            } else if (cleanData[key] === null && !nullableFields.includes(key)) {
                delete cleanData[key]; // Remove null for non-nullable fields
            }
            // Convert empty strings to undefined for optional fields (except required ones)
            else if (cleanData[key] === '' && !requiredStringFields.includes(key)) {
                delete cleanData[key];
            }
            // Keep null values for nullable fields like profilePicture
        });

        console.log('🧹 Cleaned data for API:', cleanData);
        return cleanData;
    };

    // Handle image crop completion
    const handleImageCropComplete = React.useCallback(async (result: ImageCropResult) => {
        try {
            setIsUploading(true);

            // Create a File object from the blob
            const croppedFile = new File([result.blob], 'cropped-profile.jpg', {
                type: 'image/jpeg',
            });

            console.log('📤 Starting file upload:', {
                fileName: croppedFile.name,
                fileSize: croppedFile.size,
                fileType: croppedFile.type,
                endpoint: '/upload/profile-picture'
            });

            // Upload file to backend using admin API
            const uploadResult = await adminApi.uploadFile('/upload/profile-picture', croppedFile, 'profilePicture') as FileUploadResponse;

            console.log('✅ Upload successful:', uploadResult);

            // Store the URL returned from backend
            setEditFormData(prev => ({ ...prev, profilePicture: uploadResult.url }));

            logger.debug('File uploaded successfully', uploadResult, 'EditBiodataDrawer');
            toast.success('Profile picture uploaded successfully!');
        } catch (error) {
            const appError = handleApiError(error, 'EditBiodataDrawer');
            console.error('❌ Upload failed:', {
                error: appError,
                originalError: error
            });
            logger.error('Upload error', appError, 'EditBiodataDrawer');
            toast.danger(`Failed to upload file: ${appError.message}`);
            throw error; // Re-throw to let the hook handle the toast
        } finally {
            setIsUploading(false);
        }
    }, []);

    // Handle remove profile picture
    const handleRemoveProfilePicture = React.useCallback(() => {
        setEditFormData(prev => ({ ...prev, profilePicture: null }));
        toast.success('Profile picture removed successfully');
        logger.debug('Profile picture removed', {}, 'EditBiodataDrawer');
    }, []);

    const handleClose = () => {
        // Re-initialize from selectedBiodata on the next open (even for the same biodata);
        // keeping the form data avoids an empty flash during the close animation
        setInitializedFor(undefined);
        setError(null);
        setIsUpdatingBiodata(false);
        setTouchedFields(new Set());
        setHasAttemptedSubmit(false);
        setIsUploading(false);
        onClose();
    };

    return (
        <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
          <Drawer.Content placement="right">
            {/* v3 drawers default to w-96; keep the wide (5xl) editing panel */}
            <Drawer.Dialog className="sm:w-[64rem] max-w-[95vw]">
                <Drawer.Header className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-foreground">
                        {selectedBiodata ? 'Edit Biodata' : 'Create New Biodata'}
                    </h2>
                    <p className="text-sm text-muted">
                        {selectedBiodata
                            ? `Editing biodata for ${selectedBiodata.fullName} (ID: #${selectedBiodata.id})`
                            : 'Fill in the details to create a new biodata'
                        }
                    </p>
                    {error && (
                        <div className="text-sm text-danger bg-red-50 p-2 rounded-md">
                            {error}
                        </div>
                    )}
                </Drawer.Header>
                <Drawer.Body className="gap-6">
                    <div className="space-y-6">
                        {/* Personal Information Section - Matches personal-info-step.tsx */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground border-b border-separator pb-2">
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 1. Religion */}
                                <FormSelect
                                  label="Religion"
                                  placeholder="Select Religion"
                                  value={editFormData.religion ? editFormData.religion as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, religion: selectedKey }));
                                        markFieldAsTouched('religion');
                                    }}
                                  onClose={() => markFieldAsTouched('religion')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('religion', !!editFormData.religion?.trim()) ? "Religion is required" : ""}
                                  isInvalid={shouldShowValidationError('religion', !!editFormData.religion?.trim())}
                                  options={[{ value: "Islam", label: "Islam" }, { value: "Christianity", label: "Christianity" }, { value: "Hinduism", label: "Hinduism" }, { value: "Buddhism", label: "Buddhism" }, { value: "Other", label: "Other" }]}
                                />

                                {/* 2. Biodata Type */}
                                <FormSelect
                                  label="Biodata Type"
                                  placeholder="Select Type"
                                  value={editFormData.biodataType ? editFormData.biodataType as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, biodataType: selectedKey }));
                                        markFieldAsTouched('biodataType');
                                    }}
                                  onClose={() => markFieldAsTouched('biodataType')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('biodataType', !!editFormData.biodataType?.trim()) ? "Biodata type is required" : ""}
                                  isInvalid={shouldShowValidationError('biodataType', !!editFormData.biodataType?.trim())}
                                  options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]}
                                />

                                {/* 3. Marital Status */}
                                <FormSelect
                                  label="Marital Status"
                                  placeholder="Select Status"
                                  value={editFormData.maritalStatus ? editFormData.maritalStatus as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, maritalStatus: selectedKey }));
                                        markFieldAsTouched('maritalStatus');
                                    }}
                                  onClose={() => markFieldAsTouched('maritalStatus')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('maritalStatus', !!editFormData.maritalStatus?.trim()) ? "Marital status is required" : ""}
                                  isInvalid={shouldShowValidationError('maritalStatus', !!editFormData.maritalStatus?.trim())}
                                  options={[{ value: "Married", label: "Married" }, { value: "Unmarried", label: "Unmarried" }, { value: "Divorced", label: "Divorced" }, { value: "Widow", label: "Widow" }, { value: "Widower", label: "Widower" }]}
                                />

                                {/* 4. Date of Birth */}
                                <div className="space-y-2.5">
                                    <FormDatePicker
                                        label="Date of Birth"
                                        value={editFormData.dateOfBirth || ''}
                                        onValueChange={(dateString) => {
                                            setEditFormData(prev => ({ ...prev, dateOfBirth: dateString, age: ageFromDob(dateString) ?? undefined }));
                                            markFieldAsTouched('dateOfBirth');
                                        }}
                                        maxValue={new Date().toISOString().slice(0, 10)}
                                        isRequired
                                        errorMessage={shouldShowValidationError('dateOfBirth', !!editFormData.dateOfBirth?.trim()) ? "Date of birth is required" : ""}
                                        isInvalid={shouldShowValidationError('dateOfBirth', !!editFormData.dateOfBirth?.trim())}
                                    />
                                    {/* Age Display */}
                                    {calculatedAge !== null && (
                                        <div className="text-sm text-green-600 font-medium">
                                            Age: {calculatedAge} years
                                        </div>
                                    )}
                                </div>

                                {/* 5. Height */}
                                <FormSelect
                                  label="Height"
                                  placeholder="Select Height"
                                  value={editFormData.height ? editFormData.height as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, height: selectedKey }));
                                        markFieldAsTouched('height');
                                    }}
                                  onClose={() => markFieldAsTouched('height')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('height', !!editFormData.height?.trim()) ? "Height is required" : ""}
                                  isInvalid={shouldShowValidationError('height', !!editFormData.height?.trim())}
                                  options={[
                                        { key: 'below-4', label: 'Below 4 feet' },
                                        { key: '4.0', label: '4\'0"' },
                                        { key: '4.1', label: '4\'1"' },
                                        { key: '4.2', label: '4\'2"' },
                                        { key: '4.3', label: '4\'3"' },
                                        { key: '4.4', label: '4\'4"' },
                                        { key: '4.5', label: '4\'5"' },
                                        { key: '4.6', label: '4\'6"' },
                                        { key: '4.7', label: '4\'7"' },
                                        { key: '4.8', label: '4\'8"' },
                                        { key: '4.9', label: '4\'9"' },
                                        { key: '4.10', label: '4\'10"' },
                                        { key: '4.11', label: '4\'11"' },
                                        { key: '5.0', label: '5\'0"' },
                                        { key: '5.1', label: '5\'1"' },
                                        { key: '5.2', label: '5\'2"' },
                                        { key: '5.3', label: '5\'3"' },
                                        { key: '5.4', label: '5\'4"' },
                                        { key: '5.5', label: '5\'5"' },
                                        { key: '5.6', label: '5\'6"' },
                                        { key: '5.7', label: '5\'7"' },
                                        { key: '5.8', label: '5\'8"' },
                                        { key: '5.9', label: '5\'9"' },
                                        { key: '5.10', label: '5\'10"' },
                                        { key: '5.11', label: '5\'11"' },
                                        { key: '6.0', label: '6\'0"' },
                                        { key: '6.1', label: '6\'1"' },
                                        { key: '6.2', label: '6\'2"' },
                                        { key: '6.3', label: '6\'3"' },
                                        { key: '6.4', label: '6\'4"' },
                                        { key: '6.5', label: '6\'5"' },
                                        { key: '6.6', label: '6\'6"' },
                                        { key: '6.7', label: '6\'7"' },
                                        { key: '6.8', label: '6\'8"' },
                                        { key: '6.9', label: '6\'9"' },
                                        { key: '6.10', label: '6\'10"' },
                                        { key: '6.11', label: '6\'11"' },
                                        { key: '7.0', label: '7\'0"' },
                                        { key: 'upper-7', label: 'Upper 7 feet' }
                                    ].map((item) => ({ value: String(item.key), label: item.label }))}
                                />

                                {/* 6. Weight */}
                                <FormInput
                                    label="Weight"
                                    type="number"
                                    placeholder="Enter weight"
                                    value={editFormData.weight?.toString() || ''}
                                    onValueChange={(value) => {
                                        setEditFormData(prev => ({ ...prev, weight: value ? parseInt(value) || undefined : undefined }));
                                    }}
                                    endContent={<span className="text-slate-500 text-sm">kg</span>}
                                    isRequired
                                    errorMessage={shouldShowValidationError('weight', !!(editFormData.weight && editFormData.weight > 0)) ? "Weight is required" : ""}
                                    isInvalid={shouldShowValidationError('weight', !!(editFormData.weight && editFormData.weight > 0))}
                                    inputProps={{ onBlur: () => markFieldAsTouched('weight') }}
                                />

                                {/* 7. Complexion */}
                                <FormSelect
                                  label="Complexion"
                                  placeholder="Select Complexion"
                                  value={editFormData.complexion ? editFormData.complexion as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, complexion: selectedKey }));
                                        markFieldAsTouched('complexion');
                                    }}
                                  onClose={() => markFieldAsTouched('complexion')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('complexion', !!editFormData.complexion?.trim()) ? "Complexion is required" : ""}
                                  isInvalid={shouldShowValidationError('complexion', !!editFormData.complexion?.trim())}
                                  options={['Black', 'Dusky', 'Wheatish', 'Fair', 'Very Fair'].map((item) => ({ value: String(item), label: item }))}
                                />

                                {/* 8. Profession */}
                                <FormInput
                                    label="Profession"
                                    placeholder="Enter your profession"
                                    value={editFormData.profession || ''}
                                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, profession: value }))}
                                    isRequired
                                    errorMessage={shouldShowValidationError('profession', !!editFormData.profession?.trim()) ? "Profession is required" : ""}
                                    isInvalid={shouldShowValidationError('profession', !!editFormData.profession?.trim())}
                                    inputProps={{ onBlur: () => markFieldAsTouched('profession') }}
                                />

                                {/* 9. Blood Group */}
                                <FormSelect
                                  label="Blood Group"
                                  placeholder="Select Blood Group"
                                  value={editFormData.bloodGroup ? editFormData.bloodGroup as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, bloodGroup: selectedKey }));
                                        markFieldAsTouched('bloodGroup');
                                    }}
                                  onClose={() => markFieldAsTouched('bloodGroup')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('bloodGroup', !!editFormData.bloodGroup?.trim()) ? "Blood group is required" : ""}
                                  isInvalid={shouldShowValidationError('bloodGroup', !!editFormData.bloodGroup?.trim())}
                                  options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((item) => ({ value: String(item), label: item }))}
                                />
                            </div>
                        </div>


                        {/* Address Information Section */}
                        <Card className="shadow-md">
                            <Card.Header className="border-b pb-4 border-gray-200">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-lg" />
                                    Address Information
                                </h3>
                            </Card.Header>
                            <Card.Content className="space-y-6">
                                {/* Permanent Address */}
                                <div>
                                    <div className="rounded-lg bg-slate-50 p-4 shadow-inner">
                                        <LocationSelector
                                            name="permanentLocation"
                                            data={editFormData}
                                            errors={{}}
                                            updateData={(data) => {
                                                const updates: any = {};
                                                Object.keys(data).forEach(key => {
                                                    if (key === 'permanentLocation') {
                                                        updates.permanentCountry = 'Bangladesh';
                                                        const locationParts = (data[key] as string)?.split(' > ') || [];
                                                        if (locationParts.length > 1) updates.permanentDivision = locationParts[1];
                                                        if (locationParts.length > 2) updates.permanentZilla = locationParts[2];
                                                        if (locationParts.length > 3) updates.permanentUpazilla = locationParts[3];
                                                    } else {
                                                        updates[key] = data[key];
                                                    }
                                                });
                                                setEditFormData(prev => ({ ...prev, ...updates }));
                                            }}
                                            onLocationSelect={() => { }}
                                            label="Permanent Address"
                                            placeholder="Select permanent address"
                                            value={(() => {
                                                const parts = [];
                                                if (editFormData.permanentCountry) parts.push(editFormData.permanentCountry);
                                                if (editFormData.permanentDivision) parts.push(editFormData.permanentDivision);
                                                if (editFormData.permanentZilla) parts.push(editFormData.permanentZilla);
                                                if (editFormData.permanentUpazilla) parts.push(editFormData.permanentUpazilla);
                                                return parts.join(' > ');
                                            })()}
                                            isRequired
                                        />
                                        <div className="mt-4">
                                            <FormInput
                                                label="Area or Village Name"
                                                placeholder="Enter area or village name"
                                                value={editFormData.permanentArea || ''}
                                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, permanentArea: value }))}
                                                isRequired
                                                errorMessage={shouldShowValidationError('permanentArea', !!editFormData.permanentArea?.trim()) ? "Area is required" : ""}
                                                isInvalid={shouldShowValidationError('permanentArea', !!editFormData.permanentArea?.trim())}
                                                inputProps={{ onBlur: () => markFieldAsTouched('permanentArea') }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Same Address Checkbox */}
                                <div className="flex items-center space-x-2 px-2">
                                    <Checkbox
                                        isSelected={editFormData.sameAsPermanent || false}
                                        onChange={(checked: boolean) => {
                                            // Check if permanent address is complete
                                            const isPermanentComplete = !!(editFormData.permanentArea?.trim() &&
                                                (editFormData.permanentCountry || editFormData.permanentDivision));

                                            if (checked && !isPermanentComplete) {
                                                return;
                                            }

                                            setEditFormData(prev => ({ ...prev, sameAsPermanent: checked }));
                                            if (checked) {
                                                // Copy permanent address to present address
                                                setEditFormData(prev => ({
                                                    ...prev,
                                                    presentCountry: prev.permanentCountry,
                                                    presentDivision: prev.permanentDivision,
                                                    presentZilla: prev.permanentZilla,
                                                    presentUpazilla: prev.permanentUpazilla,
                                                    presentArea: prev.permanentArea,
                                                }));
                                            } else {
                                                // Clear present address fields
                                                setEditFormData(prev => ({
                                                    ...prev,
                                                    presentCountry: '',
                                                    presentDivision: '',
                                                    presentZilla: '',
                                                    presentUpazilla: '',
                                                    presentArea: '',
                                                }));
                                            }
                                        }}
                                        isDisabled={!(editFormData.permanentArea?.trim() &&
                                            (editFormData.permanentCountry || editFormData.permanentDivision))}
                                    >
                                      <Checkbox.Content>
                                        <Checkbox.Control>
                                          <Checkbox.Indicator />
                                        </Checkbox.Control>
                                        Present address is same as permanent address
                                        {!(editFormData.permanentArea?.trim() &&
                                            (editFormData.permanentCountry || editFormData.permanentDivision)) && (
                                                <span className="text-sm text-gray-500 ml-2">
                                                    (Complete permanent address first)
                                                </span>
                                            )}
                                      </Checkbox.Content>
                                    </Checkbox>
                                </div>

                                {/* Present Address */}
                                <div className={`${editFormData.sameAsPermanent ? "opacity-50 pointer-events-none" : ""}`}>
                                    <div className="rounded-lg bg-slate-50 p-4 shadow-inner">
                                        <LocationSelector
                                            name="presentLocation"
                                            data={editFormData}
                                            errors={{}}
                                            updateData={(data) => {
                                                const updates: any = {};
                                                Object.keys(data).forEach(key => {
                                                    if (key === 'presentLocation') {
                                                        updates.presentCountry = 'Bangladesh';
                                                        const locationParts = (data[key] as string)?.split(' > ') || [];
                                                        if (locationParts.length > 1) updates.presentDivision = locationParts[1];
                                                        if (locationParts.length > 2) updates.presentZilla = locationParts[2];
                                                        if (locationParts.length > 3) updates.presentUpazilla = locationParts[3];
                                                    } else {
                                                        updates[key] = data[key];
                                                    }
                                                });
                                                setEditFormData(prev => ({ ...prev, ...updates }));
                                            }}
                                            onLocationSelect={() => { }}
                                            label="Present Address"
                                            placeholder="Select present address"
                                            value={(() => {
                                                const parts = [];
                                                if (editFormData.presentCountry) parts.push(editFormData.presentCountry);
                                                if (editFormData.presentDivision) parts.push(editFormData.presentDivision);
                                                if (editFormData.presentZilla) parts.push(editFormData.presentZilla);
                                                if (editFormData.presentUpazilla) parts.push(editFormData.presentUpazilla);
                                                return parts.join(' > ');
                                            })()}
                                            isRequired
                                        />
                                        <div className="mt-4">
                                            <FormInput
                                                label="Area or Village Name"
                                                placeholder="Enter area or village name"
                                                value={editFormData.presentArea || ''}
                                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, presentArea: value }))}
                                                isRequired
                                                errorMessage={shouldShowValidationError('presentArea', !!editFormData.presentArea?.trim()) ? "Area is required" : ""}
                                                isInvalid={shouldShowValidationError('presentArea', !!editFormData.presentArea?.trim())}
                                                inputProps={{ onBlur: () => markFieldAsTouched('presentArea') }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card.Content>
                        </Card>

                        {/* Health Issues Section */}
                        <div className="space-y-4">
                            <FormTextarea
                                label="Do you have any physical or mental health issues?"
                                placeholder="Please describe any health issues or write 'None' if you don't have any"
                                value={editFormData.healthIssues || ''}
                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, healthIssues: value }))}
                                rows={3}
                                isRequired
                                errorMessage={shouldShowValidationError('healthIssues', !!editFormData.healthIssues?.trim()) ? "Health information is required" : ""}
                                isInvalid={shouldShowValidationError('healthIssues', !!editFormData.healthIssues?.trim())}
                                onBlur={() => markFieldAsTouched('healthIssues')}
                            />
                        </div>

                        {/* Education Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground border-b border-separator pb-2">
                                Educational Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Education Medium */}
                                <FormSelect
                                  label="Your Education Medium"
                                  placeholder="Select Medium"
                                  value={editFormData.educationMedium ? editFormData.educationMedium as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, educationMedium: selectedKey }));
                                        markFieldAsTouched('educationMedium');
                                    }}
                                  onClose={() => markFieldAsTouched('educationMedium')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('educationMedium', !!editFormData.educationMedium?.trim()) ? "Education medium is required" : ""}
                                  isInvalid={shouldShowValidationError('educationMedium', !!editFormData.educationMedium?.trim())}
                                  options={[{ value: "Bangla", label: "Bangla" }, { value: "English", label: "English" }, { value: "Arabic", label: "Arabic" }, { value: "Others", label: "Others" }]}
                                />

                                {/* Highest Education Level */}
                                <FormSelect
                                  label="Highest Education Level"
                                  placeholder="Select Level"
                                  value={editFormData.highestEducation ? editFormData.highestEducation as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, highestEducation: selectedKey }));
                                        markFieldAsTouched('highestEducation');
                                    }}
                                  onClose={() => markFieldAsTouched('highestEducation')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('highestEducation', !!editFormData.highestEducation?.trim()) ? "Highest education is required" : ""}
                                  isInvalid={shouldShowValidationError('highestEducation', !!editFormData.highestEducation?.trim())}
                                  options={[{ value: "Below SSC", label: "Below SSC" }, { value: "SSC", label: "SSC" }, { value: "HSC", label: "HSC" }, { value: "Diploma", label: "Diploma" }, { value: "Diploma Running", label: "Diploma Running" }, { value: "Honours", label: "Honours" }, { value: "Honours Running", label: "Honours Running" }, { value: "Masters", label: "Masters" }, { value: "Masters Running", label: "Masters Running" }, { value: "PHD", label: "PHD" }]}
                                />

                                {/* Institute Name */}
                                <FormInput
                                    label="Institute or University Name"
                                    placeholder="Enter institute or university name"
                                    value={editFormData.instituteName || ''}
                                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, instituteName: value }))}
                                    isRequired
                                    errorMessage={shouldShowValidationError('instituteName', !!editFormData.instituteName?.trim()) ? "Institute name is required" : ""}
                                    isInvalid={shouldShowValidationError('instituteName', !!editFormData.instituteName?.trim())}
                                    inputProps={{ onBlur: () => markFieldAsTouched('instituteName') }}
                                />

                                {/* Subject */}
                                <FormInput
                                    label="Which subject do you study"
                                    placeholder="Enter your subject/major"
                                    value={editFormData.subject || ''}
                                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, subject: value }))}
                                    isRequired
                                    errorMessage={shouldShowValidationError('subject', !!editFormData.subject?.trim()) ? "Subject is required" : ""}
                                    isInvalid={shouldShowValidationError('subject', !!editFormData.subject?.trim())}
                                    inputProps={{ onBlur: () => markFieldAsTouched('subject') }}
                                />

                                {/* Passing Year */}
                                <FormInput
                                    label="Passing Year"
                                    placeholder="Enter passing year"
                                    value={editFormData.passingYear || ''}
                                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, passingYear: value }))}
                                    isRequired
                                    errorMessage={shouldShowValidationError('passingYear', !!editFormData.passingYear?.trim()) ? "Passing year is required" : ""}
                                    isInvalid={shouldShowValidationError('passingYear', !!editFormData.passingYear?.trim())}
                                    inputProps={{ onBlur: () => markFieldAsTouched('passingYear') }}
                                />

                                {/* Result */}
                                <FormSelect
                                  label="Result"
                                  placeholder="Select Result"
                                  value={editFormData.result ? editFormData.result as string : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, result: selectedKey }));
                                        markFieldAsTouched('result');
                                    }}
                                  onClose={() => markFieldAsTouched('result')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('result', !!editFormData.result?.trim()) ? "Result is required" : ""}
                                  isInvalid={shouldShowValidationError('result', !!editFormData.result?.trim())}
                                  options={[{ value: "A+", label: "A+" }, { value: "A", label: "A" }, { value: "A-", label: "A-" }, { value: "B+", label: "B+" }, { value: "B", label: "B" }, { value: "B-", label: "B-" }, { value: "C+", label: "C+" }, { value: "C", label: "C" }, { value: "D", label: "D" }, { value: "Not Available", label: "Not Available" }]}
                                />
                            </div>
                        </div>

                        {/* Family Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground border-b border-separator pb-2">
                                Family Information
                            </h3>

                            {/* Economic Condition */}
                            <FormSelect
                              label="Family's Economic Condition"
                              placeholder="Select Economic Condition"
                              value={editFormData.economicCondition ? editFormData.economicCondition as string : null}
                              onValueChange={(selected) => {
                                    const selectedKey = selected ?? "";
                                    setEditFormData(prev => ({ ...prev, economicCondition: selectedKey }));
                                    markFieldAsTouched('economicCondition');
                                }}
                              onClose={() => markFieldAsTouched('economicCondition')}
                              isRequired
                              errorMessage={shouldShowValidationError('economicCondition', !!editFormData.economicCondition?.trim()) ? "Economic condition is required" : ""}
                              isInvalid={shouldShowValidationError('economicCondition', !!editFormData.economicCondition?.trim())}
                              options={[{ value: "Lower Class", label: "Lower Class" }, { value: "Lower Middle Class", label: "Lower Middle Class" }, { value: "Middle Class", label: "Middle Class" }, { value: "Upper Middle Class", label: "Upper Middle Class" }, { value: "Upper Class", label: "Upper Class" }]}
                            />

                            {/* Father Information */}
                            <Card className="shadow-sm">
                                <Card.Header className="border-b border-separator">
                                    <h4 className="text-md font-semibold text-foreground">Father's Information</h4>
                                </Card.Header>
                                <Card.Content className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <FormInput
                                        label="Father's Name"
                                        placeholder="Enter father's name"
                                        value={editFormData.fatherName || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, fatherName: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('fatherName', !!editFormData.fatherName?.trim()) ? "Father's name is required" : ""}
                                        isInvalid={shouldShowValidationError('fatherName', !!editFormData.fatherName?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('fatherName') }}
                                    />
                                    <FormInput
                                        label="Father's Profession"
                                        placeholder="Enter father's profession"
                                        value={editFormData.fatherProfession || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, fatherProfession: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('fatherProfession', !!editFormData.fatherProfession?.trim()) ? "Father's profession is required" : ""}
                                        isInvalid={shouldShowValidationError('fatherProfession', !!editFormData.fatherProfession?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('fatherProfession') }}
                                    />
                                    <FormSelect
                                      label="Is your father alive?"
                                      placeholder="Select Status"
                                      value={editFormData.fatherAlive ? editFormData.fatherAlive as string : null}
                                      onValueChange={(selected) => {
                                            const selectedKey = selected ?? "";
                                            setEditFormData(prev => ({ ...prev, fatherAlive: selectedKey }));
                                            markFieldAsTouched('fatherAlive');
                                        }}
                                      onClose={() => markFieldAsTouched('fatherAlive')}
                                      isRequired
                                      errorMessage={shouldShowValidationError('fatherAlive', !!editFormData.fatherAlive?.trim()) ? "Father's status is required" : ""}
                                      isInvalid={shouldShowValidationError('fatherAlive', !!editFormData.fatherAlive?.trim())}
                                      options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]}
                                    />
                                </Card.Content>
                            </Card>

                            {/* Mother Information */}
                            <Card className="shadow-sm">
                                <Card.Header className="border-b border-separator">
                                    <h4 className="text-md font-semibold text-foreground">Mother's Information</h4>
                                </Card.Header>
                                <Card.Content className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <FormInput
                                        label="Mother's Name"
                                        placeholder="Enter mother's name"
                                        value={editFormData.motherName || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, motherName: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('motherName', !!editFormData.motherName?.trim()) ? "Mother's name is required" : ""}
                                        isInvalid={shouldShowValidationError('motherName', !!editFormData.motherName?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('motherName') }}
                                    />
                                    <FormInput
                                        label="Mother's Profession"
                                        placeholder="Enter mother's profession"
                                        value={editFormData.motherProfession || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, motherProfession: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('motherProfession', !!editFormData.motherProfession?.trim()) ? "Mother's profession is required" : ""}
                                        isInvalid={shouldShowValidationError('motherProfession', !!editFormData.motherProfession?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('motherProfession') }}
                                    />
                                    <FormSelect
                                      label="Is your mother alive?"
                                      placeholder="Select Status"
                                      value={editFormData.motherAlive ? editFormData.motherAlive as string : null}
                                      onValueChange={(selected) => {
                                            const selectedKey = selected ?? "";
                                            setEditFormData(prev => ({ ...prev, motherAlive: selectedKey }));
                                            markFieldAsTouched('motherAlive');
                                        }}
                                      onClose={() => markFieldAsTouched('motherAlive')}
                                      isRequired
                                      errorMessage={shouldShowValidationError('motherAlive', !!editFormData.motherAlive?.trim()) ? "Mother's status is required" : ""}
                                      isInvalid={shouldShowValidationError('motherAlive', !!editFormData.motherAlive?.trim())}
                                      options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]}
                                    />
                                </Card.Content>
                            </Card>

                            {/* Siblings Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormSelect
                                  label="How many brothers do you have?"
                                  placeholder="Select Number"
                                  value={editFormData.brothersCount !== undefined ? String(editFormData.brothersCount) : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, brothersCount: parseInt(selectedKey) }));
                                        markFieldAsTouched('brothersCount');
                                    }}
                                  onClose={() => markFieldAsTouched('brothersCount')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('brothersCount', editFormData.brothersCount !== undefined) ? "Brothers count is required" : ""}
                                  isInvalid={shouldShowValidationError('brothersCount', editFormData.brothersCount !== undefined)}
                                  options={Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) }))}
                                />

                                <FormSelect
                                  label="How many sisters do you have?"
                                  placeholder="Select Number"
                                  value={editFormData.sistersCount !== undefined ? String(editFormData.sistersCount) : null}
                                  onValueChange={(selected) => {
                                        const selectedKey = selected ?? "";
                                        setEditFormData(prev => ({ ...prev, sistersCount: parseInt(selectedKey) }));
                                        markFieldAsTouched('sistersCount');
                                    }}
                                  onClose={() => markFieldAsTouched('sistersCount')}
                                  isRequired
                                  errorMessage={shouldShowValidationError('sistersCount', editFormData.sistersCount !== undefined) ? "Sisters count is required" : ""}
                                  isInvalid={shouldShowValidationError('sistersCount', editFormData.sistersCount !== undefined)}
                                  options={Array.from({ length: 11 }, (_, i) => ({ value: String(i), label: String(i) }))}
                                />
                            </div>

                            {/* Family Details */}
                            <FormTextarea
                                label="Write details about yourself and your family"
                                placeholder="Share any additional information about yourself and your family background"
                                value={editFormData.familyDetails || ''}
                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, familyDetails: value }))}
                                rows={4}
                            />
                        </div>

                        {/* Partner Preferences Section */}
                        <Card className="shadow-md">
                            <Card.Header className="border-b border-separator pb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Partner Preferences
                                </h3>
                            </Card.Header>
                            <Card.Content className="space-y-8 pt-6">
                                {/* Partner Age Range */}
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                        <AgeRangeSlider
                                            value={[editFormData.partnerAgeMin || 18, editFormData.partnerAgeMax || 40]}
                                            onChange={([min, max]) => setEditFormData(prev => ({ ...prev, partnerAgeMin: min, partnerAgeMax: max }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <FormInput
                                        label="Preferred Complexion"
                                        placeholder="Enter preferred complexion"
                                        value={editFormData.partnerComplexion || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, partnerComplexion: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('partnerComplexion', !!editFormData.partnerComplexion?.trim()) ? "Partner complexion is required" : ""}
                                        isInvalid={shouldShowValidationError('partnerComplexion', !!editFormData.partnerComplexion?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('partnerComplexion') }}
                                    />

                                    <FormInput
                                        label="Preferred Height"
                                        placeholder="Enter preferred height"
                                        value={editFormData.partnerHeight || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, partnerHeight: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('partnerHeight', !!editFormData.partnerHeight?.trim()) ? "Partner height is required" : ""}
                                        isInvalid={shouldShowValidationError('partnerHeight', !!editFormData.partnerHeight?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('partnerHeight') }}
                                    />

                                    <FormInput
                                        label="Preferred Education"
                                        placeholder="Enter preferred education"
                                        value={editFormData.partnerEducation || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, partnerEducation: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('partnerEducation', !!editFormData.partnerEducation?.trim()) ? "Partner education is required" : ""}
                                        isInvalid={shouldShowValidationError('partnerEducation', !!editFormData.partnerEducation?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('partnerEducation') }}
                                    />

                                    <FormInput
                                        label="Preferred Profession"
                                        placeholder="Enter preferred profession"
                                        value={editFormData.partnerProfession || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, partnerProfession: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('partnerProfession', !!editFormData.partnerProfession?.trim()) ? "Partner profession is required" : ""}
                                        isInvalid={shouldShowValidationError('partnerProfession', !!editFormData.partnerProfession?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('partnerProfession') }}
                                    />
                                </div>

                                <FormTextarea
                                    label="Preferred Place"
                                    placeholder="Enter preferred location"
                                    value={editFormData.partnerLocation || ''}
                                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, partnerLocation: value }))}
                                    isRequired
                                    errorMessage={shouldShowValidationError('partnerLocation', !!editFormData.partnerLocation?.trim()) ? "Partner location is required" : ""}
                                    isInvalid={shouldShowValidationError('partnerLocation', !!editFormData.partnerLocation?.trim())}
                                    rows={2}
                                    onBlur={() => markFieldAsTouched('partnerLocation')}
                                />

                                <FormTextarea
                                    label="Details about the prospective spouse"
                                    placeholder="Share your expectations and preferences for your life partner"
                                    value={editFormData.partnerDetails || ''}
                                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, partnerDetails: value }))}
                                    rows={3}
                                />
                            </Card.Content>
                        </Card>

                        {/* Contact Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground border-b border-separator pb-2">
                                Contact Information
                            </h3>

                            {/* Profile Picture Upload */}
                            <div className="space-y-4">

                                <ImageUploadWithCrop
                                    onCropComplete={handleImageCropComplete}
                                    onRemove={handleRemoveProfilePicture}
                                    currentImageUrl={editFormData.profilePicture || undefined}
                                    aspectRatio={1}
                                    maxFileSize={5 * 1024 * 1024}
                                    title="Profile Picture"
                                    description="Upload a clear photo. You'll be able to crop it after selection."
                                    className="w-full"
                                />

                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    Profile pic is optional. Only JPEG/PNG Image
                                </p>
                            </div>

                            {/* Profile Picture Visibility Toggle */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-medium text-foreground">
                                                Make Profile Picture Public
                                            </p>
                                            <Tooltip delay={200}>
                                              <Tooltip.Trigger tabIndex={0}><Info className="w-4 h-4 text-slate-400 cursor-help" /></Tooltip.Trigger>
                                              <Tooltip.Content>When enabled, your profile picture will be visible to other users browsing biodatas</Tooltip.Content>
                                            </Tooltip>
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            {editFormData.profilePictureVisible
                                                ? "✓ Visible to everyone"
                                                : "🔒 Only visible to you"
                                            }
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs font-medium ${editFormData.profilePictureVisible
                                            ? 'text-emerald-600'
                                            : 'text-slate-500'
                                            }`}>
                                            {editFormData.profilePictureVisible ? 'Public' : 'Private'}
                                        </span>
                                        <Switch isSelected={editFormData.profilePictureVisible || false} onChange={(value) => {
                                                setEditFormData(prev => ({ ...prev, profilePictureVisible: value }));
                                                toast.success(value ? 'Profile picture is now public' : 'Profile picture is now private');
                                            }} size="md" aria-label="Make profile picture public">
                                          <Switch.Control>
                                            <Switch.Thumb />
                                          </Switch.Control>
                                        </Switch>
                                    </div>
                                </div>


                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <FormInput
                                        label="Your full name"
                                        placeholder="Enter full name"
                                        value={editFormData.fullName || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, fullName: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('fullName', !!editFormData.fullName?.trim()) ? "Your full name is required" : ""}
                                        isInvalid={shouldShowValidationError('fullName', !!editFormData.fullName?.trim())}
                                        description={
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <Info className="w-3 h-3" />
                                                Use profile picture for more Visibility
                                            </div>
                                        }
                                        endContent={
                                            <Tooltip delay={200}>
                                              <Tooltip.Trigger tabIndex={0}><Info className="w-4 h-4 text-slate-400 cursor-help" /></Tooltip.Trigger>
                                              <Tooltip.Content>Only visible for admin</Tooltip.Content>
                                            </Tooltip>
                                        }
                                        inputProps={{ onBlur: () => markFieldAsTouched('fullName') }}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <FormInput
                                        label="Email"
                                        type="email"
                                        placeholder="Enter email address"
                                        value={editFormData.email || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, email: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('email', !!editFormData.email?.trim()) ? "Email is required" : ""}
                                        isInvalid={shouldShowValidationError('email', !!editFormData.email?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('email') }}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <FormInput
                                        label="Guardian's Mobile Number"
                                        type="tel"
                                        placeholder="Enter guardian's mobile number"
                                        value={editFormData.guardianMobile || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, guardianMobile: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('guardianMobile', !!editFormData.guardianMobile?.trim()) ? "Guardian's mobile number is required" : ""}
                                        isInvalid={shouldShowValidationError('guardianMobile', !!editFormData.guardianMobile?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('guardianMobile') }}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <FormInput
                                        label="Own Mobile Number"
                                        type="tel"
                                        placeholder="Enter your mobile number"
                                        value={editFormData.ownMobile || ''}
                                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, ownMobile: value }))}
                                        isRequired
                                        errorMessage={shouldShowValidationError('ownMobile', !!editFormData.ownMobile?.trim()) ? "Own mobile number is required" : ""}
                                        isInvalid={shouldShowValidationError('ownMobile', !!editFormData.ownMobile?.trim())}
                                        inputProps={{ onBlur: () => markFieldAsTouched('ownMobile') }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Drawer.Body>
                <Drawer.Footer className="flex justify-end items-center px-6 py-4 bg-surface/50">
                    <Button
                        variant="primary"
                        size="md"
                        onPress={handleSaveBiodata}
                        isPending={isUpdatingBiodata}
                        isDisabled={isUpdatingBiodata}
                        className="font-semibold px-8 min-w-[120px]"
                    >{!isUpdatingBiodata ? <span>💾</span> : undefined}
                        {isUpdatingBiodata
                            ? "Saving..."
                            : selectedBiodata
                                ? "Save Changes"
                                : "Create Biodata"
                        }
                    </Button>
                </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
    );
}