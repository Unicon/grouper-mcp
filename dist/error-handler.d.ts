export declare class GrouperError extends Error {
    statusCode?: number | undefined;
    grouperCode?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, grouperCode?: string | undefined);
}
export declare function handleGrouperError(error: any): GrouperError;
export declare function logError(error: GrouperError, context?: string): void;
//# sourceMappingURL=error-handler.d.ts.map