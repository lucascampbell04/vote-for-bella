'use server';

/**
 * Type definitions for the Flash Temp Mail API - Delete endpoint
 */

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
 * Deletes a temporary email address using the Flash Temp Mail API
 * 
 * This function makes a server-side request to delete a previously created
 * temporary email address, removing it from the system.
 * 
 * @param emailAddress - The email address to delete
 * @returns Promise resolving to either:
 *  - Success: { success: true, message: string }
 *  - Error: { success: false, error: string, details?: unknown }
 * 
 * @example
 * ```typescript
 * const result = await deleteEmailAddress('sample@flashmail.my');
 * if (result.success) {
 *   console.log('Email deleted:', result.message);
 * } else {
 *   console.error('Failed to delete email:', result.error);
 * }
 * ```
 * 
 * @throws Never throws - all errors are returned in the response object
 */
export async function deleteEmailAddress(
  emailAddress: string
): Promise<DeleteEmailAddressResult> {
  // Validate input
  if (!emailAddress || typeof emailAddress !== 'string') {
    return {
      success: false,
      error: 'Email address is required and must be a string',
    };
  }

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
    const url = new URL('https://flash-temp-mail.p.rapidapi.com/mailbox/delete');
    url.searchParams.set('email_address', emailAddress);

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': apiHost,
        'x-rapidapi-key': apiKey,
      },
      body: JSON.stringify({}),
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
    const data: DeleteMailboxResponse = await response.json();

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
      message: data.message || `Successfully deleted email: ${emailAddress}`,
    };

  } catch (error) {
    // Handle network errors, parsing errors, etc.
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error deleting temporary email:', error);
    
    return {
      success: false,
      error: `Failed to delete temporary email: ${errorMessage}`,
      details: error,
    };
  }
}

