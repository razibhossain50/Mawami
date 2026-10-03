"use client";
import { FormInput } from "@/components/ui/form-fields";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Card, Button, Separator, Spinner, Chip } from "@heroui/react";
import { Eye, EyeOff, User, Lock, Sparkles } from "lucide-react";
import { useRegularAuth } from "@/context/RegularAuthContext";
import GoogleOAuthButton from "./GoogleOAuthButton";

const loginSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginFormRegular() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { login } = useRegularAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    setError(null);
    try {
      await login(values.email, values.password);
    } catch (error: unknown) {
      setError((error as Error)?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-md">
          <Card.Header className="flex flex-col items-center justify-center text-center pb-4 pt-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-base">
                Sign in to find your perfect match
              </p>
            </div>
          </Card.Header>

          <Card.Content className="px-6 pb-6">
            {error && (
              <div className="mb-4">
                <Chip
                  color="danger"
                  variant="soft"
                  className="w-full p-3 h-auto whitespace-normal"
                >
                  {error}
                </Chip>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormInput variant="bordered"
                inputProps={register("email")}
                type="email"
                label="Email"
                placeholder="Enter your email address"
                startContent={<User className="w-4 h-4 text-gray-400" />}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
                inputClassName="text-sm"
                groupClassName="border-gray-200 hover:border-blue-300 focus-within:border-blue-500"
              />

              <FormInput variant="bordered"
                inputProps={register("password")}
                label="Password"
                placeholder="Enter your password"
                startContent={<Lock className="w-4 h-4 text-gray-400" />}
                endContent={
                  <button
                    className="focus:outline-none"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? (
                      <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                }
                type={isVisible ? "text" : "password"}
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
                inputClassName="text-sm"
                groupClassName="border-gray-200 hover:border-blue-300 focus-within:border-blue-500"
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 text-base hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
                size="lg"
                isPending={isLoading}
                isDisabled={!isValid}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <Separator className="my-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-3 text-sm text-gray-500">
                    or continue with
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <GoogleOAuthButton mode="login" />
              </div>

              <div className="relative mt-6">
                <Separator className="my-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-3 text-sm text-gray-500">
                    New to Mawami?
                  </span>
                </div>
              </div>

              <div className="text-center mt-4">
                <Link href="/auth/signup">
                  <Button
                    variant="ghost"
                    className="text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Create your account
                  </Button>
                </Link>
              </div>
            </div>
          </Card.Content>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Join thousands of people finding love on Mawami
          </p>
        </div>
      </div>
    </div>
  );
}