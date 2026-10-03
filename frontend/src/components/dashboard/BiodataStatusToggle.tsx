import React, { useState } from 'react';
import { Card, CardBody, Switch, Button, Chip, Spinner } from "@heroui/react";
import { Eye, EyeOff, AlertCircle, Shield, RefreshCw } from "lucide-react";
import { BiodataApprovalStatus, BiodataVisibilityStatus, BIODATA_STATUS_COLORS } from "@/types/biodata";
import { logger } from '@/services/logger';
import { userApi } from '@/services/api-client';
import { handleApiError } from '@/services/error-handler';

interface BiodataStatusToggleProps {
  biodataId?: number;
  biodataApprovalStatus?: BiodataApprovalStatus;
  biodataVisibilityStatus?: BiodataVisibilityStatus;
  canUserToggle?: boolean;
  onStatusChange?: (newStatus: string) => void;
}

export const BiodataStatusToggle: React.FC<BiodataStatusToggleProps> = ({
  biodataId,
  biodataApprovalStatus = BiodataApprovalStatus.PENDING,
  biodataVisibilityStatus = BiodataVisibilityStatus.ACTIVE,
  canUserToggle = false,
  onStatusChange
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [localVisibilityStatus, setLocalVisibilityStatus] = useState(biodataVisibilityStatus);
  const [error, setError] = useState<string | null>(null);

  // Reset the optimistic local copy when the prop changes (during render, not in an effect)
  const [prevVisibilityStatus, setPrevVisibilityStatus] = useState(biodataVisibilityStatus);
  if (biodataVisibilityStatus !== prevVisibilityStatus) {
    setPrevVisibilityStatus(biodataVisibilityStatus);
    setLocalVisibilityStatus(biodataVisibilityStatus);
  }

  const handleToggle = async () => {
    if (!canUserToggle || isToggling) return;

    try {
      setIsToggling(true);
      setError(null);

      const token = localStorage.getItem('regular_user_access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/biodatas/current/toggle-visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to toggle visibility');
      }

      const result = await response.json();

      if (result.success) {
        const newVisibilityStatus = localVisibilityStatus === BiodataVisibilityStatus.ACTIVE
          ? BiodataVisibilityStatus.INACTIVE
          : BiodataVisibilityStatus.ACTIVE;
        setLocalVisibilityStatus(newVisibilityStatus);

        if (onStatusChange && result.newStatus) {
          onStatusChange(result.newStatus);
        }
      } else {
        setError(result.message || 'Failed to toggle visibility');
      }
    } catch (error) {
      const appError = handleApiError(error, 'BiodataStatusToggle');
      logger.error('Error toggling biodata visibility', appError, 'BiodataStatusToggle');
      setError(appError.message);
    } finally {
      setIsToggling(false);
    }
  };

  const getStatusInfo = () => {
    const colors = BIODATA_STATUS_COLORS[biodataApprovalStatus];

    switch (biodataApprovalStatus) {
      case BiodataApprovalStatus.IN_PROGRESS:
        return {
          icon: <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />,
          title: "In Progress",
          description: "Your biodata is being processed",
          canToggle: false,
          toggleMessage: "Cannot toggle while in progress"
        };

      case BiodataApprovalStatus.PENDING:
        return {
          icon: <RefreshCw className="h-5 w-5 text-amber-500 animate-spin" />,
          title: "Under Review",
          description: "Your biodata is being reviewed by our team",
          canToggle: false,
          toggleMessage: "Cannot toggle while under review"
        };

      case BiodataApprovalStatus.APPROVED:
        const isVisible = localVisibilityStatus === BiodataVisibilityStatus.ACTIVE;
        return {
          icon: isVisible ? <Eye className="h-5 w-5 text-green-500" /> : <EyeOff className="h-5 w-5 text-gray-500" />,
          title: isVisible ? "Approved & Visible" : "Approved but Hidden",
          description: isVisible
            ? "Your biodata is approved and visible to other users"
            : "Your biodata is approved but hidden by your choice",
          canToggle: true,
          toggleMessage: isVisible ? "Hide from others" : "Make visible to others"
        };

      case BiodataApprovalStatus.REJECTED:
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          title: "Rejected",
          description: "Your biodata was rejected. Please edit and resubmit",
          canToggle: false,
          toggleMessage: "Cannot toggle rejected biodata"
        };

      case BiodataApprovalStatus.INACTIVE:
        return {
          icon: <EyeOff className="h-5 w-5 text-gray-500" />,
          title: "Deactivated",
          description: "Your biodata has been deactivated by admin",
          canToggle: false,
          toggleMessage: "Contact admin to reactivate"
        };

      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
          title: "Unknown Status",
          description: "Status unknown",
          canToggle: false,
          toggleMessage: "Cannot toggle unknown status"
        };
    }
  };

  const statusInfo = getStatusInfo();
  const colors = BIODATA_STATUS_COLORS[biodataApprovalStatus];

  return (
    <Card className="w-full">
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  Biodata Visibility
                </h3>
                <Chip
                  className={`${colors.text} ${colors.bg} border ${colors.border}`}
                  size="sm"
                  variant="flat"
                >
                  {biodataApprovalStatus}
                </Chip>
              </div>

              <p className="text-gray-600 mb-4">
                {statusInfo.description}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Toggle Section */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {localVisibilityStatus === BiodataVisibilityStatus.ACTIVE ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {localVisibilityStatus === BiodataVisibilityStatus.ACTIVE ? "Visible to others" : "Hidden from others"}
                    </span>
                  </div>

                  {!canUserToggle && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {statusInfo.toggleMessage}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isToggling && <Spinner size="sm" />}

                  <Switch
                    isSelected={localVisibilityStatus === BiodataVisibilityStatus.ACTIVE}
                    onValueChange={handleToggle}
                    isDisabled={!canUserToggle || isToggling}
                    color="success"
                    size="sm"
                  />
                </div>
              </div>

              {/* Help Text */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Admin approval is required before your biodata becomes visible</li>
                      <li>• Once approved, you can choose to hide/show your biodata anytime</li>
                      <li>• Admin decisions (rejected/inactive) cannot be overridden</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};