export class GrouperError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public grouperCode?: string
  ) {
    super(message);
    this.name = 'GrouperError';
  }
}

function extractGrouperErrorMessage(responseBody: any): string | null {
  // Helper function to clean up Java exception messages
  const cleanJavaException = (message: string): string => {
    // Extract the core error message from Java stack traces
    const match = message.match(/java\.lang\.RuntimeException: (.+?)(?:,|\n|\\n|\t|\\t|$)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If no Java exception pattern, look for the first meaningful line
    const lines = message.split(/[\n\\n]/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('at ') && !trimmed.startsWith('\\t')) {
        return trimmed;
      }
    }
    
    return message;
  };

  try {
    // Handle WsGroupSaveResults (create/update group errors)
    if (responseBody?.WsGroupSaveResults) {
      const results = responseBody.WsGroupSaveResults;
      
      // Check individual result errors first (more specific)
      if (results.results && results.results.length > 0) {
        for (const result of results.results) {
          if (result.resultMetadata && result.resultMetadata.success === 'F') {
            const message = result.resultMetadata.resultMessage;
            if (message) {
              return cleanJavaException(message);
            }
          }
        }
      }
      
      // Check overall result error
      if (results.resultMetadata && results.resultMetadata.success === 'F') {
        const code = results.resultMetadata.resultCode;
        const message = results.resultMetadata.resultMessage;
        if (message && code) {
          return `${code}: ${message}`;
        }
        return message || code || null;
      }
    }

    // Handle WsFindGroupsResults (find group errors)  
    if (responseBody?.WsFindGroupsResults?.resultMetadata) {
      const metadata = responseBody.WsFindGroupsResults.resultMetadata;
      if (metadata.success === 'F') {
        const code = metadata.resultCode;
        const message = metadata.resultMessage;
        if (message && code) {
          return `${code}: ${message}`;
        }
        return message || code || null;
      }
    }

    // Handle WsGetMembersResults (get members errors)
    if (responseBody?.WsGetMembersResults?.resultMetadata) {
      const metadata = responseBody.WsGetMembersResults.resultMetadata;
      if (metadata.success === 'F') {
        const code = metadata.resultCode;
        const message = metadata.resultMessage;
        if (message && code) {
          return `${code}: ${message}`;
        }
        return message || code || null;
      }
    }

    // Handle other Grouper response patterns
    if (responseBody?.resultMetadata) {
      const metadata = responseBody.resultMetadata;
      if (metadata.success === 'F') {
        const code = metadata.resultCode;
        const message = metadata.resultMessage;
        if (message && code) {
          return `${code}: ${message}`;
        }
        return message || code || null;
      }
    }

  } catch (parseError) {
    // If parsing fails, return null to fall back to original error handling
    return null;
  }

  return null;
}

export function handleGrouperError(error: any): GrouperError {
  if (error instanceof GrouperError) {
    return error;
  }

  if (error instanceof Error) {
    return new GrouperError(error.message);
  }

  if (typeof error === 'object' && error !== null) {
    let message = error.message || error.error || 'Unknown Grouper error';
    const statusCode = error.statusCode || error.status;
    let grouperCode = error.code || error.grouperCode;
    
    // Try to extract more meaningful error from Grouper response body
    if (error.body) {
      let responseBody: any = null;
      
      // Parse response body if it's a string
      if (typeof error.body === 'string') {
        try {
          responseBody = JSON.parse(error.body);
        } catch (parseError) {
          responseBody = null;
        }
      } else if (typeof error.body === 'object') {
        responseBody = error.body;
      }
      
      // Extract meaningful Grouper error message
      if (responseBody) {
        const grouperMessage = extractGrouperErrorMessage(responseBody);
        if (grouperMessage) {
          message = grouperMessage;
          
          // Try to extract result code as grouperCode
          if (responseBody?.WsGroupSaveResults?.resultMetadata?.resultCode) {
            grouperCode = responseBody.WsGroupSaveResults.resultMetadata.resultCode;
          } else if (responseBody?.WsFindGroupsResults?.resultMetadata?.resultCode) {
            grouperCode = responseBody.WsFindGroupsResults.resultMetadata.resultCode;
          } else if (responseBody?.resultMetadata?.resultCode) {
            grouperCode = responseBody.resultMetadata.resultCode;
          }
        }
      }
    }
    
    return new GrouperError(message, statusCode, grouperCode);
  }

  return new GrouperError('Unknown error occurred');
}

export function logError(error: GrouperError, context?: string, contextData?: any): void {
  const prefix = context ? `[${context}]` : '';
  console.error(`${prefix} GrouperError:`, {
    message: error.message,
    statusCode: error.statusCode,
    grouperCode: error.grouperCode,
    stack: error.stack,
    ...(contextData && { contextData })
  });
}