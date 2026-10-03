"use client";
import { FormInput } from "@/components/ui/form-fields";
import { useState } from "react";
import { Lock, User, Mail, AtSign } from "lucide-react";
import { Card, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useRegularAuth } from "@/context/RegularAuthContext";
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { userApi } from '@/services/api-client';

export default function Settings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { user } = useRegularAuth();

  // Prefill the form once per signed-in user (adjusting state during render, not in an effect)
  const [prefilledFor, setPrefilledFor] = useState<number | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setName(user.fullName || "");
    setEmail(user.email || "");
  }



  const handleSaveChanges = async () => {
    if (!user) return;

    setIsLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem('regular_user_access_token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const updateData: any = {
        fullName: name,
      };

      // Only include email if user has email (don't send empty email for username users)
      if (user.email || email) {
        updateData.email = email;
      }

      logger.info('Updating user profile', updateData, 'Settings');
      
      const data = await userApi.put(`/users/${user.id}`, updateData);

      // Update local storage with new user data
      const updatedUser = { 
        ...user, 
        fullName: name,
        ...(updateData.email && { email: email })
      };
      localStorage.setItem('regular_user', JSON.stringify(updatedUser));

      setMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);

    } catch (error) {
      const appError = handleApiError(error, 'Component');
            logger.error('Profile update error', appError, 'Page');
      setMessage(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen  bg-gradient-to-b from-neutral-50 to-neutral-100 p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        {/* Profile Settings */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Profile Settings</h3>
            </div>
          </Card.Header>
          <Card.Content className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">Display Name</label>
                <FormInput
                  id="name"
                  value={name}
                  onValueChange={(value) => setName(value)}
                  placeholder="Your full name"
                  startContent={<User className="w-4 h-4 text-gray-400" />}
                  inputClassName="text-sm"
                  groupClassName="border-gray-200 hover:border-blue-300 focus-within:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                <FormInput
                  id="email"
                  type="email"
                  value={email}
                  onValueChange={(value) => setEmail(value)}
                  placeholder="your@email.com"
                  startContent={<Mail className="w-4 h-4 text-gray-400" />}
                  inputClassName="text-sm"
                  groupClassName="border-gray-200 hover:border-blue-300 focus-within:border-blue-500"
                />
              </div>
            </div>
            
            {message && (
              <div className={`p-4 rounded-md ${message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="primary"
                onPress={handleSaveChanges}
                isDisabled={isLoading}
                className="px-8"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* Security Settings */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-semibold">Security</h3>
            </div>
          </Card.Header>
          <Card.Content>
            <Button
              variant="outline"
              className="w-full"
              onPress={() => router.push('/settings/reset-password')}
            >
              Reset Password
            </Button>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}