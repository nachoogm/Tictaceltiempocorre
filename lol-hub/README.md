# 🛡️ LoL Hub — Tictac el tiempo corre

Dashboard del grupo (Azure Static Web Apps + Azure Functions + Table Storage).

## ⚠️ Al añadir/quitar cuentas hay que tocar 2 sitios
1. **`config.js`** → array `people` (agrupado por persona)
2. **`api/cron-lp/index.js`** → array `PLAYERS` (lista plana, para el snapshot diario)
Si no actualizas el 2º, esa cuenta **no** guardará histórico de LP.

## Estructura de config.js
```js
people:[
  { person:"Cebo", icon:"Galio", accounts:[
      { riotId:"Cebolokoh98#SOC", rol:"Top", main:"Galio" }, ...
  ]}, ...
]
```
`person` = nombre real · `icon` = campeón del avatar de grupo · cada cuenta con su rol y main.

## Páginas
Inicio (agrupado por persona) · Power Ranking (por persona / por cuenta) · Evolución de LP
(filtros semana/mes/90d, divisiones en el eje, leyenda clicable, tooltip) · En vivo · Campeones ·
LoLdle (8 columnas como el original) · Entreno (4 minijuegos + ranking compartido).

## API
`/api/summoner` `/api/matches` `/api/match` `/api/live` `/api/lp` `/api/scores` `/api/cron-lp`

## Variables de entorno (Azure → SWA → Environment variables)
`RIOT_API_KEY` · `TABLES_CONNECTION_STRING` · `CRON_SECRET` (también en GitHub → Secrets)

## Timer
`.github/workflows/lp-cron.yml` → 23:00 Madrid. Retención 90 días (purga automática).

## Datos curados
`loldle-data.js` contiene género, especie, región y año de los 171 campeones (Data Dragon
no los expone). Si ves algo mal, se corrige en una línea.
