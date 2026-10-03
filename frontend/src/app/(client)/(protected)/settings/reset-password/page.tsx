"use client";
import { FormInput } from "@/components/ui/form-fields";
import { useState } from "react";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Card, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useRegularAuth } from "@/context/RegularAuthContext";

export default function ResetPassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { user } = useRegularAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setMessage("User not found. Please log in again.");
      return;
    }

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setMessage("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem('regular_user_access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      setMessage("Password updated successfully!");
      
      // Clear form fields on success
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Redirect to settings page after 2 seconds
      setTimeout(() => {
        router.push('/settings');
      }, 2000);

    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 p-8">
      <div className="container max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted">
            Update your password to keep your account secure
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-md ${message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}

        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-semibold">Change Your Password</h3>
            </div>
            <p className="text-sm text-gray-600">
              Enter your current password and choose a new secure password
            </p>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="oldPassword" className="text-sm font-medium">Current Password</label>
                <div className="relative">
                  <FormInput
                    id="oldPassword"
                    isRequired
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onValueChange={(value) => setOldPassword(value)}
                    placeholder="Enter your current password"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onPress={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <FormInput
                    id="newPassword"
                    isRequired
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onValueChange={(value) => setNewPassword(value)}
                    placeholder="Enter your new password"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</label>
                <div className="relative">
                  <FormInput
                    id="confirmPassword"
                    isRequired
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onValueChange={(value) => setConfirmPassword(value)}
                    placeholder="Confirm your new password"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <strong className="text-blue-800">Password Requirements:</strong>
                    <ul className="mt-2 space-y-1 text-sm text-blue-700">
                      <li>• At least 8 characters long</li>
                      <li>• Include uppercase and lowercase letters</li>
                      <li>• Include at least one number</li>
                      <li>• Include at least one special character</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" isDisabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted">
            Having trouble? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}