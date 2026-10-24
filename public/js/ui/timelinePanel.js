// public/js/ui/timelinePanel.js
// Procs and Cooldowns Timeline visualizer component

import { state } from '../state.js';
import { formatDuration } from '../utils.js';
import { TIMELINE_SPELLS } from '../gameData.js';

export function toggleTimelineInline(playerName, fightId) {
    const container = document.getElementById('inlineTimelineContainer');
    if (container.style.display === 'block') {
        container.style.display = 'none';
        state.openPanels.timeline = false;
        return;
    }
    
    if (!state.timelineDB || !state.timelineDB[fightId] || !state.timelineDB[fightId][playerName]) {
        container.innerHTML = '<div class="timeline-empty">No timeline data available.</div>';
        container.style.display = 'block';
        state.openPanels.timeline = true;
        return;
    }

    const events = state.timelineDB[fightId][playerName];
    const fightInfo = state.currentReport.fights.find(f => f.id == fightId || f.id == parseInt(fightId));
    if (!fightInfo) return;
    
    container.innerHTML = generateTimelineHTML(playerName, fightId, events, fightInfo);
    container.style.display = 'block';
    state.openPanels.timeline = true;
}

export function generateTimelineHTML(playerName, fightId, events, fightInfo, isCompare = false) {
    if (!events || Object.keys(events).length === 0) return '<div class="timeline-empty">No tracked cooldowns or procs used.</div>';

    const durationMs = fightInfo.endTime - fightInfo.startTime;
    const durationStr = formatDuration(durationMs);
    let html = `<div class="timeline-wrapper"><div class="timeline-title" style="display: flex; justify-content: space-between;">
        <span>${isCompare ? '' : 'FIGHT '}TIMELINE</span>
        <span style="color: #aaa; font-weight: normal; font-size: 0.9em;">Duration: ${durationStr}</span>
    </div><div class="timeline-content">`;
    
    const usedSpells = Object.keys(events).filter(sId => events[sId].length > 0);
    
    // Sort alphabetically, but treat Heroism as Bloodlust so they align in comparisons
    usedSpells.sort((a, b) => {
        let nameA = TIMELINE_SPELLS[a.split('-')[0]]?.name || '';
        let nameB = TIMELINE_SPELLS[b.split('-')[0]]?.name || '';
        if (nameA === 'Heroism') nameA = 'Bloodlust';
        if (nameB === 'Heroism') nameB = 'Bloodlust';
        return nameA.localeCompare(nameB);
    });
    
    if (usedSpells.length === 0) {
        html += '<div class="timeline-empty">No tracked cooldowns or procs used.</div>';
    } else {
        usedSpells.forEach(spellIdStr => {
            const baseSpellId = spellIdStr.split('-')[0];
            let spellInfo = TIMELINE_SPELLS[baseSpellId];
            if (!spellInfo) return;
            spellInfo = { ...spellInfo };

            if (spellIdStr.includes('-')) {
                const targetOrSource = spellIdStr.substring(spellIdStr.indexOf('-') + 1);
                if (baseSpellId === '29166') {
                    spellInfo.name = `Innervate (${targetOrSource})`;
                } else if (baseSpellId === '10060') {
                    spellInfo.name = `Power Infusion (${targetOrSource})`;
                } else if (baseSpellId === '1022') {
                    spellInfo.name = `BoP (${targetOrSource})`;
                } else {
                    spellInfo.name = `${spellInfo.name} (${targetOrSource})`;
                }
            }

            if (baseSpellId == 33370) {
                let hasScarab = false;
                if (fightId === 'overall') {
                    if (state.playerGearDB) {
                        for (let fId in state.playerGearDB) {
                            if (state.playerGearDB[fId][playerName] && state.playerGearDB[fId][playerName].some(g => g && g.id === 28190)) {
                                hasScarab = true;
                                break;
                            }
                        }
                    }
                } else {
                    const gear = (state.playerGearDB && state.playerGearDB[fightId] && state.playerGearDB[fightId][playerName]) ? state.playerGearDB[fightId][playerName] : [];
                    hasScarab = gear.some(g => g && g.id === 28190);
                }

                if (hasScarab) {
                    spellInfo.name = "Fate's Decree (Scarab)";
                    spellInfo.icon = "inv_misc_orb_03";
                }
            }

            const color = spellInfo.color || '#f4b400';
            html += `
            <div class="timeline-row-container">
                <div class="timeline-spell-name" style="color: ${color};">${spellInfo.name}</div>
                <div class="timeline-track">`;
                
            // Calculate overlapping levels
            let segmentsToRender = [];
            let stackLevels = [];
            events[spellIdStr].forEach(ev => {
                let placed = false;
                for (let i = 0; i < stackLevels.length; i++) {
                    let overlaps = stackLevels[i].some(existing => (ev.start < existing.end && ev.end > existing.start));
                    if (!overlaps) {
                        stackLevels[i].push(ev);
                        ev._level = i;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    ev._level = stackLevels.length;
                    stackLevels.push([ev]);
                }
                segmentsToRender.push(ev);
            });

            segmentsToRender.forEach(ev => {
                let relStart = ev.start - fightInfo.startTime;
                let relEnd = ev.end - fightInfo.startTime;
                relStart = Math.max(0, relStart);
                relEnd = Math.min(durationMs, relEnd);
                
                if (relEnd > relStart) {
                    const leftPct = (relStart / durationMs) * 100;
                    const widthPct = ((relEnd - relStart) / durationMs) * 100;
                    const levelOffset = ev._level ? (ev._level * 5) : 0;
                    
                    html += `<div class="timeline-bar" style="left: ${leftPct}%; width: ${widthPct}%; background-color: ${color}; opacity: 0.85; border: 1px solid rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.5); top: calc(50% - 7px + ${levelOffset}px); height: 14px; z-index: ${ev._level || 0};" title="${spellInfo.name} ${(relStart/1000).toFixed(1)}s - ${(relEnd/1000).toFixed(1)}s"></div>`;
                }
            });
            html += `</div></div>`;
        });
        
        // Draw the time axis
        html += `<div class="timeline-axis">
            <span>0:00</span>
            <span>${formatDuration(durationMs/4)}</span>
            <span>${formatDuration(durationMs/2)}</span>
            <span>${formatDuration(durationMs * 0.75)}</span>
            <span>${formatDuration(durationMs)}</span>
        </div>`;
    }
    
    html += `</div></div>`;
    return html;
}
