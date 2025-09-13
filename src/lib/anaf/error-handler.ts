/** @format */

import { ANAFError } from './types';
import prisma from '../prisma';

export enum ANAFErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  XML_GENERATION_ERROR = 'XML_GENERATION_ERROR',
  TOKEN_ERROR = 'TOKEN_ERROR',
  SUBMISSION_ERROR = 'SUBMISSION_ERROR',
  STATUS_CHECK_ERROR = 'STATUS_CHECK_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ANAFErrorContext {
  userId?: number;
  tenantId?: number;
  invoiceId?: number;
  submissionId?: string;
  operation?: string;
  endpoint?: string;
  requestData?: any;
  responseData?: any;
}

export class ANAFErrorHandler {
  /**
   * Create a standardized ANAF error
   */
  static createError(
    type: ANAFErrorType,
    message: string,
    details?: string,
    context?: ANAFErrorContext
  ): ANAFError {
    return {
      code: type,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle and log ANAF errors
   */
  static async handleError(
    error: Error | ANAFError,
    context?: ANAFErrorContext
  ): Promise<ANAFError> {
    const anafError = this.normalizeError(error);
    
    // Log error to database
    await this.logError(anafError, context);
    
    // Log error to console
    this.logToConsole(anafError, context);
    
    return anafError;
  }

  /**
   * Normalize different error types to ANAFError
   */
  private static normalizeError(error: Error | ANAFError): ANAFError {
    if ('code' in error && 'timestamp' in error) {
      return error as ANAFError;
    }

    const err = error as Error;
    const type = this.categorizeError(err);
    
    return {
      code: type,
      message: err.message,
      details: err.stack,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Categorize error based on message and type
   */
  private static categorizeError(error: Error): ANAFErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ANAFErrorType.AUTHENTICATION_ERROR;
    }
    
    if (message.includes('forbidden') || message.includes('authorization')) {
      return ANAFErrorType.AUTHORIZATION_ERROR;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ANAFErrorType.VALIDATION_ERROR;
    }
    
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return ANAFErrorType.NETWORK_ERROR;
    }
    
    if (message.includes('api') || message.includes('http')) {
      return ANAFErrorType.API_ERROR;
    }
    
    if (message.includes('xml') || message.includes('generation')) {
      return ANAFErrorType.XML_GENERATION_ERROR;
    }
    
    if (message.includes('token') || message.includes('jwt')) {
      return ANAFErrorType.TOKEN_ERROR;
    }
    
    if (message.includes('submission') || message.includes('submit')) {
      return ANAFErrorType.SUBMISSION_ERROR;
    }
    
    if (message.includes('status') || message.includes('check')) {
      return ANAFErrorType.STATUS_CHECK_ERROR;
    }
    
    if (message.includes('download')) {
      return ANAFErrorType.DOWNLOAD_ERROR;
    }
    
    return ANAFErrorType.UNKNOWN_ERROR;
  }

  /**
   * Log error to database
   */
  private static async logError(error: ANAFError, context?: ANAFErrorContext): Promise<void> {
    try {
      await prisma.errorLog.create({
        data: {
          tenantId: context?.tenantId || 0,
          userId: context?.userId,
          errorType: error.code,
          errorMessage: error.message,
          stackTrace: error.details,
          endpoint: context?.endpoint,
          metadata: {
            operation: context?.operation,
            invoiceId: context?.invoiceId,
            submissionId: context?.submissionId,
            requestData: context?.requestData,
            responseData: context?.responseData,
            timestamp: error.timestamp
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log ANAF error to database:', logError);
    }
  }

  /**
   * Log error to console with proper formatting
   */
  private static logToConsole(error: ANAFError, context?: ANAFErrorContext): void {
    const logData = {
      type: 'ANAF_ERROR',
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      context: {
        userId: context?.userId,
        tenantId: context?.tenantId,
        invoiceId: context?.invoiceId,
        submissionId: context?.submissionId,
        operation: context?.operation,
        endpoint: context?.endpoint
      }
    };

    if (error.code === ANAFErrorType.API_ERROR || error.code === ANAFErrorType.NETWORK_ERROR) {
      console.error('ANAF API Error:', logData);
    } else if (error.code === ANAFErrorType.AUTHENTICATION_ERROR || error.code === ANAFErrorType.TOKEN_ERROR) {
      console.warn('ANAF Authentication Error:', logData);
    } else {
      console.error('ANAF Error:', logData);
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: ANAFError): string {
    switch (error.code) {
      case ANAFErrorType.AUTHENTICATION_ERROR:
        return 'Eroare de autentificare cu ANAF. Vă rugăm să vă autentificați din nou.';
      
      case ANAFErrorType.AUTHORIZATION_ERROR:
        return 'Nu aveți permisiuni pentru această operațiune ANAF.';
      
      case ANAFErrorType.VALIDATION_ERROR:
        return 'Datele facturii nu sunt valide. Vă rugăm să verificați informațiile introduse.';
      
      case ANAFErrorType.NETWORK_ERROR:
        return 'Eroare de rețea. Vă rugăm să încercați din nou mai târziu.';
      
      case ANAFErrorType.API_ERROR:
        return 'Eroare la comunicarea cu ANAF. Vă rugăm să încercați din nou.';
      
      case ANAFErrorType.XML_GENERATION_ERROR:
        return 'Eroare la generarea XML-ului facturii. Vă rugăm să contactați suportul tehnic.';
      
      case ANAFErrorType.TOKEN_ERROR:
        return 'Token-ul de acces a expirat. Vă rugăm să vă autentificați din nou.';
      
      case ANAFErrorType.SUBMISSION_ERROR:
        return 'Eroare la trimiterea facturii către ANAF. Vă rugăm să încercați din nou.';
      
      case ANAFErrorType.STATUS_CHECK_ERROR:
        return 'Eroare la verificarea statusului facturii. Vă rugăm să încercați din nou.';
      
      case ANAFErrorType.DOWNLOAD_ERROR:
        return 'Eroare la descărcarea răspunsului ANAF. Vă rugăm să încercați din nou.';
      
      default:
        return 'A apărut o eroare neașteptată. Vă rugăm să contactați suportul tehnic.';
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: ANAFError): boolean {
    const retryableTypes = [
      ANAFErrorType.NETWORK_ERROR,
      ANAFErrorType.API_ERROR,
      ANAFErrorType.SUBMISSION_ERROR,
      ANAFErrorType.STATUS_CHECK_ERROR,
      ANAFErrorType.DOWNLOAD_ERROR
    ];
    
    return retryableTypes.includes(error.code as ANAFErrorType);
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: ANAFError, attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const backoffMultiplier = 2;
    
    const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return Math.floor(delay + jitter);
  }

  /**
   * Get error statistics for monitoring
   */
  static async getErrorStatistics(tenantId?: number, days: number = 7): Promise<{
    totalErrors: number;
    errorsByType: { [key: string]: number };
    recentErrors: any[];
  }> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const whereClause = {
        errorType: {
          startsWith: 'ANAF_'
        },
        createdAt: {
          gte: since
        },
        ...(tenantId && { tenantId })
      };

      const [totalErrors, errorsByType, recentErrors] = await Promise.all([
        prisma.errorLog.count({ where: whereClause }),
        prisma.errorLog.groupBy({
          by: ['errorType'],
          where: whereClause,
          _count: true
        }),
        prisma.errorLog.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            errorType: true,
            errorMessage: true,
            createdAt: true,
            metadata: true
          }
        })
      ]);

      const errorsByTypeMap = errorsByType.reduce((acc, item) => {
        acc[item.errorType] = item._count;
        return acc;
      }, {} as { [key: string]: number });

      return {
        totalErrors,
        errorsByType: errorsByTypeMap,
        recentErrors
      };
    } catch (error) {
      console.error('Error getting error statistics:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        recentErrors: []
      };
    }
  }

  /**
   * Clean up old error logs
   */
  static async cleanupOldErrors(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await prisma.errorLog.deleteMany({
        where: {
          errorType: {
            startsWith: 'ANAF_'
          },
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`Cleaned up ${result.count} old ANAF error logs`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up old error logs:', error);
      return 0;
    }
  }
}
