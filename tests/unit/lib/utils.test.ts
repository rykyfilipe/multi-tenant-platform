import { cn, colExists } from '@/lib/utils'
import { Column, CreateColumnRequest } from '@/types/database'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('class1', { class2: true, class3: false })
      expect(result).toBe('class1 class2')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('px-2', 'px-4')
      expect(result).toBe('px-4')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle complex combinations', () => {
      const result = cn(
        'base-class',
        { 'conditional-class': true },
        ['array-class1', 'array-class2'],
        'px-2',
        'px-4',
        undefined,
        null
      )
      expect(result).toBe('base-class conditional-class array-class1 array-class2 px-4')
    })
  })

  describe('colExists', () => {
    const mockColumns: Column[] = [
      {
        id: 1,
        tableId: 1,
        name: 'email',
        type: 'VARCHAR',
        required: true,
        isPrimaryKey: false,
        isForeignKey: false,
        referencedTableId: null,
        referencedColumnId: null,
        description: 'User email',
        showInInvoice: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        tableId: 1,
        name: 'name',
        type: 'VARCHAR',
        required: false,
        isPrimaryKey: false,
        isForeignKey: false,
        referencedTableId: null,
        referencedColumnId: null,
        description: 'User name',
        showInInvoice: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    it('should return existing column when found', () => {
      const newColumn: CreateColumnRequest = {
        name: 'email',
        type: 'VARCHAR',
        required: true,
        description: 'User email',
      }

      const result = colExists(mockColumns, newColumn)
      expect(result).toEqual(mockColumns[0])
    })

    it('should return undefined when column not found', () => {
      const newColumn: CreateColumnRequest = {
        name: 'phone',
        type: 'VARCHAR',
        required: false,
        description: 'User phone',
      }

      const result = colExists(mockColumns, newColumn)
      expect(result).toBeUndefined()
    })

    it('should handle case-sensitive column names', () => {
      const newColumn: CreateColumnRequest = {
        name: 'Email', // Different case
        type: 'VARCHAR',
        required: true,
        description: 'User email',
      }

      const result = colExists(mockColumns, newColumn)
      expect(result).toBeUndefined()
    })

    it('should handle empty columns array', () => {
      const newColumn: CreateColumnRequest = {
        name: 'email',
        type: 'VARCHAR',
        required: true,
        description: 'User email',
      }

      const result = colExists([], newColumn)
      expect(result).toBeUndefined()
    })

    it('should find column with exact name match', () => {
      const newColumn: CreateColumnRequest = {
        name: 'name',
        type: 'VARCHAR',
        required: false,
        description: 'User name',
      }

      const result = colExists(mockColumns, newColumn)
      expect(result).toEqual(mockColumns[1])
    })

    it('should handle columns with special characters in names', () => {
      const columnsWithSpecialChars: Column[] = [
        ...mockColumns,
        {
          id: 3,
          tableId: 1,
          name: 'user_id',
          type: 'INTEGER',
          required: true,
          isPrimaryKey: true,
          isForeignKey: false,
          referencedTableId: null,
          referencedColumnId: null,
          description: 'User ID',
          showInInvoice: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const newColumn: CreateColumnRequest = {
        name: 'user_id',
        type: 'INTEGER',
        required: true,
        description: 'User ID',
      }

      const result = colExists(columnsWithSpecialChars, newColumn)
      expect(result).toEqual(columnsWithSpecialChars[2])
    })

    it('should handle duplicate column names (should return first match)', () => {
      const columnsWithDuplicates: Column[] = [
        ...mockColumns,
        {
          id: 3,
          tableId: 2,
          name: 'email',
          type: 'TEXT',
          required: false,
          isPrimaryKey: false,
          isForeignKey: false,
          referencedTableId: null,
          referencedColumnId: null,
          description: 'Another email',
          showInInvoice: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const newColumn: CreateColumnRequest = {
        name: 'email',
        type: 'VARCHAR',
        required: true,
        description: 'User email',
      }

      const result = colExists(columnsWithDuplicates, newColumn)
      expect(result).toEqual(columnsWithDuplicates[0]) // Should return first match
    })
  })
})
