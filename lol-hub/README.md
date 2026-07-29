# 🛡️ LoL Hub — Cuartel general del grupo

Dashboard estático (sin backend) para tener siempre a mano los perfiles de League of Legends de tu grupo: **OP.GG, DPM.LOL, U.GG, Porofessor y DeepLoL** de cada jugador con un clic, más un botón de **multi-search** que abre a los 5-6 en una sola vista de equipo.

---

## 1. Personalízalo (30 segundos)

Abre **`config.js`** y edita:

```js
const CONFIG = {
  groupName: "La Cueva del Poro",   // nombre de tu grupo
  region: "euw",                    // euw · eune · na · kr · las · lan · ...
  players: [
    { riotId: "TuNombre#TAG", rol: "Mid", main: "Ahri" },
    ...
  ]
};
```

- El **Riot ID** es `Nombre#TAG` (lo ves arriba a la derecha en el cliente de LoL).
- `rol` y `main` son opcionales (el `main` pone el icono del campeón en la tarjeta).

Eso es lo **único** que hay que tocar. Todo lo demás es automático.

---

## 2. Probarlo en local

```bash
# desde la carpeta del proyecto
python -m http.server 8080
# abre http://localhost:8080
```

---

## 3. Desplegar en Azure Static Web Apps (gratis)

### Opción A — Desde GitHub (recomendada, CI/CD automático)
1. Sube esta carpeta a un repo de GitHub.
2. Portal de Azure → **Create resource → Static Web App**.
3. Plan **Free** → conecta tu repo.
4. Build details:
   - **App location:** `/`
   - **Api location:** *(vacío)*
   - **Output location:** *(vacío)*
5. Create. En ~2 min tendrás una URL `https://<algo>.azurestaticapps.net`.
   Cada `git push` la actualiza sola.

### Opción B — Desde la CLI (sin GitHub)
```bash
npm install -g @azure/static-web-apps-cli
az staticwebapp create -n lol-hub -g <tu-RG> -l westeurope --sku Free
swa deploy ./ --deployment-token <token-del-portal> --env production
```

> Como ya trabajas con SWA, puedes añadirle un **dominio propio** (Custom Domain) desde el portal igual que hiciste con la otra web.

---

## 4. Extras incluidos

| Herramienta | Para qué sirve |
|---|---|
| 👥 **Multi-search OP.GG** | Abre a todo el grupo en una vista de equipo |
| 🗂️ **Abrir en pestañas** | Un perfil por pestaña de golpe |
| 📋 **Copiar sala** | Copia los Riot IDs para pegar en Porofessor/OP.GG |
| 🎲 **Campeón aleatorio** | Ruleta con iconos (retos / ARAM) |
| 🎯 **¿Quién elige primero?** | Sortea un jugador del grupo |
| 🪙 **Lado azul/rojo** | Para las custom y scrims |
| 📊 **Tier list / 📜 Parche / 📺 Esports** | Accesos directos a la meta |

El **parche actual** y los **iconos de campeones** se leen en vivo de **Riot Data Dragon** (sin API key, sin coste).

---

## 5. 🔥 Datos EN VIVO (rango · LP · winrate · nivel)  — YA INCLUIDO

La carpeta **`/api`** contiene una **Azure Function** que consulta la Riot API y pinta el rango de cada jugador en su tarjeta. Se activa con `liveStats: true` en `config.js` (ya está activado).

### Cómo activarlo (5 min)

**a) Consigue una Riot API key**
1. Entra en https://developer.riotgames.com con tu cuenta de Riot.
2. Copia la **Development API Key** (dura 24 h, se regenera; para algo permanente registra un "Personal API Key" / producto).

**b) Despliega con la API**
En Azure SWA, build details:
- **App location:** `/`
- **Api location:** `api`   ← ¡importante!
- **Output location:** *(vacío)*

**c) Guarda la key en Azure (NUNCA en el código)**
Portal → tu Static Web App → **Settings → Environment variables** (o *Application settings*) → añade:

| Nombre | Valor |
|---|---|
| `RIOT_API_KEY` | `RGAPI-xxxxxxxx-...` |

Guarda y listo. La Function lee `process.env.RIOT_API_KEY`, así que la key **jamás** viaja al navegador. ✅

### Endpoints que usa (routing correcto para EUW → `europe` + `euw1`)
1. `account-v1/by-riot-id/{nombre}/{tag}` → PUUID (clúster `europe`/`americas`/`asia`).
2. `summoner-v4/by-puuid` → nivel + icono (plataforma `euw1`).
3. `league-v4/entries/by-puuid` → rango SoloQ/Flex, LP, victorias/derrotas.

Incluye **caché de 10 min** en memoria para no chocar con el rate limit de Riot.

> ⚠️ Con la *Development Key* (24 h) los stats se cortan al caducar; regenérala o pide una key de producto para tenerlo estable.
> Si `liveStats: false`, la web funciona igual pero solo con enlaces (sin backend).
