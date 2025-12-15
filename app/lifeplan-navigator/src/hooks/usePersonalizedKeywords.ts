'use client';

import { useState, useEffect, useRef } from 'react';

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

  // Use ref for synchronous tracking (state updates are async)
  const fetchStartedRef = useRef(false);

  // Store userAttributes in ref to access latest value
  const userAttributesRef = useRef(userAttributes);
  userAttributesRef.current = userAttributes;

  useEffect(() => {
    // Use ref for synchronous check - this prevents double fetching even with React Strict Mode
    if (fetchStartedRef.current) {
      return;
    }
    fetchStartedRef.current = true;

    let cancelled = false;

    const fetchKeywords = async () => {
      const attrs = userAttributesRef.current;

      // Skip fetch if no attributes provided
      const hasAttributes =
        attrs.employmentType ||
        attrs.residenceType ||
        attrs.householdType ||
        (attrs.plannedEvents && attrs.plannedEvents.length > 0) ||
        attrs.age !== undefined;

      if (!hasAttributes) {
        if (!cancelled) {
          setKeywords([]);
          setAgeCategory([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          action: 'personalized_keywords',
        });

        if (attrs.employmentType) {
          params.append('employmentType', attrs.employmentType);
        }
        if (attrs.residenceType) {
          params.append('residenceType', attrs.residenceType);
        }
        if (attrs.householdType) {
          params.append('householdType', attrs.householdType);
        }
        if (attrs.plannedEvents && attrs.plannedEvents.length > 0) {
          params.append('plannedEvents', attrs.plannedEvents.join(','));
        }
        if (attrs.age !== undefined) {
          params.append('age', String(attrs.age));
        }

        const response = await fetch(`/api/laws?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch keywords: ${response.status}`);
        }

        const data: PersonalizedKeywordsResult = await response.json();

        if (!cancelled) {
          setKeywords(data.keywords || []);
          setAgeCategory(data.ageCategory || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setKeywords([]);
          setAgeCategory([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchKeywords();

    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = async () => {
    const attrs = userAttributesRef.current;

    const hasAttributes =
      attrs.employmentType ||
      attrs.residenceType ||
      attrs.householdType ||
      (attrs.plannedEvents && attrs.plannedEvents.length > 0) ||
      attrs.age !== undefined;

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

      if (attrs.employmentType) {
        params.append('employmentType', attrs.employmentType);
      }
      if (attrs.residenceType) {
        params.append('residenceType', attrs.residenceType);
      }
      if (attrs.householdType) {
        params.append('householdType', attrs.householdType);
      }
      if (attrs.plannedEvents && attrs.plannedEvents.length > 0) {
        params.append('plannedEvents', attrs.plannedEvents.join(','));
      }
      if (attrs.age !== undefined) {
        params.append('age', String(attrs.age));
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
  };

  return {
    keywords,
    ageCategory,
    loading,
    error,
    refetch,
  };
}

export default usePersonalizedKeywords;
