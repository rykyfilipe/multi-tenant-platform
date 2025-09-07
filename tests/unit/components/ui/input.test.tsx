import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input with default props', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('data-slot', 'input')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should render input with custom type', () => {
      render(<Input type="email" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should render input with custom className', () => {
      render(<Input className="custom-class" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-class')
    })

    it('should render input with placeholder', () => {
      render(<Input placeholder="Enter your name" />)
      
      const input = screen.getByPlaceholderText('Enter your name')
      expect(input).toBeInTheDocument()
    })

    it('should render input with value', () => {
      render(<Input value="test value" readOnly />)
      
      const input = screen.getByDisplayValue('test value')
      expect(input).toBeInTheDocument()
    })

    it('should render disabled input', () => {
      render(<Input disabled />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('should render required input', () => {
      render(<Input required />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })
  })

  describe('Input Types', () => {
    it('should render text input', () => {
      render(<Input type="text" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should render email input', () => {
      render(<Input type="email" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should render password input', () => {
      render(<Input type="password" />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('should render number input', () => {
      render(<Input type="number" />)
      
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should render search input', () => {
      render(<Input type="search" />)
      
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('type', 'search')
    })

    it('should render tel input', () => {
      render(<Input type="tel" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'tel')
    })

    it('should render url input', () => {
      render(<Input type="url" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'url')
    })

    it('should render file input', () => {
      render(<Input type="file" />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'file')
    })

    it('should render color input', () => {
      render(<Input type="color" />)
      
      const input = screen.getByDisplayValue('#000000')
      expect(input).toHaveAttribute('type', 'color')
    })

    it('should render date input', () => {
      render(<Input type="date" />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'date')
    })

    it('should render time input', () => {
      render(<Input type="time" />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'time')
    })

    it('should render datetime-local input', () => {
      render(<Input type="datetime-local" />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'datetime-local')
    })

    it('should render month input', () => {
      render(<Input type="month" />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'month')
    })

    it('should render week input', () => {
      render(<Input type="week" />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'week')
    })

    it('should render range input', () => {
      render(<Input type="range" />)
      
      const input = screen.getByRole('slider')
      expect(input).toHaveAttribute('type', 'range')
    })

    it('should render hidden input', () => {
      render(<Input type="hidden" />)
      
      const input = screen.getByDisplayValue('')
      expect(input).toHaveAttribute('type', 'hidden')
    })
  })

  describe('Event Handling', () => {
    it('should handle change events', () => {
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'new value' } })
      
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'new value' })
        })
      )
    })

    it('should handle focus events', () => {
      const handleFocus = jest.fn()
      render(<Input onFocus={handleFocus} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      
      expect(handleFocus).toHaveBeenCalledTimes(1)
    })

    it('should handle blur events', () => {
      const handleBlur = jest.fn()
      render(<Input onBlur={handleBlur} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.blur(input)
      
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })

    it('should handle key down events', () => {
      const handleKeyDown = jest.fn()
      render(<Input onKeyDown={handleKeyDown} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Enter' })
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
    })

    it('should handle key up events', () => {
      const handleKeyUp = jest.fn()
      render(<Input onKeyUp={handleKeyUp} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.keyUp(input, { key: 'Enter' })
      
      expect(handleKeyUp).toHaveBeenCalledTimes(1)
    })

    it('should handle input events', () => {
      const handleInput = jest.fn()
      render(<Input onInput={handleInput} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.input(input, { target: { value: 'input value' } })
      
      expect(handleInput).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Input aria-label="Custom label" />)
      
      const input = screen.getByLabelText('Custom label')
      expect(input).toHaveAttribute('aria-label', 'Custom label')
    })

    it('should support aria-describedby', () => {
      render(<Input aria-describedby="description" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'description')
    })

    it('should support aria-invalid', () => {
      render(<Input aria-invalid="true" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('should support aria-required', () => {
      render(<Input aria-required="true" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-required', 'true')
    })

    it('should support aria-readonly', () => {
      render(<Input aria-readonly="true" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-readonly', 'true')
    })

    it('should support aria-disabled', () => {
      render(<Input aria-disabled="true" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-disabled', 'true')
    })

    it('should be focusable by default', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      input.focus()
      expect(input).toHaveFocus()
    })

    it('should not be focusable when disabled', () => {
      render(<Input disabled />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })
  })

  describe('Form Integration', () => {
    it('should work with form submission', () => {
      const handleSubmit = jest.fn((e) => e.preventDefault())
      render(
        <form onSubmit={handleSubmit}>
          <Input name="test" defaultValue="test value" />
          <button type="submit">Submit</button>
        </form>
      )
      
      const input = screen.getByDisplayValue('test value')
      const submitButton = screen.getByRole('button', { name: 'Submit' })
      
      expect(input).toHaveAttribute('name', 'test')
      
      fireEvent.click(submitButton)
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    it('should support form validation', () => {
      render(<Input required minLength={3} maxLength={10} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('required')
      expect(input).toHaveAttribute('minLength', '3')
      expect(input).toHaveAttribute('maxLength', '10')
    })

    it('should support pattern validation', () => {
      render(<Input pattern="[0-9]+" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]+')
    })
  })

  describe('Styling', () => {
    it('should have correct base classes', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass(
        'flex',
        'h-9',
        'w-full',
        'min-w-0',
        'rounded-md',
        'border',
        'bg-transparent',
        'px-3',
        'py-1',
        'text-sm',
        'sm:text-base'
      )
    })

    it('should have focus styles', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus-visible:border-ring', 'focus-visible:ring-ring/50')
    })

    it('should have disabled styles', () => {
      render(<Input disabled />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('disabled:pointer-events-none', 'disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('should have invalid styles', () => {
      render(<Input aria-invalid="true" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('aria-invalid:ring-destructive/20', 'aria-invalid:border-destructive')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Input value="" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('should handle null value', () => {
      render(<Input value={null as any} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('should handle undefined value', () => {
      render(<Input value={undefined as any} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('should handle numeric value', () => {
      render(<Input value={123 as any} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('123')
    })

    it('should handle boolean value', () => {
      render(<Input value={true as any} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('true')
    })
  })
})
