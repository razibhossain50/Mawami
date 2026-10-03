import { useQuery } from '@tanstack/react-query';
import { useRegularAuth } from '@/context/RegularAuthContext';
import { BiodataApprovalStatus, BiodataVisibilityStatus } from '@/types/biodata';

interface BiodataStatusInfo {
  id?: number;
  biodataApprovalStatus: BiodataApprovalStatus;
  biodataVisibilityStatus: BiodataVisibilityStatus;
  canUserToggle: boolean;
  effectiveStatus: string;
}

interface UseBiodataStatusReturn {
  statusInfo: BiodataStatusInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

// Mirrors the backend's two-column status: until approved, the approval status is what
// matters; once approved, the user's visibility choice decides.
const toStatusInfo = (biodata: any): BiodataStatusInfo => {
  const biodataApprovalStatus = biodata.biodataApprovalStatus || BiodataApprovalStatus.PENDING;
  const biodataVisibilityStatus = biodata.biodataVisibilityStatus || BiodataVisibilityStatus.ACTIVE;
  const isApproved = biodataApprovalStatus === BiodataApprovalStatus.APPROVED;
  return {
    id: biodata.id,
    biodataApprovalStatus,
    biodataVisibilityStatus,
    canUserToggle: isApproved,
    effectiveStatus: isApproved ? biodataVisibilityStatus : biodataApprovalStatus,
  };
};

async function fetchBiodataStatus(): Promise<BiodataStatusInfo | null> {
  const token = localStorage.getItem('regular_user_access_token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/biodatas/current`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error('Failed to fetch biodata status');
  }

  // The endpoint returns an empty body (null) when the user has no biodata yet
  const text = await response.text();
  const biodata = text ? JSON.parse(text) : null;
  return biodata ? toStatusInfo(biodata) : null;
}

export const useBiodataStatus = (): UseBiodataStatusReturn => {
  const { user } = useRegularAuth();
  const { data, isLoading, error, refetch } = useQuery({
    // Keyed by user so a different login never sees a cached status
    queryKey: ['biodata-status', user?.id],
    enabled: !!user,
    queryFn: fetchBiodataStatus,
    retry: false,
  });

  return {
    statusInfo: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};
