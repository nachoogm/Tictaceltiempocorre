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
  groupName: "La Cueva del Poro",

  // Región de la cuenta (en minúsculas)
  //   euw · eune · na · kr · br · jp · las · lan · oce · tr · ru · sea
  region: "euw",

  // Vuestros jugadores (5-6, o los que quieras)
  players: [
    { riotId: "Faker#KR1",        rol: "Mid",     main: "Ahri" },
    { riotId: "Caps#EUW",         rol: "Mid",     main: "Sylas" },
    { riotId: "Rekkles#RK9",      rol: "ADC",     main: "Jinx" },
    { riotId: "Jankos#GOD",       rol: "Jungla",  main: "Nidalee" },
    { riotId: "Wunder#000",       rol: "Top",     main: "Gnar" },
    { riotId: "Mikyx#SUP",        rol: "Support", main: "Rakan" }
  ]
};
