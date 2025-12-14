'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AgeCategory {
  category: string;
  laws: string[];
}

export interface PersonalizedKeywordsResult {
  keywords: string[];
  ageCategory?: AgeCategory[];
}

export interface UserAttributes {
  employmentType?: string;
  residenceType?: string;
  householdType?: string;
  plannedEvents?: string[];
  age?: number;
}

interface UsePersonalizedKeywordsResult {
  keywords: string[];
  ageCategory: AgeCategory[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePersonalizedKeywords(
  userAttributes: UserAttributes
): UsePersonalizedKeywordsResult {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [ageCategory, setAgeCategory] = useState<AgeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchKeywords = useCallback(async () => {
    // Skip fetch if no attributes provided
    const hasAttributes =
      userAttributes.employmentType ||
      userAttributes.residenceType ||
      userAttributes.householdType ||
      (userAttributes.plannedEvents && userAttributes.plannedEvents.length > 0) ||
      userAttributes.age !== undefined;

    if (!hasAttributes) {
      setKeywords([]);
      setAgeCategory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        action: 'personalized_keywords',
      });

      if (userAttributes.employmentType) {
        params.append('employmentType', userAttributes.employmentType);
      }
      if (userAttributes.residenceType) {
        params.append('residenceType', userAttributes.residenceType);
      }
      if (userAttributes.householdType) {
        params.append('householdType', userAttributes.householdType);
      }
      if (userAttributes.plannedEvents && userAttributes.plannedEvents.length > 0) {
        params.append('plannedEvents', userAttributes.plannedEvents.join(','));
      }
      if (userAttributes.age !== undefined) {
        params.append('age', String(userAttributes.age));
      }

      const response = await fetch(`/api/laws?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch keywords: ${response.status}`);
      }

      const data: PersonalizedKeywordsResult = await response.json();
      setKeywords(data.keywords || []);
      setAgeCategory(data.ageCategory || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setKeywords([]);
      setAgeCategory([]);
    } finally {
      setLoading(false);
    }
  }, [
    userAttributes.employmentType,
    userAttributes.residenceType,
    userAttributes.householdType,
    userAttributes.plannedEvents,
    userAttributes.age,
  ]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  return {
    keywords,
    ageCategory,
    loading,
    error,
    refetch: fetchKeywords,
  };
}

export default usePersonalizedKeywords;
