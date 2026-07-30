/* =====================================================================
   ⚙️  CONFIGURACIÓN DEL GRUPO — edita SOLO este archivo
   ---------------------------------------------------------------------
   Ahora agrupado por PERSONA. Cada persona puede tener varias cuentas
   (main + smurfs). Formato:
     { person:"Cebo", main:"Galio", accounts:[ {riotId, rol, main}, ... ] }
   ⚠️ Si añades/quitas cuentas, actualiza también la lista PLAYERS de
      api/cron-lp/index.js (snapshot diario de LP).
   ===================================================================== */
const CONFIG = {
  groupName: "Tictac el tiempo corre",
  tagline:  "El tiempo corre… y nosotros farmeamos",
  region: "euw",
  liveStats: true,
  matchCount: 3,     // partidas por cuenta (3 con 12 cuentas: protege el rate limit)

  people: [
    { person:"Cebo", icon:"Galio", accounts:[
      { riotId:"Cebolokoh98#SOC",       rol:"Top", main:"Galio" },
      { riotId:"nachotheboss98#EUW",    rol:"Top", main:"Gnar"  }
    ]},
    { person:"Bari", icon:"Poppy", accounts:[
      { riotId:"BARI POPPYNS#2025",     rol:"Top", main:"Poppy" }
    ]},
    { person:"Piruko", icon:"LeeSin", accounts:[
      { riotId:"MLVVND El Piruko#EUW",  rol:"Jungla", main:"LeeSin" },
      { riotId:"hhecarim benzema#EUW",  rol:"Jungla", main:"Zed"    }
    ]},
    { person:"Pol", icon:"Naafiri", accounts:[
      { riotId:"ette secht#EUW",        rol:"Mid", main:"Naafiri" },
      { riotId:"KASSSSSSS#EUW",         rol:"Mid", main:"Akshan"  }
    ]},
    { person:"Gonza", icon:"Fizz", accounts:[
      { riotId:"Hi Im Gonza#7385",      rol:"Mid", main:"Fizz" }
    ]},
    { person:"Paris", icon:"Vayne", accounts:[
      { riotId:"Parisuko#EUW",          rol:"ADC", main:"Vayne" },
      { riotId:"sukooo#suko",           rol:"ADC", main:"Ashe"  }
    ]},
    { person:"Tacua", icon:"Lulu", accounts:[
      { riotId:"tacua#EUW",             rol:"Support", main:"Lulu"  },
      { riotId:"Tacuoptero#3612",       rol:"Support", main:"Braum" }
    ]}
  ]
};
