// api.js — Backend API communication module for WoW Forever Log Analyzer
// Handles audit log requests, DPS calculation, and Wowhead prefetching.

import { state } from './state.js';
import { parseLogId, detectPlayerSpec } from './utils.js';
import { renderFightsSidebar, renderPlayersSidebar } from './ui/sidebar.js';

export async function loadDemoLog() {
    const input = document.getElementById('logInput');
    if (input) input.value = 'demo';
    return auditarLog();
}

export async function auditarLog() {
    const rawInput = document.getElementById('logInput').value.trim();
    const logId = parseLogId(rawInput) || (rawInput.toLowerCase() === 'demo' ? 'demo' : '');
    if (!logId) return;

    state.currentLogId = logId;
    state.detectedSpecs = {};
    state.playerGearDB = {};
    state.playerEnchantsForConsole = {};
    state.processedPlayerCache = {};

    // Immediately transition to app layout with loading overlay
    document.getElementById('landingStatus').innerHTML = '';
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Only show loading animation if the fetch takes longer than 300ms (not cached)
    const loaderTimeout = setTimeout(() => {
        loadingOverlay.style.display = 'flex';
    }, 300);

    // Store timeout ID to clear it if response arrives quickly
    state._loaderTimeout = loaderTimeout;

    // Clear sidebars and content for fresh load
    document.getElementById('fightsList').innerHTML = '';
    document.getElementById('playersList').innerHTML = '';
    document.getElementById('contentArea').innerHTML = `<div class="content-placeholder"><div class="placeholder-icon">⚔️</div><p>Loading report data...</p></div>`;

    // Set report info early
    document.getElementById('reportInfo').textContent = logId;
    document.getElementById('btnDiscord').style.display = 'none';

    // Transition to app
    window.transitionToApp();

    // Update URL early
    window.history.pushState({}, '', '?log=' + logId);

    try {
        const bypassCache = document.getElementById('bypassCacheInput')?.checked || false;
        const response = await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logId, bypassCache })
        });

        const res = await response.json();
        if (res.error) throw new Error(res.error);
        if (res.errors) throw new Error(res.errors[0].message);
        if (!res.data || !res.data.reportData || !res.data.reportData.report) {
            throw new Error("Report not found, it is private, or the link is incorrect.");
        }

        const report = res.data.reportData.report;
        const allActors = report.masterData.actors || [];
        const allEvents = report.events.data || [];

        // Only display players who have a combatantinfo event
        // (WCL only generates this event for genuine raid/party members)
        const combatantIds = new Set(
            allEvents.filter(ev => ev.type === 'combatantinfo').map(ev => ev.sourceID)
        );
        const raidActors = allActors.filter(a => combatantIds.has(a.id));

        state.currentReport = report;
        state.currentEvents = allEvents;
        state.currentActors = raidActors;
        state.allActors = allActors; // all actors including NPCs/bosses for name resolution
        state.currentLogTitle = report.title;

        // Pre-process: detect specs and store gear from combatantinfo events
        allEvents.forEach(ev => {
            if (ev.type === 'combatantinfo') {
                const p = allActors.find(x => x.id === ev.sourceID);
                if (p) {
                    const spec = detectPlayerSpec(p, ev);
                    state.detectedSpecs[p.name] = spec;

                    if (ev.gear) {
                        // Store gear for the first fight that has it (for overall)
                        if (!state.playerGearDB['overall']) state.playerGearDB['overall'] = {};
                        if (!state.playerGearDB['overall'][p.name]) {
                            state.playerGearDB['overall'][p.name] = ev.gear;
                        }
                    }
                }
            }
        });

        // Also store gear per fight
        report.fights.forEach(fight => {
            const combatantInfosMap = {};
            allEvents.forEach(ev => {
                if (ev.type === 'combatantinfo' && ev.timestamp <= fight.startTime + 15000 && ev.timestamp >= fight.startTime - 180000) {
                    combatantInfosMap[ev.sourceID] = ev;
                }
            });
            Object.values(combatantInfosMap).forEach(ev => {
                if (ev.gear) {
                    const p = allActors.find(x => x.id === ev.sourceID);
                    if (p) {
                        if (!state.playerGearDB[fight.id]) state.playerGearDB[fight.id] = {};
                        state.playerGearDB[fight.id][p.name] = ev.gear;
                    }
                }
            });
        });

        // Render sidebars
        renderFightsSidebar(report);
        renderPlayersSidebar(raidActors);

        // Show Discord button
        document.getElementById('btnDiscord').style.display = 'block';

        // Auto-select based on state or defaults
        if (typeof window.selectFight === 'function' && typeof window.selectPlayer === 'function') {
            const initialFight = state.selectedFightId || 'overall';
            const initialPlayer = state.selectedPlayerName || '__ALL__';
            
            window.selectFight(initialFight);
            window.selectPlayer(initialPlayer);
        }

        // Wowhead Forever prefetch
        let prefetchDiv = document.getElementById('wh-prefetch');
        if (!prefetchDiv) {
            prefetchDiv = document.createElement('div');
            prefetchDiv.id = 'wh-prefetch';
            prefetchDiv.style.cssText = 'display:none; pointer-events:none; position:absolute; width:0; height:0; overflow:hidden;';
            document.body.appendChild(prefetchDiv);
        }
        let uniqueItemIds = new Set();
        if (state.playerGearDB) {
            Object.values(state.playerGearDB).forEach(fightMap => {
                Object.values(fightMap).forEach(gearArr => {
                    if (Array.isArray(gearArr)) {
                        gearArr.forEach(item => { if (item && item.id) uniqueItemIds.add(item.id); });
                    }
                });
            });
        }
        let prefetchHtml = '';
        uniqueItemIds.forEach(id => {
            prefetchHtml += `<a href="https://www.wowhead.com/forever/item=${id}"></a>`;
        });
        prefetchDiv.innerHTML = prefetchHtml;

        // Hide loading overlay with fade
        if (state._loaderTimeout) clearTimeout(state._loaderTimeout);
        loadingOverlay.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            loadingOverlay.style.animation = '';
        }, 300);
    } catch (e) {
        if (state._loaderTimeout) clearTimeout(state._loaderTimeout);
        // On error, go back to landing page
        document.getElementById('appLayout').classList.remove('visible');
        document.getElementById('landingPage').classList.remove('hidden');
        document.getElementById('landingStatus').innerHTML = `<span style="color:#e74c3c;">Error: ${e.message}</span>`;
        loadingOverlay.style.display = 'none';
        loadingOverlay.style.animation = '';
        state.currentLogId = null;
    }
}

export async function fetchDps(logId, fightIDs, playerId) {
    try {
        const response = await fetch('/api/dps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logId, fightIDs, playerId })
        });
        const res = await response.json();
        const fightIdKey = (fightIDs && fightIDs.length === 1) ? fightIDs[0] : 'overall';
        const placeholders = document.querySelectorAll(`[id="dpsPlaceholder-${fightIdKey}-${playerId}"]`);
        placeholders.forEach(placeholder => {
            const formatAmount = (total) => {
                if (total >= 1000000) return (total / 1000000).toFixed(2) + 'm';
                return (total / 1000).toFixed(1) + 'k';
            };
            if (res.error) {
                placeholder.textContent = "(DPS error)";
            } else if (res.isHealing) {
                placeholder.textContent = `| ${res.dps} HPS (${formatAmount(res.total)} heal)`;
            } else {
                placeholder.textContent = `| ${res.dps} DPS (${formatAmount(res.total)} dmg)`;
            }
        });
    } catch (err) {
        const fightIdKey = (fightIDs && fightIDs.length === 1) ? fightIDs[0] : 'overall';
        const placeholders = document.querySelectorAll(`[id="dpsPlaceholder-${fightIdKey}-${playerId}"]`);
        placeholders.forEach(placeholder => {
            placeholder.textContent = "";
        });
    }
}
