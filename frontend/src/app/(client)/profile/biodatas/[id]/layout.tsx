import { Metadata } from 'next';

interface ProfileLayoutProps {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}

async function getProfile(id: string) {
    try {
        // Server-side fetch: inside Docker the public URL (localhost:3001) isn't reachable,
        // so prefer the internal service URL when one is configured
        const apiBase = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(`${apiBase}/api/biodatas/${id}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            // Add cache revalidation for better performance
            next: { revalidate: 300 } // 5 minutes
        });

        if (!response.ok) {
            return null;
        }

        const responseText = await response.text();
        if (!responseText.trim()) {
            return null;
        }

        return JSON.parse(responseText);
    } catch (error) {
        console.error('Error fetching profile for metadata:', error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const profile = await getProfile(id);

    if (!profile) {
        return {
            title: 'Profile Not Found',
            description: 'The requested biodata profile could not be found.',
        };
    }

    console.log('Generating metadata for profile:', profile.id, profile.fullName);

    // Determine gender-specific default image
    const getDefaultImage = () => {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mawami.com';

        const isMale = profile.biodataType?.toLowerCase() === 'male' ||
            profile.biodataType?.toLowerCase() === 'groom';
        const isFemale = profile.biodataType?.toLowerCase() === 'female' ||
            profile.biodataType?.toLowerCase() === 'bride';

        // Only use the photo when the owner made it public (it ends up in link previews)
        if (profile.profilePicture && profile.profilePictureVisible) {
            // If it's a relative URL, make it absolute
            if (profile.profilePicture.startsWith('/')) {
                return `${baseUrl}${profile.profilePicture}`;
            }
            return profile.profilePicture;
        }

        if (isMale) return `${baseUrl}/icons/male.png`;
        if (isFemale) return `${baseUrl}/icons/female.png`;
        return `${baseUrl}/default-profile.svg`; // fallback
    };

    const title = `${profile.fullName || 'Biodata Profile'} - BD${id}`;
    const description = `${profile.age} years • ${profile.height} • ${profile.profession} • ${profile.maritalStatus} • ${profile.religion} • ${profile.presentDivision}, ${profile.presentCountry}`;
    const imageUrl = getDefaultImage();
    const currentUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://mawami.com'}/profile/biodatas/${id}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                }
            ],
            url: currentUrl,
            type: 'profile',
            siteName: 'Mawami - Matrimony Platform',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
        other: {
            'profile:first_name': profile.fullName?.split(' ')[0] || '',
            'profile:last_name': profile.fullName?.split(' ').slice(1).join(' ') || '',
            'profile:gender': profile.biodataType || '',
        }
    };
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
    return <>{children}</>;
}