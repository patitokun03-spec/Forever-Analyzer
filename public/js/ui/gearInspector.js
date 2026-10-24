// public/js/ui/gearInspector.js
// Gear Inspector (paperdoll, slots 0-18, enchants validation, Wowhead links)

import { state } from '../state.js';
import { ENCHANT_DB, OPTIMAL_ENCHANTS } from '../gameData.js';

export function toggleGearInline(playerName, encounterId, className, specName) {
    const container = document.getElementById('inlineGearContainer');
    if (container.style.display === 'flex') {
        container.style.display = 'none';
        state.openPanels.gear = false;
        return;
    }
    
    // Hide timeline if open (gear is exclusive with timeline)
    const timelineContainer = document.getElementById('inlineTimelineContainer');
    if (timelineContainer) timelineContainer.style.display = 'none';
    // Note: Casts/Debuff panel stays open — both Gear and Casts/Debuff can be open at the same time

    container.style.display = 'flex';
    state.openPanels.gear = true;
    container.innerHTML = '<p style="color:#aaa;">Loading gear...</p>';

    const gear = (state.playerGearDB && state.playerGearDB[encounterId] && state.playerGearDB[encounterId][playerName]) ? state.playerGearDB[encounterId][playerName] : [];

    if (!gear || gear.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#aaa; padding:20px; width:100%;">No gear data available for this encounter.</p>`;
        return;
    }

    const groups = [
        { title: "Armor", slots: [0, 2, 14, 4, 8, 9, 5, 6, 7] },
        { title: "Jewelry", slots: [1, 10, 11, 12, 13] },
        { title: "Weapons", slots: [15, 16, 17] }
    ];

    let groupHtmlMap = { "Armor": "", "Jewelry": "", "Weapons": "" };
    let allGearIds = gear.filter(g => g && g.id !== 0).map(g => g.id).join(':');

    const ring1 = gear[10];
    const ring2 = gear[11];
    const isEnchanter = (
        (ring1 && ring1.id !== 0 && (ring1.permanentEnchant || ring1.enchant)) ||
        (ring2 && ring2.id !== 0 && (ring2.permanentEnchant || ring2.enchant))
    );

    for (let i = 0; i <= 18; i++) {
        let item = gear[i];

        if (item && item.id !== 0) {
            let iconUrlStr = item.icon ? item.icon.toLowerCase().replace(/\s+/g, '_').replace(/\.jpg$/i, '') : '';
            let iconUrl = iconUrlStr ? `/api/icon/${iconUrlStr}.jpg` : '/api/icon/inv_misc_questionmark.jpg';

            let wowheadParams = `item=${item.id}&pcs=${allGearIds}`;
            let gemsHtml = '';
            let gemsTableHtml = '';
            if (item.gems && item.gems.length > 0) {
                let gemIdsStr = item.gems.map(g => g.id).join(':');
                wowheadParams += `&gems=${gemIdsStr}`;

                item.gems.forEach((g, gemIdx) => {
                    let gemIconStr = g.icon ? g.icon.toLowerCase().replace(/\s+/g, '_').replace(/\.jpg$/i, '') : 'inv_misc_questionmark';
                    let isMetaGem = (i === 0 && gemIdx === 0);
                    let gemClass = isMetaGem ? 'paperdoll-gem-icon meta-gem' : 'paperdoll-gem-icon';
                    let gemTableClass = isMetaGem ? 'socket-icon meta-gem' : 'socket-icon';
                    let linkStyle = isMetaGem ? 'display:inline-block; line-height:0;' : 'display:inline-block; line-height:0; border-radius:50%;';
                    let linkTableStyle = isMetaGem ? 'display:inline-block; line-height:0; margin:0 1px;' : 'display:inline-block; line-height:0; border-radius:50%; margin:0 1px;';
                    gemsHtml += `<a href="https://www.wowhead.com/forever/item=${g.id}" onclick="event.preventDefault();" data-wowhead="item=${g.id}&domain=forever" data-wh-rename-link="false" data-wh-icon-size="none" style="${linkStyle}"><img class="${gemClass}" src="/api/icon/${gemIconStr}.jpg" onerror="this.style.display='none'"></a>`;
                    gemsTableHtml += `<a href="https://www.wowhead.com/forever/item=${g.id}" onclick="event.preventDefault();" data-wowhead="item=${g.id}&domain=forever" data-wh-rename-link="false" data-wh-icon-size="none" style="${linkTableStyle}"><img class="${gemTableClass}" src="/api/icon/${gemIconStr}.jpg" onerror="this.style.display='none'"></a>`;
                });
            }

            let permEnchant = item.permanentEnchant || item.enchant;
            let rawEnchant = permEnchant;
            let enchantHtml = '';
            let slotId = i + 1;

            function isEnchantable(sId) {
                const validSlots = [1, 3, 5, 7, 8, 9, 10, 15, 16, 17];
                return validSlots.includes(sId);
            }

            let needsEnchant = isEnchantable(slotId);

            if ((i === 10 || i === 11) && isEnchanter) {
                needsEnchant = true;
            }

            if (slotId === 17) {
                const itemName = (item.name || "").toLowerCase();
                const itemType = (item.type || "").toLowerCase();
                const itemSubType = (item.subType || "").toLowerCase();
                if (!itemName.includes("shield") && !itemType.includes("shield") && !itemType.includes("weapon") && !itemSubType.includes("shield")) {
                    needsEnchant = false;
                }
            }

            if (needsEnchant && (typeof permEnchant === 'undefined' || !permEnchant || permEnchant === 0)) {
                enchantHtml = `<span style="color: #ff5252; font-weight:bold;">Slacking</span>`;
            } else if (rawEnchant && rawEnchant !== 0) {
                wowheadParams += `&ench=${rawEnchant}`;
                let color = "#ff5252";
                if (typeof OPTIMAL_ENCHANTS !== 'undefined' && OPTIMAL_ENCHANTS[specName]) {
                    const enchData = OPTIMAL_ENCHANTS[specName];
                    if (enchData.best && enchData.best.includes(rawEnchant)) {
                        color = "#4caf50";
                    } else if (enchData.alt && enchData.alt.includes(rawEnchant)) {
                        color = "#f4b400";
                    }
                }
                if (ENCHANT_DB && ENCHANT_DB[rawEnchant]) {
                    enchantHtml = `<span style="color: ${color};">${ENCHANT_DB[rawEnchant].name}</span>`;
                } else {
                    enchantHtml = `<a href="https://www.wowhead.com/forever/enchant=${rawEnchant}" data-wowhead="domain=forever" style="color: ${color}; text-decoration:none; pointer-events: none;">Enchant #${rawEnchant}</a>`;
                }
            }

            wowheadParams += `&domain=forever`;

            let qClass = '', iconClass = '';
            if (item.quality === 4) { qClass = 'q-epic'; iconClass = 'icon-q4'; }
            else if (item.quality === 3) { qClass = 'q-rare'; iconClass = 'icon-q3'; }
            else if (item.quality === 5) { qClass = 'q-legendary'; iconClass = 'icon-q5'; }
            else if (item.quality === 2) { qClass = 'q-uncommon'; iconClass = 'icon-q2'; }

            let fallbackWowhead = iconUrlStr ? `https://wow.zamimg.com/images/wow/icons/large/${iconUrlStr}.jpg` : '/api/icon/inv_misc_questionmark.jpg';

            let rowHtml = `
                <div class="gear-table-row">
                    <div class="gear-table-icon-group">
                        <a href="https://www.wowhead.com/forever/item=${item.id}" onclick="event.preventDefault();" data-wowhead="${wowheadParams}" data-wh-rename-link="false" data-wh-icon-size="none" style="display:block; text-decoration:none;">
                            <img class="gear-table-icon ${iconClass}" src="${iconUrl}" onerror="this.src='${fallbackWowhead}'; this.onerror=function(){this.src='/api/icon/inv_misc_questionmark.jpg'};">
                        </a>
                    </div>
                    <div class="gear-table-details">
                        <span class="gear-table-name ${qClass}" style="background-image:none !important; padding-left:0 !important;">
                            <a href="https://www.wowhead.com/forever/item=${item.id}" onclick="event.preventDefault();" data-wowhead="domain=forever" data-wh-rename-link="true" class="item-name-no-tooltip">...</a>
                        </span>
                        ${enchantHtml ? `<div class="gear-table-enchants">${enchantHtml}</div>` : ''}
                    </div>
                </div>`;

            groups.forEach(group => {
                if (group.slots.includes(i)) groupHtmlMap[group.title] += rowHtml;
            });

        }
    }

    let tableHtml = `
        <div class="gear-column" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <div class="table-section-title">Armor</div>
            ${groupHtmlMap["Armor"]}
        </div>
        <div class="gear-column" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <div class="table-section-title">Jewelry</div>
            ${groupHtmlMap["Jewelry"]}
        </div>
        <div class="gear-column" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
            <div class="table-section-title">Weapons</div>
            ${groupHtmlMap["Weapons"]}
        </div>
    `;

    const contentHtmlStr = `
        <div class="gear-modal-content" style="display:flex; width:100%; gap:15px; padding-top: 10px;">
            ${tableHtml}
        </div>
    `;

    container.innerHTML = contentHtmlStr;

    if (typeof window.$WowheadPower !== 'undefined') {
        window.$WowheadPower.refreshLinks();
    }
}

export function closeGearModal() {
    const overlay = document.getElementById('gearOverlay');
    if (overlay) overlay.classList.remove('is-open');
}
