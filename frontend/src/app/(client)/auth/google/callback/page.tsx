"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRegularAuth } from '@/context/RegularAuthContext';
import { Card, Spinner } from "@heroui/react";
import { CheckCircle, XCircle } from 'lucide-react';
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUserFromGoogle } = useRegularAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Google authentication...');
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Prevent multiple executions
    if (processed) return;

    const handleCallback = async () => {
      try {
        setProcessed(true);
        
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');

        if (!token || !userParam) {
          throw new Error('Missing authentication data');
        }

        const user = JSON.parse(decodeURIComponent(userParam));

        // Store the authentication data
        localStorage.setItem('regular_user_access_token', token);
        localStorage.setItem('regular_user', JSON.stringify(user));

        // Update the auth context
        if (setUserFromGoogle) {
          setUserFromGoogle(user);
        }

        setStatus('success');
        setMessage('Successfully signed in with Google!');

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        const appError = handleApiError(error, 'Component');
            logger.error('Google auth callback error', appError, 'Page');
        setStatus('error');
        setMessage('Failed to complete Google authentication. Please try again.');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, setUserFromGoogle, processed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-md">
        <Card.Content className="p-8 text-center">
          <div className="space-y-4">
            {status === 'loading' && (
              <>
                <Spinner size="lg" color="accent" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Completing Sign In
                </h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-green-800">
                  Success!
                </h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">
                  Redirecting to your dashboard...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-red-800">
                  Authentication Failed
                </h2>
                <p className="text-gray-600">{message}</p>
                <p className="text-sm text-gray-500">
                  Redirecting to login page...
                </p>
              </>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-md">
          <Card.Content className="p-8 text-center">
            <div className="space-y-4">
              <Spinner size="lg" color="accent" />
              <h2 className="text-xl font-semibold text-gray-800">
                Loading...
              </h2>
              <p className="text-gray-600">Processing authentication...</p>
            </div>
          </Card.Content>
        </Card>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}