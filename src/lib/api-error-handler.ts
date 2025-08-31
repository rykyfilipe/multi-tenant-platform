/** @format */

/**
 * Standardized API Error Handling Module
 * Provides consistent error responses and handling across all API endpoints
 */

import { NextResponse } from "next/server";
import { z } from "zod";

// Standard error codes
export enum ErrorCode {
	// Client Errors (4xx)
	VALIDATION_ERROR = "VALIDATION_ERROR",
	AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
	AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
	NOT_FOUND = "NOT_FOUND",
	CONFLICT = "CONFLICT",
	RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
	PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
	UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",

	// Server Errors (5xx)
	INTERNAL_ERROR = "INTERNAL_ERROR",
	DATABASE_ERROR = "DATABASE_ERROR",
	EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
	CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
	MAINTENANCE_MODE = "MAINTENANCE_MODE",
}

// Standard error interface
export interface ApiError {
	code: ErrorCode;
	message: string;
	details?: any;
	timestamp: string;
	path?: string;
	requestId?: string;
	statusCode: number;
}

// Error response builder
export class ApiErrorBuilder {
	private error: Partial<ApiError> = {
		timestamp: new Date().toISOString(),
	};

	static create(code: ErrorCode, message: string): ApiErrorBuilder {
		return new ApiErrorBuilder().withCode(code).withMessage(message);
	}

	withCode(code: ErrorCode): ApiErrorBuilder {
		this.error.code = code;
		this.error.statusCode = this.getStatusCodeFromErrorCode(code);
		return this;
	}

	withMessage(message: string): ApiErrorBuilder {
		this.error.message = message;
		return this;
	}

	withDetails(details: any): ApiErrorBuilder {
		this.error.details = details;
		return this;
	}

	withPath(path: string): ApiErrorBuilder {
		this.error.path = path;
		return this;
	}

	withRequestId(requestId: string): ApiErrorBuilder {
		this.error.requestId = requestId;
		return this;
	}

	build(): ApiError {
		if (!this.error.code || !this.error.message) {
			throw new Error("Error code and message are required");
		}
		return this.error as ApiError;
	}

	toResponse(): NextResponse {
		const error = this.build();
		return NextResponse.json(error, { status: error.statusCode });
	}

	private getStatusCodeFromErrorCode(code: ErrorCode): number {
		switch (code) {
			case ErrorCode.VALIDATION_ERROR:
				return 400;
			case ErrorCode.AUTHENTICATION_ERROR:
				return 401;
			case ErrorCode.AUTHORIZATION_ERROR:
				return 403;
			case ErrorCode.NOT_FOUND:
				return 404;
			case ErrorCode.CONFLICT:
				return 409;
			case ErrorCode.PAYLOAD_TOO_LARGE:
				return 413;
			case ErrorCode.UNSUPPORTED_MEDIA_TYPE:
				return 415;
			case ErrorCode.RATE_LIMIT_EXCEEDED:
				return 429;
			case ErrorCode.INTERNAL_ERROR:
			case ErrorCode.DATABASE_ERROR:
			case ErrorCode.EXTERNAL_SERVICE_ERROR:
			case ErrorCode.CONFIGURATION_ERROR:
				return 500;
			case ErrorCode.MAINTENANCE_MODE:
				return 503;
			default:
				return 500;
		}
	}
}

// Predefined error responses
export const ApiErrors = {
	// Authentication & Authorization
	unauthorized: (message = "Authentication required") =>
		ApiErrorBuilder.create(ErrorCode.AUTHENTICATION_ERROR, message),

	forbidden: (message = "Insufficient permissions") =>
		ApiErrorBuilder.create(ErrorCode.AUTHORIZATION_ERROR, message),

	invalidToken: (message = "Invalid or expired token") =>
		ApiErrorBuilder.create(ErrorCode.AUTHENTICATION_ERROR, message),

	// Validation
	validationFailed: (details?: any) =>
		ApiErrorBuilder.create(
			ErrorCode.VALIDATION_ERROR,
			"Validation failed",
		).withDetails(details),

	invalidInput: (field: string, reason?: string) =>
		ApiErrorBuilder.create(
			ErrorCode.VALIDATION_ERROR,
			`Invalid ${field}${reason ? ": " + reason : ""}`,
		),

	requiredField: (field: string) =>
		ApiErrorBuilder.create(ErrorCode.VALIDATION_ERROR, `${field} is required`),

	// Resource errors
	notFound: (resource = "Resource") =>
		ApiErrorBuilder.create(ErrorCode.NOT_FOUND, `${resource} not found`),

	alreadyExists: (resource = "Resource") =>
		ApiErrorBuilder.create(ErrorCode.CONFLICT, `${resource} already exists`),

	// Rate limiting
	rateLimitExceeded: (retryAfter?: number) =>
		ApiErrorBuilder.create(
			ErrorCode.RATE_LIMIT_EXCEEDED,
			"Too many requests",
		).withDetails({ retryAfter }),

	// Server errors
	internalError: (message = "Internal server error") =>
		ApiErrorBuilder.create(ErrorCode.INTERNAL_ERROR, message),

	databaseError: (message = "Database operation failed") =>
		ApiErrorBuilder.create(ErrorCode.DATABASE_ERROR, message),

	externalServiceError: (service: string, message?: string) =>
		ApiErrorBuilder.create(
			ErrorCode.EXTERNAL_SERVICE_ERROR,
			message || `External service ${service} is unavailable`,
		),

	// Business logic errors
	insufficientPlan: (feature: string) =>
		ApiErrorBuilder.create(
			ErrorCode.AUTHORIZATION_ERROR,
			`${feature} is not available in your current plan`,
		),

	quotaExceeded: (resource: string) =>
		ApiErrorBuilder.create(
			ErrorCode.AUTHORIZATION_ERROR,
			`${resource} quota exceeded`,
		),

	// File upload errors
	fileTooLarge: (maxSize: string) =>
		ApiErrorBuilder.create(
			ErrorCode.PAYLOAD_TOO_LARGE,
			`File size exceeds maximum allowed size of ${maxSize}`,
		),

	unsupportedFileType: (allowedTypes: string[]) =>
		ApiErrorBuilder.create(
			ErrorCode.UNSUPPORTED_MEDIA_TYPE,
			`Unsupported file type. Allowed types: ${allowedTypes.join(", ")}`,
		),
};

// Error handler wrapper for API routes
export function handleApiError(
	error: unknown,
	path?: string,
	requestId?: string,
): NextResponse {
	console.error("API Error:", error);

	// Handle Zod validation errors
	if (error instanceof z.ZodError) {
		return ApiErrors.validationFailed(error.errors)
			.withPath(path || "")
			.withRequestId(requestId || "")
			.toResponse();
	}

	// Handle known API errors
	if (isApiError(error)) {
		return ApiErrorBuilder.create(error.code, error.message)
			.withDetails(error.details)
			.withPath(path || error.path || "")
			.withRequestId(requestId || error.requestId || "")
			.toResponse();
	}

	// Handle Prisma errors
	if (isPrismaError(error)) {
		return handlePrismaError(error, path, requestId);
	}

	// Handle generic errors
	const message =
		error instanceof Error ? error.message : "Unknown error occurred";
	return ApiErrors.internalError(message)
		.withPath(path || "")
		.withRequestId(requestId || "")
		.toResponse();
}

// Type guards
function isApiError(error: unknown): error is ApiError {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		"message" in error
	);
}

function isPrismaError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		("code" in error || "meta" in error) &&
		"message" in error
	);
}

// Prisma error handler
function handlePrismaError(
	error: any,
	path?: string,
	requestId?: string,
): NextResponse {
	let apiError: ApiErrorBuilder;

	switch (error.code) {
		case "P2002": // Unique constraint violation
			apiError = ApiErrors.alreadyExists("Record with this value");
			break;
		case "P2025": // Record not found
			apiError = ApiErrors.notFound("Record");
			break;
		case "P2003": // Foreign key constraint violation
			apiError = ApiErrors.validationFailed("Referenced record does not exist");
			break;
		case "P2004": // Constraint violation
			apiError = ApiErrors.validationFailed("Data constraint violation");
			break;
		default:
			apiError = ApiErrors.databaseError(`Database error: ${error.message}`);
	}

	return apiError
		.withPath(path || "")
		.withRequestId(requestId || "")
		.toResponse();
}

// Success response builder
export class ApiSuccessBuilder {
	private response: any = {};

	static create(data?: any): ApiSuccessBuilder {
		return new ApiSuccessBuilder().withData(data);
	}

	withData(data: any): ApiSuccessBuilder {
		this.response.data = data;
		return this;
	}

	withMessage(message: string): ApiSuccessBuilder {
		this.response.message = message;
		return this;
	}

	withMeta(meta: any): ApiSuccessBuilder {
		this.response.meta = meta;
		return this;
	}

	withPagination(pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	}): ApiSuccessBuilder {
		this.response.pagination = pagination;
		return this;
	}

	toResponse(status = 200): NextResponse {
		return NextResponse.json(
			{
				success: true,
				timestamp: new Date().toISOString(),
				...this.response,
			},
			{ status },
		);
	}
}

// Predefined success responses
export const ApiSuccess = {
	ok: (data?: any, message?: string) =>
		ApiSuccessBuilder.create(data).withMessage(message || "Success"),

	created: (data?: any, message?: string) =>
		ApiSuccessBuilder.create(data).withMessage(
			message || "Resource created successfully",
		),

	updated: (data?: any, message?: string) =>
		ApiSuccessBuilder.create(data).withMessage(
			message || "Resource updated successfully",
		),

	deleted: (message?: string) =>
		ApiSuccessBuilder.create().withMessage(
			message || "Resource deleted successfully",
		),

	paginated: (
		data: any[],
		pagination: {
			page: number;
			pageSize: number;
			total: number;
			totalPages: number;
		},
	) => ApiSuccessBuilder.create(data).withPagination(pagination),
};

// Async error handler wrapper
export function asyncHandler(
	handler: (request: Request, params?: any) => Promise<NextResponse>,
) {
	return async (request: Request, params?: any): Promise<NextResponse> => {
		try {
			return await handler(request, params);
		} catch (error) {
			const path = new URL(request.url).pathname;
			const requestId = request.headers.get("x-request-id") || undefined;
			return handleApiError(error, path, requestId);
		}
	};
}

// Validation middleware
export function validateBody<T>(schema: z.ZodSchema<T>) {
	return async (
		request: Request,
	): Promise<{ data: T; error?: NextResponse }> => {
		try {
			const body = await request.json();
			const data = schema.parse(body);
			return { data };
		} catch (error) {
			if (error instanceof z.ZodError) {
				return {
					data: {} as T,
					error: ApiErrors.validationFailed(error.errors).toResponse(),
				};
			}
			return {
				data: {} as T,
				error: ApiErrors.validationFailed("Invalid JSON").toResponse(),
			};
		}
	};
}

// Query parameter validation
export function validateQuery<T>(
	schema: z.ZodSchema<T>,
	searchParams: URLSearchParams,
) {
	try {
		const params = Object.fromEntries(searchParams.entries());
		const data = schema.parse(params);
		return { data, error: null };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				data: null,
				error: ApiErrors.validationFailed(error.errors).toResponse(),
			};
		}
		return {
			data: null,
			error: ApiErrors.validationFailed(
				"Invalid query parameters",
			).toResponse(),
		};
	}
}
