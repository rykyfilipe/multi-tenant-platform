import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  describe('rendering', () => {
    it('should render input with default props', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('data-slot', 'input');
    });

    it('should render input with custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should render input with different types', () => {
      const { rerender } = render(<Input type="text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');

      rerender(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'password');

      rerender(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');

      rerender(<Input type="tel" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel');

      rerender(<Input type="url" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'url');

      rerender(<Input type="search" />);
      expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');

      rerender(<Input type="date" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'date');

      rerender(<Input type="time" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'time');

      rerender(<Input type="datetime-local" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'datetime-local');

      rerender(<Input type="month" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'month');

      rerender(<Input type="week" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'week');

      rerender(<Input type="file" />);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'file');

      rerender(<Input type="checkbox" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('type', 'checkbox');

      rerender(<Input type="radio" />);
      expect(screen.getByRole('radio')).toHaveAttribute('type', 'radio');

      rerender(<Input type="range" />);
      expect(screen.getByRole('slider')).toHaveAttribute('type', 'range');

      rerender(<Input type="color" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'color');

      rerender(<Input type="hidden" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'hidden');
    });

    it('should render input with all HTML input attributes', () => {
      render(
        <Input
          id="test-input"
          name="testName"
          value="test value"
          placeholder="Enter text"
          required
          disabled
          readOnly
          maxLength={100}
          minLength={5}
          pattern="[A-Za-z]+"
          autoComplete="name"
          autoFocus
          aria-label="Test input"
          data-testid="test-input"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'test-input');
      expect(input).toHaveAttribute('name', 'testName');
      expect(input).toHaveValue('test value');
      expect(input).toHaveAttribute('placeholder', 'Enter text');
      expect(input).toBeRequired();
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveAttribute('maxlength', '100');
      expect(input).toHaveAttribute('minlength', '5');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
      expect(input).toHaveAttribute('autocomplete', 'name');
      expect(input).toHaveAttribute('aria-label', 'Test input');
      expect(input).toHaveAttribute('data-testid', 'test-input');
    });

    it('should handle value changes', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: 'new value' })
        })
      );
    });

    it('should handle input events', () => {
      const handleInput = vi.fn();
      render(<Input onInput={handleInput} />);

      const input = screen.getByRole('textbox');
      fireEvent.input(input, { target: { value: 'input value' } });

      expect(handleInput).toHaveBeenCalledTimes(1);
    });

    it('should handle focus and blur events', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleKeyPress = vi.fn();

      render(
        <Input
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onKeyPress={handleKeyPress}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(input, { key: 'Enter' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);

      fireEvent.keyPress(input, { key: 'a' });
      expect(handleKeyPress).toHaveBeenCalledTimes(1);
    });

    it('should handle mouse events', () => {
      const handleMouseEnter = vi.fn();
      const handleMouseLeave = vi.fn();
      const handleMouseDown = vi.fn();
      const handleMouseUp = vi.fn();

      render(
        <Input
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.mouseEnter(input);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);

      fireEvent.mouseLeave(input);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);

      fireEvent.mouseDown(input);
      expect(handleMouseDown).toHaveBeenCalledTimes(1);

      fireEvent.mouseUp(input);
      expect(handleMouseUp).toHaveBeenCalledTimes(1);
    });

    it('should handle form events', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      const handleReset = vi.fn();

      render(
        <form onSubmit={handleSubmit} onReset={handleReset}>
          <Input name="test" />
          <button type="submit">Submit</button>
          <button type="reset">Reset</button>
        </form>
      );

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      const resetButton = screen.getByRole('button', { name: 'Reset' });

      fireEvent.click(submitButton);
      expect(handleSubmit).toHaveBeenCalledTimes(1);

      fireEvent.click(resetButton);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });

    it('should handle paste and copy events', () => {
      const handlePaste = vi.fn();
      const handleCopy = vi.fn();
      const handleCut = vi.fn();

      render(
        <Input
          onPaste={handlePaste}
          onCopy={handleCopy}
          onCut={handleCut}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.paste(input);
      expect(handlePaste).toHaveBeenCalledTimes(1);

      fireEvent.copy(input);
      expect(handleCopy).toHaveBeenCalledTimes(1);

      fireEvent.cut(input);
      expect(handleCut).toHaveBeenCalledTimes(1);
    });

    it('should handle drag and drop events', () => {
      const handleDragStart = vi.fn();
      const handleDragOver = vi.fn();
      const handleDrop = vi.fn();

      render(
        <Input
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.dragStart(input);
      expect(handleDragStart).toHaveBeenCalledTimes(1);

      fireEvent.dragOver(input);
      expect(handleDragOver).toHaveBeenCalledTimes(1);

      fireEvent.drop(input);
      expect(handleDrop).toHaveBeenCalledTimes(1);
    });

    it('should handle composition events', () => {
      const handleCompositionStart = vi.fn();
      const handleCompositionUpdate = vi.fn();
      const handleCompositionEnd = vi.fn();

      render(
        <Input
          onCompositionStart={handleCompositionStart}
          onCompositionUpdate={handleCompositionUpdate}
          onCompositionEnd={handleCompositionEnd}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.compositionStart(input);
      expect(handleCompositionStart).toHaveBeenCalledTimes(1);

      fireEvent.compositionUpdate(input);
      expect(handleCompositionUpdate).toHaveBeenCalledTimes(1);

      fireEvent.compositionEnd(input);
      expect(handleCompositionEnd).toHaveBeenCalledTimes(1);
    });

    it('should handle touch events', () => {
      const handleTouchStart = vi.fn();
      const handleTouchMove = vi.fn();
      const handleTouchEnd = vi.fn();

      render(
        <Input
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.touchStart(input);
      expect(handleTouchStart).toHaveBeenCalledTimes(1);

      fireEvent.touchMove(input);
      expect(handleTouchMove).toHaveBeenCalledTimes(1);

      fireEvent.touchEnd(input);
      expect(handleTouchEnd).toHaveBeenCalledTimes(1);
    });

    it('should handle scroll events', () => {
      const handleScroll = vi.fn();

      render(<Input onScroll={handleScroll} />);

      const input = screen.getByRole('textbox');
      fireEvent.scroll(input);
      expect(handleScroll).toHaveBeenCalledTimes(1);
    });

    it('should handle wheel events', () => {
      const handleWheel = vi.fn();

      render(<Input onWheel={handleWheel} />);

      const input = screen.getByRole('textbox');
      fireEvent.wheel(input);
      expect(handleWheel).toHaveBeenCalledTimes(1);
    });

    it('should handle context menu events', () => {
      const handleContextMenu = vi.fn();

      render(<Input onContextMenu={handleContextMenu} />);

      const input = screen.getByRole('textbox');
      fireEvent.contextMenu(input);
      expect(handleContextMenu).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid events', () => {
      const handleInvalid = vi.fn();

      render(<Input onInvalid={handleInvalid} required />);

      const input = screen.getByRole('textbox');
      fireEvent.invalid(input);
      expect(handleInvalid).toHaveBeenCalledTimes(1);
    });

    it('should handle before input events', () => {
      const handleBeforeInput = vi.fn();

      render(<Input onBeforeInput={handleBeforeInput} />);

      const input = screen.getByRole('textbox');
      fireEvent.beforeInput(input);
      expect(handleBeforeInput).toHaveBeenCalledTimes(1);
    });

    it('should handle select events', () => {
      const handleSelect = vi.fn();

      render(<Input onSelect={handleSelect} value="test value" />);

      const input = screen.getByRole('textbox');
      fireEvent.select(input);
      expect(handleSelect).toHaveBeenCalledTimes(1);
    });

    it('should handle search events', () => {
      const handleSearch = vi.fn();

      render(<Input type="search" onSearch={handleSearch} />);

      const input = screen.getByRole('searchbox');
      fireEvent.search(input);
      expect(handleSearch).toHaveBeenCalledTimes(1);
    });

    it('should handle file input events', () => {
      const handleChange = vi.fn();

      render(<Input type="file" onChange={handleChange} />);

      const input = screen.getByRole('button');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(input, { target: { files: [file] } });

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should handle checkbox events', () => {
      const handleChange = vi.fn();

      render(<Input type="checkbox" onChange={handleChange} />);

      const input = screen.getByRole('checkbox');
      fireEvent.click(input);

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should handle radio events', () => {
      const handleChange = vi.fn();

      render(<Input type="radio" onChange={handleChange} />);

      const input = screen.getByRole('radio');
      fireEvent.click(input);

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should handle range input events', () => {
      const handleChange = vi.fn();

      render(<Input type="range" onChange={handleChange} />);

      const input = screen.getByRole('slider');
      fireEvent.change(input, { target: { value: '50' } });

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should handle color input events', () => {
      const handleChange = vi.fn();

      render(<Input type="color" onChange={handleChange} />);

      const input = screen.getByDisplayValue('');
      fireEvent.change(input, { target: { value: '#ff0000' } });

      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Input
          aria-label="Test input"
          aria-describedby="description"
          aria-required="true"
          aria-invalid="true"
          aria-readonly="true"
          aria-disabled="true"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Test input');
      expect(input).toHaveAttribute('aria-describedby', 'description');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-readonly', 'true');
      expect(input).toHaveAttribute('aria-disabled', 'true');
    });

    it('should be focusable', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(input).toHaveFocus();
    });

    it('should handle keyboard navigation', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      fireEvent.keyDown(input, { key: 'Tab' });
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'Escape' });
      
      // Should not throw errors
      expect(input).toBeInTheDocument();
    });

    it('should handle screen reader announcements', () => {
      render(
        <Input
          aria-live="polite"
          aria-atomic="true"
          aria-relevant="additions removals"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-live', 'polite');
      expect(input).toHaveAttribute('aria-atomic', 'true');
      expect(input).toHaveAttribute('aria-relevant', 'additions removals');
    });
  });

  describe('styling', () => {
    it('should have correct base classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'file:text-foreground',
        'placeholder:text-muted-foreground',
        'selection:bg-primary',
        'selection:text-primary-foreground',
        'dark:bg-input/30',
        'border-input',
        'flex',
        'h-9',
        'w-full',
        'min-w-0',
        'rounded-md',
        'border',
        'bg-transparent',
        'px-3',
        'py-1',
        'text-base',
        'shadow-xs',
        'transition-[color,box-shadow]',
        'outline-none'
      );
    });

    it('should have focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'focus-visible:border-ring',
        'focus-visible:ring-ring/50',
        'focus-visible:ring-[3px]'
      );
    });

    it('should have invalid state styles', () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'aria-invalid:ring-destructive/20',
        'dark:aria-invalid:ring-destructive/40',
        'aria-invalid:border-destructive'
      );
    });

    it('should have disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'disabled:pointer-events-none',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });

    it('should have file input specific styles', () => {
      render(<Input type="file" />);
      const input = screen.getByRole('button');
      expect(input).toHaveClass(
        'file:inline-flex',
        'file:h-7',
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium'
      );
    });

    it('should have responsive text size', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('md:text-sm');
    });
  });

  describe('edge cases', () => {
    it('should handle empty value', () => {
      render(<Input value="" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle null value', () => {
      render(<Input value={null as any} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle undefined value', () => {
      render(<Input value={undefined as any} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle controlled component', () => {
      render(<Input value="controlled value" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('controlled value');
    });

    it('should handle uncontrolled component', () => {
      render(<Input defaultValue="default value" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('default value');
    });

    it('should handle ref forwarding', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });

    it('should handle all HTML input event handlers', () => {
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

      render(<Input {...handlers} />);
      const input = screen.getByRole('textbox');

      // Test a few key events
      fireEvent.focus(input);
      fireEvent.blur(input);
      fireEvent.change(input);
      fireEvent.keyDown(input);

      // Should not throw errors
      expect(input).toBeInTheDocument();
    });

    it('should handle form validation', () => {
      render(
        <form>
          <Input
            required
            minLength={5}
            maxLength={10}
            pattern="[A-Za-z]+"
            title="Only letters allowed"
          />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('minlength', '5');
      expect(input).toHaveAttribute('maxlength', '10');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
      expect(input).toHaveAttribute('title', 'Only letters allowed');
    });

    it('should handle autocomplete attributes', () => {
      render(
        <Input
          autoComplete="name"
          autoCorrect="on"
          autoCapitalize="words"
          autoSave="true"
          spellCheck="true"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autocomplete', 'name');
      expect(input).toHaveAttribute('autocorrect', 'on');
      expect(input).toHaveAttribute('autocapitalize', 'words');
      expect(input).toHaveAttribute('autosave', 'true');
      expect(input).toHaveAttribute('spellcheck', 'true');
    });

    it('should handle step and min/max for number inputs', () => {
      render(
        <Input
          type="number"
          min="0"
          max="100"
          step="5"
        />
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
      expect(input).toHaveAttribute('step', '5');
    });

    it('should handle multiple file selection', () => {
      render(<Input type="file" multiple />);
      const input = screen.getByRole('button');
      expect(input).toHaveAttribute('multiple');
    });

    it('should handle accept attribute for file inputs', () => {
      render(<Input type="file" accept=".pdf,.doc" />);
      const input = screen.getByRole('button');
      expect(input).toHaveAttribute('accept', '.pdf,.doc');
    });

    it('should handle capture attribute for file inputs', () => {
      render(<Input type="file" capture="environment" />);
      const input = screen.getByRole('button');
      expect(input).toHaveAttribute('capture', 'environment');
    });
  });
}); 