// public/js/ui/discordModal.js
// Discord Webhook integration and modal management

import { state } from '../state.js';
import { escapeHtml } from '../utils.js';

let _editingWebhookId = null;

export function getWebhookProfiles() {
    try { return JSON.parse(localStorage.getItem('discord_webhooks') || '[]'); }
    catch { return []; }
}

export function saveWebhookProfiles(profiles) {
    localStorage.setItem('discord_webhooks', JSON.stringify(profiles));
}

export function renderWebhookProfiles() {
    const list = document.getElementById('webhookProfilesList');
    if (!list) return;
    const profiles = getWebhookProfiles();
    if (profiles.length === 0) { list.innerHTML = ''; return; }

    list.innerHTML = profiles.map(p => `
        <div class="webhook-profile-card">
            <div class="webhook-profile-info">
                <div class="webhook-profile-name">💬 ${escapeHtml(p.name)}</div>
                <div class="webhook-profile-url">${escapeHtml(p.url)}</div>
            </div>
            <div class="webhook-profile-actions">
                <button class="webhook-btn-send" onclick="window.sendToWebhookProfile('${p.id}')">▶ Send</button>
                <button class="webhook-btn-edit" onclick="window.editWebhookProfile('${p.id}')">✏</button>
                <button class="webhook-btn-delete" onclick="window.deleteWebhookProfile('${p.id}')">🗑</button>
            </div>
        </div>
    `).join('');
}

export function showWebhookForm(editId = null) {
    _editingWebhookId = editId;
    const form = document.getElementById('webhookForm');
    const section = document.querySelector('.webhook-profiles-section');
    const formTitle = document.getElementById('webhookFormTitle');
    const nameInput = document.getElementById('webhookNameInput');
    const urlInput = document.getElementById('discordWebhookInput');

    if (editId) {
        const profiles = getWebhookProfiles();
        const p = profiles.find(x => x.id === editId);
        if (p) { nameInput.value = p.name; urlInput.value = p.url; }
        formTitle.textContent = '✏️ Edit Profile';
    } else {
        nameInput.value = ''; urlInput.value = '';
        formTitle.textContent = '➕ New Profile';
    }
    if (section) section.style.display = 'none';
    if (form) {
        form.style.display = 'flex';
        nameInput.focus();
    }
}

export function hideWebhookForm() {
    _editingWebhookId = null;
    const form = document.getElementById('webhookForm');
    const section = document.querySelector('.webhook-profiles-section');
    if (form) form.style.display = 'none';
    if (section) section.style.display = 'flex';
}

export function saveWebhookProfile() {
    const name = document.getElementById('webhookNameInput').value.trim();
    const url = document.getElementById('discordWebhookInput').value.trim();

    if (!name) {
        document.getElementById('webhookNameInput').focus();
        document.getElementById('webhookNameInput').style.borderColor = '#ff5252';
        setTimeout(() => document.getElementById('webhookNameInput').style.borderColor = '', 2000);
        return;
    }
    if (!url || !url.includes('discord.com/api/webhooks/')) {
        document.getElementById('discordWebhookInput').focus();
        document.getElementById('discordWebhookInput').style.borderColor = '#ff5252';
        setTimeout(() => document.getElementById('discordWebhookInput').style.borderColor = '', 2000);
        return;
    }

    const profiles = getWebhookProfiles();
    if (_editingWebhookId) {
        const idx = profiles.findIndex(x => x.id === _editingWebhookId);
        if (idx !== -1) { profiles[idx].name = name; profiles[idx].url = url; }
    } else {
        profiles.push({ id: Date.now().toString(), name, url });
    }
    saveWebhookProfiles(profiles);
    hideWebhookForm();
    renderWebhookProfiles();
}

export function editWebhookProfile(id) { showWebhookForm(id); }

export function deleteWebhookProfile(id) {
    const profiles = getWebhookProfiles().filter(x => x.id !== id);
    saveWebhookProfiles(profiles);
    renderWebhookProfiles();
}

export async function sendToWebhookProfile(id) {
    const profiles = getWebhookProfiles();
    const p = profiles.find(x => x.id === id);
    if (!p) return;

    const btn = document.querySelector(`.webhook-profile-card .webhook-btn-send[onclick*="${id}"]`);
    if (btn) { btn.textContent = '⏳ Sending...'; btn.disabled = true; }

    const logId = state.currentLogId;
    const reportUrl = `${window.location.origin}/report/${logId}`;
    const msg = {
        embeds: [{
            title: "⚔️ WoW Forever Log Analyzer - Audit",
            description: `${state.currentLogTitle || logId}\n\n📊 [**View Full Audit**](${reportUrl})\n📜 [**Original Report**](${reportUrl})`,
            color: 13938487
        }]
    };

    try {
        const resp = await fetch(p.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
        if (resp.ok || resp.status === 204) {
            if (btn) { btn.textContent = '✅ Sent!'; setTimeout(() => { btn.textContent = '▶ Send'; btn.disabled = false; }, 2000); }
        } else { throw new Error(`HTTP ${resp.status}`); }
    } catch (e) {
        if (btn) { btn.textContent = '❌ Error'; setTimeout(() => { btn.textContent = '▶ Send'; btn.disabled = false; }, 2500); }
    }
}

export function enviarADiscord() {
    const overlay = document.getElementById('discordOverlay');
    if (overlay) overlay.classList.add('is-open');
    hideWebhookForm();
    renderWebhookProfiles();
}

export function closeDiscordModal() {
    const overlay = document.getElementById('discordOverlay');
    if (overlay) overlay.classList.remove('is-open');
    hideWebhookForm();
}
