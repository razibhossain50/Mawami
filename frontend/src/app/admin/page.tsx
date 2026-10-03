'use client';

import { useEffect, useState } from 'react';
import type { Metadata } from "next";
import { Card } from "@heroui/react";
import { Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { userService, biodataService } from '@/services/api-services';

interface StatsData {
  totalUsers: number;
  totalBiodatas: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData>({ totalUsers: 0, totalBiodatas: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        logger.debug('Fetching admin dashboard stats', undefined, 'AdminDashboard');

        // Fetch both lists to get counts using API services
        const [users, biodatas] = await Promise.all([
          userService.getAllUsers(),
          biodataService.getAdminBiodatas()
        ]);

        logger.info('Admin stats fetched successfully', { 
          usersCount: Array.isArray(users) ? users.length : 0,
          biodatasCount: Array.isArray(biodatas) ? biodatas.length : 0
        }, 'AdminDashboard');

        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalBiodatas: Array.isArray(biodatas) ? biodatas.length : 0
        });
      } catch (err) {
        const appError = handleApiError(err, 'AdminDashboard');
        logger.error('Failed to fetch admin stats', appError, 'AdminDashboard');
        setError(appError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border-red-200 bg-red-50">
            <Card.Content className="text-center p-6">
              <p className="text-red-600 font-semibold">Error loading statistics</p>
              <p className="text-sm text-red-500 mt-1">{error}</p>
              <p className="text-xs text-gray-500 mt-2">Check browser console for more details</p>
            </Card.Content>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Users Card */}
        <Link href="/admin/users" className="block">
          <Card className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent"></div>
            <Card.Header className="relative flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
              <div className="flex flex-col space-y-1">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Users</h3>
                <p className="text-xs text-gray-500">Registered members</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
            </Card.Header>
            <Card.Content className="relative pt-0 pb-6 px-6">
              <div className="flex flex-col space-y-2">
                <span className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    stats.totalUsers.toLocaleString()
                  )}
                </span>
                
                <span className="text-xs text-gray-500">
                  {loading ? (
                    <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    'All registered accounts'
                  )}
                </span>
              </div>
            </Card.Content>
          </Card>
        </Link>

        {/* Total Biodatas Card */}
        <Link href="/admin/biodatas" className="block">
          <Card className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent"></div>
            <Card.Header className="relative flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
              <div className="flex flex-col space-y-1">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Biodatas</h3>
                <p className="text-xs text-gray-500">Profile submissions</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </Card.Header>
            <Card.Content className="relative pt-0 pb-6 px-6">
              <div className="flex flex-col space-y-2">
                <span className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    stats.totalBiodatas.toLocaleString()
                  )}
                </span>
                
                <span className="text-xs text-gray-500">
                  {loading ? (
                    <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    'Complete profiles created'
                  )}
                </span>
              </div>
            </Card.Content>
          </Card>
        </Link>
      </div>
      
      {/* Additional Dashboard Content */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Future dashboard components can go here */}
      </div>
    </div>
  );
}
