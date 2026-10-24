// public/js/ui/mainContent.js
// Main view orchestrator: renders Player View or Raid Summary depending on selection.

import { state } from '../state.js';
import { formatDuration } from '../utils.js';
import { processPlayerData } from '../processor/index.js';
import { fetchDps } from '../api.js';
import { renderPlayerView } from './playerView.js';
import { renderAllPlayersView, toggleAllViewFilter } from './raidSummary.js';

export function renderMainContent() {
    const contentArea = document.getElementById('contentArea');

    if (!state.selectedFightId || !state.selectedPlayerName) {
        let msg = 'Select a fight and a player to view detailed combat analysis';
        if (state.selectedFightId && !state.selectedPlayerName) {
            msg = 'Now select a player from the right sidebar';
        } else if (!state.selectedFightId && state.selectedPlayerName) {
            msg = 'Now select a fight from the left sidebar';
        }
        contentArea.innerHTML = `<div class="content-placeholder"><div class="placeholder-icon">⚔️</div><p>${msg}</p></div>`;
        return;
    }

    const fightId = state.selectedFightId;
    const playerName = state.selectedPlayerName;
    const report = state.currentReport;
    const allEvents = state.currentEvents;
    const allActors = state.currentActors;

    // Get fight events
    let fightEvents;
    let fightInfo = null;
    if (fightId === 'overall') {
        // Filter events that belong to any fight (including trash)
        const validFightIds = new Set(report.fights.map(f => f.id));
        fightEvents = allEvents.filter(ev => ev.type === 'combatantinfo' || validFightIds.has(ev.fight));
    } else {
        fightInfo = report.fights.find(f => f.id == fightId);
        if (!fightInfo) {
            contentArea.innerHTML = '<div class="content-placeholder"><p>Fight not found</p></div>';
            return;
        }
        const combatantInfosMap = {};
        const regularEvents = [];
        
        allEvents.forEach(ev => {
            if (ev.type === 'combatantinfo') {
                if (ev.timestamp <= fightInfo.startTime + 15000 && ev.timestamp >= fightInfo.startTime - 180000) {
                    combatantInfosMap[ev.sourceID] = ev;
                }
            } else if (ev.timestamp >= (fightInfo.startTime - 15000) && ev.timestamp <= (fightInfo.endTime + 5000)) {
                regularEvents.push(ev);
            }
        });
        
        fightEvents = [...Object.values(combatantInfosMap), ...regularEvents].sort((a, b) => a.timestamp - b.timestamp);
    }

    // "All" view — raid summary
    if (playerName === '__ALL__') {
        contentArea.innerHTML = renderAllPlayersView(fightId, fightEvents, allActors, fightInfo);
        // Refresh Wowhead tooltips
        if (typeof window.$WowheadPower !== 'undefined') {
            window.$WowheadPower.refreshLinks();
        }
        return;
    }

    // Find player actor
    const player = allActors.find(a => a.name === playerName);
    if (!player) {
        contentArea.innerHTML = '<div class="content-placeholder"><p>Player not found</p></div>';
        return;
    }

    // Process and render
    const playerData = processPlayerData(fightId, fightEvents, player);
    contentArea.innerHTML = renderPlayerView(playerData, player, fightInfo);

    // Fetch DPS
    if (fightInfo) {
        fetchDps(state.currentLogId, [fightInfo.id], player.id);
    } else {
        const fights = report.fights;
        if (fights && fights.length > 0) {
            fetchDps(state.currentLogId, fights.map(f => f.id), player.id);
        }
    }

    // Refresh Wowhead tooltips
    if (typeof window.$WowheadPower !== 'undefined') {
        window.$WowheadPower.refreshLinks();
    }
}

// Re-export functions
export { renderPlayerView } from './playerView.js';
export { renderAllPlayersView, toggleAllViewFilter } from './raidSummary.js';
