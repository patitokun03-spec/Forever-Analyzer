import { state } from '../state.js';
import { BUFF_DB, ENCHANT_DB } from '../gameData.js';

export function parseCombatantInfo(fightId, fightEvents, player, ctx, SEAL_TO_TYPE) {
    fightEvents.forEach(ev => {
        if (ev.type === 'combatantinfo' && ev.sourceID === player.id) {
            if (ev.timestamp - ctx.lastCiTimestamp <= 30000) return;
            ctx.lastCiTimestamp = ev.timestamp;
            ctx.combatantInfos.push(ev.auras ? ev.auras.map(a => a.ability) : []);

            if (ev.auras) {
                ev.auras.forEach(aura => {
                    const spellId = aura.ability;
                    if (SEAL_TO_TYPE[spellId]) {
                        ctx.activeSeal = SEAL_TO_TYPE[spellId];
                    }
                    if (BUFF_DB[spellId]) {
                        let isConsumable = BUFF_DB[spellId].category === 5 || BUFF_DB[spellId].order === 70;
                        if (isConsumable) {
                            ctx.prePots[spellId] = (ctx.prePots[spellId] || 0) + 1;
                        }
                    }
                });
            }

            if (ev.gear && ev.gear.length > 0) {
                if (!state.playerGearDB[fightId]) state.playerGearDB[fightId] = {};
                state.playerGearDB[fightId][player.name] = ev.gear;

                let enchants = [];
                let weapons = 1;
                let offHand = ev.gear[16];
                if (['Rogue', 'Hunter', 'Warrior', 'Shaman'].includes(player.subType)) {
                    if (offHand && offHand.id !== 0 && offHand.icon) {
                        let iconName = offHand.icon.toLowerCase();
                        let isWeapon = iconName.includes('sword') || iconName.includes('axe') ||
                            iconName.includes('mace') || iconName.includes('hammer') ||
                            iconName.includes('dagger') || iconName.includes('fist') ||
                            iconName.includes('blade') || iconName.includes('knife') ||
                            iconName.includes('weapon');
                        if (isWeapon) weapons = 2;
                    }
                }

                [15, 16].forEach(slotIdx => {
                    let item = ev.gear[slotIdx];
                    if (item && item.id !== 0) {
                        let rawEnchant = item.temporaryEnchant || item.tempEnchant;
                        if (!state.playerEnchantsForConsole[player.name]) state.playerEnchantsForConsole[player.name] = new Set();
                        if (rawEnchant) state.playerEnchantsForConsole[player.name].add(rawEnchant);
                        if (rawEnchant && ENCHANT_DB[rawEnchant]) {
                            enchants.push(rawEnchant);
                        }
                    }
                });
                ctx.tempEnchants.push({ enchants, weapons });
            }
        }

        let isBuffTarget = ['applybuff', 'applybuffstack', 'refreshbuff'].includes(ev.type) && ev.targetID === player.id;
        let isCastSource = ev.type === 'cast' && ev.sourceID === player.id;

        if (isBuffTarget || isCastSource) {
            if (BUFF_DB[ev.abilityGameID]) {
                if (ctx.combatantInfos.length > 0) {
                    let lastInfos = ctx.combatantInfos[ctx.combatantInfos.length - 1];
                    if (!lastInfos.includes(ev.abilityGameID)) {
                        lastInfos.push(ev.abilityGameID);
                    }
                }
            }
        }
    });
}
