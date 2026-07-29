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

## 5. ¿Quieres datos EN VIVO (rango, LP, winrate, KDA) dentro de la web?

Eso ya requiere la **Riot API** (necesita API key y no puede ir en un sitio 100% estático porque expondría la key). La forma limpia:

- Añadir una **Azure Function** (carpeta `/api`) que guarde la key en *Application Settings* y llame a `account-v1` + `league-v4`.
- SWA ya trae Functions integradas → solo pones `Api location: api`.

Si te interesa, te monto el `/api` con la Function y te pinto rango + winrate en cada tarjeta. Dímelo y lo añado. 😉
