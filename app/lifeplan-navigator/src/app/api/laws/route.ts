/**
 * Laws API Route
 * Provides law search and recommendation functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  searchLawsByKeyword,
  searchLawsByTitle,
  getLawRecommendations,
  getSearchGuidance,
  getPersonalizedKeywords,
  smartLawSearch,
  getLawsByAgeCategory,
} from '@/lib/laws-api';
import { translateToLegalTerms } from '@/lib/laws-term-dictionary';
import { EmploymentType, PlannedEvent, ResidenceType } from '@/types/onboarding';

// Valid enum values for input validation
const VALID_EMPLOYMENT_TYPES: readonly string[] = [
  EmploymentType.FULL_TIME_EMPLOYEE, EmploymentType.CONTRACT_EMPLOYEE, EmploymentType.CIVIL_SERVANT,
  EmploymentType.SELF_EMPLOYED, EmploymentType.PART_TIME, EmploymentType.STUDENT,
  EmploymentType.HOMEMAKER, EmploymentType.RETIRED, EmploymentType.UNEMPLOYED, EmploymentType.OTHER
] as const;
const VALID_PLANNED_EVENTS: readonly string[] = [
  PlannedEvent.SIDE_BUSINESS, PlannedEvent.JOB_CHANGE, PlannedEvent.RETIREMENT,
  PlannedEvent.HOME_PURCHASE, PlannedEvent.HOME_RENOVATION, PlannedEvent.MARRIAGE,
  PlannedEvent.CHILDBIRTH, PlannedEvent.CHILD_EDUCATION, PlannedEvent.INHERITANCE,
  PlannedEvent.NURSING_CARE, PlannedEvent.RELOCATION, PlannedEvent.NONE
] as const;
const VALID_RESIDENCE_TYPES: readonly string[] = [
  ResidenceType.RENTAL, ResidenceType.OWNED, ResidenceType.PARENTS_HOME,
  ResidenceType.COMPANY_HOUSING, ResidenceType.PUBLIC_HOUSING, ResidenceType.OTHER
] as const;

// Input validation helpers
function isValidEmploymentType(value: unknown): value is EmploymentType {
  return typeof value === 'string' && VALID_EMPLOYMENT_TYPES.includes(value as EmploymentType);
}

function isValidPlannedEvent(value: unknown): value is PlannedEvent {
  return typeof value === 'string' && VALID_PLANNED_EVENTS.includes(value as PlannedEvent);
}

function isValidResidenceType(value: unknown): value is ResidenceType {
  return typeof value === 'string' && VALID_RESIDENCE_TYPES.includes(value as ResidenceType);
}

function sanitizeKeyword(keyword: string): string {
  // Limit keyword length and remove potentially dangerous characters
  return keyword.slice(0, 100).replace(/[<>]/g, '');
}

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now - record.timestamp > RATE_WINDOW) {
    requestCounts.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'search_keyword': {
        const rawKeywords = searchParams.getAll('keyword');
        if (rawKeywords.length === 0) {
          return NextResponse.json(
            { error: 'At least one keyword is required' },
            { status: 400 }
          );
        }

        // Sanitize keywords
        const keywords = rawKeywords.map(sanitizeKeyword).filter(k => k.length > 0);
        if (keywords.length === 0) {
          return NextResponse.json(
            { error: 'Valid keywords are required' },
            { status: 400 }
          );
        }

        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');
        const lawTypes = searchParams.getAll('lawType');

        const results = await searchLawsByKeyword(keywords, {
          limit: Math.min(limit, 50),
          offset: Math.max(0, offset),
          law_type: lawTypes.length > 0 ? lawTypes as never[] : undefined,
        });

        return NextResponse.json({
          success: true,
          data: results,
          meta: {
            keywords,
            limit,
            offset,
            count: results.length,
          },
        });
      }

      case 'search_title': {
        const rawTitleKeywords = searchParams.getAll('title');
        if (rawTitleKeywords.length === 0) {
          return NextResponse.json(
            { error: 'At least one title keyword is required' },
            { status: 400 }
          );
        }

        // Sanitize title keywords
        const titleKeywords = rawTitleKeywords.map(sanitizeKeyword).filter(k => k.length > 0);
        if (titleKeywords.length === 0) {
          return NextResponse.json(
            { error: 'Valid title keywords are required' },
            { status: 400 }
          );
        }

        const limit = parseInt(searchParams.get('limit') || '10');
        const includeRepealed = searchParams.get('includeRepealed') === 'true';

        const results = await searchLawsByTitle(titleKeywords, {
          limit: Math.min(limit, 50),
          include_repealed: includeRepealed,
        });

        return NextResponse.json({
          success: true,
          data: results,
          meta: {
            titleKeywords,
            limit,
            count: results.length,
          },
        });
      }

      case 'recommendations': {
        const rawEmploymentType = searchParams.get('employmentType');
        const rawPlannedEvents = searchParams.getAll('plannedEvent');
        const rawResidenceType = searchParams.get('residenceType');

        // Validate and filter inputs
        const employmentType = isValidEmploymentType(rawEmploymentType) ? rawEmploymentType : undefined;
        const plannedEvents = rawPlannedEvents.filter(isValidPlannedEvent);
        const residenceType = isValidResidenceType(rawResidenceType) ? rawResidenceType : undefined;

        const recommendations = getLawRecommendations(
          employmentType,
          plannedEvents.length > 0 ? plannedEvents : undefined,
          residenceType
        );

        return NextResponse.json({
          success: true,
          data: recommendations,
          meta: {
            employmentType,
            plannedEvents,
            residenceType,
            count: recommendations.length,
          },
        });
      }

      case 'guidance': {
        const guidance = getSearchGuidance();
        return NextResponse.json({
          success: true,
          data: guidance,
        });
      }

      case 'translate_term': {
        const rawTerm = searchParams.get('term');
        if (!rawTerm) {
          return NextResponse.json(
            { error: 'Term is required' },
            { status: 400 }
          );
        }

        const term = sanitizeKeyword(rawTerm);
        const legalTerms = translateToLegalTerms(term);

        return NextResponse.json({
          success: true,
          data: {
            originalTerm: term,
            legalTerms,
            count: legalTerms.length,
          },
        });
      }

      case 'personalized_keywords': {
        const rawEmploymentType = searchParams.get('employmentType');
        const rawResidenceType = searchParams.get('residenceType');
        const rawHouseholdType = searchParams.get('householdType');
        const rawPlannedEvents = searchParams.getAll('plannedEvent');
        const rawAge = searchParams.get('age');

        const personalizedData = getPersonalizedKeywords({
          employmentType: isValidEmploymentType(rawEmploymentType) ? rawEmploymentType : undefined,
          residenceType: isValidResidenceType(rawResidenceType) ? rawResidenceType : undefined,
          householdType: rawHouseholdType || undefined,
          plannedEvents: rawPlannedEvents.filter(isValidPlannedEvent),
          age: rawAge ? parseInt(rawAge) : undefined,
        });

        return NextResponse.json({
          success: true,
          data: personalizedData,
        });
      }

      case 'age_laws': {
        const rawAge = searchParams.get('age');
        if (!rawAge || isNaN(parseInt(rawAge))) {
          return NextResponse.json(
            { error: 'Valid age is required' },
            { status: 400 }
          );
        }

        const age = parseInt(rawAge);
        const ageData = getLawsByAgeCategory(age);

        return NextResponse.json({
          success: true,
          data: ageData,
        });
      }

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Supported actions: search_keyword, search_title, recommendations, guidance, translate_term, personalized_keywords, age_laws',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Laws API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'search_keyword': {
        const { keywords: rawKeywords, limit = 10, offset = 0, lawTypes } = body;

        if (!rawKeywords || !Array.isArray(rawKeywords) || rawKeywords.length === 0) {
          return NextResponse.json(
            { error: 'Keywords array is required' },
            { status: 400 }
          );
        }

        // Sanitize and validate keywords
        const keywords = rawKeywords
          .filter((k): k is string => typeof k === 'string')
          .map(sanitizeKeyword)
          .filter(k => k.length > 0);

        if (keywords.length === 0) {
          return NextResponse.json(
            { error: 'Valid keywords are required' },
            { status: 400 }
          );
        }

        const results = await searchLawsByKeyword(keywords, {
          limit: Math.min(Number(limit) || 10, 50),
          offset: Math.max(Number(offset) || 0, 0),
          law_type: lawTypes,
        });

        return NextResponse.json({
          success: true,
          data: results,
          meta: {
            keywords,
            limit,
            offset,
            count: results.length,
          },
        });
      }

      case 'recommendations': {
        const { employmentType: rawEmploymentType, plannedEvents: rawPlannedEvents, residenceType: rawResidenceType } = body;

        // Validate inputs
        const employmentType = isValidEmploymentType(rawEmploymentType) ? rawEmploymentType : undefined;
        const plannedEvents = Array.isArray(rawPlannedEvents)
          ? rawPlannedEvents.filter(isValidPlannedEvent)
          : [];
        const residenceType = isValidResidenceType(rawResidenceType) ? rawResidenceType : undefined;

        const recommendations = getLawRecommendations(
          employmentType,
          plannedEvents.length > 0 ? plannedEvents : undefined,
          residenceType
        );

        return NextResponse.json({
          success: true,
          data: recommendations,
          meta: {
            employmentType,
            plannedEvents,
            residenceType,
            count: recommendations.length,
          },
        });
      }

      case 'batch_search': {
        const { searches } = body;

        if (!searches || !Array.isArray(searches)) {
          return NextResponse.json(
            { error: 'Searches array is required' },
            { status: 400 }
          );
        }

        // Limit batch size
        if (searches.length > 5) {
          return NextResponse.json(
            { error: 'Maximum 5 searches per batch' },
            { status: 400 }
          );
        }

        const results = await Promise.all(
          searches.map(async (search: { type: string; keywords: unknown[] }) => {
            // Validate and sanitize keywords for each search
            const keywords = Array.isArray(search.keywords)
              ? search.keywords
                  .filter((k): k is string => typeof k === 'string')
                  .map(sanitizeKeyword)
                  .filter(k => k.length > 0)
              : [];

            if (keywords.length === 0) return [];

            if (search.type === 'keyword') {
              return searchLawsByKeyword(keywords, { limit: 5 });
            } else if (search.type === 'title') {
              return searchLawsByTitle(keywords, { limit: 5 });
            }
            return [];
          })
        );

        return NextResponse.json({
          success: true,
          data: results,
          meta: {
            batchSize: searches.length,
          },
        });
      }

      case 'smart_search': {
        const { query, userContext } = body;

        if (!query || typeof query !== 'string') {
          return NextResponse.json(
            { error: 'Query string is required' },
            { status: 400 }
          );
        }

        const sanitizedQuery = sanitizeKeyword(query);
        if (sanitizedQuery.length === 0) {
          return NextResponse.json(
            { error: 'Valid query is required' },
            { status: 400 }
          );
        }

        // Validate user context if provided
        const validatedContext = userContext ? {
          employmentType: isValidEmploymentType(userContext.employmentType) ? userContext.employmentType : undefined,
          age: typeof userContext.age === 'number' ? userContext.age : undefined,
          plannedEvents: Array.isArray(userContext.plannedEvents)
            ? userContext.plannedEvents.filter(isValidPlannedEvent)
            : undefined,
        } : undefined;

        const smartResults = await smartLawSearch(sanitizedQuery, validatedContext);

        return NextResponse.json({
          success: true,
          data: smartResults,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Laws API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
