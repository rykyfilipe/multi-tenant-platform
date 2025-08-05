<!-- @format -->

# Ghid pentru Planuri și Limite

## Planuri Disponibile

### 🆓 **Free Plan**

- **Preț**: Gratuit
- **Perfect pentru**: Indivizi și proiecte mici
- **Limite**:
  - 1 bază de date
  - 5 tabele
  - 2 utilizatori
  - 1 API token
  - 100 MB storage
  - 10.000 rânduri
  - 0 tabele publice

### ⭐ **Pro Plan**

- **Preț**: $29/lună
- **Perfect pentru**: Echipe și afaceri
- **Limite**:
  - 5 baze de date
  - 25 tabele
  - 10 utilizatori
  - 5 API tokens
  - 1 GB storage
  - 100.000 rânduri
  - 2 tabele publice

### 🏢 **Business Plan**

- **Preț**: $99/lună
- **Perfect pentru**: Echipe mari și organizații
- **Limite**:
  - Baze de date nelimitate
  - Tabele nelimitate
  - Utilizatori nelimitați
  - 10 API tokens
  - 5 GB storage
  - 1.000.000 rânduri
  - 10 tabele publice

## Cum Funcționează Limitele

### 📊 **Storage (Spațiul de Stocare)**

- **Calculat**: Automat în funcție de dimensiunea datelor
- **Măsurat în**: MB (Free), GB (Pro/Business)
- **Include**: Toate datele din tabele, inclusiv celulele și metadata
- **Limitare**: Nu poți crea rânduri noi când depășești limita

### 📈 **Rows (Rânduri)**

- **Calculat**: Numărul total de rânduri din toate tabelele
- **Măsurat în**: Număr de rânduri
- **Include**: Toate rândurile din toate tabelele din toate bazele de date
- **Limitare**: Nu poți crea rânduri noi când depășești limita

### 🗄️ **Databases (Baze de Date)**

- **Calculat**: Numărul de baze de date create
- **Limitare**: Nu poți crea baze de date noi când depășești limita

### 📋 **Tables (Tabele)**

- **Calculat**: Numărul de tabele din toate bazele de date
- **Limitare**: Nu poți crea tabele noi când depășești limita

### 👥 **Users (Utilizatori)**

- **Calculat**: Numărul de utilizatori din tenant
- **Limitare**: Nu poți adăuga utilizatori noi când depășești limita

### 🔑 **API Tokens**

- **Calculat**: Numărul de token-uri API create
- **Limitare**: Nu poți crea token-uri noi când depășești limita

### 🌐 **Public Tables**

- **Calculat**: Numărul de tabele marcate ca publice
- **Limitare**: Nu poți face tabele publice când depășești limita

## Ce Se Întâmplă la Depășirea Limitelor

### ✅ **Poți Face:**

- **Vizualiza** toate datele existente
- **Edita** datele existente
- **Exporta** datele
- **Accesa** API-ul pentru datele existente

### ❌ **Nu Poți Face:**

- **Crea rânduri noi** când depășești limita de rânduri
- **Crea tabele noi** când depășești limita de tabele
- **Adăuga utilizatori** când depășești limita de utilizatori
- **Crea API tokens** când depășești limita de token-uri

### ⚠️ **Notificări:**

- **Mesaje de eroare** clare când încerci să depășești o limită
- **Sugestii de upgrade** în interfață
- **Monitorizare în timp real** a utilizării

## Upgrade și Downgrade

### 🔄 **Upgrade:**

- **Instant**: Limitele noi se aplică imediat
- **Date păstrate**: Toate datele existente rămân
- **Funcționalitate**: Acces imediat la noile limite

### 🔽 **Downgrade:**

- **Date păstrate**: Toate datele existente rămân
- **Acces limitat**: Nu poți crea resurse noi până la upgrade
- **Funcționalitate**: Poți continua să lucrezi cu datele existente

## Exemple de Utilizare

### 📊 **Exemplu Free Plan:**

```
Baza de date: "Magazin Online"
├── Tabela "Produse" (2.500 rânduri)
├── Tabela "Categorii" (50 rânduri)
├── Tabela "Utilizatori" (1.000 rânduri)
└── Tabela "Comenzi" (6.000 rânduri)
Total: 9.550 rânduri (sub limita de 10.000)
```

### 📈 **Exemplu Pro Plan:**

```
Baza de date: "CRM Business"
├── Tabela "Clienți" (25.000 rânduri)
├── Tabela "Vânzări" (50.000 rânduri)
├── Tabela "Produse" (5.000 rânduri)
└── Tabela "Utilizatori" (20.000 rânduri)
Total: 100.000 rânduri (la limita planului)
```

## Sfaturi de Optimizare

### 💾 **Pentru Storage:**

- **Șterge date vechi** care nu mai sunt necesare
- **Optimizează tipurile de date** (folosește numere în loc de text pentru
  valori numerice)
- **Comprima fișierele** înainte de import

### 📊 **Pentru Rânduri:**

- **Arhivează datele vechi** în tabele separate
- **Folosește filtre** pentru a lucra doar cu datele necesare
- **Optimizează structura** tabelelor pentru a evita duplicarea datelor

### 🎯 **Pentru Utilizatori:**

- **Revizuiește periodic** lista de utilizatori
- **Șterge conturile inactive**
- **Folosește roluri** pentru a limita accesul

## Migrarea de la Planurile Vechi

### 🔄 **Schimbări de Nume:**

- `Starter` → `Free`
- `Enterprise` → `Business`
- `Pro` rămâne neschimbat

### 📊 **Noi Limite:**

- **Storage**: Măsurat în MB/GB în loc de GB
- **Rows**: Nouă limită pentru numărul total de rânduri
- **Alte limite**: Rămân neschimbate

### ✅ **Compatibilitate:**

- **Datele existente** rămân intacte
- **Funcționalitatea** rămâne aceeași
- **API-ul** rămâne compatibil
