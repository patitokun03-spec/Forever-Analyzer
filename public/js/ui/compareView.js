// public/js/ui/compareView.js
// Side-by-side combat log comparison view for WoW Forever

import { state } from '../state.js';
import { processPlayerData } from '../processor/index.js';
import { parseLogId, formatDuration, escapeHtml } from '../utils.js';
import { SPELL_DB } from '../gameData.js';

export function openCompareMode() {
    state.compareState.active = true;

    // Initialize with current fight and player if not yet set
    if (!state.compareState.fightA) {
        state.compareState.fightA = state.selectedFightId || 'overall';
    }
    if (!state.compareState.playerA) {
        state.compareState.playerA = state.selectedPlayerName && state.selectedPlayerName !== '__ALL__' ? state.selectedPlayerName : '';
    }

    // Hide sidebars to give full width to comparison view
    const sbLeft = document.getElementById('sidebarLeft');
    const sbRight = document.getElementById('sidebarRight');
    if (sbLeft) sbLeft.style.display = 'none';
    if (sbRight) sbRight.style.display = 'none';

    renderCompareUI();
    if (window.updateURL) window.updateURL();
}

export function exitCompareMode() {
    state.compareState.active = false;
    const sbLeft = document.getElementById('sidebarLeft');
    const sbRight = document.getElementById('sidebarRight');
    if (sbLeft) sbLeft.style.display = '';
    if (sbRight) sbRight.style.display = '';

    if (window.renderMainContent) window.renderMainContent();
    if (window.updateURL) window.updateURL();
}

export async function loadCompareLog() {
    const input = document.getElementById('compareLogInput');
    const status = document.getElementById('compareLogStatus');
    if (!input) return;

    const raw = input.value.trim();
    const logId = parseLogId(raw);
    if (!logId) {
        if (status) status.innerHTML = '<span style="color:#e74c3c;">Please enter a valid URL or ID.</span>';
        return;
    }

    if (status) status.innerHTML = '<span style="color:#f1c40f;">Loading Log B...</span>';

    try {
        const response = await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logId })
        });
        const res = await response.json();
        if (res.error) throw new Error(res.error);
        if (!res.data || !res.data.reportData || !res.data.reportData.report) {
            throw new Error("Report not found or private.");
        }

        const report = res.data.reportData.report;
        const allActors = report.masterData.actors || [];
        const allEvents = report.events.data || [];
        const combatantIds = new Set(allEvents.filter(ev => ev.type === 'combatantinfo').map(ev => ev.sourceID));
        const raidActors = allActors.filter(a => combatantIds.has(a.id));

        state.compareLogB = {
            logId: logId,
            report: report,
            events: allEvents,
            actors: raidActors,
            allActors: allActors,
            title: report.title
        };

        if (status) status.innerHTML = `<span style="color:#2ecc71;">Log B loaded: ${escapeHtml(report.title || logId)}</span>`;
        renderCompareUI();
    } catch (e) {
        if (status) status.innerHTML = `<span style="color:#e74c3c;">Error: ${escapeHtml(e.message)}</span>`;
    }
}

export function useSameLogForCompare() {
    if (!state.currentReport) return;
    state.compareLogB = {
        logId: state.currentLogId,
        report: state.currentReport,
        events: state.currentEvents,
        actors: state.currentActors,
        allActors: state.allActors,
        title: state.currentLogTitle
    };
    renderCompareUI();
}

export function clearCompareLog() {
    state.compareLogB = null;
    state.compareState.fightB = null;
    state.compareState.playerB = null;
    renderCompareUI();
}

export function updateCompareSelection() {
    const selFA = document.getElementById('compareFightA');
    const selPA = document.getElementById('comparePlayerA');
    const selFB = document.getElementById('compareFightB');
    const selPB = document.getElementById('comparePlayerB');

    if (selFA) state.compareState.fightA = selFA.value;
    if (selPA) state.compareState.playerA = selPA.value;
    if (selFB) state.compareState.fightB = selFB.value;
    if (selPB) state.compareState.playerB = selPB.value;

    renderCompareUI();
    if (window.updateURL) window.updateURL();
}

function renderCompareUI() {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    const fightsA = buildFightsOptions(state.currentReport, state.compareState.fightA);
    const playersA = buildPlayersOptions(state.currentActors, state.compareState.playerA);

    let logBSection = '';
    if (!state.compareLogB) {
        logBSection = `
            <div class="compare-card compare-card-empty">
                <div class="compare-card-header">
                    <span class="compare-tag log-b-tag">TARGET B</span>
                    <h4>Select Log to Compare</h4>
                </div>
                <div class="compare-input-group">
                    <input type="text" id="compareLogInput" placeholder="Paste URL or Report ID of Log B..." onkeypress="if(event.key==='Enter') window.loadCompareLog()" class="forever-input">
                    <button onclick="window.loadCompareLog()" class="forever-btn forever-btn-primary">Load Log B</button>
                    <button onclick="window.useSameLogForCompare()" class="forever-btn forever-btn-secondary">Compare Within Same Log</button>
                </div>
                <div id="compareLogStatus" class="compare-status"></div>
            </div>
        `;
    } else {
        const fightsB = buildFightsOptions(state.compareLogB.report, state.compareState.fightB);
        const playersB = buildPlayersOptions(state.compareLogB.actors, state.compareState.playerB);
        const isSame = (state.compareLogB.logId === state.currentLogId);

        logBSection = `
            <div class="compare-card">
                <div class="compare-card-header">
                    <span class="compare-tag log-b-tag">LOG B: ${isSame ? 'Same Log' : state.compareLogB.logId}</span>
                    <button onclick="window.clearCompareLog()" class="forever-btn-text">Change Log B ✕</button>
                </div>
                <div class="compare-selectors">
                    <div class="selector-field">
                        <label>Fight B</label>
                        <select id="compareFightB" onchange="window.updateCompareSelection()" class="forever-select">
                            <option value="">-- Select Fight B --</option>
                            ${fightsB}
                        </select>
                    </div>
                    <div class="selector-field">
                        <label>Player B</label>
                        <select id="comparePlayerB" onchange="window.updateCompareSelection()" class="forever-select">
                            <option value="">-- Select Player B --</option>
                            ${playersB}
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    let comparisonContent = '';
    const hasFullSelection = state.compareState.fightA && state.compareState.playerA &&
                             state.compareLogB && state.compareState.fightB && state.compareState.playerB;

    if (hasFullSelection) {
        comparisonContent = generateFullComparison();
    } else {
        comparisonContent = `
            <div class="compare-prompt">
                <div class="prompt-icon">⚖️</div>
                <h3>Select a fight and player on both sides to view live comparison</h3>
                <p>Compare DPS, CPM, ability breakdown, and combat performance side-by-side.</p>
            </div>
        `;
    }

    contentArea.innerHTML = `
        <div class="compare-container">
            <!-- Top Header -->
            <div class="compare-top-header">
                <div class="compare-title">
                    <span class="compare-title-icon">⚖️</span>
                    <div>
                        <h2>Performance Comparison</h2>
                        <p class="compare-subtitle">Side-by-side combat analysis, rotation, and performance audit</p>
                    </div>
                </div>
                <button onclick="window.exitCompareMode()" class="forever-btn forever-btn-close">
                    Close Comparison ✕
                </button>
            </div>

            <!-- Configuration Panel A vs B -->
            <div class="compare-grid-selectors">
                <!-- Side A -->
                <div class="compare-card">
                    <div class="compare-card-header">
                        <span class="compare-tag log-a-tag">LOG A: ${state.currentLogId || 'Primary'}</span>
                    </div>
                    <div class="compare-selectors">
                        <div class="selector-field">
                            <label>Fight A</label>
                            <select id="compareFightA" onchange="window.updateCompareSelection()" class="forever-select">
                                <option value="">-- Select Fight A --</option>
                                ${fightsA}
                            </select>
                        </div>
                        <div class="selector-field">
                            <label>Player A</label>
                            <select id="comparePlayerA" onchange="window.updateCompareSelection()" class="forever-select">
                                <option value="">-- Select Player A --</option>
                                ${playersA}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Side B -->
                ${logBSection}
            </div>

            <!-- Contenido Comparativo Resultante -->
            <div class="compare-results">
                ${comparisonContent}
            </div>
        </div>
    `;

    // Refresh Wowhead tooltips
    if (typeof window.$WowheadPower !== 'undefined') {
        window.$WowheadPower.refreshLinks();
    }
}

function buildFightsOptions(report, selectedId) {
    let html = `<option value="overall" ${selectedId === 'overall' ? 'selected' : ''}>Overall (All fights)</option>`;
    if (!report || !report.fights) return html;

    let wipeCounts = {};
    const bossFights = report.fights.filter(f => f.kill === true || f.kill === false || f.difficulty);
    bossFights.forEach(f => {
        let wipeNum = '';
        if (!f.kill) {
            wipeCounts[f.name] = (wipeCounts[f.name] || 0) + 1;
            wipeNum = ` (Wipe #${wipeCounts[f.name]})`;
        } else {
            wipeNum = ' (Kill)';
        }
        const isSel = String(selectedId) === String(f.id) ? 'selected' : '';
        html += `<option value="${f.id}" ${isSel}>${escapeHtml(f.name)}${wipeNum} - ${formatDuration(f.endTime - f.startTime)}</option>`;
    });
    return html;
}

function buildPlayersOptions(actors, selectedPlayer) {
    if (!actors || !Array.isArray(actors)) return '';
    const sorted = [...actors].sort((a, b) => a.name.localeCompare(b.name));
    return sorted.map(a => {
        const isSel = selectedPlayer === a.name ? 'selected' : '';
        return `<option value="${escapeHtml(a.name)}" ${isSel}>${escapeHtml(a.name)} (${a.subType || 'Unknown'})</option>`;
    }).join('');
}

function extractFightEvents(allEvents, report, fightId) {
    if (fightId === 'overall') {
        const validIds = new Set((report.fights || []).map(f => f.id));
        return allEvents.filter(ev => ev.type === 'combatantinfo' || validIds.has(ev.fight));
    }
    const fightInfo = (report.fights || []).find(f => String(f.id) === String(fightId));
    if (!fightInfo) return [];

    const cis = [];
    const regs = [];
    allEvents.forEach(ev => {
        if (ev.type === 'combatantinfo') {
            if (ev.timestamp <= fightInfo.startTime + 15000 && ev.timestamp >= fightInfo.startTime - 180000) {
                cis.push(ev);
            }
        } else if (ev.timestamp >= (fightInfo.startTime - 15000) && ev.timestamp <= (fightInfo.endTime + 5000)) {
            regs.push(ev);
        }
    });
    return [...cis, ...regs].sort((a, b) => a.timestamp - b.timestamp);
}

function generateFullComparison() {
    const pNameA = state.compareState.playerA;
    const pNameB = state.compareState.playerB;
    const fIdA = state.compareState.fightA;
    const fIdB = state.compareState.fightB;

    const actorA = (state.currentActors || []).find(a => a.name === pNameA);
    const actorB = (state.compareLogB.actors || []).find(a => a.name === pNameB);

    if (!actorA || !actorB) {
        return '<p class="compare-error">One of the selected players could not be found.</p>';
    }

    const eventsA = extractFightEvents(state.currentEvents, state.currentReport, fIdA);
    const eventsB = extractFightEvents(state.compareLogB.events, state.compareLogB.report, fIdB);

    const dataA = processPlayerData(fIdA, eventsA, actorA);
    const dataB = processPlayerData(fIdB, eventsB, actorB);

    // Calculate fight duration
    const getFightDurationSec = (report, fId) => {
        if (fId === 'overall') {
            return (report.fights || []).reduce((acc, f) => acc + ((f.endTime - f.startTime) / 1000), 0) || 1;
        }
        const f = (report.fights || []).find(x => String(x.id) === String(fId));
        return f ? Math.max(1, (f.endTime - f.startTime) / 1000) : 1;
    };

    const durA = getFightDurationSec(state.currentReport, fIdA);
    const durB = getFightDurationSec(state.compareLogB.report, fIdB);

    // Damage and cast totals
    const totalDmgA = Object.values(dataA.spells || {}).reduce((acc, s) => acc + (s.damage || 0), 0);
    const totalDmgB = Object.values(dataB.spells || {}).reduce((acc, s) => acc + (s.damage || 0), 0);

    const totalCastsA = Object.values(dataA.spells || {}).reduce((acc, s) => acc + (s.count || 0), 0);
    const totalCastsB = Object.values(dataB.spells || {}).reduce((acc, s) => acc + (s.count || 0), 0);

    const cpmA = ((totalCastsA / durA) * 60).toFixed(1);
    const cpmB = ((totalCastsB / durB) * 60).toFixed(1);

    const deathsA = dataA.deaths ? dataA.deaths.length : 0;
    const deathsB = dataB.deaths ? dataB.deaths.length : 0;

    // Diff badge helper
    const makeDiffBadge = (valA, valB, format = 'num', invertGood = false) => {
        const diff = valA - valB;
        if (diff === 0) return '<span class="diff-badge diff-neutral">= 0</span>';
        const isBetter = invertGood ? (diff < 0) : (diff > 0);
        const colorClass = isBetter ? 'diff-positive' : 'diff-negative';
        const sign = diff > 0 ? '+' : '';
        let text = `${sign}${diff}`;
        if (format === 'percent' && valB > 0) {
            const pct = ((diff / valB) * 100).toFixed(1);
            text = `${sign}${pct}%`;
        }
        return `<span class="diff-badge ${colorClass}">${text}</span>`;
    };

    // 1. KPI Summary Cards
    const kpiCardsHtml = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Recorded Ability Damage</div>
                <div class="kpi-compare-values">
                    <span class="val-a">${totalDmgA.toLocaleString()}</span>
                    <span class="val-vs">vs</span>
                    <span class="val-b">${totalDmgB.toLocaleString()}</span>
                </div>
                <div class="kpi-diff">${makeDiffBadge(totalDmgA, totalDmgB, 'percent')}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-label">Casts Per Minute (CPM)</div>
                <div class="kpi-compare-values">
                    <span class="val-a">${cpmA}</span>
                    <span class="val-vs">vs</span>
                    <span class="val-b">${cpmB}</span>
                </div>
                <div class="kpi-diff">${makeDiffBadge(parseFloat(cpmA), parseFloat(cpmB))}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-label">Total Ability Casts</div>
                <div class="kpi-compare-values">
                    <span class="val-a">${totalCastsA}</span>
                    <span class="val-vs">vs</span>
                    <span class="val-b">${totalCastsB}</span>
                </div>
                <div class="kpi-diff">${makeDiffBadge(totalCastsA, totalCastsB)}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-label">Combat Deaths</div>
                <div class="kpi-compare-values">
                    <span class="val-a">${deathsA}</span>
                    <span class="val-vs">vs</span>
                    <span class="val-b">${deathsB}</span>
                </div>
                <div class="kpi-diff">${makeDiffBadge(deathsA, deathsB, 'num', true)}</div>
            </div>
        </div>
    `;

    // 2. Abilities Comparison Table
    const allSpellKeys = new Set([
        ...Object.keys(dataA.spells || {}),
        ...Object.keys(dataB.spells || {})
    ]);

    const spellRows = Array.from(allSpellKeys).map(sId => {
        const sA = dataA.spells?.[sId] || { count: 0, damage: 0 };
        const sB = dataB.spells?.[sId] || { count: 0, damage: 0 };
        const spellInfo = SPELL_DB?.[sId] || { name: `Spell #${sId}`, icon: 'inv_misc_questionmark' };

        const avgA = sA.count > 0 ? Math.round(sA.damage / sA.count) : 0;
        const avgB = sB.count > 0 ? Math.round(sB.damage / sB.count) : 0;
        const countDiff = sA.count - sB.count;
        const countClass = countDiff > 0 ? 'diff-positive' : (countDiff < 0 ? 'diff-negative' : 'diff-neutral');

        return `
            <tr class="compare-row">
                <td class="spell-cell">
                    <img class="spell-icon" src="/api/icon/${spellInfo.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
                    <span class="spell-name">${escapeHtml(spellInfo.name)}</span>
                </td>
                <td class="num-cell val-a">${sA.count}</td>
                <td class="num-cell val-b">${sB.count}</td>
                <td class="diff-cell"><span class="diff-badge ${countClass}">${countDiff > 0 ? '+' : ''}${countDiff}</span></td>
                <td class="num-cell val-a">${sA.damage ? sA.damage.toLocaleString() : '-'}</td>
                <td class="num-cell val-b">${sB.damage ? sB.damage.toLocaleString() : '-'}</td>
                <td class="num-cell">${avgA ? avgA.toLocaleString() : '-'} vs ${avgB ? avgB.toLocaleString() : '-'}</td>
            </tr>
        `;
    }).join('');

    const abilitiesTableHtml = `
        <div class="compare-table-section">
            <h3 class="section-title">⚔️ Ability Breakdown & Rotation</h3>
            <div class="table-wrapper">
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th>Ability</th>
                            <th>Casts (A)</th>
                            <th>Casts (B)</th>
                            <th>Difference</th>
                            <th>Damage (A)</th>
                            <th>Damage (B)</th>
                            <th>Avg Damage (A vs B)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${spellRows || '<tr><td colspan="7" class="text-center">No active abilities recorded.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    return `
        <div class="comparison-view-active">
            ${kpiCardsHtml}
            ${abilitiesTableHtml}
        </div>
    `;
}
