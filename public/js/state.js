// state.js — Global reactive state store for WoW Forever Log Analyzer

export const state = {
    currentReport: null,
    currentEvents: null,
    currentActors: null,
    currentLogId: null,
    currentLogTitle: '',
    selectedFightId: null,
    selectedPlayerName: null,
    detectedSpecs: {},
    playerGearDB: {},
    playerEnchantsForConsole: {},
    allViewClassFilters: new Set(),
    allViewRoleFilters: new Set(),
    timelineDB: {},
    castsDebuffDB: {},
    allActors: [],
    openPanels: { gear: false, timeline: false, casts: false },
    processedPlayerCache: {}, // In-memory cache for processed fight/player data
    compareLogA: null, // { report, events, actors, logId, title }
    compareLogB: null, // { report, events, actors, logId, title }
    compareState: { active: false, fightA: null, playerA: null, fightB: null, playerB: null, diffMode: 'A-B' }
};

export function resetStateForAudit(logId) {
    state.currentLogId = logId;
    state.detectedSpecs = {};
    state.playerGearDB = {};
    state.playerEnchantsForConsole = {};
    state.timelineDB = {};
    state.castsDebuffDB = {};
    state.allActors = [];
    state.processedPlayerCache = {};
    state.compareLogA = null;
    state.compareLogB = null;
    state.compareState = { active: false, fightA: null, playerA: null, fightB: null, playerB: null, diffMode: 'A-B' };
}

export function resetStateForLanding() {
    state.selectedFightId = null;
    state.selectedPlayerName = null;
    state.currentReport = null;
    state.currentEvents = null;
    state.currentActors = null;
    state.processedPlayerCache = {};
    state.compareLogA = null;
    state.compareLogB = null;
    state.compareState = { active: false, fightA: null, playerA: null, fightB: null, playerB: null, diffMode: 'A-B' };
}
