import React from 'react';
import BaseWidget, { WIDGET_PRESETS, WidgetPreset } from './BaseWidget';

// Example component showing different widget styles
export function WidgetStyleExamples() {
  const examples = [
    {
      id: 'modern-example',
      title: 'Modern Style',
      preset: 'modern' as WidgetPreset,
      content: 'Clean and minimal design with subtle shadows and modern typography.'
    },
    {
      id: 'glass-example',
      title: 'Glass Morphism',
      preset: 'glass' as WidgetPreset,
      content: 'Frosted glass effect with backdrop blur and transparency.'
    },
    {
      id: 'dark-example',
      title: 'Dark Theme',
      preset: 'dark' as WidgetPreset,
      content: 'Dark background with light text for better contrast.'
    },
    {
      id: 'gradient-example',
      title: 'Gradient Style',
      preset: 'gradient' as WidgetPreset,
      content: 'Beautiful gradient background with vibrant colors.'
    },
    {
      id: 'luxury-example',
      title: 'Luxury Style',
      preset: 'luxury' as WidgetPreset,
      content: 'Premium design with golden accents and elegant typography.'
    },
    {
      id: 'compact-example',
      title: 'Compact Style',
      preset: 'compact' as WidgetPreset,
      content: 'Space-efficient design perfect for dense layouts.'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {examples.map((example) => (
        <BaseWidget
          key={example.id}
          widget={{
            id: example.id,
            title: example.title,
            type: 'example'
          }}
          preset={example.preset}
          isEditMode={false}
        >
          <div className="p-4">
            <p className="text-sm leading-relaxed">
              {example.content}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Preset: {example.preset}
              </span>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </BaseWidget>
      ))}
    </div>
  );
}

// Example of custom responsive styles
export function ResponsiveWidgetExample() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Responsive Widget Example</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <BaseWidget
          widget={{
            id: 'responsive-1',
            title: 'Mobile First',
            type: 'responsive'
          }}
          style={{
            responsive: {
              mobile: {
                padding: 'sm',
                titleSize: 'sm',
                height: 'min'
              },
              tablet: {
                padding: 'md',
                titleSize: 'base',
                height: 'min'
              },
              desktop: {
                padding: 'lg',
                titleSize: 'lg',
                height: 'min'
              },
              large: {
                padding: 'xl',
                titleSize: 'xl',
                height: 'min'
              }
            }
          }}
        >
          <div className="p-4">
            <p className="text-sm">
              This widget adapts its size and spacing based on screen size.
            </p>
          </div>
        </BaseWidget>

        <BaseWidget
          widget={{
            id: 'responsive-2',
            title: 'Flexible Layout',
            type: 'responsive'
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            responsive: {
              mobile: {
                padding: 'sm'
              },
              tablet: {
                padding: 'md'
              },
              desktop: {
                padding: 'lg'
              }
            }
          }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4"></div>
            <p className="text-sm font-medium">Centered Content</p>
          </div>
        </BaseWidget>

        <BaseWidget
          widget={{
            id: 'responsive-3',
            title: 'Grid Layout',
            type: 'responsive'
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gridGap: '1rem',
            padding: 'lg'
          }}
        >
          <div className="bg-blue-100 p-2 rounded text-center text-xs">Item 1</div>
          <div className="bg-green-100 p-2 rounded text-center text-xs">Item 2</div>
          <div className="bg-purple-100 p-2 rounded text-center text-xs">Item 3</div>
        </BaseWidget>
      </div>
    </div>
  );
}
