import { CLASS_ABILITY_TRACKING, SPELL_DB } from '../gameData.js';

export function trackClassAbilities(fightEvents, player, ctx) {
    let tracking = CLASS_ABILITY_TRACKING[ctx.spec];
    if (!tracking && ctx.spec) {
        const noSpace = ctx.spec.replace(/\s+/g, '');
        tracking = CLASS_ABILITY_TRACKING[noSpace];
    }
    if (!tracking && CLASS_ABILITY_TRACKING) {
        const baseClass = player.subType;
        const fallbackKey = Object.keys(CLASS_ABILITY_TRACKING).find(k => k.startsWith(baseClass + '-'));
        if (fallbackKey) tracking = CLASS_ABILITY_TRACKING[fallbackKey];
    }

    if (tracking) {
        const castIdMap = {};
        if (tracking && tracking.casts) {
            tracking.casts.forEach(entry => {
                const ids = Array.isArray(entry.ids) ? entry.ids : (entry.id ? [entry.id] : []);
                ids.forEach((id, index) => {
                    let mappedEntry = { ...entry };
                    if (!mappedEntry.icon && SPELL_DB[id]) {
                        mappedEntry.icon = SPELL_DB[id].icon;
                    }
                    if (entry.maxRank) {
                        const currentRank = entry.maxRank - index;
                        if (index > 0) {
                            mappedEntry.rankString = `(Rank ${currentRank})`;
                        }
                    }
                    castIdMap[id] = mappedEntry;
                });
            });
        }
        const debuffIdMap = {};
        if (tracking && tracking.debuffs) {
            tracking.debuffs.forEach(entry => {
                const ids = Array.isArray(entry.ids) ? entry.ids : (entry.id ? [entry.id] : []);
                ids.forEach(id => {
                    let mappedEntry = { ...entry };
                    if (!mappedEntry.icon && SPELL_DB[id]) {
                        mappedEntry.icon = SPELL_DB[id].icon;
                    }
                    debuffIdMap[id] = mappedEntry;
                });
            });
        }

        const DEBUFF_DURATION_MS = {
            11713: 24000, 25311: 18000, 25309: 15000, 11722: 300000,
            17937: 300000, 11717: 120000, 603: 60000, 1213158: 18000,
            11597: 30000, 25225: 30000, 9904: 9000, 9896: 12000, 9835: 12000,
            24977: 12000, 9907: 40000, 17392: 40000, 25295: 15000, 10894: 18000,
            15286: 60000, 19280: 24000,
            8512: 120000, 10613: 120000, 10614: 120000,
            25359: 120000, 10442: 120000,
            14325: 120000,
            6673: 120000, 5242: 120000, 6192: 120000,
            11549: 120000, 11550: 120000, 11551: 120000, 25289: 120000,
        };
        const DEFAULT_DEBUFF_MS = 15000;

        const hasRealEvents = {};

        fightEvents.forEach(ev => {
            if (ev.type === 'combatantinfo' && ev.auras) {
                const targetId = ev.sourceID;
                const targetName = ctx.actorNameMap[targetId] || `#${targetId}`;
                ev.auras.forEach(aura => {
                    if (aura.source === player.id) {
                        const sid = aura.ability;
                        const entry = debuffIdMap[sid];
                        if (entry && !entry.isCastPoint) {
                            if (!ctx.debuffTimeline[entry.name]) {
                                ctx.debuffTimeline[entry.name] = {
                                    icon: entry.icon,
                                    color: entry.color || '#f4b400',
                                    isCastPoint: false,
                                    alwaysOnTop: entry.alwaysOnTop || false,
                                    sortOrder: entry.sortOrder != null ? entry.sortOrder : 999,
                                    group: entry.group || null,
                                    hideFromOverall: entry.hideFromOverall || false,
                                    targets: {}
                                };
                            }
                            const tl = ctx.debuffTimeline[entry.name];
                            if (!tl.targets[targetName]) tl.targets[targetName] = [];
                            if (!tl.targets[targetName].some(s => s.end === null)) {
                                tl.targets[targetName].push({ start: ev.timestamp, end: null, real: true });
                            }
                            if (!hasRealEvents[entry.name]) hasRealEvents[entry.name] = new Set();
                            hasRealEvents[entry.name].add(targetName);
                        }
                    }
                });
            }
        });

        fightEvents.forEach(ev => {
            const sid = ev.abilityGameID;
            if (!sid) return;

            // 1. Cast Counts: track when the player casts a configured ability (no-CD rotational)
            if (ev.type === 'cast' && ev.sourceID === player.id && castIdMap[sid]) {
                const entry = castIdMap[sid];
                if (!entry.trackOnDamage) {
                    const spellName = entry.rankString ? `${entry.name} ${entry.rankString}` : entry.name;
                    const icon = entry.icon || (SPELL_DB[sid] && SPELL_DB[sid].icon) || 'inv_misc_questionmark';
                    if (!ctx.castCounts[spellName]) {
                        ctx.castCounts[spellName] = { count: 0, icon: icon, lowRankCount: 0 };
                    }
                    ctx.castCounts[spellName].count++;
                    if (entry.topIds && !entry.topIds.includes(sid)) {
                        ctx.castCounts[spellName].lowRankCount++;
                    }
                }
            }

            if (ev.type === 'damage' && ev.sourceID === player.id && castIdMap[sid]) {
                const entry = castIdMap[sid];
                if (entry.trackOnDamage) {
                    const spellName = entry.name;
                    const icon = entry.icon || (SPELL_DB[sid] && SPELL_DB[sid].icon) || 'inv_misc_questionmark';
                    if (!ctx.castCounts[spellName]) {
                        ctx.castCounts[spellName] = { count: 0, icon: icon, lowRankCount: 0 };
                    }
                    ctx.castCounts[spellName].count++;
                }
            }

            // 2. Debuffs & Buffs (Uptime)
            let entry = debuffIdMap[sid];
            if (!entry) return;

            const isBuff = !!entry.isBuff;
            const targetId = ev.targetID;

            // For enemy debuffs, ignore if the target is the player himself
            if (!isBuff && !entry.isCastPoint && targetId === player.id && ev.type !== 'cast') return;

            let targetName;
            if (entry.isCastPoint || (ev.type === 'cast' && (!targetId || targetId === player.id))) {
                targetName = ctx.actorNameMap[targetId] || 'Raid';
            } else {
                targetName = ctx.actorNameMap[targetId] || `#${targetId}`;
            }

            const isAuraEv = ['applydebuff', 'refreshdebuff', 'removedebuff', 'applybuff', 'refreshbuff', 'removebuff'].includes(ev.type);
            const isRemoval = ['removedebuff', 'removebuff'].includes(ev.type);
            const isPlayerSrc = ev.sourceID === player.id;

            if (!isAuraEv && !isPlayerSrc && ev.type !== 'cast') return;
            if (isAuraEv && !isRemoval && ev.sourceID && ev.sourceID !== 0 && !isPlayerSrc) return;

            if (!ctx.debuffTimeline[entry.name]) {
                ctx.debuffTimeline[entry.name] = {
                    icon: entry.icon || (SPELL_DB[sid] && SPELL_DB[sid].icon) || 'inv_misc_questionmark',
                    color: entry.color || (isBuff ? '#f5c542' : '#e67e22'),
                    isCastPoint: entry.isCastPoint || false,
                    alwaysOnTop: entry.alwaysOnTop || false,
                    sortOrder: entry.sortOrder != null ? entry.sortOrder : 999,
                    group: entry.group || null,
                    hideFromOverall: entry.hideFromOverall || false,
                    targets: {}
                };
            }
            const tl = ctx.debuffTimeline[entry.name];
            if (!tl.targets[targetName]) tl.targets[targetName] = [];
            const segments = tl.targets[targetName];

            if (ev.type === 'applydebuff' || ev.type === 'applybuff') {
                if (entry.isCastPoint) {
                    segments.push({ start: ev.timestamp, end: ev.timestamp, real: true, isPoint: true });
                    if (!hasRealEvents[entry.name]) hasRealEvents[entry.name] = new Set();
                    hasRealEvents[entry.name].add(targetName);
                } else {
                    const open = segments.find(s => s.end === null);
                    if (open) open.end = ev.timestamp;
                    segments.push({ start: ev.timestamp, end: null, real: true });
                    if (!hasRealEvents[entry.name]) hasRealEvents[entry.name] = new Set();
                    hasRealEvents[entry.name].add(targetName);
                }

            } else if (ev.type === 'refreshdebuff' || ev.type === 'refreshbuff') {
                if (entry.isCastPoint) {
                    segments.push({ start: ev.timestamp, end: ev.timestamp, real: true, isPoint: true });
                    if (!hasRealEvents[entry.name]) hasRealEvents[entry.name] = new Set();
                    hasRealEvents[entry.name].add(targetName);
                } else {
                    const open = segments.find(s => s.end === null);
                    if (open) open.end = ev.timestamp;
                    segments.push({ start: ev.timestamp, end: null, real: true });
                    if (!hasRealEvents[entry.name]) hasRealEvents[entry.name] = new Set();
                    hasRealEvents[entry.name].add(targetName);
                }

            } else if (ev.type === 'removedebuff' || ev.type === 'removebuff') {
                if (!entry.isCastPoint) {
                    const open = segments.find(s => s.end === null);
                    if (open) open.end = ev.timestamp;
                }

            } else if (ev.type === 'cast' && isPlayerSrc) {
                if (entry.isCastPoint) {
                    segments.push({ start: ev.timestamp, end: ev.timestamp, real: true, isPoint: true });
                    if (!hasRealEvents[entry.name]) hasRealEvents[entry.name] = new Set();
                    hasRealEvents[entry.name].add(targetName);
                } else {
                    if (entry.group) {
                        Object.entries(ctx.debuffTimeline).forEach(([otherName, otherDl]) => {
                            if (otherDl.group === entry.group && otherName !== entry.name) {
                                Object.values(otherDl.targets).forEach(otherSegs => {
                                    otherSegs.forEach(seg => {
                                        if (seg.end > ev.timestamp) seg.end = ev.timestamp;
                                    });
                                });
                            }
                        });
                    }
                    const dur = entry.duration || DEBUFF_DURATION_MS[sid] || DEFAULT_DEBUFF_MS;
                    segments.push({ start: ev.timestamp, end: ev.timestamp + dur, real: false });
                }
            }
        });

        const fightEnd = fightEvents.length > 0 ? fightEvents[fightEvents.length - 1].timestamp : 0;
        Object.entries(ctx.debuffTimeline).forEach(([debuffName, dl]) => {
            const realSet = hasRealEvents[debuffName] || new Set();
            Object.entries(dl.targets).forEach(([tName, segs]) => {
                if (realSet.size > 0) {
                    dl.targets[tName] = segs.filter(s => s.real !== false);
                }
                const tLife = ctx.targetLifespans[tName];
                const deaths = (tLife && tLife.deaths) ? tLife.deaths.slice().sort((a, b) => a - b) : [];
                
                dl.targets[tName].forEach(s => {
                    let deathEnd = null;
                    for (let d of deaths) {
                        if (d > s.start) {
                            deathEnd = d;
                            break;
                        }
                    }
                    if (s.end === null) {
                        s.end = deathEnd !== null ? deathEnd : fightEnd;
                    } else if (deathEnd !== null && s.end > deathEnd) {
                        s.end = deathEnd;
                    }
                });

                const sorted = dl.targets[tName].slice().sort((a, b) => a.start - b.start);
                const merged = [];
                for (const seg of sorted) {
                    if (!merged.length || seg.start > merged[merged.length - 1].end) {
                        merged.push({ start: seg.start, end: seg.end });
                    } else {
                        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, seg.end);
                    }
                }
                dl.targets[tName] = merged;
            });
        });

    }
}
