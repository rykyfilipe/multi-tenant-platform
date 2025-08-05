<!-- @format -->

# Fix pentru Validarea Coloanelor de Referință

## Problema Identificată

Eroarea "client must be a valid reference" apărea pentru că funcțiile de
validare din frontend încă așteptau ca valorile pentru coloanele de referință să
fie numere (ID-uri), dar acum salvăm string-uri (valorile cheilor primare).

## Funcțiile Modificate

### 1. validateCellValue în AddRowForm.tsx

**Înainte:**

```typescript
case "reference":
    return value.trim() !== "" && !isNaN(Number(value));
```

**După:**

```typescript
case "reference":
    return value.trim() !== ""; // Pentru referințe, acceptăm orice string valid
```

### 2. formatCellValue în AddRowForm.tsx

**Înainte:**

```typescript
case "reference":
    return Number(value);
```

**După:**

```typescript
case "reference":
    return String(value); // Pentru referințe, păstrăm ca string
```

## Explicația Modificărilor

### De ce s-a întâmplat?

1. **Schema Prisma**: Câmpul `value` din modelul `Cell` este de tip `Json`, deci
   poate stoca orice tip de date
2. **Validarea Frontend**: Funcțiile de validare încă așteptau numere pentru
   referințe
3. **Tipul de Date**: Acum salvăm string-uri (chei primare) în loc de numere
   (ID-uri)

### Ce am schimbat?

1. **Validarea**: Pentru coloanele de referință, acceptăm orice string valid (nu
   doar numere)
2. **Formatarea**: Pentru coloanele de referință, păstrăm valoarea ca string (nu
   o convertim la număr)

## Testare

### Test 1: Crearea unei celule de referință

- **Input**: User selectează "Electronics" din dropdown
- **Expected**: Se salvează "ELEC001" în baza de date
- **Status**: ✅ Ar trebui să funcționeze acum

### Test 2: Validarea în frontend

- **Input**: Valoarea "ELEC001" pentru o coloană de referință
- **Expected**: Validarea trece (nu mai cere număr)
- **Status**: ✅ Ar trebui să funcționeze acum

### Test 3: Formatarea pentru API

- **Input**: Valoarea "ELEC001"
- **Expected**: Se trimite ca string la API
- **Status**: ✅ Ar trebui să funcționeze acum

## Verificare

Pentru a verifica că fixul funcționează:

1. **Încearcă să creezi un rând nou** cu o coloană de referință
2. **Selectează o valoare din dropdown**
3. **Verifică că nu mai apare eroarea "client must be a valid reference"**
4. **Verifică în baza de date că se salvează valoarea cheii primare**

## Rezultat Așteptat

După fix, sistemul ar trebui să:

- ✅ Accepte string-uri pentru coloanele de referință
- ✅ Nu mai afișeze eroarea de validare
- ✅ Salveze valorile cheilor primare în baza de date
- ✅ Funcționeze corect pentru export/import
