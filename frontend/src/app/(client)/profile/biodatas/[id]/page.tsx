"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  User, Heart, GraduationCap, Briefcase, MapPin, Users, Phone, Mail, Calendar, Ruler, Weight, Droplets, Shield,
  Home, AlertCircle, RefreshCw, Star, Share2, MessageCircle, Sparkles, Edit, Plus, ArrowLeft, Search, Lock
} from "lucide-react";
import { Card, CardBody, CardHeader, Button, Chip, addToast } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRegularAuth } from "@/context/RegularAuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useProfileView } from "@/hooks/useProfileView";
import { BiodataProfile, BiodataApprovalStatus, BiodataVisibilityStatus } from "@/types/biodata";
import { BiodataStatusHandler } from "@/components/biodata/BiodataStatusHandler";
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { resolveImageUrl } from '@/services/image-service';
import FacebookShareModal from '@/components/profile/FacebookShareModal';

// Helper function to safely display data or fallback
const safeDisplay = (value: unknown, fallback: string = "Not provided"): string => {
  if (value === null || value === undefined || value === "" || value === "null") {
    return fallback;
  }
  return String(value);
};

// Helper function to format date safely
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "Invalid date";
  }
};



export default function Profile() {
  const [profile, setProfile] = useState<BiodataProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavoriteProfile, setIsFavoriteProfile] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [userHasBiodata, setUserHasBiodata] = useState(false);
  const [checkingUserBiodata, setCheckingUserBiodata] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const params = useParams();
  const router = useRouter();
  const biodataId = params.id as string;
  const { user, isAuthenticated } = useRegularAuth();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { trackProfileView } = useProfileView();

  // Check if the current user can edit this profile
  const canEditProfile = useMemo(() => {
    if (!isAuthenticated || !user || !profile) return false;
    // User can edit if they own this profile (userId matches)
    return profile.userId === user.id;
  }, [isAuthenticated, user, profile]);

  const fetchProfile = useCallback(async () => {
    if (!biodataId) return;

    try {
      setError(null);
      setLoading(true);

      // Try to fetch as owner first (if authenticated), then fall back to public
      let response;
      const token = localStorage.getItem('regular_user_access_token');

      if (token && isAuthenticated) {
        // Try owner endpoint first (user can always see their own biodata)
        try {
          response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/biodatas/owner/${biodataId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            }
          });

          // If owner endpoint fails (not owner), fall back to public endpoint
          if (!response.ok && response.status !== 403) {
            throw new Error('Owner fetch failed');
          }
        } catch (ownerError) {
          // Fall back to public endpoint
          response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/biodatas/${biodataId}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
      } else {
        // Not authenticated, use public endpoint
        response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/biodatas/${biodataId}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      if (!response.ok) {
        if (response.status === 404) {
          setError("Profile not found. This biodata may not exist or has been removed.");
        } else if (response.status === 500) {
          setError("Server error occurred. Please try again later.");
        } else if (response.status === 403) {
          setError("Access denied. You may not have permission to view this profile.");
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          setError(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }
        return;
      }

      // Get response text first
      const responseText = await response.text();

      if (!responseText.trim()) {
        // Empty response means no biodata exists - show create biodata section
        setProfile(null);
        return;
      }

      // Try to parse as JSON with better error handling
      try {
        const data = JSON.parse(responseText);

        // Check if data is null or empty (no biodata found)
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
          // No biodata found - show create biodata section
          setProfile(null);
          return;
        }

        // Validate that we received a valid biodata object
        if (typeof data !== 'object') {
          throw new Error('Invalid data format received');
        }

        setProfile(data);
      } catch (parseError) {
        // Check if it's an HTML error page
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          setError('Server configuration error. Please contact support.');
        } else if (responseText.includes('404') || responseText.includes('Not Found')) {
          // 404 in response text means no biodata - show create section
          setProfile(null);
        } else {
          setError('Invalid response format from server. Please try again later.');
        }
      }
    } catch (error) {
      const appError = handleApiError(error, 'Component');
      logger.error('Error fetching profile', appError, 'Page');
      setError(error instanceof Error ? error.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [biodataId]);

  // Check if the current user has their own biodata
  const checkUserBiodata = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setUserHasBiodata(false);
      setCheckingUserBiodata(false);
      return;
    }

    try {
      const token = localStorage.getItem('regular_user_access_token');
      if (!token) {
        setUserHasBiodata(false);
        setCheckingUserBiodata(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/biodatas/current`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const responseText = await response.text();
        // If we get a valid response with biodata, user has biodata
        if (responseText.trim() && !responseText.includes('404')) {
          try {
            const data = JSON.parse(responseText);
            setUserHasBiodata(data && typeof data === 'object' && Object.keys(data).length > 0);
          } catch {
            setUserHasBiodata(false);
          }
        } else {
          setUserHasBiodata(false);
        }
      } else {
        setUserHasBiodata(false);
      }
    } catch (error) {
      const appError = handleApiError(error, 'Component');
      logger.error('Error checking user biodata', appError, 'Page');
      setUserHasBiodata(false);
    } finally {
      setCheckingUserBiodata(false);
    }
  }, [isAuthenticated, user]);

  // Check if profile is in favorites when profile loads
  const checkFavoriteStatus = useCallback(async () => {
    if (!profile || !isAuthenticated || !user) return;

    try {
      const favoriteStatus = await isFavorite(profile.id);
      setIsFavoriteProfile(favoriteStatus);
    } catch (error) {
      const appError = handleApiError(error, 'Component');
      logger.error('Error checking favorite status', appError, 'Page');
    }
  }, [profile, isAuthenticated, user, isFavorite]);

  // Handle add/remove favorites
  const handleFavoriteToggle = async () => {
    if (!profile) return;

    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavoriteProfile) {
        const success = await removeFromFavorites(profile.id);
        if (success) {
          setIsFavoriteProfile(false);
        }
      } else {
        const success = await addToFavorites(profile.id);
        if (success) {
          setIsFavoriteProfile(true);
        }
      }
    } catch (error) {
      const appError = handleApiError(error, 'Component');
      logger.error('Error toggling favorite', appError, 'Page');
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Handle contact button click
  const handleContactClick = () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // Scroll to contact information section
    const contactSection = document.getElementById('contact-information');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Handle share button click - open Facebook share modal
  const handleShareClick = () => {
    setShowShareModal(true);
  };

  // Handle back to search button click
  const handleBackToSearch = () => {
    // Get the referring URL or search parameters from session storage
    const searchState = sessionStorage.getItem('searchState');

    if (searchState) {
      try {
        const { filters, hasSearched } = JSON.parse(searchState);

        // Build URL with search parameters to restore the search state
        const searchParams = new URLSearchParams();

        if (filters.gender && filters.gender !== 'all') {
          searchParams.append('gender', filters.gender);
        }
        if (filters.maritalStatus && filters.maritalStatus !== 'all') {
          searchParams.append('maritalStatus', filters.maritalStatus);
        }
        if (filters.location) {
          searchParams.append('location', filters.location);
        }
        if (filters.biodataNumber) {
          searchParams.append('biodataNumber', filters.biodataNumber);
        }
        if (hasSearched) {
          searchParams.append('searched', 'true');
        }

        const searchUrl = searchParams.toString() ? `/?${searchParams.toString()}` : '/';
        router.push(searchUrl);
      } catch (error) {
        // If there's an error parsing the search state, just go to home
        router.push('/');
      }
    } else {
      // No previous search state, go to home page
      router.push('/');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  useEffect(() => {
    checkUserBiodata();
  }, [checkUserBiodata]);

  // Track profile view when profile loads successfully
  useEffect(() => {
    if (profile && biodataId) {
      const trackView = async () => {
        try {
          await trackProfileView(parseInt(biodataId));
        } catch (error) {
          const appError = handleApiError(error, 'Component');
          logger.error('Failed to track profile view', appError, 'Page');
        }
      };

      trackView();
    }
  }, [profile, biodataId, trackProfileView]);

  const handleRetry = () => {
    setLoading(true);
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4 md:p-8">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="relative">
              {/* Animated loading spinner */}
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-rose-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
              </div>

              {/* Loading text with sparkle effect */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-rose-500 animate-pulse" />
                <h2 className="text-xl font-semibold text-gray-800">Loading Profile</h2>
                <Sparkles className="h-5 w-5 text-rose-500 animate-pulse" />
              </div>

              <p className="text-gray-600 animate-pulse">Preparing beautiful biodata for you...</p>

              {/* Skeleton cards preview */}
              <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 p-8">
        <div className="container max-w-6xl mx-auto space-y-8">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-left text-red-700">
                  {error}
                </div>
              </div>
            </div>
            <div className="mt-6 space-x-4">
              <Button onClick={handleRetry} variant="flat" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button variant="flat">
                <Link href="/profile/biodatas">
                  Back to All Profiles
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Users should always see their own biodata profile (no status handler for owners)
  // Status handler is only for non-owners viewing non-public biodatas

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4 md:p-8">
        <div className="container max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Create Your Biodata Profile
            </h1>
            <p className="text-gray-600 text-lg">
              Start your journey to find your perfect life partner
            </p>
          </div>

          {/* Main Content Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
            {/* Decorative Header */}
            <div className="relative bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 p-8">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-4 right-4 opacity-20">
                <Sparkles className="h-8 w-8 text-white animate-pulse" />
              </div>
              <div className="relative text-center text-white">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Biodata Profile Found</h2>
                <p className="text-white/90">
                  You haven&apos;t created your biodata profile yet
                </p>
              </div>
            </div>

            {/* Content Section */}
            <CardBody className="p-8">
              <div className="text-center space-y-6">
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Why Create a Biodata Profile?
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-rose-100 rounded-full flex items-center justify-center">
                        <Heart className="h-6 w-6 text-rose-500" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">Find Your Match</h4>
                      <p className="text-sm text-gray-600">Connect with compatible life partners</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-blue-500" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">Verified Profiles</h4>
                      <p className="text-sm text-gray-600">Join a trusted matrimony platform</p>
                    </div>
                    <div className="text-center p-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-500" />
                      </div>
                      <h4 className="font-semibold text-gray-800 mb-2">Large Community</h4>
                      <p className="text-sm text-gray-600">Access thousands of profiles</p>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="space-y-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"

                  >
                    <Link className="flex items-center" href="/profile/biodatas/edit/new">
                      <Plus className="h-5 w-5 mr-2" />
                      <span>Create Your Biodata Profile</span>
                    </Link>
                  </Button>

                  <div className="flex justify-center gap-4">
                    <Button variant="flat" >
                      <Link href="/profile/biodatas">
                        Browse All Profiles
                      </Link>
                    </Button>
                    <Button variant="flat" >
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
                    Your information is secure and will only be shared with verified members
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-2 md:p-4">
      <div className="container max-w-6xl mx-auto space-y-4">
        {/* Back to Search Button */}
        <div className="flex justify-center">
          <Button
            variant="solid"
            size="lg"
            className="flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            onPress={handleBackToSearch}
          >
            <div className="p-1 bg-white/20 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span>Back to Search Page</span>
          </Button>
        </div>

        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                Biodata Profile
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-600 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  ID: BD{biodataId}
                </p>
                {/* Show status badge for profile owner */}
                {canEditProfile && (
                  <Chip
                    size="sm"
                    variant="flat"
                    className={`capitalize ${profile.biodataApprovalStatus === 'approved'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : profile.biodataApprovalStatus === 'pending'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : profile.biodataApprovalStatus === 'rejected'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                  >
                    {profile.biodataApprovalStatus || 'pending'}
                  </Chip>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">

            {canEditProfile && (
              <Button
                variant="solid"
                size="sm"
                className="flex items-center gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all duration-200 hover:shadow-md"

              >
                <Link className="flex gap-3" href={`/profile/biodatas/edit/${biodataId}`}>
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            )}
            <Button
              variant="solid"
              size="sm"
              className={`flex items-center gap-2 transition-all duration-200 hover:shadow-md ${isFavoriteProfile
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
                }`}
              onPress={handleFavoriteToggle}
              isLoading={favoriteLoading}
              disabled={favoriteLoading}
            >
              <Heart className={`h-4 w-4 ${isFavoriteProfile ? 'fill-current' : ''}`} />
              {isFavoriteProfile ? 'Remove from Favorites' : 'Add to Favorites'}
            </Button>
            <Button
              variant="solid"
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 transition-all duration-300 hover:shadow-xl hover:scale-110 font-bold px-6 py-2 shadow-lg rounded-full"
              onPress={handleShareClick}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="bordered"
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0 transition-all duration-200 hover:shadow-lg hover:scale-105"
              onPress={handleContactClick}
            >
              <MessageCircle className="h-4 w-4" />
              Contact
            </Button>
          </div>
        </div>

        {/* Enhanced Profile Header Card */}
        <Card className="relative overflow-hidden border-0 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600"></div>
          <div className="absolute inset-0 bg-black/10"></div>

          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 opacity-20">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-20">
            <Heart className="h-6 w-6 text-white animate-pulse delay-1000" />
          </div>

          <CardBody className="relative p-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              {/* Enhanced Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-xl">
                  {(() => {
                    // Check if profile picture should be visible
                    const shouldShowPicture = profile.profilePictureVisible || 
                      (isAuthenticated && user && (
                        user.id === profile.userId || // Owner can always see their own picture
                        user.role === 'admin' // Admin can always see pictures
                      ));

                    if (!shouldShowPicture || !profile.profilePicture) {
                      return (
                        <div className="flex flex-col items-center justify-center text-white/80">
                          <User className="h-16 w-16 text-white" />
                          {!profile.profilePictureVisible && profile.profilePicture && (
                            <div className="flex items-center gap-1 mt-2">
                              <Lock className="h-3 w-3" />
                              <span className="text-xs">Private</span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    const { url, unoptimized } = resolveImageUrl(profile.profilePicture);
                    if (!url) {
                      return <User className="h-16 w-16 text-white" />;
                    }
                    return (
                      <Image
                        src={url || ''}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full rounded-full object-cover"
                        unoptimized={unoptimized}
                      />
                    );
                  })()}
                </div>
                {/* Online Status Indicator */}
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg"></div>
              </div>

              {/* Enhanced Profile Info */}
              <div className="flex-1 text-center md:text-left space-y-2 text-white">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">
                    {isAuthenticated && user && userHasBiodata
                      ? safeDisplay(profile.fullName, "Unknown User")
                      : ""
                    }
                  </h2>
                  <p className="text-xl text-white/90 font-medium">
                    {safeDisplay(profile.profession, "Professional")}
                  </p>
                </div>

                {/* Key Info Row */}
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-white/90">
                  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Calendar className="h-4 w-4" />
                    {profile.age || "N/A"} years old
                  </span>
                  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                    <MapPin className="h-4 w-4" />
                    {safeDisplay(profile.presentDivision)}, {safeDisplay(profile.presentCountry)}
                  </span>
                  <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Ruler className="h-4 w-4" />
                    {safeDisplay(profile.height)}
                  </span>
                </div>

                {/* Enhanced Badges */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <Chip className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors px-4 py-2 text-sm font-medium">
                    {safeDisplay(profile.biodataType)}
                  </Chip>
                  <Chip className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors px-4 py-2 text-sm font-medium">
                    {safeDisplay(profile.maritalStatus)}
                  </Chip>
                  <Chip className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors px-4 py-2 text-sm font-medium">
                    {safeDisplay(profile.religion)}
                  </Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Enhanced Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Personal Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Personal Information</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Date of Birth</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      {formatDate(profile.dateOfBirth)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Age</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.age)} years</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Height</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-green-500" />
                      {safeDisplay(profile.height)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Weight</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <Weight className="h-4 w-4 text-orange-500" />
                      {safeDisplay(profile.weight)} {profile.weight ? 'kg' : ''}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Complexion</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.complexion)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Blood Group</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-red-500" />
                      {safeDisplay(profile.bloodGroup)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Religion</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.religion)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Marital Status</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.maritalStatus)}</p>
                  </div>
                </div>
                {profile.healthIssues && safeDisplay(profile.healthIssues) !== "Not provided" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Health Information
                    </p>
                    <p className="text-gray-700">{safeDisplay(profile.healthIssues)}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>



          {/* Education */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Education Background</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Education Medium</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.educationMedium)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Highest Education</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.highestEducation)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Institute</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.instituteName)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Subject</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.subject)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Passing Year</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.passingYear)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Result</p>
                    <p className="text-base font-medium text-gray-800">{safeDisplay(profile.result)}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Professional Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Professional Details</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Profession</p>
                  <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-orange-500" />
                    {safeDisplay(profile.profession)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Economic Condition</p>
                  <p className="text-base font-medium text-gray-800">{safeDisplay(profile.economicCondition)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Permanent Address</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Area & Upazilla</p>
                  <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                    {safeDisplay(profile.permanentArea)}, {safeDisplay(profile.permanentUpazilla)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-semibold text-gray-600 mb-1">District & Division</p>
                  <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                    {safeDisplay(profile.permanentZilla)}, {safeDisplay(profile.permanentDivision)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Country</p>
                  <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                    {safeDisplay(profile.permanentCountry)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500 rounded-lg group-hover:scale-110 transition-transform">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Present Address</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {profile.sameAsPermanent ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <Home className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <p className="text-blue-800 font-medium text-lg">Same as permanent address</p>
                  <p className="text-blue-600 text-sm mt-1">Currently residing at permanent location</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Area & Upazilla</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-500" />
                      {safeDisplay(profile.presentArea)}, {safeDisplay(profile.presentUpazilla)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">District & Division</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-500" />
                      {safeDisplay(profile.presentZilla)}, {safeDisplay(profile.presentDivision)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Country</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-500" />
                      {safeDisplay(profile.presentCountry)}
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Enhanced Family Information */}
          <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Family Information</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {/* Parents Information */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                  <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    Parents Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Father&apos;s Name</p>
                      <div className="text-base font-medium text-gray-800">
                        {isAuthenticated && user && userHasBiodata
                          ? safeDisplay(profile.fatherName)
                          : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Lock className="h-4 w-4" />
                              <span className="text-sm">Login & create profile to view</span>
                            </div>
                          )
                        }
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Father&apos;s Profession</p>
                      <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                        {safeDisplay(profile.fatherProfession)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Father Status</p>
                      <div className="text-base font-medium text-gray-800 flex items-center gap-2">
                        {profile.fatherAlive === 'Yes' ? (
                          <>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-green-700">Alive</span>
                          </>
                        ) : profile.fatherAlive === 'No' ? (
                          <>
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-600">Deceased</span>
                          </>
                        ) : (
                          <span>{safeDisplay(profile.fatherAlive)}</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Mother&apos;s Name</p>
                      <div className="text-base font-medium text-gray-800">
                        {isAuthenticated && user && userHasBiodata
                          ? safeDisplay(profile.motherName)
                          : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <Lock className="h-4 w-4" />
                              <span className="text-sm">Login & create profile to view</span>
                            </div>
                          )
                        }
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Mother&apos;s Profession</p>
                      <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-pink-500" />
                        {safeDisplay(profile.motherProfession)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Mother Status</p>
                      <div className="text-base font-medium text-gray-800 flex items-center gap-2">
                        {profile.motherAlive === 'Yes' ? (
                          <>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-green-700">Alive</span>
                          </>
                        ) : profile.motherAlive === 'No' ? (
                          <>
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-600">Deceased</span>
                          </>
                        ) : (
                          <span>{safeDisplay(profile.motherAlive)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          {/* Enhanced Family Information */}
          <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Family Information</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {/* Siblings & Family Details */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                  <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    Siblings & Family
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-3 text-center hover:shadow-md transition-shadow">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {safeDisplay(profile.brothersCount, "0")}
                      </div>
                      <p className="text-sm font-semibold text-gray-600">Brothers</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center hover:shadow-md transition-shadow">
                      <div className="text-3xl font-bold text-pink-600 mb-1">
                        {safeDisplay(profile.sistersCount, "0")}
                      </div>
                      <p className="text-sm font-semibold text-gray-600">Sisters</p>
                    </div>
                  </div>

                  {profile.familyDetails && safeDisplay(profile.familyDetails) !== "Not provided" && (
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <Home className="h-4 w-4 text-purple-500" />
                        Family Details
                      </p>
                      <p className="text-gray-700 leading-relaxed">{safeDisplay(profile.familyDetails)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Partner Preferences</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {/* Basic Preferences */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-3 border border-rose-100">
                  <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-rose-500" />
                    Basic Preferences
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Age Range</p>
                      <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-rose-500" />
                        {safeDisplay(profile.partnerAgeMin)} - {safeDisplay(profile.partnerAgeMax)} years
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Complexion</p>
                      <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        {safeDisplay(profile.partnerComplexion)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Height Preference</p>
                      <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-green-500" />
                        {safeDisplay(profile.partnerHeight)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Education</p>
                      <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-500" />
                        {safeDisplay(profile.partnerEducation)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Enhanced Partner Preferences */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Partner Preferences</span>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {/* Professional & Location Preferences */}
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                  <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    Professional & Location
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Profession Preference</p>
                      <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                        {safeDisplay(profile.partnerProfession)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Location Preference</p>
                      <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-teal-500" />
                        {safeDisplay(profile.partnerLocation)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {profile.partnerDetails && safeDisplay(profile.partnerDetails) !== "Not provided" && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
                    <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Heart className="h-4 w-4 text-amber-500" />
                      Additional Preferences
                    </h4>
                    <div className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
                      <p className="text-gray-700 leading-relaxed">{safeDisplay(profile.partnerDetails)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
          {/* Contact Information */}
          <Card id="contact-information" className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-800">Contact Information</span>
                {!isAuthenticated && (
                  <div className="ml-auto">
                    <Shield className="h-5 w-5 text-amber-500" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardBody className="p-4">
              {checkingUserBiodata ? (
                // Loading state while checking if user has biodata
                <div className="text-center py-6">
                  <div className="w-8 h-8 mx-auto mb-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600">Checking access permissions...</p>
                </div>
              ) : isAuthenticated && user && userHasBiodata ? (
                // Show contact info only if user is logged in AND has their own biodata
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Email Address</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-500" />
                      <span className="break-all">{safeDisplay(profile.email, "Not provided")}</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Personal Mobile</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      {safeDisplay(profile.ownMobile)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Guardian Mobile</p>
                    <p className="text-base font-medium text-gray-800 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-purple-500" />
                      {safeDisplay(profile.guardianMobile)}
                    </p>
                  </div>
                </div>
              ) : isAuthenticated && user && !userHasBiodata ? (
                // User is logged in but doesn't have their own biodata
                <div className="text-center py-6">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Create Your Profile First
                    </h3>
                    <p className="text-gray-600 mb-6">
                      To view contact details of other members, you need to create your own biodata profile first. This ensures a fair exchange of information.
                    </p>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      onPress={() => router.push('/profile/biodatas/edit/new')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your Biodata
                    </Button>
                    <p className="text-xs text-gray-500 mt-3">
                      <Shield className="h-3 w-3 inline mr-1" />
                      Fair exchange policy - Create your profile to connect with others
                    </p>
                  </div>
                </div>
              ) : (
                // User is not logged in
                <div className="text-center py-6">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                      <Shield className="h-8 w-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Contact Information Protected
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Please log in and create your biodata profile to view contact details and connect with {safeDisplay(profile.fullName, "this person")}.
                    </p>
                    <div className="space-y-3">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        onPress={() => router.push('/auth/login')}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Login to Continue
                      </Button>
                      <p className="text-sm text-gray-500">
                        Don't have an account?{' '}
                        <button
                          onClick={() => router.push('/auth/signup')}
                          className="text-emerald-600 hover:text-emerald-700 font-medium underline"
                        >
                          Sign up here
                        </button>
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      <Shield className="h-3 w-3 inline mr-1" />
                      Your privacy is protected with us
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>


        {/* Call to Action Section */}
        <Card className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-4 right-4 opacity-20">
            <Sparkles className="h-12 w-12 text-white animate-pulse" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-20">
            <Heart className="h-8 w-8 text-white animate-pulse delay-1000" />
          </div>

          <CardBody className="relative p-4 text-center">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold">
                  Interested in this Profile?
                </h3>
                <p className="text-lg text-white/90">
                  Take the next step towards finding your perfect life partner. Connect with {safeDisplay(profile.fullName, "this person")} today!
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <Button
                  variant="solid"
                  size="lg"
                  className={`font-semibold px-8 py-3 rounded-full transition-all duration-300 hover:shadow-xl group ${isFavoriteProfile
                    ? 'bg-white text-rose-600 hover:bg-rose-50'
                    : 'border-white text-rose-600 hover:bg-white hover:text-rose-600 hover:border-rose-600'
                    }`}
                  onPress={handleFavoriteToggle}
                  isLoading={favoriteLoading}
                  disabled={favoriteLoading}
                >
                  <Heart className={`h-4 w-4 mr-2 group-hover:text-rose-600 transition-colors duration-300 ${isFavoriteProfile ? 'fill-current' : ''}`} />
                  {isFavoriteProfile ? 'Remove from Favorites' : 'Add to Favorites'}
                </Button>
                <Button
                  variant="solid"
                  size="lg"
                  className="bg-white text-rose-600 hover:bg-rose-50 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onPress={handleContactClick}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </div>

              <div className="flex justify-center items-center gap-6 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Verified Profile
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Premium Member
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Facebook Share Modal */}
      <FacebookShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        profile={profile}
        biodataId={biodataId}
      />
    </div>
  );
}
