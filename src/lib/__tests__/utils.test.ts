import { describe, it, expect } from 'vitest';
import { cn, colExists } from '../utils';
import { Column, CreateColumnRequest } from '@/types/database';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle objects with boolean values', () => {
      expect(cn('base', { 'active': true, 'disabled': false })).toBe('base active');
    });

    it('should handle mixed input types', () => {
      expect(cn('base', ['class1', 'class2'], { 'active': true }, 'class3')).toBe('base class1 class2 active class3');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null, undefined)).toBe('');
    });

    it('should handle Tailwind class conflicts', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('colExists', () => {
    const mockColumns: Column[] = [
      {
        id: '1',
        name: 'name',
        type: 'text',
        required: false,
        unique: false,
        tableId: 'table1',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        isPublic: false,
        permissions: null
      },
      {
        id: '2',
        name: 'email',
        type: 'email',
        required: true,
        unique: true,
        tableId: 'table1',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        isPublic: false,
        permissions: null
      }
    ];

    it('should return the column if it exists', () => {
      const colRequest: CreateColumnRequest = {
        name: 'name',
        type: 'text',
        required: false,
        unique: false,
        description: null,
        isPublic: false
      };

      const result = colExists(mockColumns, colRequest);
      expect(result).toEqual(mockColumns[0]);
    });

    it('should return undefined if column does not exist', () => {
      const colRequest: CreateColumnRequest = {
        name: 'nonexistent',
        type: 'text',
        required: false,
        unique: false,
        description: null,
        isPublic: false
      };

      const result = colExists(mockColumns, colRequest);
      expect(result).toBeUndefined();
    });

    it('should handle case-sensitive matching', () => {
      const colRequest: CreateColumnRequest = {
        name: 'NAME',
        type: 'text',
        required: false,
        unique: false,
        description: null,
        isPublic: false
      };

      const result = colExists(mockColumns, colRequest);
      expect(result).toBeUndefined();
    });

    it('should handle empty columns array', () => {
      const colRequest: CreateColumnRequest = {
        name: 'name',
        type: 'text',
        required: false,
        unique: false,
        description: null,
        isPublic: false
      };

      const result = colExists([], colRequest);
      expect(result).toBeUndefined();
    });

    it('should match exact column name', () => {
      const colRequest: CreateColumnRequest = {
        name: 'email',
        type: 'email',
        required: true,
        unique: true,
        description: null,
        isPublic: false
      };

      const result = colExists(mockColumns, colRequest);
      expect(result).toEqual(mockColumns[1]);
    });
  });
}); 