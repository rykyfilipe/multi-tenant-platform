# Performance Tracking Setup Guide

## Overview

Acest ghid explică cum să configurezi și să folosești sistemul automat de performance tracking în aplicația multi-tenant.

## Ce este inclus

### 1. Performance Monitor (`src/lib/performance-monitor.ts`)
- Colectează automat metricile de performanță
- Urmărește API requests, database queries și component renders
- Păstrează ultimele 1000 de metrici în memorie
- Detectează automat operațiile lente

### 2. Middleware automat (`src/middleware.ts`)
- Colectează automat metricile pentru toate rutele API
- Măsoară timpul de răspuns
- Generează ID-uri unice pentru tracking

### 3. Prisma Performance Tracking
- Urmărește automat toate query-urile de baza de date
- Măsoară timpul de execuție
- Detectează query-urile lente

### 4. React Component Tracking
- Hook-uri pentru tracking automat al componentelor
- Măsoară timpul de render și mount/unmount
- Tracking automat fără configurare

## Cum să folosești

### Pentru componente React

```tsx
import { useAutoPerformanceTracking } from "@/hooks/usePerformanceTracking";

function MyComponent() {
  // Tracking automat - nu necesită configurare
  useAutoPerformanceTracking('MyComponent');
  
  return <div>My Component</div>;
}
```

### Pentru tracking manual

```tsx
import { usePerformanceTracking } from "@/hooks/usePerformanceTracking";

function MyComponent() {
  const { trackAPICall, trackComputation } = usePerformanceTracking({
    componentName: 'MyComponent',
    trackRenders: true,
    trackEffects: true,
  });

  const handleSubmit = async () => {
    const result = await trackAPICall('submit', async () => {
      return await api.submit(data);
    });
  };

  const expensiveCalculation = trackComputation('calculation', () => {
    return heavyComputation(data);
  });
}
```

### Pentru rutele API

```tsx
import { withPerformanceTracking } from "@/lib/performance-monitor";

export const GET = withPerformanceTracking(async (request: Request) => {
  // Ruta ta API - tracking-ul este automat
  const data = await fetchData();
  return NextResponse.json(data);
});
```

## Dashboard de Performanță

### Acces
Dashboardul este disponibil doar în modul de dezvoltare (`NODE_ENV === "development"`).

### Butonul de Performance
- Apasă butonul "📊 Performance" din colțul dreapta jos
- Dashboardul se va deschide cu toate metricile

### Funcționalități
- **Overview**: Statistici generale API, Database și Rendering
- **API Performance**: Detalii despre endpoint-urile API
- **Database**: Detalii despre query-urile de baza de date
- **Rendering**: Detalii despre performanța componentelor

### Generare de date de test
- Butonul "🧪 Generate Test Data" creează metrici artificiale pentru testare
- Util pentru a verifica că dashboardul funcționează corect

## Metrici colectate

### API Requests
- Timpul de răspuns
- Status code
- Cache hit/miss
- User agent, referer, IP
- Metadata personalizată

### Database Queries
- Timpul de execuție
- Numele query-ului
- Dimensiunea rezultatului
- Succes/eroare

### Component Renders
- Timpul de render
- Mount/unmount timing
- Re-render tracking
- Metadata personalizată

## Configurare

### Variabile de mediu
```bash
NODE_ENV=development  # Activează tracking-ul automat
ENABLE_CACHE=true     # Activează cache-ul (opțional)
```

### Personalizare
Poți modifica pragurile pentru operațiile lente în `performance-monitor.ts`:
- API requests: > 1000ms
- Database queries: > 500ms  
- Component renders: > 100ms

## Debugging

### Console logs
În modul de dezvoltare, metricile sunt logate automat în consolă la fiecare 30 de secunde.

### Dashboard debug info
Dashboardul afișează:
- Numărul total de metrici
- Fereastra de timp (default: 5 minute)
- Ultima actualizare

### Probleme comune
1. **Dashboard gol**: Verifică că ești în modul de dezvoltare
2. **Metrici lipsă**: Folosește butonul "Generate Test Data"
3. **Tracking nu funcționează**: Verifică că middleware-ul este activ

## Exemple de utilizare

### Tracking automat pentru o componentă de tabel
```tsx
import { useTablePerformanceTracking } from "@/hooks/usePerformanceTracking";

function DataTable({ data }) {
  const { trackSort, trackFilter, trackPagination } = useTablePerformanceTracking(
    'DataTable',
    data.length
  );

  const handleSort = () => {
    trackSort(() => {
      return data.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  return <table>...</table>;
}
```

### Tracking pentru formulare
```tsx
import { useFormPerformanceTracking } from "@/hooks/usePerformanceTracking";

function ContactForm() {
  const { trackFormSubmit, trackValidation } = useFormPerformanceTracking('ContactForm');

  const handleSubmit = async () => {
    await trackFormSubmit(async () => {
      return await api.submit(formData);
    });
  };

  const validateEmail = () => {
    return trackValidation(() => {
      return emailValidator.validate(formData.email);
    });
  };
}
```

## Monitorizare în producție

Pentru producție, poți:
1. Exporta metricile cu `performanceMonitor.exportMetrics()`
2. Trimite metricile către un serviciu extern (Datadog, New Relic, etc.)
3. Salva metricile în baza de date pentru analiză istorică

## Suport

Pentru probleme sau întrebări despre performance tracking:
1. Verifică console logs în modul de dezvoltare
2. Folosește dashboardul de performanță
3. Verifică că toate import-urile sunt corecte
4. Asigură-te că ești în modul de dezvoltare
