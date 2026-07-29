/* =====================================================================
   ⚙️  CONFIGURACIÓN DEL GRUPO  — edita SOLO este archivo
   ---------------------------------------------------------------------
   region: euw · eune · na · kr · br · jp · las · lan · oce · tr · ru
   riotId: "Nombre#TAG" (lo ves arriba a la derecha en el cliente de LoL)
   liveStats: true = trae rango/winrate/maestrías/en-partida (necesita la
              Azure Function + RIOT_API_KEY en Azure)
   ===================================================================== */

const CONFIG = {
  groupName: "Tictac el tiempo corre",
  tagline:  "El tiempo corre… y nosotros farmeamos",
  region: "euw",
  liveStats: true,

  players: [
    { riotId: "Cebolokoh98#SOC",      rol: "Top",     main: "Sett" },
    { riotId: "MLVVND El Piruko#EUW",  rol: "Jungla",  main: "LeeSin" },
    { riotId: "ette secht#EUW",        rol: "Mid",     main: "Ahri" },
    { riotId: "Parisuko#EUW",          rol: "ADC",     main: "Jinx" },
    { riotId: "tacua#EUW",             rol: "Support", main: "Thresh" }
  ]
};
