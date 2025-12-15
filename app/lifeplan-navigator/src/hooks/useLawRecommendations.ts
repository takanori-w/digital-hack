'use client';

import { useState, useEffect, useRef } from 'react';
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

  // Use ref for synchronous tracking (state updates are async)
  const fetchStartedRef = useRef(false);

  // Store userProfile in ref to access latest value
  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;

  useEffect(() => {
    // Use ref for synchronous check - this prevents double fetching even with React Strict Mode
    if (fetchStartedRef.current) {
      return;
    }
    fetchStartedRef.current = true;

    let cancelled = false;

    const fetchRecommendations = async () => {
      const profile = userProfileRef.current;

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          action: 'recommendations',
        });

        if (profile.employmentType) {
          params.append('employmentType', profile.employmentType);
        }
        if (profile.residenceType) {
          params.append('residenceType', profile.residenceType);
        }
        if (profile.plannedEvents && profile.plannedEvents.length > 0) {
          params.append('plannedEvents', profile.plannedEvents.join(','));
        }

        const response = await fetch(`/api/laws?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setRecommendations(data.recommendations || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setRecommendations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = async () => {
    const profile = userProfileRef.current;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        action: 'recommendations',
      });

      if (profile.employmentType) {
        params.append('employmentType', profile.employmentType);
      }
      if (profile.residenceType) {
        params.append('residenceType', profile.residenceType);
      }
      if (profile.plannedEvents && profile.plannedEvents.length > 0) {
        params.append('plannedEvents', profile.plannedEvents.join(','));
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
  };

  return {
    recommendations,
    loading,
    error,
    refetch,
  };
}

export default useLawRecommendations;
