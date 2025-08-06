import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from '../button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render button with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('should render button with custom className', () => {
      render(<Button className="custom-class">Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render button with different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-primary');

      rerender(<Button variant="destructive">Destructive</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-destructive');

      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border', 'bg-background');

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-secondary');

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');

      rerender(<Button variant="link">Link</Button>);
      expect(screen.getByRole('button')).toHaveClass('text-primary', 'underline-offset-4');
    });

    it('should render button with different sizes', () => {
      const { rerender } = render(<Button size="default">Default</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-9', 'px-4', 'py-2');

      rerender(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-8', 'rounded-md', 'gap-1.5', 'px-3');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-10', 'rounded-md', 'px-6');

      rerender(<Button size="icon">Icon</Button>);
      expect(screen.getByRole('button')).toHaveClass('size-9');
    });

    it('should render button with all HTML button attributes', () => {
      render(
        <Button
          type="submit"
          disabled
          aria-label="Submit form"
          data-testid="submit-button"
        >
          Submit
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-label', 'Submit form');
      expect(button).toHaveAttribute('data-testid', 'submit-button');
    });

    it('should render as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('should render with children and icons', () => {
      render(
        <Button>
          <span>Text</span>
          <svg data-testid="icon">Icon</svg>
        </Button>
      );

      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should handle focus and blur events', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus Test
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.focus(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();

      render(
        <Button onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
          Keyboard Test
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: 'Enter' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
    });

    it('should handle mouse events', () => {
      const handleMouseEnter = vi.fn();
      const handleMouseLeave = vi.fn();

      render(
        <Button onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          Mouse Test
        </Button>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);

      fireEvent.mouseLeave(button);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('should handle form submission', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should handle aria-invalid attribute', () => {
      render(<Button aria-invalid="true">Invalid Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-invalid', 'true');
      expect(button).toHaveClass('aria-invalid:ring-destructive/20');
    });

    it('should handle data-slot attribute', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-slot', 'button');
    });
  });

  describe('buttonVariants', () => {
    it('should generate correct classes for different variants', () => {
      expect(buttonVariants({ variant: 'default' })).toContain('bg-primary');
      expect(buttonVariants({ variant: 'destructive' })).toContain('bg-destructive');
      expect(buttonVariants({ variant: 'outline' })).toContain('border');
      expect(buttonVariants({ variant: 'secondary' })).toContain('bg-secondary');
      expect(buttonVariants({ variant: 'ghost' })).toContain('hover:bg-accent');
      expect(buttonVariants({ variant: 'link' })).toContain('text-primary');
    });

    it('should generate correct classes for different sizes', () => {
      expect(buttonVariants({ size: 'default' })).toContain('h-9');
      expect(buttonVariants({ size: 'sm' })).toContain('h-8');
      expect(buttonVariants({ size: 'lg' })).toContain('h-10');
      expect(buttonVariants({ size: 'icon' })).toContain('size-9');
    });

    it('should combine variant and size classes', () => {
      const classes = buttonVariants({ variant: 'default', size: 'lg' });
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('h-10');
    });

    it('should include custom className', () => {
      const classes = buttonVariants({ className: 'custom-class' });
      expect(classes).toContain('custom-class');
    });

    it('should use default variants when none provided', () => {
      const classes = buttonVariants({});
      expect(classes).toContain('bg-primary'); // default variant
      expect(classes).toContain('h-9'); // default size
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Button
          aria-label="Custom label"
          aria-describedby="description"
          aria-expanded="true"
        >
          Test
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'description');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should be focusable', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should handle keyboard navigation', () => {
      render(<Button>Keyboard</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyDown(button, { key: ' ' });
      
      // Should not throw errors
      expect(button).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<Button>{null}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(<Button>{undefined}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle complex children', () => {
      render(
        <Button>
          {[<span key="1">Text 1</span>, <span key="2">Text 2</span>]}
        </Button>
      );

      expect(screen.getByText('Text 1')).toBeInTheDocument();
      expect(screen.getByText('Text 2')).toBeInTheDocument();
    });

    it('should handle ref forwarding', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Ref Test</Button>);
      expect(ref).toHaveBeenCalled();
    });

    it('should handle all HTML button event handlers', () => {
      const handlers = {
        onAbort: vi.fn(),
        onBeforeInput: vi.fn(),
        onCanPlay: vi.fn(),
        onCanPlayThrough: vi.fn(),
        onChange: vi.fn(),
        onCompositionEnd: vi.fn(),
        onCompositionStart: vi.fn(),
        onCompositionUpdate: vi.fn(),
        onContextMenu: vi.fn(),
        onCopy: vi.fn(),
        onCut: vi.fn(),
        onDoubleClick: vi.fn(),
        onDrag: vi.fn(),
        onDragEnd: vi.fn(),
        onDragEnter: vi.fn(),
        onDragExit: vi.fn(),
        onDragLeave: vi.fn(),
        onDragOver: vi.fn(),
        onDragStart: vi.fn(),
        onDrop: vi.fn(),
        onDurationChange: vi.fn(),
        onEmptied: vi.fn(),
        onEncrypted: vi.fn(),
        onEnded: vi.fn(),
        onError: vi.fn(),
        onFocus: vi.fn(),
        onInput: vi.fn(),
        onInvalid: vi.fn(),
        onKeyDown: vi.fn(),
        onKeyPress: vi.fn(),
        onKeyUp: vi.fn(),
        onLoad: vi.fn(),
        onLoadStart: vi.fn(),
        onLoadedData: vi.fn(),
        onLoadedMetadata: vi.fn(),
        onMouseDown: vi.fn(),
        onMouseEnter: vi.fn(),
        onMouseLeave: vi.fn(),
        onMouseMove: vi.fn(),
        onMouseOut: vi.fn(),
        onMouseOver: vi.fn(),
        onMouseUp: vi.fn(),
        onPaste: vi.fn(),
        onPause: vi.fn(),
        onPlay: vi.fn(),
        onPlaying: vi.fn(),
        onProgress: vi.fn(),
        onRateChange: vi.fn(),
        onReset: vi.fn(),
        onScroll: vi.fn(),
        onSeeked: vi.fn(),
        onSeeking: vi.fn(),
        onSelect: vi.fn(),
        onStalled: vi.fn(),
        onSubmit: vi.fn(),
        onSuspend: vi.fn(),
        onTimeUpdate: vi.fn(),
        onTouchCancel: vi.fn(),
        onTouchEnd: vi.fn(),
        onTouchMove: vi.fn(),
        onTouchStart: vi.fn(),
        onTransitionEnd: vi.fn(),
        onVolumeChange: vi.fn(),
        onWaiting: vi.fn(),
        onWheel: vi.fn(),
      };

      render(<Button {...handlers}>Event Test</Button>);
      const button = screen.getByRole('button');

      // Test a few key events
      fireEvent.click(button);
      fireEvent.focus(button);
      fireEvent.blur(button);
      fireEvent.keyDown(button);
      fireEvent.mouseEnter(button);

      // Should not throw errors
      expect(button).toBeInTheDocument();
    });
  });
}); 