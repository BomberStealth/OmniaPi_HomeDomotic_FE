# 🏠 OmniaPi Home Domotic - Frontend

Frontend dell'applicazione di domotica OmniaPi, realizzato con React, TypeScript e Tailwind CSS.

## 🎨 Caratteristiche

- **React 18** + **TypeScript** per type safety
- **Tailwind CSS** per styling con tema personalizzato effetto vetro
- **React Router** per navigazione
- **Zustand** per state management
- **Socket.io** per real-time updates
- **i18next** per internazionalizzazione (IT/EN)
- **Framer Motion** per animazioni fluide
- **Lucide React** per icone

## 🚀 Installazione Locale

```bash
# Installa dipendenze
npm install

# Avvia in development
npm run dev

# Build per produzione
npm run build

# Preview build
npm run preview
```

## 📁 Struttura Progetto

```
src/
├── components/
│   ├── common/          # Componenti riusabili (Button, Card, Input, Modal)
│   ├── layout/          # Layout e Sidebar
│   ├── dispositivi/     # Card controllo dispositivi (Luce, Tapparella, Termostato)
│   └── impianti/        # Componenti gestione impianti
├── pages/
│   ├── Auth/            # Login
│   ├── Dashboard/       # Dashboard principale
│   ├── Impianti/        # Lista e dettaglio impianti
│   ├── Dispositivi/     # Controllo dispositivi
│   ├── Scene/           # Shortcuts e automazioni
│   └── Settings/        # Impostazioni
├── services/
│   ├── api.ts           # Client API REST
│   └── socket.ts        # WebSocket client
├── store/
│   ├── authStore.ts     # State autenticazione
│   └── impiantiStore.ts # State impianti
├── types/               # TypeScript types
├── i18n/                # Traduzioni
│   ├── locales/
│   │   ├── it.json
│   │   └── en.json
│   └── index.ts
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Global styles + Glass effects
```

## 🎨 Tema Colori

Il tema è configurato in `tailwind.config.js`:

- **Primary**: `#6b56ff` (viola)
- **Secondary**: `#bf56ff` (magenta)
- **Background**: `#1a1a1a` (dark)
- **Foreground**: `#262626` (dark gray)
- **Success**: `#56ff56` (verde)
- **Warning**: `#ffff56` (giallo)
- **Error**: `#ff5656` (rosso)

### Classi Glass Effect

```css
.glass         /* Vetro semi-trasparente */
.glass-dark    /* Vetro scuro */
.glass-solid   /* Fondo solido con blur */
```

## 🔌 Configurazione

Crea un file `.env` (copia da `.env.example`):

```env
VITE_API_URL=http://192.168.1.11:3000
```

## 📱 Pagine

### Public
- `/login` - Login con JWT

### Protected (richiedono autenticazione)
- `/dashboard` - Dashboard con stats e shortcuts
- `/impianti` - Lista impianti
- `/impianti/:id` - Dettaglio impianto (piani, stanze, dispositivi)
- `/dispositivi` - Lista dispositivi
- `/scene` - Scene e automazioni
- `/settings` - Impostazioni utente

## 🔐 Autenticazione

L'app usa JWT token salvato in localStorage:
- Login tramite API `/api/auth/login`
- Token incluso automaticamente in tutte le richieste
- WebSocket connesso con stesso token
- Auto-redirect a `/login` se token scaduto

## 🌐 Internazionalizzazione

Cambio lingua:
```tsx
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();
i18n.changeLanguage('en'); // 'it' o 'en'
```

## 🎭 Componenti Principali

### Button
```tsx
<Button variant="primary" size="md" onClick={...}>
  Clicca
</Button>
```

### Card
```tsx
<Card variant="glass" hover padding>
  Contenuto
</Card>
```

### Modal
```tsx
<Modal isOpen={isOpen} onClose={...} title="Titolo">
  Contenuto
</Modal>
```

### Dispositivi
```tsx
<LuceCard dispositivo={luce} onUpdate={...} />
<TapparellaCard dispositivo={tapparella} onUpdate={...} />
<TermostatoCard dispositivo={termostato} onUpdate={...} />
```

## 🔄 State Management

### Auth Store
```tsx
const { user, login, logout } = useAuthStore();
```

### Impianti Store
```tsx
const { impianti, fetchImpianti, impiantoCorrente } = useImpiantiStore();
```

## 📡 Real-time

WebSocket connection per aggiornamenti live:
```tsx
// Automatico al login
socketService.connect(token);

// Join impianto room
socketService.joinImpianto(impiantoId);

// Ricevi updates
socketService.onDispositivoUpdate((dispositivo) => {
  // Aggiorna UI
});
```

## 🛠️ Build e Deploy

```bash
# Build ottimizzato
npm run build

# Output in dist/
# Deploy con Nginx (vedi setup-raspberry.sh nel repo BE)
```

## 📦 Dipendenze Principali

- `react` ^18.2.0
- `react-router-dom` ^6.20.1
- `tailwindcss` ^3.4.0
- `zustand` ^4.4.7
- `axios` ^1.6.2
- `socket.io-client` ^4.7.2
- `i18next` ^23.7.11
- `framer-motion` ^10.16.16
- `lucide-react` ^0.302.0

## 🔗 Link Utili

- **Backend Repository**: https://github.com/BomberStealth/OmniaPi_HomeDomotic_BE
- **Documentazione completa**: Vedi README nel repo Backend
- **Demo**: https://ofwd.asuscomm.com (quando deployed)

## 📄 Licenza

MIT
