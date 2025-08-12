import type { Context } from "hono";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const createSuccessResponse = <T>(
  c: Context,
  data: T,
  message?: string,
  statusCode: number = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return c.json(response, statusCode);
};

export const createErrorResponse = (
  c: Context,
  error: string,
  statusCode: number = 500,
  details?: any
) => {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    response.data = details;
  }

  return c.json(response, statusCode);
};

export const validateDatabase = (env: any): void => {
  if (!env?.DB) {
    throw new ApiError(500, "Database not available");
  }
};

export const validateRequiredParam = (
  param: string | undefined,
  paramName: string
): string => {
  if (!param) {
    throw new ApiError(400, `${paramName} is required`);
  }
  return param;
};

export const validateRequiredBody = (
  body: any,
  requiredFields: string[]
): void => {
  for (const field of requiredFields) {
    if (!body[field]) {
      throw new ApiError(400, `${field} is required`);
    }
  }
};

export const handleApiError = (c: Context, error: unknown) => {
  console.error("API error:", error);

  if (error instanceof ApiError) {
    return createErrorResponse(
      c,
      error.message,
      error.statusCode,
      error.details
    );
  }

  if (error instanceof Error) {
    return createErrorResponse(c, error.message, 500);
  }

  return createErrorResponse(c, "An unexpected error occurred", 500);
};
