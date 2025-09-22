'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
  showPresets?: boolean;
  showInput?: boolean;
}

// Predefined color presets
const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#808080', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000',
  '#FFC0CB', '#A52A2A', '#000080', '#808000', '#800000', '#008080',
  '#C0C0C0', '#FFD700', '#FF6347', '#40E0D0', '#EE82EE', '#90EE90'
];

export function ColorPicker({ 
  value, 
  onChange, 
  className,
  showPresets = true,
  showInput = true
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleColorChange = (color: string) => {
    onChange(color);
    setInputValue(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setInputValue(color);
    
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      onChange(color);
    }
  };

  const handleInputBlur = () => {
    // Reset to valid color if input is invalid
    if (!/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setInputValue(value);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-10 h-10 p-0 border-black/20 hover:bg-black/5"
            style={{ backgroundColor: value }}
          >
            <Palette className="h-4 w-4 text-black/70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-black">Choose Color</Label>
              <div className="mt-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-10 border border-black/20 rounded-md cursor-pointer"
                />
              </div>
            </div>

            {showInput && (
              <div>
                <Label className="text-sm font-medium text-black">Hex Code</Label>
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="#000000"
                  className="mt-1 font-mono text-sm"
                />
              </div>
            )}

            {showPresets && (
              <div>
                <Label className="text-sm font-medium text-black">Presets</Label>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={cn(
                        "w-8 h-8 rounded-md border-2 transition-all hover:scale-110",
                        value === color 
                          ? "border-black shadow-md" 
                          : "border-black/20 hover:border-black/40"
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {value === color && (
                        <Check className="w-4 h-4 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ColorPicker;