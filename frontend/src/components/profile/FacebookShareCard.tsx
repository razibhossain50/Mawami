"use client";
import React, { useState } from 'react';
import { BiodataProfile } from '@/types/biodata';
import { resolveImageUrl } from '@/services/image-service';
import { Heart, Briefcase, Calendar, Ruler, Users, Copy, Share, Check } from 'lucide-react';
import Image from 'next/image';

interface FacebookShareCardProps {
  profile: BiodataProfile;
  biodataId: string;
}

const FacebookShareCard: React.FC<FacebookShareCardProps> = ({ profile, biodataId }) => {
  const [copied, setCopied] = useState(false);
  const { url: profileImageUrl, unoptimized } = resolveImageUrl(
    profile.profilePictureVisible ? profile.profilePicture : null
  );
  
  // Determine gender-specific default image
  const getDefaultImage = () => {
    if (profileImageUrl) return profileImageUrl;
    
    const isMale = profile.biodataType?.toLowerCase() === 'male' || 
                   profile.biodataType?.toLowerCase() === 'groom';
    const isFemale = profile.biodataType?.toLowerCase() === 'female' || 
                     profile.biodataType?.toLowerCase() === 'bride';
    
    if (isMale) return '/icons/male.png';
    if (isFemale) return '/icons/female.png';
    return '/default-profile.svg'; // fallback
  };

  const shareData = {
    title: `Biodata Profile - BD${biodataId}`,
    description: `${profile.age} years • ${profile.height} • ${profile.profession} • ${profile.maritalStatus} • ${profile.religion}`,
    image: getDefaultImage(),
    url: typeof window !== 'undefined' ? window.location.href : ''
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      // Temporary success indicator on the button
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  return (
    <div className=" mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 p-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative text-center text-white">
          <h3 className="text-lg font-bold mb-1">Biodata Profile</h3>
          <p className="text-sm opacity-90">ID: BD{biodataId}</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4">
        {/* Profile Picture and Basic Info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt="Profile"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized={unoptimized}
              />
            ) : (
              <Image
                src={getDefaultImage()}
                alt="Profile"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized={false}
              />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-lg">{profile.profession || 'Professional'}</h4>
            <p className="text-gray-600 text-sm">{profile.presentDivision}, {profile.presentCountry}</p>
          </div>
        </div>

        {/* Key Information Table */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center gap-1 text-gray-600 mb-1">
                <Calendar className="h-3 w-3" />
                <span className="font-medium">Age</span>
              </div>
              <p className="text-gray-800 font-semibold">{profile.age} years</p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center gap-1 text-gray-600 mb-1">
                <Ruler className="h-3 w-3" />
                <span className="font-medium">Height</span>
              </div>
              <p className="text-gray-800 font-semibold">{profile.height || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center gap-1 text-gray-600 mb-1">
                <Briefcase className="h-3 w-3" />
                <span className="font-medium">Profession</span>
              </div>
              <p className="text-gray-800 font-semibold text-xs">{profile.profession || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center gap-1 text-gray-600 mb-1">
                <span className="font-medium">Complexion</span>
              </div>
              <p className="text-gray-800 font-semibold text-xs">{profile.complexion || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center gap-1 text-gray-600 mb-1">
                <Heart className="h-3 w-3" />
                <span className="font-medium">Marital Status</span>
              </div>
              <p className="text-gray-800 font-semibold text-xs">{profile.maritalStatus || 'N/A'}</p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center gap-1 text-gray-600 mb-1">
                <Users className="h-3 w-3" />
                <span className="font-medium">Religion</span>
              </div>
              <p className="text-gray-800 font-semibold text-xs">{profile.religion || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="mt-4 space-y-2">
          {/* Highlighted Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className={`w-full px-6 py-3 text-white rounded-lg text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 border-2 border-white/20 cursor-pointer ${copied
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600'}`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Profile Link'}
          </button>
          
          {/* Facebook Share Button */}
          <button
            onClick={handleFacebookShare}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Share className="h-4 w-4" />
            Share on Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacebookShareCard;