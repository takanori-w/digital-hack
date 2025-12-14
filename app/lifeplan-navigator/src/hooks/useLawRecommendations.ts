'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmploymentType, PlannedEvent, ResidenceType } from '@/types/onboarding';

export interface LawRecommendation {
  law_id: string;
  law_title: string;
  law_num: string;
  relevance_reason: string;
  relevance_score: number;
  category: string;
  summary: string;
}

export interface UserProfile {
  employmentType?: EmploymentType;
  plannedEvents?: PlannedEvent[];
  residenceType?: ResidenceType;
  age?: number;
  householdType?: string;
}

interface UseLawRecommendationsResult {
  recommendations: LawRecommendation[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLawRecommendations(
  userProfile: UserProfile
): UseLawRecommendationsResult {
  const [recommendations, setRecommendations] = useState<LawRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        action: 'recommendations',
      });

      if (userProfile.employmentType) {
        params.append('employmentType', userProfile.employmentType);
      }
      if (userProfile.residenceType) {
        params.append('residenceType', userProfile.residenceType);
      }
      if (userProfile.plannedEvents && userProfile.plannedEvents.length > 0) {
        params.append('plannedEvents', userProfile.plannedEvents.join(','));
      }

      const response = await fetch(`/api/laws?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [userProfile.employmentType, userProfile.residenceType, userProfile.plannedEvents]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
  };
}

export default useLawRecommendations;
