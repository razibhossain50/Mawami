"use client"
import React from "react";
import {
    Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
    Input, Button, Select, SelectItem, Textarea, Card, CardBody, CardHeader, Checkbox, DatePicker, Tooltip, Slider, Switch
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Info, Upload, Trash2 } from "lucide-react";
import { LocationSelector } from '@/components/form/LocationSelector';
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { adminApi } from '@/services/api-client';
import { useToast } from '@/context/ToastContext';
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
    const [calculatedAge, setCalculatedAge] = React.useState<number | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const { addToast } = useToast();

    // Initialize form data when selectedBiodata changes
    React.useEffect(() => {
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
    }, [selectedBiodata]);

    // Cleanup object URLs to prevent memory leaks

    // Age calculation effect
    React.useEffect(() => {
        if (editFormData.dateOfBirth && typeof editFormData.dateOfBirth === 'string' && editFormData.dateOfBirth.trim() !== '') {
            try {
                const dob = new Date(editFormData.dateOfBirth);
                const today = new Date();

                // Check if the date is valid
                if (isNaN(dob.getTime())) {
                    console.log('❌ Invalid date format');
                    setCalculatedAge(null);
                    setEditFormData(prev => ({ ...prev, age: undefined }));
                    return;
                }

                // Check if the date is in the future
                if (dob > today) {
                    console.log('❌ Date of birth cannot be in the future');
                    setCalculatedAge(null);
                    setEditFormData(prev => ({ ...prev, age: undefined }));
                    return;
                }

                let age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();

                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }

                // Check for reasonable age range
                if (age < 0 || age > 120) {
                    console.log('❌ Age is outside reasonable range:', age);
                    setCalculatedAge(null);
                    setEditFormData(prev => ({ ...prev, age: undefined }));
                    return;
                }

                setCalculatedAge(age);
                // Update age in form data only if it's different and valid
                if (editFormData.age !== age && age >= 0) {
                    console.log(`📅 Age calculated from date of birth: ${age} years`);
                    setEditFormData(prev => ({ ...prev, age }));
                }
            } catch (error) {
                console.log('❌ Error parsing date:', error);
                setCalculatedAge(null);
                setEditFormData(prev => ({ ...prev, age: undefined }));
            }
        } else {
            // Clear calculated age and form age when date of birth is empty
            setCalculatedAge(null);
            if (editFormData.age !== undefined) {
                setEditFormData(prev => ({ ...prev, age: undefined }));
            }
        }
    }, [editFormData.dateOfBirth]);

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
            addToast(errorMessage, 'error');
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
                addToast('Biodata updated successfully!', 'success');

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
                addToast('Biodata created successfully!', 'success');

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
            addToast(`Failed to ${action} biodata: ` + errorMessage, 'error');
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
            addToast('Profile picture uploaded successfully!', 'success');
        } catch (error) {
            const appError = handleApiError(error, 'EditBiodataDrawer');
            console.error('❌ Upload failed:', {
                error: appError,
                originalError: error
            });
            logger.error('Upload error', appError, 'EditBiodataDrawer');
            addToast(`Failed to upload file: ${appError.message}`, 'error');
            throw error; // Re-throw to let the hook handle the toast
        } finally {
            setIsUploading(false);
        }
    }, [addToast]);

    // Handle remove profile picture
    const handleRemoveProfilePicture = React.useCallback(() => {
        setEditFormData(prev => ({ ...prev, profilePicture: null }));
        addToast('Profile picture removed successfully', 'success');
        logger.debug('Profile picture removed', {}, 'EditBiodataDrawer');
    }, [addToast]);

    const handleClose = () => {
        setEditFormData({});
        setError(null);
        setIsUpdatingBiodata(false);
        setTouchedFields(new Set());
        setHasAttemptedSubmit(false);
        setIsUploading(false);
        onClose();
    };

    return (
        <Drawer
            isOpen={isOpen}
            onClose={handleClose}
            size="5xl"
            placement="right"
        >
            <DrawerContent>
                <DrawerHeader className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-foreground">
                        {selectedBiodata ? 'Edit Biodata' : 'Create New Biodata'}
                    </h2>
                    <p className="text-sm text-default-500">
                        {selectedBiodata
                            ? `Editing biodata for ${selectedBiodata.fullName} (ID: #${selectedBiodata.id})`
                            : 'Fill in the details to create a new biodata'
                        }
                    </p>
                    {error && (
                        <div className="text-sm text-danger bg-danger-50 p-2 rounded-md">
                            {error}
                        </div>
                    )}
                </DrawerHeader>
                <DrawerBody className="gap-6">
                    <div className="space-y-6">
                        {/* Personal Information Section - Matches personal-info-step.tsx */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground border-b border-divider pb-2">
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 1. Religion */}
                                <Select
                                    label="Religion"
                                    placeholder="Select Religion"
                                    selectedKeys={editFormData.religion ? [editFormData.religion] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, religion: selectedKey }));
                                        markFieldAsTouched('religion');
                                    }}
                                    onClose={() => markFieldAsTouched('religion')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('religion', !!editFormData.religion?.trim()) ? "Religion is required" : ""}
                                    isInvalid={shouldShowValidationError('religion', !!editFormData.religion?.trim())}
                                >
                                    <SelectItem key="Islam">Islam</SelectItem>
                                    <SelectItem key="Christianity">Christianity</SelectItem>
                                    <SelectItem key="Hinduism">Hinduism</SelectItem>
                                    <SelectItem key="Buddhism">Buddhism</SelectItem>
                                    <SelectItem key="Other">Other</SelectItem>
                                </Select>

                                {/* 2. Biodata Type */}
                                <Select
                                    label="Biodata Type"
                                    placeholder="Select Type"
                                    selectedKeys={editFormData.biodataType ? [editFormData.biodataType] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, biodataType: selectedKey }));
                                        markFieldAsTouched('biodataType');
                                    }}
                                    onClose={() => markFieldAsTouched('biodataType')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('biodataType', !!editFormData.biodataType?.trim()) ? "Biodata type is required" : ""}
                                    isInvalid={shouldShowValidationError('biodataType', !!editFormData.biodataType?.trim())}
                                >
                                    <SelectItem key="Male">Male</SelectItem>
                                    <SelectItem key="Female">Female</SelectItem>
                                </Select>

                                {/* 3. Marital Status */}
                                <Select
                                    label="Marital Status"
                                    placeholder="Select Status"
                                    selectedKeys={editFormData.maritalStatus ? [editFormData.maritalStatus] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, maritalStatus: selectedKey }));
                                        markFieldAsTouched('maritalStatus');
                                    }}
                                    onClose={() => markFieldAsTouched('maritalStatus')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('maritalStatus', !!editFormData.maritalStatus?.trim()) ? "Marital status is required" : ""}
                                    isInvalid={shouldShowValidationError('maritalStatus', !!editFormData.maritalStatus?.trim())}
                                >
                                    <SelectItem key="Married">Married</SelectItem>
                                    <SelectItem key="Unmarried">Unmarried</SelectItem>
                                    <SelectItem key="Divorced">Divorced</SelectItem>
                                    <SelectItem key="Widow">Widow</SelectItem>
                                    <SelectItem key="Widower">Widower</SelectItem>
                                </Select>

                                {/* 4. Date of Birth */}
                                <div className="space-y-2.5">
                                    <DatePicker
                                        label="Date of Birth"
                                        value={(() => {
                                            try {
                                                return editFormData.dateOfBirth && typeof editFormData.dateOfBirth === 'string' && editFormData.dateOfBirth.trim()
                                                    ? parseDate(editFormData.dateOfBirth as string) as any
                                                    : null;
                                            } catch (error) {
                                                console.log('❌ Error parsing date for DatePicker:', error);
                                                return null;
                                            }
                                        })()}
                                        onChange={(date) => {
                                            if (date) {
                                                const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                                                setEditFormData(prev => ({ ...prev, dateOfBirth: dateString }));
                                            } else {
                                                setEditFormData(prev => ({ ...prev, dateOfBirth: "" }));
                                            }
                                            markFieldAsTouched('dateOfBirth');
                                        }}
                                        maxValue={parseDate(new Date().toISOString().split('T')[0]) as any}
                                        showMonthAndYearPickers
                                        isRequired
                                        errorMessage={shouldShowValidationError('dateOfBirth', !!editFormData.dateOfBirth?.trim()) ? "Date of birth is required" : ""}
                                        isInvalid={shouldShowValidationError('dateOfBirth', !!editFormData.dateOfBirth?.trim())}
                                        variant="flat"
                                        granularity="day"
                                    />
                                    {/* Age Display */}
                                    {calculatedAge !== null && (
                                        <div className="text-sm text-green-600 font-medium">
                                            Age: {calculatedAge} years
                                        </div>
                                    )}
                                </div>

                                {/* 5. Height */}
                                <Select
                                    label="Height"
                                    placeholder="Select Height"
                                    selectedKeys={editFormData.height ? [editFormData.height] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, height: selectedKey }));
                                        markFieldAsTouched('height');
                                    }}
                                    onClose={() => markFieldAsTouched('height')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('height', !!editFormData.height?.trim()) ? "Height is required" : ""}
                                    isInvalid={shouldShowValidationError('height', !!editFormData.height?.trim())}
                                >
                                    {[
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
                                    ].map((item) => (
                                        <SelectItem key={item.key} textValue={item.label}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {/* 6. Weight */}
                                <Input
                                    label="Weight"
                                    type="number"
                                    placeholder="Enter weight"
                                    value={editFormData.weight?.toString() || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setEditFormData(prev => ({ ...prev, weight: value ? parseInt(value) || undefined : undefined }));
                                    }}
                                    onBlur={() => markFieldAsTouched('weight')}
                                    endContent={<span className="text-slate-500 text-sm">kg</span>}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('weight', !!(editFormData.weight && editFormData.weight > 0)) ? "Weight is required" : ""}
                                    isInvalid={shouldShowValidationError('weight', !!(editFormData.weight && editFormData.weight > 0))}
                                />

                                {/* 7. Complexion */}
                                <Select
                                    label="Complexion"
                                    placeholder="Select Complexion"
                                    selectedKeys={editFormData.complexion ? [editFormData.complexion] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, complexion: selectedKey }));
                                        markFieldAsTouched('complexion');
                                    }}
                                    onClose={() => markFieldAsTouched('complexion')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('complexion', !!editFormData.complexion?.trim()) ? "Complexion is required" : ""}
                                    isInvalid={shouldShowValidationError('complexion', !!editFormData.complexion?.trim())}
                                >
                                    {['Black', 'Dusky', 'Wheatish', 'Fair', 'Very Fair'].map((item) => (
                                        <SelectItem key={item} textValue={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {/* 8. Profession */}
                                <Input
                                    label="Profession"
                                    placeholder="Enter your profession"
                                    value={editFormData.profession || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, profession: e.target.value }))}
                                    onBlur={() => markFieldAsTouched('profession')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('profession', !!editFormData.profession?.trim()) ? "Profession is required" : ""}
                                    isInvalid={shouldShowValidationError('profession', !!editFormData.profession?.trim())}
                                />

                                {/* 9. Blood Group */}
                                <Select
                                    label="Blood Group"
                                    placeholder="Select Blood Group"
                                    selectedKeys={editFormData.bloodGroup ? [editFormData.bloodGroup] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, bloodGroup: selectedKey }));
                                        markFieldAsTouched('bloodGroup');
                                    }}
                                    onClose={() => markFieldAsTouched('bloodGroup')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('bloodGroup', !!editFormData.bloodGroup?.trim()) ? "Blood group is required" : ""}
                                    isInvalid={shouldShowValidationError('bloodGroup', !!editFormData.bloodGroup?.trim())}
                                >
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((item) => (
                                        <SelectItem key={item} textValue={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </div>


                        {/* Address Information Section */}
                        <Card className="shadow-md">
                            <CardHeader className="border-b pb-4 border-gray-200">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-lg" />
                                    Address Information
                                </h3>
                            </CardHeader>
                            <CardBody className="space-y-6">
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
                                            <Input
                                                label="Area or Village Name"
                                                placeholder="Enter area or village name"
                                                value={editFormData.permanentArea || ''}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, permanentArea: e.target.value }))}
                                                onBlur={() => markFieldAsTouched('permanentArea')}
                                                variant="bordered"
                                                isRequired
                                                errorMessage={shouldShowValidationError('permanentArea', !!editFormData.permanentArea?.trim()) ? "Area is required" : ""}
                                                isInvalid={shouldShowValidationError('permanentArea', !!editFormData.permanentArea?.trim())}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Same Address Checkbox */}
                                <div className="flex items-center space-x-2 px-2">
                                    <Checkbox
                                        isSelected={editFormData.sameAsPermanent || false}
                                        onValueChange={(checked) => {
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
                                        Present address is same as permanent address
                                        {!(editFormData.permanentArea?.trim() &&
                                            (editFormData.permanentCountry || editFormData.permanentDivision)) && (
                                                <span className="text-sm text-gray-500 ml-2">
                                                    (Complete permanent address first)
                                                </span>
                                            )}
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
                                            <Input
                                                label="Area or Village Name"
                                                placeholder="Enter area or village name"
                                                value={editFormData.presentArea || ''}
                                                onChange={(e) => setEditFormData(prev => ({ ...prev, presentArea: e.target.value }))}
                                                onBlur={() => markFieldAsTouched('presentArea')}
                                                variant="bordered"
                                                isRequired
                                                errorMessage={shouldShowValidationError('presentArea', !!editFormData.presentArea?.trim()) ? "Area is required" : ""}
                                                isInvalid={shouldShowValidationError('presentArea', !!editFormData.presentArea?.trim())}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Health Issues Section */}
                        <div className="space-y-4">
                            <Textarea
                                label="Do you have any physical or mental health issues?"
                                placeholder="Please describe any health issues or write 'None' if you don't have any"
                                value={editFormData.healthIssues || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, healthIssues: e.target.value }))}
                                onBlur={() => markFieldAsTouched('healthIssues')}
                                variant="bordered"
                                minRows={3}
                                isRequired
                                errorMessage={shouldShowValidationError('healthIssues', !!editFormData.healthIssues?.trim()) ? "Health information is required" : ""}
                                isInvalid={shouldShowValidationError('healthIssues', !!editFormData.healthIssues?.trim())}
                            />
                        </div>

                        {/* Education Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground border-b border-divider pb-2">
                                Educational Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Education Medium */}
                                <Select
                                    label="Your Education Medium"
                                    placeholder="Select Medium"
                                    selectedKeys={editFormData.educationMedium ? [editFormData.educationMedium] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, educationMedium: selectedKey }));
                                        markFieldAsTouched('educationMedium');
                                    }}
                                    onClose={() => markFieldAsTouched('educationMedium')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('educationMedium', !!editFormData.educationMedium?.trim()) ? "Education medium is required" : ""}
                                    isInvalid={shouldShowValidationError('educationMedium', !!editFormData.educationMedium?.trim())}
                                >
                                    <SelectItem key="Bangla">Bangla</SelectItem>
                                    <SelectItem key="English">English</SelectItem>
                                    <SelectItem key="Arabic">Arabic</SelectItem>
                                    <SelectItem key="Others">Others</SelectItem>
                                </Select>

                                {/* Highest Education Level */}
                                <Select
                                    label="Highest Education Level"
                                    placeholder="Select Level"
                                    selectedKeys={editFormData.highestEducation ? [editFormData.highestEducation] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, highestEducation: selectedKey }));
                                        markFieldAsTouched('highestEducation');
                                    }}
                                    onClose={() => markFieldAsTouched('highestEducation')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('highestEducation', !!editFormData.highestEducation?.trim()) ? "Highest education is required" : ""}
                                    isInvalid={shouldShowValidationError('highestEducation', !!editFormData.highestEducation?.trim())}
                                >
                                    <SelectItem key="Below SSC">Below SSC</SelectItem>
                                    <SelectItem key="SSC">SSC</SelectItem>
                                    <SelectItem key="HSC">HSC</SelectItem>
                                    <SelectItem key="Diploma">Diploma</SelectItem>
                                    <SelectItem key="Diploma Running">Diploma Running</SelectItem>
                                    <SelectItem key="Honours">Honours</SelectItem>
                                    <SelectItem key="Honours Running">Honours Running</SelectItem>
                                    <SelectItem key="Masters">Masters</SelectItem>
                                    <SelectItem key="Masters Running">Masters Running</SelectItem>
                                    <SelectItem key="PHD">PHD</SelectItem>
                                </Select>

                                {/* Institute Name */}
                                <Input
                                    label="Institute or University Name"
                                    placeholder="Enter institute or university name"
                                    value={editFormData.instituteName || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, instituteName: e.target.value }))}
                                    onBlur={() => markFieldAsTouched('instituteName')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('instituteName', !!editFormData.instituteName?.trim()) ? "Institute name is required" : ""}
                                    isInvalid={shouldShowValidationError('instituteName', !!editFormData.instituteName?.trim())}
                                />

                                {/* Subject */}
                                <Input
                                    label="Which subject do you study"
                                    placeholder="Enter your subject/major"
                                    value={editFormData.subject || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    onBlur={() => markFieldAsTouched('subject')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('subject', !!editFormData.subject?.trim()) ? "Subject is required" : ""}
                                    isInvalid={shouldShowValidationError('subject', !!editFormData.subject?.trim())}
                                />

                                {/* Passing Year */}
                                <Input
                                    label="Passing Year"
                                    placeholder="Enter passing year"
                                    value={editFormData.passingYear || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, passingYear: e.target.value }))}
                                    onBlur={() => markFieldAsTouched('passingYear')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('passingYear', !!editFormData.passingYear?.trim()) ? "Passing year is required" : ""}
                                    isInvalid={shouldShowValidationError('passingYear', !!editFormData.passingYear?.trim())}
                                />

                                {/* Result */}
                                <Select
                                    label="Result"
                                    placeholder="Select Result"
                                    selectedKeys={editFormData.result ? [editFormData.result] : []}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, result: selectedKey }));
                                        markFieldAsTouched('result');
                                    }}
                                    onClose={() => markFieldAsTouched('result')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('result', !!editFormData.result?.trim()) ? "Result is required" : ""}
                                    isInvalid={shouldShowValidationError('result', !!editFormData.result?.trim())}
                                >
                                    <SelectItem key="A+">A+</SelectItem>
                                    <SelectItem key="A">A</SelectItem>
                                    <SelectItem key="A-">A-</SelectItem>
                                    <SelectItem key="B+">B+</SelectItem>
                                    <SelectItem key="B">B</SelectItem>
                                    <SelectItem key="B-">B-</SelectItem>
                                    <SelectItem key="C+">C+</SelectItem>
                                    <SelectItem key="C">C</SelectItem>
                                    <SelectItem key="D">D</SelectItem>
                                    <SelectItem key="Not Available">Not Available</SelectItem>
                                </Select>
                            </div>
                        </div>

                        {/* Family Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground border-b border-divider pb-2">
                                Family Information
                            </h3>

                            {/* Economic Condition */}
                            <Select
                                label="Family's Economic Condition"
                                placeholder="Select Economic Condition"
                                selectedKeys={editFormData.economicCondition ? [editFormData.economicCondition] : []}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string;
                                    setEditFormData(prev => ({ ...prev, economicCondition: selectedKey }));
                                    markFieldAsTouched('economicCondition');
                                }}
                                onClose={() => markFieldAsTouched('economicCondition')}
                                variant="bordered"
                                isRequired
                                errorMessage={shouldShowValidationError('economicCondition', !!editFormData.economicCondition?.trim()) ? "Economic condition is required" : ""}
                                isInvalid={shouldShowValidationError('economicCondition', !!editFormData.economicCondition?.trim())}
                            >
                                <SelectItem key="Lower Class">Lower Class</SelectItem>
                                <SelectItem key="Lower Middle Class">Lower Middle Class</SelectItem>
                                <SelectItem key="Middle Class">Middle Class</SelectItem>
                                <SelectItem key="Upper Middle Class">Upper Middle Class</SelectItem>
                                <SelectItem key="Upper Class">Upper Class</SelectItem>
                            </Select>

                            {/* Father Information */}
                            <Card className="shadow-sm">
                                <CardHeader className="border-b border-divider">
                                    <h4 className="text-md font-semibold text-foreground">Father's Information</h4>
                                </CardHeader>
                                <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <Input
                                        label="Father's Name"
                                        placeholder="Enter father's name"
                                        value={editFormData.fatherName || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('fatherName')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('fatherName', !!editFormData.fatherName?.trim()) ? "Father's name is required" : ""}
                                        isInvalid={shouldShowValidationError('fatherName', !!editFormData.fatherName?.trim())}
                                    />
                                    <Input
                                        label="Father's Profession"
                                        placeholder="Enter father's profession"
                                        value={editFormData.fatherProfession || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, fatherProfession: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('fatherProfession')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('fatherProfession', !!editFormData.fatherProfession?.trim()) ? "Father's profession is required" : ""}
                                        isInvalid={shouldShowValidationError('fatherProfession', !!editFormData.fatherProfession?.trim())}
                                    />
                                    <Select
                                        label="Is your father alive?"
                                        placeholder="Select Status"
                                        selectedKeys={editFormData.fatherAlive ? [editFormData.fatherAlive] : []}
                                        onSelectionChange={(keys) => {
                                            const selectedKey = Array.from(keys)[0] as string;
                                            setEditFormData(prev => ({ ...prev, fatherAlive: selectedKey }));
                                            markFieldAsTouched('fatherAlive');
                                        }}
                                        onClose={() => markFieldAsTouched('fatherAlive')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('fatherAlive', !!editFormData.fatherAlive?.trim()) ? "Father's status is required" : ""}
                                        isInvalid={shouldShowValidationError('fatherAlive', !!editFormData.fatherAlive?.trim())}
                                    >
                                        <SelectItem key="Yes">Yes</SelectItem>
                                        <SelectItem key="No">No</SelectItem>
                                    </Select>
                                </CardBody>
                            </Card>

                            {/* Mother Information */}
                            <Card className="shadow-sm">
                                <CardHeader className="border-b border-divider">
                                    <h4 className="text-md font-semibold text-foreground">Mother's Information</h4>
                                </CardHeader>
                                <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <Input
                                        label="Mother's Name"
                                        placeholder="Enter mother's name"
                                        value={editFormData.motherName || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, motherName: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('motherName')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('motherName', !!editFormData.motherName?.trim()) ? "Mother's name is required" : ""}
                                        isInvalid={shouldShowValidationError('motherName', !!editFormData.motherName?.trim())}
                                    />
                                    <Input
                                        label="Mother's Profession"
                                        placeholder="Enter mother's profession"
                                        value={editFormData.motherProfession || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, motherProfession: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('motherProfession')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('motherProfession', !!editFormData.motherProfession?.trim()) ? "Mother's profession is required" : ""}
                                        isInvalid={shouldShowValidationError('motherProfession', !!editFormData.motherProfession?.trim())}
                                    />
                                    <Select
                                        label="Is your mother alive?"
                                        placeholder="Select Status"
                                        selectedKeys={editFormData.motherAlive ? [editFormData.motherAlive] : []}
                                        onSelectionChange={(keys) => {
                                            const selectedKey = Array.from(keys)[0] as string;
                                            setEditFormData(prev => ({ ...prev, motherAlive: selectedKey }));
                                            markFieldAsTouched('motherAlive');
                                        }}
                                        onClose={() => markFieldAsTouched('motherAlive')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('motherAlive', !!editFormData.motherAlive?.trim()) ? "Mother's status is required" : ""}
                                        isInvalid={shouldShowValidationError('motherAlive', !!editFormData.motherAlive?.trim())}
                                    >
                                        <SelectItem key="Yes">Yes</SelectItem>
                                        <SelectItem key="No">No</SelectItem>
                                    </Select>
                                </CardBody>
                            </Card>

                            {/* Siblings Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="How many brothers do you have?"
                                    placeholder="Select Number"
                                    selectedKeys={editFormData.brothersCount !== undefined ? new Set([String(editFormData.brothersCount)]) : new Set()}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, brothersCount: parseInt(selectedKey) }));
                                        markFieldAsTouched('brothersCount');
                                    }}
                                    onClose={() => markFieldAsTouched('brothersCount')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('brothersCount', editFormData.brothersCount !== undefined) ? "Brothers count is required" : ""}
                                    isInvalid={shouldShowValidationError('brothersCount', editFormData.brothersCount !== undefined)}
                                >
                                    {Array.from({ length: 11 }, (_, i) => (
                                        <SelectItem key={String(i)} textValue={String(i)}>
                                            {i}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="How many sisters do you have?"
                                    placeholder="Select Number"
                                    selectedKeys={editFormData.sistersCount !== undefined ? new Set([String(editFormData.sistersCount)]) : new Set()}
                                    onSelectionChange={(keys) => {
                                        const selectedKey = Array.from(keys)[0] as string;
                                        setEditFormData(prev => ({ ...prev, sistersCount: parseInt(selectedKey) }));
                                        markFieldAsTouched('sistersCount');
                                    }}
                                    onClose={() => markFieldAsTouched('sistersCount')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('sistersCount', editFormData.sistersCount !== undefined) ? "Sisters count is required" : ""}
                                    isInvalid={shouldShowValidationError('sistersCount', editFormData.sistersCount !== undefined)}
                                >
                                    {Array.from({ length: 11 }, (_, i) => (
                                        <SelectItem key={String(i)} textValue={String(i)}>
                                            {i}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Family Details */}
                            <Textarea
                                label="Write details about yourself and your family"
                                placeholder="Share any additional information about yourself and your family background"
                                value={editFormData.familyDetails || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, familyDetails: e.target.value }))}
                                variant="bordered"
                                minRows={4}
                            />
                        </div>

                        {/* Partner Preferences Section */}
                        <Card className="shadow-md">
                            <CardHeader className="border-b border-divider pb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Partner Preferences
                                </h3>
                            </CardHeader>
                            <CardBody className="space-y-8 pt-6">
                                {/* Partner Age Range */}
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                        <Slider
                                            className="max-w-full"
                                            aria-label="Preferred Age Range"
                                            label="Preferred Age Range"
                                            minValue={18}
                                            maxValue={70}
                                            step={1}
                                            value={[
                                                editFormData.partnerAgeMin || 18,
                                                editFormData.partnerAgeMax || 40
                                            ] as [number, number]}
                                            onChange={(val) => {
                                                const values = Array.isArray(val) ? val : [18, 40];
                                                const min = Math.min(values[0], values[1] - 1);
                                                const max = Math.max(values[1], min + 1);
                                                setEditFormData(prev => ({
                                                    ...prev,
                                                    partnerAgeMin: min,
                                                    partnerAgeMax: max
                                                }));
                                            }}
                                            formatOptions={{ style: "unit", unit: "year" }}
                                            getValue={(vals) => Array.isArray(vals) ? `${vals[0]} - ${vals[1]} years` : `${vals} years`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <Input
                                        label="Preferred Complexion"
                                        placeholder="Enter preferred complexion"
                                        value={editFormData.partnerComplexion || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, partnerComplexion: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('partnerComplexion')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('partnerComplexion', !!editFormData.partnerComplexion?.trim()) ? "Partner complexion is required" : ""}
                                        isInvalid={shouldShowValidationError('partnerComplexion', !!editFormData.partnerComplexion?.trim())}
                                    />

                                    <Input
                                        label="Preferred Height"
                                        placeholder="Enter preferred height"
                                        value={editFormData.partnerHeight || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, partnerHeight: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('partnerHeight')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('partnerHeight', !!editFormData.partnerHeight?.trim()) ? "Partner height is required" : ""}
                                        isInvalid={shouldShowValidationError('partnerHeight', !!editFormData.partnerHeight?.trim())}
                                    />

                                    <Input
                                        label="Preferred Education"
                                        placeholder="Enter preferred education"
                                        value={editFormData.partnerEducation || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, partnerEducation: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('partnerEducation')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('partnerEducation', !!editFormData.partnerEducation?.trim()) ? "Partner education is required" : ""}
                                        isInvalid={shouldShowValidationError('partnerEducation', !!editFormData.partnerEducation?.trim())}
                                    />

                                    <Input
                                        label="Preferred Profession"
                                        placeholder="Enter preferred profession"
                                        value={editFormData.partnerProfession || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, partnerProfession: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('partnerProfession')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('partnerProfession', !!editFormData.partnerProfession?.trim()) ? "Partner profession is required" : ""}
                                        isInvalid={shouldShowValidationError('partnerProfession', !!editFormData.partnerProfession?.trim())}
                                    />
                                </div>

                                <Textarea
                                    label="Preferred Place"
                                    placeholder="Enter preferred location"
                                    value={editFormData.partnerLocation || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, partnerLocation: e.target.value }))}
                                    onBlur={() => markFieldAsTouched('partnerLocation')}
                                    variant="bordered"
                                    isRequired
                                    errorMessage={shouldShowValidationError('partnerLocation', !!editFormData.partnerLocation?.trim()) ? "Partner location is required" : ""}
                                    isInvalid={shouldShowValidationError('partnerLocation', !!editFormData.partnerLocation?.trim())}
                                    minRows={2}
                                />

                                <Textarea
                                    label="Details about the prospective spouse"
                                    placeholder="Share your expectations and preferences for your life partner"
                                    value={editFormData.partnerDetails || ''}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, partnerDetails: e.target.value }))}
                                    variant="bordered"
                                    minRows={3}
                                />
                            </CardBody>
                        </Card>

                        {/* Contact Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground border-b border-divider pb-2">
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
                                            <Tooltip content="When enabled, your profile picture will be visible to other users browsing biodatas">
                                                <Info className="w-4 h-4 text-slate-400 cursor-help" />
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
                                        <Switch
                                            isSelected={editFormData.profilePictureVisible || false}
                                            onValueChange={(value) => {
                                                setEditFormData(prev => ({ ...prev, profilePictureVisible: value }));
                                                addToast(
                                                    value
                                                        ? 'Profile picture is now public'
                                                        : 'Profile picture is now private',
                                                    'success'
                                                );
                                            }}
                                            color="success"
                                            size="md"
                                        />
                                    </div>
                                </div>


                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Input
                                        label="Your full name"
                                        placeholder="Enter full name"
                                        value={editFormData.fullName || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('fullName')}
                                        variant="bordered"
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
                                            <Tooltip content="Only visible for admin">
                                                <Info className="w-4 h-4 text-slate-400 cursor-help" />
                                            </Tooltip>
                                        }
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Email"
                                        type="email"
                                        placeholder="Enter email address"
                                        value={editFormData.email || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('email')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('email', !!editFormData.email?.trim()) ? "Email is required" : ""}
                                        isInvalid={shouldShowValidationError('email', !!editFormData.email?.trim())}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Guardian's Mobile Number"
                                        type="tel"
                                        placeholder="Enter guardian's mobile number"
                                        value={editFormData.guardianMobile || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, guardianMobile: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('guardianMobile')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('guardianMobile', !!editFormData.guardianMobile?.trim()) ? "Guardian's mobile number is required" : ""}
                                        isInvalid={shouldShowValidationError('guardianMobile', !!editFormData.guardianMobile?.trim())}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Own Mobile Number"
                                        type="tel"
                                        placeholder="Enter your mobile number"
                                        value={editFormData.ownMobile || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, ownMobile: e.target.value }))}
                                        onBlur={() => markFieldAsTouched('ownMobile')}
                                        variant="bordered"
                                        isRequired
                                        errorMessage={shouldShowValidationError('ownMobile', !!editFormData.ownMobile?.trim()) ? "Own mobile number is required" : ""}
                                        isInvalid={shouldShowValidationError('ownMobile', !!editFormData.ownMobile?.trim())}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </DrawerBody>
                <DrawerFooter className="flex justify-end items-center px-6 py-4 bg-content1/50">
                    <Button
                        color="primary"
                        size="md"
                        onPress={handleSaveBiodata}
                        isLoading={isUpdatingBiodata}
                        isDisabled={isUpdatingBiodata}
                        variant="shadow"
                        className="font-semibold px-8 min-w-[120px]"
                        startContent={!isUpdatingBiodata ? <span>💾</span> : undefined}
                    >
                        {isUpdatingBiodata
                            ? "Saving..."
                            : selectedBiodata
                                ? "Save Changes"
                                : "Create Biodata"
                        }
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}