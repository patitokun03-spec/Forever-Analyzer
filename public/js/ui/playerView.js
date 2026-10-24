import { state } from '../state.js';
import { formatDuration } from '../utils.js';
import { CLASSES, CLASS_COLORS, SPEC_ICONS, SPEC_ROLES, BUFF_DB, SPELL_DB, ENCHANT_DB, isTrinket, getSpellSortCategory } from '../gameData.js';

export function renderPlayerView(data, player, fightInfo) {
    const spec = data.spec;
    const specIcon = SPEC_ICONS[spec] || SPEC_ICONS[player.subType] || 'inv_misc_questionmark';
    const className = player.subType;
    const fightId = state.selectedFightId;
    const isOverall = (fightId === 'overall');
    const totalFights = Math.max(1, data.combatantInfos.length);

    // Fight title
    let fightTitle = 'Overall';
    if (fightInfo) {
        const duration = fightInfo.endTime - fightInfo.startTime;
        fightTitle = `${fightInfo.name} — ${formatDuration(duration)}`;
    }

    // === BUFFS ===
    let standardBuffHtmls = [];
    let weaponBuffHtmls = [];

    const usedBuffs = Object.keys(BUFF_DB).filter(id =>
        BUFF_DB[id].category !== 3 && BUFF_DB[id].category !== 'seal' && (data.combatantInfos.some(auras => auras.includes(parseInt(id))) || data.itemCasts[id])
    ).sort((a, b) => (BUFF_DB[a].order ?? 99) - (BUFF_DB[b].order ?? 99));
    
    usedBuffs.forEach(id => {
        const isConsumableCast = BUFF_DB[id].category === 5 || BUFF_DB[id].order === 70;
        let ratioDisplay = '';
        const ciCount = data.combatantInfos.filter(auras => auras.includes(parseInt(id))).length;

        if (isConsumableCast) {
            let casts = data.itemCasts[id] || 0;
            let pre = data.prePots[id] || 0;
            let totalUses = casts + pre;
            if (totalUses === 0) return;
            ratioDisplay = `<span class="buff-ratio">x${totalUses}</span>`;
        } else {
            ratioDisplay = `<span class="buff-ratio">${ciCount}${isOverall && totalFights > 1 ? `/${totalFights}` : ''}</span>`;
        }

        standardBuffHtmls.push(`<div class="buff-item" title="${BUFF_DB[id].name}"><img class="buff-icon" src="/api/icon/${BUFF_DB[id].icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'"><span class="buff-name">${BUFF_DB[id].name}</span>${ratioDisplay}</div>`);
    });

    // Weapon enchant buffs
    const weaponBuffsAggregated = {};
    let totalExpectedWeapons = 0;
    data.tempEnchants.forEach(info => {
        totalExpectedWeapons += info.weapons;
        info.enchants.forEach(eId => {
            if (ENCHANT_DB && ENCHANT_DB[eId]) {
                let enchName = ENCHANT_DB[eId].name;
                if (!weaponBuffsAggregated[enchName]) weaponBuffsAggregated[enchName] = { count: 0, icon: ENCHANT_DB[eId].icon || 'inv_misc_questionmark' };
                weaponBuffsAggregated[enchName].count += 1;
            }
        });
    });
    
    Object.entries(weaponBuffsAggregated).forEach(([enchName, d]) => {
        let ratioHtml = `<span class="buff-ratio">${d.count}${isOverall || totalExpectedWeapons > 1 ? `/${totalExpectedWeapons}` : ''}</span>`;
        weaponBuffHtmls.push(`<div class="buff-item" title="${enchName} (Weapon)"><img class="buff-icon weapon-enchant" src="/api/icon/${d.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'"><span class="buff-name">${enchName} (Weapon)</span>${ratioHtml}</div>`);
    });

    let allBuffHtmls = [...standardBuffHtmls, ...weaponBuffHtmls];
    let buffsHtml = allBuffHtmls.length === 0
        ? '<span class="no-buffs">NO BUFFS</span>'
        : allBuffHtmls.join('');

    // === SPELLS ===
    const groupedSpells = {};
    Object.entries(data.spells)
        .filter(([spellId]) => SPELL_DB && SPELL_DB[spellId])
        .forEach(([spellId, sData]) => {
            const sInfo = SPELL_DB[spellId];
            // Interrupts shown in Abilities get "(kick)" appended so they're clearly labeled
            const name = sInfo.isInterrupt ? sInfo.name + ' (kick)' : sInfo.name;
            if (!groupedSpells[name]) {
                groupedSpells[name] = {
                    name: name,
                    icon: sInfo.icon,
                    category: sInfo.category || 2,
                    count: 0,
                    interrupts: 0,
                    isInterrupt: !!sInfo.isInterrupt,
                    damage: 0,
                    spellId: spellId
                };
            }
            groupedSpells[name].count += sData.count;
            groupedSpells[name].interrupts = (groupedSpells[name].interrupts || 0) + (sData.interrupts || 0);
            groupedSpells[name].damage += sData.damage;
        });

    // Also include trinkets that only logged as an aura (like Abacus)
    Object.entries(data.timelineEvents || {})
        .filter(([spellId]) => BUFF_DB && BUFF_DB[spellId] && isTrinket && isTrinket(BUFF_DB[spellId].name))
        .forEach(([spellId, auraData]) => {
            const count = auraData.length;
            if (count > 0) {
                 const name = BUFF_DB[spellId].name;
                 if (!groupedSpells[name]) {
                     groupedSpells[name] = {
                         name: name,
                         icon: BUFF_DB[spellId].icon,
                         category: SPELL_DB?.[spellId]?.category || 1, // trinkets typically 1
                         count: 0,
                         damage: 0,
                         spellId: spellId
                     };
                 }
                 // Avoid double-counting if it also logged a cast, just take the max
                 groupedSpells[name].count = Math.max(groupedSpells[name].count, count);
            }
        });

    let spellListHtml = Object.values(groupedSpells)
        .sort((a, b) => {
            const catA = getSpellSortCategory ? getSpellSortCategory(a.name, a.spellId) : a.category;
            const catB = getSpellSortCategory ? getSpellSortCategory(b.name, b.spellId) : b.category;
            if (catA !== catB) return catA - catB;
            return a.name.localeCompare(b.name);
        })
        .map(spell => {
            let dmgText = spell.damage > 0 ? (spell.damage >= 1000 ? (spell.damage / 1000).toFixed(1) + 'k' : spell.damage) : '';
            let countHtml = `<span class="spell-count">x${Math.max(1, spell.count)}</span>`;
            if (spell.isInterrupt) {
                countHtml = `<span class="spell-count" title="${spell.interrupts || 0} successful interrupts out of ${spell.count} casts">x${spell.count} <span style="color: #69ccf0; font-weight: 700; font-size: 0.85em;">(${spell.interrupts || 0} cuts)</span></span>`;
            }
            return `<div class="spell-item" title="${spell.name}">
                <img class="spell-icon" src="/api/icon/${spell.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
                <span class="spell-name">${spell.name}</span>
                ${countHtml}
                ${spell.damage > 0 ? `<span class="spell-damage">${dmgText}</span>` : ''}
            </div>`;
        }).join('');

    // === GEAR BUTTON ===
    const safeName = player.name.replace(/'/g, "\\'");
    let gearBtnHtml = `<button class="inspect-btn" onclick="window.toggleGearInline('${safeName}', '${fightId}', '${className}', '${spec}')">🔍 Inspect Gear</button>`;

    // === TIMELINE BUTTON ===
    if (!state.timelineDB[fightId]) state.timelineDB[fightId] = {};
    state.timelineDB[fightId][player.name] = data.timelineEvents;

    let timelineBtnHtml = '';
    if (!isOverall) {
        timelineBtnHtml = `<button class="inspect-btn timeline-btn" onclick="window.toggleTimelineInline('${safeName}', '${fightId}')">⏱️ Timeline</button>`;
    }

    // === CASTS/UPTIME BUTTON ===
    if (!state.castsDebuffDB) state.castsDebuffDB = {};
    if (!state.castsDebuffDB[fightId]) state.castsDebuffDB[fightId] = {};
    state.castsDebuffDB[fightId][player.name] = { castCounts: data.castCounts, debuffTimeline: data.debuffTimeline, targetLifespans: data.targetLifespans };

    const hasCastData = data.castCounts && Object.keys(data.castCounts).length > 0;
    const hasDebuffData = data.debuffTimeline && Object.keys(data.debuffTimeline).length > 0;
    let castsBtnHtml = '';
    if (!isOverall || hasCastData || hasDebuffData) {
        castsBtnHtml = `<button class="inspect-btn casts-btn" onclick="window.toggleCastsDebuffInline('${safeName}', '${fightId}')">🎯 Casts/Uptime</button>`;
    }

    // === DEATHS & RESS (chronological) ===
    let eventsHtml = '';
    if (isOverall) {
        if (data.deaths && data.deaths.length > 0) {
            eventsHtml += `<span class="event-pill event-death" style="color:#ff5252; margin-left: 10px; font-size: 0.85rem; font-weight: bold; background: rgba(255,82,82,0.1); padding: 2px 6px; border-radius: 4px;">✕ ${data.deaths.length} Deaths</span>`;
        }
        if (data.rebirths && data.rebirths.length > 0) {
            const resByType = {};
            data.rebirths.forEach(r => {
                if (!resByType[r.type]) resByType[r.type] = { count: 0, icon: r.icon };
                resByType[r.type].count++;
            });
            Object.entries(resByType).forEach(([type, info]) => {
                eventsHtml += `<span class="event-pill event-ress" style="color:#4caf50; margin-left: 10px; font-size: 0.85rem; font-weight: bold; background: rgba(76,175,80,0.1); padding: 2px 6px; border-radius: 4px;">${info.icon} ${info.count} ${type}</span>`;
            });
        }
    } else {
        let allEvents = [];
        if (data.deaths) {
            data.deaths.forEach(d => {
                allEvents.push({ timestamp: d, type: 'death' });
            });
        }
        if (data.rebirths) {
            data.rebirths.forEach(r => {
                allEvents.push({ timestamp: r.timestamp, type: 'res', resType: r.type, icon: r.icon });
            });
        }
        allEvents.sort((a, b) => a.timestamp - b.timestamp);
        allEvents.forEach(ev => {
            let relTime = fightInfo ? ev.timestamp - fightInfo.startTime : 0;
            if (ev.type === 'death') {
                eventsHtml += `<span class="event-pill event-death" style="color:#ff5252; font-size: 0.8rem; font-weight: bold; background: rgba(255,82,82,0.1); padding: 2px 6px; border-radius: 4px;">✕ Dead at ${formatDuration(Math.max(0, relTime))}</span>`;
            } else {
                eventsHtml += `<span class="event-pill event-ress" style="color:#4caf50; font-size: 0.8rem; font-weight: bold; background: rgba(76,175,80,0.1); padding: 2px 6px; border-radius: 4px;">${ev.icon} ${ev.resType} at ${formatDuration(Math.max(0, relTime))}</span>`;
            }
        });
    }

    // === BOSS ICON ===
    let bossSlug = (fightInfo && fightInfo.name) ? fightInfo.name.trim().replace(/'/g, '').replace(/[\s,-]+/g, '-').toLowerCase() : '';
    // Removes trailing hyphens if any
    bossSlug = bossSlug.replace(/-+$/, '');
    
    const cacheBuster = Date.now();
    let bossIconHtml = isOverall ? '' : `<img src="/images/targets/t-${bossSlug}.png?v=${cacheBuster}" style="height: 40px; vertical-align: middle; margin-right: 12px; border-radius: 6px;" onerror="this.src='/assets/icons/inv_misc_questionmark.jpg'; this.onerror=null;">`;

    return `
        <div class="player-view">
            <div class="player-view-header">
                <div style="position: absolute; left: -85px; top: 16px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; color: #ddd; font-size: 1rem; font-weight: bold; padding: 6px 12px; background: rgba(255,255,255,0.08); border-radius: 6px; user-select: none; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'" onclick="if(window.selectPlayer) window.selectPlayer('__ALL__')" title="Back to All Players">
                    <span style="margin-right: 6px; font-size: 1.2rem; line-height: 1;">&#8592;</span> All
                </div>
                <img src="/api/icon/${specIcon}.jpg" class="player-view-spec-icon" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
                <span class="player-view-name ${className}-color">${player.name}</span>
                <div class="player-view-right">
                    <div class="player-view-fight-line">${bossIconHtml}${fightTitle} <span id="dpsPlaceholder-${fightId}-${player.id}" style="color:#f4b400; margin-left: 15px; font-size:0.9rem;">(Loading DPS...)</span></div>
                    ${eventsHtml ? `<div class="player-view-events">${eventsHtml}</div>` : ''}
                </div>
            </div>

            <div class="player-view-section">
                <div class="player-view-section-title">Consumables & Buffs</div>
                <div class="buff-bar">${buffsHtml}</div>
            </div>

            <div class="player-view-section">
                <div class="player-view-section-title">Abilities</div>
                <div class="spell-grid">${spellListHtml || '<span class="no-data">No tracked abilities used</span>'}</div>
            </div>

            <div class="player-view-actions">
                ${gearBtnHtml}
                ${timelineBtnHtml}
                ${castsBtnHtml}
            </div>
            <div id="inlineGearContainer" style="display:none; margin-top: 10px;"></div>
            <div id="inlineTimelineContainer" style="display:none; margin-top: 10px;"></div>
            <div id="inlineCastsContainer" style="display:none; margin-top: 10px;"></div>
        </div>
    `;
}
