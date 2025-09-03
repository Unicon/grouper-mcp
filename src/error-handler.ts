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
    // First, look for specific Java exceptions with meaningful error messages
    const nullPointerMatch = message.match(/java\.lang\.NullPointerException: (.+?)(?:\n|\\n|\t|\\t|$)/);
    if (nullPointerMatch && nullPointerMatch[1]) {
      return `NullPointerException: ${nullPointerMatch[1].trim()}`;
    }
    
    // Look for general Java exceptions
    const javaExceptionMatch = message.match(/java\.lang\.(\w+Exception): (.+?)(?:\n|\\n|\t|\\t|$)/);
    if (javaExceptionMatch && javaExceptionMatch[1] && javaExceptionMatch[2]) {
      return `${javaExceptionMatch[1]}: ${javaExceptionMatch[2].trim()}`;
    }
    
    // Look for standalone exception types followed by a meaningful message
    const standaloneExceptionMatch = message.match(/java\.lang\.(\w+Exception): (.+?)(?:\s+at\s|$)/);
    if (standaloneExceptionMatch && standaloneExceptionMatch[1] && standaloneExceptionMatch[2]) {
      return `${standaloneExceptionMatch[1]}: ${standaloneExceptionMatch[2].trim()}`;
    }
    
    // Extract the core error message from Java stack traces (original pattern)
    const runtimeMatch = message.match(/java\.lang\.RuntimeException: (.+?)(?:\n|\\n|\t|\\t|$)/);
    if (runtimeMatch && runtimeMatch[1]) {
      return runtimeMatch[1].trim();
    }
    
    // Look for standalone NullPointerException without explicit message
    if (message.includes('java.lang.NullPointerException') && message.includes('Cannot invoke')) {
      const cannotInvokeMatch = message.match(/Cannot invoke "(.+?)" because "(.+?)" is null/);
      if (cannotInvokeMatch && cannotInvokeMatch[1] && cannotInvokeMatch[2]) {
        return `NullPointerException: Cannot invoke "${cannotInvokeMatch[1]}" because "${cannotInvokeMatch[2]}" is null`;
      }
      return 'NullPointerException: A required value is null';
    }
    
    // For non-Java exception messages, look for meaningful content before metadata
    // Match everything up to ", clientVersion:" or similar metadata patterns
    const metadataMatch = message.match(/^(.+?)(?:,\s*clientVersion:|,\s*attributeAssign\w+:|$)/);
    if (metadataMatch && metadataMatch[1]) {
      return metadataMatch[1].trim();
    }
    
    // If no metadata pattern, look for the first meaningful line
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

    // Handle WsAssignAttributesResults (assign attributes errors)
    if (responseBody?.WsAssignAttributesResults?.resultMetadata) {
      const metadata = responseBody.WsAssignAttributesResults.resultMetadata;
      if (metadata.success === 'F') {
        const code = metadata.resultCode;
        const message = metadata.resultMessage;
        
        // Special handling for attribute assignment errors
        if (code === 'INVALID_QUERY' && message) {
          // Handle missing attributeDefName lookup errors
          if (message.includes('attributeDefName lookup')) {
            const baseMessage = cleanJavaException(message);
            const attributeNameMatch = message.match(/WsAttributeDefNameLookup\[pitAttributeDefNames=\[\],name=([^\]]+)\]/);
            if (attributeNameMatch && attributeNameMatch[1]) {
              return `${baseMessage} The attribute name "${attributeNameMatch[1]}" was not found. Ensure it exists and use the full path (e.g., "etc:attribute:attestation:attestation" instead of just "attestation").`;
            }
            return `${baseMessage} Check that the attribute name exists and use the full qualified path.`;
          }
          
          // Handle missing attributeAssignValueOperation errors
          if (message.includes('must pass attributeAssignValueOperation')) {
            return `${code}: If you pass values then you must pass attributeAssignValueOperation. This indicates a configuration issue with the attribute assignment request.`;
          }
          
          // Handle other attribute assignment errors - extract the most meaningful part
          if (message.includes('Problem with AttributeDefName')) {
            // Look for the actual exception message in the stack trace
            const exceptionMatch = message.match(/edu\.internet2\.middleware\.grouper\.ws\.exceptions\.WsInvalidQueryException:\s*([^\\n\\t]+)/);
            if (exceptionMatch && exceptionMatch[1]) {
              return `${code}: ${exceptionMatch[1].trim()}`;
            }
            
            // Fallback: try to extract from the Problem with AttributeDefName part
            const problemMatch = message.match(/Problem with AttributeDefName\[[^\]]*\][^,]*,\s*[^,]*,\s*[^,]*,\s*([^,]+Exception[^,]*)/);
            if (problemMatch && problemMatch[1]) {
              return `${code}: ${problemMatch[1].trim()}`;
            }
          }
        }
        
        if (message && code) {
          return cleanJavaException(`${code}: ${message}`);
        }
        return cleanJavaException(message) || code || null;
      }
    }

    // Handle WsRestResultProblem (attribute assignment and other API errors)
    if (responseBody?.WsRestResultProblem?.resultMetadata) {
      const metadata = responseBody.WsRestResultProblem.resultMetadata;
      if (metadata.success === 'F') {
        const code = metadata.resultCode;
        const message = metadata.resultMessage;
        if (message && code) {
          return cleanJavaException(`${code}: ${message}`);
        }
        return cleanJavaException(message) || code || null;
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
          if (responseBody?.WsAssignAttributesResults?.resultMetadata?.resultCode) {
            grouperCode = responseBody.WsAssignAttributesResults.resultMetadata.resultCode;
          } else if (responseBody?.WsRestResultProblem?.resultMetadata?.resultCode) {
            grouperCode = responseBody.WsRestResultProblem.resultMetadata.resultCode;
          } else if (responseBody?.WsGroupSaveResults?.resultMetadata?.resultCode) {
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