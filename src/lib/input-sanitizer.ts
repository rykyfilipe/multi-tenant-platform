/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL injection, and other security vulnerabilities
 */

import DOMPurify from 'isomorphic-dompurify';

export class InputSanitizer {
  /**
   * Sanitize string input to prevent XSS attacks
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Use DOMPurify for XSS protection
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
    
    // Additional sanitization for database queries
    sanitized = sanitized
      .replace(/['"\\]/g, '') // Remove quotes and backslashes
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim();
    
    return sanitized;
  }

  /**
   * Sanitize table/column names
   */
  static sanitizeIdentifier(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Only allow alphanumeric characters, underscores, and hyphens
    const sanitized = input
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .replace(/^[0-9]/, '') // Remove leading numbers
      .substring(0, 63); // Limit length
    
    return sanitized || 'unnamed';
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJson(input: any): any {
    if (input === null || input === undefined) {
      return null;
    }
    
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        return this.sanitizeJson(parsed);
      } catch {
        return this.sanitizeString(input);
      }
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeJson(item));
    }
    
    if (typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        const sanitizedKey = this.sanitizeIdentifier(key);
        sanitized[sanitizedKey] = this.sanitizeJson(value);
      }
      return sanitized;
    }
    
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    return input;
  }

  /**
   * Sanitize search terms
   */
  static sanitizeSearchTerm(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Remove special regex characters that could cause issues
    const sanitized = input
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special characters
      .replace(/['"\\]/g, '') // Remove quotes and backslashes
      .trim();
    
    return sanitized.substring(0, 1000); // Limit length
  }

  /**
   * Sanitize filter values
   */
  static sanitizeFilterValue(value: any, columnType: string): any {
    if (value === null || value === undefined) {
      return value;
    }
    
    switch (columnType) {
      case 'string':
      case 'text':
      case 'email':
      case 'url':
        return this.sanitizeString(String(value));
      
      case 'number':
      case 'integer':
      case 'decimal':
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      
      case 'boolean':
        return Boolean(value);
      
      case 'date':
      case 'datetime':
      case 'time':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      
      case 'reference':
        if (Array.isArray(value)) {
          return value.map(v => this.sanitizeFilterValue(v, 'number'));
        }
        return this.sanitizeFilterValue(value, 'number');
      
      case 'customArray':
        if (Array.isArray(value)) {
          return value.map(v => this.sanitizeString(String(v)));
        }
        return [this.sanitizeString(String(value))];
      
      default:
        return this.sanitizeJson(value);
    }
  }

  /**
   * Validate and sanitize table name
   */
  static validateTableName(name: string): { isValid: boolean; sanitized: string; error?: string } {
    if (!name || typeof name !== 'string') {
      return { isValid: false, sanitized: '', error: 'Table name is required' };
    }
    
    const sanitized = this.sanitizeIdentifier(name);
    
    if (sanitized.length === 0) {
      return { isValid: false, sanitized: '', error: 'Table name cannot be empty after sanitization' };
    }
    
    if (sanitized.length < 2) {
      return { isValid: false, sanitized: '', error: 'Table name must be at least 2 characters long' };
    }
    
    if (sanitized.length > 63) {
      return { isValid: false, sanitized: '', error: 'Table name must be less than 64 characters' };
    }
    
    // Check for reserved words
    const reservedWords = [
      'table', 'column', 'row', 'cell', 'database', 'user', 'tenant',
      'select', 'insert', 'update', 'delete', 'create', 'drop', 'alter',
      'where', 'from', 'join', 'group', 'order', 'having', 'limit', 'offset'
    ];
    
    if (reservedWords.includes(sanitized.toLowerCase())) {
      return { isValid: false, sanitized: '', error: 'Table name cannot be a reserved word' };
    }
    
    return { isValid: true, sanitized };
  }

  /**
   * Validate and sanitize column name
   */
  static validateColumnName(name: string): { isValid: boolean; sanitized: string; error?: string } {
    if (!name || typeof name !== 'string') {
      return { isValid: false, sanitized: '', error: 'Column name is required' };
    }
    
    const sanitized = this.sanitizeIdentifier(name);
    
    if (sanitized.length === 0) {
      return { isValid: false, sanitized: '', error: 'Column name cannot be empty after sanitization' };
    }
    
    if (sanitized.length < 1) {
      return { isValid: false, sanitized: '', error: 'Column name must be at least 1 character long' };
    }
    
    if (sanitized.length > 63) {
      return { isValid: false, sanitized: '', error: 'Column name must be less than 64 characters' };
    }
    
    // Check for reserved words
    const reservedWords = [
      'id', 'name', 'type', 'value', 'created', 'updated', 'deleted',
      'select', 'insert', 'update', 'delete', 'create', 'drop', 'alter',
      'where', 'from', 'join', 'group', 'order', 'having', 'limit', 'offset'
    ];
    
    if (reservedWords.includes(sanitized.toLowerCase())) {
      return { isValid: false, sanitized: '', error: 'Column name cannot be a reserved word' };
    }
    
    return { isValid: true, sanitized };
  }

  /**
   * Sanitize SQL query parameters
   */
  static sanitizeSqlParameter(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    
    if (typeof value === 'string') {
      // Escape single quotes and backslashes
      return value.replace(/'/g, "''").replace(/\\/g, '\\\\');
    }
    
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeSqlParameter(item));
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(this.sanitizeJson(value));
    }
    
    return value;
  }

  /**
   * Check for potential SQL injection patterns
   */
  static containsSqlInjection(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/i,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
      /(\b(CHAR|ASCII|SUBSTRING|LEN|COUNT)\b)/i,
      /(\b(WAITFOR|DELAY|SLEEP)\b)/i,
      /(\b(CAST|CONVERT)\b)/i,
      /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/i,
      /(\b(SP_|XP_)\w+)/i,
      /(\b(OPENROWSET|OPENDATASOURCE)\b)/i,
      /(\b(BULK|BULKINSERT)\b)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check for potential XSS patterns
   */
  static containsXSS(input: string): boolean {
    if (typeof input !== 'string') {
      return false;
    }
    
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<applet[^>]*>.*?<\/applet>/gi,
      /<form[^>]*>.*?<\/form>/gi,
      /<input[^>]*>.*?<\/input>/gi,
      /<textarea[^>]*>.*?<\/textarea>/gi,
      /<select[^>]*>.*?<\/select>/gi,
      /<option[^>]*>.*?<\/option>/gi,
      /<button[^>]*>.*?<\/button>/gi,
      /<link[^>]*>.*?<\/link>/gi,
      /<meta[^>]*>.*?<\/meta>/gi,
      /<style[^>]*>.*?<\/style>/gi,
      /<link[^>]*>.*?<\/link>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi,
      /onfocus\s*=/gi,
      /onblur\s*=/gi,
      /onchange\s*=/gi,
      /onsubmit\s*=/gi,
      /onreset\s*=/gi,
      /onselect\s*=/gi,
      /onkeydown\s*=/gi,
      /onkeyup\s*=/gi,
      /onkeypress\s*=/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
}
