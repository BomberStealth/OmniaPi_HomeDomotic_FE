# OmniaPi Frontend Architecture

## Stack Tecnologico
- React 18 + TypeScript
- Vite (build tool)
- Zustand (stato globale)
- TanStack Query (chiamate API + cache)
- Socket.io-client (WebSocket)
- Tailwind CSS / CSS Modules (styling)

## Struttura Cartelle
```
src/
├── api/              # Chiamate API (una per entità)
│   ├── auth.api.ts
│   ├── impianti.api.ts
│   ├── dispositivi.api.ts
│   └── index.ts
│
├── stores/           # Zustand stores
│   ├── authStore.ts
│   ├── impiantoStore.ts
│   ├── dispositiviStore.ts
│   └── index.ts
│
├── hooks/            # Custom hooks riutilizzabili
│   ├── useAuth.ts
│   ├── useDispositivi.ts
│   └── useSocket.ts
│
├── components/       # Componenti riutilizzabili (UI pura)
│   ├── ui/           # Bottoni, Input, Card, Modal
│   ├── layout/       # Sidebar, Header, BottomNav
│   └── devices/      # Card dispositivi
│
├── pages/            # Pagine (usano hooks e componenti)
│   ├── Dashboard/
│   ├── Dispositivi/
│   └── Settings/
│
├── services/         # Logica complessa
│   └── socket.service.ts
│
├── types/            # TypeScript types/interfaces
│   └── index.ts
│
└── utils/            # Utility functions
    └── helpers.ts
```

## Regole Fondamentali

### 1. Flusso Dati Unidirezionale
- I dati vivono nello STORE (Zustand)
- I componenti LEGGONO dallo store
- Le azioni AGGIORNANO lo store
- MAI stato locale per dati condivisi

### 2. Componenti "Stupidi"
- I componenti ricevono props e renderizzano
- NESSUNA chiamata API dentro i componenti
- NESSUN calcolo di permessi nei componenti
- Logica nei hooks o nello store

### 3. API Layer
- Tutte le chiamate passano da TanStack Query
- Cache automatica
- Retry automatico
- Loading/Error states gestiti

### 4. WebSocket
- UN solo listener in socket.service.ts
- Aggiorna lo store quando arrivano eventi
- I componenti NON ascoltano direttamente

### 5. Permessi
- I permessi arrivano dal BACKEND
- Il frontend NON calcola mai i permessi
- Ogni API ritorna i permessi insieme ai dati

### 6. Naming Conventions
- Files: camelCase (authStore.ts)
- Componenti: PascalCase (DeviceCard.tsx)
- Hooks: useNome (useDispositivi.ts)
- Store: nomeStore (authStore.ts)
- API: nome.api.ts (dispositivi.api.ts)

## Contratto API Standard

Ogni risposta API ha questa struttura:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "permissions": {
      "canControl": true,
      "canView": true,
      "canManage": false
    }
  }
}
```

## WebSocket Events Standard

Tutti gli eventi seguono questa struttura:
```json
{
  "type": "DEVICE_STATUS_CHANGED",
  "payload": {
    "deviceId": 1,
    "online": true,
    "state": { ... }
  },
  "timestamp": "2024-01-21T12:00:00Z"
}
```

## Flusso Dati Dispositivi

```
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  MQTT ─► mqtt.ts ─► omniapiState ─► WebSocket emit          │
│                                                              │
│  Gateway status ──► updateGatewayFromMqtt() ──► DB + WS     │
│  Node state ─────► updateNodeState() ────────► Memory + WS  │
│  Health check ───► checkNodeHealth() ────────► DB + WS      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ WebSocket Events
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                                                              │
│  socket.service.ts                                          │
│       │                                                      │
│       ├── omniapi-gateway-update ──► omniapiStore           │
│       ├── omniapi-node-update ────► omniapiStore            │
│       ├── omniapi-nodes-update ───► omniapiStore            │
│       ├── omniapi-led-update ─────► omniapiStore            │
│       └── dispositivo-update ─────► dispositiviStore        │
│                                                              │
│  Stores ─────► Hooks ─────► Components (React)              │
└─────────────────────────────────────────────────────────────┘
```

## Eventi WebSocket Attuali

| Evento | Descrizione | Payload |
|--------|-------------|---------|
| `omniapi-gateway-update` | Stato gateway aggiornato | `{ online, ip, version, nodeCount, mqttConnected }` |
| `omniapi-node-update` | Singolo nodo aggiornato | `{ mac, online, rssi, relay1, relay2 }` |
| `omniapi-nodes-update` | Lista nodi aggiornata | `OmniapiNode[]` |
| `omniapi-led-update` | LED strip aggiornato | `{ mac, power, r, g, b, brightness, effect }` |
| `dispositivo-update` | Dispositivo DB aggiornato | `{ dispositivo, action }` |
| `stanza-update` | Stanza aggiornata | `{ stanza, action }` |
| `scena-update` | Scena aggiornata | `{ scena, action }` |

## Stores Esistenti

- **authStore**: autenticazione, token, utente
- **impiantiStore**: lista impianti, impianto corrente
- **dispositiviStore**: dispositivi dell'impianto
- **stanzeStore**: stanze dell'impianto
- **sceneStore**: scene dell'impianto
- **omniapiStore**: gateway, nodi ESP-NOW, LED strips
