# Invoice Series Validation Fix

## Problema identificată

Eroarea din log-uri indica că `startNumber` trebuie să fie mai mare sau egal cu 1, dar se trimitea o valoare invalidă:

```
Error [ZodError]: [
  {
    "code": "too_small",
    "minimum": 1,
    "type": "number",
    "inclusive": true,
    "exact": false,
    "message": "Number must be greater than or equal to 1",
    "path": [
      "startNumber"
    ]
  }
]
```

## Cauza problemei

1. **Frontend (SeriesManager.tsx)**:
   - `startNumber` era inițializat cu valoarea `0` în state-ul formularului
   - La resetarea formularului, se seta din nou la `0`
   - La parsarea input-ului, se folosea `|| 0` care putea rezulta în `0`
   - Input-ul avea `min="0"` în loc de `min="1"`

2. **Backend (API route)**:
   - Schema de validare cerea `startNumber` minim 1
   - Dar la crearea seriei, se folosea `validatedData.startNumber || 0` care seta valoarea la 0 dacă nu era furnizată

## Soluțiile aplicate

### 1. Frontend (SeriesManager.tsx)

#### Inițializarea state-ului
```typescript
// ÎNAINTE
startNumber: 0,

// DUPĂ
startNumber: 1,
```

#### Resetarea formularului
```typescript
// ÎNAINTE
startNumber: 0,

// DUPĂ
startNumber: 1,
```

#### Input-ul pentru startNumber
```typescript
// ÎNAINTE
<Input
    id="startNumber"
    type="number"
    min="0"
    value={formData.startNumber}
    onChange={(e) => setFormData({ ...formData, startNumber: parseInt(e.target.value) || 0 })}
/>

// DUPĂ
<Input
    id="startNumber"
    type="number"
    min="1"
    value={formData.startNumber}
    onChange={(e) => setFormData({ ...formData, startNumber: Math.max(1, parseInt(e.target.value) || 1) })}
/>
```

### 2. Backend (API route)

#### Crearea seriei
```typescript
// ÎNAINTE
currentNumber: validatedData.startNumber || 0,

// DUPĂ
currentNumber: validatedData.startNumber || 1,
```

## Îmbunătățiri implementate

### 1. Validare mai strictă în frontend
- `min="1"` pentru input-ul de startNumber
- `Math.max(1, ...)` pentru a asigura că valoarea nu scade sub 1
- Valoarea implicită este acum 1 în loc de 0

### 2. Consistență între frontend și backend
- Ambele folosesc acum valoarea implicită 1
- Validarea este consistentă pe ambele părți

### 3. Experiența utilizatorului îmbunătățită
- Input-ul nu permite valori sub 1
- Valoarea implicită este logică (1 în loc de 0)
- Nu mai apar erori de validare pentru valori invalide

## Testare

### Scenarii testate:
1. ✅ Crearea unei serii fără specificarea startNumber (folosește valoarea implicită 1)
2. ✅ Crearea unei serii cu startNumber = 1
3. ✅ Crearea unei serii cu startNumber > 1
4. ✅ Editarea unei serii existente
5. ✅ Resetarea formularului (setează startNumber la 1)

### Validări:
- ✅ Frontend nu permite valori sub 1
- ✅ Backend validează că startNumber >= 1
- ✅ Valoarea implicită este 1 pe ambele părți
- ✅ Nu mai apar erori ZodError pentru startNumber

## Concluzie

Problema a fost rezolvată prin:
1. **Sincronizarea valorilor implicite** între frontend și backend
2. **Îmbunătățirea validării** în frontend cu `Math.max(1, ...)`
3. **Corectarea atributului `min`** pentru input-ul HTML
4. **Asigurarea consistenței** în toate locurile unde se folosește startNumber

Acum crearea seriilor de facturi funcționează corect fără erori de validare.
