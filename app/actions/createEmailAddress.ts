'use server';

/**
 * Type definitions for the Flash Temp Mail API
 */

/**
 * Response structure from the Flash Temp Mail API when creating a mailbox
 */
export interface CreateMailboxResponse {
  /** The generated temporary email address */
  email_address: string;
  /** Unix timestamp when the email address expires */
  expires_at: number;
  /** Indicates if the operation was successful */
  success: boolean;
  /** Human-readable message about the operation result */
  message: string;
}

/**
 * Error response structure for API failures
 */
export interface TempEmailError {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Success response containing only the email address
 */
export interface CreateEmailResult {
  success: true;
  email_address: string;
  expires_at: number;
}

/**
 * Union type for the function return value
 */
export type CreateTempEmailResult = CreateEmailResult | TempEmailError;

/**
 * Response structure from the Flash Temp Mail API when deleting a mailbox
 */
export interface DeleteMailboxResponse {
  /** Indicates if the operation was successful */
  success: boolean;
  /** Human-readable message about the operation result */
  message: string;
}

/**
 * Success response for email deletion
 */
export interface DeleteEmailSuccess {
  success: true;
  message: string;
}

/**
 * Error response for email deletion
 */
export interface DeleteEmailError {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Union type for the delete function return value
 */
export type DeleteEmailAddressResult = DeleteEmailSuccess | DeleteEmailError;

/**
 * Creates a temporary email address using the Flash Temp Mail API
 * 
 * This function makes a server-side request to generate a disposable email address
 * that can be used for temporary communications or testing purposes.
 * 
 * @param freeDomains - Whether to allow free domains (defaults to false for better deliverability)
 * @returns Promise resolving to either:
 *  - Success: { success: true, email_address: string, expires_at: number }
 *  - Error: { success: false, error: string, details?: unknown }
 * 
 * @example
 * ```typescript
 * const result = await createTempEmail();
 * if (result.success) {
 *   console.log('Email created:', result.email_address);
 *   console.log('Expires at:', new Date(result.expires_at * 1000));
 * } else {
 *   console.error('Failed to create email:', result.error);
 * }
 * ```
 * 
 * @throws Never throws - all errors are returned in the response object
 */
export async function createTempEmail(
  freeDomains: boolean = true
): Promise<CreateTempEmailResult> {
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
    const url = new URL('https://flash-temp-mail.p.rapidapi.com/mailbox/create');
    url.searchParams.set('free_domains', String(freeDomains));

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': apiHost,
        'x-rapidapi-key': apiKey,
      },
      body: JSON.stringify({
        not_required: 'not_required',
      }),
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
    const data: CreateMailboxResponse = await response.json();

    // Validate response structure
    if (!data.email_address || typeof data.email_address !== 'string') {
      console.error('Invalid response structure:', data);
      return {
        success: false,
        error: 'Invalid response from API: missing or invalid email_address',
        details: data,
      };
    }

    if (!data.success) {
      console.error('API returned success=false:', data);
      return {
        success: false,
        error: data.message || 'API returned unsuccessful response',
        details: data,
      };
    }

    // Return successful result
    return {
      success: true,
      email_address: data.email_address,
      expires_at: data.expires_at,
    };

  } catch (error) {
    // Handle network errors, parsing errors, etc.
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error creating temporary email:', error);
    
    return {
      success: false,
      error: `Failed to create temporary email: ${errorMessage}`,
      details: error,
    };
  }
}

