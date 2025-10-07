'use server';

/**
 * Type definitions for the Flash Temp Mail API - Domains endpoint
 */

/**
 * Tier information structure
 */
export interface TierInfo {
  /** Total number of domains accessible in this tier */
  total_domains_access: number;
  /** TLDs (top-level domains) available in this tier */
  tlds: string[] | Record<string, number>;
}

/**
 * Response structure from the Flash Temp Mail API when listing domains
 */
export interface ListDomainsResponse {
  /** Informational messages about upgrading */
  upgrade_info: string[];
  /** Available subscription tiers and their domain access */
  tiers: Record<string, TierInfo>;
  /** Current subscription tier */
  current_tier: string;
  /** Total number of domains in the system */
  total_domains: number;
  /** Array of available domain names */
  available_domains: string[];
}

/**
 * Success response containing the list of domains
 */
export interface ListDomainsSuccess {
  success: true;
  /** Array of available email domains */
  domains: string[];
  /** Current subscription tier */
  current_tier: string;
  /** Total number of available domains */
  total_domains: number;
}

/**
 * Error response for domain listing
 */
export interface ListDomainsError {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Union type for the list domains function return value
 */
export type ListDomainsResult = ListDomainsSuccess | ListDomainsError;

/**
 * Lists available email domains from the Flash Temp Mail API
 * 
 * This function retrieves a list of available email domains that can be used
 * when creating temporary email addresses. The available domains depend on
 * your current subscription tier.
 * 
 * @returns Promise resolving to either:
 *  - Success: { success: true, domains: string[], current_tier: string, total_domains: number }
 *  - Error: { success: false, error: string, details?: unknown }
 * 
 * @example
 * ```typescript
 * const result = await listEmailDomains();
 * if (result.success) {
 *   console.log('Available domains:', result.domains);
 *   console.log('Current tier:', result.current_tier);
 *   console.log('Total domains:', result.total_domains);
 * } else {
 *   console.error('Failed to list domains:', result.error);
 * }
 * ```
 * 
 * @throws Never throws - all errors are returned in the response object
 */
export async function listEmailDomains(): Promise<ListDomainsResult> {
  // Validate environment variables
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;

  if (!apiKey) {
    console.error('RAPIDAPI_KEY is not configured in environment variables');
    return {
      success: false,
      error: 'API key not configured. Please set RAPIDAPI_KEY in your environment variables.',
    };
  }

  if (!apiHost) {
    console.error('RAPIDAPI_HOST is not configured in environment variables');
    return {
      success: false,
      error: 'API host not configured. Please set RAPIDAPI_HOST in your environment variables.',
    };
  }

  try {
    const url = 'https://flash-temp-mail.p.rapidapi.com/mailbox/domains';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': apiHost,
        'x-rapidapi-key': apiKey,
      },
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed with status ${response.status}:`, errorText);
      
      return {
        success: false,
        error: `API request failed with status ${response.status}`,
        details: errorText,
      };
    }

    // Parse and validate response
    const data: ListDomainsResponse = await response.json();

    // Validate response structure
    if (!Array.isArray(data.available_domains)) {
      console.error('Invalid response structure:', data);
      return {
        success: false,
        error: 'Invalid response from API: missing or invalid available_domains',
        details: data,
      };
    }

    // Return successful result with domains array
    return {
      success: true,
      domains: data.available_domains,
      current_tier: data.current_tier || 'Unknown',
      total_domains: data.total_domains || data.available_domains.length,
    };

  } catch (error) {
    // Handle network errors, parsing errors, etc.
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error listing email domains:', error);
    
    return {
      success: false,
      error: `Failed to list email domains: ${errorMessage}`,
      details: error,
    };
  }
}

