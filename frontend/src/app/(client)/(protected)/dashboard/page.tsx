"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Users, Heart, BookmarkCheck, ShoppingCart, Plus, TrendingUp, Eye, Star } from "lucide-react";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { useRegularAuth } from "@/context/RegularAuthContext";
import { useProfileView } from "@/hooks/useProfileView";
import { useFavorites } from "@/hooks/useFavorites";
import { useBiodataStatus } from "@/hooks/useBiodataStatus";
import { BiodataStatusToggle } from "@/components/dashboard/BiodataStatusToggle";
import { logger } from '@/services/logger';

export default function Dashboard() {
  const { user } = useRegularAuth();
  const { getProfileViewStats } = useProfileView();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const router = useRouter();
  const { statusInfo, loading: statusLoading, refetch: refetchStatus } = useBiodataStatus();

  // Profile view statistics
  const { data: viewStats = { totalViews: 0, recentViews: 0, viewsThisMonth: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ['view-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const result = await getProfileViewStats();
      return result.success && result.data ? result.data : { totalViews: 0, recentViews: 0, viewsThisMonth: 0 };
    },
  });

  // Same visibility rules as /favorites/count, so the list length is the count
  const totalFavorites = favorites.length;

  const handleStatusChange = () => {
    // Refetch status info to get updated data
    void refetchStatus();
  };

  // Favorites added in the last 7 days (derived, so it can't race the count request)
  const [oneWeekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = favorites.filter(fav => new Date(fav.createdAt).getTime() >= oneWeekAgo).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-10">
          <div className="mb-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 leading-tight">
              Welcome back, {user?.fullName || user?.email}!
            </h1>
            <p className="text-slate-600 text-xl leading-relaxed">Here&apos;s what&apos;s happening with your account</p>
          </div>
        </div>

        {/* Connection Status Card */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-2xl overflow-hidden">
            <CardBody className="p-8 sm:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-1">Your Connections</h2>
                      <p className="text-blue-100 text-lg">Manage your active connections</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-3">
                      <div className="text-6xl font-bold">15</div>
                      <div className="text-3xl text-blue-100 font-medium">/20</div>
                    </div>
                    <p className="text-blue-100 text-xl">Active connections remaining</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl font-bold px-4 py-4 text-lg rounded-2xl transition-all duration-300 hover:scale-105"
                    onClick={() => logger.info('Buy more connections clicked', { userId: user?.id }, 'Dashboard')}
                  >
                    <Plus className="h-6 w-6" />
                    Buy More Connections
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>



        {/* Stats Grid */}
        <div className="grid gap-8 md:grid-cols-3 mb-10">
          {/* Biodata Status Toggle */}
          {statusInfo && (
            <div className="">
              <BiodataStatusToggle
                biodataId={statusInfo.id}
                biodataApprovalStatus={statusInfo.biodataApprovalStatus}
                biodataVisibilityStatus={statusInfo.biodataVisibilityStatus}
                canUserToggle={statusInfo.canUserToggle}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
          {/* Profile Visits Card */}
          <Card className="bg-white/80 backdrop-blur-sm hover:bg-white/95 transition-all duration-500 border-0 shadow-xl hover:shadow-2xl group overflow-hidden">
            <CardBody className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-bold text-green-700">
                      {statsLoading ? (
                        <div className="animate-pulse bg-green-200 rounded h-3 w-8"></div>
                      ) : (
                        `+${viewStats.recentViews} recent`
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-800">Profile Visits</h3>
                  <p className="text-slate-600 text-lg">Total views on your profile</p>
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {statsLoading ? (
                      <div className="animate-pulse bg-blue-200 rounded h-12 w-24"></div>
                    ) : (
                      viewStats.totalViews
                    )}
                  </div>
                  <p className="text-slate-500 font-medium">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 rounded h-4 w-32"></div>
                    ) : (
                      `+${viewStats.viewsThisMonth} this month`
                    )}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Favorites Card */}
          <Card className="bg-white/80 backdrop-blur-sm hover:bg-white/95 transition-all duration-500 border-0 shadow-xl hover:shadow-2xl group overflow-hidden cursor-pointer">
            <CardBody className="p-8" onClick={() => router.push('/favorites')}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
                    <Star className="h-4 w-4 text-rose-600" />
                    <span className="text-sm font-bold text-rose-700">
                      {favoritesLoading ? (
                        <div className="animate-pulse bg-rose-200 rounded h-3 w-8"></div>
                      ) : (
                        `${newThisWeek} new`
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-rose-600 transition-colors">Your Favorites</h3>
                  <p className="text-slate-600 text-lg">Profiles you&apos;ve liked</p>
                  <div className="text-5xl font-bold text-rose-600 mb-2">
                    {favoritesLoading ? (
                      <div className="animate-pulse bg-rose-200 rounded h-12 w-24"></div>
                    ) : (
                      totalFavorites
                    )}
                  </div>
                  <p className="text-slate-500 font-medium">
                    {favoritesLoading ? (
                      <div className="animate-pulse bg-gray-200 rounded h-4 w-32"></div>
                    ) : (
                      `${newThisWeek} added this week`
                    )}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Shortlisted Card */}
          {/* <Card className="bg-white/80 backdrop-blur-sm hover:bg-white/95 transition-all duration-500 border-0 shadow-xl hover:shadow-2xl group overflow-hidden">
            <CardBody className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BookmarkCheck className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    <Plus className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">+3 new</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-800">Profile Shortlists</h3>
                  <p className="text-slate-600 text-lg">Times you&apos;ve been shortlisted</p>
                  <div className="text-5xl font-bold text-emerald-600 mb-2">18</div>
                  <p className="text-slate-500 font-medium">3 new shortlists</p>
                </div>
              </div>
            </CardBody>
          </Card> */}
        </div>



        {/* Purchase History */}
        {/* <Card className="bg-white/70 backdrop-blur-sm border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Purchase History</h3>
                <p className="text-slate-600">Your recent transactions</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-6">
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  item: "Premium Connections Pack",
                  date: "2024-03-15",
                  amount: "$49.99",
                  status: "Completed"
                },
                {
                  id: 2,
                  item: "Profile Boost Package",
                  date: "2024-02-28",
                  amount: "$29.99",
                  status: "Completed"
                },
                {
                  id: 3,
                  item: "Extended Visibility",
                  date: "2024-02-10",
                  amount: "$19.99",
                  status: "Completed"
                }
              ].map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-800">{purchase.item}</p>
                      <p className="text-sm text-slate-500">{purchase.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-slate-800">{purchase.amount}</span>
                    <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      {purchase.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Button variant="bordered" className="w-full text-slate-600 border-slate-200 hover:bg-slate-50">
                View All Transactions
              </Button>
            </div>
          </CardBody>
        </Card> */}
      </div>
    </div>
  );
}