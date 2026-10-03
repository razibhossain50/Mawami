'use client';
import { FormInput } from "@/components/ui/form-fields";
import { Card, Tooltip, Switch } from "@heroui/react";
import { Info } from "lucide-react";
import { useState, useCallback } from "react";
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { apiClient } from '@/services/api-client';
import { FileUploadResponse } from '@/types/api';
import { ImageUploadWithCrop } from '@/components/common/ImageUploadWithCrop';
import { ImageCropResult } from '@/hooks/useImageCrop';

interface ContactInfoStepProps {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  updateData: (data: Partial<Record<string, unknown>>) => void;
}

export function ContactInfoStep({ data, errors, updateData }: ContactInfoStepProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Handle image crop completion
  const handleImageCropComplete = useCallback(async (result: ImageCropResult) => {
    try {
      setIsUploading(true);

      // Create a File object from the blob
      const croppedFile = new File([result.blob], 'cropped-profile.jpg', {
        type: 'image/jpeg',
      });

      // Upload the cropped file
      const uploadResult = await apiClient.uploadFile('/api/upload/profile-picture', croppedFile, 'profilePicture', { requireAuth: true }) as FileUploadResponse;

      // Update the data with the uploaded image URL
      updateData({ profilePicture: uploadResult.url });

      logger.debug('File uploaded successfully', uploadResult, 'Contact-info-step');
    } catch (error) {
      const appError = handleApiError(error, 'Component');
      logger.error('Upload error', appError, 'Contact-info-step');
      throw error; // Re-throw to let the hook handle the toast
    } finally {
      setIsUploading(false);
    }
  }, [updateData]);

  // Handle removing uploaded image
  const handleRemoveImage = useCallback(() => {
    console.log('🗑️ Removing profile picture, current value:', data.profilePicture);
    updateData({ profilePicture: null });
    console.log('🗑️ Profile picture removal data sent:', { profilePicture: null });
    logger.debug('Profile picture removed', {}, 'ContactInfoStep');
  }, [updateData, data.profilePicture]);

  return (
    <div className="space-y-8">
      <div className="border-b pb-4 border-gray-200">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-lg" />
          Contact Information
        </h2>
        <p className="text-slate-500 mt-1">Provide your contact details securely</p>
      </div>

      <div className="space-y-8">


        {/* Contact details grid */}
        <div className="grid gap-4">
          {/* Name with Admin Note */}
          <div className="col-span-2">
            <FormInput
              label="Your full name"
              placeholder="Enter full name"
              value={(data.fullName as string) || ""}
              onValueChange={(value) => updateData({ fullName: value })}
              isRequired
              errorMessage={errors.fullName}
              isInvalid={!!errors.fullName}
              description="Only visible for premium users"
            />
          </div>

          {/* Profile Picture */}
          <div className="col-span-2 space-y-4">

            <ImageUploadWithCrop
              onCropComplete={handleImageCropComplete}
              onRemove={handleRemoveImage}
              currentImageUrl={data.profilePicture as string}
              aspectRatio={1}
              maxFileSize={5 * 1024 * 1024}
              title="Profile Picture"
              description="Upload a clear photo of yourself. You'll be able to crop it after selection."
              className="w-full"
            />

            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Profile pic is optional. You can crop and adjust after upload.
            </p>
          </div>

          {/* Profile Picture Visibility Toggle */}
          <div className="col-span-2">
            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 hover:border-slate-300 transition-colors">
              <Card.Content className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground">
                        Make Profile Picture Public
                      </h4>
                      <Tooltip delay={200}>
                        <Tooltip.Trigger tabIndex={0} aria-label="About profile picture visibility">
                          <Info className="w-4 h-4 text-slate-400 cursor-help" />
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          When enabled, your profile picture will be visible to other users browsing biodatas
                        </Tooltip.Content>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-slate-600">
                      {(data.profilePictureVisible as boolean)
                        ? "✓ Visible to everyone"
                        : "🔒 Only visible to you and admins"
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${(data.profilePictureVisible as boolean)
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                      }`}>
                      {(data.profilePictureVisible as boolean) ? 'Public' : 'Private'}
                    </span>
                    <Switch isSelected={(data.profilePictureVisible as boolean) || false} onChange={(value) => {
                        updateData({ profilePictureVisible: value });
                      }} size="md" aria-label="Make profile picture public">
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Email */}
          <div className="col-span-2">
            <FormInput
              className="col-span-2"
              type="email"
              label="Email"
              placeholder="Enter email address"
              value={(data.email as string) || ""}
              onValueChange={(value) => updateData({ email: value })}
              description="Only visible for premium users"
              isRequired
              errorMessage={errors.email}
              isInvalid={!!errors.email}
            />
          </div>

          {/* Guardian's Mobile */}
          <div className="col-span-2">
            <FormInput
              type="tel"
              label="Guardian's Mobile Number"
              placeholder="Enter guardian's mobile number"
              value={(data.guardianMobile as string) || ""}
              onValueChange={(value) => updateData({ guardianMobile: value })}
              description="Only visible for premium users"
              isRequired
              errorMessage={errors.guardianMobile}
              isInvalid={!!errors.guardianMobile}
            />
          </div>

          {/* Own Mobile */}
          <div className="col-span-2">
            <FormInput
              type="tel"
              label="Own Mobile Number"
              placeholder="Enter your mobile number"
              value={(data.ownMobile as string) || ""}
              onValueChange={(value) => updateData({ ownMobile: value })}
              description="Only visible for premium users"
              isRequired
              errorMessage={errors.ownMobile}
              isInvalid={!!errors.ownMobile}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
