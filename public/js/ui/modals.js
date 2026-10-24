// public/js/ui/modals.js
// Re-exports from modular modal and inspector components

export { toggleGearInline, closeGearModal } from './gearInspector.js';
export { toggleCastsDebuffInline } from './castsDebuffPanel.js';
export { toggleTimelineInline, generateTimelineHTML } from './timelinePanel.js';
export { 
    getWebhookProfiles, 
    saveWebhookProfiles, 
    renderWebhookProfiles, 
    showWebhookForm, 
    hideWebhookForm, 
    saveWebhookProfile, 
    editWebhookProfile, 
    deleteWebhookProfile, 
    sendToWebhookProfile, 
    enviarADiscord, 
    closeDiscordModal 
} from './discordModal.js';
