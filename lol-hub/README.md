# 🛡️ LoL Hub — Tictac el tiempo corre

## ⚠️ Al añadir/quitar cuentas hay que tocar 3 sitios
1. `config.js` → `people`
2. `api/group/index.js` → `ACCOUNTS`
3. `api/cron-lp/index.js` → `PLAYERS`

## 🎵 Playlist
Sube los `.mp3` a la carpeta **`music/`** con los nombres exactos de `config.js → songs`.
La música sigue sonando al cambiar de página (guarda pista + segundo en localStorage).

## ⚡ Rendimiento
`/api/group` agrupa las 12 cuentas en **1 sola petición** con caché de servidor (3 min)
compartida por todos + stale-while-revalidate en el navegador → carga casi instantánea.

## Variables de entorno (Azure → SWA)
`RIOT_API_KEY` · `TABLES_CONNECTION_STRING` · `CRON_SECRET`
