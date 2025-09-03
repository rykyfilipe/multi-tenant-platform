import React from 'react'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('should render loading spinner with default props', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toBeInTheDocument()
    })

    it('should render loading spinner with custom className', () => {
      render(<LoadingSpinner className="custom-class" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('custom-class')
    })

    it('should render loading spinner with default size', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-8', 'w-8')
    })
  })

  describe('Sizes', () => {
    it('should render small size spinner', () => {
      render(<LoadingSpinner size="sm" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('should render medium size spinner', () => {
      render(<LoadingSpinner size="md" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('should render large size spinner', () => {
      render(<LoadingSpinner size="lg" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-32', 'w-32')
    })
  })

  describe('Styling', () => {
    it('should have correct base classes', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass(
        'animate-spin',
        'rounded-full',
        'border-b-2',
        'border-primary'
      )
    })

    it('should combine size and custom classes', () => {
      render(<LoadingSpinner size="lg" className="custom-class" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-32', 'w-32', 'custom-class')
    })

    it('should have animation classes', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should have border styling', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('border-b-2', 'border-primary')
    })

    it('should have rounded styling', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('rounded-full')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })

    it('should be hidden from screen readers', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Size Combinations', () => {
    it('should handle small size with custom class', () => {
      render(<LoadingSpinner size="sm" className="text-blue-500" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-4', 'w-4', 'text-blue-500')
    })

    it('should handle medium size with custom class', () => {
      render(<LoadingSpinner size="md" className="text-red-500" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-8', 'w-8', 'text-red-500')
    })

    it('should handle large size with custom class', () => {
      render(<LoadingSpinner size="lg" className="text-green-500" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('h-32', 'w-32', 'text-green-500')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty className', () => {
      render(<LoadingSpinner className="" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toBeInTheDocument()
    })

    it('should handle undefined className', () => {
      render(<LoadingSpinner className={undefined} />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toBeInTheDocument()
    })

    it('should handle multiple custom classes', () => {
      render(<LoadingSpinner className="class1 class2 class3" />)
      
      const spinner = screen.getByRole('status', { hidden: true })
      expect(spinner).toHaveClass('class1', 'class2', 'class3')
    })
  })

  describe('Visual States', () => {
    it('should maintain consistent styling across sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']
      
      sizes.forEach(size => {
        const { unmount } = render(<LoadingSpinner size={size} />)
        const spinner = screen.getByRole('status', { hidden: true })
        
        expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-b-2', 'border-primary')
        unmount()
      })
    })

    it('should have proper dimensions for each size', () => {
      const sizeMap = {
        sm: ['h-4', 'w-4'],
        md: ['h-8', 'w-8'],
        lg: ['h-32', 'w-32'],
      }

      Object.entries(sizeMap).forEach(([size, expectedClasses]) => {
        const { unmount } = render(<LoadingSpinner size={size as 'sm' | 'md' | 'lg'} />)
        const spinner = screen.getByRole('status', { hidden: true })
        
        expectedClasses.forEach(className => {
          expect(spinner).toHaveClass(className)
        })
        unmount()
      })
    })
  })
})
