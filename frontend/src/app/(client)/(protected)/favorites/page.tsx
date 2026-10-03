"use client";
import { useMemo } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import Link from "next/link";
import {
    Card, CardBody, CardHeader, Button, Chip, Avatar, Divider, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip
} from "@heroui/react";
import { Heart, Eye, Star, Search, Sparkles, User, ArrowLeft, Filter, Copy, Trash2, ExternalLink } from "lucide-react";
import { useRegularAuth } from "@/context/RegularAuthContext";
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { getImageUrl } from '@/services/image-service';

interface Biodata {
    id: number;
    fullName: string;
    profilePicture?: string;
    age: number;
    biodataType: string;
    profession: string;
    presentCountry?: string;
    presentDivision?: string;
    presentZilla?: string;
    presentArea?: string;
    maritalStatus: string;
    height: string;
    complexion?: string;
    religion?: string;
    educationMedium?: string;
    highestEducation?: string;
    dateAdded?: string;
}

// API response types
export default function FavoritesPage() {
    const { user, isAuthenticated } = useRegularAuth();
    // Shared, cached favorites list (same data the search and profile pages use)
    const { favorites: favoriteItems, loading, error: favoritesError, removeFromFavorites } = useFavorites();
    const error = favoritesError ? 'Failed to load your favorite profiles' : null;

    // Shape the API items for the cards below
    const favorites: Biodata[] = useMemo(() => {
        return favoriteItems.map((fav) => ({
            id: fav.biodata.id,
            fullName: fav.biodata.fullName || "Unknown User",
            profilePicture: fav.biodata.profilePicture ?? undefined,
            age: fav.biodata.age || 0,
            biodataType: fav.biodata.biodataType || "Unknown",
            profession: fav.biodata.profession || "Unknown",
            presentDivision: fav.biodata.presentDivision,
            presentZilla: fav.biodata.presentZilla,
            presentCountry: fav.biodata.presentCountry,
            presentArea: fav.biodata.presentArea,
            maritalStatus: fav.biodata.maritalStatus || "Unknown",
            height: fav.biodata.height || "Unknown",
            complexion: fav.biodata.complexion,
            religion: fav.biodata.religion,
            educationMedium: fav.biodata.educationMedium,
            highestEducation: fav.biodata.highestEducation,
            dateAdded: fav.createdAt
        }));
    }, [favoriteItems]);

    const removeFavorite = async (id: number) => {
        if (!isAuthenticated || !user) return;

        try {
            await removeFromFavorites(id);
        } catch (error) {
            const appError = handleApiError(error, 'FavoritesPage');
            logger.error('Error removing from favorites', appError, 'FavoritesPage');
            // You can add a toast notification here
        }
    };

    const copyBiodataLink = async (id: number) => {
        const link = `${window.location.origin}/profile/biodatas/${id}`;
        try {
            await navigator.clipboard.writeText(link);
            // You can add a toast notification here
            logger.debug('Link copied to clipboard', undefined, 'FavoritesPage');
        } catch (err) {
            const appError = handleApiError(err, 'FavoritesPage');
            logger.error('Failed to copy link', appError, 'FavoritesPage');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-4 mb-6">
                            <Button
                                as={Link}
                                href="/dashboard"
                                variant="ghost"
                                size="sm"
                                startContent={<ArrowLeft className="h-4 w-4" />}
                                className="text-slate-600 hover:text-slate-800"
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-4 leading-tight">
                            Your Favorites
                        </h1>
                        <p className="text-slate-600 text-xl leading-relaxed">Profiles you&apos;ve saved for later</p>
                    </div>

                    {/* Loading State */}
                    <div className="text-center py-20">
                        <div className="relative">
                            <div className="w-16 h-16 mx-auto mb-6 relative">
                                <div className="absolute inset-0 rounded-full border-4 border-rose-200"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Heart className="h-5 w-5 text-rose-500 animate-pulse" />
                                <h2 className="text-xl font-semibold text-gray-800">Loading Your Favorites</h2>
                                <Heart className="h-5 w-5 text-rose-500 animate-pulse" />
                            </div>
                            <p className="text-gray-600 animate-pulse">Gathering your saved profiles...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-20">
                        <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                            <CardBody className="text-center p-8">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
                                <p className="text-red-600 mb-6">{error}</p>
                                <Button
                                    color="primary"
                                    onPress={() => window.location.reload()}
                                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                                >
                                    Try Again
                                </Button>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            as={Link}
                            href="/dashboard"
                            variant="ghost"
                            size="sm"
                            startContent={<ArrowLeft className="h-4 w-4" />}
                            className="text-slate-600 hover:text-slate-800"
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-4 leading-tight">
                            Your Favorites
                        </h1>
                        <p className="text-slate-600 text-xl leading-relaxed">
                            {favorites.length} profile{favorites.length !== 1 ? 's' : ''} saved for later
                        </p>
                    </div>
                </div>

                {/* Favorites List Table */}
                {favorites.length > 0 ? (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <Table
                                    aria-label="Favorites table"
                                    className="min-h-[400px]"
                                    removeWrapper
                                >
                                    <TableHeader>
                                        <TableColumn className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-center">
                                            SL
                                        </TableColumn>
                                        <TableColumn className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold">
                                            PROFILE
                                        </TableColumn>
                                        <TableColumn className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-center">
                                            BIODATA NO.
                                        </TableColumn>
                                        <TableColumn className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-center">
                                            DATE ADDED
                                        </TableColumn>
                                        <TableColumn className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-center sticky right-0 z-10">
                                            ACTIONS
                                        </TableColumn>
                                    </TableHeader>
                                <TableBody>
                                    {favorites.map((biodata, index) => (
                                        <TableRow key={biodata.id} className="hover:bg-rose-50/50 transition-colors">
                                            <TableCell className="text-center font-semibold text-slate-700">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={biodata.profilePicture ?
                                                            getImageUrl(biodata.profilePicture) :
                                                            (biodata.biodataType === "Male" ? "/icons/male.png" : "/icons/female.png")}
                                                        name={biodata.fullName}
                                                        size="md"
                                                        className="border-2 border-rose-200"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{biodata.fullName}</p>
                                                        <p className="text-sm text-slate-600">{biodata.profession}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Chip
                                                    color={biodata.biodataType?.toLowerCase() === "male" ? "primary" : "secondary"}
                                                    variant="flat"
                                                    size="sm"
                                                    className="font-bold"
                                                >
                                                    {biodata.id}
                                                </Chip>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <p className="text-sm text-slate-600">
                                                    {biodata.dateAdded ? new Date(biodata.dateAdded).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="sticky right-0 z-10 bg-white/90 backdrop-blur-sm">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Tooltip content="View Profile" placement="top">
                                                        <Button
                                                            as={Link}
                                                            href={`/profile/biodatas/${biodata.id}`}
                                                            isIconOnly
                                                            size="sm"
                                                            variant="flat"
                                                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip content="Copy Profile Link" placement="top">
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="flat"
                                                            onPress={() => copyBiodataLink(biodata.id)}
                                                            className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip content="Remove from Favorites" placement="top">
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="flat"
                                                            onPress={() => removeFavorite(biodata.id)}
                                                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        </CardBody>
                    </Card>
                ) : favorites.length === 0 ? (
                    /* Empty State */
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                        <CardBody className="text-center py-16">
                            <div className="relative">
                                {/* Decorative background */}
                                <div className="absolute inset-0 opacity-5">
                                    <div className="absolute top-4 left-4 text-4xl">💕</div>
                                    <div className="absolute top-8 right-8 text-3xl">✨</div>
                                    <div className="absolute bottom-4 left-8 text-3xl">💑</div>
                                    <div className="absolute bottom-8 right-4 text-4xl">🌟</div>
                                </div>

                                <div className="relative z-10">
                                    <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                        <Heart className="h-12 w-12 text-rose-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Favorites Yet</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                                        Start exploring profiles and save the ones you like. Your favorite profiles will appear here for easy access.
                                    </p>
                                    <Button
                                        as={Link}
                                        href="/search"
                                        className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                        size="lg"
                                        startContent={<Search className="h-5 w-5" />}
                                    >
                                        Explore Profiles
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ) : (
                    /* No Search Results */
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                        <CardBody className="text-center py-16">
                            <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Search className="h-12 w-12 text-rose-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Results Found</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                                No favorites match your search criteria. Try adjusting your search terms.
                            </p>
                            <Button
                                as={Link}
                                href="/search"
                                variant="flat"
                                className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200"
                                startContent={<Search className="h-4 w-4" />}
                            >
                                Explore Profiles
                            </Button>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
}