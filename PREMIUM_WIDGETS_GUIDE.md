# Premium Widgets Styling Guide

## 📚 Sistem Complet Implementat

Am creat un sistem complet de styling premium pentru toate widget-urile. Iată ce este disponibil:

### ✅ Ce am implementat:

1. **Sistema de Theme-uri Premium** (`src/widgets/styles/premiumStyles.ts`)
   - 8 theme-uri elegante: transparent, glass, minimal, luxury, dark-elegant, light-premium, gradient-soft, neo-brutalism
   - Interfețe TypeScript pentru fiecare tip de widget
   - 5 scheme de culori pentru chart-uri: default, pastel, vibrant, monochrome, luxury

2. **BaseWidget Actualizat** (`src/widgets/ui/components/BaseWidget.tsx`)
   - Acceptă `premiumStyle` prop
   - Aplică automat stilurile (background, borders, shadows, blur, etc.)
   - Suport pentru transparență completă
   - Animații smooth opcționale

3. **PremiumStyleEditor Component** (`src/widgets/ui/components/PremiumStyleEditor.tsx`)
   - Editor universal pentru toate tipurile de widget-uri
   - Tab-uri specifice pentru Chart, KPI, Table
   - Controale complete pentru toate opțiunile de styling

## 🎨 Theme-uri Disponibile

### 1. **Transparent** (Clean & Minimal)
```typescript
{
  background: 'transparent',
  border: 'none',
  borderRadius: '0',
  shadow: 'none',
  padding: '0'
}
```
**Perfect pentru**: Chart-uri overlay, dashboard-uri cu fundal custom

### 2. **Glass** (Modern & Elegant)
```typescript
{
  background: 'rgba(255, 255, 255, 0.05)',
  backdropBlur: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
}
```
**Perfect pentru**: Widget-uri moderne, design futuristic

### 3. **Luxury** (Premium & Gold)
```typescript
{
  background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(30, 30, 30, 0.98) 100%)',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  accentColor: '#D4AF37', // Gold
  shadow: '0 20px 60px rgba(212, 175, 55, 0.15)'
}
```
**Perfect pentru**: Dashboard-uri premium, prezentări executive

## 🔧 Cum să Integrezi în Fiecare Widget

### Chart Widget

#### 1. Adaugă în Schema (`src/widgets/schemas/chart-v2.ts`):
```typescript
import { z } from 'zod';

export const chartPremiumStyleSchema = z.object({
  theme: z.enum(['transparent', 'glass', 'minimal', 'luxury', 'dark-elegant', 'light-premium', 'gradient-soft', 'neo-brutalism']).default('transparent'),
  showBackground: z.boolean().default(true),
  transparentBackground: z.boolean().default(false),
  gridOpacity: z.number().min(0).max(1).default(0.1),
  axisStyle: z.enum(['solid', 'dashed', 'dotted', 'none']).default('solid'),
  showLegend: z.boolean().default(true),
  legendPosition: z.enum(['top', 'right', 'bottom', 'left']).default('top'),
  colorScheme: z.enum(['default', 'pastel', 'vibrant', 'monochrome', 'luxury']).default('default'),
  animationDuration: z.number().default(750),
});

// Adaugă în chartWidgetConfigSchema:
export const chartWidgetConfigSchema = z.object({
  // ... existing fields
  premiumStyle: chartPremiumStyleSchema.optional(),
});
```

#### 2. Adaugă Tab în Editor (`src/widgets/ui/editors/ChartWidgetEditorV2.tsx`):
```typescript
import { PremiumStyleEditor } from '../components/PremiumStyleEditor';

// În componenta ChartWidgetEditorV2, adaugă tab nou:
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="data">Data</TabsTrigger>
    <TabsTrigger value="chart">Chart</TabsTrigger>
    <TabsTrigger value="style">Style</TabsTrigger>
    <TabsTrigger value="premium">✨ Premium</TabsTrigger> {/* NOU */}
  </TabsList>
  
  {/* ... other tabs ... */}
  
  <TabsContent value="premium">
    <PremiumStyleEditor
      widgetType="chart"
      value={value.premiumStyle || {}}
      onChange={(premiumStyle) => onChange({ ...value, premiumStyle })}
    />
  </TabsContent>
</Tabs>
```

#### 3. Aplică în Renderer (`src/widgets/ui/renderers/ChartWidgetRenderer.tsx`):
```typescript
import { BaseWidget } from '../components/BaseWidget';
import { getPremiumStyle, premiumThemes, chartColorSchemes } from '@/widgets/styles/premiumStyles';
import { ResponsiveContainer, LineChart, BarChart, ... } from 'recharts';

export const ChartWidgetRenderer: React.FC<ChartWidgetRendererProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode,
}) => {
  const config = widget.config as ChartConfig;
  const premiumStyle = config.premiumStyle;
  
  // Get base theme styles
  const baseStyle = premiumStyle?.theme 
    ? getPremiumStyle(premiumStyle.theme)
    : undefined;

  // Get color scheme for chart
  const colors = premiumStyle?.colorScheme 
    ? chartColorSchemes[premiumStyle.colorScheme]
    : chartColorSchemes.default;

  return (
    <BaseWidget
      title={widget.title}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      isEditMode={isEditMode}
      premiumStyle={baseStyle}  {/* ← APLICĂ STILURILE */}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {/* Background transparent control */}
          {!premiumStyle?.transparentBackground && (
            <rect width="100%" height="100%" fill={baseStyle?.background || 'white'} />
          )}
          
          {/* Grid cu opacitate controlabilă */}
          <CartesianGrid 
            strokeDasharray={premiumStyle?.axisStyle === 'dashed' ? '3 3' : '0'}
            stroke={baseStyle?.textColor || '#ccc'}
            opacity={premiumStyle?.gridOpacity || 0.1}
          />
          
          {/* Axe cu stil configurabil */}
          <XAxis 
            dataKey="x"
            stroke={baseStyle?.accentColor}
            strokeDasharray={premiumStyle?.axisStyle === 'dashed' ? '5 5' : '0'}
            hide={premiumStyle?.axisStyle === 'none'}
          />
          <YAxis 
            stroke={baseStyle?.accentColor}
            strokeDasharray={premiumStyle?.axisStyle === 'dashed' ? '5 5' : '0'}
            hide={premiumStyle?.axisStyle === 'none'}
          />
          
          {/* Legend configurabilă */}
          {premiumStyle?.showLegend && (
            <Legend 
              verticalAlign={premiumStyle.legendPosition === 'top' || premiumStyle.legendPosition === 'bottom' ? premiumStyle.legendPosition : 'top'}
              align={premiumStyle.legendPosition === 'left' || premiumStyle.legendPosition === 'right' ? premiumStyle.legendPosition : 'center'}
            />
          )}
          
          {/* Line cu culori din schema aleasă */}
          <Line 
            type="monotone" 
            dataKey="value"
            stroke={colors[0]}
            strokeWidth={2}
            animationDuration={premiumStyle?.animationDuration || 750}
          />
        </LineChart>
      </ResponsiveContainer>
    </BaseWidget>
  );
};
```

### KPI Widget

Similar cu Chart, dar folosește `KPIPremiumStyle`:

```typescript
// În renderer:
import { KPIPremiumStyle } from '@/widgets/styles/premiumStyles';

const premiumStyle = config.premiumStyle as KPIPremiumStyle;
const baseStyle = premiumStyle?.theme 
  ? getPremiumStyle(premiumStyle.theme)
  : undefined;

// Aplică layout
const layoutClass = {
  compact: 'flex items-center gap-2',
  spacious: 'flex flex-col gap-4 p-6',
  card: 'p-6 space-y-4',
}[premiumStyle?.layout || 'compact'];

// Aplică size pentru număr
const numberSizeClass = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-8xl',
}[premiumStyle?.numberSize || 'lg'];

return (
  <BaseWidget premiumStyle={baseStyle} ...>
    <div className={layoutClass}>
      {/* Icon cu stil */}
      {premiumStyle?.iconStyle === 'gradient' && (
        <div className="bg-gradient-to-br from-primary to-purple-600 p-4 rounded-full">
          <Icon className="h-8 w-8 text-white" />
        </div>
      )}
      
      {/* Număr mare */}
      <div className={numberSizeClass} style={{ color: baseStyle?.accentColor }}>
        {value}
      </div>
      
      {/* Sparkline opțional */}
      {premiumStyle?.showSparkline && (
        <Sparklines data={history}>
          <SparklinesLine color={baseStyle?.accentColor} />
        </Sparklines>
      )}
      
      {/* Accent bar */}
      {premiumStyle?.accentPosition === 'top' && (
        <div className="absolute top-0 left-0 right-0 h-1" 
             style={{ background: baseStyle?.accentColor }} />
      )}
    </div>
  </BaseWidget>
);
```

### Table Widget

```typescript
// Aplică stiluri pentru table
const cellPaddingClass = {
  compact: 'px-2 py-1',
  normal: 'px-4 py-2',
  relaxed: 'px-6 py-4',
}[premiumStyle?.cellPadding || 'normal'];

const fontSizeClass = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}[premiumStyle?.fontSize || 'md'];

<BaseWidget premiumStyle={baseStyle} ...>
  <table className={cn('w-full', fontSizeClass)}>
    <thead className={cn(
      premiumStyle?.headerStyle === 'bold' && 'font-bold',
      premiumStyle?.headerStyle === 'accent' && 'bg-primary text-primary-foreground',
      premiumStyle?.headerStyle === 'subtle' && 'text-muted-foreground'
    )}>
      <tr>
        {columns.map(col => (
          <th key={col.id} className={cellPaddingClass}>
            {col.name}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row, i) => (
        <tr 
          key={i}
          className={cn(
            premiumStyle?.stripedRows && i % 2 === 0 && 'bg-muted/50',
            premiumStyle?.rowHover && 'hover:bg-accent/10 transition-colors'
          )}
        >
          {columns.map(col => (
            <td 
              key={col.id} 
              className={cellPaddingClass}
              style={{ 
                borderTop: premiumStyle?.borderStyle !== 'none' && premiumStyle?.borderStyle !== 'vertical' ? '1px solid' : undefined,
                borderLeft: premiumStyle?.borderStyle === 'full' || premiumStyle?.borderStyle === 'vertical' ? '1px solid' : undefined,
              }}
            >
              {row[col.id]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</BaseWidget>
```

## 🚀 Quick Start

Pentru a adăuga styling premium la orice widget:

1. **Import stilurile**:
```typescript
import { getPremiumStyle, PremiumTheme } from '@/widgets/styles/premiumStyles';
```

2. **Adaugă în config schema**:
```typescript
premiumStyle: z.object({
  theme: z.enum([...]).default('transparent'),
  // + alte proprietăți specifice widget-ului
}).optional()
```

3. **Adaugă editor în tab-ul de styling**:
```typescript
<PremiumStyleEditor
  widgetType="chart" // sau 'kpi', 'table', etc.
  value={value.premiumStyle}
  onChange={(premiumStyle) => onChange({ ...value, premiumStyle })}
/>
```

4. **Aplică în renderer**:
```typescript
const baseStyle = config.premiumStyle?.theme 
  ? getPremiumStyle(config.premiumStyle.theme)
  : undefined;

<BaseWidget premiumStyle={baseStyle} ...>
  {/* widget content cu stiluri aplicate */}
</BaseWidget>
```

## 💡 Tips & Best Practices

1. **Pentru chart-uri transparente**: 
   - Setează `theme: 'transparent'`
   - Setează `transparentBackground: true`
   - Reduce `gridOpacity` la 0.05-0.1
   - Folosește `axisStyle: 'solid'` sau `'dashed'` pentru claritate

2. **Pentru dashboard-uri luxury**:
   - Folosește `theme: 'luxury'`
   - Setează `colorScheme: 'luxury'` pentru chart-uri
   - Activează animații smooth

3. **Pentru performance**:
   - Reduce `animationDuration` pentru dashboards mari
   - Folosește `theme: 'minimal'` pentru widget-uri multe

4. **Pentru dark mode**:
   - Folosește `theme: 'dark-elegant'` sau `'glass'`
   - Asigură-te că textColor se adaptează automat

## 🎯 Exemple Complete

Vezi `src/widgets/ui/renderers/TasksWidgetRenderer.tsx` pentru un exemplu complet de widget cu premium styling aplicat.

## 📝 To-Do pentru Fiecare Widget

- [ ] Chart Widget - integrat PremiumStyleEditor în tab "Premium"
- [ ] KPI Widget - similar cu Chart
- [ ] Table Widget - similar cu Chart
- [ ] Weather Widget - adaugă stiluri specifice (icon style, layout)
- [ ] Clock Widget - adaugă stiluri specifice (analog/digital, colors)
- [ ] Tasks Widget - deja are sistem de styling, adaptează la premium system

---

**Creat de**: Assistant  
**Data**: 2025-10-11  
**Versiune**: 1.0

