"use client";
import Head from 'next/head';
import { BiodataProfile } from '@/types/biodata';
import { resolveImageUrl } from '@/services/image-service';

interface ProfileMetaTagsProps {
  profile: BiodataProfile;
  biodataId: string;
}

const ProfileMetaTags: React.FC<ProfileMetaTagsProps> = ({ profile, biodataId }) => {
  const { url: profileImageUrl } = resolveImageUrl(
    profile.profilePictureVisible ? profile.profilePicture : null
  );
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  
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
  
  const title = `Biodata Profile - BD${biodataId}`;
  const description = `${profile.age} years • ${profile.height} • ${profile.profession} • ${profile.maritalStatus} • ${profile.religion} • ${profile.presentDivision}, ${profile.presentCountry}`;
  const imageUrl = getDefaultImage();

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph Meta Tags for Facebook */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="profile" />
      <meta property="og:site_name" content="Matrimony Platform" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* Additional Profile-specific Meta Tags */}
      <meta property="profile:first_name" content={profile.fullName?.split(' ')[0] || ''} />
      <meta property="profile:last_name" content={profile.fullName?.split(' ').slice(1).join(' ') || ''} />
      <meta property="profile:gender" content={profile.biodataType} />
      
      {/* Structured Data for Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": profile.fullName || "Profile User",
            "jobTitle": profile.profession,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": profile.presentDivision,
              "addressCountry": profile.presentCountry
            },
            "image": imageUrl,
            "url": currentUrl,
            "description": description
          })
        }}
      />
    </Head>
  );
};

export default ProfileMetaTags;