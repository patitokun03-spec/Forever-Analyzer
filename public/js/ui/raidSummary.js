import { state } from '../state.js';
import { formatDuration } from '../utils.js';
import { processPlayerData } from '../processor/index.js';
import { processRaidDebuffsAndBuffs } from '../processor/raidDebuffTracker.js';
import { CLASSES, CLASS_COLORS, SPEC_ICONS, SPEC_ROLES, BUFF_DB, SPELL_DB, ENCHANT_DB, isTrinket, getSpellSortCategory, getPlayerRole } from '../gameData.js';

export function isPlayerInRole(filterRole, playerRole, playerClass, playerSpec) {
    if (!filterRole) return true;

    // Direct role match (e.g. 'Tank' === 'Tank', 'Melee DPS' === 'Melee DPS')
    if (playerRole === filterRole) return true;

    // Compatible aliases
    if (filterRole === 'Melee DPS' && (playerRole === 'Melee' || playerRole === 'Melee DPS')) return true;
    if (filterRole === 'Ranged DPS' && (playerRole === 'Ranged' || playerRole === 'Ranged DPS')) return true;

    // Feral Druid special case:
    // In Vanilla Classic / WoW Forever, Feral Druid encompasses both Bear Tank and Cat DPS.
    // Ensure Feral Druids match both 'Tank' and 'Melee DPS' filters.
    if (playerClass === 'Druid') {
        const isFeral = playerSpec === 'Druid-Feral' ||
                        playerRole === 'Melee' ||
                        playerRole === 'Melee DPS' ||
                        playerRole === 'Tank';
        if (isFeral && (filterRole === 'Tank' || filterRole === 'Melee DPS')) {
            return true;
        }
    }

    return false;
}

export function renderAllPlayersView(fightId, fightEvents, allActors, fightInfo) {
    const isOverall = (fightId === 'overall');

    // Fight title
    let fightTitle = 'Overall';
    if (fightInfo) {
        const duration = fightInfo.endTime - fightInfo.startTime;
        fightTitle = `${fightInfo.name} — ${formatDuration(duration)}`;
    }
    // Format boss slug for header
    let bossSlug = (fightInfo && fightInfo.name) ? fightInfo.name.trim().replace(/'/g, '').replace(/[\s,-]+/g, '-').toLowerCase() : '';
    bossSlug = bossSlug.replace(/-+$/, '');
    const cacheBuster = Date.now();
    let bossIconHtml = isOverall ? '' : `<img src="/images/targets/t-${bossSlug}.png?v=${cacheBuster}" style="height: 40px; vertical-align: middle; margin-right: 12px; border-radius: 6px;" onerror="this.src='/assets/icons/inv_misc_questionmark.jpg'; this.onerror=null;">`;

    // Calculate global max fights for the overall denominator
    let globalMaxFights = 1;
    if (isOverall) {
        const ciCounts = {};
        fightEvents.forEach(ev => {
            if (ev.type === 'combatantinfo') {
                ciCounts[ev.sourceID] = (ciCounts[ev.sourceID] || 0) + 1;
            }
        });
        const counts = Object.values(ciCounts);
        if (counts.length > 0) {
            globalMaxFights = Math.max(...counts);
        }
    }

    // Group players by class
    const playersByClass = {};
    CLASSES.forEach(cls => { playersByClass[cls] = []; });
    const sorted = [...allActors].sort((a, b) => {
        const ci = CLASSES.indexOf(a.subType) - CLASSES.indexOf(b.subType);
        if (ci !== 0) return ci;
        const specA = state.detectedSpecs[a.name] || a.subType;
        const specB = state.detectedSpecs[b.name] || b.subType;
        const si = specA.localeCompare(specB);
        if (si !== 0) return si;
        return a.name.localeCompare(b.name);
    });
    sorted.forEach(player => {
        if (playersByClass[player.subType]) {
            playersByClass[player.subType].push(player);
        }
    });

    // Filter chips
    let filterHtml = `<div class="all-view-class-filter">`;
    
    // "ALL" button
    window.clearAllViewFilters = function() {
        state.allViewRoleFilters.clear();
        state.allViewClassFilters.clear();
        window.renderMainContent();
        if (window.updateURL) window.updateURL();
    };
    const allActive = state.allViewRoleFilters.size === 0 && state.allViewClassFilters.size === 0;
    filterHtml += `<button class="all-view-class-chip ${allActive ? 'active' : ''}" style="border-color: #f4b400;" onclick="window.clearAllViewFilters()">ALL</button>`;
    
    filterHtml += `<div style="width: 1px; background: #333; margin: 0 10px;"></div>`;
    
    // Role filters
    const ROLES = ["Tank", "Healer", "Melee DPS", "Ranged DPS"];
    ROLES.forEach(role => {
        const isActive = state.allViewRoleFilters.has(role);
        const roleClass = role.replace(' ', '-') + '-chip';
        filterHtml += `<button class="all-view-class-chip role-chip ${roleClass} ${isActive ? 'active' : ''}" data-role="${role}" onclick="window.toggleAllViewFilter('role', '${role}')">${role.toUpperCase()}</button>`;
    });

    filterHtml += `<div style="width: 1px; background: #333; margin: 0 10px;"></div>`;

    // Class filters
    CLASSES.forEach(cls => {
        const players = playersByClass[cls];
        if (players.length === 0) return;
        const isActive = state.allViewClassFilters && state.allViewClassFilters.has(cls);
        filterHtml += `<button class="all-view-class-chip class-chip ${cls}-chip ${isActive ? 'active' : ''}" data-class="${cls}" onclick="window.toggleAllViewFilter('class', '${cls}')">
            ${cls.toUpperCase()} <span class="chip-count">${players.length}</span>
        </button>`;
    });
    filterHtml += `</div>`;

    const hasClassFilter = state.allViewClassFilters && state.allViewClassFilters.size > 0;
    const hasRoleFilter = state.allViewRoleFilters && state.allViewRoleFilters.size > 0;

    // Render each class section
    let sectionsHtml = '';
    CLASSES.forEach(cls => {
        const players = playersByClass[cls];
        if (players.length === 0) return;

        const classIcon = SPEC_ICONS[cls] || 'inv_misc_questionmark';
        let visiblePlayersInClass = 0;
        let cardsHtml = '';

        players.forEach(player => {
            const playerData = processPlayerData(fightId, fightEvents, player);
            const spec = playerData.spec;
            const role = getPlayerRole(spec, player.subType);

            const matchClass = !hasClassFilter || state.allViewClassFilters.has(cls);
            let matchRole = !hasRoleFilter;
            if (hasRoleFilter) {
                for (const filterRole of state.allViewRoleFilters) {
                    if (isPlayerInRole(filterRole, role, cls, spec)) {
                        matchRole = true;
                        break;
                    }
                }
            }

            const isVisible = matchClass && matchRole;
            if (isVisible) visiblePlayersInClass++;

            cardsHtml += renderAllPlayerCard(playerData, player, fightInfo, isOverall, globalMaxFights, role, isVisible);
        });

        const isSectionHidden = visiblePlayersInClass === 0 && (hasClassFilter || hasRoleFilter);

        sectionsHtml += `<div class="all-view-class-section ${isSectionHidden ? 'hidden-section' : ''}" data-class="${cls}" style="background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin-bottom: 26px;">`;
        sectionsHtml += `<div class="all-view-class-header" style="background: transparent !important; border: none !important; border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important; border-radius: 0 !important; box-shadow: none !important; padding: 0 0 6px 0 !important;">
            <img src="/api/icon/${classIcon}.jpg" class="all-view-class-icon" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
            <span class="${cls}-color">${cls}</span>
            <span class="all-view-class-count">${visiblePlayersInClass}</span>
        </div>`;

        sectionsHtml += `<div class="all-view-players-grid" style="background: transparent !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; padding: 0 !important;">`;
        sectionsHtml += cardsHtml;
        sectionsHtml += `</div></div>`;
    });

    // Compact boss debuffs summary for encounter
    let debuffsBarHtml = '';
    if (!isOverall && fightInfo) {
        const { bossDebuffs } = processRaidDebuffsAndBuffs(fightEvents, fightInfo, allActors);
        const activeDebuffs = Object.values(bossDebuffs).filter(d => d.applied);

        let debuffChipsHtml = '';
        if (activeDebuffs.length > 0) {
            activeDebuffs.forEach(d => {
                const uptimeColor = d.uptimePct >= 75 ? '#2ecc71' : (d.uptimePct >= 40 ? '#f39c12' : '#e74c3c');
                const sourcesStr = Object.keys(d.sources).join(', ') || 'Unknown';
                debuffChipsHtml += `
                    <div class="av-debuff-chip" title="${d.name}: ${d.uptimePct}% uptime (${d.count} applications by ${sourcesStr})">
                        <img src="/api/icon/${d.config.icon}.jpg" class="av-debuff-icon" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
                        <span class="av-debuff-name">${d.name}</span>
                        <span class="av-debuff-uptime" style="color: ${uptimeColor};">${d.uptimePct}%</span>
                    </div>
                `;
            });
        } else {
            debuffChipsHtml = `<span class="av-debuff-empty">No tracked debuffs detected on boss</span>`;
        }

        debuffsBarHtml = `
            <div class="all-view-debuffs-bar">
                <div class="all-view-debuffs-title">
                    <span>🛡️ Active Boss Debuffs</span>
                </div>
                <div class="all-view-debuffs-list">
                    ${debuffChipsHtml}
                </div>
            </div>
        `;
    }

    return `
        <div class="all-view">
            <div class="all-view-header">
                <img src="/images/raid_summary.jpg" class="all-view-crest-img" alt="Raid Summary">
                <span class="all-view-title">Raid Summary</span>
                <span class="all-view-fight">${bossIconHtml}${fightTitle}</span>
            </div>
            ${filterHtml}
            ${debuffsBarHtml}
            ${sectionsHtml}
        </div>
    `;
}

function renderAllPlayerCard(data, player, fightInfo, isOverall, globalMaxFights = 1, role = 'Unknown', isVisible = true) {
    const spec = data.spec;
    const specIcon = SPEC_ICONS[spec] || SPEC_ICONS[player.subType] || 'inv_misc_questionmark';
    const className = player.subType;
    const fightId = state.selectedFightId;
    const totalFights = isOverall ? globalMaxFights : Math.max(1, data.combatantInfos.length);

    // Compact buff icons (no names)
    const usedBuffs = Object.keys(BUFF_DB).filter(id =>
        BUFF_DB[id].category !== 3 && BUFF_DB[id].category !== 'seal' && (data.combatantInfos.some(auras => auras.includes(parseInt(id))) || data.itemCasts[id])
    ).sort((a, b) => (BUFF_DB[a].order ?? 99) - (BUFF_DB[b].order ?? 99));
    let buffsHtml = '';
    usedBuffs.forEach(id => {
        const isConsumableCast = BUFF_DB[id].category === 5 || BUFF_DB[id].order === 70;
        let ratioText = '';
        const ciCount = data.combatantInfos.filter(auras => auras.includes(parseInt(id))).length;

        if (isConsumableCast) {
            let casts = data.itemCasts[id] || 0;
            let pre = data.prePots[id] || 0;
            let totalUses = casts + pre;
            if (totalUses === 0) return;
            ratioText = `x${totalUses}`;
        } else {
            ratioText = `${ciCount}${isOverall && totalFights > 1 ? '/' + totalFights : ''}`;
        }

        buffsHtml += `<div class="av-buff" title="${BUFF_DB[id].name}">
            <img src="/api/icon/${BUFF_DB[id].icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
            <span class="av-ratio">${ratioText}</span>
        </div>`;
    });

    // Weapon enchant buffs (compact)
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
        let ratioText = `${d.count}${isOverall || totalExpectedWeapons > 1 ? '/' + totalExpectedWeapons : ''}`;
        buffsHtml += `<div class="av-buff av-weapon" title="${enchName} (Weapon)">
            <img src="/api/icon/${d.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
            <span class="av-ratio">${ratioText}</span>
        </div>`;
    });

    // Compact spell/CD icons (no names)
    let spellsHtml = '';
    const groupedSpellsAll = {};
    Object.entries(data.spells)
        .filter(([spellId]) => SPELL_DB && SPELL_DB[spellId])
        .forEach(([spellId, sData]) => {
            const sInfo = SPELL_DB[spellId];
            const name = sInfo.name;
            if (!groupedSpellsAll[name]) {
                groupedSpellsAll[name] = {
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
            groupedSpellsAll[name].count += sData.count;
            groupedSpellsAll[name].interrupts = (groupedSpellsAll[name].interrupts || 0) + (sData.interrupts || 0);
            groupedSpellsAll[name].damage += sData.damage;
        });

    Object.values(groupedSpellsAll)
        .sort((a, b) => a.category - b.category)
        .forEach(spell => {
            let dmgText = spell.damage > 0 ? (spell.damage >= 1000 ? (spell.damage / 1000).toFixed(1) + 'k' : spell.damage) : '';
            let countHtml = `<span class="av-count">x${Math.max(1, spell.count)}</span>`;
            let tooltip = spell.name;
            if (spell.isInterrupt) {
                tooltip = `${spell.name}: ${spell.interrupts || 0} cuts / ${spell.count} casts`;
                countHtml = `<span class="av-count" style="color: #69ccf0; font-weight: 800;">${spell.interrupts || 0}/${spell.count}</span>`;
            }
            spellsHtml += `<div class="av-spell" title="${tooltip}">
                <img src="/api/icon/${spell.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
                ${countHtml}
                ${dmgText ? `<span class="av-dmg">${dmgText}</span>` : ''}
            </div>`;
        });

    // Deaths & Ress (compact)
    let eventsHtml = '';
    if (isOverall) {
        if (data.deaths && data.deaths.length > 0) {
            eventsHtml += `<span class="av-event av-death">✕${data.deaths.length}</span>`;
        }
        if (data.rebirths && data.rebirths.length > 0) {
            const resByType = {};
            data.rebirths.forEach(r => {
                if (!resByType[r.type]) resByType[r.type] = { count: 0, icon: r.icon };
                resByType[r.type].count++;
            });
            Object.entries(resByType).forEach(([type, info]) => {
                eventsHtml += `<span class="av-event av-ress">${info.icon}${info.count}</span>`;
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
                eventsHtml += `<span class="av-event av-death">✕${formatDuration(Math.max(0, relTime))}</span>`;
            } else {
                eventsHtml += `<span class="av-event av-ress">${ev.icon}${formatDuration(Math.max(0, relTime))}</span>`;
            }
        });
    }

    let noBuffsHtml = (!buffsHtml) ? '<span class="av-no-data">No buffs</span>' : '';
    let noSpellsHtml = (!spellsHtml) ? '<span class="av-no-data">—</span>' : '';

    return `
        <div class="all-view-player-card" data-class="${className}" data-role="${role}" data-spec="${spec}" style="${isVisible ? '' : 'display: none;'}">
            <div class="av-player-header">
                <img src="/api/icon/${specIcon}.jpg" class="av-spec-icon" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
                <span class="av-player-name ${className}-color" style="cursor: pointer;" onclick="if(window.selectPlayer) window.selectPlayer('${player.name}')" title="Click to view details for ${player.name}">${player.name}</span>
                ${eventsHtml}
            </div>
            <div class="av-sections">
                <div class="av-section">
                    <div class="av-section-label">Consumables</div>
                    <div class="av-buff-grid">${buffsHtml || noBuffsHtml}</div>
                </div>
                <div class="av-section">
                    <div class="av-section-label">CDs</div>
                    <div class="av-spell-grid">${spellsHtml || noSpellsHtml}</div>
                </div>
            </div>
        </div>
    `;
}

export function toggleAllViewFilter(type, value) {
    if (type === 'class') {
        if (state.allViewClassFilters.has(value)) {
            state.allViewClassFilters.delete(value);
        } else {
            state.allViewClassFilters.add(value);
        }
    } else if (type === 'role') {
        if (state.allViewRoleFilters.has(value)) {
            state.allViewRoleFilters.delete(value);
        } else {
            state.allViewRoleFilters.add(value);
        }
    }

    // Apply visual active state to chips
    const allActive = state.allViewRoleFilters.size === 0 && state.allViewClassFilters.size === 0;
    const allBtn = document.querySelector('.all-view-class-chip[onclick="window.clearAllViewFilters()"]');
    if (allBtn) {
        allBtn.classList.toggle('active', allActive);
    }

    document.querySelectorAll('.all-view-class-chip.class-chip').forEach(chip => {
        chip.classList.toggle('active', state.allViewClassFilters.has(chip.dataset.class));
    });
    document.querySelectorAll('.all-view-class-chip.role-chip').forEach(chip => {
        chip.classList.toggle('active', state.allViewRoleFilters.has(chip.dataset.role));
    });

    // Show/hide logic
    const hasClassFilter = state.allViewClassFilters.size > 0;
    const hasRoleFilter = state.allViewRoleFilters.size > 0;

    document.querySelectorAll('.all-view-class-section').forEach(section => {
        let visiblePlayersInClass = 0;
        const sClass = section.dataset.class;
        
        section.querySelectorAll('.all-view-player-card').forEach(card => {
            const pClass = card.dataset.class || sClass;
            const pRole = card.dataset.role;
            const pSpec = card.dataset.spec || '';
            
            const matchClass = !hasClassFilter || state.allViewClassFilters.has(pClass);
            let matchRole = !hasRoleFilter;
            if (hasRoleFilter) {
                for (const filterRole of state.allViewRoleFilters) {
                    if (isPlayerInRole(filterRole, pRole, pClass, pSpec)) {
                        matchRole = true;
                        break;
                    }
                }
            }
            
            if (matchClass && matchRole) {
                card.style.display = '';
                visiblePlayersInClass++;
            } else {
                card.style.display = 'none';
            }
        });

        // Hide whole section if 0 players visible
        if (visiblePlayersInClass === 0 && (hasClassFilter || hasRoleFilter)) {
            section.classList.add('hidden-section');
        } else {
            section.classList.remove('hidden-section');
            // update count
            const countEl = section.querySelector('.all-view-class-count');
            if (countEl) countEl.innerText = visiblePlayersInClass;
        }
    });

    if (window.updateURL) window.updateURL();
}
