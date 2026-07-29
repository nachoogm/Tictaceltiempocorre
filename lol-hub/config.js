/* =====================================================================
   ⚙️  CONFIGURACIÓN DEL GRUPO  — edita SOLO este archivo
   ---------------------------------------------------------------------
   region: euw · eune · na · kr · br · jp · las · lan · oce · tr · ru
   riotId: "Nombre#TAG" (lo ves arriba a la derecha en el cliente de LoL)
   main:   nombre del campeón para la FOTO de perfil (tal cual DataDragon:
           Galio, Akshan, Vayne, Lulu, Ahri, LeeSin, MissFortune...)
   liveStats: true = trae rango/winrate/maestrías/en-partida/historial
   ===================================================================== */

const CONFIG = {
  groupName: "Tictac el tiempo corre",
  tagline:  "El tiempo corre… y nosotros farmeamos",
  region: "euw",
  liveStats: true,
  matchCount: 4,   // nº de partidas del historial por jugador

  players: [
    { riotId: "Cebolokoh98#SOC",      rol: "Top",     main: "Galio"  },
    { riotId: "BARI POPPYNS#2025",      rol: "Top",   main: "Poppy"  },
    { riotId: "MLVVND El Piruko#EUW",  rol: "Jungla",  main: "Leesin" },
    { riotId: "ette secht#EUW",        rol: "Mid",     main: "Akshan"   },
    { riotId: "Hi Im Gonza#7385",      rol: "Mid",     main: "Fizz"   },
    { riotId: "Parisuko#EUW",          rol: "ADC",     main: "Vayne"  },
    { riotId: "tacua#EUW",             rol: "Support", main: "Lulu"   }
  ]
};
