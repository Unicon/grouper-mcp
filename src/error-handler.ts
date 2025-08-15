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

export function handleGrouperError(error: any): GrouperError {
  if (error instanceof GrouperError) {
    return error;
  }

  if (error instanceof Error) {
    return new GrouperError(error.message);
  }

  if (typeof error === 'object' && error !== null) {
    const message = error.message || error.error || 'Unknown Grouper error';
    const statusCode = error.statusCode || error.status;
    const grouperCode = error.code || error.grouperCode;
    
    return new GrouperError(message, statusCode, grouperCode);
  }

  return new GrouperError('Unknown error occurred');
}

export function logError(error: GrouperError, context?: string): void {
  const prefix = context ? `[${context}]` : '';
  console.error(`${prefix} GrouperError:`, {
    message: error.message,
    statusCode: error.statusCode,
    grouperCode: error.grouperCode,
    stack: error.stack
  });
}