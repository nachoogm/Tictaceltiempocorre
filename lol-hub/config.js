/* =====================================================================
   ⚙️  CONFIGURACIÓN — edita SOLO este archivo
   ⚠️ Si añades/quitas CUENTAS actualiza también:
        · api/cron-lp/index.js  (array PLAYERS)
        · api/group/index.js    (array ACCOUNTS)
   ===================================================================== */
const CONFIG = {
  groupName: "Tictac el tiempo corre",
  tagline:  "El tiempo corre… y nosotros farmeamos",
  region: "euw",
  liveStats: true,
  matchCount: 3,        // partidas iniciales por cuenta
  matchCountMore: 10,   // partidas al pulsar "Ver más"

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
  ],

  /* 🎵 PLAYLIST — sube los .mp3 a la carpeta /music del repo.
     'file' debe coincidir EXACTAMENTE con el nombre del archivo. */
  songs: [
    { title:"CAOS",                    artist:"Tictac",     file:"CAOS.mp3",                         icon:"Jhin"   },
    { title:"Madrid Intinmusic",       artist:"Cebotrón",   file:"Cebotrón Madrid Intinmusic.mp3",   icon:"Galio"  },
    { title:"Toplane pro 2",           artist:"Cebotrón",   file:"Cebotrón Toplane pro2.mp3",        icon:"Gnar"   },
    { title:"Cumbia por la grieta",    artist:"Tictac",     file:"Cumbia por la grieta.mp3",         icon:"Sona"   },
    { title:"4 Top",                   artist:"San Quintín",file:"San Quintín 4 top.mp3",            icon:"Poppy"  },
    { title:"Ranchera",                artist:"San Quintín",file:"San Quintín ranchera.mp3",         icon:"Taric"  },
    { title:"Rock",                    artist:"San Quintín",file:"San Quintín rock.mp3",             icon:"Pantheon"},
    { title:"Tacuantino pro",          artist:"Tacuóptero", file:"Tacuóptero Tacuantino pro.mp3",    icon:"Lulu"   }
  ]
};
