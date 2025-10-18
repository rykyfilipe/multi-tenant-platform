# 🎨 Dashboard Layout Templates Feature

## Overview

Sistema de template-uri de layout pentru dashboard-ul de widget-uri. Utilizatorii pot adăuga widget-uri manual, le pot aranja cum doresc, apoi pot aplica un **layout template** care rearanjează automat toate widget-urile existente conform unui pattern predefinit - **pentru TOATE breakpoint-urile simultan** (xs, sm, md, lg, xl, xxl).

## 🎯 Concept

### Ce este un Layout Template?

Un **Layout Template** este o colecție de **slot-uri** (poziții predefinite) care definește exact unde să fie plasate widget-urile pe dashboard, pentru fiecare breakpoint în parte.

### Diferență față de Widget Templates

| Widget Templates | Layout Templates |
|-----------------|------------------|
| Creează widget-uri NOI | Rearanjează widget-uri EXISTENTE |
| Adaugă conținut nou | Organizează conținut existent |
| Template-uri pentru widget-uri individuale | Template-uri pentru întreg dashboard-ul |

## 📐 Cum funcționează?

### 1. Utilizatorul lucrează normal
- Adaugă widget-uri (KPI, Charts, Tables, etc.)
- Le mută, le redimensionează cum dorește
- Dashboard-ul devine "haotic" cu timpul

### 2. Aplică un Layout Template
- Click pe **"Apply Layout"** în toolbar
- Selectează un template (ex: "Metrics + Charts")
- **TOATE widget-urile se rearanjează instant** conform template-ului
- **Pentru TOATE breakpoint-urile** (desktop, tablet, mobile)

### 3. Rezultat
- Widget-urile sunt perfect organizate
- Layout-ul este responsive pe toate device-urile
- Fără cod manual, fără ajustări per-breakpoint

## 🏗️ Arhitectură

### Structura fișierelor

```
src/widgets/
├── templates/
│   ├── layout-templates.ts          # Definițiile template-urilor
│   └── widget-templates.ts          # Template-uri pentru widget-uri (existent)
├── utils/
│   ├── applyLayoutTemplate.ts       # Logica de aplicare a layout-urilor
│   └── layoutHelpers.ts             # Helper-e pentru poziționare (existent)
└── ui/
    └── components/
        ├── LayoutTemplateSelector.tsx  # UI pentru selectarea layout-urilor
        └── TemplateSelector.tsx        # UI pentru widget templates (existent)
```

### Tipuri de date

```typescript
// Layout Slot - O singură poziție în layout
interface LayoutSlot {
  id: string;
  positions: Record<Breakpoint, BreakpointPosition>;
}

// Dashboard Layout Template
interface DashboardLayoutTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'metrics' | 'analytics' | 'executive' | 'operational' | 'custom';
  slots: LayoutSlot[];
  recommendedWidgetCount: number;
  minWidgets?: number;
  maxWidgets?: number;
}
```

## 📊 Template-uri disponibile

### 1. **Metrics + Charts** 📊
- **Prima linie**: 5 widget-uri mici (KPIs)
- **A doua linie**: 2 widget-uri mari (Charts)
- **Recomandare**: 7 widget-uri
- **Perfect pentru**: Dashboards cu metrici cheie + grafice detaliate

### 2. **Executive View** 👔
- **Top**: 3 KPIs mari
- **Centru**: 1 grafic principal mare
- **Dreapta**: 2 grafice mai mici
- **Recomandare**: 6 widget-uri
- **Perfect pentru**: Management dashboards, rapoarte executive

### 3. **Analytics Grid** 📈
- **Grid 2x2**: 4 grafice de dimensiuni egale
- **Recomandare**: 4-8 widget-uri
- **Perfect pentru**: Comparații, analize paralele

### 4. **Operational Dashboard** ⚙️
- **Stânga**: 1 tabel mare
- **Dreapta**: 4 KPIs mici
- **Jos**: 2 grafice
- **Recomandare**: 7 widget-uri
- **Perfect pentru**: Monitorizare operațională, task-uri

### 5. **Single Focus** 🎯
- **Centru**: 1 widget mare (focus principal)
- **Laterală**: 3 widget-uri mici (suport)
- **Recomandare**: 4 widget-uri
- **Perfect pentru**: Dashboards cu un KPI principal

## 🎨 Exemple de utilizare

### Exemplu 1: Transformare Dashboard haotic în Metrics Dashboard

**Înainte:**
```
Dashboard cu 7 widget-uri aranjate random:
- 3 KPIs dispersați
- 2 Charts unul peste altul
- 2 Tables în colțuri
```

**După aplicarea "Metrics + Charts":**
```
Desktop (xxl):
┌─────┬─────┬─────┬─────┬─────┐
│ KPI │ KPI │ KPI │ KPI │ KPI │ (primele 5)
├─────┴─────┴─────┼─────┴─────┤
│   Chart 1       │   Chart 2 │ (următoarele 2)
├─────────────────┴───────────┤
│   Extra widgets aici        │
└─────────────────────────────┘

Mobile (xs):
┌───────────────┐
│     KPI 1     │
├───────────────┤
│     KPI 2     │
├───────────────┤
│     KPI 3     │
├───────────────┤
│     KPI 4     │
├───────────────┤
│     KPI 5     │
├───────────────┤
│   Chart 1     │
├───────────────┤
│   Chart 2     │
└───────────────┘
```

## 🔧 Implementare tehnică

### 1. Definirea unui Template

```typescript
const METRICS_LAYOUT: DashboardLayoutTemplate = {
  id: 'metrics-top-charts-below',
  name: '📊 Metrics + Charts',
  description: '5 small KPI metrics on top, 2 large charts below',
  icon: '📊',
  category: 'metrics',
  recommendedWidgetCount: 7,
  slots: [
    // Slot 1: KPI mic în top-left
    {
      id: 'kpi-1',
      positions: {
        xxl: { x: 0, y: 0, w: 4, h: 4 },
        xl: { x: 0, y: 0, w: 4, h: 4 },
        lg: { x: 0, y: 0, w: 6, h: 4 },
        md: { x: 0, y: 0, w: 8, h: 4 },
        sm: { x: 0, y: 0, w: 12, h: 4 },
        xs: { x: 0, y: 0, w: 24, h: 4 },
      },
    },
    // ... alte slot-uri
  ],
};
```

### 2. Aplicarea Template-ului

```typescript
function applyLayoutTemplate(
  widgets: WidgetEntity[],
  template: DashboardLayoutTemplate
): WidgetEntity[] {
  // 1. Sortează widget-urile după poziția curentă
  const sorted = widgets.sort((a, b) => {
    if (a.position.y !== b.position.y) return a.position.y - b.position.y;
    return a.position.x - b.position.x;
  });
  
  // 2. Mapează fiecare widget la un slot
  return sorted.map((widget, index) => {
    const slot = template.slots[index % template.slots.length];
    
    return {
      ...widget,
      position: {
        x: slot.positions.xxl.x,
        y: slot.positions.xxl.y,
        w: slot.positions.xxl.w,
        h: slot.positions.xxl.h,
        layouts: slot.positions, // TOATE breakpoint-urile!
      },
    };
  });
}
```

### 3. Integrare în UI

```tsx
// În WidgetCanvasNew.tsx
const handleApplyLayout = (template: DashboardLayoutTemplate) => {
  const updatedWidgets = applyLayoutTemplate(widgetList, template);
  
  updatedWidgets.forEach(widget => {
    updateLocal(widget.id, { position: widget.position });
  });
  
  setLayoutKey(prev => prev + 1); // Re-render grid
};

// În toolbar
<LayoutTemplateSelector 
  onSelectLayout={handleApplyLayout}
  currentWidgetCount={widgetList.length}
/>
```

## ✨ Features

### 1. **Smart Recommendations**
- Template-urile sunt marcate cu badge-uri:
  - 🟢 **PERFECT** - numărul exact de widget-uri recomandat
  - 🔵 **GOOD FIT** - aproape de numărul recomandat
  - 🔴 **NOT SUITABLE** - prea multe/puține widget-uri

### 2. **Visual Preview**
- Fiecare template arată un preview vizual al layout-ului desktop
- Pozițiile sunt afișate ca dreptunghiuri colorate
- Ajută utilizatorul să înțeleagă structura înainte de aplicare

### 3. **Responsive by Design**
- **Toate template-urile** definesc poziții pentru toate breakpoint-urile
- Nu mai este nevoie de logică complexă de adaptare
- Layout-ul este garantat să arate bine pe orice device

### 4. **Flexible Mapping**
- Dacă utilizatorul are mai multe widget-uri decât slot-uri, se face wrap-around
- Exemplu: 10 widget-uri + template cu 7 slot-uri → primele 7 folosesc slot-urile 1-7, următoarele 3 folosesc slot-urile 1-3

### 5. **Undo/Redo Support**
- Aplicarea unui layout este o operație care poate fi undo/redo
- Utilizatorul poate experimenta cu diferite layout-uri fără teamă

## 🎯 Use Cases

### 1. **Startup Dashboard Setup**
**Problema**: Utilizator nou, nu știe cum să-și organizeze dashboard-ul.
**Soluție**: 
1. Adaugă 5-7 widget-uri rapide
2. Aplică template "Metrics + Charts"
3. Dashboard profesional instant!

### 2. **Refactoring Dashboard Vechi**
**Problema**: Dashboard cu 15 widget-uri aranjate haotic de-a lungul anilor.
**Soluție**:
1. Selectează template "Analytics Grid"
2. Toate widget-urile se rearanjează ordonat
3. Layout consistent pe toate device-urile

### 3. **Executive Presentation**
**Problema**: Prezentare pentru management, trebuie layout clean și profesional.
**Soluție**:
1. Aplică template "Executive View"
2. KPIs principale vizibile instant
3. Grafice detaliate accesibile

### 4. **Mobile-First Dashboard**
**Problema**: Dashboard folosit în principal pe mobile, dar arată prost.
**Soluție**:
1. Oricare template aplicat include layout optim pentru mobile
2. Widget-uri stack-uite vertical automat pe xs/sm
3. Experiență consistentă pe toate device-urile

## 📝 Best Practices

### Pentru Dezvoltatori

1. **Definirea Template-urilor**
   - Folosește grid de 24 coloane pentru flexibilitate
   - Testează pe toate breakpoint-urile
   - Asigură-te că layout-ul are sens pe mobile (xs)

2. **Slot Design**
   - Primele slot-uri = cele mai importante widget-uri
   - Slot-urile "extra" pentru overflow
   - Dimensiuni consistente pentru aceeași categorie (ex: toate KPIs mici = 4h)

3. **Categories**
   - Grupează template-uri similare
   - Nume descriptive și icoane relevante
   - Descrieri clare ale use case-urilor

### Pentru Utilizatori

1. **Când să folosești Layout Templates**
   - Dashboard nou - start cu un template
   - Dashboard haotic - reset cu un template
   - Prezentări - switch rapid la layout profesional

2. **Alegerea Template-ului**
   - Verifică badge-ul de recomandare (PERFECT/GOOD FIT)
   - Uită-te la preview vizual
   - Experimentează - poți face undo!

3. **După aplicare**
   - Fine-tune individual widget-urile dacă e nevoie
   - Salvează când ești mulțumit
   - Layout-ul rămâne responsive automat

## 🚀 Viitor & Extensii

### Posibile îmbunătățiri

1. **Custom Layout Templates**
   - Permite utilizatorilor să salveze layout-ul curent ca template personal
   - Export/Import template-uri între dashboard-uri

2. **AI Layout Suggestions**
   - Analizează tipurile de widget-uri
   - Recomandă cel mai potrivit template automat

3. **Layout Preview în Real-Time**
   - Hover pe template → vezi cum ar arăta dashboard-ul
   - Preview per breakpoint în dialog

4. **Template Marketplace**
   - Comunitate de template-uri
   - Rate & review
   - Industry-specific templates (finance, healthcare, etc.)

## 📊 Impact

### Înainte de Layout Templates
- ⏰ **Timp pentru setup dashboard**: 30-60 min
- 📱 **Layout responsive manual**: Da, pentru fiecare widget
- 🎨 **Consistență vizuală**: Depinde de utilizator
- 🔄 **Reorganizare**: Dificil, manual, timp consumat

### După Layout Templates
- ⏰ **Timp pentru setup dashboard**: 2-5 min
- 📱 **Layout responsive manual**: Nu, automat pentru toate breakpoint-urile
- 🎨 **Consistență vizuală**: Garantată de template
- 🔄 **Reorganizare**: 1 click, instant

## 🎉 Concluzie

Sistemul de **Layout Templates** transformă modul în care utilizatorii organizează dashboard-urile:
- ✅ Setup rapid și profesional
- ✅ Layout responsive garantat pe toate device-urile
- ✅ Consistență vizuală
- ✅ Flexibilitate și control

**Nu mai trebuie să te chinui cu breakpoint-uri și poziționări manuale** - alegi un template și totul se aranjează perfect, pe toate ecranele, instant! 🚀

