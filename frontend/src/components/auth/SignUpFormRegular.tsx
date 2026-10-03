"use client";
import { FormInput } from "@/components/ui/form-fields";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Card, Button, Separator, Spinner, Chip } from "@heroui/react";
import { Eye, EyeOff, User, Lock, Sparkles, CheckCircle } from "lucide-react";
import { useRegularAuth } from "@/context/RegularAuthContext";
import GoogleOAuthButton from "./GoogleOAuthButton";

const signupSchema = z.object({
  fullName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z.string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .transform(val => val.trim()),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupFormRegular() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const { signup } = useRegularAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // useWatch subscribes properly (watch() can't be memoized by the React Compiler)
  const [password, fullName, email, confirmPassword] = useWatch({
    control,
    name: ["password", "fullName", "email", "confirmPassword"],
  });



  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: "", color: "default" as const };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    if (strength <= 25) return { strength, label: "Weak", color: "danger" as const };
    if (strength <= 50) return { strength, label: "Fair", color: "warning" as const };
    if (strength <= 75) return { strength, label: "Good", color: "primary" as const };
    return { strength, label: "Strong", color: "success" as const };
  };

  async function onSubmit(values: SignupValues) {
    setIsLoading(true);
    setError(null);
    try {
      await signup(values.fullName, values.email, values.password, values.confirmPassword);
    } catch (error: unknown) {
      setError((error as Error)?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  }

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);
  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-md">
          <Card.Header className="flex flex-col items-center justify-center text-center pb-4 pt-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-800">
                Join Mawami
              </h1>
              <p className="text-gray-600 text-base">
                Create your account to start your journey
              </p>
            </div>
          </Card.Header>

          <Card.Content className="px-6 pb-6">
            {error && (
              <div className="mb-4">
                <Chip
                  color="danger"
                  variant="soft"
                  className="w-full p-3 h-auto flex-wrap whitespace-normal"
                >{<Sparkles className="w-4 h-4" />}
                  {error}
                </Chip>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormInput
                inputProps={register("fullName")}
                label="Full Name"
                placeholder="Enter your full name"
                startContent={<User className="w-4 h-4 text-gray-400" />}
                endContent={
                  fullName && fullName.length >= 2 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : null
                }
                isInvalid={!!errors.fullName}
                errorMessage={errors.fullName?.message}
                inputClassName="text-sm"
                groupClassName="border-gray-200 hover:border-blue-300 focus-within:border-blue-500"
              />

              <FormInput
                inputProps={register("email")}
                type="email"
                label="Email"
                placeholder="Enter your email address"
                startContent={<User className="w-4 h-4 text-gray-400" />}
                endContent={
                  email && !errors.email ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : null
                }
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
                inputClassName="text-sm"
                groupClassName="border-gray-200 hover:border-blue-300 focus-within:border-blue-500"
              />

              <div className="space-y-2">
                <FormInput
                  inputProps={register("password")}
                  label="Password"
                  placeholder="Create a strong password"
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
                
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Password strength</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.color === 'danger' ? 'text-red-500' :
                        passwordStrength.color === 'warning' ? 'text-yellow-500' :
                        passwordStrength.color === 'primary' ? 'text-blue-500' :
                        'text-green-500'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          passwordStrength.color === 'danger' ? 'bg-red-500' :
                          passwordStrength.color === 'warning' ? 'bg-yellow-500' :
                          passwordStrength.color === 'primary' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <FormInput
                inputProps={register("confirmPassword")}
                label="Confirm Password"
                placeholder="Confirm your password"
                startContent={<Lock className="w-4 h-4 text-gray-400" />}
                endContent={
                  <>
                    {confirmPassword && !errors.confirmPassword ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : null}
                    <button
                      className="focus:outline-none ml-2"
                      type="button"
                      onClick={toggleConfirmVisibility}
                    >
                      {isConfirmVisible ? (
                        <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </>
                }
                type={isConfirmVisible ? "text" : "password"}
                isInvalid={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword?.message}
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
                {isLoading ? "Creating Account..." : "Create Account"}
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
                <GoogleOAuthButton mode="signup" />
              </div>

              <div className="relative mt-6">
                <Separator className="my-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-3 text-sm text-gray-500">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="text-center mt-4">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="text-pink-600 hover:text-pink-700 font-medium"
                  >
                    Sign in instead
                  </Button>
                </Link>
              </div>
            </div>
          </Card.Content>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            By creating an account, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}