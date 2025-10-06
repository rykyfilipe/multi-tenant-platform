# 🎯 KPI Aggregation Pipeline - Exemple Vizuale

## Cum Funcționează Chaining-ul

### Exemplu 1: Agregare Simplă (1 funcție)

```
┌──────────────────────────────────────────┐
│ DATE BRUTE                               │
│ [100, 200, 300, 150, 250]                │
└──────────────────────────────────────────┘
                  ↓
         ┌────────────────┐
         │   SUM()        │
         └────────────────┘
                  ↓
         ┌────────────────┐
         │     1000       │ ← REZULTAT FINAL
         └────────────────┘
```

**Configurare:**
```typescript
{
  field: "sales",
  aggregations: [
    { function: "sum", label: "Total" }
  ]
}
```

**Rezultat:** 1000

---

### Exemplu 2: Chain de 2 Funcții

```
┌──────────────────────────────────────────┐
│ DATE BRUTE                               │
│ [100, 200, 300, 150, 250]                │
└──────────────────────────────────────────┘
                  ↓
         ┌────────────────┐
         │   Step 1: SUM  │
         │   = 1000       │
         └────────────────┘
                  ↓
         ┌────────────────┐
         │  Step 2: AVG   │
         │  AVG([1000])   │
         │   = 1000       │
         └────────────────┘
                  ↓
         ┌────────────────┐
         │     1000       │ ← REZULTAT FINAL
         └────────────────┘
```

**Configurare:**
```typescript
{
  field: "sales",
  aggregations: [
    { function: "sum", label: "Total" },
    { function: "avg", label: "Average" }
  ]
}
```

**Rezultat:** 1000
**Pipeline:** SUM([100, 200, 300, 150, 250]) = 1000 → AVG([1000]) = 1000

---

### Exemplu 3: Chain Complex (3+ Funcții)

```
┌──────────────────────────────────────────┐
│ DATE BRUTE (Monthly Revenue)             │
│ [50000, 75000, 60000, 80000, 90000]      │
└──────────────────────────────────────────┘
                  ↓
         ┌────────────────┐
         │   Step 1: SUM  │
         │   = 355000     │
         └────────────────┘
                  ↓
         ┌────────────────┐
         │  Step 2: AVG   │
         │  AVG([355000]) │
         │   = 355000     │
         └────────────────┘
                  ↓
         ┌────────────────┐
         │  Step 3: MAX   │
         │  MAX([355000]) │
         │   = 355000     │
         └────────────────┘
                  ↓
         ┌────────────────┐
         │    355000      │ ← REZULTAT FINAL
         └────────────────┘
```

**Configurare:**
```typescript
{
  field: "monthly_revenue",
  label: "Revenue Analysis",
  aggregations: [
    { function: "sum", label: "Total Revenue" },
    { function: "avg", label: "Average" },
    { function: "max", label: "Peak Value" }
  ],
  format: "currency",
  showTrend: true,
  target: 500000
}
```

**Display:**
```
$355,000
Revenue Analysis

↓ -29% vs previous  ✗ Below target
```

---

### Exemplu 4: COUNT Chain (Warning!)

```
┌──────────────────────────────────────────┐
│ DATE BRUTE                               │
│ [10, 20, 30, 40, 50]                     │
└──────────────────────────────────────────┘
                  ↓
         ┌────────────────┐
         │  Step 1: COUNT │
         │     = 5        │ ← Numără câte valori sunt
         └────────────────┘
                  ↓
         ┌────────────────┐
         │   Step 2: AVG  │
         │   AVG([5])     │
         │     = 5        │ ← Nu prea are sens!
         └────────────────┘
                  ↓
         ┌────────────────┐
         │       5        │ ← REZULTAT
         └────────────────┘
```

**⚠️ WARNING:** System-ul va afișa:
> "Chaining aggregations after COUNT may produce unexpected results"

**De ce?** 
- COUNT returnează numărul de elemente (5)
- AVG([5]) = 5 nu adaugă informație utilă
- Mai logic ar fi doar COUNT singur

---

## Scenarii Reale de Business

### Scenario 1: Total Sales
```typescript
{
  field: "sale_amount",
  aggregations: [{ function: "sum", label: "Total Sales" }]
}
```
**Use Case:** Vrei suma tuturor vânzărilor
**Rezultat:** Simplu, clar, eficient ✅

---

### Scenario 2: Average Order Value
```typescript
{
  field: "order_value",
  aggregations: [{ function: "avg", label: "Avg Order Value" }]
}
```
**Use Case:** Valoarea medie per comandă
**Rezultat:** Media tuturor order_value ✅

---

### Scenario 3: Peak Performance (După Totalizare)
```typescript
{
  field: "daily_revenue",
  aggregations: [
    { function: "sum", label: "Total" },
    { function: "max", label: "Peak Day" }
  ]
}
```
**Use Case:** Vrei să vezi ziua cu cele mai mari vânzări
**Rezultat:** SUM pe fiecare zi, apoi MAX ✅

---

### Scenario 4: Complex Analytics
```typescript
{
  field: "transaction_amount",
  aggregations: [
    { function: "sum", label: "Total Transactions" },
    { function: "avg", label: "Average" },
  ],
  showTrend: true,
  showComparison: true,
  target: 100000
}
```
**Use Case:** Analiza completă cu trend și target
**Display:**
```
$1,255,000
Total Transactions

↑ +15.3% vs previous  ✓ Above target
```

---

## Cum să Alegi Funcțiile

### ✅ **Chains Utile:**

1. **COUNT → MAX**
   - Găsește numărul maxim de items într-un grup
   
2. **SUM → AVG**
   - Media totalurilor (useful pentru grouped data)
   
3. **SUM → MAX**
   - Găsește totalul maxim dintr-un set de grupuri

### ❌ **Chains Mai Puțin Utile:**

1. **COUNT → AVG**
   - AVG pe un singur număr nu adaugă info
   
2. **MAX → COUNT**
   - COUNT pe o singură valoare e întotdeauna 1
   
3. **MIN → MAX**
   - Dacă ai o singură valoare, MIN = MAX

---

## Tips & Tricks

### 💡 **Tip 1: Ține pipeline-ul simplu**
- 1-2 funcții sunt de obicei suficiente
- Mai mult de 3 funcții devine greu de interpretat

### 💡 **Tip 2: Folosește labels clare**
```typescript
// ❌ Rău
{ function: "sum", label: "s" }

// ✅ Bine
{ function: "sum", label: "Total Revenue" }
```

### 💡 **Tip 3: Testează cu date reale**
- Configurează KPI-ul
- Verifică dacă rezultatul are sens business
- Ajustează pipeline-ul după nevoie

### 💡 **Tip 4: Folosește Format potrivit**
```typescript
format: "currency"   // Pentru bani: $1,000,000
format: "percentage" // Pentru rate: 15.5%
format: "number"     // Pentru count: 1,000
format: "decimal"    // Pentru precizie: 123.45
```

---

## Întrebări Frecvente

### ❓ **De ce doar 1 metric?**
**R:** Focus și claritate. Dacă vrei mai multe KPI-uri, creează mai multe widget-uri KPI.

### ❓ **Pot să fac agregări pe grupuri?**
**R:** Momentan nu direct, dar e în roadmap (groupBy field).

### ❓ **Ce înseamnă "chained"?**
**R:** Fiecare funcție procesează rezultatul funcției anterioare, ca un pipeline.

### ❓ **Pot să am 10 funcții în chain?**
**R:** Tehnic da, dar system-ul va afișa warning după 5 funcții.

### ❓ **De ce MAX după SUM returnează aceeași valoare?**
**R:** Pentru că SUM returnează o singură valoare (totalul). MAX([singura_valoare]) = singura_valoare.

---

**Happy KPI Building!** 📈

