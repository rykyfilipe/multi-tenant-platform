import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorPicker } from '@/components/ui/color-picker'

describe('ColorPicker Component', () => {
  describe('Rendering', () => {
    it('should render color picker with default props', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      const textInput = screen.getByPlaceholderText('#000000')
      
      expect(colorInput).toBeInTheDocument()
      expect(textInput).toBeInTheDocument()
    })

    it('should render color picker with custom className', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#ff0000" onChange={handleChange} className="custom-class" />)
      
      const [colorInput] = screen.getAllByDisplayValue('#ff0000')
      expect(colorInput).toHaveClass('custom-class')
    })
  })

  describe('Event Handling', () => {
    it('should handle color input change', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      fireEvent.change(colorInput, { target: { value: '#ff0000' } })
      
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith('#ff0000')
    })

    it('should handle text input change', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} />)
      
      const textInput = screen.getByPlaceholderText('#000000')
      fireEvent.change(textInput, { target: { value: '#00ff00' } })
      
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith('#00ff00')
    })

    it('should handle multiple changes', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      const textInput = screen.getByPlaceholderText('#000000')
      
      fireEvent.change(colorInput, { target: { value: '#ff0000' } })
      fireEvent.change(textInput, { target: { value: '#00ff00' } })
      
      expect(handleChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('Styling', () => {
    it('should have correct layout classes', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      const container = colorInput.parentElement
      expect(container).toHaveClass('flex', 'items-center', 'gap-2')
    })

    it('should have correct color input classes', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      expect(colorInput).toHaveClass('w-16', 'h-10', 'p-1')
    })

    it('should apply custom className to color input', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} className="custom-class" />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      expect(colorInput).toHaveClass('w-16', 'h-10', 'p-1', 'custom-class')
    })
  })

  describe('Value Handling', () => {
    it('should handle hex color values', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#ff0000" onChange={handleChange} />)
      
      const [colorInput] = screen.getAllByDisplayValue('#ff0000')
      const [, textInput] = screen.getAllByDisplayValue('#ff0000')
      
      expect(colorInput).toHaveValue('#ff0000')
      expect(textInput).toHaveValue('#ff0000')
    })

    it('should handle empty values', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="" onChange={handleChange} />)
      
      const colorInput = screen.getByDisplayValue('')
      const textInput = screen.getByPlaceholderText('#000000')
      
      expect(colorInput).toHaveValue('')
      expect(textInput).toHaveValue('')
    })
  })

  describe('Accessibility', () => {
    it('should have proper input types', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      const textInput = screen.getByPlaceholderText('#000000')
      
      expect(colorInput).toHaveAttribute('type', 'color')
      expect(textInput).toHaveAttribute('type', 'text')
    })

    it('should have proper placeholder', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} />)
      
      const textInput = screen.getByPlaceholderText('#000000')
      expect(textInput).toHaveAttribute('placeholder', '#000000')
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined className', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} className={undefined} />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      expect(colorInput).toHaveClass('w-16', 'h-10', 'p-1')
    })

    it('should handle empty className', () => {
      const handleChange = jest.fn()
      render(<ColorPicker value="#000000" onChange={handleChange} className="" />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      expect(colorInput).toHaveClass('w-16', 'h-10', 'p-1')
    })
  })

  describe('Integration', () => {
    it('should work with controlled component pattern', () => {
      const TestComponent = () => {
        const [color, setColor] = React.useState('#000000')
        return (
          <div>
            <ColorPicker value={color} onChange={setColor} />
            <div data-testid="color-display">{color}</div>
          </div>
        )
      }

      render(<TestComponent />)
      
      const [colorInput] = screen.getAllByDisplayValue('#000000')
      const colorDisplay = screen.getByTestId('color-display')
      
      expect(colorDisplay).toHaveTextContent('#000000')
      
      fireEvent.change(colorInput, { target: { value: '#ff0000' } })
      expect(colorDisplay).toHaveTextContent('#ff0000')
    })
  })
})