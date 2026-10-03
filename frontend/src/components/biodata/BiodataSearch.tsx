"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    Card, CardBody, CardHeader, Button, Select, SelectItem, Input, Chip,
    Pagination, Avatar, Divider
} from "@heroui/react";
import { Search, User, Eye, Heart, Sparkles, Star } from "lucide-react";
import { LocationSelector } from "@/components/form/LocationSelector";
import { useFavorites } from "@/hooks/useFavorites";
import { useRegularAuth } from "@/context/RegularAuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { logger } from "@/services/logger";
import { publicApi } from "@/services/api-client";
import { handleApiError } from "@/services/error-handler";
import { getImageUrl } from "@/services/image-service";

interface Biodata {
    id: number;
    fullName: string;
    profilePicture?: string;
    profilePictureVisible?: boolean;
    age: number;
    biodataType: string;
    profession: string;
    presentCountry?: string;
    presentDivision?: string;
    presentZilla?: string;
    presentArea?: string;
    permanentArea?: string;
    permanentZilla?: string;
    presentUpazilla?: string;
    permanentUpazilla?: string;
    permanentDivision?: string;
    maritalStatus: string;
    height: string;
    complexion?: string;
    religion?: string;
    educationMedium?: string;
    highestEducation?: string;
}

export const BiodataSearch = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Search state is restored from the URL once, on first render
    const [initialFilters] = useState(() => ({
        gender: searchParams.get('gender') || "",
        maritalStatus: searchParams.get('maritalStatus') || "",
        location: searchParams.get('location') || "",
        biodataNumber: searchParams.get('biodataNumber') || ""
    }));
    const restoredSearch = searchParams.get('searched') === 'true' || Object.values(initialFilters).some(Boolean);

    const [selectedGender, setSelectedGender] = useState<string>(initialFilters.gender);
    const [selectedMaritalStatus, setSelectedMaritalStatus] = useState<string>(initialFilters.maritalStatus);
    const [selectedLocation, setSelectedLocation] = useState<string>(initialFilters.location);
    const [biodataNumber, setBiodataNumber] = useState<string>(initialFilters.biodataNumber);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasSearched, setHasSearched] = useState(restoredSearch);
    const [favoriteLoading, setFavoriteLoading] = useState<{ [key: number]: boolean }>({});

    // The search filters that were used for the current results
    const [searchFilters, setSearchFilters] = useState(initialFilters);

    // Add hooks for authentication and favorites
    const { user, isAuthenticated } = useRegularAuth();
    // Favorite state comes from the shared, cached favorites list (no per-card requests)
    const { addToFavorites, removeFromFavorites, favoriteIds } = useFavorites();

    const itemsPerPage = 12;

    // All public biodatas, fetched once a search has been run (including one restored from the URL)
    const {
        data: biodatas = [],
        isFetching: loading,
        error: fetchError,
        refetch,
    } = useQuery({
        queryKey: ['public-biodatas'],
        enabled: hasSearched,
        queryFn: async (): Promise<Biodata[]> => {
            const data = await publicApi.get<Biodata[] | Biodata>('/biodatas');
            return Array.isArray(data) ? data : [data];
        },
    });
    const error = fetchError instanceof Error ? fetchError.message : null;

    // Filter and search logic - only filters when search has been performed
    const filteredBiodatas = useMemo(() => {
        if (!hasSearched) return [];

        logger.debug('Filtering biodatas', {
            totalBiodatas: biodatas.length,
            activeFilters: searchFilters
        }, 'BiodataSearch');

        const filtered = biodatas.filter(biodata => {
            // Gender filter - use the search filters, not current form state
            const matchesGender = !searchFilters.gender || searchFilters.gender === "" || searchFilters.gender === "all" ||
                biodata.biodataType?.toLowerCase() === searchFilters.gender.toLowerCase();

            // Marital status filter - use the search filters, not current form state
            const matchesMaritalStatus = !searchFilters.maritalStatus || searchFilters.maritalStatus === "" || searchFilters.maritalStatus === "all" ||
                biodata.maritalStatus?.toLowerCase() === searchFilters.maritalStatus.toLowerCase();

            // Location filter - use the search filters, not current form state
            const matchesLocation = (() => {
                if (!searchFilters.location || searchFilters.location === '') {
                    logger.debug('Location filter: No location filter applied', undefined, 'BiodataSearch');
                    return true; // No location filter applied
                }

                // Parse the hierarchical location string (e.g., "Bangladesh > Dhaka > All Districts")
                const locationParts = searchFilters.location.split(' > ').map(part => part.trim());

                logger.debug('Location filter debug', {
                    searchLocation: searchFilters.location,
                    locationParts: locationParts,
                    biodataId: biodata.id,
                    biodataLocation: {
                        presentDivision: biodata.presentDivision,
                        permanentDivision: biodata.permanentDivision,
                        presentZilla: biodata.presentZilla,
                        permanentZilla: biodata.permanentZilla,
                        presentUpazilla: biodata.presentUpazilla,
                        permanentUpazilla: biodata.permanentUpazilla,
                        presentArea: biodata.presentArea,
                        permanentArea: biodata.permanentArea
                    }
                });

                // If "All Divisions" is selected, show all biodatas from Bangladesh
                if (locationParts.includes('All Divisions')) {
                    logger.debug('All Divisions selected - showing all biodatas', undefined, 'BiodataSearch');
                    return true; // Show all biodatas when "All Divisions" is selected
                }

                // If "All Districts" is selected, match by division
                if (locationParts.includes('All Districts') && locationParts.length >= 2) {
                    const selectedDivision = locationParts[1]; // Second part is division name
                    const divisionMatch = biodata.presentDivision?.toLowerCase().includes(selectedDivision.toLowerCase()) ||
                        biodata.permanentDivision?.toLowerCase().includes(selectedDivision.toLowerCase());

                    logger.debug(`All Districts for division "${selectedDivision}"`, {
                        match: divisionMatch,
                        presentDivision: biodata.presentDivision,
                        permanentDivision: biodata.permanentDivision
                    });

                    return divisionMatch;
                }

                // If "All Upazilas" is selected, match by district
                if (locationParts.includes('All Upazilas') && locationParts.length >= 3) {
                    const selectedDistrict = locationParts[2]; // Third part is district name
                    const districtMatch = biodata.presentZilla?.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
                        biodata.permanentZilla?.toLowerCase().includes(selectedDistrict.toLowerCase());

                    logger.debug(`All Upazilas for district "${selectedDistrict}"`, {
                        match: districtMatch,
                        presentZilla: biodata.presentZilla,
                        permanentZilla: biodata.permanentZilla
                    });

                    return districtMatch;
                }

                // For specific upazila/area selections, be more precise
                if (locationParts.length >= 4) {
                    const selectedDivision = locationParts[1];
                    const selectedDistrict = locationParts[2];
                    const selectedUpazila = locationParts[3];

                    // Check if biodata matches the hierarchical selection
                    const divisionMatch = biodata.presentDivision?.toLowerCase().includes(selectedDivision.toLowerCase()) ||
                        biodata.permanentDivision?.toLowerCase().includes(selectedDivision.toLowerCase());

                    const districtMatch = biodata.presentZilla?.toLowerCase().includes(selectedDistrict.toLowerCase()) ||
                        biodata.permanentZilla?.toLowerCase().includes(selectedDistrict.toLowerCase());

                    const upazilaMatch = biodata.presentUpazilla?.toLowerCase().includes(selectedUpazila.toLowerCase()) ||
                        biodata.permanentUpazilla?.toLowerCase().includes(selectedUpazila.toLowerCase()) ||
                        biodata.presentArea?.toLowerCase().includes(selectedUpazila.toLowerCase()) ||
                        biodata.permanentArea?.toLowerCase().includes(selectedUpazila.toLowerCase());

                    const hierarchicalMatch = divisionMatch && districtMatch && upazilaMatch;

                    logger.debug(`Specific location "${selectedUpazila}" in "${selectedDistrict}", "${selectedDivision}"`, {
                        hierarchicalMatch,
                        divisionMatch,
                        districtMatch,
                        upazilaMatch,
                        selectedDivision,
                        selectedDistrict,
                        selectedUpazila
                    });

                    return hierarchicalMatch;
                }

                // For less specific selections (3 parts or less), do broader matching
                const searchTerm = searchFilters.location.toLowerCase();
                const broadMatch = biodata.presentArea?.toLowerCase().includes(searchTerm) ||
                    biodata.permanentArea?.toLowerCase().includes(searchTerm) ||
                    biodata.presentZilla?.toLowerCase().includes(searchTerm) ||
                    biodata.permanentZilla?.toLowerCase().includes(searchTerm) ||
                    biodata.presentUpazilla?.toLowerCase().includes(searchTerm) ||
                    biodata.permanentUpazilla?.toLowerCase().includes(searchTerm) ||
                    biodata.presentDivision?.toLowerCase().includes(searchTerm) ||
                    biodata.permanentDivision?.toLowerCase().includes(searchTerm) ||
                    // Also check individual parts of the hierarchical selection
                    locationParts.some(part =>
                        part !== 'Bangladesh' && // Skip country name
                        (biodata.presentArea?.toLowerCase().includes(part.toLowerCase()) ||
                            biodata.permanentArea?.toLowerCase().includes(part.toLowerCase()) ||
                            biodata.presentZilla?.toLowerCase().includes(part.toLowerCase()) ||
                            biodata.permanentZilla?.toLowerCase().includes(part.toLowerCase()) ||
                            biodata.presentUpazilla?.toLowerCase().includes(part.toLowerCase()) ||
                            biodata.permanentUpazilla?.toLowerCase().includes(part.toLowerCase()) ||
                            biodata.presentDivision?.toLowerCase().includes(part.toLowerCase()) ||
                            biodata.permanentDivision?.toLowerCase().includes(part.toLowerCase()))
                    );

                logger.debug('Broad location match', {
                    match: broadMatch,
                    searchTerm,
                    locationParts: locationParts.filter(part => part !== 'Bangladesh')
                });

                return broadMatch;
            })();

            // Biodata number filter - use the search filters, not current form state
            const matchesBiodataNumber = !searchFilters.biodataNumber || searchFilters.biodataNumber === '' ||
                biodata.id.toString() === searchFilters.biodataNumber.trim().replace(/^BD/i, '');

            const finalMatch = matchesGender && matchesMaritalStatus && matchesLocation && matchesBiodataNumber;

            logger.debug(`Biodata ${biodata.id} filter results`, {
                gender: matchesGender,
                maritalStatus: matchesMaritalStatus,
                location: matchesLocation,
                biodataNumber: matchesBiodataNumber,
                finalMatch: finalMatch
            });

            return finalMatch;
        });

        logger.info('Filtering complete', {
            totalBiodatas: biodatas.length,
            filteredCount: filtered.length,
            filterEfficiency: `${((filtered.length / biodatas.length) * 100).toFixed(1)}%`
        });

        return filtered;
    }, [biodatas, searchFilters, hasSearched]);

    // Pagination logic
    const totalPages = Math.ceil(filteredBiodatas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentBiodatas = filteredBiodatas.slice(startIndex, endIndex);


    // Handle favorite toggle with backend integration
    const handleFavoriteToggle = async (biodataId: number) => {
        if (!isAuthenticated || !user) {
            router.push('/auth/login');
            return;
        }

        try {
            setFavoriteLoading(prev => ({ ...prev, [biodataId]: true }));
            if (favoriteIds.has(biodataId)) {
                await removeFromFavorites(biodataId);
            } else {
                await addToFavorites(biodataId);
            }
        } catch (error) {
            const appError = handleApiError(error, 'BiodataSearch');
            logger.error('Error toggling favorite', appError, 'BiodataSearch');
        } finally {
            setFavoriteLoading(prev => ({ ...prev, [biodataId]: false }));
        }
    };

    const handleSearch = async () => {
        // Prevent multiple simultaneous searches
        if (loading) {
            logger.debug('Search already in progress, ignoring duplicate request', undefined, 'BiodataSearch');
            return;
        }

        // Capture current form values as search filters
        const filters = {
            gender: selectedGender,
            maritalStatus: selectedMaritalStatus,
            location: selectedLocation,
            biodataNumber: biodataNumber
        };

        logger.info('Biodata search started', {
            filters,
            locationDetails: {
                rawLocation: selectedLocation,
                locationParts: selectedLocation ? selectedLocation.split(' > ').map(part => part.trim()) : [],
                hasAllDivisions: selectedLocation?.includes('All Divisions'),
                hasAllDistricts: selectedLocation?.includes('All Districts'),
                hasAllUpazilas: selectedLocation?.includes('All Upazilas')
            }
        }, 'BiodataSearch');

        setSearchFilters(filters);
        setHasSearched(true);
        setCurrentPage(1);
        
        // Update URL with search parameters
        const searchParams = new URLSearchParams();
        
        if (filters.gender && filters.gender !== '' && filters.gender !== 'all' && filters.gender !== 'All') {
            searchParams.append('gender', filters.gender);
        }
        if (filters.maritalStatus && filters.maritalStatus !== '' && filters.maritalStatus !== 'all' && filters.maritalStatus !== 'All') {
            searchParams.append('maritalStatus', filters.maritalStatus);
        }
        if (filters.location && filters.location !== '') {
            searchParams.append('location', filters.location);
        }
        if (filters.biodataNumber && filters.biodataNumber !== '') {
            searchParams.append('biodataNumber', filters.biodataNumber);
        }
        searchParams.append('searched', 'true');
        
        // Update URL without page reload
        const newUrl = searchParams.toString() ? `/?${searchParams.toString()}` : '/';
        window.history.pushState({}, '', newUrl);
        
        // Save search state to sessionStorage so we can restore it when user returns from profile view
        try {
            const searchState = {
                filters,
                hasSearched: true,
                timestamp: Date.now()
            };
            sessionStorage.setItem('searchState', JSON.stringify(searchState));
        } catch (error) {
            logger.warn('Failed to save search state to sessionStorage', error as any, 'BiodataSearch');
        }
        
        // First search enables the query; later searches refresh the list
        if (hasSearched) {
            await refetch();
        }
    };


    return (
        <div className="space-y-4 md:space-y-8 pt-20 bg-gradient-to-b from-purple-50 via-pink-100 to-purple-100 bg-[url('/images/hero-bg.png')] bg-no-repeat bg-center bg-cover bg-blend-overlay min-h-screen">
            <div className="container max-w-7xl mx-auto py-12 md:py-24 px-4 space-y-4 md:space-y-8">
                {/* Enhanced Header */}
                <div className="text-center space-y-5 pb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                        <div className="flex items-center justify-center gap-2">
                            <Sparkles className="h-6 w-6 text-rose-500" aria-hidden="true" />
                            <div className=" text-gray-800">Mawami</div>
                            <Sparkles className="h-6 w-6 text-rose-500" aria-hidden="true" />
                        </div>
                    </h1>
                    <p className="text-gray-600 text-2xl">&quot;Craft your love story with someone who complements your soul and spirit&quot;</p>
                </div>


                {/* Enhanced Search and Filters */}
                <Card className="overflow-visible w-full bg-white/95  border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardBody className="p-8 overflow-y-visible">
                        
                        
                        <div className="grid gap-6 md:grid-cols-4">
                            <div className="space-y-2">
                                <Select
                                    id="gender-select"
                                    label="I'm looking for"
                                    aria-label="Select gender preference"
                                    size="lg"
                                    placeholder="Select gender"
                                    selectedKeys={selectedGender ? new Set([selectedGender]) : new Set()}
                                    onSelectionChange={(keys) => {
                                        const newValue = Array.from(keys)[0] as string;
                                        setSelectedGender(newValue);
                                    }}
                                    className="w-full"
                                >
                                    <SelectItem key="all">All</SelectItem>
                                    <SelectItem key="Male">Male</SelectItem>
                                    <SelectItem key="Female">Female</SelectItem>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Select
                                    id="marital-status-select"
                                    label="Marital status"
                                    aria-label="Select marital status preference"
                                    size="lg"
                                    placeholder="Select marital status"
                                    selectedKeys={selectedMaritalStatus ? new Set([selectedMaritalStatus]) : new Set()}
                                    onSelectionChange={(keys) => {
                                        const newValue = Array.from(keys)[0] as string;
                                        setSelectedMaritalStatus(newValue);
                                    }}
                                    className="w-full"
                                >
                                    <SelectItem key="all">All</SelectItem>
                                    <SelectItem key="Unmarried">Unmarried</SelectItem>
                                    <SelectItem key="Married">Married</SelectItem>
                                    <SelectItem key="Divorced">Divorced</SelectItem>
                                    <SelectItem key="Widow">Widow</SelectItem>
                                    <SelectItem key="Widower">Widower</SelectItem>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <LocationSelector 
                                    id="location-select" 
                                    aria-label="Select location preference" 
                                    onLocationSelect={setSelectedLocation} 
                                    value={selectedLocation} 
                                />
                            </div>

                            <div className="space-y-2">
                                <Input
                                    id="biodata-number-input"
                                    label="Biodata Number"
                                    aria-label="Enter biodata number to search"
                                    size="lg"
                                    placeholder="Enter biodata number"
                                    value={biodataNumber}
                                    onChange={(e) => setBiodataNumber(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full mt-8 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                            size="lg"
                            onPress={handleSearch}
                            startContent={<Search className="h-5 w-5" />}
                            isLoading={loading}
                            isDisabled={loading}
                        >
                            {loading ? 'Searching...' : 'Find Your Partner'}
                        </Button>
                    </CardBody>
                </Card>

                {/* Enhanced Biodatas Grid */}
                {!hasSearched ? (
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
                                        <Search className="h-12 w-12 text-rose-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Find Your Perfect Match?</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                                        Use the filters above to search for your ideal partner. Set your preferences and click &quot;Find Your Partner&quot; to discover amazing profiles.
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ) : loading ? (
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-8 space-y-6">
                        {/* Loading Header */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Sparkles className="h-5 w-5 text-rose-500 animate-pulse" aria-hidden="true" />
                                <h2 className="text-xl font-semibold text-gray-800">Finding Perfect Matches</h2>
                                <Sparkles className="h-5 w-5 text-rose-500 animate-pulse" aria-hidden="true" />
                            </div>
                            <p className="text-gray-600 animate-pulse">Please wait while we search for your ideal partner...</p>
                        </div>

                        {/* Skeleton Cards Grid - Matching actual card design */}
                        <div className="grid gap-4 md:gap-8 md:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden animate-pulse">
                                    {/* Skeleton Header */}
                                    <CardHeader className="bg-gradient-to-r from-gray-200 to-gray-300 pb-2 relative">
                                        <div className="flex justify-between items-start w-full">
                                            <div className="h-6 bg-gray-300 rounded-full w-20"></div>
                                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                                        </div>
                                    </CardHeader>

                                    <CardBody className="space-y-3 md:space-y-6 p-3 md:p-4">
                                        {/* Skeleton Profile Section */}
                                        <div className="grid grid-cols-24">
                                            <div className="col-span-6 flex justify-center">
                                                <div className="w-24 h-24 bg-gray-200 rounded-full border-4 border-white shadow-lg"></div>
                                            </div>
                                            <div className="col-span-18 space-y-2 px-3">
                                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                            </div>
                                        </div>

                                        {/* Skeleton Divider */}
                                        <div className="h-px bg-gray-200 w-full"></div>

                                        {/* Skeleton Button */}
                                        <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : currentBiodatas.length > 0 ? (
                    <div className="grid gap-4 md:gap-8 md:grid-cols-3">
                        {currentBiodatas.map((biodata) => (
                            <Card key={biodata.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
                                {/* Card Header with Gradient */}
                                <CardHeader className="bg-gradient-to-r from-rose-400 to-pink-500 text-white pb-2 relative">
                                    <div className="absolute top-2 right-2 opacity-20">
                                        <Sparkles className="h-4 w-4 text-rose-500 animate-pulse" aria-hidden="true" />
                                    </div>
                                    <div className="flex justify-between items-start w-full">
                                        <Chip
                                            color={biodata.biodataType?.toLowerCase() === "male" ? "primary" : "secondary"}
                                            variant="flat"
                                            size="sm"
                                            className="bg-white/90 backdrop-blur-sm"
                                            startContent={<Star className="h-3 w-3" />}
                                        >
                                            BD ID - {biodata.id}
                                        </Chip>
                                        <Button
                                            isIconOnly
                                            variant="ghost"
                                            size="sm"
                                            onPress={() => handleFavoriteToggle(biodata.id)}
                                            isLoading={favoriteLoading[biodata.id]}
                                            disabled={favoriteLoading[biodata.id]}
                                            className={`${favoriteIds.has(biodata.id) ? "bg-white/90" : "bg-white/90 text-gray-400 hover:text-red-500"} transition-all duration-200`}
                                            aria-label={favoriteIds.has(biodata.id) ? `Remove ${biodata.fullName} from favorites` : `Add ${biodata.fullName} to favorites`}
                                        >
                                            <Heart
                                                className={`h-4 w-4 ${favoriteIds.has(biodata.id) ? "fill-rose-500 stroke-rose-500" : ""} group-hover:scale-110 transition-transform`}
                                            />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardBody className="space-y-3 md:space-y-6 p-3 md:p-4">
                                    {/* Enhanced Profile Avatar */}
                                    <div className="grid grid-cols-24">
                                        <div className="col-span-6 flex justify-center">
                                            <div className="relative">
                                                {
                                                    biodata.biodataType == "Male" ? (
                                                        <Avatar
                                                            src={(biodata.profilePicture && biodata.profilePictureVisible) ?
                                                                getImageUrl(biodata.profilePicture) :
                                                                "icons/male.png"}
                                                            name={biodata.fullName}
                                                            size="lg"
                                                            className="w-24 h-24 border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                                                            alt={`Profile picture of ${biodata.fullName}`}
                                                        />

                                                    ) : (
                                                        <Avatar
                                                            src={(biodata.profilePicture && biodata.profilePictureVisible) ?
                                                                getImageUrl(biodata.profilePicture) :
                                                                "icons/female.png"}
                                                            name={biodata.fullName}
                                                            size="lg"
                                                            className="w-24 h-24 border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                                                            alt={`Profile picture of ${biodata.fullName}`}
                                                        />
                                                    )
                                                }
                                            </div>
                                        </div>

                                        {/* Enhanced Profile Info */}
                                        <div className="col-span-18 space-y-1 px-3">
                                            <div className=" text-lg text-gray-900 group-hover:text-rose-600 transition-colors duration-200">
                                                <span className="font-bold">Age: </span>{biodata.age || "Unknown User"}
                                            </div>
                                            <div className="flex items-center  gap-2 bg-gray-50 rounded-full">
                                                <span className="truncate font-medium">
                                                    <span className="font-bold">Height: </span>{biodata.height || "Unknown"}
                                                </span>
                                            </div>
                                            {
                                                biodata.biodataType == "male" ? (
                                                    <div className="flex items-center  gap-2 bg-gray-50 rounded-full">
                                                        <span className="truncate font-medium">
                                                            <span className="font-bold">Complexion: </span>{biodata.complexion || "Unknown"}
                                                        </span>
                                                    </div>

                                                ) : (
                                                    <div className="flex items-center  gap-2 bg-gray-50 rounded-full">
                                                        <span className="font-bold">Profession: </span><span className="truncate font-medium">{biodata.profession}</span>
                                                    </div>

                                                )
                                            }
                                        </div>

                                    </div>

                                    <Divider className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                                    {/* Enhanced View Profile Button */}
                                    <Button
                                        as={Link}
                                        href={`/profile/biodatas/${biodata.id}`}
                                        className="w-full bg-white border-1 text-rose-500 border-rose-500 hover:from-rose-600 hover:to-pink-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                        size="md"
                                        startContent={<Eye className="h-4 w-4" />}
                                        onPress={() => {
                                            // Save current search state before navigating to profile
                                            try {
                                                const searchState = {
                                                    filters: {
                                                        gender: selectedGender,
                                                        maritalStatus: selectedMaritalStatus,
                                                        location: selectedLocation,
                                                        biodataNumber: biodataNumber
                                                    },
                                                    hasSearched: hasSearched,
                                                    timestamp: Date.now()
                                                };
                                                sessionStorage.setItem('searchState', JSON.stringify(searchState));
                                            } catch (error) {
                                                console.warn('Failed to save search state:', error);
                                            }
                                        }}
                                    >
                                        View Full Profile
                                    </Button>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                ) : (
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
                                {!error ? (
                                    <div className="relative z-10">
                                        <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                            <User className="h-12 w-12 text-rose-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No Perfect Matches Found</h3>
                                        <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                                            Don&apos;t worry! Your soulmate might be just around the corner. Try adjusting your search filters or check back later for new profiles.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                            <Button
                                                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                                onPress={() => {
                                                    setSelectedGender("");
                                                    setSelectedMaritalStatus("");
                                                    setSelectedLocation("");
                                                    setBiodataNumber("");
                                                }}
                                                startContent={<Search className="h-4 w-4" />}
                                            >
                                                Clear All Filters
                                            </Button>
                                            <Button
                                                variant="flat"
                                                className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200"
                                                onPress={() => void refetch()}
                                                startContent={<Sparkles className="h-4 w-4" />}
                                            >
                                                Refresh Profiles
                                            </Button>
                                        </div>
                                    </div>

                                ) : (
                                    <div className="space-y-4 md:space-y-8">
                                        <div className="text-center space-y-4">
                                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                                                All Biodatas
                                            </h1>
                                            <p className="text-gray-600 text-lg">Discover and connect with verified profiles</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <User className="h-8 w-8 text-red-500" />
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
                                        </div>
                                    </div>
                                )
                                }
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center">
                        <Pagination
                            total={totalPages}
                            page={currentPage}
                            onChange={setCurrentPage}
                            showControls
                            showShadow
                            color="secondary"
                        />
                    </div>
                )}

                {/* Results Summary */}
                {filteredBiodatas.length > 0 && (
                    <div className="text-center text-sm text-gray-600">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredBiodatas.length)} of {filteredBiodatas.length} profiles
                    </div>
                )}

            </div>
        </div>
    );
};