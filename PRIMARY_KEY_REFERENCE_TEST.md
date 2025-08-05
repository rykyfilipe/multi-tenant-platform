# Test pentru Primary Key Reference Logic

## Scenariu de Test

### 1. Tabela Categories
```
ID | Name      | Primary Key
1  | Electronics| "ELEC001"
2  | Books      | "BOOK001"
```

### 2. Tabela Products (cu referință la Categories)
```
ID | Name       | Category (Reference)
1  | Laptop     | "ELEC001" (Primary Key Value)
2  | Novel      | "BOOK001" (Primary Key Value)
```

## Teste de Verificare

### Test 1: Crearea unei celule de referință
- **Input**: User selectează "Electronics" din dropdown
- **Expected**: Se salvează "ELEC001" în baza de date
- **Actual**: Se salvează ID-ul rândului (1)

### Test 2: Export
- **Input**: Export tabel Products
- **Expected**: CSV conține "ELEC001", "BOOK001"
- **Actual**: CSV conține ID-urile (1, 2)

### Test 3: Import
- **Input**: CSV cu "ELEC001", "BOOK001"
- **Expected**: Se salvează "ELEC001", "BOOK001"
- **Actual**: Se salvează ID-urile (1, 2)

## Modificări Implementate

### 1. AddRowForm.tsx
```typescript
// Înainte
value={String(opt.id)}

// După
value={primaryKeyValue} // Extras din displayValue
```

### 2. EditableCell.tsx
```typescript
// Înainte
value={String(opt.id)}
onValueChange={(val) => setValue(Number(val))}

// După
value={primaryKeyValue}
onValueChange={(val) => setValue(val)}
```

### 3. Display Logic
```typescript
// Înainte
const referencedRow = referenceTable?.rows?.find(
  (row: Row) => row.id === Number(value)
);

// După
display = String(value); // Direct primary key value
```

## Verificare

Pentru a verifica dacă modificările funcționează:

1. **Creează o celulă de referință**:
   - Selectează o valoare din dropdown
   - Verifică în baza de date că se salvează valoarea cheii primare

2. **Export**:
   - Exportă tabelul
   - Verifică că CSV-ul conține valorile cheilor primare

3. **Import**:
   - Importă CSV-ul
   - Verifică că se salvează valorile corecte

## Rezultat Așteptat

După modificări, sistemul ar trebui să:
- Salveze valorile cheilor primare în loc de ID-uri
- Exporteze valorile cheilor primare
- Importeze și salveze valorile cheilor primare
- Afișeze valorile cheilor primare în UI 