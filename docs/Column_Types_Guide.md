<!-- @format -->

# Ghid pentru Tipurile de Coloane

## Tipuri de Coloane Disponibile

### 📝 **Text**

- **Descriere**: Text liber pentru nume, descrieri, note
- **Exemplu**: Numele unui produs, descrierea unui eveniment
- **Validare**: Acceptă orice text
- **Interfață**: Câmp text liber

### 🔢 **Number**

- **Descriere**: Numere pentru prețuri, cantități, scoruri
- **Exemplu**: Prețul unui produs, numărul de unități
- **Validare**: Doar numere valide
- **Interfață**: Câmp numeric cu validare

### ✅ **Yes/No**

- **Descriere**: Răspunsuri simple Da sau Nu
- **Exemplu**: Produsul este în stoc? Evenimentul este activ?
- **Validare**: Doar "true" sau "false"
- **Interfață**: Dropdown cu opțiuni Da/Nu

### 📅 **Date**

- **Descriere**: Selecție de dată din calendar
- **Exemplu**: Data de început, data de expirare
- **Validare**: Dată validă
- **Interfață**: Selector de dată

### 🔗 **Link to another table**

- **Descriere**: Conectează la date din altă tabelă
- **Exemplu**: Categoria unui produs (link către tabela Categorii)
- **Validare**: Valoare existentă în tabela referită
- **Interfață**: Dropdown cu opțiuni din tabela referită

## Proprietăți ale Coloanelor

### 🔴 **Required (Obligatoriu)**

- **Descriere**: Câmpul trebuie completat obligatoriu
- **Când să folosești**: Pentru informații esențiale
- **Exemplu**: Numele unui produs, email-ul unui utilizator

### 🔑 **Primary Key (Cheie Principală)**

- **Descriere**: Identificator unic pentru tabelă
- **Când să folosești**: Pentru a identifica unic fiecare rând
- **Exemplu**: ID-ul unui produs, codul unui utilizator
- **Limitare**: O singură cheie principală per tabelă

## Exemple de Utilizare

### Tabela "Produse"

| Nume Coloană  | Tip                   | Required | Primary Key | Descriere            |
| ------------- | --------------------- | -------- | ----------- | -------------------- |
| ID            | Number                | ✅       | ✅          | Identificator unic   |
| Nume          | Text                  | ✅       | ❌          | Numele produsului    |
| Preț          | Number                | ✅       | ❌          | Prețul în lei        |
| Categorie     | Link to another table | ❌       | ❌          | Categoria produsului |
| În Stoc       | Yes/No                | ✅       | ❌          | Dacă este disponibil |
| Data Adăugare | Date                  | ❌       | ❌          | Când a fost adăugat  |

### Tabela "Categorii"

| Nume Coloană | Tip    | Required | Primary Key | Descriere             |
| ------------ | ------ | -------- | ----------- | --------------------- |
| ID           | Number | ✅       | ✅          | Identificator unic    |
| Nume         | Text   | ✅       | ❌          | Numele categoriei     |
| Descriere    | Text   | ❌       | ❌          | Descrierea categoriei |

## Sfaturi de Utilizare

### 🎯 **Pentru începători:**

1. **Începe cu Text** pentru majoritatea câmpurilor
2. **Folosește Number** doar pentru valori numerice
3. **Yes/No** pentru întrebări simple
4. **Date** pentru orice tip de dată

### 🔗 **Pentru relații între tabele:**

1. **Creează mai întâi tabela principală** (ex: Categorii)
2. **Adaugă o coloană Primary Key** în tabela principală
3. **Folosește Link to another table** în tabela secundară
4. **Selectează tabela principală** din dropdown

### ⚠️ **Limitări importante:**

- **O singură cheie principală** per tabelă
- **Link-urile** funcționează doar cu tabele care au cheie principală
- **Câmpurile obligatorii** trebuie completate la crearea rândurilor

## Migrarea de la Tipurile Vechi

### Tipurile vechi au fost redenumite pentru claritate:

- `string` → `text`
- `boolean` → `yesNo`
- `reference` → `link to another table`
- `number` și `date` rămân neschimbate

### Proprietatea `autoIncrement` a fost eliminată:

- Nu mai este necesară pentru utilizatorii non-programatori
- Valorile unice pot fi create manual sau prin alte metode
