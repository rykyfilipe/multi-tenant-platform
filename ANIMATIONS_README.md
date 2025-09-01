<!-- @format -->

# Animații Framer Motion - Multi-Tenant Platform

Acest document descrie animațiile implementate cu Framer Motion în aplicația
Multi-Tenant Platform.

## 🎨 Animații Implementate

### 1. Componente UI de Bază

#### Butoane (`src/components/ui/button.tsx`)

- **Hover**: Scale 1.02 cu tranziție smooth
- **Tap**: Scale 0.98 pentru feedback vizual
- **Initial**: Fade in cu deplasare verticală
- **Transition**: 0.3s ease-out

#### Carduri (`src/components/ui/card.tsx`)

- **Initial**: Fade in cu deplasare verticală (y: 20)
- **Hover**: Ridicare ușoară (y: -2)
- **Transition**: 0.4s ease-out

### 2. Autentificare

#### Google OAuth (`src/components/auth/OuthGoogle.tsx`)

- **Container**: Fade in cu deplasare verticală
- **Buton**: Hover scale și tap feedback
- **Icon Google**: Rotație continuă în timpul loading
- **Transition**: 0.5s ease-out

### 3. Navigare

#### Mobile Bottom Navbar (`src/components/Navbar.tsx`)

- **Container**: Slide in din partea de jos
- **Elemente**: Stagger animation cu delay progresiv
- **Icoane**: Hover scale și tap feedback
- **Transition**: 0.5s ease-out

#### Desktop Sidebar (`src/components/Navbar.tsx`)

- **Container**: Slide in din stânga
- **Elemente navigare**: Stagger animation cu delay
- **Icoane**: Hover scale și rotație
- **Tooltips**: Fade in/out smooth

### 4. Pagina Principală

#### Secțiuni (`src/app/page.tsx`)

- **Benefits**: Stagger animation pentru carduri
- **Features**: Fade in cu delay progresiv
- **Pricing**: Animații pentru planuri
- **Icoane**: Hover scale și rotație

### 5. Tabele

#### TableView (`src/components/table/rows/TableView.tsx`)

- **Rânduri**: Fade in cu stagger delay
- **AnimatePresence**: Pentru adăugare/ștergere rânduri
- **Transition**: 0.3s cu delay progresiv

#### Loading States (`src/components/table/rows/TableEditor.tsx`)

- **Spinner**: Rotație continuă
- **Text**: Fade in cu delay
- **Container**: Fade in cu deplasare verticală

### 6. Loading Components

#### Loading (`src/components/loading.tsx`)

- **Container**: Fade in cu deplasare verticală
- **Spinner**: Rotație continuă
- **Text**: Fade in cu delay
- **Buton**: Fade in cu delay

## 🛠️ Fișier de Animații Comune

### `src/lib/animations.ts`

Conține toate animațiile comune reutilizabile:

#### Animații de Bază

- `fadeInUp` - Fade in cu deplasare în sus
- `fadeInDown` - Fade in cu deplasare în jos
- `fadeInLeft` - Fade in cu deplasare la stânga
- `fadeInRight` - Fade in cu deplasare la dreapta
- `scaleIn` - Scale in cu fade
- `slideInFromBottom` - Slide in din partea de jos

#### Animații de Container

- `staggerContainer` - Container pentru stagger children
- `staggerItem` - Item pentru stagger animation

#### Animații de Hover

- `hoverScale` - Scale la hover și tap
- `hoverRotate` - Rotație la hover
- `hoverLift` - Ridicare la hover

#### Animații de Loading

- `spinAnimation` - Rotație continuă
- `pulseAnimation` - Pulsare

#### Animații Specializate

- `pageTransition` - Tranziții între pagini
- `modalAnimation` - Animații pentru modale
- `dropdownAnimation` - Animații pentru dropdown-uri
- `tooltipAnimation` - Animații pentru tooltip-uri
- `tableRowAnimation` - Animații pentru rânduri de tabel
- `cardAnimation` - Animații pentru carduri
- `buttonAnimation` - Animații pentru butoane
- `iconAnimation` - Animații pentru icoane

## 🎯 Beneficii

### 1. Experiență Utilizator Îmbunătățită

- Feedback vizual imediat pentru acțiuni
- Tranziții smooth între stări
- Loading states animate pentru a reduce percepția timpului

### 2. Profesionalism

- Animații consistente în toată aplicația
- Micro-interacțiuni care fac aplicația să pară mai polisată
- Tranziții care ghidează atenția utilizatorului

### 3. Performanță

- Animații optimizate cu Framer Motion
- Hardware acceleration pentru animații smooth
- AnimatePresence pentru animații de intrare/ieșire

## 🚀 Utilizare

### Import Animații

```typescript
import { motion } from "framer-motion";
import { fadeInUp, hoverScale, spinAnimation } from "@/lib/animations";
```

### Aplicare Animații

```typescript
// Animație de bază
<motion.div {...fadeInUp}>
  Content
</motion.div>

// Animație cu hover
<motion.div {...hoverScale}>
  Interactive Element
</motion.div>

// Animație de loading
<motion.div {...spinAnimation}>
  Loading Spinner
</motion.div>
```

### Stagger Animation

```typescript
<motion.div variants={staggerContainer} initial='initial' animate='animate'>
	{items.map((item, index) => (
		<motion.div key={index} variants={staggerItem}>
			{item.content}
		</motion.div>
	))}
</motion.div>
```

## 📱 Responsive Design

Toate animațiile sunt optimizate pentru:

- **Mobile**: Animații mai rapide și mai subtile
- **Tablet**: Animații moderate
- **Desktop**: Animații complete cu toate efectele

## ⚡ Performanță

- Animațiile folosesc `transform` și `opacity` pentru performanță optimă
- Hardware acceleration activat automat
- Animații reduse pe dispozitive cu performanță limitată
- Lazy loading pentru animații complexe

## 🎨 Personalizare

Animațiile pot fi personalizate prin:

- Modificarea duratei în `src/lib/animations.ts`
- Ajustarea delay-urilor pentru stagger animations
- Adăugarea de noi variante de animații
- Customizarea easing functions

## 🔧 Debugging

Pentru debugging animațiilor:

1. Adaugă `layoutId` pentru animații de layout
2. Folosește `onAnimationComplete` pentru callback-uri
3. Activează `reducedMotion` pentru utilizatori cu sensibilitate
4. Testează pe dispozitive cu performanță diferită

## 📚 Resurse

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Animation Best Practices](https://web.dev/animations/)
- [Performance Guidelines](https://developers.google.com/web/fundamentals/design-and-ux/animations/animations-and-performance)
