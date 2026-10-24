// public/js/ui/castsDebuffPanel.js
// Casts & Debuff Panel component (cast counts with low-rank warnings, per-target debuff timeline, and raid support)

import { state } from '../state.js';
import { formatDuration } from '../utils.js';
import { processRaidDebuffsAndBuffs } from '../processor/raidDebuffTracker.js';
import { renderRaidSupportHtml } from './raidSupportPanel.js';

window.switchCastsSubtab = function(tabName) {
    const personal = document.getElementById('cdPersonalSection');
    const raidSupport = document.getElementById('cdRaidSupportSection');
    const btnP = document.getElementById('btnTabPersonal');
    const btnR = document.getElementById('btnTabRaidSupport');
    if (!personal || !raidSupport) return;
    if (tabName === 'personal') {
        personal.style.display = 'block';
        raidSupport.style.display = 'none';
        if (btnP) btnP.classList.add('active');
        if (btnR) btnR.classList.remove('active');
    } else {
        personal.style.display = 'none';
        raidSupport.style.display = 'block';
        if (btnR) btnR.classList.add('active');
        if (btnP) btnP.classList.remove('active');
    }
};

export function toggleCastsDebuffInline(playerName, fightId) {
    const container = document.getElementById('inlineCastsContainer');
    if (container.style.display === 'block') {
        container.style.display = 'none';
        state.openPanels.casts = false;
        return;
    }

    // Retrieve data stored by mainContent
    const castData = (state.castsDebuffDB && state.castsDebuffDB[fightId] && state.castsDebuffDB[fightId][playerName])
        ? state.castsDebuffDB[fightId][playerName]
        : null;

    const isOverall = (fightId === 'overall' || fightId == null);
    const fightInfo = (!isOverall && state.currentReport && state.currentReport.fights)
        ? state.currentReport.fights.find(f => f.id == fightId || f.id == parseInt(fightId))
        : null;
    const durationMs = fightInfo ? (fightInfo.endTime - fightInfo.startTime) : 0;

    // Filter events for raid support
    let fightEvents = state.currentEvents || [];
    if (!isOverall && fightInfo) {
        fightEvents = fightEvents.filter(ev => ev.timestamp >= (fightInfo.startTime - 15000) && ev.timestamp <= (fightInfo.endTime + 5000));
    }

    const player = (state.currentActors || []).find(a => a.name === playerName);
    const raidSupportData = processRaidDebuffsAndBuffs(fightEvents, fightInfo, state.currentActors || [], player);
    const raidSupportHtml = renderRaidSupportHtml(raidSupportData);

    const hasPersonalData = castData && (Object.keys(castData.castCounts).length > 0 || Object.keys(castData.debuffTimeline).length > 0);

    let html = '<div class="cd-wrapper">';

    // Subtabs: Personal Uptime vs Raid Support
    html += `
        <div class="cd-subtabs">
            <button class="cd-subtab-btn active" id="btnTabPersonal" onclick="window.switchCastsSubtab('personal')">🎯 Personal Uptime</button>
            <button class="cd-subtab-btn" id="btnTabRaidSupport" onclick="window.switchCastsSubtab('raidSupport')">🛡️ Raid Support</button>
        </div>
        <div id="cdPersonalSection">
    `;

    if (!hasPersonalData) {
        html += '<div class="cd-empty">No personal rotational casts or debuffs tracked for this spec. Check the <b>Raid Support</b> tab above to see boss debuffs and raid buffs!</div>';
    }

    // ── Section 1: Cast Counts (always shown) ────────────────────────────────
    const castEntries = (castData && castData.castCounts) ? Object.entries(castData.castCounts) : [];
    if (castEntries.length > 0) {
        html += '<div class="cd-section">';
        html += `<div class="cd-section-title">⚔️ Cast Counts${isOverall ? ' <span class="cd-overall-label">(Overall)</span>' : ''}</div>`;
        html += '<div class="cd-spells-list">';
        castEntries.sort((a, b) => b[1].count - a[1].count).forEach(([name, data]) => {
            const lowRank = data.lowRankCount && data.lowRankCount > 0;
            const lowRankBadge = lowRank
                ? `<span class="cd-lowrank-badge" title="⚠️ ${data.lowRankCount} cast${data.lowRankCount > 1 ? 's' : ''} were sub-optimal rank!">⚠️ ${data.lowRankCount}x low rank</span>`
                : '';
            html += `
                <div class="spell-item${lowRank ? ' cd-cast-warn' : ''}">
                    <img class="spell-icon" src="/api/icon/${data.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'" title="${name}">
                    <span class="spell-name">${name}</span>
                    <span class="spell-count">×${data.count}</span>
                    ${lowRankBadge}
                </div>`;
        });

        html += '</div></div>';
    }

    // ── Section 2: Debuff Timeline (per-fight only) ──────────────────────────
    const debuffEntries = (castData && castData.debuffTimeline) ? Object.entries(castData.debuffTimeline) : [];

    if (isOverall) {
        if (debuffEntries.length > 0 && state.currentReport && state.currentReport.fights) {
            const allFights = state.currentReport.fights;
            const totalCombatMs = allFights.reduce((sum, f) => sum + (f.endTime - f.startTime), 0);

            if (totalCombatMs > 0) {
                const durationDebuffs = debuffEntries.filter(([, dl]) => !dl.isCastPoint && !dl.hideFromOverall);

                if (durationDebuffs.length > 0) {
                    const validRows = [];
                    durationDebuffs
                        .sort((a, b) => {
                            const aOrder = a[1].sortOrder != null ? a[1].sortOrder : 999;
                            const bOrder = b[1].sortOrder != null ? b[1].sortOrder : 999;
                            return aOrder - bOrder;
                        })
                        .forEach(([debuffName, dlData]) => {
                            let allSegs = [];
                            Object.values(dlData.targets).forEach(segs => {
                                allSegs = allSegs.concat(segs);
                            });
                            if (allSegs.length === 0) return;

                            allSegs.sort((a, b) => a.start - b.start);
                            const merged = [];
                            for (const seg of allSegs) {
                                if (!merged.length || seg.start > merged[merged.length - 1].end) {
                                    merged.push({ start: seg.start, end: seg.end });
                                } else {
                                    merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, seg.end);
                                }
                            }

                            let coveredMs = 0;
                            merged.forEach(seg => {
                                allFights.forEach(fight => {
                                    const start = Math.max(seg.start, fight.startTime);
                                    const end   = Math.min(seg.end,   fight.endTime);
                                    if (end > start) coveredMs += (end - start);
                                });
                            });

                            const uptime = Math.min(100, Math.round((coveredMs / totalCombatMs) * 100));
                            if (uptime > 0) {
                                validRows.push({ debuffName, dlData, uptime });
                            }
                        });

                    if (validRows.length > 0) {
                        html += '<div class="cd-section">';
                        html += '<div class="cd-section-title">🩸 Uptime <span class="cd-overall-label">(Overall — all fights)</span></div>';
                        html += '<div class="cd-overall-uptime-list">';

                        validRows.forEach(({ debuffName, dlData, uptime }) => {
                            const color = dlData.color || '#f4b400';
                            html += `
                            <div class="cd-overall-uptime-row">
                                <div class="cd-overall-uptime-left">
                                    <img class="cd-debuff-icon" src="/api/icon/${dlData.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'" title="${debuffName}">
                                    <span class="cd-debuff-name" style="color:${color};">${debuffName}</span>
                                </div>
                                <div class="cd-overall-uptime-bar-wrap">
                                    <div class="cd-overall-uptime-track">
                                        <div class="cd-overall-uptime-fill" style="width:${uptime}%; background:${color}; box-shadow: 0 0 6px ${color}40;"></div>
                                    </div>
                                    <span class="cd-overall-uptime-pct" style="color:${color};">${uptime}%</span>
                                </div>
                            </div>`;
                        });

                        html += '</div></div>';
                    }
                }
            }
        }
    } else {
        const validDebuffs = debuffEntries.filter(([, dlData]) => {
            return Object.entries(dlData.targets).some(([, segs]) => segs.length > 0);
        });

        if (validDebuffs.length > 0 && durationMs > 0) {
            html += '<div class="cd-section">';
            html += '<div class="cd-section-title">🩸 Uptime</div>';
            html += '<div class="cd-debuff-block">';

            validDebuffs
                .sort((a, b) => {
                    const aTop = a[1].alwaysOnTop ? 0 : 1;
                    const bTop = b[1].alwaysOnTop ? 0 : 1;
                    if (aTop !== bTop) return aTop - bTop;
                    const aOrder = a[1].sortOrder != null ? a[1].sortOrder : 999;
                    const bOrder = b[1].sortOrder != null ? b[1].sortOrder : 999;
                    return aOrder - bOrder;
                })
                .forEach(([debuffName, dlData]) => {
            const color = dlData.color || '#f4b400';
            const isPoint = dlData.isCastPoint;
            const targets = Object.entries(dlData.targets).filter(([, segs]) => segs.length > 0);
            if (targets.length === 0) return;

            let headerLabel = '';
            if (isPoint) {
                const totalCasts = targets.reduce((sum, [, segs]) => sum + segs.length, 0);
                headerLabel = `${totalCasts}×`;
            } else {
                let bestUptime = 0;
                targets.forEach(([tName, segs]) => {
                    let covered = 0;
                    segs.forEach(s => {
                        const relS = Math.max(0, s.start - fightInfo.startTime);
                        const relE = Math.min(durationMs, s.end - fightInfo.startTime);
                        if (relE > relS) covered += (relE - relS);
                    });
                    
                    let targetDur = durationMs;
                    if (castData.targetLifespans && castData.targetLifespans[tName]) {
                        const tLife = castData.targetLifespans[tName];
                        let aliveMs = 0;
                        let lastAliveStart = Math.max(fightInfo.startTime, tLife.firstSeen);
                        let isAlive = true;
                        
                        let events = [];
                        if (tLife.deaths) tLife.deaths.forEach(d => events.push({time: d, type: 'death'}));
                        if (tLife.rebirths) tLife.rebirths.forEach(r => events.push({time: r, type: 'rebirth'}));
                        events.sort((a, b) => a.time - b.time);
                        
                        events.forEach(ev => {
                            if (ev.time > fightInfo.endTime + 5000) return;
                            if (ev.time < lastAliveStart) {
                                if (ev.type === 'death') isAlive = false;
                                else isAlive = true;
                                return;
                            }
                            if (ev.type === 'death' && isAlive) {
                                aliveMs += (ev.time - lastAliveStart);
                                isAlive = false;
                            } else if (ev.type === 'rebirth' && !isAlive) {
                                lastAliveStart = ev.time;
                                isAlive = true;
                            }
                        });
                        
                        if (isAlive) {
                            aliveMs += (fightInfo.endTime - lastAliveStart);
                        }
                        targetDur = aliveMs > 0 ? aliveMs : durationMs;
                    }

                    const pct = Math.round((covered / targetDur) * 100);
                    if (pct > bestUptime) bestUptime = pct;
                });
                headerLabel = `${bestUptime}%`;
            }

            html += `
            <div class="cd-debuff-row">
                <div class="cd-debuff-header">
                    <img class="cd-debuff-icon" src="/api/icon/${dlData.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
                    <span class="cd-debuff-name" style="color: ${color};">${debuffName}</span>
                    <span class="cd-debuff-uptime" title="${isPoint ? 'Total casts' : 'Best uptime across targets'}">${headerLabel}</span>
                </div>`;

            targets.forEach(([targetName, segs]) => {
                let rightLabel = '';
                if (isPoint) {
                    rightLabel = `${segs.length}×`;
                } else {
                    let covered = 0;
                    segs.forEach(s => {
                        const relS = Math.max(0, s.start - fightInfo.startTime);
                        const relE = Math.min(durationMs, s.end - fightInfo.startTime);
                        if (relE > relS) covered += (relE - relS);
                    });
                    
                    let targetDur = durationMs;
                    if (castData.targetLifespans && castData.targetLifespans[targetName]) {
                        const tLife = castData.targetLifespans[targetName];
                        let aliveMs = 0;
                        let lastAliveStart = Math.max(fightInfo.startTime, tLife.firstSeen);
                        let isAlive = true;
                        
                        let events = [];
                        if (tLife.deaths) tLife.deaths.forEach(d => events.push({time: d, type: 'death'}));
                        if (tLife.rebirths) tLife.rebirths.forEach(r => events.push({time: r, type: 'rebirth'}));
                        events.sort((a, b) => a.time - b.time);
                        
                        events.forEach(ev => {
                            if (ev.time > fightInfo.endTime + 5000) return;
                            if (ev.time < lastAliveStart) {
                                if (ev.type === 'death') isAlive = false;
                                else isAlive = true;
                                return;
                            }
                            if (ev.type === 'death' && isAlive) {
                                aliveMs += (ev.time - lastAliveStart);
                                isAlive = false;
                            } else if (ev.type === 'rebirth' && !isAlive) {
                                lastAliveStart = ev.time;
                                isAlive = true;
                            }
                        });
                        
                        if (isAlive) {
                            aliveMs += (fightInfo.endTime - lastAliveStart);
                        }
                        targetDur = aliveMs > 0 ? aliveMs : durationMs;
                    }

                    rightLabel = `${Math.round((covered / targetDur) * 100)}%`;
                }

                html += `
                <div class="cd-debuff-target-row">
                    <div class="cd-debuff-target-name" title="${targetName}">${targetName}</div>
                    <div class="cd-debuff-track">`;

                if (castData.targetLifespans && castData.targetLifespans[targetName]) {
                    const tLife = castData.targetLifespans[targetName];
                    let events = [];
                    if (tLife.deaths) tLife.deaths.forEach(d => events.push({time: d, type: 'death'}));
                    if (tLife.rebirths) tLife.rebirths.forEach(r => events.push({time: r, type: 'rebirth'}));
                    events.sort((a, b) => a.time - b.time);
                    
                    let isDead = false;
                    let deadStart = 0;
                    events.forEach(ev => {
                        const relT = ev.time - fightInfo.startTime;
                        if (relT < 0 || relT > durationMs) return;
                        
                        if (ev.type === 'death' && !isDead) {
                            isDead = true;
                            deadStart = relT;
                            const leftPct = (relT / durationMs) * 100;
                            html += `<div class="cd-debuff-death-marker" title="Died at ${formatDuration(relT)}" style="left:${leftPct.toFixed(2)}%;"></div>`;
                        } else if (ev.type === 'rebirth' && isDead) {
                            isDead = false;
                            const deadWidth = ((relT - deadStart) / durationMs) * 100;
                            const deadLeft = (deadStart / durationMs) * 100;
                            html += `<div class="cd-debuff-dead-zone" style="left:${deadLeft.toFixed(2)}%; width:${deadWidth.toFixed(2)}%;"></div>`;
                            
                            const leftPct = (relT / durationMs) * 100;
                            html += `<div class="cd-debuff-ress-marker" title="Resurrected at ${formatDuration(relT)}" style="left:${leftPct.toFixed(2)}%;"></div>`;
                        }
                    });
                    
                    if (isDead) {
                        const deadWidth = ((durationMs - deadStart) / durationMs) * 100;
                        const deadLeft = (deadStart / durationMs) * 100;
                        html += `<div class="cd-debuff-dead-zone" style="left:${deadLeft.toFixed(2)}%; width:${deadWidth.toFixed(2)}%;"></div>`;
                    }
                }

                segs.forEach(s => {
                    const relStart = Math.max(0, s.start - fightInfo.startTime);
                    const relEnd   = Math.min(durationMs, s.end - fightInfo.startTime);
                    if (isPoint || s.isPoint) {
                        const leftPct = (relStart / durationMs) * 100;
                        html += `<div class="cd-debuff-marker" title="${formatDuration(relStart)}" style="left:${leftPct.toFixed(2)}%; background:${color}; box-shadow: 0 0 4px ${color};"></div>`;
                    } else if (relEnd > relStart) {
                        const leftPct  = (relStart / durationMs) * 100;
                        const widthPct = ((relEnd - relStart) / durationMs) * 100;
                        html += `<div class="cd-debuff-bar" title="${formatDuration(relEnd - relStart)}" style="left:${leftPct.toFixed(2)}%; width:${widthPct.toFixed(2)}%; background:${color}; box-shadow: 0 0 6px ${color};"></div>`;
                    }
                });
                html += `</div>
                    <div class="cd-debuff-tpct">${rightLabel}</div>
                </div>`;
            });

            html += '</div>';
        });

        // Time axis
        html += `
        <div class="cd-time-axis">
            <span>0:00</span>
            <span>${formatDuration(durationMs / 4)}</span>
            <span>${formatDuration(durationMs / 2)}</span>
            <span>${formatDuration(durationMs * 0.75)}</span>
            <span>${formatDuration(durationMs)}</span>
        </div>`;

        html += '</div></div>';
        }
    }

    html += `
        </div>
        <div id="cdRaidSupportSection" style="display:none;">
            ${raidSupportHtml}
        </div>
    </div>`;

    container.innerHTML = html;
    container.style.display = 'block';
    state.openPanels.casts = true;
}
