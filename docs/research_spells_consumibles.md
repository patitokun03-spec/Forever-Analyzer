# Investigación de Habilidades y Consumibles: WoW Classic (1.12) y WoW: Forever (Classic+ Nivel 60, Beta Build 1.60)

Este documento constituye la referencia técnica maestra de **Spell IDs**, **Item IDs**, **Enchant IDs** y reglas de clasificación para el procesador de logs y la base de datos (`database/seed_data.sql` y `public/js/gameData.js`) del proyecto **FOREVER**.

---

## 1. Reglas de IDs en Warcraft Logs: Item ID vs Spell ID y Rangos de Versión

En los archivos JSON exportados o consultados desde la API de Warcraft Logs (y el parser interno de WoW: Forever), coexisten distintas naturalezas de identificadores que **nunca deben mezclarse sin normalización previa**:

### 1.1. Diferencia entre Item ID, Cast/Buff Spell ID y Enchant ID
1. **Eventos de Combate (`casts`, `damage`, `healing`, `auras`/`buffs`, `debuffs`)**:
   - Registran siempre el **Spell ID** (`abilityGameID` / `guid`), **nunca** el Item ID del objeto en las bolsas (salvo contadas excepciones en resúmenes de `combatantinfo` o tablas agregadas que indexan por ítem o cuando el parser de WCL remapea ciertos objetos).
   - *Ejemplo crítico*: Al consumir una **Major Mana Potion**, el objeto en el inventario tiene **Item ID `13444`**, pero el evento de lanzamiento (`cast`) y de ganancia de maná (`Restore Mana`) en el log se registra con el **Spell ID `17531`**.
   - *Variantes por Talentos (Healthstones)*: Una **Major Healthstone** crea distintos objetos según los puntos en el talento *Improved Healthstone* del Warlock que la conjuró:
     - `0/2` puntos: **Item ID `9421`** $\rightarrow$ **Spell ID `11732`** (1200 HP base).
     - `1/2` puntos: **Item ID `19012`** $\rightarrow$ **Spell ID `19837`** (1320 HP).
     - `2/2` puntos: **Item ID `19013`** $\rightarrow$ **Spell ID `19838`** (1440 HP).
     - Para que el motor de auditoría detecte el uso de piedra de salud sin importar qué brujo de la raid la fabricó, **ambos rangos de Item IDs y los tres Spell IDs deben mapearse y agruparse bajo una misma clave lógica**.
2. **Eventos de `combatantinfo` (Gear y Temporary Enchants)**:
   - El equipamiento (`gear`) reporta **Item IDs** reales equipados en las 16–18 ranuras del personaje.
   - Los consumibles de arma (Aceites, Piedras de afilar, Contrapesos) no siempre aparecen como un buff en la lista de `auras` al inicio del encuentro si fueron aplicados antes de empezar el log; en su lugar, se registran dentro del bloque `gear` como `temporaryEnchant` utilizando un **Enchant ID** (p. ej., `2628` para *Brilliant Wizard Oil*, `2629` para *Brilliant Mana Oil*, `2506` para *Elemental Sharpening Stone*).

### 1.2. Rangos de Spell IDs según Expansión y Customización (WoW: Forever)
Para evitar falsos positivos y contaminación de bases de datos de parches posteriores, el catálogo aplica la siguiente taxonomía de rangos numéricos:

| Rango de Spell ID | Origen / Naturaleza | Tratamiento en `seed_data.sql` y `gameData.js` |
| :--- | :--- | :--- |
| **`1` – `29999`** | **Vanilla / Classic (Parches 1.1 a 1.12.1)** | **Válido (Core Classic)**. Incluye todos los rangos de hechizos de nivel 1 a 60 (incluyendo libros de AQ20 como *Heroic Strike Rank 9* `25286` o *Ferocious Bite Rank 5* `31018` / `22568`). |
| **`27000` – `70000`** | **TBC (2.4.3) / WotLK (3.3.5a)** | **Depurar / Auditar caso por caso**. Los hechizos que son simples rangos de nivel 61–70 de TBC (p. ej., *Shadow Bolt Rank 11* `27209`, *Chain Heal Rank 4/5* `25422/25423`, *Master Healthstone* `27235-27237`) son **residuos inválidos** y deben purgarse. **Excepción**: Habilidades icónicas portadas explícitamente a Nivel 60 por el cliente/servidor de *WoW: Forever* (p. ej., *Totemic Recall* `36936`, *Call of the Elements* `66842`, *Ferocious Bite R5* `31018`, *Eviscerate R9* `31016`) se conservan documentadas como **Backports Forever**. |
| **`248000` – `249999`** | **Ítems Custom de WoW: Forever** | **Válido (Forever Custom Items)**. Piezas de equipo nuevas de la Beta 1.60 (Tier 1 rediseñado por rol/spec, armas y reliquias custom de Molten Core / Onyxia). |
| **`1240000` – `1320000+`** | **Spells, Talentos y Set Bonuses Custom de WoW: Forever** | **Válido (Forever Custom Spells)**. Nuevas habilidades de clase, talentos rediseñados, hechizos de mascotas y efectos de bonificación de conjuntos Tier 1 (p. ej., *Slam* custom `1240193`, *Seal of Fury* `1311649/1311656`, *Divine Grace* `1277370`, *Dark Sacrifice* `1277324`, *Chastise* `1277331`, *Tier 1 Set Bonuses* `1301071`–`1301713`). |

---

## 2A. Habilidades Clave de Tanks y Healers por Clase y Especialización

A continuación se detallan todas las habilidades fundamentales de **Tanques** y **Sanadores** en Nivel 60 (Classic + WoW: Forever), incluyendo todos sus rangos de Spell ID, su categoría funcional (Rotación/Amenaza, Cooldown Defensivo/Ofensivo, Corte/CC, Debuff/Utilidad) y las adiciones exclusivas de Forever.

### 🛡️ ROL: TANKS

#### 1. `Warrior-Protection` (Guerrero Protección)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Sunder Armor** | `7386, 7405, 8380, 11596, 11597, 25225` | Rotación / Debuff | Reducción de armadura (hasta 5 cargas, 2250 armadura en R5) y base de amenaza constante. |
| **Shield Slam** | `23922, 23923, 23924, 23925` | Rotación / Amenaza | Talento de 31 pts en Protección; mayor generador de amenaza por GCD y disipa 1 efecto mágico. |
| **Revenge** | `6572, 6574, 7379, 11600, 11601, 25288` | Rotación / Amenaza | Mayor ratio de amenaza por punto de ira; requiere bloqueo, esquiva o parada previa. |
| **Heroic Strike** | `78, 284, 285, 1608, 11564, 11565, 11566, 11567, 25286` | Rotación (Rage Dump) | Reemplaza el siguiente ataque blanco (`on-next-hit`), eliminando la penalización de *dual-wield* y generando alta amenaza. |
| **Cleave** | `845, 7369, 11608, 11609, 20569` | Rotación AoE | Dump de ira en encuentros con 2+ objetivos (*on-next-hit*). |
| **Shield Block** | `2565` | Mitigación Activa | Garantiza bloqueo (+75% prob.) para evitar golpes críticos y aplastantes (*crushing blows*) y activar *Revenge*. |
| **Taunt** | `355` | Amenaza / Control | Obliga al objetivo a atacar al guerrero durante 3 s e iguala la amenaza del líder actual. |
| **Mocking Blow** | `694, 7400, 7402, 20559, 20560` | Amenaza / Control | Provocación secundaria en *Battle Stance* cuando *Taunt* falla o está en CD. |
| **Intervene** | `25275`, `1301071` *(T1 Bonus)* | Movilidad / Mitigación | Habilidad añadida en Forever (`25275`) junto con la bonificación de Tier 1 (`1301071`) que intercepta el próximo ataque contra un aliado. |
| **Tactical Mastery** | `12295`, `1310185` *(Forever Custom)* | Pasivo / Utilidad | Permite conservar ira al cambiar de actitud (*Stance Dancing*). |
| **Shield Wall** | `871` | CD Defensivo Mayor | Reduce todo el daño recibido un 75% durante 10 s (30 min CD). |
| **Last Stand** | `12975` | CD Defensivo Mayor | Otorga un 30% de la salud máxima de forma temporal durante 20 s. |
| **Challenging Shout** | `1161` | CD Amenaza AoE | Taunt en área a todos los enemigos cercanos durante 6 s. |
| **Shield Bash** | `72, 1671, 1672` | Corte / Interrupción | Interrumpe el lanzamiento de hechizos en actitud Defensiva/Batalla con escudo equipado. |
| **Pummel** | `6552, 6554` | Corte / Interrupción | Interrupción de casteo en *Berserker Stance*. |
| **Demoralizing Shout** | `1160, 6190, 11554, 11555, 11556, 25202` | Debuff Mitigación | Reduce el poder de ataque cuerpo a cuerpo de los enemigos cercanos. |
| **Thunder Clap** | `6343, 8198, 8204, 8205, 11580, 11581` | Debuff Mitigación | Reduce la velocidad de ataque del boss un 10% (mitigación física clave). |

#### 2. `Paladin-Protection` (Paladín Protección)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Holy Shield** | `20925, 20927, 20928` | Mitigación / Amenaza | Talento de 31 pts; aumenta la probabilidad de bloqueo un 30% (4 cargas) e inflige daño Sagrado con alta amenaza al bloquear. |
| **Consecration** | `2657, 20116, 20922, 20923, 20924` | Rotación AoE / Amenaza | Principal herramienta de amenaza en área mediante daño Sagrado periódico en el suelo. |
| **Holy Strike (Forever Custom)** | `679, 678, 1866` | Rotación / Amenaza | Golpe cuerpo a cuerpo instantáneo de daño Sagrado reintroducido en *WoW: Forever* para dar amenaza sostenida monobjetivo al Paladín. |
| **Seal of Fury (Forever Custom)** | `1311649, 1311656` | Amenaza / Taunt Custom | Sello y sentencia exclusivos de *WoW: Forever* diseñados para dotar al Paladín Tanque de generación de amenaza focalizada y mecánica de provocación. |
| **Righteous Fury** | `25780` | Buff de Amenaza | Aumenta la amenaza generada por todos los hechizos y ataques Sagrados un 60% (90% con el talento *Improved Righteous Fury*). |
| **Judgement** | `20271` | Rotación / Amenaza | Libera la energía del Sello activo sobre el objetivo. |
| **Exorcism** | `879, 5614, 5615, 10312, 10313, 10314` | Amenaza Rango | Daño Sagrado instantáneo contra No-muertos y Demonios (o universal según ajustes de Forever). |
| **Hammer of Justice** | `853, 5588, 5589, 10308` | CC / Corte | Aturde al objetivo hasta 6 s (actúa como pseudo-corte en objetivos inmunes a stun en algunas mecánicas). |
| **Divine Shield** | `642, 1020` | CD Defensivo / Inmunidad | Inmunidad total durante 10–12 s (limpia debuffs críticos; requiere cancelaura rápido si se tanquea). |
| **Divine Protection** | `498, 5573` | CD Defensivo | Escudo de inmunidad menor. |
| **Blessing of Protection** | `1022, 5599, 10278` | CD Externo Raid | Inmunidad al daño físico para un miembro del grupo/banda durante 6–10 s. |
| **Blessing of Sanctuary** | `20911, 20912, 20913, 20914` | Buff Mitigación | Reduce el daño recibido hasta en 24 pts y devuelve daño Sagrado al bloquear. |
| **Lay on Hands** | `633, 2800, 10310` | CD Emergencia | Sana al objetivo una cantidad igual a la salud máxima del paladín y otorga bono de armadura con talentos. |

#### 3. `Druid-Feral (Tank / Bear)` (Druida Feral Oso)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Dire Bear Form** | `9634` (y *Bear Form* `5487`) | Forma Base | Aumenta la armadura de objetos un 360%, la salud y permite usar habilidades de oso. |
| **Maul** | `6807, 6808, 6809, 8972, 9745, 9880, 9881` | Rotación / Amenaza | Ataque `on-next-hit` con multiplicador masivo de amenaza; eje central del *threat* monobjetivo del Oso. |
| **Swipe** | `779, 780, 769, 9754, 9908` | Rotación AoE / Amenaza | Golpea a 3 objetivos cercanos con alto modificador de amenaza. |
| **Faerie Fire (Feral)** | `16857, 17390, 17391, 17392` | Rotación / Debuff | Reduce la armadura del objetivo (hasta 505 en R4), impide sigilo y genera amenaza sin coste de ira cada 6 s. |
| **Demoralizing Roar** | `99, 1735, 9490, 9747, 9898` | Debuff Mitigación | Reduce el poder de ataque cuerpo a cuerpo de todos los enemigos cercanos. |
| **Growl** | `6795` | Amenaza / Taunt | Provocación monobjetivo estándar (10 s CD). |
| **Challenging Roar** | `5209` | CD Amenaza AoE | Obliga a todos los enemigos cercanos a atacar al druida durante 6 s (10 min CD). |
| **Enrage** | `5229` | Generación de Ira | Genera 20 pts de ira durante 10 s (30 con *Intensity*). |
| **Bash** | `5211, 6798, 8983` | CC / Corte | Aturde al objetivo hasta 4 s (5 s con *Brutal Impact*). |
| **Frenzied Regeneration** | `22842, 22895, 22896` | CD Defensivo | Convierte hasta 10 pts de ira por segundo en salud durante 10 s. |
| **Barkskin** | `22812` | CD Defensivo | Reduce todo el daño recibido un 20% durante 12 s (en Forever usable o pre-casteable para pulls). |

---

### 💚 ROL: HEALERS

#### 1. `Priest-Holy` & `Priest-Discipline` (Sacerdote Sagrado y Disciplina)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Flash Heal** | `2061, 9472, 9473, 9474, 10915, 10916, 10917` | Sanación Rápida | Cura de emergencia de 1.5 s de lanzamiento. |
| **Greater Heal** | `2060, 10963, 10964, 10965, 25314` | Sanación Pesada | Cura principal de alto rendimiento (2.5 s con talentos); Rango 1 (`2060`) y Rango 5 (`25314`) muy usados con *8/8 Tier 2*. |
| **Heal** | `2054, 2055, 6063, 6064` | Sanación Eficiente | Pilar del *downranking* en Classic (especialmente Rango 2 `2055` y Rango 4 `6064`) por su máxima eficiencia de maná por segundo. |
| **Lesser Heal** | `2050, 2052, 2053` | Sanación Básica | Rangos iniciales de bajo nivel. |
| **Prayer of Healing** | `596, 996, 10960, 10961, 25316` | Sanación AoE Grupo | Sana a los 5 miembros del grupo del sacerdote (combo clásico con *Inner Focus*). |
| **Renew** | `139, 6074, 6075, 6076, 6077, 6078, 10927, 10928, 10929, 25315` | HoT (Sanación en el tiempo) | Sanación periódica instantánea durante 15 s. |
| **Power Word: Shield** | `17, 592, 600, 3747, 6065, 6066, 10898, 10899, 10900, 10901` | Absorción / Emergencia | Escudo de absorción instantáneo; salva vidas ante picos de daño (no usar sobre Warriors/Bears tanques si necesitan ira por daño recibido, salvo emergencia). |
| **Holy Nova** | `15237, 15430, 15431, 27799, 27800, 27801` | Sanación AoE Instantánea | Explosión instantánea sin amenaza que cura al grupo alrededor del sacerdote. |
| **Desperate Prayer** | `19236, 19238, 19240, 19241, 19242, 19243` | CD Defensivo Personal | Autocuración instantánea sin coste de maná (racial de Sacerdote Enano/Humano). |
| **Inner Focus** | `14751` | CD Eficiencia / Crítico | El siguiente hechizo cuesta 0% de maná y tiene +25% de probabilidad de crítico. |
| **Power Infusion** | `10060` | CD ExternoOfensivo/Heal | Talento de 31 pts en Disciplina; aumenta el daño y la sanación mágica del objetivo un 20% durante 15 s. |
| **Dispel Magic** | `527, 988` | Disipación (Magic) | Elimina 1 (R1) o 2 (R2) efectos mágicos dañinos de un aliado o beneficiosos de un enemigo. |
| **Abolish Disease** | `552` (y *Cure Disease* `528`) | Disipación (Disease) | Limpia 1 enfermedad inmediatamente y 1 cada 5 s durante 20 s. |
| **Resurrection** | `2006, 2010, 10880, 10881, 20770` | Utilidad / Resurrección | Resurrección fuera de combate. |
| **Fear Ward** | `6346` | Utilidad Crítica | Inmunidad al próximo efecto de *Fear* (Magmadar, Onyxia, Nefarian). |
| **Divine Grace (Forever Custom)** | `1277370, 1277371` | CD / Talento Forever | Habilidad exclusiva de *WoW: Forever* para Sacerdote Sanador. |
| **Tier 1 Bonus: Penance & PoM** | `1301703` | Set Bonus Forever | Bonificación del conjunto Tier 1 rediseñado en *WoW: Forever* que introduce mecánicas de *Penance* y *Prayer of Mending*. |

#### 2. `Paladin-Holy` (Paladín Sagrado)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Flash of Light** | `19750, 19939, 19940, 19941, 19942, 19943` | Sanación Principal | Hechizo rápido (1.5 s) de altísima eficiencia de maná y escalado con `+Healing`; junto con *Illumination* (devuelve 100% del maná en crítico) permite sanar indefinidamente. |
| **Holy Light** | `635, 639, 647, 1026, 1042, 3472, 10328, 10329, 25292` | Sanación Pesada | Cura masiva de 2.5 s para picos de daño extremo en el Main Tank. |
| **Holy Shock** | `20473, 20929, 20930` | Sanación Instantánea | Talento de 31 pts en Sagrado; cura (o daña) de forma instantánea en movimiento. |
| **Divine Favor** | `20216` | CD Crítico Garantizado | Garantiza un 100% de probabilidad de crítico en el siguiente *Flash of Light*, *Holy Light* o *Holy Shock* (2 min CD). |
| **Cleanse** | `4987` (y *Purify* `1152`) | Disipación Triple | Limpia 1 efecto de **Veneno**, 1 de **Enfermedad** y 1 de **Magia** en un solo GCD. |
| **Blessings (Normal & Greater)** | Might (`19740..25291`, Greater `25782, 25916`), Wisdom (`19742..25290`, Greater `25894, 25918`), Kings (`20217`, Greater `25898`), Salvation (`1038`, Greater `25895`), Light (`19977..19979`, Greater `25890`), Sanctuary (`20911..20914`, Greater `25899`), Freedom (`1044`), Sacrifice (`6940, 20729`), Protection (`1022, 5599, 10278`) | Buffs de Raid / Utilidad | Sistema de bendiciones esencial de la Alianza (y de raid en Forever). |
| **Judgement of Light / Wisdom** | Light (`20185, 20344, 20345, 20346`), Wisdom (`20186, 20354, 20355`) | Debuff Sostenimiento | *Judgement of Light* aporta miles de puntos de sanación pasiva a los melees; *Judgement of Wisdom* regenera maná a casters y hunters por cada impacto. |
| **Redemption** | `7328, 10322, 10324, 20772, 20773` | Utilidad / Resurrección | Resurrección fuera de combate. |

#### 3. `Druid-Restoration` (Druida Restauración)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Healing Touch** | `5185, 5186, 5187, 5188, 5189, 6778, 8903, 9758, 9888, 9889, 25297` | Sanación Directa | Herramienta principal de *downranking* (Rango 3 `5187`, Rango 4 `5188`) y combo de emergencia en Rango Máximo (`9889`/`25297`) con *Nature's Swiftness*. |
| **Regrowth** | `8936, 8938, 8939, 8940, 8941, 9750, 9856, 9857, 9858` | Sanación + HoT | Cura rápida de 2.0 s con +50% prob. de crítico por talentos (*Improved Regrowth*) y HoT de 21 s. |
| **Rejuvenation** | `774, 1058, 1430, 2090, 2091, 3627, 8910, 9839, 9840, 9841, 25299` | HoT Principal | Sanación periódica instantánea durante 12 s; habilita el uso de *Swiftmend*. |
| **Swiftmend** | `18562` | Sanación Instantánea | Talento de 31 pts en Restauración; consume un efecto de *Rejuvenation* o *Regrowth* para curar instantáneamente el equivalente a 12 s de *Rejuv* o 18 s de *Regrowth*. |
| **Tranquility** | `740, 8918, 9862, 9863` | CD Sanación Grupo | Canalizado que cura a los miembros del grupo del druida cada 2 s durante 10 s. |
| **Nature's Swiftness** | `17116` | CD Emergencia | Convierte el siguiente hechizo de Naturaleza en instantáneo (3 min CD). |
| **Innervate** | `29166` | CD Regeneración Maná | Aumenta la regeneración de maná por Espíritu un 400% y permite regenerar el 100% mientras se lanza hechizos durante 20 s. |
| **Rebirth** | `20484, 20739, 20742, 20747, 20748` | Battle Rez (CR) | Única resurrección en combate activa de Classic (30 min CD). |
| **Remove Curse** | `2782` | Disipación (Curse) | Elimina 1 maldición de un objetivo amistoso (crucial en Gehennas, Shazzrah, Chromaggus). |
| **Abolish Poison** | `2893` (y *Cure Poison* `8946`) | Disipación (Poison) | Limpia 1 veneno inmediatamente y 1 cada 2 s durante 8 s. |
| **Mark / Gift of the Wild** | Mark (`1126..9885`), Gift (`21849, 21850`) | Buff de Raid | Otorga armadura, todos los atributos y todas las resistencias mágicas. |

#### 4. `Shaman-Restoration` (Chamán Restauración)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Chain Heal** | `1064, 10622, 10623` *(Nota: `25422, 25423` son residuos TBC)* | Sanación AoE Inteligente | Salta hasta a 3 objetivos heridos (con el bono de 3 piezas de *Tier 2 Ten Storms* el salto retiene +30% de efectividad). |
| **Healing Wave** | `331, 332, 547, 913, 939, 959, 8005, 10395, 10396, 25357` | Sanación Pesada | Cura monobjetivo que aplica y se beneficia de *Healing Way* (+6% por stack, hasta +18% de sanación). |
| **Lesser Healing Wave** | `8004, 8008, 8010, 10466, 10467, 10468` | Sanación Rápida | Cura de emergencia de 1.5 s para salvar objetivos en peligro inminente. |
| **Mana Tide Totem** | `16190, 17354, 17359` | CD Regeneración Grupo | Talento de 31 pts; regenera maná a todo el grupo cada 3 s durante 12 s. |
| **Nature's Swiftness** | `16188` | CD Emergencia | Hace instantáneo el siguiente hechizo de Naturaleza (*Healing Wave* o *Chain Heal*). |
| **Cure Poison / Cure Disease** | Poison (`526`, *Poison Cleansing Totem* `8166`), Disease (`2870`, *Disease Cleansing Totem* `8170`) | Disipación | Limpieza individual o en pulsos de grupo mediante tótems de agua. |
| **Tremor Totem** | `8143` | Utilidad Anti-Fear | Pulsa para eliminar efectos de *Fear*, *Charm* y *Sleep* del grupo. |
| **Tótems de Buff (Aire / Tierra / Agua)** | Windfury (`8512, 10613, 10614`), Grace of Air (`8835, 10627, 25359`), Tranquil Air (`25908`), Strength of Earth (`8075..25361`), Mana Spring (`5675..10497`), Healing Stream (`5394..10463`) | Soporte de Grupo | *Totem Twisting* entre *Windfury Totem* y *Grace of Air* / *Tranquil Air* multiplica el DPS del grupo melee sin que roben el agro. |
| **Ancestral Spirit & Reincarnation** | Ancestral Spirit (`2008, 20609, 20610, 20776, 20777`), Reincarnation (`20608`) | Resurrección / Ankh | Resurrección fuera de combate y autolevante en combate mediante *Ankh*. |
| **Tier 1 Bonus: Riptide (Forever Custom)** | `1301713` | Set Bonus Forever | Bonificación de Tier 1 en *WoW: Forever* que habilita *Riptide* para Chamán Restauración. |
| **Totemic Recall & Call of the Elements** | `36936` (*Totemic Recall*), `66842` (*Call of the Elements*) | QoL Backports Forever | Habilidades portadas en *WoW: Forever* para plantar los 4 tótems simultáneamente y recogerlos recuperando maná. |

---

## 2B. Habilidades Clave de Melee DPS y Ranged DPS por Clase y Especialización

A continuación se documentan todas las habilidades de rotación, cooldowns ofensivos, recursos, debuffs de raid y adiciones custom de *WoW: Forever* para **Melee DPS** y **Ranged DPS**.

### ⚔️ ROL: MELEE DPS

#### 1. `Warrior-Fury` & `Warrior-Arms` (Guerrero Furia y Armas)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Bloodthirst** | `23881, 23892, 23893, 23894` (y proc de curación `23885`) | Rotación Core (Fury) | Talento de 31 pts en Furia; inflige un 45% del Attack Power como daño instantáneo cada 6 s. |
| **Mortal Strike** | `12294, 21551, 21552, 21553` | Rotación Core (Arms) | Talento de 31 pts en Armas; golpe con arma +160 daño que reduce la sanación recibida un 50% (ojo con el límite de slots de debuff en bosses si no es Forever). |
| **Whirlwind** | `1680` | Rotación Core / AoE | Golpea hasta a 4 enemigos con el arma de mano derecha en *Berserker Stance* (10 s CD). |
| **Execute** | `5308, 20658, 20660, 20661, 20662` | Fase < 20% HP | Consume toda la ira restante para infligir daño masivo cuando el objetivo está por debajo del 20% de salud. |
| **Heroic Strike** | `78, 284, 285, 1608, 11564, 11565, 11566, 11567, 25286` | Rage Dump / HS Queuing | Encolar *Heroic Strike* elimina la penalización de +19% miss de la *off-hand* mientras está en cola. |
| **Cleave** | `845, 7369, 11608, 11609, 20569` | Rage Dump AoE | Reemplaza el ataque básico para golpear a 2 objetivos adyacentes. |
| **Overpower** | `7384, 7887, 11584, 11585` | Rotación Situacional | Requiere cambio a *Battle Stance* (aprovechando *Tactical Mastery*) tras una esquiva del enemigo; tiene +50% prob. de crítico por talentos. |
| **Slam** | `1464, 8820, 11604, 11605`, Forever Custom: `1240193` | Rotación 2H (Arms/Fury) | Golpe con tiempo de lanzamiento de 1.5 s (1.0 s con talentos); en *WoW: Forever* cuenta con la variante/mejora custom `1240193`. |
| **Hamstring** | `1715, 7372, 7373` | Filler Procs (WF/HoJ) | Usado con exceso de ira (especialmente en Horda) para forzar procs de *Windfury Totem*, *Hand of Justice* o *Flurry*. |
| **Rend** | `772, 6546, 6547, 6548, 11572, 11573, 11574` | Sangrado (Arms / Leveling) | Sangrado periódico en *Battle/Defensive Stance*. |
| **Death Wish** | `12292` | CD Ofensivo Mayor | Aumenta el daño físico un 20% y otorga inmunidad a *Fear* durante 30 s, reduciendo la armadura y resistencias un 20% (3 min CD). |
| **Recklessness** | `1719` | CD Ofensivo Mayor | Garantiza un 100% de golpes críticos durante 15 s (+20% daño recibido, 30 min CD). |
| **Sweeping Strikes** | `12328` (y golpes adicionales `12723`) | CD AoE (Arms) | Los siguientes 5 ataques cuerpo a cuerpo golpean a un objetivo adicional cercano. |
| **Berserker Rage** | `18499` | Utilidad / Ira | Otorga inmunidad a *Fear* e *Incapacitate* y genera ira extra al recibir daño durante 10 s. |
| **Bloodrage** | `2687` (y ganancia periódica `29131`) | Recurso (Ira) | Genera 10 de ira instantánea y 10 adicionales durante 10 s a cambio de salud. |
| **Battle Shout** | `6673, 5242, 6192, 11549, 11550, 11551, 25289` | Buff de Grupo | Otorga hasta 232 (290 con *Improved Battle Shout*) de Attack Power cuerpo a cuerpo a los 5 miembros del grupo. |
| **Pummel** | `6552, 6554` | Corte / Interrupción | Interrumpe el lanzamiento de hechizos durante 4 s en *Berserker Stance*. |

#### 2. `Rogue-Combat`, `Rogue-Assassination` & `Rogue-Subtlety` (Pícaro Combate, Asesinato y Sutileza)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Sinister Strike** | `1752, 1757, 1758, 1759, 1760, 8621, 11293, 11294` | Generador (Swords/Maces/Fists) | Generador principal de puntos de combo (40 energía con *Improved Sinister Strike*). |
| **Backstab** | `53, 2589, 2590, 2591, 8721, 11279, 11280, 11281, 25300` | Generador (Daggers) | Requiere daga en mano derecha y estar detrás del objetivo (+30% prob. de crítico con *Improved Backstab*). |
| **Eviscerate** | `2098, 6760, 6761, 6762, 8623, 8624, 11299, 11300, 31016` | Remate Directo | Remate principal de daño físico directo; Rango 9 (`31016`, libro de UBRS/Classic 1.12). |
| **Slice and Dice** | `5171, 6774` | Remate Buff Core | Aumenta la velocidad de ataque cuerpo a cuerpo un 20% (R1) o 30% (R2); mantener *uptime* cercano al 100% es la prioridad #1 de todo Rogue. |
| **Rupture** | `1943, 8639, 8640, 11273, 11274, 11275` | Remate Sangrado | Sangrado que ignora armadura (usado cuando los slots de debuff lo permiten o en *Forever*). |
| **Expose Armor** | `8647, 8649, 8650, 11197, 11198` | Remate Debuff Raid | Con *Improved Expose Armor (2/2)* reduce 2550 de armadura (300 más que 5 cargas de *Sunder Armor*). |
| **Ambush** | `8676, 8724, 8725, 11267, 11268, 11269` | Apertura Sigilo (Daggers) | Golpe devastador desde sigilo detrás del objetivo. |
| **Garrote** | `703, 8631, 8632, 8633, 11289, 11290` | Apertura Sigilo (Bleed) | Sangrado inicial desde sigilo. |
| **Feint** | `1966, 6768, 8637, 11303, 25302` | Reducción de Amenaza | Reduce la amenaza contra el objetivo sin romper el flujo de combate. |
| **Adrenaline Rush** | `13750` | CD Ofensivo Mayor (Combat) | Talento de 31 pts en Combate; duplica la regeneración de energía durante 15 s (5 min CD). |
| **Blade Flurry** | `13877` (y daño cleave `22482`) | CD Ofensivo / AoE | Aumenta la velocidad de ataque un 20% y golpea a un enemigo cercano adicional durante 15 s (2 min CD). |
| **Cold Blood** | `14177` | CD Crítico (Assassination) | Garantiza un 100% de probabilidad de crítico en el siguiente golpe ofensivo. |
| **Vanish** | `1856, 1857` | Reset de Amenaza | Borra el100% de la amenaza acumulada y devuelve al pícaro a sigilo en combate. |
| **Sprint & Evasion** | Sprint (`2983, 8696, 11305`), Evasion (`5277`) | Movilidad / Defensivo | +50–70% velocidad de movimiento y +50% probabilidad de esquiva durante 15 s. |
| **Kick** | `1766, 1767, 1768, 1769` | Corte / Interrupción | Interrumpe el lanzamiento de hechizos por 5 s (25 energía, 10 s CD). |
| **Poisons (Venenos)** | Instant Poison (`8679, 8686, 8688, 11338, 11339, 11340`), Deadly Poison (`2823, 2824, 11355, 11356, 25351`), Wound Poison (`13219..13227`), Crippling (`3408`), Mind-numbing (`5761..11399`) | Daño Pasivo / Utilidad | *Instant Poison VI* (`11340`) es el estándar de DPS en la Alianza (y en `off-hand` en la Horda junto a *Windfury Totem* en `main-hand`). |

#### 3. `Paladin-Retribution` (Paladín Reprensión)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Seal of Command** | `20375, 20915, 20918, 20919, 20920` (Proc daño: `20424`) | Sello Principal | Talento de Reprensión; otorga probabilidad de infligir un 70% del daño del arma como daño Sagrado adicional (~7 PPM). |
| **Judgement of Command** | `20467, 20963, 20964, 20965, 20966` | Rotación / Sentencia | Daño Sagrado instantáneo al juzgar *Seal of Command* (duplicado si el objetivo está aturdido). |
| **Seal & Judgement of the Crusader** | Seal (`21082, 20162, 20305, 20306, 20307, 20308`), Judgement (`21183, 20188, 20300, 20301, 20302, 20303`) | Debuff Sagrado | La sentencia aumenta el daño Sagrado recibido por el boss hasta en +140 (R6). |
| **Holy Strike (Forever Custom)** | `679, 678, 1866` | Rotación Core Forever | Golpe activo cuerpo a cuerpo que convierte o añade daño Sagrado en *WoW: Forever*, resolviendo la falta de botones activos del Retribution clásico. |
| **Crusader Strike (Forever Backport)** | `35395` | Rotación Core Forever | Golpe instantáneo con arma si está habilitado en la rama de talentos/runas de *WoW: Forever*. |
| **Consecration** | `2657, 20116, 20922, 20923, 20924` | Daño Periódico / AoE | Usado en rotación cuando el maná lo permite y en todos los pulls AoE. |
| **Hammer of Wrath** | `24275, 24274, 24239` | Fase < 20% HP | Lanzamiento a distancia de daño Sagrado contra enemigos con menos del 20% de vida. |
| **Exorcism** | `879, 5614, 5615, 10312, 10313, 10314` | Rotación / Burst | Daño Sagrado instantáneo de alto escalado. |

#### 4. `Druid-Feral (Cat)` (Druida Feral Gato)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Cat Form & Powershifting** | Cat Form (`768`), Furor (`17057`), Wolfshead Helm (`17767` / Item `8345`) | Mecánica Core Recurso | Entrar en *Cat Form* con *Furor (5/5)* y *Wolfshead Helm* restaura instantáneamente **60 de energía** (88 si coincide con el tick de 2 s). |
| **Shred** | `5221, 6800, 8992, 9829, 9830` | Generador Principal | Ataque por la espalda (225% daño + 180 en R5); consume 48 de energía con *Improved Shred (2/2)*. |
| **Ferocious Bite** | `22568, 22827, 22828, 22829, 31018` | Remate Principal | Consume hasta 30 pts de energía adicionales para aumentar el daño (por eso se lanza justo antes de hacer *Powershift* con < 35 energía). |
| **Claw** | `1082, 3029, 5201, 9849, 9850` | Generador Frontal | Usado únicamente si la geometría del boss impide situarse en su espalda para usar *Shred*. |
| **Rake & Rip** | Rake (`1822, 1823, 1824, 9904`), Rip (`1079, 9492, 9493, 9752, 9894, 9896`) | Sangrados (DoTs) | Sangrados que ignoran armadura. |
| **Ravage & Pounce** | Ravage (`6785, 6787, 9866, 9867`), Pounce (`9005, 9823, 9827`) | Apertura Sigilo | *Ravage* inflige 350% de daño + bonus desde *Prowl* (`5215`). |
| **Tiger's Fury** | `5217, 6793, 9845, 9846`, Forever Tier 1 Bonus: `1301247` | Buff / Set Bonus Forever | En *WoW: Forever*, la bonificación de Tier 1 (`1301247`) potencia significativamente *Tiger's Fury* para la rotación de Gato. |
| **Leader of the Pack** | `17007` | Aura de Grupo | Talento de 31 pts en Feral; otorga +3% de probabilidad de crítico físico a todo el grupo. |

#### 5. `Shaman-Enhancement` (Chamán Mejora)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Stormstrike** | `17364` | Rotación Core | Talento de 31 pts en Mejora; ataque instantáneo con arma que aumenta el daño de los siguientes 2 hechizos de Naturaleza un 20%. |
| **Earth Shock** | `8042, 8044, 8045, 8046, 10412, 10413, 10414` | Rotación / Corte | Daño de Naturaleza instantáneo (aprovecha el debuff de *Stormstrike*) e interrumpe el lanzamiento de hechizos (Rango 1 `8042` para cortar sin robar el agro). |
| **Flame Shock & Frost Shock** | Flame (`8050, 8052, 8053, 10447, 10448`), Frost (`8056, 8058, 10472, 10473`) | Rotación Choque | *Flame Shock* evita consumir las cargas de Naturaleza de *Stormstrike* reservadas para un *Chain Lightning* de un Elemental. |
| **Weapon Imbues (Windfury, etc.)** | Windfury Weapon (`8232, 8235, 10486, 16362`, ataque extra `25504`), Rockbiter (`8017..16316`), Flametongue (`8024..16342`), Frostbrand (`8033..16356`) | Imbuir Arma | *Windfury Weapon* otorga un 20% de probabilidad de asestar 2 ataques adicionales con +333/+445 Attack Power. |
| **Fire Totems (Nova, Searing, Magma)** | Fire Nova (`1535, 8498, 8499, 11314, 11315`), Searing (`3599, 6363, 6364, 6365, 10437, 10438`), Magma (`8190, 10585, 10586, 10587`) | Daño Totémico / AoE | Parte esencial del DPS sostenido y en área del Chamán. |
| **Bloodlust (Forever Backport)** | `2825` | CD Raid Mayor | Si está disponible en el encuentro/servidor de *WoW: Forever*, aumenta la celeridad un 30% durante 40 s. |

---

### 🏹 ROL: RANGED DPS

#### 1. `Mage-Fire`, `Mage-Frost` & `Mage-Arcane` (Mago Fuego, Escarcha y Arcano)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Fireball** | `133, 143, 145, 3140, 8400, 8401, 8402, 10148, 10149, 10150, 10151, 25306` | Nuke Principal (Fire) | Hechizo base de Fuego (3.0 s con talentos, 100% coeficiente de Spell Power). |
| **Frostbolt** | `116, 205, 837, 7322, 8406, 8407, 8408, 10179, 10180, 10181, 25304` | Nuke Principal (Frost) | Hechizo base de Escarcha (2.5 s con talentos; estándar en Molten Core y BWL por inmunidades al Fuego). |
| **Scorch & Improved Scorch** | Scorch (`2948, 8444, 8445, 8446, 10205, 10206, 10207`), Vulnerability Debuff (`22959`) | Debuff Raid (Fire) | Acumula hasta 5 cargas de *Fire Vulnerability* (`22959`), aumentando el daño de Fuego recibido un 15%. |
| **Ignite** | `12654` (Talento: `11119, 11120, 12846, 12847, 12848`) | Mecánica Crítico (Fire) | Los críticos de Fuego hacen arder al objetivo un 40% adicional durante 4 s (el *rolling Ignite* compartido entre magos es el mayor DPS del juego). |
| **Pyroblast & Fire Blast** | Pyroblast (`11366..12526, 18809`), Fire Blast (`2136, 2137, 2138, 8412, 8413, 10197, 10199`) | Apertura / Instantáneo | *Pyroblast* en pre-cast o con *Presence of Mind*; *Fire Blast* en movimiento o para mantener vivo un *Ignite*. |
| **Arcane Missiles & Explosion** | Arcane Missiles (`5143, 5144, 5145, 8416, 8417, 10211, 10212`), Arcane Explosion (`1449, 8437, 8438, 8439, 10201, 10202`) | Rotación Arcana / AoE | *Arcane Explosion* es el rey del daño AoE instantáneo en mazmorras y raids (Suppression Room, Sartura). |
| **Cone of Cold & Blizzard** | Cone of Cold (`120, 8492, 10159, 10160, 10161`), Blizzard (`10, 6141, 8427, 10185, 10186, 10187`) | AoE / Control | Daño y ralentización en área. |
| **Winter's Chill** | `12579` (Talento: `11180, 28592, 28593, 28594, 28595`) | Debuff Raid (Frost) | Otorga hasta +10% de probabilidad de crítico a todos los hechizos de Escarcha contra el objetivo (5 cargas). |
| **Combustion, Arcane Power, PoM, Icy Veins** | Combustion (`11129`), Arcane Power (`12042`), Presence of Mind (`12043`), Icy Veins (`12472`) | CDs Ofensivos | *Combustion* garantiza 3 críticos de Fuego; *Arcane Power* +30% daño y coste de maná durante 15 s. |
| **Ice Block, Evocation, Counterspell, Decurse** | Ice Block (`11958, 27619`), Evocation (`12051`), Counterspell (`2139`), Remove Lesser Curse (`475`) | Defensivo / Utilidad / Corte | *Remove Lesser Curse* (`475`) es vital en Lucifron, Gehennas, Shazzrah, Chromaggus y Noth. |
| **Tier 1 Bonus: Frostfire Bolt (Forever Custom)** | `1301488` | Set Bonus Forever | Bonificación de conjunto Tier 1 de Mago en *WoW: Forever* que introduce *Frostfire Bolt*. |

#### 2. `Warlock-Affliction`, `Warlock-Demonology` & `Warlock-Destruction` (Brujo Aflicción, Demonología y Destrucción)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Shadow Bolt** | `686, 695, 705, 1088, 1106, 7641, 11659, 11660, 11661, 25307` | Nuke Principal | Escala extraordinariamente con crítico (*Ruin* +100% daño crítico) y consume cargas de *Improved Shadow Bolt* (`17800`, +20% daño de Sombras). |
| **Corruption** | `172, 6222, 6223, 7648, 11671, 11672, 25311` | DoT Principal | Instantáneo con *Improved Corruption (5/5)* y genera procs de *Nightfall* (`17941`, *Shadow Trance*: siguiente *Shadow Bolt* instantáneo). |
| **Immolate & Conflagrate** | Immolate (`348, 707, 1094, 2941, 11665, 11667, 11668, 25309`), Conflagrate (`17962, 18930, 18931, 18932`) | DoT / Burst (Destro) | *Conflagrate* (31 pts Destrucción) consume *Immolate* para infligir daño instantáneo de Fuego. |
| **Curses (Elements, Shadow, Recklessness, Agony, Doom)** | Elements (`1490, 11721, 11722`), Shadow (`17862, 17937`), Recklessness (`704, 7658, 7659, 11717`), Agony (`980..11713`), Doom (`603`) | Maldiciones de Raid | Cada Warlock tiene asignada 1 maldición obligatoria: **CoE** (-75 resist Fuego/Escarcha, +10% daño), **CoS** (-75 resist Sombras/Arcano, +10% daño) o **CoR** (-640 armadura al boss). Si sobran brujos, usan *Curse of Doom* (`603`, 3200 daño al minuto) o *Curse of Agony*. |
| **Siphon Life & Drain Life** | Siphon Life (`18265, 18879, 18880, 18881`), Drain Life (`689, 699, 709, 7651, 11699, 11700`) | DoT / Sostenimiento | Herramientas de Aflicción y drenaje. |
| **Searing Pain, Shadowburn & Soul Fire** | Searing Pain (`5676, 17919, 17920, 17921, 17922, 17923`), Shadowburn (`17877, 18867, 18868, 18869, 18870, 18871`), Soul Fire (`6353, 17924`) | Ejecución / Tanqueo Caster | *Searing Pain* se usa para tanquear los Emperadores Gemelos (AQ40); *Shadowburn* es el remate instantáneo al morir un add o en el último segundo del boss. |
| **Life Tap** | `1454, 1455, 1456, 11687, 11688, 11689` | Conversión de Recurso | Convierte salud en maná (escala con Spell Power), otorgando al brujo maná prácticamente infinito. |
| **Death Coil & Banish** | Death Coil (`6789, 17925, 17926`), Banish (`710, 18647`) | CC / Supervivencia | *Banish* (`710, 18647`) es obligatorio para controlar elementales en Garr y trash de Molten Core. |

#### 3. `Hunter-Marksmanship`, `Hunter-BeastMastery` & `Hunter-Survival` (Cazador Puntería, Bestias y Supervivencia)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Auto Shot** | `75` | Base del Ciclo de Tiro | Tiene un tiempo de preparación oculto de 0.5 s; toda la rotación del Hunter gira en torno a **no clippear** el *Auto Shot*. |
| **Aimed Shot** | `19434, 20900, 20901, 20902, 20903, 20904` | Rotación Core | Disparo de 3.0 s de lanzamiento que añade +600 de daño al arma a distancia; se lanza inmediatamente después de que salga un *Auto Shot*. |
| **Multi-Shot** | `2643, 14288, 14289, 14290, 25294` | Rotación Core / Cleave | Disparo instantáneo (0.5 s cast interno) que golpea hasta a 3 objetivos (+15% daño con *Barrage*). |
| **Arcane Shot & Serpent Sting** | Arcane Shot (`3044..14287`), Serpent Sting (`1978, 13549, 13550, 13551, 13552, 13553, 13554, 13555, 25295`) | Situacional / Movimiento | *Arcane Shot* comparte CD con *Aimed Shot* (solo se usa en movimiento); *Serpent Sting* se usa en *Forever* o con 8/8 Tier 1. |
| **Hunter's Mark** | `1130, 14323, 14324, 14325` | Debuff Raid | Otorga hasta +110 (+126.5 con *Improved Hunter's Mark*) de Ranged Attack Power a todos los atacantes a distancia contra el objetivo. |
| **Tranquilizing Shot** | `19801` | Utilidad Crítica Raid | Elimina 1 efecto de *Frenzy / Enrage* de un monstruo (Magmadar, Flamegor, Chromaggus, Princess Huhuran, Gluth). |
| **Rapid Fire, Bestial Wrath & Readiness** | Rapid Fire (`3045`), Bestial Wrath (`19574`), Readiness (`23989`) | CDs Ofensivos | *Rapid Fire* aumenta la velocidad de ataque a distancia un 40% durante 15 s. |
| **Trueshot Aura** | `19506, 20905, 20906` | Aura de Grupo (MM) | Talento de 31 pts en Puntería; otorga +100 de Attack Power (melee y ranged) al grupo. |
| **Feign Death** | `5384` | Reset de Amenaza / Drink | Borra el 100% de la amenaza (si no resiste) y permite salir de combate brevemente para beber agua o cambiar abalorios (*Trinket Swapping*). |
| **Melee Weaving (Raptor Strike, Mongoose Bite)** | Raptor Strike (`2973, 14260, 14261, 14262, 14263, 14264, 14265, 14266`), Mongoose Bite (`1495, 14269, 14270, 14271`) | Rotación Avanzada | Entrar a rango melee entre disparos para encajar un *Raptor Strike* + golpe blanco de arma a 2 manos sin retrasar el siguiente *Auto Shot*. |
| **Traps (Explosive, Immolation, Freezing, Frost)** | Explosive (`13813..14317`), Immolation (`13795..14305`), Freezing (`1499, 14310, 14311`), Frost (`13809`) | Control / AoE | En *Forever* o mediante *Feign Death + Trap* aportan CC y daño AoE. |
| **Forever Custom Pet & Talent Spells** | Swipe (`1264727`), Pinch (`1265882`), Dismember (`1265890`), Tendon Rip (`1265898`), Mine! (`1265906`), Savage Rend (`1265913`), Web (`1265920`), Dust Cloud (`1265928`), Spirit Bond (`1310725`) | Habilidades Custom Forever | Catálogo exclusivo de habilidades de familias de mascotas y talentos rediseñados en *WoW: Forever*. |

#### 4. `Priest-Shadow` (Sacerdote Sombras)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Mind Blast** | `8092, 8102, 8103, 8104, 8105, 8106, 10945, 10946, 10947` | Burst Principal | Lanzamiento de 1.5 s con alto daño de Sombras (5.5 s CD con *Improved Mind Blast*). |
| **Mind Flay** | `15407, 17311, 17312, 17313, 17314, 18807` | Filler Canalizado | Canalizado de 3 s que inflige daño de Sombras y aplica *Shadow Weaving*. |
| **Shadow Word: Pain** | `589, 594, 970, 992, 2767, 10892, 10893, 10894` | DoT Principal | DoT de 24 s (con *Improved SW:P*) de altísimo daño por maná. |
| **Shadow Weaving** | `15258` (Talento: `15257, 15331, 15332, 15333, 15334`) | Debuff Raid | Aumenta todo el daño de Sombras recibido por el boss hasta un **15%** (5 cargas), multiplicando el DPS de todos los Warlocks de la banda. |
| **Vampiric Embrace & Devouring Plague** | Vampiric Embrace (`15286`), Devouring Plague (`2944, 19276, 19277, 19278, 19279, 19280`) | Sostenimiento / DoT Racial | *Vampiric Embrace* sana al grupo un 20–30% del daño de Sombras infligido. |
| **Dark Sacrifice & Chastise (Forever Custom)** | Dark Sacrifice (`1277324`), Chastise (`1277331`) | Habilidades Custom Forever | Habilidades exclusivas de *WoW: Forever* para la especialización de Sacerdote DPS/Sombras. |

#### 5. `Druid-Balance` (Druida Equilibrio / Moonkin)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Starfire** | `2912, 8949, 8950, 8951, 9875, 9876, 25298` | Nuke Principal (Arcano) | Lanzamiento de 3.0 s con talentos; se beneficia de *Curse of Shadow* del Warlock y escala al 100% con Spell Power. |
| **Wrath** | `5176, 5177, 5178, 5179, 5180, 6780, 8905, 9912` | Nuke Rápido (Naturaleza) | Lanzamiento de 1.5 s (1.0 s tras un crítico gracias a *Nature's Grace* `16886`). |
| **Moonfire** | `8921, 8924, 8925, 8926, 8927, 8928, 8929, 9833, 9834, 9835` | DoT + Daño Directo | Daño Arcano instantáneo más daño periódico durante 12 s. |
| **Insect Swarm** | `5570, 24974, 24975, 24976, 24977`, Forever Tier 1 Bonus: `1301242` | DoT / Set Bonus Forever | DoT de Naturaleza que reduce un 2% la prob. de golpear del enemigo; potenciado en *WoW: Forever* mediante el bono de Tier 1 (`1301242`). |
| **Faerie Fire** | `770, 778, 9749, 9907` | Debuff Raid Obligatorio | Reduce la armadura del boss en **505 puntos** (se apila con *Sunder Armor* y *Curse of Recklessness* para dejar al boss en 0 de armadura). |
| **Moonkin Aura** | `24907` (*Moonkin Form* `24858`) | Aura de Grupo | Otorga +3% de probabilidad de crítico con hechizos a los 5 miembros del grupo caster. |
| **Hurricane, Barkskin & Innervate** | Hurricane (`16914, 17401, 17402`), Barkskin (`22812`), Innervate (`29166`) | AoE / Utilidad | Daño AoE canalizado y regeneración de maná para sí mismo o un Healer. |

#### 6. `Shaman-Elemental` (Chamán Elemental)
| Habilidad | Spell IDs (Todos los Rangos Nv. 60 + Forever) | Categoría | Notas Técnicas / WoW: Forever |
| :--- | :--- | :--- | :--- |
| **Lightning Bolt** | `403, 529, 548, 915, 943, 6041, 10391, 10392, 15207, 15208` | Nuke Principal | Lanzamiento de 2.0 s con *Lightning Mastery (5/5)* y +11% de prob. de crítico extra por talentos. |
| **Chain Lightning** | `421, 930, 2860, 10605` | Burst / Cleave | Lanzamiento de 1.5 s (6 s CD) que salta hasta a 3 objetivos; base del combo con *Elemental Mastery*. |
| **Earth Shock & Flame Shock** | Earth Shock (`8042..10414`), Flame Shock (`8050..10448`) | Rotación Choque / Corte | Daño instantáneo en movimiento e interrupción de lanzamiento. |
| **Elemental Mastery** | `16166` | CD Crítico Garantizado | Talento de 31 pts en Elemental; el siguiente hechizo de Naturaleza/Fuego/Escarcha cuesta 0 maná y tiene un 100% de probabilidad de crítico (permite hacer *EM Batching* de `Lightning Bolt` + `Chain Lightning` o `Earth Shock`). |
| **Tier 1 Bonus: Lava Burst (Forever Custom)** | `1301711` | Set Bonus Forever | Bonificación del conjunto Tier 1 de Chamán Elemental en *WoW: Forever* que habilita *Lava Burst*. |

---

## 3. Catálogo de Consumibles y Diferencias de ID (Item ID vs Cast/Buff Spell ID)

En el análisis de logs (`public/js/processor/` y `public/js/gameData.js`), el error más común en herramientas de auditoría es buscar únicamente el **Item ID** del objeto cuando el log de combate emite el **Spell ID** del efecto al ser consumido (o viceversa). Las siguientes tablas establecen el mapeo bidireccional exacto para todos los consumibles relevantes de Nivel 60.

### 3.1. Piedras de Salud (Healthstones) y Variantes por Talentos
Una **Major Healthstone** genera 3 objetos distintos y 3 hechizos distintos según los puntos en el talento *Improved Healthstone* (`0/2`, `1/2`, `2/2`) del Warlock que la creó:

| Consumible | Talento (*Improved HS*) | Item ID (Inventario) | Cast / Heal Spell ID (Log) | Salud Restaurada | Notas / Depuración TBC |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Major Healthstone** (Base) | `0/2` | `9421` | `11732` | 1200 HP | Piedra de salud sin puntos de talento. |
| **Major Healthstone** (Mejorada I) | `1/2` | `19012` | `19837` | 1320 HP | +10% de curación base. |
| **Major Healthstone** (Mejorada II) | `2/2` | `19013` | `19838` | 1440 HP | +20% de curación base (estándar de raid). |
| **Greater Healthstone** *(Rango inferior)* | `0/2, 1/2, 2/2` | `5510, 19008, 19009` | `5723, 19834, 19835` | 800 / 880 / 960 HP | No comparte cooldown con *Major Healthstone* si se llevan ambas. |
| ❌ *Master Healthstone (Residuo TBC)* | `0/2, 1/2, 2/2` | *N/A (TBC Nv. 70)* | `27235, 27236, 27237, 43204` | 2080–2496 HP | **Purgar de `seed_data.sql`** (exclusivas de The Burning Crusade / WotLK). |

### 3.2. Pociones de Combate y Pociones de Protección Elemental
Todas las pociones de esta tabla comparten el **cooldown de poción de 2 minutos**:

| Nombre del Consumible | Item ID | Cast / Buff Spell ID | Categoría / Rol Principal | Notas Técnicas y Errores Históricos Detectados |
| :--- | :---: | :---: | :--- | :--- |
| **Major Mana Potion** | `13444` | `17531` | Healers / Casters / Hunters | Restaura 1350 a 2250 de maná. |
| **Superior Mana Potion** | `13443` | `17530` | Healers / Casters (Budget) | Restaura 900 a 1500 de maná. |
| **Major Healing Potion** | `13446` | `17534` | Todos los Roles (Supervivencia) | Restaura 1050 a 1750 de salud. ⚠️ **Alerta**: En versiones previas de `seed_data.sql` el ID `10909` (*Mind Vision R2* de Priest) estaba mal etiquetado como *Major Healing Potion*. |
| **Mighty Rage Potion** | `13442` | `17528` | Warrior (DPS / Tank) | Aumenta la ira de 45 a 75 y otorga +60 de Fuerza durante 20 s. |
| **Great Rage Potion** | `5633` | `6613` | Warrior (DPS / Tank) | Aumenta la ira de 20 a 40. |
| **Greater Stoneshield Potion** | `13455` | `17540` | Tanks (Mitigación Física) | Aumenta la armadura en **2000 puntos** durante 2 min (vital en Patchwerk, Broodlord, Maexxna). |
| **Limited Invulnerability Potion (LIP)** | `3387` | `3169` | Todos (Salvavidas de Agro / AoE) | Inmunidad a ataques físicos durante 6 s (los enemigos ignoran temporalmente al jugador en la tabla de amenaza). |
| **Free Action Potion (FAP)** | `5634` | `6615` | Melee / Tanks / Todos | Inmunidad a efectos de *Stun* y reducción de movimiento durante 30 s (no limpia efectos ya activos). |
| **Living Action Potion (LAP)** | `20008` | `24364` | Todos (Receta Zandalar) | Inmunidad a *Stun* y ralentización durante 5 s **y además elimina los que ya estén activos**. |
| **Restorative Potion** | `9030` | `11359` *(Pulso: `11364`)* | Todos (Lucifron, Gehennas, Chromaggus) | Elimina 1 efecto de Magia, Maldición, Veneno o Enfermedad cada 5 s durante 30 s. ⚠️ **Alerta**: El ID `13180` es en realidad **Stratholme Holy Water** (Item ID `13180` / Spell ID `17291`), **no** *Restorative Potion*. |
| **Swiftness Potion** | `2459` | `2379` | Tanks / Kiting | Aumenta la velocidad de carrera un 50% durante 15 s. |
| **Greater Fire Protection Potion (GFPP)** | `13457` | `17543` | Raid-wide (MC / BWL / Onyxia) | Absorbe 1950 a 3250 de daño de Fuego durante 1 h. |
| **Greater Nature Protection Potion (GNPP)** | `13458` | `17546` | Raid-wide (AQ40 / Loatheb) | Absorbe 1950 a 3250 de daño de Naturaleza. |
| **Greater Shadow Protection Potion (GSPP)** | `13459` | `17548` | Raid-wide (Nefarian / Loatheb / C'Thun) | Absorbe 1950 a 3250 de daño de Sombras. |
| **Greater Frost Protection Potion (GFrPP)** | `13456` | `17544` | Raid-wide (Sapphiron / Kel'Thuzad) | Absorbe 1950 a 3250 de daño de Escarcha. |
| **Greater Arcane Protection Potion (GAPP)** | `13461` | `17549` | Raid-wide (Shazzrah / Skeram / Gothik) | Absorbe 1950 a 3250 de daño Arcano. |
| **Magic Resistance Potion** | `9036` | `11368` | Tanks / Casters | Otorga +50 a todas las resistencias mágicas durante 3 min (no se apila con auras/tótems del mismo tipo, pero no cuesta maná). |

### 3.3. Runas, Tubérculos de Frondavil y Gemas de Maná (Cooldown Secundario)
Estos consumibles **no comparten cooldown con las Pociones de Combate** (comparten su propio CD de 2 minutos entre Runas, Healthstones, Tubérculos y Mana Gems):

| Nombre del Consumible | Item ID | Cast / Gain Spell ID | Categoría / Rol Principal | Notas Técnicas |
| :--- | :---: | :---: | :--- | :--- |
| **Dark Rune** | `20520` | `27869` | Healers / Casters / Hunters / Paladins | Sacrifica 600 a 1000 de vida para restaurar 900 a 1500 de maná (dropea en Scholomance). |
| **Demonic Rune** | `12662` | `16666` | Healers / Casters / Hunters / Paladins | Idéntico efecto a *Dark Rune* (ligada al recoger de demonios de nivel 52–60 en Felwood/Azshara/Blasted Lands). |
| **Whipper Root Tuber** | `11951` | `15700` | Todos (Supervivencia Extra) | Restaura 700 a 900 de salud (comparte CD con *Healthstone*, no con pociones). |
| **Night Dragon's Breath** | `11952` | `15701` | Healers / Casters / Hunters | Restaura 394 a 456 de maná y de salud simultáneamente. |
| **Mana Ruby** *(Mage Conjured)* | `8008` | `10058` | Mage | Restaura 1000 a 1200 de maná. |
| **Mana Citrine** *(Mage Conjured)* | `8007` | `10057` | Mage | Restaura 775 a 925 de maná (no comparte objeto único con *Mana Ruby*). |
| **Thistle Tea** *(Rogue)* | `7676` | `9512` | Rogue | Restaura instantáneamente 100 de energía (5 min CD). |

### 3.4. Frascos (Flasks) y Elixires de Batalla / Guardián
| Nombre del Consumible | Item ID | Buff Spell ID (Aura) | Categoría / Rol Principal | Efecto del Buff |
| :--- | :---: | :---: | :--- | :--- |
| **Flask of the Titans** | `13510` | `17626` | Tanks / Todos (Progresión) | +1200 de salud máxima durante 2 h (persiste tras la muerte). |
| **Flask of Distilled Wisdom** | `13511` | `17627` | Healers / Paladins / Hunters | +2000 de maná máximo durante 2 h. |
| **Flask of Supreme Power** | `13512` | `17628` | Casters DPS (Mage / Warlock / Shadow / Balance / Ele) | +150 de Daño con Hechizos (*Spell Power*) durante 2 h. |
| **Flask of Chromatic Resistance** | `13513` | `17629` | Tanks / Soakers | +25 a todas las resistencias mágicas durante 2 h. |
| **Elixir of the Mongoose** | `13452` | `17538` | Melee DPS / Hunters / Tanks | +25 Agilidad y +2% de Probabilidad de Crítico físico (1 h). |
| **Greater Arcane Elixir** | `13454` | `17539` | Casters DPS | +35 de Daño con Hechizos durante 1 h. |
| **Elixir of Giants** | `9206` | `11405` | Melee DPS / Tanks | +25 de Fuerza durante 1 h (no se apila con *Juju Power*). |
| **Elixir of Greater Firepower** | `21546` | `26276` | Fire Mage / Destro Warlock | +40 de Daño con Hechizos de Fuego (1 h; reemplaza a *Elixir of Firepower* `6373 -> 7844` de +10). |
| **Elixir of Shadow Power** | `9264` | `11474` | Warlock / Shadow Priest | +40 de Daño con Hechizos de Sombras (30 min). |
| **Elixir of Frost Power** | `17708` | `21920` | Frost Mage | +15 de Daño con Hechizos de Escarcha (30 min). |
| **Mageblood Potion** | `20007` | `24363` | Healers / Casters | Regenera 12 de maná cada 5 segundos (MP5) durante 1 h. |
| **Elixir of Superior Defense** | `13445` | `11348` | Tanks | +450 de Armadura durante 1 h. |
| **Elixir of Fortitude** | `3825` | `3593` | Tanks / Todos | +120 de salud máxima durante 1 h. |
| **Gift of Arthas** | `9088` | `11371` *(Debuff Proc: `11374`)* | Tanks (Buff Raid Físico) | +10 Resistencia a las Sombras y 30% de prob. al ser golpeado de aplicar un debuff que aumenta en +8 todo el daño físico recibido por el boss. |
| **Juju Power** | `12451` | `16323` | Melee DPS / Tanks | +30 de Fuerza durante 30 min (superior a *Elixir of Giants*). |
| **Juju Might** | `12460` | `16329` | Melee DPS / Hunters / Tanks | +40 de Attack Power durante 10 min (no se apila con *Winterfall Firewater*). |
| **Winterfall Firewater** | `12820` | `17038` | Melee DPS / Tanks | +35 de Attack Power cuerpo a cuerpo y tamaño aumentado durante 20 min. |
| **R.O.I.D.S.** *(Blasted Lands)* | `8410` | `10667` | Melee DPS / Tanks | +25 de Fuerza durante 1 h. |
| **Ground Scorpok Assay** *(Blasted Lands)* | `8412` | `10669` | Melee DPS / Hunters / Tanks | +25 de Agilidad durante 1 h. |
| **Cerebral Cortex Compound** *(Blasted Lands)* | `8423` | `10692` | Casters / Healers | +25 de Intelecto durante 1 h. |
| **Lung Juice Cocktail** *(Blasted Lands)* | `8411` | `10668` | Tanks | +25 de Aguante (*Stamina*) durante 1 h. |
| **Spirit of Zanza** | `20079` | `24382` | Todos los Roles | +50 de Aguante y +50 de Espíritu durante 2 h. |
| **Swiftness of Zanza** | `20081` | `24383` | Tanks / Melees | +20% de velocidad de movimiento durante 2 h. |

### 3.5. Comidas con Buff, Alcoholes, Aceites/Piedras de Arma e Ingeniería
| Nombre del Consumible | Item ID | Buff / Cast Spell ID | Enchant ID (`combatantinfo`) | Rol / Efecto Técnico |
| :--- | :---: | :---: | :---: | :--- |
| **Blessed Sunfruit** *(Comida)* | `13810` | `18125` *(Buff: `18141`)* | — | +10 de Fuerza durante 10 min (Melee DPS / Tanks). |
| **Blessed Sunfruit Juice** | `13813` | `18140` *(Buff: `18141`)* | — | +10 de Espíritu durante 10 min (Healers). |
| **Grilled Squid** *(Comida)* | `13928` | `18192` | — | +10 de Agilidad durante 10 min (Rogues / Hunters / Cat / Tanks). |
| **Nightfin Soup** *(Comida)* | `13931` | `18194` | — | +8 MP5 durante 10 min (Healers / Casters). |
| **Smoked Desert Dumplings** *(Comida)* | `20452` | `24799` | — | +20 de Fuerza durante 15 min (Warriors / Rogues / Ret / Bear). |
| **Dirge's Kickin' Chimaerok Chops** *(Comida)* | `21023` | `25661` | — | +25 de Aguante durante 15 min (Tanks). |
| **Runn Tum Tuber Surprise** *(Comida)* | `18254` | `22730` | — | +10 de Intelecto durante 10 min (Casters / Healers). |
| **Gordok Green Grog** *(Alcohol DM)* | `18269` | `22789` | — | +10 de Aguante durante 15 min (se apila con comida normal). |
| **Kreeg's Stout Beatdown** *(Alcohol DM)* | `18284` | `22790` | — | +25 de Espíritu y -5 de Intelecto durante 15 min (Healers). |
| **Rumsey Rum Black Label** *(Alcohol)* | `21151` | `25804` | — | +15 de Aguante durante 15 min. |
| **Brilliant Wizard Oil** *(Aceite)* | `20749` | `25122` | `2628` | +36 Spell Damage y +1% Spell Crit en el arma durante 1 h (5 cargas). |
| **Brilliant Mana Oil** *(Aceite)* | `20748` | `25123` | `2629` | +12 MP5 y +25 Healing en el arma durante 1 h (5 cargas). |
| **Wizard Oil** *(Aceite)* | `20750` | `25121` | `2627` | +24 Spell Damage en el arma durante 1 h. |
| **Elemental Sharpening Stone** *(Piedra)* | `18262` | `22756` | `2506` | +2% de Probabilidad de Crítico físico en arma de filo/contundente (30 min). |
| **Dense Sharpening Stone** *(Piedra)* | `12404` | `16138` | `1643` | +8 de daño base al arma de filo (30 min). |
| **Dense Weightstone** *(Contrapeso)* | `12643` | `16622` | `1703` | +8 de daño base al arma contundente (30 min). |
| **Consecrated Sharpening Stone** *(Piedra)* | `23122` | `28891` | `2684` | +100 de Attack Power contra No-muertos (1 h). |
| **Blessed Wizard Oil** *(Aceite)* | `23123` | `28898` | `2685` | +60 de Spell Damage contra No-muertos (1 h). |
| **Goblin Sapper Charge** *(Ingeniería)* | `10646` | `13241` | — | Inflige 450 a 750 de daño de Fuego AoE a todos los enemigos cercanos (y 375–625 al lanzador; 5 min CD). |
| **Dense Dynamite** *(Ingeniería)* | `18641` | `23063` | — | Inflige 340 a 460 de daño de Fuego en un radio de 5 yardas (1 min CD). |
| **Thorium Grenade** *(Ingeniería)* | `15993` | `19769` | — | Inflige 300 a 500 de daño de Fuego e incapacita durante 3 s. |
| **Iron Grenade** *(Ingeniería)* | `4390` | `4068` | — | Inflige 132 a 218 de daño de Fuego e incapacita durante 3 s (muy económica para CC/interrupción). |
| **Stratholme Holy Water** *(No-muertos)* | `13180` | `17291` | — | Inflige 438 a 562 de daño Sagrado AoE contra No-muertos. |

---

## 4. Auditoría de Limpieza para `database/seed_data.sql` y `public/js/gameData.js`

Durante la inspección cruzada del repositorio (`database/seed_data.sql` y `public/js/gameData.js`), se han identificado **4 anomalías estructurales** que el agente encargado de base de datos debe corregir para garantizar la integridad del catálogo en *WoW: Forever*:

### 4.1. Purga de Hechizos Residuales de TBC (`28495+` / Rangos Nivel 61–70)
En la tabla `spells_class` de `database/seed_data.sql` existen múltiples filas con Spell IDs correspondientes a rangos de nivel 61–70 introducidos en *The Burning Crusade (2.4.3)* que **no existen en Nivel 60** y ensucian las consultas por nombre de habilidad:
- **Acción**: Eliminar todos los rangos de TBC en el intervalo `25400`–`50000` (p. ej., *Chain Heal R4/R5* `25422, 25423`, *Shadow Bolt R11* `27209`, *Corruption R8* `27216`, *Immolate R9* `27215`, *Fireball R13* `27070`, *Frostbolt R12/13* `27071, 27072`, *Master Healthstone* `27235, 27236, 27237, 43204`, *Super Mana/Healing Potion* `28495, 28499`), **conservando exclusivamente**:
  1. Los libros de habilidad legítimos de Nivel 60 de AQ20/Classic 1.12 (`25202`–`25361`, `25780`–`25918`, `27619` *Ice Block*, `27799`–`27801` *Holy Nova R4–R6*, `27869` *Dark Rune*, `28592`–`28595` *Winter's Chill*, `29131` *Bloodrage*, `29166` *Innervate*, `31016` *Eviscerate R9*, `31018` *Ferocious Bite R5*).
  2. Los **Backports explícitos de WoW: Forever** verificados en logs reales de la Beta 1.60 (`36936` *Totemic Recall*, `66842` *Call of the Elements*, `35395` *Crusader Strike* si aplica).
  3. Todos los **Custom Spells de WoW: Forever** en el rango `1240000+` (`1240193`, `1264727`–`1265928`, `1277324`–`1277371`, `1301071`–`1301713`, `1310185`–`1311656`).

### 4.2. Corrección de `class_id` Inválidos en `spells_class` (`'casts'`, `'debuffs'`, `'Consumable'`)
Se detectaron registros en `spells_class` donde la columna `class_id` contiene nombres de pestañas de Warcraft Logs (`'casts'`, `'debuffs'`) o el tipo `'Consumable'` en lugar de una de las 9 clases válidas (`Warrior`, `Paladin`, `Hunter`, `Rogue`, `Priest`, `Shaman`, `Mage`, `Warlock`, `Druid`):
- **Ejemplos concretos a corregir**:
  - `10909`: Etiquetado erróneamente como `'Major Healing Potion'` con `class_id = 'Consumable'`, cuando en realidad `10909` es **Mind Vision (Rank 2)** de `Priest` (y el Spell ID real de *Major Healing Potion* es `17534`, Item ID `13446`).
  - `13180`: Etiquetado como `'Restorative Potion'` con `class_id = 'Consumable'`, cuando `13180` es el Item ID de **Stratholme Holy Water** (y el Spell ID real de *Restorative Potion* es `11359`, Item ID `9030`).
  - Hechizos de clase con `class_id = 'casts'` o `'debuffs'` (provenientes de un volcado automático sin mapeo de clase): deben reasignarse a su clase real o moverse a `items_consumables` si son pociones/objetos.

### 4.3. Separación Estricta entre `items_equipment` e `items_consumables`
En `items_equipment` se filtraron objetos que **no son piezas equipables** (p. ej., consumibles, munición o materiales que aparecieron en algún array auxiliar de un log):
- **Acción**:
  - Asegurar que `items_equipment` contenga únicamente piezas equipables de las ranuras `0` a `18` (incluyendo los nuevos ítems custom de *WoW: Forever* en el rango `248000+`).
  - Migrar todos los consumibles a `items_consumables`, registrando tanto su **Item ID** como su **Buff/Cast Spell ID** (y **Enchant ID** cuando proceda) conforme a las tablas de la **Sección 3** de este documento.


---

## 9. Consumibles, Encantamientos y Bonus de Tier 1 Exclusivos de WoW Forever (Extraídos de Wowhead Forever)

Además de los consumibles clásicos de nivel 60 y las habilidades custom (`1210000+`), el cliente de **WoW Forever (`https://www.wowhead.com/forever/`)** introduce una serie de consumibles, comidas, bombas, encantamientos y bonus de conjunto (Tier 1) con IDs exclusivos que pueden aparecer en `CombatantInfo` o en los eventos de `cast` / `applybuff` de Warcraft Logs:

### 9.1 Nuevas Pociones y Elixires Custom de WoW Forever (Item IDs `250327`–`250955`)

| Nombre | Item ID | Icono | Categoría / Notas en WoW Forever |
| :--- | :--- | :--- | :--- |
| **Greater Holy Protection Potion** | `250932` | `inv_potion_09` | Nueva poción de absorción Sagrada de rango superior (Classic solo tenía `6051` Holy Protection Potion) |
| **Potion of Alacrity** | `250936` | `inv_potion_08` | Poción custom de celeridad / velocidad en WoW Forever |
| **Dreamtonic** | `250938` | `inv_potion_10` | Tónico / poción custom de WoW Forever |
| **Touch of Dreams** | `250939` | `inv_potion_12` | Consumible custom de WoW Forever |
| **Lesser Arcane Protection Potion** | `250942` | `inv_potion_83` | Versión menor de protección Arcana |
| **Arcane Protection Potion** | `250945` | `inv_potion_83` | Versión intermedia de protección Arcana |
| **Nature Protection Potion (Forever Variant)** | `250954` | `inv_potion_06` | Variante custom de Nature Protection Potion |
| **Shadow Protection Potion (Forever Variant)** | `250955` | `inv_potion_44` | Variante custom de Shadow Protection Potion |
| **Elixir of Minor Dodge** | `250327` | `inv_potion_02` | Elixir defensivo custom (Dodge) |
| **Elixir of Lesser Dodge** | `250328` | `inv_potion_03` | Elixir defensivo custom (Dodge) |
| **Elixir of Dodge** | `250329` | `inv_potion_04` | Elixir defensivo custom (Dodge) |
| **Elixir of Greater Dodge** | `250330` | `inv_potion_05` | Elixir defensivo de raid para Tanks (Dodge) |
| **Elixir of Minor Accuracy** | `250331` | `inv_potion_62` | Elixir ofensivo custom (Hit / Accuracy) |
| **Elixir of Lesser Accuracy** | `250332` | `inv_potion_63` | Elixir ofensivo custom (Hit / Accuracy) |
| **Elixir of Accuracy** | `250333` | `inv_potion_64` | Elixir ofensivo custom (Hit / Accuracy) |
| **Elixir of Greater Accuracy** | `250334` | `inv_potion_65` | Elixir ofensivo de raid (Hit / Accuracy) |
| **Elixir of Minor Casting Speed** | `250335` | `inv_potion_95` | Elixir de Spell Haste (rango menor) |
| **Elixir of Lesser Casting Speed** | `250336` | `inv_potion_96` | Elixir de Spell Haste (rango inferior) |
| **Elixir of Casting Speed** | `250337` | `inv_potion_97` | Elixir de Spell Haste |
| **Elixir of Rapid Casting** | `250338` | `inv_potion_98` | Elixir de raid para Casters/Healers (Spell Haste) |
| **Elixir of Minor Swiftness** | `250339` | `inv_potion_90` | Elixir de Haste físico / velocidad (rango menor) |
| **Elixir of Lesser Swiftness** | `250340` | `inv_potion_91` | Elixir de Haste físico / velocidad (rango inferior) |
| **Elixir of Swiftness** | `250341` | `inv_potion_92` | Elixir de Haste físico / velocidad |
| **Elixir of Greater Swiftness** | `250342` | `inv_potion_93` | Elixir de raid para Melee/Ranged DPS (Haste físico) |
| **Elixir of Spell Mastery** | `250346` | `inv_potion_33` | Elixir de raid para Casters |
| **Elixir ofGreater Arcane Power** | `250354` | `inv_potion_83` | Elixir de poder Arcano superior |

### 9.2 Nuevas Comidas y Bebidas Custom de WoW Forever (Item IDs `250065`–`250081`)

| Nombre | Item ID | Icono | Notas |
| :--- | :--- | :--- | :--- |
| **Wild Rice Cakes** | `250065` | `inv_misc_food_65` | Comida custom de WoW Forever |
| **Salted Venison** | `250066` | `inv_misc_food_71` | Comida custom de WoW Forever |
| **Hearty Goretusk Stew** | `250067` | `inv_misc_food_64` | Comida custom de WoW Forever |
| **Spiced Crocolisk Tail** | `250068` | `inv_misc_food_70` | Comida custom de WoW Forever |
| **Stag Meat Pie** | `250069` | `inv_misc_food_10` | Comida custom de WoW Forever |
| **Candied Yam** | `250070` | `inv_misc_food_25` | Comida custom de WoW Forever |
| **Crispy Crawler Legs** | `250071` | `inv_misc_food_51` | Comida custom de WoW Forever |
| **Blasted Boar Ribs** | `250072` | `inv_misc_food_16` | Comida custom de WoW Forever |
| **Smoked Redgill** | `250073` | `inv_misc_fish_06` | Comida custom de WoW Forever |
| **Sparkling Peach Nectar** | `250080` | `inv_drink_11` | Bebida custom de WoW Forever |
| **Bitter Cactus Cider** | `250081` | `inv_drink_04` | Bebida custom de WoW Forever |

### 9.3 Explosivos e Ingeniería Custom de WoW Forever (Item IDs `260792`–`260818`)

En WoW Forever, los explosivos clásicos tienen además variantes **SAF-T** y **EZ-Thro**:

| Nombre | Item ID | Icono | Notas |
| :--- | :--- | :--- | :--- |
| **SAF-T Rough Copper Bomb** | `260792` | `inv_misc_bomb_09` | Variante SAF-T de Ingeniería |
| **SAF-T Large Copper Bomb** | `260795` | `inv_misc_bomb_01` | Variante SAF-T de Ingeniería |
| **SAF-T Small Bronze Bomb** | `260796` | `inv_misc_bomb_09` | Variante SAF-T de Ingeniería |
| **SAF-T Big Bronze Bomb** | `260797` | `inv_misc_bomb_05` | Variante SAF-T de Ingeniería |
| **SAF-T Iron Grenade** | `260798` | `inv_misc_bomb_08` | Variante SAF-T de Iron Grenade |
| **SAF-T Big Iron Bomb** | `260799` | `inv_misc_bomb_01` | Variante SAF-T de Big Iron Bomb |
| **SAF-T Mithril Frag Bomb** | `260801` | `inv_misc_bomb_02` | Variante SAF-T de Mithril Frag Bomb |
| **SAF-T The Big One** | `260802` | `inv_misc_bomb_04` | Variante SAF-T de The Big One |
| **SAF-T Explosive Sheep** | `260803` | `spell_nature_polymorph` | Variante SAF-T de Explosive Sheep |
| **SAF-T Goblin Land Mine** | `260804` | `inv_misc_armorkit_20` | Variante SAF-T de Goblin Land Mine |
| **SAF-T Hi-Explosive Bomb** | `260805` | `inv_misc_bomb_07` | Variante SAF-T de Hi-Explosive Bomb |
| **SAF-T Thorium Grenade** | `260806` | `inv_misc_bomb_08` | Variante SAF-T de Thorium Grenade |
| **SAF-T Dark Iron Bomb** | `260807` | `inv_misc_bomb_05` | Variante SAF-T de Dark Iron Bomb |
| **SAF-T Arcane Bomb** | `260808` | `spell_holy_silence` | Variante SAF-T de Arcane Bomb |
| **EZ-Thro Iron Grenade** | `260812` | `inv_misc_bomb_08` | Variante EZ-Thro (sin requerir Ingeniería) |
| **EZ-Thro Mithril Frag Bomb** | `260814` | `inv_misc_bomb_02` | Variante EZ-Thro (sin requerir Ingeniería) |
| **EZ-Thro Hi-Explosive Bomb** | `260816` | `inv_misc_bomb_07` | Variante EZ-Thro (sin requerir Ingeniería) |
| **EZ-Thro Thorium Grenade** | `260817` | `inv_misc_bomb_08` | Variante EZ-Thro (sin requerir Ingeniería) |
| **EZ-Thro Dark Iron Bomb** | `260818` | `inv_misc_bomb_05` | Variante EZ-Thro (sin requerir Ingeniería) |

### 9.4 Encantamientos y Bonus de Tier 1 Custom de WoW Forever (`1213593`–`1306525`)

- **Encantamientos Custom de WoW Forever (`professions/enchanting`)**:
  - `1213593` (*Enchant Gloves -Superior Strength*), `1213596` (*Enchant Bracer - Greater Agility*), `1213605` (*Enchant Bracer - Healing Power*), `1213615` (*Enchant Gloves - Arcane Power*), `1213617` (*Enchant Gloves - Holy Power*), `1213619` (*Enchant Gloves - Nature Power*), `1213831` (*Enchant Boots - Vigor*), `1214155` (*Enchant Shield - Law of Nature*), `1216782` (*Enchant Cloak - GreaterStealth*), `1217203` (*Enchant Bracer - Spell Power*), `1217206` (*Enchant Bracer - Dodge*), `1218393` (*Enchant Chest - Greater Absorption*), `1219514`–`1219564` (*Enchant 2H Weapon -Minor/Lesser/Standard/Greater/Superior Spell Impact*), `1219565`–`1219572` (*Enchant Bracer - Mana Regeneration / Major Mana*), `1219573`–`1219580` (*Enchant Gloves - Casting Speed / Major Strength / Major Healing*), `1219582`–`1219587` (*Enchant Boots - Accuracy /Greater Accuracy / Swiftness*), `1220624` (*Enchant Weapon -Spellblasting*), `1306525` (*Enchant Weapon - Executioner*).
- **Bonus de Conjunto Tier 1 Reworkeados por Rol en WoW Forever (`1300934`–`1301722`)**:
  - **Warrior (`Might`)**: DPS (`1300934` 2P, `1300948` 4P, `1300953` 6P, `1300954` 8P) y Tank (`1300956` 2P, `1300958` 4P, `1300965` 6P, `1300974` 8P).
  - **Paladin (`Lawbringer`)**: Healer (`1300976`–`1300988`), DPS (`1300989`–`1301012`), Tank (`1301016`–`1301025`).
  - **Hunter (`Giantstalker`)**: Ranged (`1301026`–`1301032`), Melee (`1301035`–`1301040`).
  - **Rogue (`Nightslayer`)**: DPS (`1301041`–`1301060`).
  - **Priest (`Prophecy`)**: Healer (`1301070`–`1301081`), DPS (`1301092`–`1301102`).
  - **Shaman (`Earthfury`)**: Healer (`1301134`–`1301138`), Melee (`1301140`–`1301149`), Elemental (`1301153`–`1301157`), Tank (`1301715`–`1301722`).
  - **Mage (`Arcanist`)**: DPS (`1301159`–`1301207`).
  - **Warlock (`Felheart`)**: DPS (`1301224`–`1301233`).
  - **Druid (`Cenarion`)**: Balance (`1301235`–`1301242`), Feral DPS (`1301245`–`1301256`), Bear Tank (`1301279`–`1301334`), Restoration (`1301337`–`1301342`).
