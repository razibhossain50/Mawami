import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRegularAuth } from '@/context/RegularAuthContext';
import { logger } from '@/services/logger';
import { handleApiError } from '@/services/error-handler';
import { favoritesService } from '@/services/api-services';
import { FavoriteItem } from '@/types/api';

// One cached favorites list per user, shared by every component that uses this hook
export const favoritesQueryKey = (userId?: number) => ['favorites', userId] as const;

export const useFavorites = () => {
  const { user, isAuthenticated } = useRegularAuth();
  const queryClient = useQueryClient();
  const enabled = isAuthenticated && !!user;
  const queryKey = favoritesQueryKey(user?.id);

  const { data: favorites = [], isLoading: loading, error, refetch } = useQuery({
    queryKey,
    enabled,
    queryFn: async (): Promise<FavoriteItem[]> => (await favoritesService.getFavorites()).data ?? [],
  });

  // Ids of favorited biodatas, for synchronous "is this a favorite?" checks
  const favoriteIds = useMemo(() => new Set(favorites.map((fav) => fav.biodata?.id ?? fav.biodataId)), [favorites]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  // Returns false when not logged in so the caller can redirect
  const addToFavorites = async (biodataId: number): Promise<boolean> => {
    if (!enabled) return false;
    try {
      await favoritesService.addToFavorites(biodataId);
      await invalidate();
      return true;
    } catch (err) {
      const appError = handleApiError(err, 'useFavorites');
      // Already a favorite: the list is just stale
      if (appError.statusCode === 409) {
        await invalidate();
        return true;
      }
      logger.error('Error adding to favorites', appError, 'useFavorites');
      return false;
    }
  };

  const removeFromFavorites = async (biodataId: number): Promise<boolean> => {
    if (!enabled) return false;
    try {
      await favoritesService.removeFromFavorites(biodataId);
      queryClient.setQueryData<FavoriteItem[]>(queryKey, (prev) =>
        prev?.filter((fav) => (fav.biodata?.id ?? fav.biodataId) !== biodataId),
      );
      return true;
    } catch (err) {
      logger.error('Error removing from favorites', handleApiError(err, 'useFavorites'), 'useFavorites');
      return false;
    }
  };

  const isFavorite = async (biodataId: number): Promise<boolean> => {
    if (!enabled) return false;
    try {
      const data = await favoritesService.checkFavorite(biodataId);
      return data.isFavorite || false;
    } catch (err) {
      logger.error('Error checking favorite status', handleApiError(err, 'useFavorites'), 'useFavorites');
      return false;
    }
  };

  const getFavoriteCount = async (): Promise<number> => {
    if (!enabled) return 0;
    try {
      const data = await favoritesService.getFavoriteCount();
      return data.count || 0;
    } catch (err) {
      logger.error('Error getting favorite count', handleApiError(err, 'useFavorites'), 'useFavorites');
      return 0;
    }
  };

  return {
    favorites,
    favoriteIds,
    loading,
    error: error instanceof Error ? error.message : null,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoriteCount,
    fetchFavorites: refetch,
  };
};
