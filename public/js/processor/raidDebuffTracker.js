// public/js/processor/raidDebuffTracker.js
// Processor for raid-wide boss debuffs and party/raid buffs across all players.

import { SPELL_DB } from '../gameData.js';

export const TRACKED_BOSS_DEBUFFS = [
    {
        name: "Sunder Armor",
        ids: [7386, 7405, 8380, 11596, 11597, 25225],
        icon: "ability_warrior_sunder",
        category: "Armor Reduction",
        color: "#e67e22"
    },
    {
        name: "Faerie Fire",
        ids: [770, 778, 9749, 9907, 16857, 17390, 17391, 17392],
        icon: "spell_nature_faeriefire",
        category: "Armor Reduction",
        color: "#9b59b6"
    },
    {
        name: "Curse of Recklessness",
        ids: [704, 7658, 7659, 11717],
        icon: "spell_shadow_unholystrength",
        category: "Armor Reduction",
        color: "#e74c3c"
    },
    {
        name: "Expose Armor",
        ids: [8647, 8649, 8650, 11197, 11198],
        icon: "ability_warrior_riposte",
        category: "Armor Reduction",
        color: "#e67e22"
    },
    {
        name: "Curse of the Elements",
        ids: [1490, 11721, 11722],
        icon: "spell_shadow_chilltouch",
        category: "Spell Vulnerability",
        color: "#9b59b6"
    },
    {
        name: "Curse of Shadow",
        ids: [17937, 17938],
        icon: "spell_shadow_curseofachimonde",
        category: "Spell Vulnerability",
        color: "#8e44ad"
    },
    {
        name: "Judgement of Wisdom",
        ids: [20186, 20354, 20355],
        icon: "spell_holy_righteousnessaura",
        category: "Paladin Judgements",
        color: "#3da5d9"
    },
    {
        name: "Judgement of Light",
        ids: [20185, 20344, 20345, 20346],
        icon: "spell_holy_healingaura",
        category: "Paladin Judgements",
        color: "#f1c40f"
    },
    {
        name: "Judgement of the Crusader",
        ids: [21183, 20300, 20301, 20302, 20303],
        icon: "spell_holy_holysmite",
        category: "Paladin Judgements",
        color: "#f39c12"
    },
    {
        name: "Demoralizing Shout",
        ids: [1160, 6190, 11554, 11555, 11556, 25202],
        icon: "ability_warrior_warcry",
        category: "Mitigation",
        color: "#e74c3c"
    },
    {
        name: "Demoralizing Roar",
        ids: [99, 1735, 9490, 9747, 9898],
        icon: "ability_druid_demoralizingroar",
        category: "Mitigation",
        color: "#e74c3c"
    },
    {
        name: "Thunder Clap",
        ids: [6343, 8198, 8204, 8205, 11580, 11581],
        icon: "spell_nature_thunderclap",
        category: "Mitigation",
        color: "#3498db"
    },
    {
        name: "Improved Scorch",
        ids: [22959],
        icon: "spell_fire_soulburn",
        category: "Spell Vulnerability",
        color: "#e67e22"
    },
    {
        name: "Winter's Chill",
        ids: [12579, 28592, 28593, 28594, 28595],
        icon: "spell_frost_chillingblast",
        category: "Spell Vulnerability",
        color: "#3498db"
    },
    {
        name: "Shadow Weaving",
        ids: [15257, 15258, 15331, 15332, 15333, 15334],
        icon: "spell_shadow_blackplague",
        category: "Spell Vulnerability",
        color: "#8e44ad"
    },
    {
        name: "Stormstrike",
        ids: [17364],
        icon: "spell_holy_sealofmight",
        category: "Spell Vulnerability",
        color: "#3498db"
    },
    {
        name: "Nightfall",
        ids: [23605],
        icon: "spell_holy_elunesgrace",
        category: "Spell Vulnerability",
        color: "#9b59b6"
    },
    {
        name: "Annihilator",
        ids: [16928],
        icon: "inv_axe_12",
        category: "Armor Reduction",
        color: "#e67e22"
    }
];

export const TRACKED_RAID_BUFFS = [
    {
        name: "Blessing of Might",
        ids: [19740, 19834, 19835, 19836, 19837, 19838, 25782, 25916],
        icon: "spell_holy_fistofjustice",
        category: "Paladin Blessings"
    },
    {
        name: "Blessing of Kings",
        ids: [20217, 25898],
        icon: "spell_magic_magearmor",
        category: "Paladin Blessings"
    },
    {
        name: "Blessing of Salvation",
        ids: [1038, 25895],
        icon: "spell_holy_sealofsalvation",
        category: "Paladin Blessings"
    },
    {
        name: "Blessing of Wisdom",
        ids: [19742, 19850, 19852, 19853, 19854, 25894, 25918],
        icon: "spell_holy_sealofwisdom",
        category: "Paladin Blessings"
    },
    {
        name: "Blessing of Light",
        ids: [19977, 19978, 19979, 25890],
        icon: "spell_holy_prayerofhealing02",
        category: "Paladin Blessings"
    },
    {
        name: "Leader of the Pack",
        ids: [17007, 24932],
        icon: "spell_nature_unyeildingstamina",
        category: "Auras"
    },
    {
        name: "Trueshot Aura",
        ids: [19506, 20905, 20906],
        icon: "ability_trueshot",
        category: "Auras"
    },
    {
        name: "Moonkin Aura",
        ids: [24907],
        icon: "spell_nature_moonglow",
        category: "Auras"
    },
    {
        name: "Battle Shout",
        ids: [6673, 5242, 6192, 11549, 11550, 11551, 25289],
        icon: "ability_warrior_battleshout",
        category: "Auras"
    },
    {
        name: "Windfury Totem",
        ids: [8512, 10613, 10614, 25587],
        icon: "spell_nature_windfury",
        category: "Shaman Totems"
    },
    {
        name: "Grace of Air Totem",
        ids: [8835, 10627, 25359],
        icon: "spell_nature_invisibilitytotem",
        category: "Shaman Totems"
    },
    {
        name: "Power Word: Fortitude",
        ids: [1243, 1244, 1245, 2791, 10937, 10938, 21562, 21564],
        icon: "spell_holy_wordfortitude",
        category: "Raid Buffs"
    },
    {
        name: "Mark of the Wild",
        ids: [1126, 5232, 6756, 5234, 8907, 9884, 9885, 21849, 21850],
        icon: "spell_nature_regeneration",
        category: "Raid Buffs"
    },
    {
        name: "Arcane Intellect",
        ids: [1459, 1460, 1461, 10156, 10157, 23028],
        icon: "spell_holy_magicalsentry",
        category: "Raid Buffs"
    },
    {
        name: "Shadow Protection",
        ids: [976, 10957, 10958, 27683],
        icon: "spell_shadow_antishadow",
        category: "Raid Buffs"
    },
    {
        name: "Bloodlust",
        ids: [2825],
        icon: "spell_nature_bloodlust",
        category: "Raid Buffs"
    }
];

export function processRaidDebuffsAndBuffs(fightEvents, fightInfo, allActors, targetPlayer = null) {
    const actorMap = {};
    const playerIds = new Set();
    allActors.forEach(a => {
        actorMap[a.id] = a.name;
        if (a.type === 'Player') playerIds.add(a.id);
    });

    const durationMs = fightInfo ? (fightInfo.endTime - fightInfo.startTime) : 1;
    const fightStart = fightInfo ? fightInfo.startTime : 0;
    const fightEnd = fightInfo ? fightInfo.endTime : 0;

    // Build ID lookup maps
    const debuffMap = {};
    TRACKED_BOSS_DEBUFFS.forEach(d => {
        d.ids.forEach(id => {
            debuffMap[id] = d;
        });
    });

    const buffMap = {};
    TRACKED_RAID_BUFFS.forEach(b => {
        b.ids.forEach(id => {
            buffMap[id] = b;
        });
    });

    // ── 1. Process Boss Debuffs across all enemies ──
    const bossDebuffData = {};
    TRACKED_BOSS_DEBUFFS.forEach(d => {
        bossDebuffData[d.name] = {
            config: d,
            applied: false,
            count: 0,
            uptimePct: 0,
            sources: {}, // { playerName: count }
            segments: [] // [{ start, end }]
        };
    });

    // Track active debuff segments per debuff and target
    const activeDebuffs = {}; // `${dName}_${targetID}` -> open segment

    // ── 2. Process Raid/Party Buffs on Target Player (or whole raid) ──
    const raidBuffData = {};
    TRACKED_RAID_BUFFS.forEach(b => {
        raidBuffData[b.name] = {
            config: b,
            applied: false,
            uptimePct: 0,
            sources: {},
            segments: []
        };
    });

    const activeBuffs = {}; // `${bName}_${targetID}` -> open segment

    fightEvents.forEach(ev => {
        const t = ev.type;
        const sid = ev.abilityGameID;
        const src = ev.sourceID;
        const tgt = ev.targetID;
        const ts = ev.timestamp;

        // Process Boss Debuffs
        if (sid && debuffMap[sid]) {
            const d = debuffMap[sid];
            const isHostileTarget = !playerIds.has(tgt);

            if (isHostileTarget) {
                const key = `${d.name}_${tgt}`;
                const srcName = actorMap[src] || (src ? `#${src}` : 'Unknown');

                if (t === 'applydebuff' || t === 'refreshdebuff') {
                    const record = bossDebuffData[d.name];
                    record.applied = true;
                    record.count++;
                    record.sources[srcName] = (record.sources[srcName] || 0) + 1;

                    if (!activeDebuffs[key]) {
                        const seg = { start: ts, end: null, target: tgt };
                        activeDebuffs[key] = seg;
                        record.segments.push(seg);
                    }
                } else if (t === 'removedebuff') {
                    if (activeDebuffs[key]) {
                        activeDebuffs[key].end = ts;
                        delete activeDebuffs[key];
                    }
                }
            }
        }

        // Process Party & Raid Buffs
        if (sid && buffMap[sid]) {
            const b = buffMap[sid];
            // If targetPlayer is specified, only track buffs on targetPlayer. Otherwise track all players.
            const isRelevantTarget = targetPlayer ? (tgt === targetPlayer.id) : playerIds.has(tgt);

            if (isRelevantTarget) {
                const key = `${b.name}_${tgt}`;
                const srcName = actorMap[src] || (src ? `#${src}` : 'Unknown');

                if (t === 'applybuff' || t === 'refreshbuff') {
                    const record = raidBuffData[b.name];
                    record.applied = true;
                    record.sources[srcName] = (record.sources[srcName] || 0) + 1;

                    if (!activeBuffs[key]) {
                        const seg = { start: ts, end: null, target: tgt };
                        activeBuffs[key] = seg;
                        record.segments.push(seg);
                    }
                } else if (t === 'removebuff') {
                    if (activeBuffs[key]) {
                        activeBuffs[key].end = ts;
                        delete activeBuffs[key];
                    }
                }
            }
        }
    });

    // Close any open segments at fight end
    Object.values(activeDebuffs).forEach(seg => {
        if (seg.end === null) seg.end = fightEnd || (fightStart + durationMs);
    });
    Object.values(activeBuffs).forEach(seg => {
        if (seg.end === null) seg.end = fightEnd || (fightStart + durationMs);
    });

    // Calculate merged uptimes
    Object.values(bossDebuffData).forEach(d => {
        if (d.segments.length === 0) return;
        d.segments.sort((a, b) => a.start - b.start);
        const merged = [];
        for (const seg of d.segments) {
            const s = Math.max(fightStart, seg.start);
            const e = Math.min(fightEnd, seg.end || fightEnd);
            if (e <= s) continue;
            if (!merged.length || s > merged[merged.length - 1].end) {
                merged.push({ start: s, end: e });
            } else {
                merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, e);
            }
        }
        const coveredMs = merged.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
        d.uptimePct = Math.min(100, Math.round((coveredMs / durationMs) * 100));
    });

    Object.values(raidBuffData).forEach(b => {
        if (b.segments.length === 0) return;
        b.segments.sort((a, b) => a.start - b.start);
        const merged = [];
        for (const seg of b.segments) {
            const s = Math.max(fightStart, seg.start);
            const e = Math.min(fightEnd, seg.end || fightEnd);
            if (e <= s) continue;
            if (!merged.length || s > merged[merged.length - 1].end) {
                merged.push({ start: s, end: e });
            } else {
                merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, e);
            }
        }
        const coveredMs = merged.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
        b.uptimePct = Math.min(100, Math.round((coveredMs / durationMs) * 100));
    });

    return {
        bossDebuffs: bossDebuffData,
        raidBuffs: raidBuffData
    };
}
