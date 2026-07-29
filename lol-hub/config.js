/* =====================================================================
   ⚙️  CONFIGURACIÓN DEL GRUPO  — edita SOLO este archivo
   ---------------------------------------------------------------------
   1) Cambia REGION por la vuestra (euw, eune, na, kr, las, lan...)
   2) Añade/quita jugadores. El formato del Riot ID es:  Nombre#TAG
      (lo ves arriba a la derecha en el cliente de LoL).
   3) 'rol' y 'main' son opcionales, solo decoran la tarjeta.
   ===================================================================== */

const CONFIG = {
  // Nombre que aparece en la cabecera
  groupName: "Tictac el tiempo corre",

  // Región de la cuenta (en minúsculas)
  //   euw · eune · na · kr · br · jp · las · lan · oce · tr · ru · sea
  region: "euw",

  // Activar datos EN VIVO (rango, winrate, nivel) vía Azure Function.
  //   true  = intenta leer /api/summoner (necesita la Riot API key en Azure)
  //   false = solo enlaces a los trackers (funciona sin backend)
  liveStats: true,

  // Vuestros jugadores
  players: [
    { riotId: "Cebolokoh98#SOC",     rol: "Top",     main: "Sett" },
    { riotId: "MLVVND El Piruko#EUW", rol: "Jungla",  main: "LeeSin" },
    { riotId: "ette secht#EUW",       rol: "Mid",     main: "Ahri" },
    { riotId: "Parisuko#EUW",         rol: "ADC",     main: "Jinx" },
    { riotId: "tacua#EUW",            rol: "Support", main: "Thresh" }
  ]
};
