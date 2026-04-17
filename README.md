# BC Migration Tracker

Sito web per tracciare lo stato della migrazione delle dipendenze Business Central.

## Funzionalità

- **Kanban board** con livelli di compilazione, color-coded (rosso/giallo/verde)
- **Checklist** per le app da installare
- **Autenticazione email/password** via Supabase Auth
- **Sincronizzazione real-time** via Supabase Realtime
- **Import** da file `.txt` (output dello script) o `.json`
- **Tracking utente** per ogni modifica di stato
- **Hosting gratuito** su GitHub Pages

## Setup

### 1. Creare un progetto Supabase

1. Vai su [Supabase](https://supabase.com/) e crea un account (gratuito)
2. Crea un nuovo progetto
3. Vai su **SQL Editor** e incolla il contenuto di `supabase-setup.sql`, poi esegui
4. Vai su **Authentication** → **Providers** → verifica che **Email** sia abilitato

### 2. Configurare le variabili d'ambiente

Copia `.env.example` in `.env`:

```bash
cp .env.example .env
```

I valori si trovano in: Supabase Dashboard → **Settings** → **API**:
- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_ANON_KEY` = anon/public key

### 3. Installare e avviare in locale

```bash
npm install
npm run dev
```

### 4. Deploy su GitHub Pages

1. Crea un repository GitHub e pusha il codice
2. Vai su **Settings** → **Pages** → Source: **GitHub Actions**
3. Vai su **Settings** → **Secrets and variables** → **Actions** → aggiungi:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Ogni push su `main` farà il deploy automatico

**Nota:** aggiorna `base` in `vite.config.ts` col nome del tuo repository se diverso da `sito-migrazione`.

## Formato file di importazione

### Formato testo (output dello script)

Il file `.txt` deve seguire il formato dell'output dello script con le sezioni
"App da installare:" e "App da compilare in ordine:" con i livelli.
Vedi `sample-migration.txt` per un esempio.

### Formato JSON

```json
{
  "name": "Migrazione v26",
  "installApps": [
    "Nome App 1",
    "Nome App 2"
  ],
  "compileLevels": [
    {
      "level": 0,
      "apps": ["App A", "App B"]
    },
    {
      "level": 1,
      "apps": ["App C"]
    }
  ]
}
```

## Logica colori livelli

| Colore | Significato |
|--------|-------------|
| 🔴 Rosso | **Bloccato** — i livelli precedenti non sono completati |
| 🟡 Giallo | **Disponibile** — si può lavorare su questo livello |
| 🟢 Verde | **Completato** — tutte le app del livello sono migrate |

## Stati delle app

Ogni app da compilare ha tre stati ciclici (click sul pulsante):

1. **Da fare** → 2. **In corso** → 3. **Completata** → (torna a 1)
