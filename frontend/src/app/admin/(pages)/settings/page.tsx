'use client';
import { FormInput } from "@/components/ui/form-fields";

import React, { useState } from 'react';
import { Button, Card } from "@heroui/react";
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/services/queryClient';
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { useRouter } from 'next/navigation';

interface SettingsFormData {
  fullName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<SettingsFormData>({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<SettingsFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Prefill the form once per signed-in user (adjusting state during render, not in an effect)
  const [prefilledFor, setPrefilledFor] = useState<number | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setFormData(prev => ({
      ...prev,
      fullName: user.fullName || '',
      email: user.email || ''
    }));
  }

  const handleInputChange = (field: keyof SettingsFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SettingsFormData> = {};

    // Validate name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    // Email validation removed - email field is disabled and cannot be changed

    // Validate password change - user must provide current password to change password
    const hasPasswordChange = formData.newPassword || formData.confirmPassword;

    if (hasPasswordChange) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Enter your current password to verify your identity';
      }
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters long';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // If only current password is provided without new password
    if (formData.currentPassword && !formData.newPassword) {
      newErrors.newPassword = 'Enter a new password to change your current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const hasPasswordChange = formData.currentPassword && formData.newPassword;

      // Update profile information (fullName)
      const profileUpdateData = {
        fullName: formData.fullName
      };

      const profileResponse = await apiRequest('PUT', `/api/users/${user?.id}`, profileUpdateData);

      if (!profileResponse.ok) {
        throw new Error('Failed to update profile information');
      }

      // Update password if provided
      if (hasPasswordChange) {
        const passwordUpdateData = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        };

        const passwordResponse = await apiRequest('PUT', `/api/users/${user?.id}/password`, passwordUpdateData);

        if (!passwordResponse.ok) {
          throw new Error('Failed to update password');
        }
      }

      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      logger.info('Admin settings updated successfully', { userId: user?.id }, 'AdminSettings');

    } catch (error) {
      const appError = handleApiError(error, 'AdminSettings');
      logger.error('Failed to update admin settings', appError, 'AdminSettings');
      setMessage({
        type: 'error',
        text: appError.message || 'Failed to update settings. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account information and security settings
        </p>
      </div>

      <Card className="shadow-lg">
        <Card.Header className="pb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Profile Information
          </h2>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`p-4 rounded-lg ${message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                {message.text}
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput variant="bordered"
                  label="Full Name"
                  value={formData.fullName}
                  onValueChange={handleInputChange('fullName')}
                  isRequired
                  errorMessage={errors.fullName}
                  isInvalid={!!errors.fullName}
                />

                <FormInput variant="bordered"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  isReadOnly
                  isDisabled
                  description="Email address cannot be changed"
                />
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                Change Password
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                To change your password, you must first enter your current password to verify your identity
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput variant="bordered"
                  label="Current Password"
                  type="password"
                  placeholder="Enter your current password"
                  value={formData.currentPassword}
                  onValueChange={handleInputChange('currentPassword')}
                  errorMessage={errors.currentPassword}
                  isInvalid={!!errors.currentPassword}
                />

                <FormInput variant="bordered"
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onValueChange={handleInputChange('newPassword')}
                  errorMessage={errors.newPassword}
                  isInvalid={!!errors.newPassword}
                />

                <FormInput variant="bordered"
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onValueChange={handleInputChange('confirmPassword')}
                  errorMessage={errors.confirmPassword}
                  isInvalid={!!errors.confirmPassword}
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                type="submit"
                size="lg"
                isPending={isLoading}
                className="min-w-32"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
