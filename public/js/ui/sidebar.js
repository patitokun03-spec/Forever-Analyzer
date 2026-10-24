import { state } from '../state.js';
import { formatDuration, escapeHtml } from '../utils.js';
import { CLASSES, SPEC_ICONS } from '../gameData.js';

const BOSS_TO_RAID = {
    // Molten Core
    'Lucifron': 'Molten Core',
    'Magmadar': 'Molten Core',
    'Gehennas': 'Molten Core',
    'Garr': 'Molten Core',
    'Baron Geddon': 'Molten Core',
    'Shazzrah': 'Molten Core',
    'Sulfuron Harbinger': 'Molten Core',
    'Golemagg the Incinerator': 'Molten Core',
    'Majordomo Executus': 'Molten Core',
    'Ragnaros': 'Molten Core',
    // Onyxia
    'Onyxia': "Onyxia's Lair",
    // Blackwing Lair
    'Razorgore the Untamed': 'Blackwing Lair',
    'Vaelastrasz the Corrupt': 'Blackwing Lair',
    'Broodlord Lashlayer': 'Blackwing Lair',
    'Firemaw': 'Blackwing Lair',
    'Ebonroc': 'Blackwing Lair',
    'Flamegor': 'Blackwing Lair',
    'Chromaggus': 'Blackwing Lair',
    'Nefarian': 'Blackwing Lair',
    // Zul'Gurub
    'High Priestess Jeklik': "Zul'Gurub",
    'High Priest Venoxis': "Zul'Gurub",
    'High Priestess Mar\'li': "Zul'Gurub",
    'High Priest Thekal': "Zul'Gurub",
    'High Priestess Arlokk': "Zul'Gurub",
    'Hakkar': "Zul'Gurub",
    'Bloodlord Mandokir': "Zul'Gurub",
    'Jin\'do the Hexxar': "Zul'Gurub",
    'Gahz\'ranka': "Zul'Gurub",
    // Ruins of Ahn'Qiraj (AQ20)
    'Kurinnaxx': 'Ruins of Ahn\'Qiraj',
    'General Rajaxx': 'Ruins of Ahn\'Qiraj',
    'Moam': 'Ruins of Ahn\'Qiraj',
    'Buru the Gorger': 'Ruins of Ahn\'Qiraj',
    'Ayamiss the Hunter': 'Ruins of Ahn\'Qiraj',
    'Ossirian the Unscarred': 'Ruins of Ahn\'Qiraj',
    // Temple of Ahn'Qiraj (AQ40)
    'The Prophet Skeram': 'Temple of Ahn\'Qiraj',
    'Silithid Royalty': 'Temple of Ahn\'Qiraj',
    'Battleguard Sartura': 'Temple of Ahn\'Qiraj',
    'Fankriss the Unyielding': 'Temple of Ahn\'Qiraj',
    'Viscidus': 'Temple of Ahn\'Qiraj',
    'Princess Huhuran': 'Temple of Ahn\'Qiraj',
    'Twin Emperors': 'Temple of Ahn\'Qiraj',
    'Ouro': 'Temple of Ahn\'Qiraj',
    'C\'Thun': 'Temple of Ahn\'Qiraj',
    // Naxxramas
    'Anub\'Rekhan': 'Naxxramas',
    'Grand Widow Faerlina': 'Naxxramas',
    'Maexxna': 'Naxxramas',
    'Noth the Plaguebringer': 'Naxxramas',
    'Heigan the Unclean': 'Naxxramas',
    'Loatheb': 'Naxxramas',
    'Instructor Razuvious': 'Naxxramas',
    'Gothik the Harvester': 'Naxxramas',
    'The Four Horsemen': 'Naxxramas',
    'Patchwerk': 'Naxxramas',
    'Grobbulus': 'Naxxramas',
    'Gluth': 'Naxxramas',
    'Thaddius': 'Naxxramas',
    'Sapphiron': 'Naxxramas',
    'Kel\'Thuzad': 'Naxxramas',
};

export function renderFightsSidebar(report) {
    const fightsList = document.getElementById('fightsList');
    let html = '';

    // OVERALL entry at top
    html += `<div class="fight-item" data-fight="overall" onclick="window.selectFight('overall')">
        <div class="fight-info">
            <div class="fight-name">Overall</div>
            <div class="fight-status fight-status-overall">ALL FIGHTS</div>
        </div>
    </div>`;

    // Group individual boss fights by raid
    const bossFights = report.fights.filter(f => f.kill === true || f.kill === false || f.difficulty);
    const raidGroups = {};
    const wipeCounts = {};

    bossFights.forEach(fight => {
        let raidName = fight.zoneName || BOSS_TO_RAID[fight.name] || 'Other Encounters';
        if (!raidGroups[raidName]) raidGroups[raidName] = [];
        raidGroups[raidName].push(fight);
    });

    Object.entries(raidGroups).forEach(([raidName, fights]) => {
        html += `<div class="sidebar-raid-group">
            <div class="sidebar-raid-header">▼ ${escapeHtml(raidName)}</div>`;

        fights.forEach(fight => {
            const duration = fight.endTime - fight.startTime;
            const timeStr = formatDuration(duration);
            const isKill = fight.kill;
            const statusClass = isKill ? 'fight-status-kill' : 'fight-status-wipe';
            const statusText = isKill ? 'KILL' : 'WIPE';

            let wipeNum = '';
            if (!isKill) {
                wipeCounts[fight.name] = (wipeCounts[fight.name] || 0) + 1;
                wipeNum = ` #${wipeCounts[fight.name]}`;
            }

            html += `<div class="fight-item" data-fight="${fight.id}" onclick="window.selectFight('${fight.id}')">
                <div class="fight-info">
                    <div class="fight-name">${escapeHtml(fight.name)}${wipeNum}</div>
                    <div class="fight-status ${statusClass}">${statusText}</div>
                </div>
                <div class="fight-time">${timeStr}</div>
            </div>`;
        });

        html += `</div>`;
    });

    fightsList.innerHTML = html;
}

export function renderPlayersSidebar(allActors) {
    const playersList = document.getElementById('playersList');

    // "All" option at the top
    let html = `<div class="player-item all-player-item" data-player="__ALL__" onclick="window.selectPlayer('__ALL__')">
        <img src="/api/icon/spell_holy_prayerofspirit.jpg" class="all-player-img" alt="All">
        <span class="all-player-label">All</span>
    </div>`;

    // Sort by class order, then by spec, then by name
    const sorted = [...allActors].sort((a, b) => {
        const ci = CLASSES.indexOf(a.subType) - CLASSES.indexOf(b.subType);
        if (ci !== 0) return ci;
        const specA = state.detectedSpecs[a.name] || a.subType;
        const specB = state.detectedSpecs[b.name] || b.subType;
        const si = specA.localeCompare(specB);
        if (si !== 0) return si;
        return a.name.localeCompare(b.name);
    });

    html += sorted.map(player => {
        const spec = state.detectedSpecs[player.name] || player.subType;
        const specIcon = SPEC_ICONS[spec] || SPEC_ICONS[player.subType] || 'inv_misc_questionmark';
        const className = player.subType;
        // Escape single quotes in player names for onclick
        const safeName = player.name.replace(/'/g, "\\'");
        return `<div class="player-item" data-player="${escapeHtml(player.name)}" onclick="window.selectPlayer('${safeName}')">
            <img src="/api/icon/${specIcon}.jpg" class="player-item-icon" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
            <span class="${className}-color">${player.name}</span>
        </div>`;
    }).join('');

    playersList.innerHTML = html;
}
