# 🛡️ LoL Hub — Tictac el tiempo corre

Dashboard del grupo para League of Legends, desplegado en **Azure Static Web Apps** con **Azure Functions**.

## Páginas
- **Inicio** — tarjetas de jugadores (rango, mains, historial clicable, racha) + buscador de invocador EUW + filtros (orden/posición).
- **Power Ranking** — clasificación SoloQ/Flex en vivo.
- **Evolución de LP** — rachas + gráfica de LP (histórico COMPARTIDO en Azure Table Storage).
- **En vivo** — partidas en directo del grupo (spectator-v5).
- **Campeones** — tier list + build orientativa + links a DPM/OP.GG.
- **LoLdle** — adivina el campeón (5 modos).
- **Entreno** — 4 minijuegos de reflejos + **ranking del grupo COMPARTIDO** (Azure).

## API (Azure Functions, carpeta /api)
| Ruta | Qué hace |
|---|---|
| `/api/summoner` | Rango SoloQ+Flex, nivel, maestrías, en-partida |
| `/api/matches` | Historial resumido (match-v5) |
| `/api/match` | Detalle completo de una partida |
| `/api/live` | Partida en vivo (spectator-v5) |
| `/api/lp` | Histórico de LP compartido (Table Storage) |
| `/api/scores` | Leaderboards compartidos (Entreno, etc.) |
| `/api/cron-lp` | Snapshot diario de LP + purga a 90 días (lo dispara el GitHub Action) |

## Variables de entorno (Azure → SWA → Environment variables)
- `RIOT_API_KEY` — clave de la Riot API
- `TABLES_CONNECTION_STRING` — connection string del Storage Account (para LP y ranking compartidos)
- `CRON_SECRET` — contraseña para proteger `/api/cron-lp` (mismo valor en GitHub → Secrets)

## Timer diario
`.github/workflows/lp-cron.yml` — GitHub Action que llama a `/api/cron-lp` a las 23:00 (Madrid) y guarda el LP de todos. Retención: **90 días** (purga automática).
