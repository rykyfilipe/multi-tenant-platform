/** @format */

import { NextResponse } from "next/server";

/**
 * Standardized API Response Module
 * Provides consistent success and error responses across all API endpoints
 */

// Success response builder
export class ApiSuccess {
	private response: any = {};

	static success(data?: any, message?: string): ApiSuccess {
		return new ApiSuccess().withData(data).withMessage(message || "Success");
	}

	withData(data: any): ApiSuccess {
		this.response.data = data;
		return this;
	}

	withMessage(message: string): ApiSuccess {
		this.response.message = message;
		return this;
	}

	withMeta(meta: any): ApiSuccess {
		this.response.meta = meta;
		return this;
	}

	withPagination(pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	}): ApiSuccess {
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

// Error response builder
export class ApiError {
	private error: any = {
		timestamp: new Date().toISOString(),
	};

	static badRequest(message: string, details?: any): ApiError {
		return new ApiError().withCode(400).withMessage(message).withDetails(details);
	}

	static unauthorized(message: string = "Unauthorized"): ApiError {
		return new ApiError().withCode(401).withMessage(message);
	}

	static forbidden(message: string = "Forbidden"): ApiError {
		return new ApiError().withCode(403).withMessage(message);
	}

	static notFound(message: string = "Not Found"): ApiError {
		return new ApiError().withCode(404).withMessage(message);
	}

	static conflict(message: string, details?: any): ApiError {
		return new ApiError().withCode(409).withMessage(message).withDetails(details);
	}

	static internalError(message: string = "Internal Server Error", details?: any): ApiError {
		return new ApiError().withCode(500).withMessage(message).withDetails(details);
	}

	withCode(code: number): ApiError {
		this.error.statusCode = code;
		return this;
	}

	withMessage(message: string): ApiError {
		this.error.message = message;
		return this;
	}

	withDetails(details: any): ApiError {
		this.error.details = details;
		return this;
	}

	withPath(path: string): ApiError {
		this.error.path = path;
		return this;
	}

	withRequestId(requestId: string): ApiError {
		this.error.requestId = requestId;
		return this;
	}

	toResponse(): NextResponse {
		return NextResponse.json(
			{
				success: false,
				...this.error,
			},
			{ status: this.error.statusCode },
		);
	}
}
