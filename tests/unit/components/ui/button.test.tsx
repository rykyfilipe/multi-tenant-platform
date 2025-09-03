import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}))

// Mock @radix-ui/react-slot
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with default props', () => {
      render(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-slot', 'button')
    })

    it('should render button with custom className', () => {
      render(<Button className="custom-class">Click me</Button>)
      
      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toHaveClass('custom-class')
    })

    it('should render disabled button', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button', { name: 'Disabled' })
      expect(button).toBeDisabled()
    })

    it('should render button with custom type', () => {
      render(<Button type="submit">Submit</Button>)
      
      const button = screen.getByRole('button', { name: 'Submit' })
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button>Default</Button>)
      
      const button = screen.getByRole('button', { name: 'Default' })
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      
      const button = screen.getByRole('button', { name: 'Delete' })
      expect(button).toHaveClass('bg-destructive', 'text-white')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      
      const button = screen.getByRole('button', { name: 'Outline' })
      expect(button).toHaveClass('border', 'bg-background')
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      
      const button = screen.getByRole('button', { name: 'Secondary' })
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>)
      
      const button = screen.getByRole('button', { name: 'Ghost' })
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
    })

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>)
      
      const button = screen.getByRole('button', { name: 'Link' })
      expect(button).toHaveClass('text-primary', 'underline-offset-4')
    })
  })

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button>Default Size</Button>)
      
      const button = screen.getByRole('button', { name: 'Default Size' })
      expect(button).toHaveClass('h-9', 'px-4', 'py-2')
    })

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>)
      
      const button = screen.getByRole('button', { name: 'Small' })
      expect(button).toHaveClass('h-8', 'px-3')
    })

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>)
      
      const button = screen.getByRole('button', { name: 'Large' })
      expect(button).toHaveClass('h-10', 'px-6')
    })

    it('should render icon size', () => {
      render(<Button size="icon">Icon</Button>)
      
      const button = screen.getByRole('button', { name: 'Icon' })
      expect(button).toHaveClass('size-9')
    })
  })

  describe('AsChild', () => {
    it('should render as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )
      
      const link = screen.getByRole('link', { name: 'Link Button' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })

    it('should render as button when asChild is false', () => {
      render(<Button asChild={false}>Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Button' })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Event Handling', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button', { name: 'Click me' })
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not handle click events when disabled', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick} disabled>Disabled</Button>)
      
      const button = screen.getByRole('button', { name: 'Disabled' })
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should handle focus events', () => {
      const handleFocus = jest.fn()
      render(<Button onFocus={handleFocus}>Focus me</Button>)
      
      const button = screen.getByRole('button', { name: 'Focus me' })
      fireEvent.focus(button)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should handle blur events', () => {
      const handleBlur = jest.fn()
      render(<Button onBlur={handleBlur}>Blur me</Button>)
      
      const button = screen.getByRole('button', { name: 'Blur me' })
      fireEvent.blur(button)
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Custom label' })
      expect(button).toHaveAttribute('aria-label', 'Custom label')
    })

    it('should support aria-invalid attribute', () => {
      render(<Button aria-invalid="true">Invalid Button</Button>)
      
      const button = screen.getByRole('button', { name: 'Invalid Button' })
      expect(button).toHaveAttribute('aria-invalid', 'true')
    })

    it('should be focusable by default', () => {
      render(<Button>Focusable</Button>)
      
      const button = screen.getByRole('button', { name: 'Focusable' })
      button.focus()
      expect(button).toHaveFocus()
    })

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>)
      
      const button = screen.getByRole('button', { name: 'Not Focusable' })
      expect(button).toBeDisabled()
    })
  })

  describe('Combinations', () => {
    it('should combine variant and size correctly', () => {
      render(<Button variant="destructive" size="lg">Large Destructive</Button>)
      
      const button = screen.getByRole('button', { name: 'Large Destructive' })
      expect(button).toHaveClass('bg-destructive', 'h-10', 'px-6')
    })

    it('should combine custom className with variants', () => {
      render(<Button variant="outline" className="custom-class">Custom</Button>)
      
      const button = screen.getByRole('button', { name: 'Custom' })
      expect(button).toHaveClass('border', 'bg-background', 'custom-class')
    })

    it('should handle all props together', () => {
      const handleClick = jest.fn()
      render(
        <Button
          variant="secondary"
          size="sm"
          className="test-class"
          onClick={handleClick}
          disabled={false}
          type="button"
        >
          Complete Button
        </Button>
      )
      
      const button = screen.getByRole('button', { name: 'Complete Button' })
      expect(button).toHaveClass('bg-secondary', 'h-8', 'px-3', 'test-class')
      expect(button).toHaveAttribute('type', 'button')
      expect(button).not.toBeDisabled()
      
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})

describe('buttonVariants', () => {
  it('should generate correct classes for default variant', () => {
    const classes = buttonVariants()
    expect(classes).toContain('bg-primary')
    expect(classes).toContain('text-primary-foreground')
    expect(classes).toContain('h-9')
    expect(classes).toContain('px-4')
  })

  it('should generate correct classes for destructive variant', () => {
    const classes = buttonVariants({ variant: 'destructive' })
    expect(classes).toContain('bg-destructive')
    expect(classes).toContain('text-white')
  })

  it('should generate correct classes for small size', () => {
    const classes = buttonVariants({ size: 'sm' })
    expect(classes).toContain('h-8')
    expect(classes).toContain('px-3')
  })

  it('should generate correct classes for large size', () => {
    const classes = buttonVariants({ size: 'lg' })
    expect(classes).toContain('h-10')
    expect(classes).toContain('px-6')
  })

  it('should generate correct classes for icon size', () => {
    const classes = buttonVariants({ size: 'icon' })
    expect(classes).toContain('size-9')
  })

  it('should combine variant and size classes', () => {
    const classes = buttonVariants({ variant: 'outline', size: 'lg' })
    expect(classes).toContain('border')
    expect(classes).toContain('bg-background')
    expect(classes).toContain('h-10')
    expect(classes).toContain('px-6')
  })

  it('should include custom className', () => {
    const classes = buttonVariants({ className: 'custom-class' })
    expect(classes).toContain('custom-class')
  })
})
