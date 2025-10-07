'use server';

/**
 * Type definitions for the Flash Temp Mail API - List Emails endpoint
 */

/**
 * Email object structure from the API
 */
export interface EmailMessage {
  /** Unix timestamp when the email was received */
  timestamp: number;
  /** Sender's email address */
  from_address: string;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Sender's display name */
  from: string;
  /** Unix timestamp when the email expires */
  expires_at: number;
  /** Unique identifier for the email */
  email_key: string;
  /** Email attachments (if any) */
  attachments: Record<string, unknown>;
  /** Email subject line */
  subject: string;
  /** Email body content */
  content: string;
}

/**
 * Response structure from the Flash Temp Mail API when listing emails
 */
export interface ListEmailsResponse {
  /** Array of email messages */
  emails: EmailMessage[];
  /** Unix timestamp when the mailbox expires */
  expires_at: number;
  /** Indicates if the operation was successful */
  success: boolean;
  /** The email address that was queried */
  email_address: string;
}

/**
 * Success response containing the first email's content
 */
export interface GetFirstEmailSuccess {
  success: true;
  /** Content of the first email */
  content: string;
  /** Subject of the first email */
  subject: string;
  /** Sender of the first email */
  from: string;
}

/**
 * Response when no emails are found
 */
export interface NoEmailsFound {
  success: true;
  content: null;
  message: string;
}

/**
 * Error response for email fetching
 */
export interface GetEmailError {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Union type for the get first email function return value
 */
export type GetFirstEmailResult = GetFirstEmailSuccess | NoEmailsFound | GetEmailError;

/**
 * Fetches emails for a given email address and returns the content of the first email
 * 
 * This function retrieves all emails for a temporary email address and returns
 * only the content of the most recent (first) email in the list.
 * 
 * @param emailAddress - The temporary email address to fetch emails for
 * @returns Promise resolving to either:
 *  - Success with email: { success: true, content: string, subject: string, from: string }
 *  - Success with no emails: { success: true, content: null, message: string }
 *  - Error: { success: false, error: string, details?: unknown }
 * 
 * @example
 * ```typescript
 * const result = await getFirstEmailContent('sample@flashmail.my');
 * if (result.success && result.content) {
 *   console.log('Email content:', result.content);
 *   console.log('Subject:', result.subject);
 *   console.log('From:', result.from);
 * } else if (result.success && result.content === null) {
 *   console.log('No emails found');
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 * 
 * @throws Never throws - all errors are returned in the response object
 */
export async function getFirstEmailContent(
  emailAddress: string
): Promise<GetFirstEmailResult> {
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
    const url = new URL('https://flash-temp-mail.p.rapidapi.com/mailbox/emails');
    url.searchParams.set('email_address', emailAddress);

    const response = await fetch(url.toString(), {
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
    const data: ListEmailsResponse = await response.json();

    // Check if API returned success
    if (!data.success) {
      console.error('API returned success=false:', data);
      return {
        success: false,
        error: 'API returned unsuccessful response',
        details: data,
      };
    }

    // Validate response structure
    if (!Array.isArray(data.emails)) {
      console.error('Invalid response structure:', data);
      return {
        success: false,
        error: 'Invalid response from API: missing or invalid emails array',
        details: data,
      };
    }

    // Check if there are any emails
    if (data.emails.length === 0) {
      return {
        success: true,
        content: null,
        message: 'No emails found for this address',
      };
    }

    // Get the first email
    const firstEmail = data.emails[0];

    // Validate first email has content
    if (typeof firstEmail.content !== 'string') {
      console.error('First email missing content:', firstEmail);
      return {
        success: false,
        error: 'First email does not have valid content',
        details: firstEmail,
      };
    }

    // Return the content of the first email
    return {
      success: true,
      content: firstEmail.content,
      subject: firstEmail.subject || 'No subject',
      from: firstEmail.from || firstEmail.from_address || 'Unknown sender',
    };

  } catch (error) {
    // Handle network errors, parsing errors, etc.
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error fetching emails:', error);
    
    return {
      success: false,
      error: `Failed to fetch emails: ${errorMessage}`,
      details: error,
    };
  }
}

