# Editarea Referințelor Invalide

## Problema

Când o celulă de referință conține o valoare care nu există în tabelul de referință (cheie primară invalidă), userul ar trebui să:
1. **Vadă clar că valoarea este invalidă**
2. **Poată edita celula** pentru a pune o referință validă
3. **Primească feedback vizual** despre problema

## Soluția Implementată

### 1. Detectarea Referințelor Invalide

#### Logica de Verificare
```typescript
// Pentru coloanele de referință, verificăm dacă valoarea există în tabelul de referință
const referenceTable = tables?.find(
  (t) => t.id === column.referenceTableId,
);

if (referenceTable) {
  const refPrimaryKeyColumn = referenceTable.columns.find(
    (col) => col.primary,
  );
  
  if (refPrimaryKeyColumn) {
    // Căutăm rândul cu cheia primară specificată
    const referenceRow = referenceTable.rows.find((refRow) => {
      const refPrimaryKeyCell = refRow.cells.find(
        (refCell) => refCell.columnId === refPrimaryKeyColumn.id,
      );
      return refPrimaryKeyCell && refPrimaryKeyCell.value === value;
    });
    
    if (referenceRow) {
      // Valoarea există, afișăm cheia primară
      display = String(value);
    } else {
      // Valoarea nu există, afișăm un mesaj de eroare
      display = `⚠️ Invalid: ${value}`;
    }
  }
}
```

### 2. Afișarea Vizuală

#### Stilizarea Celulelor Invalide
```typescript
const getDisplayStyle = () => {
  if (display === "Empty") {
    return "text-gray-500 italic";
  } else if (display.startsWith("⚠️")) {
    return "text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1";
  }
  return "";
};
```

#### Mesaje de Eroare
- **Referință invalidă**: `⚠️ Invalid: {value}`
- **Fără cheie primară**: `⚠️ No primary key in {tableName}`
- **Tabel inexistent**: `⚠️ Reference table not found`

### 3. Editarea Celulelor Invalide

#### Opțiunea în Dropdown
```typescript
{/* Opțiunea pentru valoarea curentă dacă nu există în lista de opțiuni */}
{value && !options.some((opt) => {
  let primaryKeyValue = opt.displayValue;
  if (opt.displayValue.startsWith("#")) {
    primaryKeyValue = opt.displayValue.substring(1).split(" • ")[0];
  }
  return primaryKeyValue === value;
}) && (
  <SelectItem
    value={String(value)}
    className='truncate max-w-[380px] text-red-600'>
    <span className='truncate' title={`Invalid: ${value}`}>
      ⚠️ Invalid: {value}
    </span>
  </SelectItem>
)}
```

## Exemple de Utilizare

### Exemplu 1: Referință Invalidă

**Situație:**
- Celula conține valoarea "INVALID_CATEGORY"
- Această valoare nu există în tabelul de referință

**Afișare:**
- **Vizual**: `⚠️ Invalid: INVALID_CATEGORY` (cu fundal roșu)
- **Editare**: User poate face double-click pentru a edita
- **Dropdown**: Include opțiunea "⚠️ Invalid: INVALID_CATEGORY" în roșu

### Exemplu 2: Tabel Fără Cheie Primară

**Situație:**
- Tabelul de referință nu are o coloană marcată ca primary key

**Afișare:**
- **Vizual**: `⚠️ No primary key in Categories` (cu fundal roșu)
- **Editare**: User poate edita pentru a selecta o altă referință

### Exemplu 3: Tabel de Referință Inexistent

**Situație:**
- Tabelul de referință a fost șters sau nu există

**Afișare:**
- **Vizual**: `⚠️ Reference table not found` (cu fundal roșu)
- **Editare**: User poate edita pentru a selecta o altă referință

## Fluxul de Editare

### 1. Detectarea Problemei
- Sistemul verifică automat dacă valoarea există în tabelul de referință
- Afișează mesajul de eroare corespunzător

### 2. Editarea
- User face double-click pe celulă
- Se deschide dropdown-ul cu opțiuni
- Valoarea invalidă apare în roșu la începutul listei
- User poate selecta o valoare validă

### 3. Salvare
- User selectează o valoare validă
- Sistemul salvează noua valoare
- Celula se actualizează cu valoarea corectă

## Beneficii

### 1. Feedback Vizual Clar
- Celulele invalide sunt imediat identificabile
- Mesajele de eroare sunt descriptive
- Stilizarea roșie atrage atenția

### 2. Editare Ușoară
- User poate edita direct din celulă
- Dropdown-ul include toate opțiunile valide
- Valoarea invalidă rămâne selectabilă pentru referință

### 3. Prevenirea Erorilor
- Sistemul detectează automat referințele invalide
- User este informat despre probleme
- Poate corecta rapid erorile

## Stilizarea CSS

### Celule Invalide
```css
.text-red-600          /* Text roșu */
.bg-red-50            /* Fundal roșu deschis */
.border               /* Border */
.border-red-200       /* Border roșu */
.rounded              /* Colțuri rotunjite */
.px-2                 /* Padding orizontal */
.py-1                 /* Padding vertical */
```

### Opțiuni Invalide în Dropdown
```css
.text-red-600          /* Text roșu */
.truncate              /* Text trunchiat */
.max-w-[380px]         /* Lățime maximă */
```

## Testare

### Test Cases
1. **Referință invalidă**: Verifică că se afișează mesajul de eroare
2. **Editare**: Verifică că user poate edita celula
3. **Dropdown**: Verifică că valoarea invalidă apare în dropdown
4. **Salvare**: Verifică că se salvează noua valoare validă
5. **Actualizare**: Verifică că celula se actualizează după salvare

### Scenarii de Test
- Celulă cu valoare care nu există în tabelul de referință
- Celulă cu referință la tabel fără cheie primară
- Celulă cu referință la tabel inexistent
- Editarea și salvarea cu valoare validă 