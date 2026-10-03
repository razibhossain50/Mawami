import React from 'react';
import { Card, Button } from "@heroui/react";
import Link from "next/link";
import { 
  AlertCircle, 
  RefreshCw, 
  Shield, 
  Heart, 
  Edit, 
  Plus, 
  Users, 
  Sparkles,
  XCircle,
  EyeOff
} from "lucide-react";
import { BiodataApprovalStatus, BiodataVisibilityStatus, BIODATA_STATUS_COLORS } from "@/types/biodata";

interface BiodataStatusHandlerProps {
  status: string; // 'pending', 'approved', 'rejected', 'inactive', 'active'
  biodataId: string;
  canEditProfile: boolean;
}

export const BiodataStatusHandler: React.FC<BiodataStatusHandlerProps> = ({
  status,
  biodataId,
  canEditProfile
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          title: "Biodata Under Review",
          subtitle: "Your biodata is currently being reviewed by our team",
          bgGradient: "from-amber-50 via-orange-50 to-yellow-50",
          headerGradient: "from-amber-500 via-orange-500 to-yellow-500",
          icon: <AlertCircle className="h-10 w-10 text-white" />,
          animatedIcon: <RefreshCw className="h-8 w-8 text-white animate-spin" />,
          statusText: "Under Review",
          statusDescription: "Your biodata (ID: BD{biodataId}) was submitted successfully. We're currently reviewing it to ensure quality and authenticity. You'll receive a notification once it's approved.",
          steps: [
            {
              icon: <Shield className="h-6 w-6 text-blue-500" />,
              title: "Verification",
              description: "Our team is verifying your information",
              bgColor: "bg-blue-100"
            },
            {
              icon: <RefreshCw className="h-6 w-6 text-green-500" />,
              title: "Review Process",
              description: "Usually takes 24-48 hours to complete",
              bgColor: "bg-green-100"
            },
            {
              icon: <Heart className="h-6 w-6 text-rose-500" />,
              title: "Go Live",
              description: "Your profile will be visible to others",
              bgColor: "bg-rose-100"
            }
          ]
        };

      case 'rejected':
        return {
          title: "Biodata Rejected",
          subtitle: "Your biodata submission needs attention",
          bgGradient: "from-red-50 via-rose-50 to-pink-50",
          headerGradient: "from-red-500 via-rose-500 to-pink-500",
          icon: <XCircle className="h-10 w-10 text-white" />,
          animatedIcon: <XCircle className="h-8 w-8 text-white" />,
          statusText: "Rejected",
          statusDescription: "Your biodata (ID: BD{biodataId}) was rejected due to policy violations or incomplete information. Please review and resubmit with the required corrections.",
          steps: [
            {
              icon: <AlertCircle className="h-6 w-6 text-red-500" />,
              title: "Review Required",
              description: "Check the feedback provided",
              bgColor: "bg-red-100"
            },
            {
              icon: <Edit className="h-6 w-6 text-blue-500" />,
              title: "Make Changes",
              description: "Update your biodata accordingly",
              bgColor: "bg-blue-100"
            },
            {
              icon: <RefreshCw className="h-6 w-6 text-green-500" />,
              title: "Resubmit",
              description: "Submit for review again",
              bgColor: "bg-green-100"
            }
          ]
        };

      case 'inactive':
        return {
          title: "Biodata Inactive",
          subtitle: "Your biodata is temporarily hidden from public view",
          bgGradient: "from-gray-50 via-slate-50 to-neutral-50",
          headerGradient: "from-gray-500 via-slate-500 to-neutral-500",
          icon: <EyeOff className="h-10 w-10 text-white" />,
          animatedIcon: <EyeOff className="h-8 w-8 text-white" />,
          statusText: "Inactive",
          statusDescription: "Your biodata (ID: BD{biodataId}) is currently inactive and not visible to other users. You can reactivate it anytime by editing your profile.",
          steps: [
            {
              icon: <EyeOff className="h-6 w-6 text-gray-500" />,
              title: "Hidden",
              description: "Not visible to other users",
              bgColor: "bg-gray-100"
            },
            {
              icon: <Edit className="h-6 w-6 text-blue-500" />,
              title: "Edit Profile",
              description: "Make any necessary updates",
              bgColor: "bg-blue-100"
            },
            {
              icon: <Heart className="h-6 w-6 text-green-500" />,
              title: "Reactivate",
              description: "Make your profile visible again",
              bgColor: "bg-green-100"
            }
          ]
        };

      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  // Map status to appropriate colors
  const getStatusColors = () => {
    switch (status) {
      case 'pending':
        return BIODATA_STATUS_COLORS[BiodataApprovalStatus.PENDING];
      case 'rejected':
        return BIODATA_STATUS_COLORS[BiodataApprovalStatus.REJECTED];
      case 'inactive':
        return BIODATA_STATUS_COLORS[BiodataApprovalStatus.INACTIVE];
      default:
        return BIODATA_STATUS_COLORS[BiodataApprovalStatus.PENDING];
    }
  };

  const colors = getStatusColors();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} p-4 md:p-8`}>
      <div className="container max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
            {config.title}
          </h1>
          <p className="text-gray-600 text-lg">
            {config.subtitle}
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
          {/* Decorative Header */}
          <div className={`relative bg-gradient-to-r ${config.headerGradient} p-8`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-4 right-4 opacity-20">
              {config.animatedIcon}
            </div>
            <div className="relative text-center text-white">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                {config.icon}
              </div>
              <h2 className="text-2xl font-bold mb-2">Biodata {config.statusText}</h2>
              <p className="text-white/90">
                {status === 'pending' && "Your biodata has been submitted successfully and is currently under review"}
                {status === 'rejected' && "Your biodata needs attention before it can be approved"}
                {status === 'inactive' && "Your biodata is temporarily hidden from public view"}
              </p>
            </div>
          </div>

          {/* Content Section */}
          <Card.Content className="p-8">
            <div className="text-center space-y-6">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {status === 'pending' && "What happens next?"}
                  {status === 'rejected' && "How to fix this?"}
                  {status === 'inactive' && "What can you do?"}
                </h3>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {config.steps.map((step, index) => (
                    <div key={index} className="text-center p-4">
                      <div className={`w-12 h-12 mx-auto mb-3 ${step.bgColor} rounded-full flex items-center justify-center`}>
                        {step.icon}
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Info */}
              <div className={`${colors.bg} border ${colors.border} rounded-lg p-6 mb-6`}>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className={`w-3 h-3 ${colors.dot} rounded-full ${status === 'pending' ? 'animate-pulse' : ''}`}></div>
                  <span className={`${colors.text} font-semibold`}>Status: {config.statusText}</span>
                </div>
                <p className={`${colors.text} text-sm`}>
                  {config.statusDescription.replace('{biodataId}', biodataId)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {canEditProfile && (
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Link className="flex items-center" href={`/profile/biodatas/edit/${biodataId}`}>
                      <Edit className="h-5 w-5 mr-2" />
                      <span>
                        {status === 'rejected' ? "Fix & Resubmit" : "Edit Biodata"}
                      </span>
                    </Link>
                  </Button>
                )}

                <div className="flex justify-center gap-4">
                  <Button variant="secondary">
                    <Link href="/profile/biodatas">
                      Browse Other Profiles
                    </Link>
                  </Button>
                  <Button variant="secondary">
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <Shield className="h-4 w-4 inline mr-1" />
                  {status === 'pending' && "We review all profiles to maintain quality and ensure a safe experience for all members"}
                  {status === 'rejected' && "Our review process ensures all profiles meet our community standards"}
                  {status === 'inactive' && "You can reactivate your profile anytime by making it active again"}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};