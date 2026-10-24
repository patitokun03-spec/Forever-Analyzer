// main.js — Single entry point for WoW Forever Log Analyzer
// Orchestrates initialization, imports all modules, handles URL routing and DOM events.

import { initGameData } from './gameData.js';
import { state, resetStateForLanding } from './state.js';
import { auditarLog, loadDemoLog } from './api.js';
import { renderMainContent, toggleAllViewFilter } from './ui/mainContent.js';

import { 
    toggleGearInline, closeGearModal, toggleTimelineInline, 
    toggleCastsDebuffInline,
    sendToWebhookProfile, editWebhookProfile, deleteWebhookProfile, 
    enviarADiscord, closeDiscordModal 
} from './ui/modals.js';
import { 
    openCompareMode,
    exitCompareMode,
    loadCompareLog, 
    useSameLogForCompare, 
    clearCompareLog, 
    updateCompareSelection 
} from './ui/compareView.js';

// === PAGE TRANSITIONS ===

function transitionToApp() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('appLayout').classList.add('visible');
}

function goBackToLanding() {
    document.getElementById('appLayout').classList.remove('visible');
    document.getElementById('landingPage').classList.remove('hidden');
    resetStateForLanding();
    document.getElementById('btnDiscord').style.display = 'none';
    window.history.pushState({}, '', '/');
}

// === URL STATE MANAGEMENT ===

function updateURL() {
    const url = new URL(window.location);
    if (state.currentLogId) url.searchParams.set('log', state.currentLogId);
    else url.searchParams.delete('log');

    if (state.selectedFightId) url.searchParams.set('fight', state.selectedFightId);
    else url.searchParams.delete('fight');

    if (state.selectedPlayerName && state.selectedPlayerName !== '__ALL__') {
        url.searchParams.set('player', state.selectedPlayerName);
    } else {
        url.searchParams.delete('player');
    }

    // Synchronize role and class filters in the URL query string
    if (state.allViewRoleFilters && state.allViewRoleFilters.size > 0) {
        url.searchParams.set('roles', Array.from(state.allViewRoleFilters).join(','));
    } else {
        url.searchParams.delete('roles');
    }

    if (state.allViewClassFilters && state.allViewClassFilters.size > 0) {
        url.searchParams.set('classes', Array.from(state.allViewClassFilters).join(','));
    } else {
        url.searchParams.delete('classes');
    }

    if (state.compareState && state.compareState.active) {
        url.searchParams.set('compare', 'true');
        if (state.compareLogB) url.searchParams.set('logB', state.compareLogB.logId);
        if (state.compareState.fightA) url.searchParams.set('fightA', state.compareState.fightA);
        if (state.compareState.playerA) url.searchParams.set('playerA', state.compareState.playerA);
        if (state.compareState.fightB) url.searchParams.set('fightB', state.compareState.fightB);
        if (state.compareState.playerB) url.searchParams.set('playerB', state.compareState.playerB);
    } else {
        url.searchParams.delete('compare');
        url.searchParams.delete('logB');
        url.searchParams.delete('fightA');
        url.searchParams.delete('playerA');
        url.searchParams.delete('fightB');
        url.searchParams.delete('playerB');
    }

    window.history.pushState({}, '', url);
}

// === SELECTION HANDLERS ===

function selectFight(fightId) {
    const wasGearOpen = state.openPanels.gear;
    const wasTimelineOpen = state.openPanels.timeline;
    const wasCastsOpen = state.openPanels.casts;

    state.openPanels.gear = false;
    state.openPanels.timeline = false;
    state.openPanels.casts = false;

    state.selectedFightId = fightId;
    document.querySelectorAll('.fight-item').forEach(el => {
        el.classList.toggle('active', el.dataset.fight == fightId);
    });
    renderMainContent();
    updateURL();

    const playerName = state.selectedPlayerName;
    if (playerName && playerName !== '__ALL__' && fightId) {
        const safeName = playerName.replace(/'/g, "\\'");
        const isOverall = (fightId === 'overall');

        setTimeout(() => {
            if (wasGearOpen) {
                const player = state.currentActors && state.currentActors.find(a => a.name === playerName);
                if (player) {
                    const spec = state.detectedSpecs[playerName] || player.subType;
                    window.toggleGearInline(safeName, fightId, player.subType, spec);
                }
            }
            if (wasTimelineOpen && !isOverall) {
                window.toggleTimelineInline(safeName, fightId);
            }
            if (wasCastsOpen) {
                window.toggleCastsDebuffInline(safeName, fightId);
            }
        }, 50);
    }
}

function selectPlayer(playerName) {
    const wasGearOpen = state.openPanels.gear;
    const wasTimelineOpen = state.openPanels.timeline;
    const wasCastsOpen = state.openPanels.casts;

    state.openPanels.gear = false;
    state.openPanels.timeline = false;
    state.openPanels.casts = false;

    state.selectedPlayerName = playerName;
    document.querySelectorAll('.player-item').forEach(el => {
        el.classList.toggle('active', el.dataset.player === playerName);
    });
    renderMainContent();
    updateURL();

    if (playerName && playerName !== '__ALL__' && state.selectedFightId) {
        const safeName = playerName.replace(/'/g, "\\'");
        const fightId = state.selectedFightId;
        const isOverall = (fightId === 'overall');

        setTimeout(() => {
            if (wasGearOpen) {
                const player = state.currentActors && state.currentActors.find(a => a.name === playerName);
                if (player) {
                    const spec = state.detectedSpecs[playerName] || player.subType;
                    window.toggleGearInline(safeName, fightId, player.subType, spec);
                }
            }
            if (wasTimelineOpen && !isOverall) {
                window.toggleTimelineInline(safeName, fightId);
            }
            if (wasCastsOpen) {
                window.toggleCastsDebuffInline(safeName, fightId);
            }
        }, 50);
    }
}

// === EXPOSE TO WINDOW FOR INLINE ONCLICK HANDLERS ===
window._realAuditarLog = auditarLog;
window._realLoadDemoLog = loadDemoLog;
window.auditarLog = auditarLog;
window.loadDemoLog = loadDemoLog;
window.transitionToApp = transitionToApp;
window.goBackToLanding = goBackToLanding;
window.selectFight = selectFight;
window.selectPlayer = selectPlayer;
window.toggleAllViewFilter = toggleAllViewFilter;
window.renderMainContent = renderMainContent;

// Modals
window.toggleGearInline = toggleGearInline;
window.closeGearModal = closeGearModal;
window.toggleTimelineInline = toggleTimelineInline;
window.toggleCastsDebuffInline = toggleCastsDebuffInline;

// Discord
window.enviarADiscord = enviarADiscord;
window.closeDiscordModal = closeDiscordModal;
window.sendToWebhookProfile = sendToWebhookProfile;
window.editWebhookProfile = editWebhookProfile;
window.deleteWebhookProfile = deleteWebhookProfile;

// Compare
window.openCompareMode = openCompareMode;
window.exitCompareMode = exitCompareMode;
window.loadCompareLog = loadCompareLog;
window.useSameLogForCompare = useSameLogForCompare;
window.clearCompareLog = clearCompareLog;
window.updateCompareSelection = updateCompareSelection;
window.updateURL = updateURL;

// === INITIALIZATION ===

async function init() {
    // 1. Load game data from SQLite API
    await initGameData();

    // Check if user clicked demo or audit before module finished loading
    if (window._pendingAction === 'demo') {
        window._pendingAction = null;
        loadDemoLog();
        return;
    } else if (window._pendingAction === 'audit') {
        window._pendingAction = null;
        auditarLog();
        return;
    }

    // 2. Check URL params for auto-loading a log and restoring filters
    let potentialLogId = null;
    const urlParams = new URLSearchParams(window.location.search);
    potentialLogId = urlParams.get('log');

    // Check /report/:logId path
    if (window.location.pathname.startsWith('/report/')) {
        potentialLogId = window.location.pathname.split('/report/')[1];
    }

    if (potentialLogId) {
        document.getElementById('logInput').value = potentialLogId;
        
        if (urlParams.get('fight')) state.selectedFightId = urlParams.get('fight');
        if (urlParams.get('player')) state.selectedPlayerName = urlParams.get('player');

        // Restore role and class filters from URL
        const rolesParam = urlParams.get('roles');
        if (rolesParam) {
            rolesParam.split(',').map(s => s.trim()).filter(Boolean).forEach(r => state.allViewRoleFilters.add(r));
        }
        const classesParam = urlParams.get('classes');
        if (classesParam) {
            classesParam.split(',').map(s => s.trim()).filter(Boolean).forEach(c => state.allViewClassFilters.add(c));
        }

        auditarLog();
    }

    // 3. Browser Back / Forward History Navigation (popstate)
    window.addEventListener('popstate', () => {
        const params = new URLSearchParams(window.location.search);
        const logId = params.get('log');
        const fightId = params.get('fight') || 'overall';
        const playerName = params.get('player') || '__ALL__';

        // Update filters from popstate
        state.allViewRoleFilters.clear();
        const roles = params.get('roles');
        if (roles) roles.split(',').map(s => s.trim()).filter(Boolean).forEach(r => state.allViewRoleFilters.add(r));

        state.allViewClassFilters.clear();
        const classes = params.get('classes');
        if (classes) classes.split(',').map(s => s.trim()).filter(Boolean).forEach(c => state.allViewClassFilters.add(c));

        if (!logId) {
            goBackToLanding();
            return;
        }

        if (state.currentLogId === logId && state.currentReport) {
            // Smooth view update without reloading
            state.selectedFightId = fightId;
            state.selectedPlayerName = playerName;
            document.querySelectorAll('.fight-item').forEach(el => el.classList.toggle('active', el.dataset.fight == fightId));
            document.querySelectorAll('.player-item').forEach(el => el.classList.toggle('active', el.dataset.player === playerName));
            renderMainContent();
        } else {
            // New log requested via history navigation
            document.getElementById('logInput').value = logId;
            state.selectedFightId = fightId;
            state.selectedPlayerName = playerName;
            auditarLog();
        }
    });

    // 4. Wire up DOM event listeners
    document.getElementById('logInput').addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            auditarLog();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            const gearOverlay = document.getElementById('gearOverlay');
            const discordOverlay = document.getElementById('discordOverlay');
            if (gearOverlay) gearOverlay.classList.remove('is-open');
            if (discordOverlay) discordOverlay.classList.remove('is-open');
        }
    });

    // Footer links
    const feedbackBtn = document.getElementById('feedbackBtn');
    const githubBtn = document.getElementById('githubBtn');
    const landingFeedbackBtn = document.getElementById('landingFeedbackBtn');
    const landingGithubBtn = document.getElementById('landingGithubBtn');

    if (feedbackBtn) feedbackBtn.addEventListener('click', () => {
        window.open('https://github.com/patitokun03-spec/FOREVER/issues/new', '_blank');
    });
    if (githubBtn) githubBtn.addEventListener('click', () => {
        window.open('https://github.com/patitokun03-spec/FOREVER', '_blank');
    });
    if (landingFeedbackBtn) landingFeedbackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://github.com/patitokun03-spec/FOREVER/issues/new', '_blank');
    });
    if (landingGithubBtn) landingGithubBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://github.com/patitokun03-spec/FOREVER', '_blank');
    });

    console.log('[Forever Logs] App initialized successfully');
}

// Start the app
init();
