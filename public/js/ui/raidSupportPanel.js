// public/js/ui/raidSupportPanel.js
// Renders the Raid Support view (Boss Debuffs & Party/Raid Buffs) inspired by Image 1.

import { escapeHtml } from '../utils.js';

export function renderRaidSupportHtml(raidSupportData) {
    const { bossDebuffs, raidBuffs } = raidSupportData;

    let html = `
        <div class="rs-wrapper">
            <div class="rs-header">
                <div class="rs-title">🛡️ RAID SUPPORT</div>
                <div class="rs-badge">Not Graded</div>
            </div>

            <!-- SECTION 1: BOSS DEBUFFS -->
            <div class="rs-section">
                <div class="rs-section-title">BOSS DEBUFFS</div>`;

    Object.entries(bossDebuffs).forEach(([name, d]) => {
        const isApplied = d.applied;
        const statusIcon = isApplied
            ? `<div class="rs-status-icon rs-status-check">✓</div>`
            : `<div class="rs-status-icon rs-status-cross">✕</div>`;

        let rightHtml = '';
        if (isApplied) {
            const barWidth = Math.max(2, d.uptimePct);
            const sourceList = Object.entries(d.sources)
                .map(([src, cnt]) => `${src} (${cnt}x)`)
                .join(', ');

            rightHtml = `
                <div class="rs-bar-wrap">
                    <div class="rs-bar-track">
                        <div class="rs-bar-fill" style="width: ${barWidth}%; background: ${d.config.color || '#10b981'};"></div>
                    </div>
                    <div class="rs-uptime-text" style="color: ${d.config.color || '#10b981'};">${d.uptimePct}% uptime</div>
                </div>
                <div class="rs-sources" title="${escapeHtml(sourceList)}">${escapeHtml(sourceList)}</div>
            `;
        } else {
            rightHtml = `<div class="rs-uptime-text" style="color:#555;">0% uptime</div>`;
        }

        html += `
            <div class="rs-row ${isApplied ? 'applied' : 'missing'}">
                <div class="rs-left">
                    ${statusIcon}
                    <img class="rs-spell-icon" src="/api/icon/${d.config.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
                    <span class="rs-spell-name">${escapeHtml(name)}</span>
                </div>
                <div class="rs-right">
                    ${rightHtml}
                </div>
            </div>
        `;
    });

    html += `
            </div>

            <!-- SECTION 2: PARTY & RAID BUFFS -->
            <div class="rs-section">
                <div class="rs-section-title">PARTY & RAID BUFFS</div>`;

    Object.entries(raidBuffs).forEach(([name, b]) => {
        const isApplied = b.applied;
        const statusIcon = isApplied
            ? `<div class="rs-status-icon rs-status-check">✓</div>`
            : `<div class="rs-status-icon rs-status-cross">✕</div>`;

        let rightHtml = '';
        if (isApplied) {
            const barWidth = Math.max(2, b.uptimePct);
            const sourceList = Object.entries(b.sources)
                .map(([src, cnt]) => `${src} (${cnt}x)`)
                .join(', ');

            rightHtml = `
                <div class="rs-bar-wrap">
                    <div class="rs-bar-track">
                        <div class="rs-bar-fill" style="width: ${barWidth}%; background: #10b981;"></div>
                    </div>
                    <div class="rs-uptime-text" style="color: #10b981;">${b.uptimePct}% uptime</div>
                </div>
                <div class="rs-sources" title="${escapeHtml(sourceList)}">${escapeHtml(sourceList)}</div>
            `;
        } else {
            rightHtml = `<div class="rs-uptime-text" style="color:#555;">0% uptime</div>`;
        }

        html += `
            <div class="rs-row ${isApplied ? 'applied' : 'missing'}">
                <div class="rs-left">
                    ${statusIcon}
                    <img class="rs-spell-icon" src="/api/icon/${b.config.icon}.jpg" onerror="this.src='/api/icon/inv_misc_questionmark.jpg'">
                    <span class="rs-spell-name">${escapeHtml(name)}</span>
                </div>
                <div class="rs-right">
                    ${rightHtml}
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}
