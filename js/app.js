/**
 * Palnau Gartenbau GmbH - Modern Neumorphic Studio Suite Engine
 * Fixed Company: Reihelberg 3, 75210 Keltern-Dietlingen
 * Tel: 07231 466641 | Email: gartenbauu@gmail.com | IBAN: DE66 6665 0085 0005 9928 34
 * Geschäftsführer: Andrei Priala
 */

// Hilfsfunktion zur Erkennung von gewerblichen Kunden / Firmenkunden (B2B)
if (typeof window.isCompanyClient !== 'function' && typeof isCompanyClient !== 'function') {
    window.isCompanyClient = function(clientOrName, explicitType) {
        if (explicitType === 'firma') return true;
        if (explicitType === 'privat') return false;
        if (clientOrName && clientOrName.clientType === 'firma') return true;
        if (clientOrName && clientOrName.clientType === 'privat') return false;

        const name = (typeof clientOrName === 'string' ? clientOrName : (clientOrName && clientOrName.name ? clientOrName.name : '')).trim();
        if (!name) return false;
        const lower = name.toLowerCase();

        const companyKeywords = [
            'gmbh', 'gbr', ' ag', ' ag.', 'ag ', ' ug', 'ug ', 'ohg', ' kg', 'kg.', 'kg ', 'partg', 'kgaa',
            'e.v.', ' e.v', ' ev ', ' ev.', 'eingetragener verein',
            'verwaltung', 'hausverwaltung', 'immobilien',
            'weingut', 'restaurant', 'gaststätte', 'hotel', 'gasthof', 'bistro', 'café', 'cafe',
            'b2b', 'firma', 'gewerbe', 'gesellschaft', 'betrieb',
            'autohaus', 'bäckerei', 'metzgerei', 'schreinerei', 'malerbetrieb', 'elektro',
            'sanitär', 'apotheke', 'praxis', 'kanzlei', 'notariat', 'steuerberater'
        ];

        return companyKeywords.some(kw => lower.includes(kw));
    };
}

// Application State
let appState = {
    docType: "rechnung", // "rechnung" | "angebot"
    docNumber: generateDocNumber("rechnung"),
    docDate: formatDateForGermanDisplay(new Date()),
    servicePeriod: getCurrentMonthGerman(),
    taxRate: 19,
    clientType: "privat", // "privat" | "firma"
    workLocation: "", // Only relevant if clientType === "firma" (Ausführungsort / Einsatzort)
    customWageNet: null, // Optionaler benutzerdefinierter Netto-Lohnkostenbetrag für Firmenkunden
    client: {
        name: "",
        street: "",
        zipCity: "",
        clientType: "privat",
        workLocation: ""
    },
    items: [
        {
            title: "Arbeitsleistung / Material",
            description: "Detaillierte Leistungsbeschreibung",
            quantity: 1,
            unit: "Std",
            price: 60.00,
            total: 60.00
        }
    ],
    notesText: "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen auf das unten genannte Bankkonto."
};

let modalActiveCategory = "all";
let modalSearchTerm = "";

// Helpers
function generateDocNumber(type) {
    const prefix = type === "angebot" ? "ANG" : "RE";
    const year = new Date().getFullYear();
    const seq = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${seq}`;
}

function formatDateForGermanDisplay(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

function getCurrentMonthGerman() {
    const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Universal In-App Confirmation Modal (100% Iframe & Cross-Device Compatible)
let activeConfirmCallback = null;

window.showAppConfirm = function(message, onConfirm, options = {}) {
    if (typeof onConfirm !== 'function') return;
    const modal = document.getElementById('app-confirm-modal');
    if (!modal) {
        // Safe fallback if modal element is not in DOM
        onConfirm();
        return;
    }

    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const okBtn = document.getElementById('confirm-modal-ok-btn');
    const cancelBtn = document.getElementById('confirm-modal-cancel-btn');

    if (titleEl) titleEl.textContent = options.title || "Löschen bestätigen";
    if (msgEl) msgEl.textContent = message;
    if (okBtn) {
        okBtn.textContent = options.confirmText || "Unwiderruflich löschen";
        okBtn.style.backgroundColor = options.btnColor || "#dc2626";
        okBtn.style.color = "#ffffff";
    }
    if (cancelBtn) cancelBtn.textContent = options.cancelText || "Abbrechen";

    activeConfirmCallback = onConfirm;

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.classList.add('open');
    });
};

window.closeAppConfirm = function() {
    const modal = document.getElementById('app-confirm-modal');
    if (modal) {
        modal.classList.remove('open');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 150);
    }
    activeConfirmCallback = null;
};

window.executeAppConfirmOk = function(e) {
    if (e) {
        try { e.preventDefault(); } catch (err) {}
    }
    const cb = activeConfirmCallback;
    window.closeAppConfirm();
    if (typeof cb === 'function') {
        try {
            cb();
        } catch (err) {
            console.error("Fehler beim Ausführen der Bestätigungs-Aktion:", err);
        }
    }
};

// ==========================================================================
// MINIMALIST 3-DOTS ACTION DROPDOWN MENUS (ARBEITSZEIT & AUSGABEN)
// ==========================================================================

window.toggleActionMenu = function(event, menuId) {
    if (event) {
        try {
            event.stopPropagation();
            event.preventDefault();
        } catch (e) {}
    }
    const targetMenu = document.getElementById(menuId);
    if (!targetMenu) return;

    const isAlreadyOpen = targetMenu.classList.contains('show');

    // Close all other open dropdowns first
    window.closeAllActionMenus();

    if (!isAlreadyOpen) {
        targetMenu.classList.add('show');
        const trigger = targetMenu.previousElementSibling;
        if (trigger && trigger.classList.contains('neu-action-menu-trigger')) {
            trigger.classList.add('active');
        }
    }
};

window.closeAllActionMenus = function() {
    document.querySelectorAll('.neu-action-menu-dropdown.show').forEach(m => {
        m.classList.remove('show');
    });
    document.querySelectorAll('.neu-action-menu-trigger.active').forEach(b => {
        b.classList.remove('active');
    });
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.neu-action-menu-wrap')) {
        window.closeAllActionMenus();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeAllActionMenus();
    }
});


// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    try { checkAuthOnLoad(); } catch (e) { console.warn("checkAuthOnLoad:", e); }
    try { initApp(); } catch (e) { console.warn("initApp:", e); }
    try { setupEventListeners(); } catch (e) { console.warn("setupEventListeners:", e); }
    try { setupCatalogModal(); } catch (e) { console.warn("setupCatalogModal:", e); }
    try { renderAll(); } catch (e) { console.warn("renderAll:", e); }
    try { updateAllAppStatesAndBadges(); } catch (e) { console.warn("updateAllAppStatesAndBadges:", e); }
});

// Universal Cross-Device Cloud Sync Event Listener
window.onPalnauCloudDataUpdated = function(info) {
    console.log("[Palnau] Remote cloud sync applied. Refreshing screens...", info);
    try {
        if (typeof updateAllAppStatesAndBadges === 'function') updateAllAppStatesAndBadges();
        if (typeof renderOverviewInvoices === 'function') renderOverviewInvoices();
        if (typeof renderQuotesOverview === 'function') renderQuotesOverview();
        if (typeof renderClientsView === 'function') renderClientsView();
        if (typeof renderQuartersView === 'function') renderQuartersView();
        if (typeof renderERechnungHub === 'function') renderERechnungHub();
        if (typeof renderLoansView === 'function') renderLoansView();
        if (typeof renderWorktimeView === 'function') renderWorktimeView();
        if (typeof renderCatalogView === 'function') renderCatalogView();

        // If an invoice is currently open in the generator, verify it still exists or was updated
        if (appState && appState.activeArchiveId) {
            const archive = getInvoicesArchive();
            const matching = archive.find(inv => String(inv.id) === String(appState.activeArchiveId));
            if (matching && typeof editInvoiceInGenerator === 'function') {
                editInvoiceInGenerator(matching.id);
            } else if (!matching) {
                // The open invoice was deleted on another device:
                // Silently reset document state without showing any confirmation dialog on this device!
                appState.activeArchiveId = null;
                if (typeof closeAppConfirm === 'function') closeAppConfirm();
                if (typeof startCleanState === 'function') {
                    startCleanState();
                }
                if (typeof renderAll === 'function') {
                    renderAll();
                }
                const badge = document.getElementById('gen-active-status-badge');
                if (badge) {
                    badge.textContent = "Modus: Neuer Beleg";
                    badge.style.borderColor = '';
                    badge.style.color = '';
                }
                const btnDeleteActive = document.getElementById('btn-delete-active-doc');
                if (btnDeleteActive) btnDeleteActive.style.display = 'none';
            }
        }
    } catch (e) {
        console.warn("Error refreshing views on cloud update:", e);
    }
};

// Multi-Tab local synchronization on same device
window.addEventListener('storage', (event) => {
    if (event.key === ARCHIVE_STORAGE_KEY || event.key === DELETED_INVOICES_KEY || event.key === 'palnau_loans_data' || event.key === 'palnau_custom_catalog') {
        if (typeof window.onPalnauCloudDataUpdated === 'function') {
            window.onPalnauCloudDataUpdated({ source: 'local-tab-storage', key: event.key });
        }
    }
});

function initApp() {
    const saved = localStorage.getItem('palnau_neu_studio_state');
    if (saved) {
        try {
            appState = JSON.parse(saved);
            if (!Array.isArray(appState.items) || appState.items.length === 0) {
                appState.items = [
                    {
                        title: "Arbeitsleistung / Material",
                        description: "Detaillierte Leistungsbeschreibung",
                        quantity: 1,
                        unit: "Std",
                        price: 60.00,
                        total: 60.00
                    }
                ];
            }
        } catch (e) {
            console.warn("Could not load draft, resetting", e);
            startCleanState();
        }
    } else {
        startCleanState();
    }
}

function startCleanState(emptyAll = false) {
    appState = {
        docType: "rechnung",
        docNumber: generateDocNumber("rechnung"),
        docDate: formatDateForGermanDisplay(new Date()),
        servicePeriod: getCurrentMonthGerman(),
        taxRate: 19,
        clientType: "privat",
        workLocation: "",
        customWageNet: null,
        client: {
            name: "",
            street: "",
            zipCity: "",
            clientType: "privat",
            workLocation: ""
        },
        items: emptyAll ? [] : [
            {
                title: "Arbeitsleistung / Material",
                description: "Detaillierte Leistungsbeschreibung",
                quantity: 1,
                unit: "Std",
                price: 60.00,
                total: 60.00
            },
            {
                title: "Arbeitsleistung / Material",
                description: "Detaillierte Leistungsbeschreibung",
                quantity: 1,
                unit: "Std",
                price: 60.00,
                total: 60.00
            }
        ],
        notesText: "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen auf das unten genannte Bankkonto."
    };
    appState.activeArchiveId = null;
    const badge = document.getElementById('gen-active-status-badge');
    if (badge) {
        badge.textContent = "Modus: Neuer Beleg";
        badge.style.borderColor = '';
        badge.style.color = '';
    }
    saveState();
}
window.startCleanState = startCleanState;

function saveState() {
    localStorage.setItem('palnau_neu_studio_state', JSON.stringify(appState));
}

// Mode Switcher (Rechnung / Angebot)
function setDocType(type) {
    if (appState.docType === type) return;
    const oldType = appState.docType;
    const oldArchiveId = appState.activeArchiveId;
    appState.docType = type;

    if (type === "angebot") {
        appState.docNumber = appState.docNumber.replace(/^RE-/, 'ANG-');
        if (!appState.docNumber.startsWith('ANG-')) {
            appState.docNumber = generateDocNumber("angebot");
        }
        appState.notesText = "Wir freuen uns über Ihr Interesse. Dieses Angebot ist freibleibend und 30 Tage ab Ausstellungsdatum gültig.";
    } else {
        appState.docNumber = appState.docNumber.replace(/^ANG-/, 'RE-');
        if (!appState.docNumber.startsWith('RE-')) {
            appState.docNumber = generateDocNumber("rechnung");
        }
        appState.notesText = "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen ab Rechnungsdatum ohne Abzug auf unser unten genanntes Bankkonto unter Angabe der Rechnungsnummer als Verwendungszweck.";

        // If an offer loaded from archive is turned into an invoice, delete the old offer from the archive
        if (oldType === 'angebot' && oldArchiveId) {
            try {
                const archive = getInvoicesArchive();
                const qIdx = archive.findIndex(i => String(i.id) === String(oldArchiveId));
                if (qIdx !== -1) {
                    archive.splice(qIdx, 1);
                    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
                    updateAllAppStatesAndBadges();
                }
            } catch (e) {
                console.warn("Could not clean old quote on type switch:", e);
            }
            appState.activeArchiveId = null;
        }
    }

    renderAll();
    saveState();
    showToast(`Umschaltung: ${type === 'angebot' ? 'Angebot' : 'Rechnung'}`);
}

// Quick Notes Preset Helper (Exposed globally)
window.setNotesPreset = function(preset) {
    if (preset === '7tage') {
        appState.notesText = "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen ab Rechnungsdatum ohne Abzug auf das unten genannte Bankkonto.";
    } else if (preset === '14tage') {
        appState.notesText = "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten genannte Bankkonto.";
    } else if (preset === '30tage') {
        appState.notesText = "Wir freuen uns über Ihr Interesse. Dieses Angebot ist freibleibend und 30 Tage ab Ausstellungsdatum gültig.";
    } else if (preset === 'skonto') {
        appState.notesText = "Zahlbar innerhalb von 7 Tagen mit 2% Skonto oder innerhalb von 14 Tagen rein netto auf das unten genannte Bankkonto.";
    } else if (preset === 'bar') {
        appState.notesText = "Betrag dankend bar erhalten bei Fertigstellung und Abnahme der Arbeiten.";
    }
    const notesInput = document.getElementById('doc-notes-input');
    if (notesInput) notesInput.value = appState.notesText;
    renderCleanDocument();
    saveState();
    showToast("Zahlungshinweis aktualisiert (7 Tage Zahlungsziel)");
};

// Item Table & Catalog Management
function getAllCatalogServices() {
    let items = (typeof SERVICES_CATALOG !== 'undefined') ? JSON.parse(JSON.stringify(SERVICES_CATALOG)) : [];
    const customItemsRaw = localStorage.getItem('palnau_custom_catalog');
    if (customItemsRaw) {
        try {
            const customItems = JSON.parse(customItemsRaw);
            if (Array.isArray(customItems)) {
                const normalized = customItems.map(c => ({
                    id: c.id,
                    name: c.name || c.title || "Individuelle Leistung",
                    category: c.category || "Eigene",
                    defaultHourly: parseFloat(c.unitPrice) || 60,
                    medianHourly: parseFloat(c.unitPrice) || 60,
                    priceRange: [parseFloat(c.unitPrice) || 60, parseFloat(c.unitPrice) || 60],
                    typicalWorkers: 1,
                    defaultUnit: c.standardUnit || c.unit || "Std",
                    icon: "⭐",
                    descriptionTemplate: c.description || "",
                    tags: ["eigene", (c.name || "").toLowerCase()]
                }));
                items = [...normalized, ...items];
            }
        } catch (e) {
            console.warn("Could not parse custom catalog:", e);
        }
    }
    return items;
}
window.getAllCatalogServices = getAllCatalogServices;

function addCatalogServiceToDoc(serviceId, optionalQty) {
    const allServices = getAllCatalogServices();
    const service = allServices.find(s => s.id === serviceId);
    if (!service) {
        showToast("Leistung im Katalog nicht gefunden");
        return;
    }

    const unit = service.defaultUnit || service.standardUnit || service.unit || "Std";
    const rate = parseFloat(service.unitPrice ?? service.medianHourly ?? service.defaultHourly ?? 60) || 60;
    
    let qty = 1;
    if (optionalQty !== undefined && optionalQty !== null) {
        qty = parseFloat(optionalQty) || 1;
    } else if (unit === "Std") {
        const workers = service.typicalWorkers || 1;
        const hours = 4;
        qty = workers * hours;
    } else {
        qty = 1;
    }

    const price = rate;
    const total = Math.round(qty * price * 100) / 100;
    
    let description = service.descriptionTemplate || service.description || "";
    if (unit === "Std" && (!optionalQty || optionalQty === qty)) {
        const workers = service.typicalWorkers || 1;
        const hours = 4;
        if (description) {
            description = `${workers} Facharbeiter × ${hours}.0 Std. × ${rate.toFixed(2)} € (${description})`;
        }
    }

    const newItem = {
        id: "item-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        title: service.name || "Leistung",
        description: description,
        quantity: qty,
        unit: unit,
        price: price,
        total: total
    };

    if (!Array.isArray(appState.items)) {
        appState.items = [];
    }
    appState.items.push(newItem);
    renderTable();
    updateTotals();
    updateSmartDock();
    renderCleanDocument();
    saveState();
    closeCatalogModal();
    
    setTimeout(() => {
        const rows = document.querySelectorAll('.table-row-item');
        if (rows.length > 0) {
            rows[rows.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 60);

    showToast(`✓ "${service.name}" hinzugefügt`);
}
window.addCatalogServiceToDoc = addCatalogServiceToDoc;

function addAddonServiceToDoc(addonKey) {
    const addon = ADDON_SERVICES[addonKey];
    if (!addon) return;

    const qty = addon.quantity || 1;
    const price = addon.price || 0;
    const total = Math.round(qty * price * 100) / 100;

    const newItem = {
        id: "item-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        title: addon.title,
        description: addon.description || "",
        quantity: qty,
        unit: addon.unit || "Psch",
        price: price,
        total: total
    };

    if (!Array.isArray(appState.items)) {
        appState.items = [];
    }
    appState.items.push(newItem);
    renderTable();
    updateTotals();
    updateSmartDock();
    renderCleanDocument();
    saveState();
    setTimeout(() => {
        const rows = document.querySelectorAll('.table-row-item');
        if (rows.length > 0) {
            rows[rows.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 60);
    showToast(`✓ "${addon.title}" hinzugefügt`);
}
window.addAddonServiceToDoc = addAddonServiceToDoc;

function addCustomItemToDoc() {
    if (!Array.isArray(appState.items)) {
        appState.items = [];
    }
    const newItem = {
        id: "item-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        title: "Arbeitsleistung / Material",
        description: "Detaillierte Leistungsbeschreibung",
        quantity: 1,
        unit: "Std",
        price: 60.00,
        total: 60.00
    };
    appState.items.push(newItem);
    renderTable();
    updateTotals();
    updateSmartDock();
    renderCleanDocument();
    saveState();
    setTimeout(() => {
        const titleInputs = document.querySelectorAll('.item-title-field');
        if (titleInputs.length > 0) {
            const lastInput = titleInputs[titleInputs.length - 1];
            lastInput.focus();
            lastInput.select();
            lastInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 60);
    showToast("✓ Freie Position angelegt");
}
window.addCustomItemToDoc = addCustomItemToDoc;

function removeItemFromDoc(index) {
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || !Array.isArray(appState.items) || idx >= appState.items.length) return;
    const removed = appState.items.splice(idx, 1);
    renderTable();
    updateTotals();
    updateSmartDock();
    renderCleanDocument();
    saveState();
    const itemTitle = (removed && removed[0] && removed[0].title) ? removed[0].title : "Position";
    showToast(`"${itemTitle}" entfernt.`);
}
window.removeItemFromDoc = removeItemFromDoc;

function updateRowItem(index, field, value) {
    const item = appState.items[index];
    if (!item) return;

    if (field === 'quantity') {
        item.quantity = parseFloat(value) || 0;
        item.total = Math.round(item.quantity * item.price * 100) / 100;
    } else if (field === 'price') {
        item.price = parseFloat(value) || 0;
        item.total = Math.round(item.quantity * item.price * 100) / 100;
    } else {
        item[field] = value;
    }

    // Direct DOM sync for row total
    const totalCell = document.getElementById(`row-total-${index}`);
    if (totalCell) {
        totalCell.textContent = formatCurrency(item.total);
    }

    updateTotals();
    renderCleanDocument();
    saveState();
}
window.updateRowItem = updateRowItem;

// Auto resize textarea helper with safe minimum height
function autoResizeTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    const computedHeight = Math.max(48, el.scrollHeight);
    el.style.height = computedHeight + 'px';
}
window.autoResizeTextarea = autoResizeTextarea;

// Render Document Items Table (Interactive Clean Desktop View)
function renderTable() {
    const tbody = document.getElementById('doc-table-body');
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!Array.isArray(appState.items)) {
        appState.items = [];
    }

    // Update positions count badge in header
    const countBadge = document.getElementById('doc-positions-count-badge');
    if (countBadge) {
        countBadge.textContent = `${appState.items.length} ${appState.items.length === 1 ? 'Position' : 'Positionen'}`;
    }

    if (appState.items.length === 0) {
        tbody.innerHTML = `
            <tr class="table-empty-row">
                <td colspan="8" style="text-align:center; padding:24px 12px; background:#f8fafc; border-radius:6px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                        <span style="font-size: 20px;">🌿</span>
                        <div style="font-weight: 700; color: #0f172a; font-size: 13px;">Noch keine Positionen auf diesem Beleg</div>
                        <div style="color: #64748b; font-size: 11.5px; max-width: 400px; line-height: 1.4;">
                            Fügen Sie fertige Leistungen aus dem Katalog oder eine freie Position hinzu.
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 6px;">
                            <button type="button" class="neu-btn neu-btn-primary" onclick="openCatalogModal()" style="font-size: 11px; padding: 4px 10px; font-weight: 700;">
                                + Aus Katalog wählen
                            </button>
                            <button type="button" class="neu-btn" onclick="addCustomItemToDoc()" style="font-size: 11px; padding: 4px 10px; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1;">
                                + Freie Position
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        if (typeof updateDocItemsSelectedState === 'function') updateDocItemsSelectedState();
        return;
    }

    const availableUnits = ["Std", "Psch", "m²", "m", "Stk", "t", "m³"];

    appState.items.forEach((item, index) => {
        if (!item) return;
        try {
            // Fallback normalization
            const itemTitle = item.title || item.name || "";
            const itemDesc = item.description || item.descriptionTemplate || "";
            const itemQty = (item.quantity !== undefined && item.quantity !== null && !isNaN(item.quantity)) ? item.quantity : 1;
            const itemUnit = item.unit || item.standardUnit || "Std";
            const itemPrice = (item.price !== undefined && item.price !== null && !isNaN(item.price)) ? item.price : (parseFloat(item.unitPrice) || 0);
            const itemTotal = (item.total !== undefined && item.total !== null && !isNaN(item.total)) ? item.total : Math.round(itemQty * itemPrice * 100) / 100;

            // Keep item consistent
            item.title = itemTitle;
            item.description = itemDesc;
            item.quantity = itemQty;
            item.unit = itemUnit;
            item.price = itemPrice;
            item.total = itemTotal;

            // Build Unit Dropdown
            let unitOptionsHtml = "";
            let unitFound = false;
            availableUnits.forEach(u => {
                const isSel = (itemUnit === u);
                if (isSel) unitFound = true;
                unitOptionsHtml += `<option value="${u}" ${isSel ? 'selected' : ''}>${u}</option>`;
            });
            if (!unitFound && itemUnit) {
                unitOptionsHtml += `<option value="${escapeHtml(itemUnit)}" selected>${escapeHtml(itemUnit)}</option>`;
            }

            const tr = document.createElement('tr');
            tr.className = 'table-row-item';
            tr.id = `table-row-${index}`;
            tr.innerHTML = `
                <td class="col-chk" style="width: 32px; text-align: center; vertical-align: top; padding-top: 11px;">
                    <input type="checkbox" class="doc-item-chk" data-index="${index}" onchange="updateDocItemsSelectedState()" style="width: 16px; height: 16px; accent-color: #0284c7; cursor: pointer;">
                </td>

                <td class="col-pos" style="width: 36px; text-align: center; font-weight: 700; color: #475569; font-size: 13px; vertical-align: top; padding-top: 11px;">
                    ${index + 1}
                </td>

                <td class="col-desc" style="vertical-align: top;">
                    <div class="item-desc-wrapper">
                        <input type="text" class="item-title-field" value="${escapeHtml(item.title)}" placeholder="Bezeichnung der Leistung (z. B. Heckenschnitt)..." oninput="updateRowItem(${index}, 'title', this.value)" title="Klicken zum Bearbeiten der Bezeichnung">
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; width: 100%;">
                            <textarea class="item-desc-field" rows="2" placeholder="Detaillierte Leistungsbeschreibung..." oninput="updateRowItem(${index}, 'description', this.value); autoResizeTextarea(this);" title="Klicken zum Bearbeiten der Beschreibung">${escapeHtml(item.description)}</textarea>
                            <button type="button" class="row-reorder-btn" title="Position nach oben/unten verschieben" onclick="promptMoveItem(${index})" style="background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 16px; padding: 4px; line-height: 1; user-select: none;" onmouseover="this.style.color='#0f172a'" onmouseout="this.style.color='#94a3b8'">↕</button>
                        </div>
                    </div>
                </td>

                <td class="col-qty" style="width: 72px; text-align: center; vertical-align: top;">
                    <input type="number" step="0.5" min="0" class="item-number-field item-qty-field" value="${item.quantity}" oninput="updateRowItem(${index}, 'quantity', this.value)" title="Menge anpassen">
                </td>

                <td class="col-unit" style="width: 78px; text-align: center; vertical-align: top;">
                    <select class="item-select-field" onchange="updateRowItem(${index}, 'unit', this.value)" title="Einheit wählen">
                        ${unitOptionsHtml}
                    </select>
                </td>

                <td class="col-price" style="width: 95px; text-align: right; vertical-align: top;">
                    <div class="price-input-wrapper">
                        <input type="number" step="0.5" min="0" class="item-number-field item-price-field" value="${item.price}" oninput="updateRowItem(${index}, 'price', this.value)" title="Einzelpreis netto anpassen">
                        <span class="currency-symbol">€</span>
                    </div>
                </td>

                <td class="col-total" style="width: 96px; text-align: right; font-weight: 700; color: #0f172a; font-size: 13.5px; vertical-align: top; padding-top: 11px;" id="row-total-${index}">
                    ${formatCurrency(item.total)}
                </td>

                <td class="col-delete" style="width: 34px; text-align: center; vertical-align: top; padding-top: 8px;">
                    <button type="button" class="row-action-delete" title="Position löschen" onclick="event.stopPropagation(); removeItemFromDoc(${index}); return false;">✕</button>
                </td>
            `;
            tbody.appendChild(tr);

            // Auto-fit initial textarea height safely
            const descTextarea = tr.querySelector('.item-desc-field');
            if (descTextarea) {
                autoResizeTextarea(descTextarea);
            }
        } catch (err) {
            console.error("Fehler beim Rendern von Tabellenzeile", index, err);
        }
    });

    if (typeof updateDocItemsSelectedState === 'function') updateDocItemsSelectedState();
}
window.renderTable = renderTable;

function promptMoveItem(index) {
    if (!Array.isArray(appState.items) || appState.items.length <= 1) return;
    if (index > 0) {
        const item = appState.items.splice(index, 1)[0];
        appState.items.splice(index - 1, 0, item);
        renderTable();
        renderCleanDocument();
        saveState();
        showToast("Position nach oben verschoben");
    } else {
        const item = appState.items.splice(index, 1)[0];
        appState.items.splice(index + 1, 0, item);
        renderTable();
        renderCleanDocument();
        saveState();
        showToast("Position nach unten verschoben");
    }
}
window.promptMoveItem = promptMoveItem;

function toggleSelectAllDocItems(forceChecked) {
    const checkboxes = document.querySelectorAll('.doc-item-chk');
    if (checkboxes.length === 0) return;
    
    let targetState;
    if (typeof forceChecked === 'boolean') {
        targetState = forceChecked;
    } else {
        const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
        targetState = anyUnchecked;
    }

    checkboxes.forEach(cb => {
        cb.checked = targetState;
    });

    updateDocItemsSelectedState();
}
window.toggleSelectAllDocItems = toggleSelectAllDocItems;

function updateDocItemsSelectedState() {
    const checkboxes = document.querySelectorAll('.doc-item-chk');
    const checked = Array.from(checkboxes).filter(cb => cb.checked);
    const count = checked.length;
    const total = checkboxes.length;

    const barButtons = document.getElementById('doc-items-bulk-buttons');
    const badge = document.getElementById('doc-items-selected-badge');
    const topChk = document.getElementById('table-select-all-chk');
    const headerChk = document.getElementById('header-col-select-all');
    const topLabel = document.getElementById('table-select-all-label-text');

    if (badge) {
        badge.textContent = `${count} von ${total} gewählt`;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    if (barButtons) {
        barButtons.style.display = count > 0 ? 'flex' : 'none';
    }
    if (topLabel) {
        topLabel.textContent = (count === total && total > 0) ? 'Alle abwählen' : 'Alle auswählen';
    }
    if (topChk) {
        topChk.checked = count === total && total > 0;
        topChk.indeterminate = count > 0 && count < total;
    }
    if (headerChk) {
        headerChk.checked = count === total && total > 0;
        headerChk.indeterminate = count > 0 && count < total;
    }
}
window.updateDocItemsSelectedState = updateDocItemsSelectedState;

function deleteSelectedDocItems() {
    const checkboxes = document.querySelectorAll('.doc-item-chk:checked');
    if (checkboxes.length === 0) return;
    
    // Get indexes in descending order
    const indicesToDelete = Array.from(checkboxes)
        .map(cb => parseInt(cb.getAttribute('data-index'), 10))
        .filter(idx => !isNaN(idx))
        .sort((a, b) => b - a);

    indicesToDelete.forEach(idx => {
        if (appState.items && idx >= 0 && idx < appState.items.length) {
            appState.items.splice(idx, 1);
        }
    });

    renderTable();
    updateTotals();
    updateSmartDock();
    saveState();
    showToast(`${indicesToDelete.length} Position(en) entfernt.`);
}
window.deleteSelectedDocItems = deleteSelectedDocItems;

function duplicateSelectedDocItems() {
    const checkboxes = document.querySelectorAll('.doc-item-chk:checked');
    if (checkboxes.length === 0) return;

    const indicesToDuplicate = Array.from(checkboxes)
        .map(cb => parseInt(cb.getAttribute('data-index'), 10))
        .filter(idx => !isNaN(idx))
        .sort((a, b) => a - b);

    indicesToDuplicate.forEach(idx => {
        const item = appState.items[idx];
        if (item) {
            appState.items.push(JSON.parse(JSON.stringify(item)));
        }
    });

    renderTable();
    updateTotals();
    updateSmartDock();
    saveState();
    showToast(`${indicesToDuplicate.length} Position(en) dupliziert.`);
}
window.duplicateSelectedDocItems = duplicateSelectedDocItems;

// Calculate Totals
function calculateTotals() {
    const netTotal = appState.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const taxAmount = (netTotal * (parseFloat(appState.taxRate) || 0)) / 100;
    const grossTotal = netTotal + taxAmount;

    return {
        netTotal: Math.round(netTotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        grossTotal: Math.round(grossTotal * 100) / 100
    };
}

// Berechnet die Lohnkosten für Firmenkunden (Netto, MwSt-Betrag, Brutto)
function calculateWageCosts(items, taxRate, customNetWage) {
    const rate = (taxRate !== undefined && !isNaN(parseFloat(taxRate))) ? parseFloat(taxRate) : 19;
    
    let netWage = 0;
    const hasCustom = (customNetWage !== undefined && customNetWage !== null && customNetWage !== '' && !isNaN(parseFloat(customNetWage)));
    
    if (hasCustom) {
        netWage = Math.max(0, parseFloat(customNetWage));
    } else {
        // Automatische Berechnung aus Positionen:
        // Positionen mit Stunden-/Tageseinheiten (Std, Stunden, h, Tag, Tage, Mannstunden)
        const laborUnits = ['std', 'stunden', 'stunde', 'h', 'tag', 'tage', 'mannstunden'];
        const laborItems = (items || []).filter(item => {
            const u = (item.unit || '').trim().toLowerCase();
            return laborUnits.includes(u);
        });

        if (laborItems.length > 0) {
            netWage = laborItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        } else {
            // Wenn keine Stunden-Einheit vorliegt, die gesamte Nettosumme als Basis heranziehen
            netWage = (items || []).reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        }
    }

    const wageTax = (netWage * rate) / 100;
    const wageGross = netWage + wageTax;

    return {
        wageNet: Math.round(netWage * 100) / 100,
        taxRate: rate,
        wageTax: Math.round(wageTax * 100) / 100,
        wageGross: Math.round(wageGross * 100) / 100,
        isCustom: hasCustom
    };
}

// Update Screen Totals
function updateTotals() {
    const totals = calculateTotals();
    const isQuote = appState.docType === "angebot";
    const clientType = appState.clientType || "privat";

    document.getElementById('doc-net-total').textContent = formatCurrency(totals.netTotal);
    document.getElementById('doc-tax-label').textContent = `Umsatzsteuer ${appState.taxRate}%:`;
    document.getElementById('doc-tax-amount').textContent = formatCurrency(totals.taxAmount);
    document.getElementById('doc-gross-label').textContent = isQuote ? "Angebotsbetrag:" : "Rechnungsbetrag:";
    document.getElementById('doc-gross-total').textContent = formatCurrency(totals.grossTotal);

    // Firmenkunden Lohnkosten-Satz auf dem interaktiven Bogen (unterhalb der totalen Berechnung)
    const firmaClauseBox = document.getElementById('doc-firma-wage-clause');
    const firmaClauseText = document.getElementById('doc-firma-wage-clause-text');
    const isCompany = clientType === 'firma' || (typeof isCompanyClient === 'function' && isCompanyClient(appState.client, clientType));
    if (firmaClauseBox && firmaClauseText) {
        if (!isQuote && isCompany) {
            const wageCalc = calculateWageCosts(appState.items, appState.taxRate, appState.customWageNet);
            firmaClauseText.textContent = `Im Rechnungsbetrag enthaltene Lohnkosten netto von ${formatCurrency(wageCalc.wageNet)} zuzüglich ${wageCalc.taxRate} % Mehrwertsteuer (${formatCurrency(wageCalc.wageTax)}), Lohnkosten brutto ${formatCurrency(wageCalc.wageGross)}.`;
            firmaClauseBox.style.display = 'block';
        } else {
            firmaClauseBox.style.display = 'none';
        }
    }

    // Sidebar Widget synchronisieren
    updateFirmaWageSidebar();

    // Update Clean Document
    renderCleanDocument();
}

// Sidebar Widget für Firmenkunden-Lohnkosten aktualisieren
function updateFirmaWageSidebar() {
    const isQuote = appState.docType === "angebot";
    const clientType = appState.clientType || "privat";
    const isCompany = clientType === 'firma' || (typeof isCompanyClient === 'function' && isCompanyClient(appState.client, clientType));
    const container = document.getElementById('firma-wage-settings');
    if (!container) return;

    if (!isQuote && isCompany) {
        container.style.display = 'block';
        const wageCalc = calculateWageCosts(appState.items, appState.taxRate, appState.customWageNet);
        const input = document.getElementById('doc-wage-net-input');
        const badge = document.getElementById('wage-mode-badge');
        const preview = document.getElementById('firma-wage-preview-text');

        if (input && document.activeElement !== input) {
            input.value = wageCalc.isCustom
                ? parseFloat(appState.customWageNet).toFixed(2)
                : (wageCalc.wageNet ? wageCalc.wageNet.toFixed(2) : '0.00');
        }
        if (badge) {
            badge.textContent = wageCalc.isCustom ? 'Manuell' : 'Auto';
            badge.style.background = wageCalc.isCustom ? '#fef3c7' : '#ecfdf5';
            badge.style.color = wageCalc.isCustom ? '#92400e' : '#047857';
            badge.style.borderColor = wageCalc.isCustom ? '#fde68a' : '#a7f3d0';
        }
        if (preview) {
            preview.innerHTML = `<strong>Satz auf Rechnung:</strong><br>„Im Rechnungsbetrag enthaltene Lohnkosten netto von ${formatCurrency(wageCalc.wageNet)} zuzüglich ${wageCalc.taxRate} % Mehrwertsteuer (${formatCurrency(wageCalc.wageTax)}), Lohnkosten brutto ${formatCurrency(wageCalc.wageGross)}.“`;
        }
    } else {
        container.style.display = 'none';
    }
}

// User-Aktionen für Firmenkunden-Lohnkosten
window.handleCustomWageInput = function(val) {
    if (val === '' || isNaN(parseFloat(val))) {
        appState.customWageNet = null;
    } else {
        appState.customWageNet = Math.max(0, parseFloat(val));
    }
    updateTotals();
    saveState();
};

window.resetWageToAuto = function() {
    appState.customWageNet = null;
    updateTotals();
    saveState();
    showToast("Lohnkosten auf automatische Berechnung zurückgesetzt.");
};

window.setWageNetPercentage = function(percent) {
    const totals = calculateTotals();
    const net = (totals.netTotal * percent) / 100;
    appState.customWageNet = Math.round(net * 100) / 100;
    updateTotals();
    saveState();
    showToast(`Lohnkosten auf ${percent}% (${formatCurrency(appState.customWageNet)}) gesetzt.`);
};

window.setWageFromHoursOnly = function() {
    const laborUnits = ['std', 'stunden', 'stunde', 'h', 'tag', 'tage', 'mannstunden'];
    const laborItems = (appState.items || []).filter(item => {
        const u = (item.unit || '').trim().toLowerCase();
        return laborUnits.includes(u);
    });
    const sum = laborItems.reduce((s, it) => s + (parseFloat(it.total) || 0), 0);
    appState.customWageNet = Math.round(sum * 100) / 100;
    updateTotals();
    saveState();
    showToast(`Lohnkosten aus Stundenpositionen berechnet (${formatCurrency(appState.customWageNet)}).`);
};

// Smart Dock Recommendations in Sidebar
function updateSmartDock() {
    const container = document.getElementById('smart-dock-chips');
    const card = document.getElementById('smart-recommendations-card');
    if (!container || !card) return;

    const allText = appState.items.map(i => (i.title + " " + i.description).toLowerCase()).join(" ");
    const needed = new Set();

    SERVICES_CATALOG.forEach(s => {
        const isPresent = allText.includes(s.name.toLowerCase()) || s.tags.some(tag => allText.includes(tag));
        if (isPresent && s.recommendedAddons) {
            s.recommendedAddons.forEach(addon => needed.add(addon));
        }
    });

    if (appState.items.length > 0) {
        needed.add("anfahrt");
    }

    const missing = Array.from(needed).filter(addonKey => {
        const addon = ADDON_SERVICES[addonKey];
        if (!addon) return false;
        return !allText.includes(addon.title.toLowerCase().substring(0, 8));
    });

    if (missing.length === 0) {
        container.innerHTML = `<span style="font-size:0.72rem; color:#94a3b8; font-style:italic;">Alle passenden Ergänzungen sind bereits enthalten.</span>`;
        return;
    }

    container.innerHTML = "";

    missing.slice(0, 4).forEach(addonKey => {
        const addon = ADDON_SERVICES[addonKey];
        const pill = document.createElement('div');
        pill.className = 'neu-addon-pill';
        pill.innerHTML = `
            <div class="addon-pill-info">
                <span class="addon-pill-title">${escapeHtml(addon.title)}</span>
                <span class="addon-pill-price">+${formatCurrency(addon.price)}</span>
            </div>
            <button class="neu-btn" style="padding:4px 10px; font-size:0.7rem;">Hinzufügen</button>
        `;
        pill.addEventListener('click', () => addAddonServiceToDoc(addonKey));
        container.appendChild(pill);
    });
}

// Master Render All Document Fields
function renderAll() {
    const isQuote = appState.docType === "angebot";
    const clientType = appState.clientType || "privat";

    // Mode Buttons in Neumorphic Switcher
    const btnRechnung = document.getElementById('btn-mode-rechnung');
    const btnAngebot = document.getElementById('btn-mode-angebot');
    const btnRechnungTop = document.getElementById('btn-mode-rechnung-top');
    const btnAngebotTop = document.getElementById('btn-mode-angebot-top');
    
    if (btnRechnung && btnAngebot) {
        btnRechnung.classList.toggle('active', !isQuote);
        btnRechnung.classList.toggle('invoice-active', !isQuote);
        btnAngebot.classList.toggle('active', isQuote);
        btnAngebot.classList.toggle('quote-active', isQuote);
    }
    if (btnRechnungTop && btnAngebotTop) {
        btnRechnungTop.classList.toggle('active', !isQuote);
        btnRechnungTop.classList.toggle('invoice-active', !isQuote);
        btnAngebotTop.classList.toggle('active', isQuote);
        btnAngebotTop.classList.toggle('quote-active', isQuote);
    }

    // Generator header convert button: Visible when in Angebot mode
    const btnConvertToInvoice = document.getElementById('btn-convert-to-invoice');
    if (btnConvertToInvoice) {
        btnConvertToInvoice.style.display = isQuote ? 'inline-flex' : 'none';
    }

    const genBadge = document.getElementById('gen-active-status-badge');
    if (genBadge) {
        if (appState.activeArchiveId) {
            genBadge.textContent = `Bearbeiten: ${appState.docNumber}`;
            genBadge.style.borderColor = '#38bdf8';
            genBadge.style.color = '#0284c7';
        } else {
            genBadge.textContent = isQuote ? "Modus: Angebot" : "Modus: Rechnung";
            genBadge.style.borderColor = '';
            genBadge.style.color = '';
        }
    }

    const btnDeleteActive = document.getElementById('btn-delete-active-doc');
    if (btnDeleteActive) {
        btnDeleteActive.style.display = appState.activeArchiveId ? 'block' : 'none';
    }

    // Kundentyp Toggle & UI
    const isCompany = clientType === 'firma' || (typeof isCompanyClient === 'function' && isCompanyClient(appState.client, clientType));
    const btnTypePrivat = document.getElementById('btn-client-type-privat');
    const btnTypeFirma = document.getElementById('btn-client-type-firma');
    const badgeType = document.getElementById('client-type-indicator-badge');
    const workLocContainer = document.getElementById('firma-work-location-field');
    const workLocInput = document.getElementById('doc-work-location');

    if (btnTypePrivat) btnTypePrivat.classList.toggle('active', !isCompany);
    if (btnTypeFirma) btnTypeFirma.classList.toggle('active', isCompany);
    if (badgeType) {
        if (isCompany) {
            badgeType.textContent = "Firma / Gewerbekunde";
            badgeType.style.background = "#eff6ff";
            badgeType.style.color = "#1d4ed8";
        } else {
            badgeType.textContent = "Privatperson";
            badgeType.style.background = "#ecfdf5";
            badgeType.style.color = "#047857";
        }
    }

    if (workLocContainer) {
        workLocContainer.style.display = isCompany ? 'block' : 'none';
    }
    const docWorkLocRow = document.getElementById('doc-work-location-row');
    if (docWorkLocRow) {
        docWorkLocRow.style.display = isCompany ? 'block' : 'none';
    }
    if (workLocInput) {
        workLocInput.value = appState.workLocation || "";
    }
    const sheetWorkLocInput = document.getElementById('doc-sheet-work-location');
    if (sheetWorkLocInput) {
        sheetWorkLocInput.value = appState.workLocation || "";
    }

    // Client Fields
    const clientNameInput = document.getElementById('doc-client-name');
    if (clientNameInput) {
        clientNameInput.value = appState.client.name || "";
        clientNameInput.placeholder = isCompany 
            ? "Firmenname / Gewerbebetrieb eingeben (z. B. Mustermann Gartenbau)" 
            : "Kundenname / Firma eingeben (z. B. Familie Weber)";
    }
    const streetInput = document.getElementById('doc-client-street');
    if (streetInput) streetInput.value = appState.client.street || "";
    const zipCityInput = document.getElementById('doc-client-zipcity');
    if (zipCityInput) zipCityInput.value = appState.client.zipCity || "";

    // Meta Details
    const numLabel = document.getElementById('doc-number-label');
    if (numLabel) numLabel.textContent = isQuote ? "Angebot Nr.:" : "Rechnung Nr.:";
    const metaNum = document.getElementById('doc-meta-number');
    if (metaNum) metaNum.value = appState.docNumber || "";
    const metaDate = document.getElementById('doc-meta-date');
    if (metaDate) metaDate.value = appState.docDate || "";
    const periodLabel = document.getElementById('doc-period-label');
    if (periodLabel) periodLabel.textContent = isQuote ? "Gültig bis / Zeitraum:" : "Leistungszeitraum:";
    const metaPeriod = document.getElementById('doc-meta-period');
    if (metaPeriod) metaPeriod.value = appState.servicePeriod || "";
    const metaTax = document.getElementById('doc-meta-taxrate');
    if (metaTax) metaTax.value = appState.taxRate !== undefined ? appState.taxRate : 19;

    // Document Title
    const mainTitle = document.getElementById('doc-main-title');
    if (mainTitle) mainTitle.textContent = isQuote ? "ANGEBOT" : "RECHNUNG";

    // Mobile Doc Badge
    const mobileDocBadge = document.getElementById('mobile-doc-badge');
    if (mobileDocBadge) {
        mobileDocBadge.textContent = isQuote ? "ANGEBOT" : "RECHNUNG";
        mobileDocBadge.classList.toggle('quote-mode', isQuote);
    }

    // Statutory Retention Notice (displayed on Invoices when client is Privatperson)
    const retentionBox = document.getElementById('doc-retention-notice');
    if (retentionBox) {
        retentionBox.style.display = (!isQuote && !isCompany) ? 'block' : 'none';
    }

    // Senior Bank Box Reference & Footer Bank Reference
    const footerBankDocNum = document.getElementById('footer-bank-doc-number');
    if (footerBankDocNum) {
        footerBankDocNum.textContent = appState.docNumber || (isQuote ? 'ANG-2026-XXXX' : 'RE-2026-XXXX');
    }
    const seniorBankRef = document.getElementById('senior-bank-reference');
    if (seniorBankRef) {
        seniorBankRef.textContent = appState.docNumber || (isQuote ? 'ANG-2026-XXXX' : 'RE-2026-XXXX');
    }

    // Notes
    const notesInput = document.getElementById('doc-notes-input');
    if (notesInput) notesInput.value = appState.notesText || "";

    // Table & Totals
    renderTable();
    updateTotals();
    updateSmartDock();
    renderCleanDocument();
}

/**
 * GENERATE PRISTINE CLEAN DOCUMENT FOR PDF & PRINT EXPORT
 * High-legibility font scaling, DIN 5008 window envelope positioning, and accessible bank details in footer
 */
function renderCleanDocument() {
    const cleanContainer = document.getElementById('clean-pdf-document');
    if (!cleanContainer) return;

    const isQuote = appState.docType === "angebot";
    const clientType = appState.clientType || "privat";
    const totals = calculateTotals();

    let itemsHtml = "";
    if (appState.items.length === 0) {
        itemsHtml = `<tr><td colspan="6" style="text-align:center; color:#999; padding:25px; font-size:14px;">Keine Positionen vorhanden.</td></tr>`;
    } else {
        appState.items.forEach((item, index) => {
            const descHtml = item.description 
                ? `<small style="color:#475569; font-size:12.5px; line-height:1.4; display:block; margin-top:2px;">${escapeHtml(item.description)}</small>` 
                : '';
            itemsHtml += `
                <tr>
                    <td style="width: 35px; text-align: center; font-size: 13.5px; font-weight: 700; color: #64748b;">${index + 1}</td>
                    <td>
                        <strong style="color:#0f172a; font-size:14.5px;">${escapeHtml(item.title)}</strong>
                        ${descHtml}
                    </td>
                    <td style="width: 55px; text-align: right; font-size: 14px; font-weight: 600;">${item.quantity}</td>
                    <td style="width: 50px; text-align: center; font-size: 13.5px; color: #475569;">${escapeHtml(item.unit)}</td>
                    <td style="width: 85px; text-align: right; font-size: 14px;">${formatCurrency(item.price)}</td>
                    <td style="width: 95px; text-align: right; font-weight: 800; font-size: 14.5px; color: #0f172a;">${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
    }

    // Work location (nur die reine Adresse ohne Präfix / Label)
    const isCompany = clientType === 'firma' || (typeof isCompanyClient === 'function' && isCompanyClient(appState.client, clientType));
    let workLocationHtml = "";
    if (isCompany && (appState.workLocation || '').trim()) {
        workLocationHtml = `
            <div style="font-size: 14px; color: #1e293b; margin-bottom: 2px; white-space: pre-line;">
                ${escapeHtml(appState.workLocation)}
            </div>
        `;
    }

    // Statutory retention notice (Required by law for Invoices when client is a Private Person)
    let retentionNoticeHtml = "";
    if (!isQuote && !isCompany) {
        retentionNoticeHtml = `
            <div style="margin-top: 14px; padding: 10px 14px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 12.5px; line-height: 1.45; color: #1e293b;">
                <strong>Gesetzliche Aufbewahrungspflicht für Privatpersonen:</strong><br>
                Der Gesetzgeber verpflichtet, wenn der Auftraggeber eine Privatperson ist, diesen laut § 14 Abs. 4 Nr. 9 i. V. m. § 14b Abs. 1 UStG darauf hinzuweisen, Rechnungen mindestens 2 Jahre aufzubewahren.
            </div>
        `;
    }

    // Firmenkunden Lohnkosten-Satz (bei Rechnungen für Firmenkunden direkt unter der totalen Euro-Berechnung)
    let firmaWageNoticeHtml = "";
    if (!isQuote && isCompany) {
        const wageCalc = calculateWageCosts(appState.items, appState.taxRate, appState.customWageNet);
        firmaWageNoticeHtml = `
            <div class="clean-firma-wage-notice">
                Im Rechnungsbetrag enthaltene Lohnkosten netto von ${formatCurrency(wageCalc.wageNet)} zuzüglich ${wageCalc.taxRate} % Mehrwertsteuer (${formatCurrency(wageCalc.wageTax)}), Lohnkosten brutto ${formatCurrency(wageCalc.wageGross)}.
            </div>
        `;
    }

    cleanContainer.innerHTML = `
        <div class="clean-body-content">
            <!-- DIN 5008 Falz- und Lochmarken für DIN-Lang Fensterbriefumschläge -->
            <div class="din-fold-mark din-fold-mark-1" title="Falzmarke 1 (105mm)"></div>
            <div class="din-fold-mark din-punch-mark" title="Lochmarke (148.5mm)"></div>
            <div class="din-fold-mark din-fold-mark-2" title="Falzmarke 2 (210mm)"></div>

            <!-- Header -->
            <div class="clean-header">
                <div class="clean-company-info">
                    <strong style="font-size:16px; color:#0f172a;">Palnau Gartenbau GmbH</strong>
                    <span>Reihelberg 3, 75210 Keltern-Dietlingen</span><br>
                    <span>Tel: 07231 466641 | Email: gartenbauu@gmail.com</span>
                </div>
            </div>

            <!-- DIN 5008 Adresszone für Fensterbriefe (Heruntergezogen, passgenau für Sichtfenster) -->
            <div class="clean-address-meta-row">
                <!-- Client Address with Sender Return Line -->
                <div class="clean-client-address">
                    <div class="clean-return-line">Palnau Gartenbau GmbH • Reihelberg 3 • 75210 Keltern-Dietlingen</div>
                    <div class="clean-address-box">
                        ${workLocationHtml}
                        <strong style="font-size: 15.5px; color: #0f172a; display: block; margin-bottom: 2px;">${escapeHtml(appState.client.name || (clientType === 'firma' ? 'Firma / Gewerbekunde' : 'Kunde'))}</strong>
                        <span style="font-size: 14px; color: #1e293b; display: block;">${escapeHtml(appState.client.street || '')}</span>
                        <span style="font-size: 14px; color: #1e293b; display: block;">${escapeHtml(appState.client.zipCity || '')}</span>
                    </div>
                </div>

                <!-- Document Meta Details (Right Aligned) -->
                <div class="clean-doc-details">
                    <div style="margin-bottom: 4px;"><strong style="font-size: 14.5px;">${isQuote ? 'Angebot Nr.:' : 'Rechnung Nr.:'}</strong> <span style="font-size: 15px; font-weight: 800; color:#0f172a;">${escapeHtml(appState.docNumber)}</span></div>
                    <div style="margin-bottom: 4px;"><strong style="font-size: 14.5px;">Datum:</strong> <span style="font-size: 14.5px; font-weight: 700;">${escapeHtml(appState.docDate)}</span></div>
                    <div style="margin-bottom: 4px;"><strong style="font-size: 14.5px;">${isQuote ? 'Gültig bis:' : 'Leistungszeitraum:'}</strong> <span style="font-size: 14.5px;">${escapeHtml(appState.servicePeriod)}</span></div>
                    <div><strong style="font-size: 14px;">MwSt-Satz:</strong> <span style="font-size: 14px;">${appState.taxRate}%</span></div>
                </div>
            </div>

            <!-- Document Heading (H1) -->
            <h1 class="clean-h1-title">${isQuote ? 'ANGEBOT' : 'RECHNUNG'}</h1>

            <!-- Pure Items Table -->
            <table class="clean-table">
                <thead>
                    <tr>
                        <th style="width: 35px; text-align: center; font-size: 13px;">Pos.</th>
                        <th style="font-size: 13px;">Beschreibung</th>
                        <th style="width: 55px; text-align: right; font-size: 13px;">Menge</th>
                        <th style="width: 50px; text-align: center; font-size: 13px;">Einheit</th>
                        <th style="width: 85px; text-align: right; font-size: 13px;">Einzelpreis</th>
                        <th style="width: 95px; text-align: right; font-size: 13px;">Gesamt</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <!-- Totals Box (Dezent, professionell skaliert, kein überdimensionierter Betrag) -->
            <div class="clean-totals">
                <div class="clean-total-row">
                    <span>Zwischensumme (Netto):</span>
                    <span>${formatCurrency(totals.netTotal)}</span>
                </div>
                <div class="clean-total-row">
                    <span>Umsatzsteuer ${appState.taxRate}%:</span>
                    <span>${formatCurrency(totals.taxAmount)}</span>
                </div>
                <div class="clean-total-row grand">
                    <span>${isQuote ? 'Angebotsbetrag:' : 'Rechnungsbetrag:'}</span>
                    <span style="white-space: nowrap;">${formatCurrency(totals.grossTotal)}</span>
                </div>
                ${firmaWageNoticeHtml}
            </div>

            <!-- Notes / Terms -->
            <div class="clean-notes">
                <p>${escapeHtml(appState.notesText)}</p>
            </div>

            <!-- Gesetzliche Aufbewahrungspflicht für Privatpersonen -->
            ${retentionNoticeHtml}
        </div>

        <!-- Footer (Subtle, balanced, matching font, style and size on bottom of each page) -->
        <div class="clean-footer">
            <div class="clean-footer-grid">
                <div class="clean-footer-bank-col">
                    <strong class="clean-footer-col-title">Bankverbindung</strong>
                    <div class="clean-footer-row">Sparkasse Pforzheim Calw</div>
                    <div class="clean-footer-row">IBAN: DE66 6665 0085 0005 9928 34</div>
                    <div class="clean-footer-row">BIC: PFORDE66XXX</div>
                    <div class="clean-footer-row">Verwendungszweck: ${escapeHtml(appState.docNumber)}</div>
                </div>
                <div>
                    <strong class="clean-footer-col-title">Steuerdaten</strong>
                    <div class="clean-footer-row">Steuernummer: 41413-45017</div>
                    <div class="clean-footer-row">USt-IdNr.: Gemäß § 19 / § 14 UStG</div>
                    <div class="clean-footer-row">Finanzamt Pforzheim</div>
                </div>
                <div>
                    <strong class="clean-footer-col-title">Geschäftsführer & Kontakt</strong>
                    <div class="clean-footer-row">Andrei Priala</div>
                    <div class="clean-footer-row">Tel: 07231 466641</div>
                    <div class="clean-footer-row">Email: gartenbauu@gmail.com</div>
                </div>
            </div>
        </div>
    `;
}

// Catalog Command Palette Modal
function setupCatalogModal() {
    const modal = document.getElementById('catalog-modal');
    const openBtn = document.getElementById('btn-open-catalog-modal');
    const openTableBtn = document.getElementById('btn-table-open-catalog');
    const closeBtn = document.getElementById('btn-close-catalog-modal');
    const searchInput = document.getElementById('modal-catalog-search');
    const categoryTabs = document.querySelectorAll('#modal-category-tabs .modal-cat-tab');

    if (openBtn) openBtn.addEventListener('click', openCatalogModal);
    if (openTableBtn) openTableBtn.addEventListener('click', openCatalogModal);
    if (closeBtn) closeBtn.addEventListener('click', closeCatalogModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCatalogModal();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            modalSearchTerm = e.target.value.toLowerCase().trim();
            renderModalCards();
        });
    }

    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            modalActiveCategory = tab.dataset.cat;
            renderModalCards();
        });
    });

    renderModalCards();
}

function openCatalogModal() {
    const modal = document.getElementById('catalog-modal');
    if (modal) {
        modal.classList.add('open');
        try {
            renderModalCards();
        } catch (err) {
            console.error("renderModalCards error:", err);
        }
        const searchInput = document.getElementById('modal-catalog-search');
        if (searchInput) {
            setTimeout(() => {
                try { searchInput.focus(); } catch (e) {}
            }, 50);
        }
    }
}
window.openCatalogModal = openCatalogModal;

function closeCatalogModal() {
    const modal = document.getElementById('catalog-modal');
    if (modal) modal.classList.remove('open');
}
window.closeCatalogModal = closeCatalogModal;

function renderModalCards() {
    const container = document.getElementById('modal-cards-container');
    if (!container) return;

    container.innerHTML = "";

    const allServices = (typeof getAllCatalogServices === 'function') 
        ? getAllCatalogServices() 
        : ((typeof SERVICES_CATALOG !== 'undefined') ? SERVICES_CATALOG : []);

    const sTerm = (modalSearchTerm || "").toLowerCase().trim();

    const filtered = allServices.filter(s => {
        if (!s) return false;
        const matchesCategory = (!modalActiveCategory || modalActiveCategory === "all") || (s.category === modalActiveCategory);
        if (!matchesCategory) return false;
        if (!sTerm) return true;

        const nameMatches = s.name && s.name.toLowerCase().includes(sTerm);
        const descMatches = (s.descriptionTemplate && s.descriptionTemplate.toLowerCase().includes(sTerm)) ||
                            (s.description && s.description.toLowerCase().includes(sTerm));
        const tagsMatches = Array.isArray(s.tags) && s.tags.some(t => String(t).toLowerCase().includes(sTerm));

        return nameMatches || descMatches || tagsMatches;
    });

    if (!filtered || filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 32px 16px; text-align: center; color: #64748b;">
                <div style="font-size: 24px; margin-bottom: 8px;">🌿</div>
                <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 4px;">Keine Leistungen gefunden</div>
                <div style="font-size: 12px; color: #94a3b8;">Probieren Sie einen anderen Suchbegriff oder wählen Sie "Alle".</div>
            </div>`;
        return;
    }

    filtered.forEach(service => {
        const card = document.createElement('div');
        card.className = 'catalog-card-item';
        const rate = Number(service.medianHourly || service.defaultHourly || service.unitPrice || 60);
        const desc = service.descriptionTemplate || service.description || "Garten- und Landschaftsbau";
        const unit = service.defaultUnit || service.standardUnit || "Std";
        card.innerHTML = `
            <div>
                <div class="card-item-title">${service.icon || '🌿'} ${escapeHtml(service.name || 'Leistung')}</div>
                <div class="card-item-desc">${escapeHtml(desc)}</div>
            </div>
            <div class="card-item-footer">
                <span style="font-weight: 700; color: #047857;">${rate.toFixed(2)} € / ${unit}</span>
                <button type="button" class="neu-btn neu-btn-primary" style="padding: 5px 12px; font-size: 0.8rem; font-weight: bold;">+ Einfügen</button>
            </div>
        `;
        card.addEventListener('click', (ev) => {
            ev.preventDefault();
            addCatalogServiceToDoc(service.id);
        });
        container.appendChild(card);
    });
}

// Event Listeners for UI
function setupEventListeners() {
    // Mode Switcher Buttons
    document.getElementById('btn-mode-rechnung')?.addEventListener('click', () => setDocType('rechnung'));
    document.getElementById('btn-mode-angebot')?.addEventListener('click', () => setDocType('angebot'));
    document.getElementById('btn-mode-rechnung-top')?.addEventListener('click', () => setDocType('rechnung'));
    document.getElementById('btn-mode-angebot-top')?.addEventListener('click', () => setDocType('angebot'));

    // Quick Actions
    document.getElementById('btn-load-sample')?.addEventListener('click', () => {
        loadSampleData(appState.docType);
        showToast("Beispiel-Vorlage eingefügt");
    });
    document.getElementById('btn-reset')?.addEventListener('click', () => {
        resetCurrentDoc();
    });
    document.getElementById('btn-print')?.addEventListener('click', () => {
        renderCleanDocument();
        document.body.classList.add('printing-clean');
        window.print();
        setTimeout(() => {
            document.body.classList.remove('printing-clean');
        }, 1000);
    });
    document.getElementById('btn-download-pdf')?.addEventListener('click', exportToPdf);

    // Custom Item Add
    document.getElementById('btn-table-add-custom')?.addEventListener('click', addCustomItemToDoc);

    // Direct Inputs on Document
    document.getElementById('doc-client-name')?.addEventListener('input', (e) => {
        appState.client.name = e.target.value;
        if (appState.clientType !== 'firma' && typeof isCompanyClient === 'function' && isCompanyClient(e.target.value)) {
            appState.clientType = 'firma';
            if (!appState.client) appState.client = {};
            appState.client.clientType = 'firma';
            renderAll();
        } else {
            renderCleanDocument();
        }
        saveState();
    });
    document.getElementById('doc-work-location')?.addEventListener('input', (e) => {
        handleWorkLocationChange(e.target.value);
    });
    document.getElementById('doc-sheet-work-location')?.addEventListener('input', (e) => {
        handleWorkLocationChange(e.target.value);
    });
    document.getElementById('btn-client-type-privat')?.addEventListener('click', () => {
        setClientType('privat');
    });
    document.getElementById('btn-client-type-firma')?.addEventListener('click', () => {
        setClientType('firma');
    });
    document.getElementById('doc-client-street')?.addEventListener('input', (e) => {
        appState.client.street = e.target.value;
        renderCleanDocument();
        saveState();
    });
    document.getElementById('doc-client-zipcity')?.addEventListener('input', (e) => {
        appState.client.zipCity = e.target.value;
        renderCleanDocument();
        saveState();
    });

    document.getElementById('doc-firma-wage-clause')?.addEventListener('click', () => {
        const input = document.getElementById('doc-wage-net-input');
        if (input) {
            input.focus();
            input.select();
            showToast("Lohnkosten (netto) in der linken Seitenleiste anpassen.");
        }
    });

    document.getElementById('doc-meta-number')?.addEventListener('input', (e) => {
        appState.docNumber = e.target.value;
        renderCleanDocument();
        saveState();
    });
    document.getElementById('doc-meta-date')?.addEventListener('input', (e) => {
        appState.docDate = e.target.value;
        renderCleanDocument();
        saveState();
    });
    document.getElementById('doc-meta-period')?.addEventListener('input', (e) => {
        appState.servicePeriod = e.target.value;
        renderCleanDocument();
        saveState();
    });
    document.getElementById('doc-meta-taxrate')?.addEventListener('change', (e) => {
        appState.taxRate = parseFloat(e.target.value) || 0;
        updateTotals();
        renderCleanDocument();
        saveState();
    });

    document.getElementById('doc-notes-input')?.addEventListener('input', (e) => {
        appState.notesText = e.target.value;
        renderCleanDocument();
        saveState();
    });

    // Mobile Top Bar & Dock Buttons
    document.getElementById('mobile-btn-pdf')?.addEventListener('click', exportToPdf);
    document.getElementById('mobile-dock-pdf')?.addEventListener('click', exportToPdf);
    document.getElementById('mobile-dock-catalog')?.addEventListener('click', openCatalogModal);
    document.getElementById('mobile-btn-lock')?.addEventListener('click', lockStudio);
    document.getElementById('btn-sidebar-lock')?.addEventListener('click', lockStudio);

    // Password Eye Toggle
    document.getElementById('btn-toggle-password')?.addEventListener('click', togglePasswordVisibility);

    // Auth Form Submit
    document.getElementById('auth-form')?.addEventListener('submit', handleAuthSubmit);

    // Universal Confirmation Modal OK Button
    document.getElementById('confirm-modal-ok-btn')?.addEventListener('click', (e) => {
        executeAppConfirmOk(e);
    });
}

// Load Sample Data (Optional)
function loadSampleData(type) {
    if (type === "angebot") {
        appState = JSON.parse(JSON.stringify(SAMPLE_QUOTE_DATA));
    } else {
        appState = JSON.parse(JSON.stringify(SAMPLE_INVOICE_DATA));
    }
    renderAll();
    saveState();
}

/**
 * EXPORT TO PDF
 * Exports exclusively the pristine clean document template (No edit buttons, No dropdowns, No resize handles)
 * Persistently saves the exported invoice to the archive and synchronizes all menu buttons & badges
 */
function exportToPdf() {
    // 1. Persistently book and save the current invoice to archive on PDF export
    saveCurrentInvoiceToArchive(false);

    // 2. Synchronize all menu buttons, launcher tiles, and tab badges
    updateAllAppStatesAndBadges();

    renderCleanDocument();
    
    const cleanElement = document.getElementById('clean-pdf-document');
    if (!cleanElement) {
        showToast("Fehler beim Vorbereiten des Dokuments.");
        return;
    }
    const filename = `${appState.docNumber || 'Dokument'}_Palnau_Gartenbau.pdf`;

    showToast("PDF wird generiert & Menüs aktualisiert...");

    // Make clean document visible for natural layout flow in html2pdf container
    // Pinned footer layout: flex column with min-height matching A4 (1116px ≈ 295.3mm)
    cleanElement.style.display = 'flex';
    cleanElement.style.flexDirection = 'column';
    cleanElement.style.justifyContent = 'space-between';
    cleanElement.style.position = 'static';
    cleanElement.style.width = '794px';
    cleanElement.style.maxWidth = '794px';
    cleanElement.style.minHeight = '1116px';
    cleanElement.style.height = 'auto';
    cleanElement.style.boxSizing = 'border-box';
    cleanElement.style.padding = '32px 42px 24px 42px';
    cleanElement.style.margin = '0 auto';
    cleanElement.style.backgroundColor = '#ffffff';

    const resetCleanElementStyles = () => {
        cleanElement.style.display = 'none';
        cleanElement.style.position = '';
        cleanElement.style.top = '';
        cleanElement.style.left = '';
        cleanElement.style.width = '';
        cleanElement.style.maxWidth = '';
        cleanElement.style.minHeight = '';
        cleanElement.style.boxSizing = '';
        cleanElement.style.padding = '';
        cleanElement.style.flexDirection = '';
        cleanElement.style.justifyContent = '';
        cleanElement.style.margin = '';
        cleanElement.style.backgroundColor = '';
        cleanElement.style.zIndex = '';
    };

    if (typeof html2pdf === 'undefined') {
        console.warn("html2pdf library is unavailable, falling back to window.print()");
        resetCleanElementStyles();
        renderCleanDocument();
        window.print();
        showToast("Beleg im Archiv gesichert & Druckansicht geöffnet!");
        return;
    }

    const opt = {
        margin: [0, 0, 0, 0],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    html2pdf()
        .set(opt)
        .from(cleanElement)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
            const totalPages = pdf.internal.getNumberOfPages();
            // If an unwanted trailing white page is generated on single-page doc, safely remove it
            if (totalPages > 1 && cleanElement.offsetHeight <= 1125) {
                pdf.deletePage(totalPages);
            }
        })
        .save()
        .then(() => {
            resetCleanElementStyles();
            updateAllAppStatesAndBadges();
            showToast("PDF heruntergeladen & Beleg im Archiv gesichert! Alle Menüs aktualisiert.");
        })
        .catch(err => {
            resetCleanElementStyles();
            console.error("PDF generation fallback", err);
            showToast("Fallback: Druckansicht wird geöffnet...");
            setTimeout(() => {
                renderCleanDocument();
                window.print();
            }, 300);
        });
}

// Ensure clean document is populated before any print action
window.addEventListener('beforeprint', () => {
    if (typeof renderCleanDocument === 'function') {
        renderCleanDocument();
    }
});

// Escape HTML
function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================================================
// AUTHENTICATION & SECURITY (PASSWORD PROTECTION)
// Required Password: Palnaugartenbaugmbh
// ==========================================================================

const APP_PASSWORD = "Palnaugartenbaugmbh";

function checkAuthOnLoad() {
    const isAuth = localStorage.getItem('palnau_studio_auth') === 'granted' || 
                   sessionStorage.getItem('palnau_studio_auth') === 'granted';
    const lockScreen = document.getElementById('auth-lock-screen');
    if (!lockScreen) return;

    if (isAuth) {
        lockScreen.classList.add('hidden');
        setTimeout(() => {
            lockScreen.style.display = 'none';
            switchAppView('launcher');
        }, 300);
    } else {
        // Ensure sub-screens are hidden before login
        const screens = [
            'app-launcher-menu', 
            'app-invoices-overview', 
            'app-main-shell', 
            'app-erechnung-hub', 
            'app-catalog-view', 
            'app-clients-view', 
            'app-quarters-view'
        ];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        lockScreen.style.display = 'flex';
        lockScreen.classList.remove('hidden');
        const input = document.getElementById('auth-password-input');
        if (input) {
            setTimeout(() => input.focus(), 200);
        }
    }
}

window.handleAuthSubmit = function(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('auth-password-input');
    const errorMsg = document.getElementById('auth-error-msg');
    const card = document.querySelector('.auth-card');
    if (!input) return;

    const entered = input.value.trim();

    // Tolerant check: exact or case-insensitive to account for mobile auto-capitalization
    if (entered === APP_PASSWORD || entered.toLowerCase() === APP_PASSWORD.toLowerCase()) {
        localStorage.setItem('palnau_studio_auth', 'granted');
        sessionStorage.setItem('palnau_studio_auth', 'granted');
        
        if (errorMsg) errorMsg.style.display = 'none';

        const lockScreen = document.getElementById('auth-lock-screen');
        if (lockScreen) {
            lockScreen.classList.add('hidden');
            setTimeout(() => {
                lockScreen.style.display = 'none';
                switchAppView('launcher');
            }, 300);
        }
        showToast("Willkommen! Hauptmenü freigeschaltet.");
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
        if (card) {
            card.classList.remove('shake');
            void card.offsetWidth; // Trigger DOM reflow to restart shake animation
            card.classList.add('shake');
        }
        input.select();
        input.focus();
    }
};

function togglePasswordVisibility() {
    const input = document.getElementById('auth-password-input');
    const btn = document.getElementById('btn-toggle-password');
    if (!input || !btn) return;

    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Verbergen';
    } else {
        input.type = 'password';
        btn.textContent = 'Anzeigen';
    }
}

function lockStudio() {
    showAppConfirm(
        "Möchten Sie das Studio sperren und sich abmelden?",
        () => {
            localStorage.removeItem('palnau_studio_auth');
            sessionStorage.removeItem('palnau_studio_auth');
            
            const screens = [
                'app-launcher-menu', 
                'app-invoices-overview', 
                'app-quotes-overview',
                'app-main-shell', 
                'app-erechnung-hub', 
                'app-catalog-view', 
                'app-clients-view', 
                'app-quarters-view'
            ];
            screens.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            const lockScreen = document.getElementById('auth-lock-screen');
            const input = document.getElementById('auth-password-input');
            const errorMsg = document.getElementById('auth-error-msg');

            if (errorMsg) errorMsg.style.display = 'none';
            if (input) input.value = '';

            if (lockScreen) {
                lockScreen.style.display = 'flex';
                setTimeout(() => {
                    lockScreen.classList.remove('hidden');
                    if (input) input.focus();
                }, 20);
            }
            showToast("Studio gesperrt.");
        },
        { title: "Studio sperren", confirmText: "Sperren & Abmelden", btnColor: "#475569" }
    );
}

// ==========================================================================
// VIEW SWITCHER & MULTI-VIEW ARCHITECTURE
// 'launcher' | 'overview' | 'generator' | 'erechnung' | 'catalog' | 'clients' | 'quarters'
// ==========================================================================

let currentActiveView = 'launcher';

window.switchAppView = function(viewName) {
    currentActiveView = viewName;
    const views = {
        'launcher': document.getElementById('app-launcher-menu'),
        'overview': document.getElementById('app-invoices-overview'),
        'quotes': document.getElementById('app-quotes-overview'),
        'generator': document.getElementById('app-main-shell'),
        'erechnung': document.getElementById('app-erechnung-hub'),
        'catalog': document.getElementById('app-catalog-view'),
        'clients': document.getElementById('app-clients-view'),
        'quarters': document.getElementById('app-quarters-view'),
        'loans': document.getElementById('app-loans-view'),
        'worktime': document.getElementById('app-worktime-view'),
        'expenses': document.getElementById('app-expenses-view')
    };

    // Hide all views first
    Object.values(views).forEach(el => {
        if (el) el.style.display = 'none';
    });

    // Update active tab buttons across all views
    document.querySelectorAll('.neu-app-tab-btn').forEach(btn => {
        const targetView = btn.getAttribute('data-view');
        btn.classList.toggle('active', targetView === viewName);
    });

    // Show target view
    const targetEl = views[viewName];
    if (targetEl) {
        targetEl.style.display = 'flex';
    }

    // Trigger view-specific renderers
    if (viewName === 'launcher') {
        clearLauncherSearch();
        updateAllAppStatesAndBadges();
    } else if (viewName === 'overview') {
        renderOverviewInvoices();
        updateAllAppStatesAndBadges();
    } else if (viewName === 'quotes') {
        if (typeof renderQuotesOverview === 'function') {
            renderQuotesOverview();
        }
        updateAllAppStatesAndBadges();
    } else if (viewName === 'generator') {
        renderAll();
        updateAllAppStatesAndBadges();
    } else if (viewName === 'erechnung') {
        renderERechnungHub();
        updateAllAppStatesAndBadges();
    } else if (viewName === 'catalog') {
        renderCatalogView();
        updateAllAppStatesAndBadges();
    } else if (viewName === 'clients') {
        renderClientsView();
        updateAllAppStatesAndBadges();
    } else if (viewName === 'quarters') {
        renderQuartersView();
        updateAllAppStatesAndBadges();
    } else if (viewName === 'loans') {
        if (typeof renderLoansView === 'function') {
            renderLoansView();
        }
        updateAllAppStatesAndBadges();
    } else if (viewName === 'worktime') {
        if (typeof renderWorktimeView === 'function') {
            renderWorktimeView();
        }
        updateAllAppStatesAndBadges();
    } else if (viewName === 'expenses') {
        if (typeof renderExpensesView === 'function') {
            renderExpensesView();
        }
        updateAllAppStatesAndBadges();
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
};

// ==========================================================================
// INVOICES ARCHIVE (PERSISTENCE & STORAGE)
// Stores all created/finalized invoices in localStorage ('palnau_invoices_archive')
// Seeded with SEED_INVOICES_ARCHIVE for rich initial overview
// Permanently persists deleted IDs in 'palnau_deleted_invoices'
// ==========================================================================

const ARCHIVE_STORAGE_KEY = 'palnau_invoices_archive';
const DELETED_INVOICES_KEY = 'palnau_deleted_invoices';

function getDeletedInvoicesSet() {
    try {
        const raw = localStorage.getItem(DELETED_INVOICES_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            return new Set(Array.isArray(arr) ? arr : []);
        }
    } catch (e) {}
    return new Set();
}

function markInvoiceAsDeleted(id, docNumber) {
    const set = getDeletedInvoicesSet();
    if (id) set.add(String(id));
    if (docNumber) set.add(String(docNumber));
    localStorage.setItem(DELETED_INVOICES_KEY, JSON.stringify(Array.from(set)));
}

function unmarkInvoiceAsDeleted(id, docNumber) {
    const set = getDeletedInvoicesSet();
    if (id) set.delete(String(id));
    if (docNumber) set.delete(String(docNumber));
    localStorage.setItem(DELETED_INVOICES_KEY, JSON.stringify(Array.from(set)));
}

// ==========================================================================
// PAID STATUS PERSISTENCE REGISTRY (GARANTIERT DAUERHAFTEN BEZAHLT-STATUS)
// ==========================================================================
const PAID_INVOICES_REGISTRY_KEY = 'palnau_paid_invoices_registry';

function getPaidInvoicesRegistry() {
    try {
        const raw = localStorage.getItem(PAID_INVOICES_REGISTRY_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch(e) {
        return {};
    }
}

function savePaidInvoicesRegistry(registry) {
    try {
        localStorage.setItem(PAID_INVOICES_REGISTRY_KEY, JSON.stringify(registry));
    } catch(e) {
        console.error("Error saving paid invoices registry", e);
    }
}

function markInvoiceInPaidRegistry(id, docNumber, paidAt) {
    const reg = getPaidInvoicesRegistry();
    const entry = {
        paid: true,
        paidAt: paidAt || new Date().toLocaleDateString('de-DE'),
        updatedAt: new Date().toISOString()
    };
    if (id) reg[String(id)] = entry;
    if (docNumber) reg[String(docNumber)] = entry;
    savePaidInvoicesRegistry(reg);
}

function unmarkInvoiceInPaidRegistry(id, docNumber) {
    const reg = getPaidInvoicesRegistry();
    if (id) delete reg[String(id)];
    if (docNumber) delete reg[String(docNumber)];
    savePaidInvoicesRegistry(reg);
}

window.getInvoicesArchive = function() {
    const deletedSet = getDeletedInvoicesSet();
    let list = [];
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    const isInitialized = localStorage.getItem('palnau_workspace_initialized') === 'true';
    
    if (raw === null && !isInitialized) {
        // Only on the very first local run if workspace was never initialized
        const initialSeeds = (typeof SEED_INVOICES_ARCHIVE !== 'undefined') ? JSON.parse(JSON.stringify(SEED_INVOICES_ARCHIVE)) : [];
        list = initialSeeds.filter(seed => !deletedSet.has(String(seed.id)) && !deletedSet.has(String(seed.docNumber)));
        localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
        localStorage.setItem('palnau_workspace_initialized', 'true');
    } else if (raw) {
        try {
            const parsed = JSON.parse(raw);
            list = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.warn("Corrupt archive", e);
            list = [];
        }
    } else {
        list = [];
    }

    // Filter out any deleted items
    list = list.filter(inv => !deletedSet.has(String(inv.id)) && !deletedSet.has(String(inv.docNumber)));

    // Seed realistic quotes if not yet present in archive
    if (typeof SEED_QUOTES_ARCHIVE !== 'undefined' && Array.isArray(SEED_QUOTES_ARCHIVE)) {
        const hasQuotes = list.some(inv => inv.docType === 'angebot');
        const quotesSeeded = localStorage.getItem('palnau_quotes_seeded') === 'true';
        if (!hasQuotes && !quotesSeeded) {
            const initialQuotes = SEED_QUOTES_ARCHIVE.filter(seed => !deletedSet.has(String(seed.id)) && !deletedSet.has(String(seed.docNumber)));
            list = [...list, ...initialQuotes];
            localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
            localStorage.setItem('palnau_quotes_seeded', 'true');
        }
    }

    // Unveränderlicher Bezahlstatus-Schutz über die Registry
    const paidRegistry = getPaidInvoicesRegistry();
    let archiveModified = false;

    list.forEach(inv => {
        const regEntry = paidRegistry[String(inv.id)] || (inv.docNumber && paidRegistry[String(inv.docNumber)]);
        if (regEntry && regEntry.paid) {
            if (inv.paymentStatus !== 'bezahlt' || inv.status !== 'bezahlt' || !inv.isPaid) {
                inv.paymentStatus = 'bezahlt';
                inv.status = 'bezahlt';
                inv.isPaid = true;
                inv.paidAt = inv.paidAt || regEntry.paidAt || new Date().toLocaleDateString('de-DE');
                archiveModified = true;
            }
        } else if (inv.paymentStatus === 'bezahlt' || inv.status === 'bezahlt' || inv.isPaid === true) {
            paidRegistry[String(inv.id)] = { paid: true, paidAt: inv.paidAt || new Date().toLocaleDateString('de-DE') };
            if (inv.docNumber) paidRegistry[String(inv.docNumber)] = { paid: true, paidAt: inv.paidAt || new Date().toLocaleDateString('de-DE') };
            savePaidInvoicesRegistry(paidRegistry);
        }
    });

    if (archiveModified) {
        try {
            localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
        } catch(e) {}
    }

    // Normalization safeguard: ensure totalNet, totalTax, totalGross and clientType are present
    return list.map(inv => {
        const net = parseFloat(inv.totalNet ?? inv.netTotal ?? 0) || 0;
        const tax = parseFloat(inv.totalTax ?? inv.taxAmount ?? 0) || 0;
        const gross = parseFloat(inv.totalGross ?? inv.grossTotal ?? (net + tax)) || 0;
        
        let cType = inv.clientType || (inv.client && inv.client.clientType);
        if (!cType) {
            cType = (typeof isCompanyClient === 'function' && isCompanyClient(inv.client, inv.clientType)) ? 'firma' : 'privat';
        } else if (cType !== 'firma' && typeof isCompanyClient === 'function' && isCompanyClient(inv.client)) {
            cType = 'firma';
        }

        return {
            ...inv,
            clientType: cType,
            client: inv.client ? { ...inv.client, clientType: cType } : { clientType: cType },
            totalNet: net,
            netTotal: net,
            totalTax: tax,
            taxAmount: tax,
            totalGross: gross,
            grossTotal: gross
        };
    });
};

window.saveInvoiceToArchive = function(invoiceData) {
    unmarkInvoiceAsDeleted(invoiceData.id, invoiceData.docNumber);
    const archive = getInvoicesArchive();
    const existingIndex = archive.findIndex(inv => inv.id === invoiceData.id || inv.docNumber === invoiceData.docNumber);

    const paidRegistry = getPaidInvoicesRegistry();
    const isRegisteredPaid = paidRegistry[String(invoiceData.id)]?.paid || (invoiceData.docNumber && paidRegistry[String(invoiceData.docNumber)]?.paid);

    if (existingIndex >= 0) {
        const existing = archive[existingIndex];
        const wasPaid = (existing.paymentStatus === 'bezahlt' || existing.status === 'bezahlt' || existing.isPaid === true || isRegisteredPaid);
        
        // Bezahlt-Status niemals überschreiben, außer es wurde explizit auf 'offen' geändert
        if (wasPaid && invoiceData.paymentStatus !== 'offen' && invoiceData.status !== 'offen') {
            invoiceData.paymentStatus = 'bezahlt';
            invoiceData.status = 'bezahlt';
            invoiceData.isPaid = true;
            if (existing.paidAt && !invoiceData.paidAt) invoiceData.paidAt = existing.paidAt;
            if (existing.wasMahnungResolved) invoiceData.wasMahnungResolved = true;
            markInvoiceInPaidRegistry(invoiceData.id, invoiceData.docNumber, invoiceData.paidAt);
        }

        archive[existingIndex] = { ...archive[existingIndex], ...invoiceData, updatedAt: new Date().toISOString() };
    } else {
        if (isRegisteredPaid && invoiceData.paymentStatus !== 'offen' && invoiceData.status !== 'offen') {
            invoiceData.paymentStatus = 'bezahlt';
            invoiceData.status = 'bezahlt';
            invoiceData.isPaid = true;
            invoiceData.paidAt = paidRegistry[String(invoiceData.id)]?.paidAt || new Date().toLocaleDateString('de-DE');
        }
        archive.unshift({ ...invoiceData, createdAt: new Date().toISOString() });
    }

    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
    updateAllAppStatesAndBadges();
    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud();
    }
    return archive;
};

window.saveCurrentInvoiceToArchive = function(notifyUser = true) {
    const totals = calculateTotals();
    const invoiceId = appState.activeArchiveId || ('inv-' + Date.now());
    appState.activeArchiveId = invoiceId;

    const archive = getInvoicesArchive();
    const existing = archive.find(inv => inv.id === invoiceId || (appState.docNumber && inv.docNumber === appState.docNumber));
    const paidRegistry = getPaidInvoicesRegistry();
    const wasPaid = (existing && (existing.paymentStatus === 'bezahlt' || existing.status === 'bezahlt' || existing.isPaid)) ||
                    paidRegistry[String(invoiceId)]?.paid ||
                    (appState.docNumber && paidRegistry[String(appState.docNumber)]?.paid);

    const invoiceRecord = {
        id: invoiceId,
        docType: appState.docType || "rechnung",
        docNumber: appState.docNumber || generateDocNumber("rechnung"),
        docDate: appState.docDate || formatDateForGermanDisplay(new Date()),
        servicePeriod: appState.servicePeriod || getCurrentMonthGerman(),
        taxRate: appState.taxRate || 19,
        clientType: appState.clientType || "privat",
        workLocation: appState.workLocation || "",
        customWageNet: appState.customWageNet !== undefined ? appState.customWageNet : null,
        client: {
            name: appState.client.name || "Kunde ohne Name",
            street: appState.client.street || "",
            zipCity: appState.client.zipCity || "",
            clientType: appState.clientType || "privat",
            workLocation: appState.workLocation || ""
        },
        items: JSON.parse(JSON.stringify(appState.items || [])),
        notesText: appState.notesText || "",
        totalNet: totals.netTotal,
        totalTax: totals.taxAmount,
        totalGross: totals.grossTotal,
        status: wasPaid ? "bezahlt" : (existing ? (existing.status || "ausgestellt") : "ausgestellt"),
        paymentStatus: wasPaid ? "bezahlt" : (existing ? (existing.paymentStatus || "offen") : "offen"),
        isPaid: Boolean(wasPaid),
        paidAt: wasPaid ? (existing?.paidAt || paidRegistry[String(invoiceId)]?.paidAt || new Date().toLocaleDateString('de-DE')) : undefined
    };

    saveInvoiceToArchive(invoiceRecord);
    saveState();

    // Update status badge
    const badge = document.getElementById('gen-active-status-badge');
    if (badge) {
        badge.textContent = `Gebucht: ${invoiceRecord.docNumber}`;
        badge.style.borderColor = '#10b981';
        badge.style.color = '#10b981';
    }

    if (notifyUser) {
        if (appState.docType === 'angebot') {
            showToast(`Angebot ${invoiceRecord.docNumber} (${formatCurrency(totals.grossTotal)}) in der Angebots-Übersicht gespeichert!`);
        } else {
            showToast(`Rechnung ${invoiceRecord.docNumber} (${formatCurrency(totals.grossTotal)}) im Archiv gespeichert!`);
        }
    }
};

window.deleteInvoiceFromArchive = function(invoiceId) {
    if (!invoiceId) return;
    const archive = getInvoicesArchive();
    const target = archive.find(inv => String(inv.id) === String(invoiceId));
    const docNum = target ? target.docNumber : `Beleg #${invoiceId}`;

    markInvoiceAsDeleted(invoiceId, target ? target.docNumber : null);
    const updated = archive.filter(inv => String(inv.id) !== String(invoiceId));
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('palnau_workspace_initialized', 'true');
    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud(true);
    }

    // If the deleted invoice was currently open in editor, clear its reference
    if (appState.activeArchiveId && String(appState.activeArchiveId) === String(invoiceId)) {
        appState.activeArchiveId = null;
        if (typeof closeAppConfirm === 'function') closeAppConfirm();
        startCleanState();
        const badge = document.getElementById('gen-active-status-badge');
        if (badge) {
            badge.textContent = "Modus: Neuer Beleg";
            badge.style.borderColor = '';
            badge.style.color = '';
        }
        const btnDeleteActive = document.getElementById('btn-delete-active-doc');
        if (btnDeleteActive) btnDeleteActive.style.display = 'none';
    }

    if (typeof renderOverviewInvoices === 'function') renderOverviewInvoices();
    if (typeof renderQuotesOverview === 'function') renderQuotesOverview();
    if (typeof renderClientsView === 'function') renderClientsView();
    if (typeof renderQuartersView === 'function') renderQuartersView();
    if (typeof renderERechnungHub === 'function') renderERechnungHub();
    if (typeof renderAll === 'function') renderAll();
    updateAllAppStatesAndBadges();
    showToast(`${docNum} erfolgreich gelöscht.`);
};

window.deleteClient = function(clientName) {
    if (!clientName) return;
    const archive = getInvoicesArchive();
    const clientInvoices = archive.filter(inv => (inv.client && inv.client.name) === clientName);

    clientInvoices.forEach(inv => {
        markInvoiceAsDeleted(inv.id, inv.docNumber);
    });

    const updated = archive.filter(inv => !(inv.client && inv.client.name === clientName));
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('palnau_workspace_initialized', 'true');
    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud(true);
    }

    if (appState && appState.client && appState.client.name === clientName) {
        appState.activeArchiveId = null;
    }

    renderClientsView();
    if (typeof renderOverviewInvoices === 'function') renderOverviewInvoices();
    if (typeof renderQuartersView === 'function') renderQuartersView();
    if (typeof renderERechnungHub === 'function') renderERechnungHub();
    if (typeof renderAll === 'function') renderAll();
    updateAllAppStatesAndBadges();
    showToast(`Kunde "${clientName}" wurde erfolgreich gelöscht.`);
};

window.clearAllInvoicesArchive = function() {
    const archive = getInvoicesArchive();
    if (archive.length === 0) {
        showToast("Das Rechnungsarchiv ist bereits leer.");
        return;
    }
    showAppConfirm(
        `Möchten Sie wirklich ALLE ${archive.length} Belege unwiderruflich aus dem Rechnungsarchiv und Cloud-Speicher aller Geräte löschen?`,
        () => {
            archive.forEach(inv => {
                markInvoiceAsDeleted(inv.id, inv.docNumber);
            });
            localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify([]));
            localStorage.setItem('palnau_workspace_initialized', 'true');
            if (appState) {
                appState.activeArchiveId = null;
            }
            if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
                window.PalnauCloudSync.pushLocalToCloud(true);
            }
            if (typeof renderOverviewInvoices === 'function') renderOverviewInvoices();
            if (typeof renderClientsView === 'function') renderClientsView();
            if (typeof renderQuartersView === 'function') renderQuartersView();
            if (typeof renderERechnungHub === 'function') renderERechnungHub();
            if (typeof renderAll === 'function') renderAll();
            updateAllAppStatesAndBadges();
            showToast("Alle Belege wurden erfolgreich gelöscht.");
        },
        { title: "Gesamtes Archiv leeren", confirmText: "Alle löschen", btnColor: "#e11d48" }
    );
};

window.resetCurrentDoc = function() {
    showAppConfirm(
        "Möchten Sie alle Felder leeren und ein neues Dokument starten?",
        () => {
            startCleanState(true);
            renderAll();
            showToast("Formular geleert – Neuer Beleg angelegt.");
        },
        { title: "Dokument leeren", confirmText: "Formular leeren", btnColor: "#e11d48" }
    );
};

window.deleteCurrentActiveInvoice = function() {
    if (!appState || !appState.activeArchiveId) {
        showToast("Dieser Beleg ist noch nicht im Archiv gespeichert.");
        return;
    }
    const archiveId = appState.activeArchiveId;
    deleteInvoiceFromArchive(archiveId);
    startCleanState();
    renderAll();
};

window.editInvoiceInGenerator = function(invoiceId) {
    const archive = getInvoicesArchive();
    const invoice = archive.find(inv => inv.id === invoiceId);
    if (!invoice) {
        showToast("Rechnung nicht gefunden.");
        return;
    }

    // Load into appState
    appState.activeArchiveId = invoice.id;
    appState.docType = invoice.docType || "rechnung";
    appState.docNumber = invoice.docNumber;
    appState.docDate = normalizeToGermanDate(invoice.docDate);
    appState.servicePeriod = invoice.servicePeriod || "";
    appState.taxRate = invoice.taxRate || 19;
    appState.clientType = invoice.clientType || (invoice.client && invoice.client.clientType) || ((typeof isCompanyClient === 'function' && isCompanyClient(invoice.client)) ? "firma" : "privat");
    appState.workLocation = invoice.workLocation || (invoice.client && invoice.client.workLocation) || "";
    appState.customWageNet = invoice.customWageNet !== undefined ? invoice.customWageNet : null;
    appState.client = {
        name: invoice.client ? invoice.client.name : "",
        street: invoice.client ? invoice.client.street : "",
        zipCity: invoice.client ? invoice.client.zipCity : "",
        clientType: appState.clientType,
        workLocation: appState.workLocation
    };
    appState.items = JSON.parse(JSON.stringify(invoice.items || []));
    appState.notesText = invoice.notesText || "";

    saveState();

    // Update status badge
    const badge = document.getElementById('gen-active-status-badge');
    if (badge) {
        badge.textContent = `Bearbeite: ${invoice.docNumber}`;
        badge.style.borderColor = '#38bdf8';
        badge.style.color = '#38bdf8';
    }

    switchAppView('generator');
    showToast(`Rechnung ${invoice.docNumber} in den Editor geladen.`);
};

window.createNewInvoiceInGenerator = function() {
    startCleanState();
    appState.activeArchiveId = null;
    const badge = document.getElementById('gen-active-status-badge');
    if (badge) {
        badge.textContent = "Modus: Neuer Beleg";
        badge.style.borderColor = '';
        badge.style.color = '';
    }
    switchAppView('generator');
    showToast("Neues Rechnungsformular geöffnet.");
};

window.createNewQuoteInGenerator = function() {
    startCleanState();
    appState.activeArchiveId = null;
    appState.docType = "angebot";
    appState.docNumber = generateDocNumber("angebot");
    appState.docDate = formatDateForGermanDisplay(new Date());
    appState.servicePeriod = "Gültig 30 Tage ab Ausstellungsdatum";
    appState.notesText = "Wir freuen uns über Ihr Interesse. Dieses Angebot ist freibleibend und 30 Tage ab Ausstellungsdatum gültig.";
    saveState();
    const badge = document.getElementById('gen-active-status-badge');
    if (badge) {
        badge.textContent = `Neues Angebot: ${appState.docNumber}`;
        badge.style.borderColor = '#059669';
        badge.style.color = '#059669';
    }
    switchAppView('generator');
    showToast(`Neues Angebot ${appState.docNumber} geöffnet.`);
};

window.editQuoteInGenerator = function(quoteId) {
    const archive = getInvoicesArchive();
    const quote = archive.find(inv => String(inv.id) === String(quoteId));
    if (!quote) {
        showToast("Angebot nicht gefunden.");
        return;
    }

    appState.activeArchiveId = quote.id;
    appState.docType = "angebot";
    appState.docNumber = quote.docNumber;
    appState.docDate = normalizeToGermanDate(quote.docDate);
    appState.servicePeriod = quote.servicePeriod || "Gültig 30 Tage ab Ausstellungsdatum";
    appState.taxRate = quote.taxRate || 19;
    appState.clientType = quote.clientType || (quote.client && quote.client.clientType) || "privat";
    appState.workLocation = quote.workLocation || (quote.client && quote.client.workLocation) || "";
    appState.client = {
        name: quote.client ? quote.client.name : "",
        street: quote.client ? quote.client.street : "",
        zipCity: quote.client ? quote.client.zipCity : "",
        clientType: appState.clientType,
        workLocation: appState.workLocation
    };
    appState.items = JSON.parse(JSON.stringify(quote.items || []));
    appState.notesText = quote.notesText || "Wir freuen uns über Ihr Interesse. Dieses Angebot ist freibleibend und 30 Tage ab Ausstellungsdatum gültig.";

    saveState();

    const badge = document.getElementById('gen-active-status-badge');
    if (badge) {
        badge.textContent = `Bearbeite Angebot: ${quote.docNumber}`;
        badge.style.borderColor = '#059669';
        badge.style.color = '#059669';
    }

    switchAppView('generator');
    showToast(`Angebot ${quote.docNumber} in den Editor geladen.`);
};

window.updateAllAppStatesAndBadges = function() {
    const archive = getInvoicesArchive();
    const invoices = archive.filter(inv => (inv.docType || 'rechnung') !== 'angebot');
    const quotes = archive.filter(inv => inv.docType === 'angebot');

    const totalCount = invoices.length;
    const totalQuotesCount = quotes.length;
    const totalGross = invoices.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);

    // Calculate unique clients
    const clientsSet = new Set();
    archive.forEach(inv => {
        if (inv.client && inv.client.name && inv.client.name.trim()) {
            clientsSet.add(inv.client.name.trim().toLowerCase());
        }
    });
    const uniqueClientsCount = clientsSet.size;

    // 1. Launcher Badges & Counters
    const bCount = document.getElementById('launcher-count-badge');
    if (bCount) bCount.textContent = `${totalCount} Rechnungen`;

    const bQuotes = document.getElementById('launcher-quotes-badge');
    if (bQuotes) bQuotes.textContent = `${totalQuotesCount} Angebote`;

    const bXml = document.getElementById('launcher-xml-badge');
    if (bXml) bXml.textContent = `${totalCount} XML`;

    const bClients = document.getElementById('launcher-clients-badge');
    if (bClients) bClients.textContent = `${uniqueClientsCount} Kunden`;

    const bQuarters = document.getElementById('launcher-quarters-badge');
    if (bQuarters) bQuarters.textContent = formatCurrency(totalGross);

    // Tab counters
    const tabInvCount = document.getElementById('tab-invoices-count');
    if (tabInvCount) tabInvCount.textContent = String(totalCount);

    const tabQuotesCount = document.getElementById('tab-quotes-count');
    if (tabQuotesCount) tabQuotesCount.textContent = String(totalQuotesCount);

    const tabQuotesInvoicesCount = document.getElementById('tab-quotes-invoices-count');
    if (tabQuotesInvoicesCount) tabQuotesInvoicesCount.textContent = String(totalCount);

    const tabQuotesQuotesCount = document.getElementById('tab-quotes-quotes-count');
    if (tabQuotesQuotesCount) tabQuotesQuotesCount.textContent = String(totalQuotesCount);

    // Generator header convert button visibility
    const btnConvertToInvoice = document.getElementById('btn-convert-to-invoice');
    if (btnConvertToInvoice) {
        btnConvertToInvoice.style.display = (appState && appState.docType === 'angebot') ? 'inline-flex' : 'none';
    }

    // Loans Badge
    if (typeof getLoanData === 'function') {
        const loanData = getLoanData();
        const totalBudget = (loanData.budgets?.bga || 0) + (loanData.budgets?.betriebsmittel || 0) + (loanData.budgets?.uebernahme || 0);
        const totalSpent = (loanData.entries || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        const totalRemaining = totalBudget - totalSpent;
        const bLoans = document.getElementById('launcher-loans-badge');
        if (bLoans) bLoans.textContent = `${formatCurrency(totalRemaining)} frei`;
    }

    // Worktime Badge
    if (typeof getWorktimeData === 'function') {
        const wtData = getWorktimeData();
        const activeEmployees = (wtData.employees || []).filter(e => e.status !== 'inactive');
        let totalBalance = 0;
        activeEmployees.forEach(emp => {
            const empEntries = (wtData.entries || []).filter(e => e.employeeId === emp.id);
            const aufbau = empEntries.filter(e => e.type === 'aufbau').reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
            const abbau = empEntries.filter(e => e.type === 'abbau' || e.type === 'auszahlung').reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
            totalBalance += (parseFloat(emp.initialBalance) || 0) + aufbau - abbau;
        });
        const bWorktime = document.getElementById('launcher-worktime-badge');
        if (bWorktime) {
            const sign = totalBalance > 0 ? '+' : '';
            bWorktime.textContent = `${sign}${totalBalance.toFixed(1).replace('.', ',')} Std.`;
        }
    }

    // Expenses Badge
    if (typeof getExpensesData === 'function') {
        const expData = getExpensesData();
        const activeMonth = (typeof expensesSelectedMonth !== 'undefined') ? expensesSelectedMonth : '03';
        const activeYear = (typeof expensesSelectedYear !== 'undefined') ? expensesSelectedYear : 2026;
        let monthTotal = 0;
        if (typeof getExpensesForMonth === 'function') {
            const mExp = getExpensesForMonth(activeYear, activeMonth);
            monthTotal = mExp.totalGross;
        } else {
            monthTotal = (expData.recurring || []).filter(r => r.active !== false).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
        }
        const bExpenses = document.getElementById('launcher-expenses-badge');
        if (bExpenses) {
            bExpenses.textContent = `${formatCurrency(monthTotal)}`;
        }
    }

    // 2. Universal Top Navigation Segmented Tab Badges across all screens
    document.querySelectorAll('.tab-badge-overview').forEach(el => {
        el.textContent = String(totalCount);
    });
    document.querySelectorAll('.tab-badge-clients').forEach(el => {
        el.textContent = String(uniqueClientsCount);
    });

    // 3. Keep open views in sync with persistent data updates
    if (typeof currentActiveView !== 'undefined') {
        if (currentActiveView === 'clients' && typeof renderClientsView === 'function') {
            renderClientsView();
        } else if (currentActiveView === 'quarters' && typeof renderQuartersView === 'function') {
            renderQuartersView();
        } else if (currentActiveView === 'overview' && typeof renderOverviewInvoices === 'function') {
            renderOverviewInvoices();
        } else if (currentActiveView === 'quotes' && typeof renderQuotesOverview === 'function') {
            renderQuotesOverview();
        } else if (currentActiveView === 'erechnung' && typeof renderERechnungHub === 'function') {
            renderERechnungHub();
        } else if (currentActiveView === 'loans' && typeof renderLoansView === 'function') {
            renderLoansView();
        } else if (currentActiveView === 'worktime' && typeof renderWorktimeView === 'function') {
            renderWorktimeView();
        } else if (currentActiveView === 'expenses' && typeof renderExpensesView === 'function') {
            renderExpensesView();
        }
    }
};

function updateLauncherBadgeCount() {
    updateAllAppStatesAndBadges();
}

// ==========================================================================
// OVERVIEW CONTROLLER (FILTER, GROUP BY MONTH/QUARTER/YEAR, SORT, SEARCH)
// ==========================================================================

let overviewFilter = {
    periodType: 'all', // 'all' | 'monthly' | 'quarter' | 'yearly'
    subPeriod: 'all',
    groupingMode: 'monthly', // 'monthly' | 'quarter' | 'list'
    sortBy: 'date-desc',
    searchTerm: '',
    status: 'all' // 'all' | 'offen' | 'erinnerung' | 'mahnung' | 'bezahlt'
};

window.setOverviewGroupingMode = function(mode) {
    overviewFilter.groupingMode = mode || 'monthly';
    
    // Update active class on view mode pills
    const modes = ['monthly', 'quarter', 'list'];
    modes.forEach(m => {
        const btn = document.getElementById(`pill-mode-${m}`);
        if (btn) btn.classList.toggle('active', m === overviewFilter.groupingMode);
    });

    renderOverviewInvoices();
};

window.setOverviewStatusFilter = function(status) {
    overviewFilter.status = status || 'all';
    
    // Update active class on filter buttons
    const btns = document.querySelectorAll('#overview-status-filter-group .btn-status-filter');
    btns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-status') === overviewFilter.status);
    });

    renderOverviewInvoices();
};

window.setOverviewPeriodFilter = function(type) {
    overviewFilter.periodType = type;

    // Automatically synchronize grouping mode with period filter
    if (type === 'monthly') {
        overviewFilter.groupingMode = 'monthly';
    } else if (type === 'quarter') {
        overviewFilter.groupingMode = 'quarter';
    }

    const modes = ['monthly', 'quarter', 'list'];
    modes.forEach(m => {
        const btn = document.getElementById(`pill-mode-${m}`);
        if (btn) btn.classList.toggle('active', m === overviewFilter.groupingMode);
    });

    // Update pill states
    const pills = ['all', 'monthly', 'quarter', 'yearly'];
    pills.forEach(p => {
        const btn = document.getElementById(`pill-period-${p}`);
        if (btn) btn.classList.toggle('active', p === type);
    });

    const subSelect = document.getElementById('overview-sub-period-select');
    if (type === 'all') {
        overviewFilter.subPeriod = 'all';
        if (subSelect) subSelect.style.display = 'none';
    } else {
        populateSubPeriodDropdown(type);
        if (subSelect) {
            subSelect.style.display = 'inline-block';
            // Pre-select the top non-all option so the view immediately changes
            if (subSelect.options.length > 1) {
                overviewFilter.subPeriod = subSelect.options[1].value;
                subSelect.value = overviewFilter.subPeriod;
            } else {
                overviewFilter.subPeriod = 'all';
            }
        }
    }

    renderOverviewInvoices();
};

function populateSubPeriodDropdown(type) {
    const subSelect = document.getElementById('overview-sub-period-select');
    if (!subSelect) return;

    const archive = getInvoicesArchive();
    subSelect.innerHTML = "";

    // Determine all years present plus 2026 and 2025
    const yearsSet = new Set([2026, 2025]);
    archive.forEach(inv => {
        const d = parseGermanDate(inv.docDate);
        if (!isNaN(d.getFullYear())) yearsSet.add(d.getFullYear());
    });
    const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);

    if (type === 'monthly') {
        subSelect.innerHTML = `<option value="all">Alle Monate</option>`;
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        
        // Find all months with invoices or generate months for recent years
        const monthsSet = new Set();
        archive.forEach(inv => {
            const d = parseGermanDate(inv.docDate);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            monthsSet.add(`${y}-${String(m).padStart(2, '0')}`);
        });

        // Always ensure at least current and recent months exist
        sortedYears.forEach(y => {
            if (y === 2026) {
                [7, 5, 4, 3, 2, 1].forEach(m => monthsSet.add(`${y}-${String(m).padStart(2, '0')}`));
            } else if (y === 2025) {
                [12, 11, 10].forEach(m => monthsSet.add(`${y}-${String(m).padStart(2, '0')}`));
            }
        });

        const sortedMonths = Array.from(monthsSet).sort().reverse();
        sortedMonths.forEach(key => {
            const [y, mStr] = key.split('-');
            const mIdx = parseInt(mStr, 10) - 1;
            subSelect.innerHTML += `<option value="${key}">${monthNames[mIdx]} ${y}</option>`;
        });
    } else if (type === 'quarter') {
        subSelect.innerHTML = `<option value="all">Alle Quartale</option>`;
        // Always generate all 4 quarters for each year so Q1, Q2, Q3, Q4 are always available!
        sortedYears.forEach(y => {
            subSelect.innerHTML += `<option value="${y}-Q1">1. Quartal (Q1) / ${y}</option>`;
            subSelect.innerHTML += `<option value="${y}-Q2">2. Quartal (Q2) / ${y}</option>`;
            subSelect.innerHTML += `<option value="${y}-Q3">3. Quartal (Q3) / ${y}</option>`;
            subSelect.innerHTML += `<option value="${y}-Q4">4. Quartal (Q4) / ${y}</option>`;
        });
    } else if (type === 'yearly') {
        subSelect.innerHTML = `<option value="all">Alle Jahre</option>`;
        sortedYears.forEach(y => {
            subSelect.innerHTML += `<option value="${y}">Jahr ${y}</option>`;
        });
    }
}

window.handleSubPeriodChange = function(val) {
    overviewFilter.subPeriod = val;
    renderOverviewInvoices();
};

window.setOverviewSort = function(sortBy) {
    overviewFilter.sortBy = sortBy;
    renderOverviewInvoices();
};

window.handleOverviewSearch = function(term) {
    overviewFilter.searchTerm = (term || "").toLowerCase().trim();
    const clearBtn = document.getElementById('overview-search-clear');
    if (clearBtn) clearBtn.style.display = term ? 'inline-block' : 'none';
    renderOverviewInvoices();
};

window.clearOverviewSearch = function() {
    const input = document.getElementById('overview-search-input');
    const clearBtn = document.getElementById('overview-search-clear');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    overviewFilter.searchTerm = '';
    renderOverviewInvoices();
};

function parseGermanDate(str) {
    if (!str) return new Date();
    const parts = String(str).split('.');
    if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        return new Date(y, m, d);
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
}

// ==========================================================================
// PAYMENT STATUS & DUNNING CALCULATOR (7 TAGE ZAHLUNGSZIEL & 14 TAGE MAHNUNG)
// ==========================================================================
window.getInvoicePaymentStatus = function(inv) {
    const isPaid = (inv.paymentStatus === 'bezahlt' || inv.status === 'bezahlt' || inv.isPaid === true);
    if (isPaid) {
        let subText = inv.paidAt ? `am ${inv.paidAt}` : 'Zahlung eingegangen';
        if (inv.wasMahnungResolved) {
            subText = inv.paidAt ? `Zahlung nach Mahnung am ${inv.paidAt}` : 'Zahlung nach Mahnung eingegangen';
        }
        return {
            status: 'bezahlt',
            isPaid: true,
            isOverdue: false,
            overdueDays: 0,
            daysPassed: 0,
            stage: 0,
            label: '✓ Bezahlt',
            badgeClass: 'badge-status-paid',
            subLabel: subText
        };
    }

    const docDate = parseGermanDate(inv.docDate);
    const now = new Date();
    // Normalize to pure calendar days
    const startOfDoc = new Date(docDate.getFullYear(), docDate.getMonth(), docDate.getDate()).getTime();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffMs = startOfToday - startOfDoc;
    const daysPassed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    // User Rule: 7 Tage Zahlungsziel
    const targetDays = 7;
    const overdueDays = daysPassed - targetDays;

    if (overdueDays > 7) {
        // Unpaid after another 7 days (i.e. > 14 days total) -> Mahnung fällig!
        return {
            status: 'mahnung',
            isPaid: false,
            isOverdue: true,
            overdueDays: overdueDays,
            daysPassed: daysPassed,
            stage: 2,
            label: '🚨 Mahnung fällig',
            badgeClass: 'badge-status-dunning',
            subLabel: `${daysPassed} Tage her (${overdueDays} Tage im Verzug)`
        };
    } else if (overdueDays > 0) {
        // Unpaid after 7 days (days 8 to 14) -> Zahlungserinnerung fällig!
        return {
            status: 'erinnerung',
            isPaid: false,
            isOverdue: true,
            overdueDays: overdueDays,
            daysPassed: daysPassed,
            stage: 1,
            label: '⚠️ Erinnerung fällig',
            badgeClass: 'badge-status-reminder',
            subLabel: `${daysPassed} Tage her (${overdueDays} Tag(e) im Verzug)`
        };
    } else {
        // Within 7 days -> Offen
        const remainingDays = targetDays - daysPassed;
        return {
            status: 'offen',
            isPaid: false,
            isOverdue: false,
            overdueDays: 0,
            daysPassed: daysPassed,
            remainingDays: remainingDays,
            stage: 0,
            label: 'Offen',
            badgeClass: 'badge-status-open',
            subLabel: remainingDays === 0 ? 'Fällig heute (7 Tage)' : `Fällig in ${remainingDays} Tag(en)`
        };
    }
};

window.toggleInvoicePaidStatus = function(invId, explicitPaid) {
    const archive = getInvoicesArchive();
    const inv = archive.find(i => String(i.id) === String(invId) || String(i.docNumber) === String(invId));
    if (!inv) return;

    const currentStatus = getInvoicePaymentStatus(inv);
    const wasInMahnung = currentStatus.status === 'mahnung' || currentStatus.status === 'erinnerung' || inv.wasMahnungResolved;

    let shouldMarkPaid;
    if (typeof explicitPaid === 'boolean') {
        shouldMarkPaid = explicitPaid;
    } else {
        shouldMarkPaid = !currentStatus.isPaid;
    }

    if (!shouldMarkPaid) {
        inv.paymentStatus = 'offen';
        inv.status = 'ausgestellt';
        inv.isPaid = false;
        delete inv.paidAt;
        delete inv.wasMahnungResolved;
        unmarkInvoiceInPaidRegistry(inv.id, inv.docNumber);
        showToast(`Rechnung ${inv.docNumber} wieder als "Offen" markiert`);
    } else {
        const paidDate = new Date().toLocaleDateString('de-DE');
        inv.paymentStatus = 'bezahlt';
        inv.status = 'bezahlt';
        inv.isPaid = true;
        inv.paidAt = paidDate;
        markInvoiceInPaidRegistry(inv.id, inv.docNumber, paidDate);
        if (wasInMahnung) {
            inv.wasMahnungResolved = true;
            showToast(`Rechnung ${inv.docNumber} als bezahlt verbucht ✓ Mahnung aufgehoben!`);
        } else {
            showToast(`Rechnung ${inv.docNumber} als bezahlt verbucht ✓`);
        }
    }

    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
    updateAllAppStatesAndBadges();
    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud(true);
    }
    renderOverviewInvoices();
    if (typeof renderQuartersView === 'function') renderQuartersView();
    if (typeof renderPowerBiDashboard === 'function' && currentActiveView === 'quarters') renderPowerBiDashboard();
};

window.renderOverviewInvoices = function() {
    const listContainer = document.getElementById('overview-invoices-list');
    if (!listContainer) return;

    let archive = getInvoicesArchive().filter(inv => (inv.docType || 'rechnung') !== 'angebot');
    const allInvoices = [...archive];

    // Calculate global status counts across all invoices
    const totalAllCount = allInvoices.length;
    let countOpen = 0;
    let countReminder = 0;
    let countDunning = 0;
    let countPaid = 0;
    const reminderInvoices = [];
    const dunningInvoices = [];

    allInvoices.forEach(inv => {
        const payInfo = getInvoicePaymentStatus(inv);
        if (payInfo.status === 'bezahlt') {
            countPaid++;
        } else if (payInfo.status === 'mahnung') {
            countDunning++;
            dunningInvoices.push({ inv, payInfo });
        } else if (payInfo.status === 'erinnerung') {
            countReminder++;
            reminderInvoices.push({ inv, payInfo });
        } else {
            countOpen++;
        }
    });

    // Update status counter badges in the UI filter group
    const cntAll = document.getElementById('status-count-all');
    const cntOffen = document.getElementById('status-count-offen');
    const cntErinnerung = document.getElementById('status-count-erinnerung');
    const cntMahnung = document.getElementById('status-count-mahnung');
    const cntBezahlt = document.getElementById('status-count-bezahlt');
    if (cntAll) cntAll.textContent = String(totalAllCount);
    if (cntOffen) cntOffen.textContent = String(countOpen);
    if (cntErinnerung) cntErinnerung.textContent = String(countReminder);
    if (cntMahnung) cntMahnung.textContent = String(countDunning);
    if (cntBezahlt) cntBezahlt.textContent = String(countPaid);

    // Render Overdue & Dunning Notification Banners
    const alertBox = document.getElementById('overview-dunning-alerts');
    if (alertBox) {
        if (countDunning > 0 || countReminder > 0) {
            let alertsHtml = '';

            // Red Banner: Mahnung fällig (> 14 Tage überfällig)
            if (countDunning > 0) {
                const clientList = dunningInvoices.map(({ inv, payInfo }) => `
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 10px 14px; background: #ffffff; border: 1.5px solid #fca5a5; border-radius: 8px; margin-top: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                        <div>
                            <strong style="color: #0f172a; font-size: 0.95rem;">${escapeHtml((inv.client && inv.client.name) || 'Kunde')}</strong>
                            <span style="font-size: 0.82rem; color: #64748b; margin-left: 8px; font-family: monospace; font-weight: 700;">${escapeHtml(inv.docNumber)}</span>
                            <span style="font-size: 0.76rem; color: #dc2626; font-weight: 800; margin-left: 8px; background: #fee2e2; padding: 3px 8px; border-radius: 4px;">${payInfo.overdueDays} Tage überfällig</span>
                            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">Ausgestellt am: ${escapeHtml(inv.docDate)}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <strong style="color: #991b1b; font-size: 1.05rem; margin-right: 6px;">${formatCurrency(inv.totalGross)}</strong>
                            <button type="button" class="btn-card-action action-dunning-btn" onclick="openDunningModal('${inv.id}', 2)" style="color: #dc2626; font-weight: 800; border-color: #fca5a5; background: #fff1f2; padding: 6px 12px; font-size: 0.82rem;">
                                📄 Mahnung erstellen & drucken
                            </button>
                            <button type="button" class="btn-card-action" onclick="toggleInvoicePaidStatus('${inv.id}', true)" style="color: #047857; font-weight: 800; border: 1.5px solid #059669; background: #ecfdf5; padding: 6px 14px; font-size: 0.82rem; cursor: pointer; box-shadow: 0 1px 3px rgba(5,150,105,0.15);" title="Zahlung verbuchen und Mahnwesen sofort aufheben">
                                ✓ Zahlung eingegangen (Bezahlt)
                            </button>
                        </div>
                    </div>
                `).join('');

                alertsHtml += `
                    <div class="dunning-alert-card stage-2" style="margin-bottom: 12px;">
                        <div class="dunning-alert-icon">🚨</div>
                        <div style="flex: 1;">
                            <div class="dunning-alert-title">
                                Mahnung fällig: ${countDunning} Kunde(n) haben nach weiteren 7 Tagen nicht bezahlt (> 14 Tage überfällig)
                            </div>
                            <div class="dunning-alert-desc">
                                Das 7-tägige Zahlungsziel sowie eine weitere Woche sind verstrichen. Drucken Sie jetzt direkt das offizielle Mahnschreiben aus oder versenden Sie es per E-Mail:
                            </div>
                            <div style="margin-top: 6px;">
                                ${clientList}
                            </div>
                        </div>
                    </div>
                `;
            }

            // Amber Banner: Zahlungserinnerung fällig (> 7 Tage Zahlungsziel)
            if (countReminder > 0) {
                const clientList = reminderInvoices.map(({ inv, payInfo }) => `
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 10px 14px; background: #ffffff; border: 1.5px solid #fed7aa; border-radius: 8px; margin-top: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                        <div>
                            <strong style="color: #0f172a; font-size: 0.95rem;">${escapeHtml((inv.client && inv.client.name) || 'Kunde')}</strong>
                            <span style="font-size: 0.82rem; color: #64748b; margin-left: 8px; font-family: monospace; font-weight: 700;">${escapeHtml(inv.docNumber)}</span>
                            <span style="font-size: 0.76rem; color: #d97706; font-weight: 800; margin-left: 8px; background: #fef3c7; padding: 3px 8px; border-radius: 4px;">${payInfo.overdueDays} Tage überfällig</span>
                            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">Ausgestellt am: ${escapeHtml(inv.docDate)}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <strong style="color: #b45309; font-size: 1.05rem; margin-right: 6px;">${formatCurrency(inv.totalGross)}</strong>
                            <button type="button" class="btn-card-action action-dunning-btn" onclick="openDunningModal('${inv.id}', 1)" style="color: #b45309; font-weight: 800; border-color: #fde68a; background: #fffbeb; padding: 6px 12px; font-size: 0.82rem;">
                                📄 Zahlungserinnerung drucken
                            </button>
                            <button type="button" class="btn-card-action" onclick="toggleInvoicePaidStatus('${inv.id}', true)" style="color: #047857; font-weight: 800; border: 1.5px solid #059669; background: #ecfdf5; padding: 6px 14px; font-size: 0.82rem; cursor: pointer; box-shadow: 0 1px 3px rgba(5,150,105,0.15);" title="Zahlung verbuchen & Erinnerung aufheben">
                                ✓ Zahlung eingegangen (Bezahlt)
                            </button>
                        </div>
                    </div>
                `).join('');

                alertsHtml += `
                    <div class="dunning-alert-card stage-1">
                        <div class="dunning-alert-icon">⚠️</div>
                        <div style="flex: 1;">
                            <div class="dunning-alert-title">
                                Zahlungserinnerung fällig: ${countReminder} Rechnung(en) seit über 7 Tagen unbezahlt
                            </div>
                            <div class="dunning-alert-desc">
                                Das 7-tägige Zahlungsziel ist überschritten. Bitte prüfen Sie den Zahlungseingang oder generieren Sie eine freundliche Zahlungserinnerung:
                            </div>
                            <div style="margin-top: 6px;">
                                ${clientList}
                            </div>
                        </div>
                    </div>
                `;
            }

            alertBox.innerHTML = alertsHtml;
            alertBox.style.display = 'block';
        } else {
            alertBox.innerHTML = '';
            alertBox.style.display = 'none';
        }
    }

    // 1. Filter by Period (all, monthly, quarter, yearly)
    if (overviewFilter.periodType === 'monthly' && overviewFilter.subPeriod !== 'all') {
        const [targetYear, targetMonth] = overviewFilter.subPeriod.split('-');
        archive = archive.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === parseInt(targetYear, 10) && (d.getMonth() + 1) === parseInt(targetMonth, 10);
        });
    } else if (overviewFilter.periodType === 'quarter' && overviewFilter.subPeriod !== 'all') {
        const [targetYear, targetQ] = overviewFilter.subPeriod.split('-');
        const qNum = parseInt(targetQ.replace('Q', ''), 10);
        archive = archive.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            const invQ = Math.floor(d.getMonth() / 3) + 1;
            return d.getFullYear() === parseInt(targetYear, 10) && invQ === qNum;
        });
    } else if (overviewFilter.periodType === 'yearly' && overviewFilter.subPeriod !== 'all') {
        archive = archive.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === parseInt(overviewFilter.subPeriod, 10);
        });
    }

    // 2. Filter by Search Query
    if (overviewFilter.searchTerm) {
        const term = overviewFilter.searchTerm;
        archive = archive.filter(inv => {
            const name = (inv.client && inv.client.name) ? inv.client.name.toLowerCase() : "";
            const street = (inv.client && inv.client.street) ? inv.client.street.toLowerCase() : "";
            const city = (inv.client && inv.client.zipCity) ? inv.client.zipCity.toLowerCase() : "";
            const docNum = (inv.docNumber || "").toLowerCase();
            const itemsText = (inv.items || []).map(i => (i.title + " " + i.description).toLowerCase()).join(" ");
            return name.includes(term) || street.includes(term) || city.includes(term) || docNum.includes(term) || itemsText.includes(term);
        });
    }

    // 3. Filter by Payment Status (all, offen, erinnerung, mahnung, bezahlt)
    if (overviewFilter.status && overviewFilter.status !== 'all') {
        archive = archive.filter(inv => getInvoicePaymentStatus(inv).status === overviewFilter.status);
    }

    // 4. Sort
    archive.sort((a, b) => {
        const dateA = parseGermanDate(a.docDate).getTime();
        const dateB = parseGermanDate(b.docDate).getTime();
        const grossA = parseFloat(a.totalGross) || 0;
        const grossB = parseFloat(b.totalGross) || 0;
        const nameA = ((a.client && a.client.name) || "").toLowerCase();
        const nameB = ((b.client && b.client.name) || "").toLowerCase();
        const addrA = (((a.client && a.client.zipCity) || "") + " " + ((a.client && a.client.street) || "")).toLowerCase();
        const addrB = (((b.client && b.client.zipCity) || "") + " " + ((b.client && b.client.street) || "")).toLowerCase();

        switch (overviewFilter.sortBy) {
            case 'date-desc': return dateB - dateA;
            case 'date-asc': return dateA - dateB;
            case 'amount-desc': return grossB - grossA;
            case 'amount-asc': return grossA - grossB;
            case 'name-asc': return nameA.localeCompare(nameB);
            case 'name-desc': return nameB.localeCompare(nameA);
            case 'address-asc': return addrA.localeCompare(addrB);
            default: return dateB - dateA;
        }
    });

    // 5. Update KPI Ribbon
    const totalGross = archive.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);
    const totalNet = archive.reduce((s, inv) => s + (parseFloat(inv.totalNet) || 0), 0);
    const totalTax = archive.reduce((s, inv) => s + (parseFloat(inv.totalTax) || 0), 0);

    const kpiGross = document.getElementById('kpi-total-gross');
    const kpiNet = document.getElementById('kpi-total-net');
    const kpiTax = document.getElementById('kpi-total-tax');
    const kpiCount = document.getElementById('kpi-total-count');
    const kpiSubCount = document.getElementById('kpi-sub-count');

    if (kpiGross) kpiGross.textContent = formatCurrency(totalGross);
    if (kpiNet) kpiNet.textContent = formatCurrency(totalNet);
    if (kpiTax) kpiTax.textContent = formatCurrency(totalTax);
    if (kpiCount) kpiCount.textContent = String(archive.length);

    if (kpiSubCount) {
        if (overviewFilter.periodType === 'all') {
            kpiSubCount.textContent = "Alle gespeicherten Belege";
        } else if (overviewFilter.periodType === 'monthly') {
            kpiSubCount.textContent = overviewFilter.subPeriod === 'all' ? "Alle Monate" : `Monat ${overviewFilter.subPeriod}`;
        } else if (overviewFilter.periodType === 'quarter') {
            kpiSubCount.textContent = overviewFilter.subPeriod === 'all' ? "Alle Quartale" : `Quartal ${overviewFilter.subPeriod}`;
        } else if (overviewFilter.periodType === 'yearly') {
            kpiSubCount.textContent = overviewFilter.subPeriod === 'all' ? "Alle Jahre" : `Jahr ${overviewFilter.subPeriod}`;
        }
    }

    // 6. Render Invoices Cards
    if (archive.length === 0) {
        listContainer.innerHTML = `
            <div style="background: #ffffff; border-radius: 12px; padding: 48px 24px; text-align: center; border: 1px dashed #cbd5e1;">
                <div style="display: flex; justify-content: center; margin-bottom: 12px;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <h3 style="color: #1e293b; font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;">Keine Rechnungen gefunden</h3>
                <p style="color: #64748b; font-size: 0.88rem; margin-bottom: 18px;">Für den gewählten Zeitraum, Suchbegriff oder Status-Filter liegen keine Belege vor.</p>
                <button type="button" class="btn-overview-action btn-create-invoice" onclick="createNewInvoiceInGenerator()">
                    Jetzt erste Rechnung schreiben
                </button>
            </div>
        `;
        return;
    }

    function renderSingleInvoiceCard(inv) {
        const payInfo = getInvoicePaymentStatus(inv);
        const clientName = (inv.client && inv.client.name) ? escapeHtml(inv.client.name) : "Kein Kundenname";
        const clientAddr = (inv.client && (inv.client.street || inv.client.zipCity))
            ? escapeHtml(`${inv.client.street ? inv.client.street + ', ' : ''}${inv.client.zipCity || ''}`)
            : "Keine Adresse hinterlegt";
        const itemCount = (inv.items && Array.isArray(inv.items)) ? inv.items.length : 0;
        const topItem = (inv.items && inv.items[0]) ? escapeHtml(inv.items[0].title) : "";
        const itemsSnippet = itemCount > 1 ? `${topItem} (+ ${itemCount - 1} weitere Positionen)` : (topItem || `${itemCount} Positionen`);

        const d = parseGermanDate(inv.docDate);
        const mKey = !isNaN(d.getFullYear()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : 'unknown';
        const qKey = !isNaN(d.getFullYear()) ? `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}` : 'unknown';

        return `
            <div class="overview-invoice-card ${payInfo.status === 'mahnung' ? 'is-overdue-mahnung' : ''}" id="card-${inv.id}">
                <!-- Meta: Doc number & Date & Status -->
                <div class="card-col-meta">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" class="overview-invoice-chk" data-month="${mKey}" data-quarter="${qKey}" value="${inv.id}" onchange="updateOverviewSelectedState()" style="width: 16px; height: 16px; accent-color: #0284c7; cursor: pointer;">
                        <span class="card-doc-num">${escapeHtml(inv.docNumber)}</span>
                    </div>
                    <span class="card-doc-date">Datum: ${escapeHtml(inv.docDate)}</span>
                    <span class="card-status-badge ${payInfo.badgeClass}">${payInfo.label}</span>
                    <span style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">${payInfo.subLabel}</span>
                </div>

                <!-- Client Info & Items Preview -->
                <div class="card-col-client">
                    <div class="card-client-name">${clientName}</div>
                    <div class="card-client-address">${clientAddr}</div>
                    <div class="card-items-snippet">${itemsSnippet}</div>
                </div>

                <!-- Financial Totals -->
                <div class="card-col-totals">
                    <div class="card-gross-amount">${formatCurrency(inv.totalGross)}</div>
                    <div class="card-net-tax">Netto: ${formatCurrency(inv.totalNet)} | 19% USt: ${formatCurrency(inv.totalTax)}</div>
                </div>

                <!-- Action Toolbar: Edit, Delete, PDF, XML & Dunning -->
                <div class="card-col-actions">
                    ${!payInfo.isPaid ? (
                        payInfo.status === 'mahnung' ? `
                            <button type="button" class="btn-card-action" onclick="toggleInvoicePaidStatus('${inv.id}', true)" style="color: #047857; font-weight: 800; border: 1.5px solid #059669; background: #ecfdf5; box-shadow: 0 1px 4px rgba(5, 150, 105, 0.18); display: inline-flex; align-items: center; gap: 5px;" title="Rechnung im Status Mahnung als bezahlt verbuchen und Mahnwesen abschließen">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>✓ Zahlung erhalten</span>
                            </button>
                        ` : payInfo.status === 'erinnerung' ? `
                            <button type="button" class="btn-card-action" onclick="toggleInvoicePaidStatus('${inv.id}', true)" style="color: #047857; font-weight: 700; border: 1.5px solid #10b981; background: #ecfdf5; display: inline-flex; align-items: center; gap: 5px;" title="Rechnung als bezahlt verbuchen">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>✓ Zahlung erhalten</span>
                            </button>
                        ` : `
                            <button type="button" class="btn-card-action" onclick="toggleInvoicePaidStatus('${inv.id}', true)" style="color: #059669; font-weight: 700; border-color: #a7f3d0; background: #ecfdf5;" title="Rechnung als bezahlt verbuchen">
                                ✓ Bezahlt
                            </button>
                        `
                    ) : `
                        <button type="button" class="btn-card-action" onclick="toggleInvoicePaidStatus('${inv.id}', false)" style="color: #64748b;" title="Zurück auf 'Offen' setzen">
                            ↩ Offen
                        </button>
                    `}

                    ${(payInfo.status === 'erinnerung' || payInfo.status === 'mahnung') ? `
                        <button type="button" class="btn-card-action action-dunning-btn" onclick="openDunningModal('${inv.id}', ${payInfo.stage})" style="color: #dc2626; font-weight: 800; border-color: #fca5a5; background: #fff1f2;" title="Mahnschreiben oder Zahlungserinnerung generieren">
                            📄 Mahnschreiben
                        </button>
                    ` : ''}

                    <button type="button" class="btn-card-action btn-action-edit" onclick="editInvoiceInGenerator('${inv.id}')" title="Rechnung bearbeiten">
                        Bearbeiten
                    </button>
                    <button type="button" class="btn-card-action btn-action-xml" onclick="exportInvoiceIdToXRechnung('${inv.id}')" title="Rechtskonformes XRechnung XML ansehen">
                        XML
                    </button>
                    <button type="button" class="btn-card-action" onclick="downloadInvoicePdfDirect('${inv.id}')" title="PDF Beleg herunterladen">
                        PDF
                    </button>
                    <button type="button" class="btn-card-action btn-action-delete" onclick="deleteInvoiceFromArchive('${inv.id}')" title="Rechnung dauerhaft löschen">
                        Löschen
                    </button>
                </div>
            </div>
        `;
    }

    if (overviewFilter.groupingMode === 'monthly') {
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        const monthGroups = new Map();

        archive.forEach(inv => {
            const d = parseGermanDate(inv.docDate);
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            const mKey = !isNaN(y) ? `${y}-${String(m).padStart(2, '0')}` : 'unknown';
            const mLabel = !isNaN(y) ? `${monthNames[m - 1]} ${y}` : 'Unbekannter Monat';

            if (!monthGroups.has(mKey)) {
                monthGroups.set(mKey, {
                    key: mKey,
                    label: mLabel,
                    invoices: [],
                    totalGross: 0,
                    totalNet: 0,
                    totalTax: 0
                });
            }
            const grp = monthGroups.get(mKey);
            grp.invoices.push(inv);
            grp.totalGross += (parseFloat(inv.totalGross) || 0);
            grp.totalNet += (parseFloat(inv.totalNet) || 0);
            grp.totalTax += (parseFloat(inv.totalTax) || 0);
        });

        const sortedGroups = Array.from(monthGroups.values()).sort((a, b) => b.key.localeCompare(a.key));
        let html = "";
        sortedGroups.forEach(grp => {
            html += `
                <div class="overview-group-section" id="group-month-${grp.key}">
                    <div class="overview-group-header">
                        <div class="overview-group-header-left">
                            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
                                <input type="checkbox" class="overview-month-group-chk" data-month="${grp.key}" onchange="toggleSelectMonthInvoices('${grp.key}', this.checked)" style="width: 17px; height: 17px; accent-color: #0284c7; cursor: pointer;">
                                <span class="overview-group-title">📅 ${escapeHtml(grp.label)}</span>
                            </label>
                            <span class="overview-group-badge">${grp.invoices.length} ${grp.invoices.length === 1 ? 'Rechnung' : 'Rechnungen'}</span>
                            <div class="overview-group-kpis">
                                <span>Brutto: <strong>${formatCurrency(grp.totalGross)}</strong></span>
                                <span style="color: #64748b;">(Netto: ${formatCurrency(grp.totalNet)} | USt: ${formatCurrency(grp.totalTax)})</span>
                            </div>
                        </div>
                        <div class="overview-group-header-actions">
                            <button type="button" class="btn-group-export-zip" onclick="exportMonthInvoicesArchive('${grp.key}')" title="Alle ${grp.invoices.length} Rechnungen für ${escapeHtml(grp.label)} als PDF-Archiv (.zip) herunterladen">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <span>📥 ${escapeHtml(grp.label)} als PDF-Archiv (.zip)</span>
                            </button>
                        </div>
                    </div>
                    <div class="overview-group-body">
                        ${grp.invoices.map(renderSingleInvoiceCard).join('')}
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    } else if (overviewFilter.groupingMode === 'quarter') {
        const quarterGroups = new Map();
        archive.forEach(inv => {
            const d = parseGermanDate(inv.docDate);
            const y = d.getFullYear();
            const q = Math.floor(d.getMonth() / 3) + 1;
            const qKey = !isNaN(y) ? `${y}-Q${q}` : 'unknown';
            const qLabel = !isNaN(y) ? `${q}. Quartal ${y} (Q${q})` : 'Unbekanntes Quartal';

            if (!quarterGroups.has(qKey)) {
                quarterGroups.set(qKey, {
                    key: qKey,
                    label: qLabel,
                    invoices: [],
                    totalGross: 0,
                    totalNet: 0,
                    totalTax: 0
                });
            }
            const grp = quarterGroups.get(qKey);
            grp.invoices.push(inv);
            grp.totalGross += (parseFloat(inv.totalGross) || 0);
            grp.totalNet += (parseFloat(inv.totalNet) || 0);
            grp.totalTax += (parseFloat(inv.totalTax) || 0);
        });

        const sortedQGroups = Array.from(quarterGroups.values()).sort((a, b) => b.key.localeCompare(a.key));
        let html = "";
        sortedQGroups.forEach(grp => {
            html += `
                <div class="overview-group-section" id="group-quarter-${grp.key}">
                    <div class="overview-group-header">
                        <div class="overview-group-header-left">
                            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
                                <input type="checkbox" class="overview-quarter-group-chk" data-quarter="${grp.key}" onchange="toggleSelectQuarterInvoices('${grp.key}', this.checked)" style="width: 17px; height: 17px; accent-color: #0284c7; cursor: pointer;">
                                <span class="overview-group-title">📊 ${escapeHtml(grp.label)}</span>
                            </label>
                            <span class="overview-group-badge">${grp.invoices.length} ${grp.invoices.length === 1 ? 'Rechnung' : 'Rechnungen'}</span>
                            <div class="overview-group-kpis">
                                <span>Brutto: <strong>${formatCurrency(grp.totalGross)}</strong></span>
                                <span style="color: #64748b;">(Netto: ${formatCurrency(grp.totalNet)} | USt: ${formatCurrency(grp.totalTax)})</span>
                            </div>
                        </div>
                        <div class="overview-group-header-actions">
                            <button type="button" class="btn-group-export-zip" onclick="exportQuarterInvoicesArchive('${grp.key}')" title="Alle ${grp.invoices.length} Rechnungen für ${escapeHtml(grp.label)} als PDF-Archiv (.zip) herunterladen">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <span>📥 ${escapeHtml(grp.label)} als PDF-Archiv (.zip)</span>
                            </button>
                        </div>
                    </div>
                    <div class="overview-group-body">
                        ${grp.invoices.map(renderSingleInvoiceCard).join('')}
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    } else {
        listContainer.innerHTML = archive.map(renderSingleInvoiceCard).join('');
    }

    if (typeof updateOverviewSelectedState === 'function') updateOverviewSelectedState();
};

// ==========================================================================
// MAHNWESEN & ZAHLUNGSERINNERUNGEN MODAL CONTROLLER
// ==========================================================================
let currentDunningInvoice = null;
let currentDunningStage = 1; // 1: Zahlungserinnerung, 2: 1. Mahnung, 3: Letzte Mahnung
let currentDunningFee = 0.00;
let currentDunningDeadline = "";

window.openDunningModal = function(invId, preferredStage) {
    const archive = getInvoicesArchive();
    const inv = archive.find(i => String(i.id) === String(invId) || String(i.docNumber) === String(invId));
    if (!inv) {
        showToast("Rechnung nicht gefunden");
        return;
    }

    currentDunningInvoice = inv;
    const payInfo = getInvoicePaymentStatus(inv);

    if (preferredStage && (preferredStage === 1 || preferredStage === 2 || preferredStage === 3)) {
        currentDunningStage = preferredStage;
    } else if (payInfo.status === 'mahnung') {
        currentDunningStage = 2;
    } else {
        currentDunningStage = 1;
    }

    // Default fee: 0€ for stage 1, 5.00€ for stage 2, 7.50€ for stage 3
    currentDunningFee = currentDunningStage === 1 ? 0.00 : (currentDunningStage === 2 ? 5.00 : 7.50);

    // Default deadline: 7 days from now
    const now = new Date();
    const deadlineDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
    const dStr = String(deadlineDate.getDate()).padStart(2, '0');
    const mStr = String(deadlineDate.getMonth() + 1).padStart(2, '0');
    const yStr = deadlineDate.getFullYear();
    currentDunningDeadline = `${dStr}.${mStr}.${yStr}`;

    // Update left configuration panel
    const docNumEl = document.getElementById('dunning-info-docnum');
    const clientEl = document.getElementById('dunning-info-client');
    const addressEl = document.getElementById('dunning-info-address');
    const origAmountEl = document.getElementById('dunning-info-original-amount');
    const docDateEl = document.getElementById('dunning-info-date');
    const overdueDaysEl = document.getElementById('dunning-info-overdue-days');
    const vwzEl = document.getElementById('dunning-bank-vwz');
    const feeInput = document.getElementById('dunning-fee-input');
    const deadlineInput = document.getElementById('dunning-deadline-input');

    if (docNumEl) docNumEl.textContent = inv.docNumber;
    if (clientEl) clientEl.textContent = (inv.client && inv.client.name) || 'Kundenname';
    if (addressEl) addressEl.textContent = `${(inv.client && inv.client.street) || ''}, ${(inv.client && inv.client.zipCity) || ''}`.replace(/^, |, $/g, '');
    if (origAmountEl) origAmountEl.textContent = formatCurrency(inv.totalGross);
    if (docDateEl) docDateEl.textContent = inv.docDate || '01.01.2026';
    if (overdueDaysEl) overdueDaysEl.textContent = `${payInfo.daysPassed} Tage her (${payInfo.overdueDays} Tage im Verzug)`;
    if (vwzEl) vwzEl.textContent = `${inv.docNumber} Mahnung`;
    if (feeInput) feeInput.value = currentDunningFee.toFixed(2);
    if (deadlineInput) deadlineInput.value = currentDunningDeadline;

    // Sync radio buttons
    const radios = document.querySelectorAll('input[name="dunning-stage-radio"]');
    radios.forEach(r => {
        r.checked = (parseInt(r.value, 10) === currentDunningStage);
    });
    [1, 2, 3].forEach(s => {
        const lbl = document.getElementById(`label-stage-${s}`);
        if (lbl) lbl.classList.toggle('active', s === currentDunningStage);
    });

    renderDunningLetterPreview();

    const modal = document.getElementById('dunning-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeDunningModal = function() {
    const modal = document.getElementById('dunning-modal');
    if (modal) modal.style.display = 'none';
    currentDunningInvoice = null;
};

window.handleDunningStageChange = function(stageNum) {
    currentDunningStage = parseInt(stageNum, 10) || 1;
    [1, 2, 3].forEach(s => {
        const lbl = document.getElementById(`label-stage-${s}`);
        if (lbl) lbl.classList.toggle('active', s === currentDunningStage);
    });

    // Auto-adjust default fee
    if (currentDunningStage === 1) {
        currentDunningFee = 0.00;
    } else if (currentDunningStage === 2) {
        currentDunningFee = 5.00;
    } else {
        currentDunningFee = 7.50;
    }
    const feeInput = document.getElementById('dunning-fee-input');
    if (feeInput) feeInput.value = currentDunningFee.toFixed(2);

    renderDunningLetterPreview();
};

window.handleDunningFeeChange = function(val) {
    currentDunningFee = Math.max(0, parseFloat(val) || 0);
    renderDunningLetterPreview();
};

window.handleDunningDeadlineChange = function(val) {
    currentDunningDeadline = val || "";
    renderDunningLetterPreview();
};

window.renderDunningLetterPreview = function() {
    const previewContainer = document.getElementById('dunning-letter-preview');
    if (!previewContainer || !currentDunningInvoice) return;

    const inv = currentDunningInvoice;
    const grossAmount = parseFloat(inv.totalGross) || 0;
    const fee = currentDunningFee;
    const totalClaim = grossAmount + fee;
    const todayGerman = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const deadline = currentDunningDeadline || "sofort";

    const clientName = (inv.client && inv.client.name) ? escapeHtml(inv.client.name) : "Sehr geehrte Damen und Herren";
    const clientStreet = (inv.client && inv.client.street) ? escapeHtml(inv.client.street) : "";
    const clientZipCity = (inv.client && inv.client.zipCity) ? escapeHtml(inv.client.zipCity) : "";

    let subjectText = "";
    let introText = "";
    let deadlineClause = "";
    let footerWarning = "";

    if (currentDunningStage === 1) {
        subjectText = `Zahlungserinnerung zu Rechnung Nr. ${escapeHtml(inv.docNumber)} vom ${escapeHtml(inv.docDate)}`;
        introText = `sicherlich ist es bei der Vielzahl Ihrer täglichen Aufgaben Ihrer Aufmerksamkeit entgangen, dass die nachfolgend aufgeführte Rechnung aus unserem Hause mit einem Zahlungsziel von 7 Tagen am <strong>${escapeHtml(inv.docDate)}</strong> zur Zahlung fällig war. Bislang konnten wir leider noch keinen entsprechenden Zahlungseingang auf unserem Geschäftskonto feststellen.`;
        deadlineClause = `Wir möchten Sie daher freundlich an den Ausgleich der offenen Forderung erinnern und bitten Sie, den Rechnungsbetrag ohne Abzug bis spätestens zum <strong>${escapeHtml(deadline)}</strong> auf unser unten angegebenes Bankkonto zu überweisen.`;
        footerWarning = `Sollte sich diese Zahlungserinnerung mit Ihrer bereits veranlassten Überweisung überschnitten haben, bitten wir Sie, dieses Schreiben als gegenstandslos zu betrachten.`;
    } else if (currentDunningStage === 2) {
        subjectText = `1. Mahnung zu Rechnung Nr. ${escapeHtml(inv.docNumber)} vom ${escapeHtml(inv.docDate)}`;
        introText = `auf unsere Zahlungserinnerung vom ${escapeHtml(inv.docDate)} konnten wir bis zum heutigen Tage keinen Zahlungseingang auf unserem Geschäftskonto verzeichnen. Gemäß unseren vereinbarten Zahlungsbedingungen mit einem 7-tägigen Zahlungsziel befinden Sie sich mit der Begleichung der Rechnung im Zahlungsverzug.`;
        deadlineClause = `Wir fordern Sie hiermit auf, den offenen Gesamtforderungsbetrag inklusive der entstandenen Mahnauslagen bis spätestens zum <strong>${escapeHtml(deadline)}</strong> auf unser unten stehendes Bankkonto zu begleichen.`;
        footerWarning = `Bitte beachten Sie: Nach fruchtlosem Ablauf dieser Nachfrist sehen wir uns gezwungen, das gerichtliche Mahnverfahren einzuleiten, wodurch weitere erhebliche Verzugszinsen und Rechtskosten für Sie entstehen würden.`;
    } else {
        subjectText = `Letzte Mahnung vor Einleitung des gerichtlichen Mahnverfahrens – Rechnung Nr. ${escapeHtml(inv.docNumber)}`;
        introText = `trotz mehrfacher Zahlungserinnerungen und Mahnungen ist die nachfolgend aufgeführte Rechnung bis heute unbeglichen geblieben. Dies ist unsere letzte außergerichtliche Mahnung.`;
        deadlineClause = `Wir fordern Sie letztmalig mit Nachdruck auf, den fälligen Gesamtbetrag bis spätestens zum <strong>${escapeHtml(deadline)}</strong> (Zahlungseingang auf unserem Bankkonto) auszugleichen.`;
        footerWarning = `Lassen Sie auch diese letzte Frist verstreichen, werden wir den Vorgang unverzüglich an unsere Rechtsvertretung bzw. ein Inkassoinstitut zur gerichtlichen Titulierung (Mahnbescheid / Vollstreckungsbescheid) übergeben. Die dadurch entstehenden Verzugszinsen, Gerichtskosten und Rechtsanwaltsgebühren gehen in voller Höhe zu Ihren Lasten.`;
    }

    const html = `
        <!-- Absender Header & Firmenlogo -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 14px; margin-bottom: 22px;">
            <div>
                <div style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">
                    PALNAU GARTENBAU GMBH
                </div>
                <div style="font-size: 11.5px; color: #475569; margin-top: 2px; font-weight: 600;">
                    Fachbetrieb für Garten- & Landschaftsbau • Pflasterbau • Baumpflege
                </div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                    Reihelberg 3 • 75210 Keltern-Dietlingen • Tel: 07231 466641
                </div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #475569; line-height: 1.5;">
                <strong style="color: #059669;">Palnau Gartenbau GmbH</strong><br>
                Geschäftsführer: Andrei Priala<br>
                E-Mail: gartenbauu@gmail.com
            </div>
        </div>

        <!-- Rücksendeangabe nach DIN 5008 & Empfängeradresse -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div>
                <div style="font-size: 9.5px; color: #64748b; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px; text-decoration: underline;">
                    Palnau Gartenbau GmbH • Reihelberg 3 • 75210 Keltern
                </div>
                <div style="font-size: 14px; color: #0f172a; line-height: 1.5; min-height: 65px;">
                    <strong>${clientName}</strong><br>
                    ${clientStreet ? clientStreet + '<br>' : ''}
                    ${clientZipCity ? clientZipCity : ''}
                </div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #334155; line-height: 1.6;">
                <div><strong>Keltern-Dietlingen</strong>, den ${todayGerman}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                    Beleg-Nr.: <strong style="color: #0f172a; font-family: monospace;">${escapeHtml(inv.docNumber)}</strong>
                </div>
                <div style="font-size: 11px; color: #64748b;">
                    Rechnungsdatum: <strong>${escapeHtml(inv.docDate)}</strong>
                </div>
            </div>
        </div>

        <!-- Betreffzeile -->
        <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 18px; line-height: 1.4;">
            ${subjectText}
        </div>

        <!-- Brieftext -->
        <div style="font-size: 13.5px; color: #1e293b; line-height: 1.7; margin-bottom: 22px;">
            <p style="margin-bottom: 12px;">Sehr geehrte Damen und Herren,</p>
            <p style="margin-bottom: 12px;">${introText}</p>
            <p style="margin-bottom: 16px;">${deadlineClause}</p>
        </div>

        <!-- Aufstellung der Forderung -->
        <div style="margin-bottom: 22px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                        <th style="padding: 8px 12px; text-align: left; font-weight: 800; color: #334155;">Forderungsposten</th>
                        <th style="padding: 8px 12px; text-align: left; font-weight: 800; color: #334155;">Beleg / Details</th>
                        <th style="padding: 8px 12px; text-align: right; font-weight: 800; color: #334155;">Betrag</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">Rechnungsbetrag (Brutto)</td>
                        <td style="padding: 10px 12px; color: #64748b;">Rechnung ${escapeHtml(inv.docNumber)} vom ${escapeHtml(inv.docDate)}</td>
                        <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">${formatCurrency(grossAmount)}</td>
                    </tr>
                    ${fee > 0 ? `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px 12px; font-weight: 600; color: #b45309;">Mahnspesen / Verzugskosten</td>
                            <td style="padding: 10px 12px; color: #64748b;">Aufwandspauschale Mahnstufe ${currentDunningStage}</td>
                            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #b45309;">${formatCurrency(fee)}</td>
                        </tr>
                    ` : ''}
                    <tr style="background: #f8fafc; border-top: 2px solid #0f172a;">
                        <td colspan="2" style="padding: 12px; font-size: 14.5px; font-weight: 900; color: #0f172a; text-transform: uppercase;">
                            Fälliger Gesamtforderungsbetrag:
                        </td>
                        <td style="padding: 12px; text-align: right; font-size: 16px; font-weight: 900; color: #059669;">
                            ${formatCurrency(totalClaim)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Bankverbindung Highlight Box (Feststehend & Nicht editierbar) -->
        <div style="background: #f8fafc; border: 2px solid #059669; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px;">
            <div style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                Bankverbindung für Ihre Überweisung:
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
                <div>
                    <div style="font-size: 13.5px; font-weight: 800; color: #0f172a;">Sparkasse Pforzheim Calw</div>
                    <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 3px; font-family: monospace; letter-spacing: 0.05em;">
                        IBAN: DE66 6665 0085 0005 9928 34
                    </div>
                    <div style="font-size: 12px; color: #475569;">BIC: <strong>PFORDE66XXX</strong></div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 11.5px; color: #64748b;">Verwendungszweck (Wichtig):</div>
                    <div style="font-size: 13.5px; font-weight: 800; color: #059669; font-family: monospace;">
                        ${escapeHtml(inv.docNumber)} Mahnung
                    </div>
                </div>
            </div>
        </div>

        <!-- Schlusssatz & Grußformel -->
        <div style="font-size: 13px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
            <p style="margin-bottom: 14px; font-style: italic; color: #64748b;">${footerWarning}</p>
            <p style="margin-bottom: 26px;">Mit freundlichen Grüßen</p>
            <div style="font-weight: 900; color: #0f172a; font-size: 14px;">Palnau Gartenbau GmbH</div>
            <div style="font-size: 12px; color: #64748b;">Andrei Priala (Geschäftsführer)</div>
        </div>

        <!-- DIN Briefbogen Footer (Feststehend, 3 Spalten) -->
        <div style="border-top: 1.5px solid #cbd5e1; padding-top: 12px; margin-top: auto; font-size: 10px; color: #64748b; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; line-height: 1.5;">
            <div>
                <strong style="color: #334155;">Bankverbindung:</strong><br>
                Sparkasse Pforzheim Calw<br>
                IBAN: DE66 6665 0085 0005 9928 34<br>
                BIC: PFORDE66XXX
            </div>
            <div>
                <strong style="color: #334155;">Steuerdaten:</strong><br>
                Steuernummer: 41413-45017<br>
                Finanzamt Pforzheim<br>
                Amtsgericht Mannheim
            </div>
            <div>
                <strong style="color: #334155;">Geschäftsleitung & Kontakt:</strong><br>
                Geschäftsführer: Andrei Priala<br>
                Tel: 07231 466641<br>
                E-Mail: gartenbauu@gmail.com
            </div>
        </div>
    `;

    previewContainer.innerHTML = html;
};

window.printDunningLetter = function() {
    const preview = document.getElementById('dunning-letter-preview');
    const printContainer = document.getElementById('dunning-print-container');
    if (!preview || !printContainer) return;

    printContainer.innerHTML = preview.innerHTML;
    printContainer.style.display = 'block';
    document.body.classList.add('printing-dunning');

    window.print();

    setTimeout(() => {
        document.body.classList.remove('printing-dunning');
        printContainer.style.display = 'none';
        printContainer.innerHTML = '';
    }, 1000);
};

window.downloadDunningLetterHtml = function() {
    const preview = document.getElementById('dunning-letter-preview');
    if (!preview || !currentDunningInvoice) return;

    const stageNames = { 1: "Zahlungserinnerung", 2: "1_Mahnung", 3: "Letzte_Mahnung" };
    const fileName = `${stageNames[currentDunningStage]}_${currentDunningInvoice.docNumber}.html`;

    const fullHtml = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>${stageNames[currentDunningStage]} - ${currentDunningInvoice.docNumber}</title>
    <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; background: #ffffff; margin: 0; padding: 20px; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    ${preview.innerHTML}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Dokument heruntergeladen: ${fileName}`);
};

window.copyDunningEmailText = function() {
    if (!currentDunningInvoice) return;
    const inv = currentDunningInvoice;
    const clientName = (inv.client && inv.client.name) || "Kunde";
    const gross = formatCurrency(inv.totalGross);
    const fee = currentDunningFee;
    const total = formatCurrency(parseFloat(inv.totalGross || 0) + fee);
    const deadline = currentDunningDeadline || "7 Tage";

    const stageTitle = currentDunningStage === 1 
        ? `Zahlungserinnerung zu Rechnung ${inv.docNumber}` 
        : (currentDunningStage === 2 ? `1. Mahnung zu Rechnung ${inv.docNumber}` : `Letzte Mahnung vor Inkasso - Rechnung ${inv.docNumber}`);

    const emailText = `Betreff: ${stageTitle} - Palnau Gartenbau GmbH

Sehr geehrte Damen und Herren,
sehr geehrte(r) ${clientName},

hiermit möchten wir Sie an die Begleichung der Rechnung ${inv.docNumber} vom ${inv.docDate} erinnern.

Rechnungsbetrag (Brutto): ${gross}
${fee > 0 ? `Mahngebühr: ${formatCurrency(fee)}\n` : ''}Zu zahlender Gesamtbetrag: ${total}
Zahlungsfrist: bis zum ${deadline}

Bankverbindung für die Überweisung:
Bank: Sparkasse Pforzheim Calw
IBAN: DE66 6665 0085 0005 9928 34
BIC: PFORDE66XXX
Verwendungszweck: ${inv.docNumber} Mahnung

Bei Rückfragen stehen wir Ihnen gerne unter 07231 466641 zur Verfügung.
Sollte sich diese Nachricht mit Ihrer Zahlung überschnitten haben, bitten wir Sie, diese zu ignorieren.

Mit freundlichen Grüßen
Palnau Gartenbau GmbH
Reihelberg 3, 75210 Keltern
Geschäftsführer: Andrei Priala
Tel: 07231 466641 | E-Mail: gartenbauu@gmail.com`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(emailText).then(() => {
            showToast("E-Mail-Vorlage in Zwischenablage kopiert ✓");
        }).catch(() => {
            prompt("Kopieren Sie den E-Mail-Text:", emailText);
        });
    } else {
        prompt("Kopieren Sie den E-Mail-Text:", emailText);
    }
};

window.markInvoiceAsPaidFromDunning = function() {
    if (!currentDunningInvoice) return;
    const invId = currentDunningInvoice.id;
    toggleInvoicePaidStatus(invId, true);
    closeDunningModal();
};

window.markSelectedInvoicesAsPaid = function() {
    const checkboxes = document.querySelectorAll('.overview-invoice-chk:checked');
    if (checkboxes.length === 0) {
        showToast("Bitte wählen Sie mindestens eine Rechnung aus.");
        return;
    }

    const selectedIds = new Set(Array.from(checkboxes).map(cb => String(cb.value)));
    const archive = getInvoicesArchive();
    let updatedCount = 0;
    let mahnungResolvedCount = 0;
    const paidDate = new Date().toLocaleDateString('de-DE');

    archive.forEach(inv => {
        if (selectedIds.has(String(inv.id)) || selectedIds.has(String(inv.docNumber))) {
            const currentStatus = getInvoicePaymentStatus(inv);
            if (!currentStatus.isPaid) {
                if (currentStatus.status === 'mahnung' || currentStatus.status === 'erinnerung' || inv.wasMahnungResolved) {
                    mahnungResolvedCount++;
                    inv.wasMahnungResolved = true;
                }
                inv.paymentStatus = 'bezahlt';
                inv.status = 'bezahlt';
                inv.isPaid = true;
                inv.paidAt = paidDate;
                markInvoiceInPaidRegistry(inv.id, inv.docNumber, paidDate);
                updatedCount++;
            }
        }
    });

    if (updatedCount > 0) {
        localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
        updateAllAppStatesAndBadges();
        if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
            window.PalnauCloudSync.pushLocalToCloud(true);
        }
        renderOverviewInvoices();
        if (typeof renderQuartersView === 'function') renderQuartersView();
        if (typeof renderPowerBiDashboard === 'function' && currentActiveView === 'quarters') renderPowerBiDashboard();
        if (mahnungResolvedCount > 0) {
            showToast(`${updatedCount} Beleg(e) als bezahlt verbucht (${mahnungResolvedCount} Mahnung(en) erledigt) ✓`);
        } else {
            showToast(`${updatedCount} Beleg(e) erfolgreich als bezahlt verbucht ✓`);
        }
    } else {
        showToast("Die ausgewählten Belege sind bereits als bezahlt markiert.");
    }
};

window.toggleSelectAllOverviewInvoices = function(forceChecked) {
    const checkboxes = document.querySelectorAll('.overview-invoice-chk');
    if (checkboxes.length === 0) return;

    let targetState;
    if (typeof forceChecked === 'boolean') {
        targetState = forceChecked;
    } else {
        const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
        targetState = anyUnchecked;
    }

    checkboxes.forEach(cb => {
        cb.checked = targetState;
    });

    updateOverviewSelectedState();
};

window.toggleSelectMonthInvoices = function(monthKey, isChecked) {
    const boxes = document.querySelectorAll(`.overview-invoice-chk[data-month="${monthKey}"]`);
    boxes.forEach(cb => { cb.checked = isChecked; });
    updateOverviewSelectedState();
};

window.toggleSelectQuarterInvoices = function(quarterKey, isChecked) {
    const boxes = document.querySelectorAll(`.overview-invoice-chk[data-quarter="${quarterKey}"]`);
    boxes.forEach(cb => { cb.checked = isChecked; });
    updateOverviewSelectedState();
};

window.selectCurrentMonthInvoices = function() {
    const checkboxes = document.querySelectorAll('.overview-invoice-chk');
    if (checkboxes.length === 0) {
        showToast("Keine Rechnungen in der Ansicht vorhanden.");
        return;
    }

    // Try to find the monthKey of the first invoice in current view (most recent)
    let targetMonth = "";
    for (const cb of checkboxes) {
        const m = cb.getAttribute('data-month');
        if (m && m !== 'unknown') {
            targetMonth = m;
            break;
        }
    }

    if (!targetMonth) {
        checkboxes.forEach(cb => { cb.checked = true; });
    } else {
        checkboxes.forEach(cb => {
            cb.checked = (cb.getAttribute('data-month') === targetMonth);
        });
    }

    updateOverviewSelectedState();
    const count = document.querySelectorAll('.overview-invoice-chk:checked').length;
    showToast(`${count} Rechnungen für den Monat ausgewählt.`);
};

window.updateOverviewSelectedState = function() {
    const checkboxes = document.querySelectorAll('.overview-invoice-chk');
    const checked = Array.from(checkboxes).filter(cb => cb.checked);
    const count = checked.length;
    const total = checkboxes.length;

    const actions = document.getElementById('overview-selected-actions');
    const counter = document.getElementById('overview-selected-counter');
    const topChk = document.getElementById('overview-select-all-chk');
    const labelText = document.getElementById('overview-select-all-label-text');
    const exportText = document.getElementById('btn-export-archive-text');
    const paidText = document.getElementById('btn-bulk-mark-paid-text');

    if (counter) {
        counter.textContent = `${count} von ${total} Belegen ausgewählt`;
        counter.style.display = count > 0 ? 'inline' : 'none';
    }
    if (actions) {
        actions.style.display = count > 0 ? 'flex' : 'none';
    }
    if (labelText) {
        labelText.textContent = (count === total && total > 0) ? 'Alle abwählen' : 'Alle auswählen';
    }
    if (topChk) {
        topChk.checked = count === total && total > 0;
        topChk.indeterminate = count > 0 && count < total;
    }
    if (exportText) {
        exportText.textContent = `Ausgewählte (${count}) als PDF-Archiv (.zip) exportieren`;
    }
    if (paidText) {
        paidText.textContent = `Ausgewählte (${count}) als bezahlt markieren`;
    }

    // Also sync month group checkboxes if present
    document.querySelectorAll('.overview-month-group-chk').forEach(monthChk => {
        const mKey = monthChk.getAttribute('data-month');
        const mBoxes = document.querySelectorAll(`.overview-invoice-chk[data-month="${mKey}"]`);
        if (mBoxes.length > 0) {
            const mChecked = Array.from(mBoxes).filter(cb => cb.checked).length;
            monthChk.checked = mChecked === mBoxes.length;
            monthChk.indeterminate = mChecked > 0 && mChecked < mBoxes.length;
        }
    });

    // Also sync quarter group checkboxes if present
    document.querySelectorAll('.overview-quarter-group-chk').forEach(qChk => {
        const qKey = qChk.getAttribute('data-quarter');
        const qBoxes = document.querySelectorAll(`.overview-invoice-chk[data-quarter="${qKey}"]`);
        if (qBoxes.length > 0) {
            const qChecked = Array.from(qBoxes).filter(cb => cb.checked).length;
            qChk.checked = qChecked === qBoxes.length;
            qChk.indeterminate = qChecked > 0 && qChecked < qBoxes.length;
        }
    });
};

// ==========================================================================
// BATCH PDF-ARCHIV EXPORT (.ZIP) ENGINE
// ==========================================================================
let lastGeneratedZipBlob = null;
let lastGeneratedZipFilename = "";

window.closeExportArchiveModal = function() {
    const modal = document.getElementById('export-archive-modal');
    if (modal) modal.style.display = 'none';
};

window.triggerRedownloadArchive = function() {
    if (lastGeneratedZipBlob && lastGeneratedZipFilename) {
        triggerBlobDownload(lastGeneratedZipBlob, lastGeneratedZipFilename);
        showToast(`Download von ${lastGeneratedZipFilename} erneut gestartet.`);
    }
};

function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}

window.exportMonthInvoicesArchive = function(monthKey) {
    const archive = getInvoicesArchive().filter(inv => (inv.docType || 'rechnung') !== 'angebot');
    const [targetYear, targetMonth] = monthKey.split('-');
    const monthInvoices = archive.filter(inv => {
        const d = parseGermanDate(inv.docDate);
        return d.getFullYear() === parseInt(targetYear, 10) && (d.getMonth() + 1) === parseInt(targetMonth, 10);
    });

    if (monthInvoices.length === 0) {
        showToast("Keine Rechnungen in diesem Monat vorhanden.");
        return;
    }

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    const monthTitle = `${monthNames[parseInt(targetMonth, 10) - 1]} ${targetYear}`;
    const slug = `Monat_${targetYear}-${targetMonth}`;

    exportInvoicesToZipArchive(monthInvoices, `Monatsarchiv ${monthTitle}`, slug);
};

window.exportQuarterInvoicesArchive = function(quarterKey) {
    const archive = getInvoicesArchive().filter(inv => (inv.docType || 'rechnung') !== 'angebot');
    const [targetYear, targetQ] = quarterKey.split('-');
    const qNum = parseInt(targetQ.replace('Q', ''), 10);
    const qInvoices = archive.filter(inv => {
        const d = parseGermanDate(inv.docDate);
        const invQ = Math.floor(d.getMonth() / 3) + 1;
        return d.getFullYear() === parseInt(targetYear, 10) && invQ === qNum;
    });

    if (qInvoices.length === 0) {
        showToast("Keine Rechnungen in diesem Quartal vorhanden.");
        return;
    }

    const qTitle = `${qNum}. Quartal ${targetYear} (${targetQ})`;
    const slug = `Quartal_${targetYear}-${targetQ}`;

    exportInvoicesToZipArchive(qInvoices, `Quartalsarchiv ${qTitle}`, slug);
};

window.exportSelectedInvoicesArchive = function() {
    const checkboxes = document.querySelectorAll('.overview-invoice-chk:checked');
    if (checkboxes.length === 0) {
        showToast("Bitte wählen Sie mindestens eine Rechnung aus.");
        return;
    }

    const selectedIds = new Set(Array.from(checkboxes).map(cb => cb.value));
    const archive = getInvoicesArchive().filter(inv => (inv.docType || 'rechnung') !== 'angebot');
    const selectedInvoices = archive.filter(inv => selectedIds.has(String(inv.id)));

    if (selectedInvoices.length === 0) {
        showToast("Keine passenden Rechnungen gefunden.");
        return;
    }

    const now = new Date();
    const slug = `Auswahl_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    exportInvoicesToZipArchive(selectedInvoices, `Ausgewählte Rechnungen (${selectedInvoices.length} Belege)`, slug);
};

window.exportInvoicesToZipArchive = async function(invoices, archiveTitle, archiveSlug) {
    if (typeof JSZip === 'undefined') {
        showToast("ZIP-Bibliothek wird geladen, bitte einen kurzen Moment gedulden...");
        return;
    }
    if (typeof html2pdf === 'undefined') {
        showToast("PDF-Generator ist nicht verfügbar.");
        return;
    }

    const modal = document.getElementById('export-archive-modal');
    const titleElem = document.getElementById('export-archive-modal-title');
    const subtitleElem = document.getElementById('export-archive-modal-subtitle');
    const stepText = document.getElementById('export-archive-step-text');
    const percentElem = document.getElementById('export-archive-percent');
    const progressBar = document.getElementById('export-archive-progress-bar');
    const statusDetail = document.getElementById('export-archive-status-detail');
    const itemsLog = document.getElementById('export-archive-items-log');
    const progressView = document.getElementById('export-archive-progress-view');
    const successView = document.getElementById('export-archive-success-view');
    const closeBtn = document.getElementById('export-archive-close-btn');

    if (modal) modal.style.display = 'flex';
    if (titleElem) titleElem.textContent = `PDF-Archiv exportieren: ${archiveTitle}`;
    if (subtitleElem) subtitleElem.textContent = `Palnau Gartenbau GmbH • ${invoices.length} Rechnungen werden gebündelt`;
    if (progressView) progressView.style.display = 'block';
    if (successView) successView.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    if (percentElem) percentElem.textContent = '0%';
    if (itemsLog) itemsLog.innerHTML = '';
    if (stepText) stepText.textContent = `Generiere druckfertige PDFs für ${invoices.length} Rechnungen...`;

    // Save previous editor state safely
    const previousState = JSON.parse(JSON.stringify(appState));

    const zip = new JSZip();
    const cleanElement = document.getElementById('clean-pdf-document');

    try {
        for (let i = 0; i < invoices.length; i++) {
            const inv = invoices[i];
            const clientName = (inv.client && inv.client.name) || 'Kunde';
            const safeClient = clientName.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_').substring(0, 25);
            const docNum = inv.docNumber || `RE-${i + 1}`;
            const pdfFilename = `${docNum}_${safeClient}.pdf`;

            if (statusDetail) {
                statusDetail.textContent = `[${i + 1}/${invoices.length}] Erstelle PDF für ${docNum} (${clientName})...`;
            }

            // Populate clean document
            appState.docType = inv.docType || "rechnung";
            appState.docNumber = inv.docNumber || "";
            appState.docDate = inv.docDate || "";
            appState.servicePeriod = inv.servicePeriod || "";
            appState.taxRate = inv.taxRate !== undefined ? inv.taxRate : 19;
            appState.clientType = inv.clientType || (inv.client && inv.client.clientType) || ((typeof isCompanyClient === 'function' && isCompanyClient(inv.client)) ? 'firma' : 'privat');
            appState.workLocation = inv.workLocation || (inv.client && inv.client.workLocation) || '';
            appState.customWageNet = inv.customWageNet !== undefined ? inv.customWageNet : null;
            appState.client = {
                name: (inv.client && inv.client.name) || '',
                street: (inv.client && inv.client.street) || '',
                zipCity: (inv.client && inv.client.zipCity) || ''
            };
            appState.items = JSON.parse(JSON.stringify(inv.items || []));
            appState.notesText = inv.notesText || "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen auf das unten genannte Bankkonto.";

            renderCleanDocument();

            cleanElement.style.display = 'flex';
            cleanElement.style.flexDirection = 'column';
            cleanElement.style.justifyContent = 'space-between';
            cleanElement.style.position = 'static';
            cleanElement.style.width = '794px';
            cleanElement.style.maxWidth = '794px';
            cleanElement.style.minHeight = '1116px';
            cleanElement.style.height = 'auto';
            cleanElement.style.boxSizing = 'border-box';
            cleanElement.style.padding = '32px 42px 24px 42px';
            cleanElement.style.margin = '0 auto';
            cleanElement.style.backgroundColor = '#ffffff';

            const opt = {
                margin: [0, 0, 0, 0],
                filename: pdfFilename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    letterRendering: true,
                    scrollX: 0,
                    scrollY: 0,
                    backgroundColor: '#ffffff'
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
            };

            const pdfWorker = html2pdf().set(opt).from(cleanElement);
            const pdf = await pdfWorker.toPdf().get('pdf');
            const totalPages = pdf.internal.getNumberOfPages();
            if (totalPages > 1 && cleanElement.offsetHeight <= 1125) {
                pdf.deletePage(totalPages);
            }
            const pdfBlob = pdf.output('blob');

            zip.file(pdfFilename, pdfBlob);
            cleanElement.style.display = 'none';

            const pct = Math.round(((i + 1) / invoices.length) * 85);
            if (progressBar) progressBar.style.width = `${pct}%`;
            if (percentElem) percentElem.textContent = `${pct}%`;

            if (itemsLog) {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.innerHTML = `
                    <span style="color:#0f172a; font-weight:600;">✓ ${escapeHtml(docNum)} • ${escapeHtml(clientName)}</span>
                    <span style="color:#059669; font-weight:700;">${formatCurrency(inv.totalGross)}</span>
                `;
                itemsLog.appendChild(row);
                itemsLog.scrollTop = itemsLog.scrollHeight;
            }
        }

        // Generate DATEV / Excel Rechnungsjournal CSV
        if (statusDetail) statusDetail.textContent = "Erstelle DATEV / Excel Rechnungsjournal (.csv)...";
        let csv = "\uFEFFRechnungsnummer;Datum;Leistungszeitraum;Kunde;Strasse;PLZ_Ort;Netto_EUR;MwSt_EUR;Brutto_EUR;Zahlungsstatus\r\n";
        invoices.forEach(inv => {
            const pay = getInvoicePaymentStatus(inv);
            const net = (parseFloat(inv.totalNet || 0)).toFixed(2).replace('.', ',');
            const tax = (parseFloat(inv.totalTax || 0)).toFixed(2).replace('.', ',');
            const gross = (parseFloat(inv.totalGross || 0)).toFixed(2).replace('.', ',');
            const name = ((inv.client && inv.client.name) || '').replace(/"/g, '""');
            const street = ((inv.client && inv.client.street) || '').replace(/"/g, '""');
            const zipCity = ((inv.client && inv.client.zipCity) || '').replace(/"/g, '""');
            csv += `"${inv.docNumber}";"${inv.docDate}";"${inv.servicePeriod || ''}";"${name}";"${street}";"${zipCity}";"${net}";"${tax}";"${gross}";"${pay.label}"\r\n`;
        });
        zip.file(`Rechnungsjournal_${archiveSlug}.csv`, csv);

        // Generate Summary TXT Manifest
        const sumGross = invoices.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);
        const sumNet = invoices.reduce((s, inv) => s + (parseFloat(inv.totalNet) || 0), 0);
        const sumTax = invoices.reduce((s, inv) => s + (parseFloat(inv.totalTax) || 0), 0);
        let txt = `========================================================================\r\n`;
        txt += `PALNAU GARTENBAU GMBH • RECHNUNGSARCHIV\r\n`;
        txt += `Reihelberg 3, 75210 Keltern-Dietlingen\r\n`;
        txt += `Archiv: ${archiveTitle}\r\n`;
        txt += `Erstellt am: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')} Uhr\r\n`;
        txt += `Anzahl Rechnungen: ${invoices.length}\r\n`;
        txt += `Gesamtsumme Brutto: ${formatCurrency(sumGross)}\r\n`;
        txt += `Gesamtsumme Netto:  ${formatCurrency(sumNet)}\r\n`;
        txt += `Gesamtsumme 19% USt: ${formatCurrency(sumTax)}\r\n`;
        txt += `========================================================================\r\n\r\n`;
        invoices.forEach((inv, idx) => {
            txt += `${idx + 1}. [${inv.docNumber}] Datum: ${inv.docDate} | Kunde: ${(inv.client && inv.client.name) || 'Kunde'} | Brutto: ${formatCurrency(inv.totalGross)}\r\n`;
        });
        zip.file(`Rechnungsuebersicht_${archiveSlug}.txt`, txt);

        if (statusDetail) statusDetail.textContent = "ZIP-Archiv wird komprimiert und verpackt...";
        if (progressBar) progressBar.style.width = '95%';
        if (percentElem) percentElem.textContent = '95%';

        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        const zipFilename = `Palnau_Rechnungen_Archiv_${archiveSlug}.zip`;

        lastGeneratedZipBlob = zipBlob;
        lastGeneratedZipFilename = zipFilename;

        if (progressBar) progressBar.style.width = '100%';
        if (percentElem) percentElem.textContent = '100%';

        // Trigger automatic download
        triggerBlobDownload(zipBlob, zipFilename);

        // Switch to Success View
        if (progressView) progressView.style.display = 'none';
        if (successView) successView.style.display = 'block';
        if (closeBtn) closeBtn.style.display = 'inline-block';

        const filenameDisplay = document.getElementById('export-archive-filename-display');
        const statsDisplay = document.getElementById('export-archive-stats-display');
        if (filenameDisplay) filenameDisplay.textContent = zipFilename;
        if (statsDisplay) {
            statsDisplay.textContent = `${invoices.length} Rechnungen als druckfertige PDFs (${formatCurrency(sumGross)} Brutto) • Inkl. DATEV/Excel Journal (.csv) & Belegübersicht (.txt)`;
        }

        showToast(`Archiv "${zipFilename}" mit ${invoices.length} PDFs erfolgreich heruntergeladen!`);
    } catch (err) {
        console.error("Archive export error:", err);
        showToast("Fehler beim Erstellen des PDF-Archivs: " + err.message);
        if (statusDetail) statusDetail.textContent = "Fehler: " + err.message;
        if (closeBtn) closeBtn.style.display = 'inline-block';
    } finally {
        appState = previousState;
        renderCleanDocument();
        cleanElement.style.display = 'none';
        cleanElement.style.position = '';
        cleanElement.style.width = '';
        cleanElement.style.maxWidth = '';
        cleanElement.style.minHeight = '';
        cleanElement.style.backgroundColor = '';
        if (closeBtn) closeBtn.style.display = 'inline-block';
    }
};

window.deleteSelectedOverviewInvoices = function() {
    const checkboxes = document.querySelectorAll('.overview-invoice-chk:checked');
    if (checkboxes.length === 0) {
        showToast("Keine Belege ausgewählt.");
        return;
    }

    const idsToDelete = Array.from(checkboxes).map(cb => cb.value).filter(Boolean);
    const count = idsToDelete.length;

    const archive = getInvoicesArchive();
    idsToDelete.forEach(id => {
        const inv = archive.find(i => String(i.id) === String(id));
        markInvoiceAsDeleted(id, inv ? inv.docNumber : null);
    });

    const updated = archive.filter(inv => !idsToDelete.includes(String(inv.id)));
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('palnau_workspace_initialized', 'true');

    if (appState && idsToDelete.includes(String(appState.activeArchiveId))) {
        appState.activeArchiveId = null;
        if (typeof closeAppConfirm === 'function') closeAppConfirm();
        startCleanState();
        if (typeof renderAll === 'function') renderAll();
    }

    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud(true);
    }

    if (typeof renderOverviewInvoices === 'function') renderOverviewInvoices();
    if (typeof renderClientsView === 'function') renderClientsView();
    if (typeof renderQuartersView === 'function') renderQuartersView();
    if (typeof renderERechnungHub === 'function') renderERechnungHub();
    updateAllAppStatesAndBadges();

    showToast(`${count} Belege erfolgreich gelöscht.`);
};

// ==========================================================================
// ANGEBOTS-ÜBERSICHT & QUOTE-TO-INVOICE TRANSFER CONTROLLER
// Dedicated screen for all quotes with 1-click conversion to invoices
// Prompts for a distinct invoice date as requested by user
// ==========================================================================

let quotesFilter = {
    status: 'all', // 'all' | 'offen' | 'angenommen'
    periodType: 'all', // 'all' | 'monthly' | 'quarter' | 'yearly'
    subPeriod: 'all',
    sortBy: 'date-desc',
    searchTerm: ''
};

let activeQuoteForConversion = null;

// Helper to normalize any date input (DD.MM.YYYY, YYYY-MM-DD, ISO or timestamp) to DD.MM.YYYY
function normalizeToGermanDate(dateStr) {
    if (!dateStr) return formatDateForGermanDisplay(new Date());
    const str = String(dateStr).trim();
    // Pattern DD.MM.YYYY
    const dmyMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dmyMatch) {
        return `${dmyMatch[1].padStart(2, '0')}.${dmyMatch[2].padStart(2, '0')}.${dmyMatch[3]}`;
    }
    // Pattern YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        return `${isoMatch[3].padStart(2, '0')}.${isoMatch[2].padStart(2, '0')}.${isoMatch[1]}`;
    }
    // Fallback Date parser
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return formatDateForGermanDisplay(d);
    }
    return str;
}
window.normalizeToGermanDate = normalizeToGermanDate;

// Helper to format ISO date (YYYY-MM-DD) to German string (DD.MM.YYYY) without timezone shift
function formatIsoToGerman(isoStr) {
    if (!isoStr) return "";
    const parts = String(isoStr).split('-');
    if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
    }
    return normalizeToGermanDate(isoStr);
}
window.formatIsoToGerman = formatIsoToGerman;

// Helper to format German string (DD.MM.YYYY) to ISO (YYYY-MM-DD)
function formatGermanToIso(germanStr) {
    if (!germanStr) return "";
    const parts = String(germanStr).split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return "";
}
window.formatGermanToIso = formatGermanToIso;

// Generator Meta Date handlers: Keep text input editable and synced with native calendar
window.handleDocDateChange = function(val) {
    const norm = normalizeToGermanDate(val);
    appState.docDate = norm;
    const dateInput = document.getElementById('doc-meta-date');
    if (dateInput && dateInput.value !== norm) {
        dateInput.value = norm;
    }
    renderCleanDocument();
    saveState();
};

window.openMetaDatePicker = function() {
    const picker = document.getElementById('doc-meta-date-picker');
    if (!picker) return;
    if (appState.docDate) {
        const iso = formatGermanToIso(appState.docDate);
        if (iso) picker.value = iso;
    }
    if (typeof picker.showPicker === 'function') {
        picker.showPicker();
    } else {
        picker.click();
    }
};

window.syncMetaDatePicker = function(isoVal) {
    if (!isoVal) return;
    const german = formatIsoToGerman(isoVal);
    appState.docDate = german;
    const dateInput = document.getElementById('doc-meta-date');
    if (dateInput) dateInput.value = german;
    renderCleanDocument();
    saveState();
};

// Client Type Switcher & Work Location handlers
window.setClientType = function(type) {
    appState.clientType = (type === 'firma') ? 'firma' : 'privat';
    if (!appState.client) appState.client = {};
    appState.client.clientType = appState.clientType;
    renderAll();
    saveState();
    showToast(appState.clientType === 'firma' ? "Kundentyp: Firma / Gewerbe gewählt" : "Kundentyp: Privatperson gewählt");
};

window.handleWorkLocationChange = function(val) {
    appState.workLocation = val;
    if (appState.client) appState.client.workLocation = val;
    const sidebarInput = document.getElementById('doc-work-location');
    if (sidebarInput && sidebarInput.value !== val) sidebarInput.value = val;
    const sheetInput = document.getElementById('doc-sheet-work-location');
    if (sheetInput && sheetInput.value !== val) sheetInput.value = val;
    renderCleanDocument();
    saveState();
};

window.setQuotesStatusFilter = function(status) {
    quotesFilter.status = status;
    const pills = ['all', 'offen', 'angenommen'];
    pills.forEach(p => {
        const btn = document.getElementById(`pill-quote-status-${p}`);
        if (btn) btn.classList.toggle('active', p === status);
    });
    renderQuotesOverview();
};

window.setQuotesPeriodFilter = function(type) {
    quotesFilter.periodType = type;
    const pills = ['all', 'monthly', 'quarter', 'yearly'];
    pills.forEach(p => {
        const btn = document.getElementById(`pill-quotes-period-${p}`);
        if (btn) btn.classList.toggle('active', p === type);
    });

    const subSelect = document.getElementById('quotes-sub-period-select');
    if (type === 'all') {
        quotesFilter.subPeriod = 'all';
        if (subSelect) subSelect.style.display = 'none';
    } else {
        populateQuotesSubPeriodDropdown(type);
        if (subSelect) {
            subSelect.style.display = 'inline-block';
            if (subSelect.options.length > 1) {
                quotesFilter.subPeriod = subSelect.options[1].value;
                subSelect.value = quotesFilter.subPeriod;
            } else {
                quotesFilter.subPeriod = 'all';
            }
        }
    }
    renderQuotesOverview();
};

function populateQuotesSubPeriodDropdown(type) {
    const subSelect = document.getElementById('quotes-sub-period-select');
    if (!subSelect) return;

    const archive = getInvoicesArchive().filter(inv => inv.docType === 'angebot');
    subSelect.innerHTML = "";

    const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

    const yearsSet = new Set();
    archive.forEach(inv => {
        const d = parseGermanDate(inv.docDate);
        yearsSet.add(d.getFullYear());
    });
    yearsSet.add(2026);
    yearsSet.add(2025);
    const sortedYears = Array.from(yearsSet).sort().reverse();

    if (type === 'monthly') {
        subSelect.innerHTML = `<option value="all">Alle Monate</option>`;
        const monthsSet = new Set();
        archive.forEach(inv => {
            const d = parseGermanDate(inv.docDate);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            monthsSet.add(`${y}-${String(m).padStart(2, '0')}`);
        });
        sortedYears.forEach(y => {
            [6, 5, 4, 3, 2, 1].forEach(m => monthsSet.add(`${y}-${String(m).padStart(2, '0')}`));
        });
        const sortedMonths = Array.from(monthsSet).sort().reverse();
        sortedMonths.forEach(key => {
            const [y, mStr] = key.split('-');
            const mIdx = parseInt(mStr, 10) - 1;
            subSelect.innerHTML += `<option value="${key}">${monthNames[mIdx]} ${y}</option>`;
        });
    } else if (type === 'quarter') {
        subSelect.innerHTML = `<option value="all">Alle Quartale</option>`;
        sortedYears.forEach(y => {
            subSelect.innerHTML += `<option value="${y}-Q1">1. Quartal (Q1) / ${y}</option>`;
            subSelect.innerHTML += `<option value="${y}-Q2">2. Quartal (Q2) / ${y}</option>`;
            subSelect.innerHTML += `<option value="${y}-Q3">3. Quartal (Q3) / ${y}</option>`;
            subSelect.innerHTML += `<option value="${y}-Q4">4. Quartal (Q4) / ${y}</option>`;
        });
    } else if (type === 'yearly') {
        subSelect.innerHTML = `<option value="all">Alle Jahre</option>`;
        sortedYears.forEach(y => {
            subSelect.innerHTML += `<option value="${y}">Jahr ${y}</option>`;
        });
    }
}

window.handleQuotesSubPeriodChange = function(val) {
    quotesFilter.subPeriod = val;
    renderQuotesOverview();
};

window.handleQuotesSearch = function(query) {
    quotesFilter.searchTerm = (query || "").trim().toLowerCase();
    renderQuotesOverview();
};

window.handleQuotesSortChange = function(val) {
    quotesFilter.sortBy = val;
    renderQuotesOverview();
};

window.clearQuotesArchive = function() {
    const archive = getInvoicesArchive();
    const quotes = archive.filter(inv => inv.docType === 'angebot');
    if (quotes.length === 0) {
        showToast("Das Angebotsarchiv ist bereits leer.");
        return;
    }

    showAppConfirm(
        `Möchten Sie wirklich alle ${quotes.length} Angebote unwiderruflich löschen?\nIhre Rechnungen bleiben dabei vollständig erhalten.`,
        () => {
            quotes.forEach(q => markInvoiceAsDeleted(q.id, q.docNumber));
            const remaining = archive.filter(inv => inv.docType !== 'angebot');
            localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(remaining));
            localStorage.setItem('palnau_workspace_initialized', 'true');
            if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
                window.PalnauCloudSync.pushLocalToCloud(true);
            }
            renderQuotesOverview();
            updateAllAppStatesAndBadges();
            showToast("Alle Angebote wurden erfolgreich gelöscht.");
        },
        { title: "Angebotsarchiv leeren", confirmText: "Alle Angebote löschen", btnColor: "#e11d48" }
    );
};

// Bulk selection for quotes
window.toggleSelectAllQuotes = function(checked) {
    const checkboxes = document.querySelectorAll('.overview-quote-chk');
    checkboxes.forEach(cb => {
        cb.checked = checked;
    });
    handleQuoteSelectionChange();
};

window.handleQuoteSelectionChange = function() {
    const checkboxes = document.querySelectorAll('.overview-quote-chk');
    const checkedBoxes = document.querySelectorAll('.overview-quote-chk:checked');
    const count = checkedBoxes.length;
    const total = checkboxes.length;

    const countBadge = document.getElementById('quotes-selected-count-badge');
    const actionsBar = document.getElementById('quotes-selected-actions');
    const topChk = document.getElementById('quotes-select-all-checkbox');

    if (countBadge) {
        countBadge.textContent = `${count} von ${total} ausgewählt`;
        countBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    if (actionsBar) {
        actionsBar.style.display = count > 0 ? 'flex' : 'none';
    }
    if (topChk) {
        topChk.checked = count === total && total > 0;
        topChk.indeterminate = count > 0 && count < total;
    }
};

window.deleteSelectedOverviewQuotes = function() {
    const checkedBoxes = document.querySelectorAll('.overview-quote-chk:checked');
    if (checkedBoxes.length === 0) {
        showToast("Keine Angebote ausgewählt.");
        return;
    }

    const idsToDelete = Array.from(checkedBoxes).map(cb => cb.value).filter(Boolean);
    const count = idsToDelete.length;

    const archive = getInvoicesArchive();
    idsToDelete.forEach(id => {
        const quote = archive.find(i => String(i.id) === String(id));
        markInvoiceAsDeleted(id, quote ? quote.docNumber : null);
    });

    const updated = archive.filter(inv => !idsToDelete.includes(String(inv.id)));
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('palnau_workspace_initialized', 'true');

    if (appState && idsToDelete.includes(String(appState.activeArchiveId))) {
        appState.activeArchiveId = null;
        if (typeof closeAppConfirm === 'function') closeAppConfirm();
        startCleanState();
        if (typeof renderAll === 'function') renderAll();
    }

    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud(true);
    }

    renderQuotesOverview();
    updateAllAppStatesAndBadges();
    showToast(`${count} Angebot(e) erfolgreich gelöscht.`);
};

// ==========================================================================
// RENDER QUOTES OVERVIEW
// ==========================================================================
window.renderQuotesOverview = function() {
    const listContainer = document.getElementById('overview-quotes-list');
    if (!listContainer) return;

    let archive = getInvoicesArchive().filter(inv => inv.docType === 'angebot');

    // 1. Calculate KPI Metrics for Quotes
    const totalCount = archive.length;
    const acceptedQuotes = archive.filter(q => q.quoteStatus === 'angenommen');
    const openQuotes = archive.filter(q => q.quoteStatus !== 'angenommen');

    const volumeOpen = openQuotes.reduce((s, q) => s + (parseFloat(q.totalGross) || 0), 0);
    const volumeAccepted = acceptedQuotes.reduce((s, q) => s + (parseFloat(q.totalGross) || 0), 0);
    const volumeTotal = volumeOpen + volumeAccepted;
    const conversionRate = totalCount > 0 ? Math.round((acceptedQuotes.length / totalCount) * 100) : 0;

    const kpiOpen = document.getElementById('kpi-quotes-volume-open');
    const kpiAccepted = document.getElementById('kpi-quotes-volume-accepted');
    const kpiTotal = document.getElementById('kpi-quotes-volume-total');
    const kpiRate = document.getElementById('kpi-quotes-conversion-rate');
    const kpiSubCount = document.getElementById('kpi-quotes-sub-count');
    const kpiSubOpen = document.getElementById('kpi-quotes-sub-open');

    if (kpiOpen) kpiOpen.textContent = formatCurrency(volumeOpen);
    if (kpiAccepted) kpiAccepted.textContent = formatCurrency(volumeAccepted);
    if (kpiTotal) kpiTotal.textContent = formatCurrency(volumeTotal);
    if (kpiRate) kpiRate.textContent = `${conversionRate}%`;
    if (kpiSubCount) kpiSubCount.textContent = `${totalCount} Angebote im Archiv`;
    if (kpiSubOpen) kpiSubOpen.textContent = `${openQuotes.length} offen • ${acceptedQuotes.length} angenommen`;

    // 2. Filter by Status
    if (quotesFilter.status === 'offen') {
        archive = archive.filter(q => q.quoteStatus !== 'angenommen');
    } else if (quotesFilter.status === 'angenommen') {
        archive = archive.filter(q => q.quoteStatus === 'angenommen');
    }

    // 3. Filter by Period
    if (quotesFilter.periodType === 'monthly' && quotesFilter.subPeriod !== 'all') {
        const [targetYear, targetMonth] = quotesFilter.subPeriod.split('-');
        archive = archive.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === parseInt(targetYear, 10) && (d.getMonth() + 1) === parseInt(targetMonth, 10);
        });
    } else if (quotesFilter.periodType === 'quarter' && quotesFilter.subPeriod !== 'all') {
        const [targetYear, targetQ] = quotesFilter.subPeriod.split('-');
        const qNum = parseInt(targetQ.replace('Q', ''), 10);
        archive = archive.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            const invQ = Math.floor(d.getMonth() / 3) + 1;
            return d.getFullYear() === parseInt(targetYear, 10) && invQ === qNum;
        });
    } else if (quotesFilter.periodType === 'yearly' && quotesFilter.subPeriod !== 'all') {
        archive = archive.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === parseInt(quotesFilter.subPeriod, 10);
        });
    }

    // 4. Filter by Search Query
    if (quotesFilter.searchTerm) {
        const term = quotesFilter.searchTerm;
        archive = archive.filter(inv => {
            const name = (inv.client && inv.client.name) ? inv.client.name.toLowerCase() : "";
            const street = (inv.client && inv.client.street) ? inv.client.street.toLowerCase() : "";
            const city = (inv.client && inv.client.zipCity) ? inv.client.zipCity.toLowerCase() : "";
            const docNum = (inv.docNumber || "").toLowerCase();
            const itemsText = (inv.items || []).map(i => (i.title + " " + i.description).toLowerCase()).join(" ");
            return name.includes(term) || street.includes(term) || city.includes(term) || docNum.includes(term) || itemsText.includes(term);
        });
    }

    // 5. Sort
    archive.sort((a, b) => {
        const dateA = parseGermanDate(a.docDate).getTime();
        const dateB = parseGermanDate(b.docDate).getTime();
        const grossA = parseFloat(a.totalGross) || 0;
        const grossB = parseFloat(b.totalGross) || 0;
        const nameA = ((a.client && a.client.name) || "").toLowerCase();
        const nameB = ((b.client && b.client.name) || "").toLowerCase();

        switch (quotesFilter.sortBy) {
            case 'date-desc': return dateB - dateA;
            case 'date-asc': return dateA - dateB;
            case 'amount-desc': return grossB - grossA;
            case 'amount-asc': return grossA - grossB;
            case 'name-asc': return nameA.localeCompare(nameB);
            default: return dateB - dateA;
        }
    });

    // 6. Render Quote Cards
    if (archive.length === 0) {
        listContainer.innerHTML = `
            <div style="background: #ffffff; border-radius: 14px; padding: 48px 24px; text-align: center; border: 1px dashed #cbd5e1; grid-column: 1 / -1;">
                <div style="display: flex; justify-content: center; margin-bottom: 14px;">
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                        </svg>
                    </div>
                </div>
                <h3 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">Keine Angebote gefunden</h3>
                <p style="color: #64748b; font-size: 0.88rem; margin: 0 0 18px 0;">Erstellen Sie ein neues Angebot mit individuellen Leistungen oder passen Sie Ihre Filter an.</p>
                <button type="button" class="neu-btn neu-btn-primary" onclick="createNewQuoteInGenerator()" style="padding: 9px 20px; font-size: 0.88rem;">
                    Neues Angebot erstellen
                </button>
            </div>
        `;
        handleQuoteSelectionChange();
        return;
    }

    listContainer.innerHTML = archive.map(quote => {
        const isAccepted = quote.quoteStatus === 'angenommen';
        const clientName = (quote.client && quote.client.name) ? quote.client.name : "Unbenannter Kunde";
        const clientStreet = (quote.client && quote.client.street) ? quote.client.street : "";
        const clientCity = (quote.client && quote.client.zipCity) ? quote.client.zipCity : "";
        const itemsCount = (quote.items || []).length;
        const itemsPreview = (quote.items || []).slice(0, 2).map(i => i.title || i.description).filter(Boolean).join(" • ");

        const statusBadge = isAccepted 
            ? `<span class="card-status-badge status-quote-angenommen">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 <span>Angenommen${quote.convertedInvoiceNumber ? ' (' + escapeHtml(quote.convertedInvoiceNumber) + ')' : ''}</span>
               </span>`
            : (quote.quoteStatus === 'in_abstimmung'
                ? `<span class="card-status-badge status-quote-abstimmung">● In Abstimmung</span>`
                : `<span class="card-status-badge status-quote-offen">● Offen</span>`);

        return `
            <div class="overview-invoice-card quote-card ${isAccepted ? 'is-converted-accepted' : ''}">
                <div class="card-top-row">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" class="overview-quote-chk" value="${escapeHtml(quote.id)}" onchange="handleQuoteSelectionChange()" style="cursor: pointer; width: 16px; height: 16px; accent-color: #059669;">
                        <div>
                            <div class="card-doc-number quote-doc-num">${escapeHtml(quote.docNumber || 'ANG-UNBEKANNT')}</div>
                            <div class="card-doc-date">Angebotsdatum: ${escapeHtml(quote.docDate || '-')}</div>
                        </div>
                    </div>
                    ${statusBadge}
                </div>

                <div class="card-client-wrap">
                    <div class="card-client-name">${escapeHtml(clientName)}</div>
                    <div class="card-client-address">${escapeHtml(clientStreet)}${clientStreet && clientCity ? ', ' : ''}${escapeHtml(clientCity)}</div>
                </div>

                <div class="card-items-preview">
                    <strong>${itemsCount} Position${itemsCount === 1 ? '' : 'en'}:</strong> 
                    ${escapeHtml(itemsPreview || "Garten- & Landschaftsbauarbeiten")}
                    ${itemsCount > 2 ? ` <span style="color: #64748b; font-size: 0.78rem;">(+${itemsCount - 2} weitere)</span>` : ''}
                </div>

                <div class="card-amounts-table">
                    <div class="card-amount-row">
                        <span>Netto:</span>
                        <span>${formatCurrency(quote.totalNet || 0)}</span>
                    </div>
                    <div class="card-amount-row">
                        <span>USt (19%):</span>
                        <span>${formatCurrency(quote.totalTax || 0)}</span>
                    </div>
                    <div class="card-amount-row total-gross quote-gross">
                        <span>Gesamt (Brutto):</span>
                        <span>${formatCurrency(quote.totalGross || 0)}</span>
                    </div>
                </div>

                <div class="card-actions-row">
                    <!-- Key user requirement: Direct transfer button with custom date modal -->
                    <button type="button" class="btn-card-action btn-action-convert" onclick="openConvertToInvoiceModal('${escapeHtml(quote.id)}')" title="Bei Kundenzusage als Rechnung mit neuem Datum in Rechnungs-Übersicht transferieren">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="12" y1="18" x2="12" y2="12"></line>
                            <line x1="9" y1="15" x2="15" y2="15"></line>
                        </svg>
                        <span>${isAccepted ? 'Als neue Rechnung buchen' : 'Als Rechnung buchen'}</span>
                    </button>

                    <button type="button" class="btn-card-action" onclick="editQuoteInGenerator('${escapeHtml(quote.id)}')" title="Im Generator bearbeiten">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <span>Bearbeiten</span>
                    </button>

                    <button type="button" class="btn-card-action" onclick="downloadInvoicePdfDirect('${escapeHtml(quote.id)}')" title="Angebot als PDF drucken">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        <span>PDF</span>
                    </button>

                    <button type="button" class="btn-card-action btn-action-delete" onclick="deleteInvoiceFromArchive('${escapeHtml(quote.id)}')" title="Angebot löschen">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        <span>Löschen</span>
                    </button>
                </div>
            </div>
        `;
    }).join("");

    handleQuoteSelectionChange();
};

// ==========================================================================
// QUOTE TO INVOICE TRANSFER & DATE PROMPT MODAL
// ==========================================================================
window.openConvertToInvoiceModal = function(quoteId) {
    let quote = null;
    const archive = getInvoicesArchive();

    if (quoteId && quoteId !== 'current') {
        quote = archive.find(i => String(i.id) === String(quoteId) || String(i.docNumber) === String(quoteId));
    }

    if (!quote && (quoteId === 'current' || appState.docType === 'angebot')) {
        const totals = calculateTotals();
        quote = {
            id: appState.activeArchiveId || ('ang-temp-' + Date.now()),
            docType: 'angebot',
            docNumber: appState.docNumber,
            docDate: appState.docDate,
            servicePeriod: appState.servicePeriod,
            taxRate: appState.taxRate,
            clientType: appState.clientType || 'privat',
            workLocation: appState.workLocation || '',
            client: { ...appState.client },
            items: JSON.parse(JSON.stringify(appState.items || [])),
            notesText: appState.notesText,
            totalNet: totals.netTotal,
            totalTax: totals.taxAmount,
            totalGross: totals.grossTotal
        };
    }

    if (!quote) {
        showToast("Angebot konnte nicht geladen werden.");
        return;
    }

    activeQuoteForConversion = quote;

    // Fill summary details
    const custEl = document.getElementById('convert-quote-customer');
    const metaEl = document.getElementById('convert-quote-meta');
    const amountEl = document.getElementById('convert-quote-amount');

    if (custEl) custEl.textContent = (quote.client && quote.client.name) ? quote.client.name : "Unbenannter Kunde";
    if (metaEl) metaEl.textContent = `${quote.docNumber || 'Angebot'} • Angebotsdatum: ${quote.docDate || '-'}`;
    if (amountEl) amountEl.textContent = formatCurrency(quote.totalGross || 0);

    // Prompt for new invoice date (Default: Today in DD.MM.YYYY German format, fully editable)
    const todayGerman = formatDateForGermanDisplay(new Date());
    const dateInput = document.getElementById('convert-invoice-date');
    if (dateInput) {
        dateInput.value = todayGerman;
    }
    updateConvertDateDisplay(todayGerman);

    // Pre-fill next invoice document number
    const numInput = document.getElementById('convert-invoice-num');
    if (numInput) {
        numInput.value = generateDocNumber("rechnung");
    }

    // Pre-fill service period
    const periodInput = document.getElementById('convert-invoice-period');
    if (periodInput) {
        periodInput.value = quote.servicePeriod && !quote.servicePeriod.includes('Gültig') ? quote.servicePeriod : getCurrentMonthGerman();
    }

    // Open Modal
    const modal = document.getElementById('convert-quote-modal');
    if (modal) modal.style.display = 'flex';
};

window.openConvertToInvoiceModalFromGenerator = function() {
    if (appState.docType !== 'angebot') {
        showToast("Nur Angebote können in eine Rechnung umgewandelt werden.");
        return;
    }
    // Save current quote first
    saveCurrentInvoiceToArchive(false);
    openConvertToInvoiceModal(appState.activeArchiveId || 'current');
};

window.closeConvertToInvoiceModal = function() {
    const modal = document.getElementById('convert-quote-modal');
    if (modal) modal.style.display = 'none';
    activeQuoteForConversion = null;
};

window.updateConvertDateDisplay = function(val) {
    const display = document.getElementById('convert-date-german-display');
    if (display) {
        display.textContent = normalizeToGermanDate(val);
    }
};

window.openConvertNativeDatePicker = function() {
    const picker = document.getElementById('convert-native-date-picker');
    if (!picker) return;
    const curr = document.getElementById('convert-invoice-date')?.value;
    if (curr) {
        const iso = formatGermanToIso(curr);
        if (iso) picker.value = iso;
    }
    if (typeof picker.showPicker === 'function') {
        picker.showPicker();
    } else {
        picker.click();
    }
};

window.syncNativeDateToConvertInput = function(isoVal) {
    if (!isoVal) return;
    const german = formatIsoToGerman(isoVal);
    const dateInput = document.getElementById('convert-invoice-date');
    if (dateInput) {
        dateInput.value = german;
    }
    updateConvertDateDisplay(german);
};

window.setConvertDatePreset = function(preset) {
    const dateInput = document.getElementById('convert-invoice-date');
    if (!dateInput) return;

    const d = new Date();
    if (preset === 'today') {
        // Today
    } else if (preset === 'tomorrow') {
        d.setDate(d.getDate() + 1);
    } else if (preset === 'firstOfMonth') {
        d.setDate(1);
    } else if (preset === 'sameAsQuote') {
        if (activeQuoteForConversion && activeQuoteForConversion.docDate) {
            const quoteDate = normalizeToGermanDate(activeQuoteForConversion.docDate);
            dateInput.value = quoteDate;
            updateConvertDateDisplay(quoteDate);
            return;
        }
    }

    const german = formatDateForGermanDisplay(d);
    dateInput.value = german;
    updateConvertDateDisplay(german);
};

window.generateNewConvertInvoiceNum = function() {
    const input = document.getElementById('convert-invoice-num');
    if (input) {
        input.value = generateDocNumber("rechnung");
    }
};

window.submitConvertToInvoice = function() {
    if (!activeQuoteForConversion) {
        showToast("Fehler: Kein Angebot ausgewählt.");
        closeConvertToInvoiceModal();
        return;
    }

    const dateInput = document.getElementById('convert-invoice-date');
    const numInput = document.getElementById('convert-invoice-num');
    const periodInput = document.getElementById('convert-invoice-period');
    const optRef = document.getElementById('convert-opt-reference');
    const optAccepted = document.getElementById('convert-opt-mark-accepted');
    const optSwitch = document.getElementById('convert-opt-switch-view');

    const inputDate = dateInput ? dateInput.value.trim() : "";
    if (!inputDate) {
        showToast("Bitte geben Sie ein Rechnungsdatum ein (z. B. " + formatDateForGermanDisplay(new Date()) + ").");
        if (dateInput) dateInput.focus();
        return;
    }

    const invoiceDateGerman = normalizeToGermanDate(inputDate);
    const invoiceNumber = (numInput && numInput.value.trim()) ? numInput.value.trim() : generateDocNumber("rechnung");
    const servicePeriod = (periodInput && periodInput.value.trim()) ? periodInput.value.trim() : getCurrentMonthGerman();
    const withReference = optRef ? optRef.checked : true;
    const markAsAccepted = optAccepted ? optAccepted.checked : true;
    const switchView = optSwitch ? optSwitch.checked : true;

    // Build the new booked invoice
    const newInvoice = JSON.parse(JSON.stringify(activeQuoteForConversion));
    newInvoice.id = 'inv-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    newInvoice.docType = 'rechnung';
    newInvoice.docNumber = invoiceNumber;
    newInvoice.docDate = invoiceDateGerman; // Crucial user requirement: distinct invoice date
    newInvoice.servicePeriod = servicePeriod;
    newInvoice.status = 'ausgestellt';
    newInvoice.clientType = activeQuoteForConversion.clientType || 'privat';
    newInvoice.workLocation = activeQuoteForConversion.workLocation || '';
    newInvoice.convertedFromQuoteId = activeQuoteForConversion.id;
    newInvoice.convertedFromQuoteNumber = activeQuoteForConversion.docNumber;
    newInvoice.convertedAt = new Date().toISOString();

    if (withReference) {
        const refText = `Ausgeführt und abgerechnet gemäß Angebot ${activeQuoteForConversion.docNumber} vom ${activeQuoteForConversion.docDate || ''}.\n`;
        newInvoice.notesText = refText + (newInvoice.notesText || "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen ab Rechnungsdatum ohne Abzug auf unser unten genanntes Bankkonto unter Angabe der Rechnungsnummer als Verwendungszweck.");
    } else if (!newInvoice.notesText || newInvoice.notesText.includes('freibleibend')) {
        newInvoice.notesText = "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen ab Rechnungsdatum ohne Abzug auf unser unten genanntes Bankkonto unter Angabe der Rechnungsnummer als Verwendungszweck.";
    }

    const archive = getInvoicesArchive();

    // User requirement: When an offer is converted to an invoice, delete the original offer from the archive
    const qIdx = archive.findIndex(i => String(i.id) === String(activeQuoteForConversion.id) || String(i.docNumber) === String(activeQuoteForConversion.docNumber));
    if (qIdx !== -1) {
        archive.splice(qIdx, 1);
    }

    // Add new invoice to archive
    archive.unshift(newInvoice);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
    localStorage.setItem('palnau_workspace_initialized', 'true');

    // If editor currently has the converted quote open, update editor to the new invoice
    if (appState.activeArchiveId === activeQuoteForConversion.id || appState.docNumber === activeQuoteForConversion.docNumber) {
        appState.activeArchiveId = newInvoice.id;
        appState.docType = 'rechnung';
        appState.docNumber = newInvoice.docNumber;
        appState.docDate = newInvoice.docDate;
        appState.servicePeriod = newInvoice.servicePeriod;
        appState.notesText = newInvoice.notesText;
        saveState();
        if (typeof renderDocument === 'function') renderDocument();
    }

    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud();
    }

    closeConvertToInvoiceModal();

    // Refresh screens & states
    updateAllAppStatesAndBadges();
    renderQuotesOverview();
    renderOverviewInvoices();
    if (typeof renderClientsView === 'function') renderClientsView();
    if (typeof renderQuartersView === 'function') renderQuartersView();

    showToast(`✓ Angebot ${activeQuoteForConversion.docNumber} erfolgreich als Rechnung ${newInvoice.docNumber} (${invoiceDateGerman}) übertragen!`);

    if (switchView) {
        switchAppView('overview');
    }
};

// ==========================================================================
// E-RECHNUNG (XRECHNUNG 3.0 / ZUGFERD) XML VIEWER & EXPORT
// Rechtskonform nach EN 16931 für B2B & B2G in Deutschland
// ==========================================================================

let activeXRechnungXml = "";
let activeXRechnungDocNum = "";

window.exportCurrentInvoiceToXRechnung = function() {
    if (typeof generateXRechnungXML !== 'function') {
        showToast("XML Generator nicht verfügbar.");
        return;
    }
    const xml = generateXRechnungXML(appState);
    openXRechnungModal(xml, appState.docNumber);
};

window.exportInvoiceIdToXRechnung = function(invoiceId) {
    const archive = getInvoicesArchive();
    const invoice = archive.find(inv => inv.id === invoiceId);
    if (!invoice) {
        showToast("Rechnung nicht gefunden.");
        return;
    }
    if (typeof generateXRechnungXML !== 'function') {
        showToast("XML Generator nicht verfügbar.");
        return;
    }
    const xml = generateXRechnungXML(invoice);
    openXRechnungModal(xml, invoice.docNumber);
};

function openXRechnungModal(xmlString, docNumber) {
    activeXRechnungXml = xmlString;
    activeXRechnungDocNum = docNumber || "Rechnung";

    const modal = document.getElementById('xrechnung-modal');
    const codeEl = document.getElementById('xrechnung-code-display');
    const titleEl = document.getElementById('xrechnung-modal-title');

    if (codeEl) codeEl.textContent = xmlString;
    if (titleEl) titleEl.textContent = `E-Rechnung (XML • ${docNumber})`;
    if (modal) modal.style.display = 'flex';
}

window.closeXRechnungModal = function() {
    const modal = document.getElementById('xrechnung-modal');
    if (modal) modal.style.display = 'none';
};

window.copyXRechnungXmlToClipboard = function() {
    if (!activeXRechnungXml) return;
    navigator.clipboard.writeText(activeXRechnungXml)
        .then(() => {
            showToast("XML erfolgreich in die Zwischenablage kopiert!");
        })
        .catch(err => {
            console.error("Copy failed", err);
            showToast("Kopieren nicht möglich.");
        });
};

window.downloadCurrentXRechnungXml = function() {
    if (!activeXRechnungXml) return;
    const blob = new Blob([activeXRechnungXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeXRechnungDocNum}_XRechnung_Palnau.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`XML Datei ${activeXRechnungDocNum}_XRechnung_Palnau.xml heruntergeladen!`);
};

window.downloadInvoicePdfDirect = function(invoiceId) {
    const archive = getInvoicesArchive();
    const invoice = archive.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    // Temporarily set as active and export
    const previousState = JSON.parse(JSON.stringify(appState));

    appState.docType = invoice.docType || "rechnung";
    appState.docNumber = invoice.docNumber;
    appState.docDate = invoice.docDate;
    appState.servicePeriod = invoice.servicePeriod || "";
    appState.taxRate = invoice.taxRate || 19;
    appState.clientType = invoice.clientType || (invoice.client && invoice.client.clientType) || ((typeof isCompanyClient === 'function' && isCompanyClient(invoice.client)) ? "firma" : "privat");
    appState.workLocation = invoice.workLocation || (invoice.client && invoice.client.workLocation) || "";
    appState.customWageNet = invoice.customWageNet !== undefined ? invoice.customWageNet : null;
    appState.client = { ...invoice.client };
    appState.items = JSON.parse(JSON.stringify(invoice.items || []));
    appState.notesText = invoice.notesText || "";

    renderCleanDocument();
    exportToPdf();

    // Restore editor appState
    appState = previousState;
    renderCleanDocument();
};

// ==========================================================================
// LAUNCHER MENU LIVE SEARCH & ACTIONS
// ==========================================================================

window.handleLauncherSearch = function(query) {
    const term = (query || "").toLowerCase().trim();
    const clearBtn = document.getElementById('launcher-search-clear');
    const resultsPanel = document.getElementById('launcher-search-results');
    const appsGrid = document.getElementById('launcher-grid');

    if (clearBtn) clearBtn.style.display = term ? 'block' : 'none';

    if (!term) {
        if (resultsPanel) resultsPanel.style.display = 'none';
        if (appsGrid) {
            Array.from(appsGrid.children).forEach(tile => tile.style.display = 'flex');
        }
        return;
    }

    // Filter App Tiles
    let matchedTileCount = 0;
    if (appsGrid) {
        Array.from(appsGrid.children).forEach(tile => {
            const title = (tile.querySelector('.launcher-app-title')?.textContent || "").toLowerCase();
            const desc = (tile.getAttribute('title') || "").toLowerCase();
            const isMatch = title.includes(term) || desc.includes(term);
            tile.style.display = isMatch ? 'flex' : 'none';
            if (isMatch) matchedTileCount++;
        });
    }

    // Search Invoices Archive
    const archive = getInvoicesArchive();
    const matchedInvoices = archive.filter(inv => {
        const docNum = (inv.docNumber || "").toLowerCase();
        const clientName = ((inv.client && inv.client.name) || "").toLowerCase();
        const clientAddr = (((inv.client && inv.client.zipCity) || "") + " " + ((inv.client && inv.client.street) || "")).toLowerCase();
        return docNum.includes(term) || clientName.includes(term) || clientAddr.includes(term);
    }).slice(0, 5);

    if (resultsPanel) {
        if (matchedInvoices.length > 0) {
            resultsPanel.style.display = 'block';
            let html = `<div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">Gefundene Belege (${matchedInvoices.length})</div>`;
            matchedInvoices.forEach(inv => {
                html += `
                    <div class="launcher-result-item" onclick="editInvoiceInGenerator('${inv.id}')">
                        <div class="launcher-result-main">
                            <span class="launcher-result-title">${escapeHtml(inv.docNumber)} • ${escapeHtml((inv.client && inv.client.name) || 'Kunde')}</span>
                            <span class="launcher-result-sub">${escapeHtml(inv.docDate)} • ${formatCurrency(inv.totalGross)}</span>
                        </div>
                        <span style="font-size: 0.75rem; color: #38bdf8; font-weight: 600;">Öffnen →</span>
                    </div>
                `;
            });
            resultsPanel.innerHTML = html;
        } else {
            resultsPanel.style.display = 'none';
        }
    }
};

window.clearLauncherSearch = function() {
    const input = document.getElementById('launcher-search-input');
    const clearBtn = document.getElementById('launcher-search-clear');
    const resultsPanel = document.getElementById('launcher-search-results');
    const appsGrid = document.getElementById('launcher-grid');

    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (resultsPanel) resultsPanel.style.display = 'none';
    if (appsGrid) {
        Array.from(appsGrid.children).forEach(tile => tile.style.display = 'flex');
    }
};

window.openCatalogFromLauncher = function() {
    switchAppView('catalog');
};

window.openClientsFromLauncher = function() {
    switchAppView('clients');
};

window.openQuartersFromLauncher = function() {
    switchAppView('quarters');
};

window.openERechnungHubFromLauncher = function() {
    switchAppView('erechnung');
};

// ==========================================================================
// MOBILE VIEW NAVIGATION HELPER
// ==========================================================================

window.switchMobileTab = function(tab) {
    const container = document.getElementById('app-main-shell');
    const tabEditor = document.getElementById('tab-nav-editor');
    const tabActions = document.getElementById('tab-nav-actions');
    if (!container) return;

    if (tab === 'actions') {
        container.classList.add('mobile-view-actions');
        if (tabActions) tabActions.classList.add('active');
        if (tabEditor) tabEditor.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        container.classList.remove('mobile-view-actions');
        if (tabEditor) tabEditor.classList.add('active');
        if (tabActions) tabActions.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// ==========================================================================
// E-RECHNUNG & XRECHNUNG HUB CONTROLLER
// Dedicated workspace for XML generation, CII inspection, validation and export
// ==========================================================================

let currentHubInvoiceId = null;

window.renderERechnungHub = function(invoiceId) {
    const archive = getInvoicesArchive();
    const selectEl = document.getElementById('erechnung-invoice-select');
    if (!selectEl) return;

    selectEl.innerHTML = "";
    if (archive.length === 0) {
        selectEl.innerHTML = `<option value="active">Aktuelle Rechnung (${appState.docNumber || 'Entwurf'})</option>`;
    } else {
        archive.forEach(inv => {
            const clientName = (inv.client && inv.client.name) ? inv.client.name : "Kunde";
            selectEl.innerHTML += `<option value="${inv.id}">${escapeHtml(inv.docNumber)} – ${escapeHtml(clientName)} (${formatCurrency(inv.totalGross)})</option>`;
        });
        if (appState.docNumber && !archive.some(i => i.docNumber === appState.docNumber)) {
            selectEl.innerHTML = `<option value="active">Aktueller Entwurf (${escapeHtml(appState.docNumber)})</option>` + selectEl.innerHTML;
        }
    }

    // Determine target invoice
    let targetInv = null;
    if (invoiceId) {
        targetInv = archive.find(i => i.id === invoiceId);
    }
    if (!targetInv && currentHubInvoiceId) {
        targetInv = archive.find(i => i.id === currentHubInvoiceId);
    }
    if (!targetInv && archive.length > 0) {
        targetInv = archive[0];
    }
    if (!targetInv) {
        const totals = calculateTotals();
        targetInv = {
            id: 'active',
            docNumber: appState.docNumber || generateDocNumber("rechnung"),
            docDate: appState.docDate || formatDateForGermanDisplay(new Date()),
            servicePeriod: appState.servicePeriod || getCurrentMonthGerman(),
            taxRate: appState.taxRate || 19,
            client: { ...appState.client },
            items: [...appState.items],
            totalNet: totals.netTotal,
            totalTax: totals.taxAmount,
            totalGross: totals.grossTotal
        };
    }

    currentHubInvoiceId = targetInv.id;
    selectEl.value = targetInv.id;

    // Update financial summary
    const sumDoc = document.getElementById('erechnung-summary-docnum');
    const sumDate = document.getElementById('erechnung-summary-date');
    const sumClient = document.getElementById('erechnung-summary-client');
    const sumGross = document.getElementById('erechnung-summary-gross');
    const sumNet = document.getElementById('erechnung-summary-net');
    const sumTax = document.getElementById('erechnung-summary-tax');
    const filenameEl = document.getElementById('erechnung-xml-filename');

    if (sumDoc) sumDoc.textContent = targetInv.docNumber;
    if (sumDate) sumDate.textContent = targetInv.docDate;
    if (sumClient) sumClient.textContent = (targetInv.client && targetInv.client.name) || "Kunde";
    if (sumGross) sumGross.textContent = formatCurrency(targetInv.totalGross);
    if (sumNet) sumNet.textContent = formatCurrency(targetInv.totalNet);
    if (sumTax) sumTax.textContent = formatCurrency(targetInv.totalTax);
    if (filenameEl) filenameEl.textContent = `${targetInv.docNumber}_XRechnung_Palnau.xml`;

    // Generate XML using generateXRechnungXML
    if (typeof generateXRechnungXML === 'function') {
        const xml = generateXRechnungXML(targetInv);
        activeXRechnungXml = xml;
        activeXRechnungDocNum = targetInv.docNumber;
        const inspector = document.getElementById('erechnung-code-inspector');
        if (inspector) inspector.textContent = xml;
    }
};

window.handleHubInvoiceSelect = function(invId) {
    currentHubInvoiceId = invId;
    renderERechnungHub(invId);
};

window.downloadCurrentHubXRechnungXml = function() {
    downloadCurrentXRechnungXml();
};

window.copyHubXRechnungXmlToClipboard = function() {
    copyXRechnungXmlToClipboard();
};

window.exportHubSelectedInvoiceToPdf = function() {
    if (currentHubInvoiceId && currentHubInvoiceId !== 'active') {
        downloadInvoicePdfDirect(currentHubInvoiceId);
    } else {
        exportToPdf();
    }
};

window.editHubSelectedInvoiceInGenerator = function() {
    if (currentHubInvoiceId && currentHubInvoiceId !== 'active') {
        editInvoiceInGenerator(currentHubInvoiceId);
    } else {
        switchAppView('generator');
    }
};

window.deleteHubSelectedInvoice = function() {
    if (!currentHubInvoiceId || currentHubInvoiceId === 'active') {
        showToast("Der aktive Entwurf kann über 'Formular leeren' im Generator zurückgesetzt werden.");
        return;
    }
    const invId = currentHubInvoiceId;
    currentHubInvoiceId = null;
    deleteInvoiceFromArchive(invId);
};

// ==========================================================================
// LEISTUNGSKATALOG GALABAU CONTROLLER
// Searchable service registry with pricing, quantity adjustments and live insert
// ==========================================================================

let catalogCategoryFilter = 'all';
let catalogSearchQuery = '';

window.filterCatalogByCategory = function(category, buttonEl) {
    catalogCategoryFilter = category;
    if (buttonEl && buttonEl.parentElement) {
        Array.from(buttonEl.parentElement.children).forEach(btn => btn.classList.remove('active'));
        buttonEl.classList.add('active');
    }
    renderCatalogView();
};

window.handleCatalogSearch = function(query) {
    catalogSearchQuery = (query || "").toLowerCase().trim();
    renderCatalogView();
};

window.renderCatalogView = function() {
    const container = document.getElementById('catalog-cards-container');
    if (!container) return;

    // Load base items from SERVICES_CATALOG + custom items from localStorage
    let items = (typeof SERVICES_CATALOG !== 'undefined') ? JSON.parse(JSON.stringify(SERVICES_CATALOG)) : [];
    const customItemsRaw = localStorage.getItem('palnau_custom_catalog');
    if (customItemsRaw) {
        try {
            const customItems = JSON.parse(customItemsRaw);
            if (Array.isArray(customItems)) {
                items = [...customItems, ...items];
            }
        } catch (e) {
            console.warn("Could not parse custom catalog", e);
        }
    }

    // Filter by Category
    if (catalogCategoryFilter !== 'all') {
        items = items.filter(it => it.category && it.category.toLowerCase().includes(catalogCategoryFilter.toLowerCase()));
    }

    // Filter by Search Query
    if (catalogSearchQuery) {
        items = items.filter(it => {
            const n = (it.name || "").toLowerCase();
            const d = (it.description || "").toLowerCase();
            const c = (it.category || "").toLowerCase();
            return n.includes(catalogSearchQuery) || d.includes(catalogSearchQuery) || c.includes(catalogSearchQuery);
        });
    }

    if (items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; background: var(--neu-surface); border-radius: var(--radius-md); padding: 48px 24px; text-align: center; box-shadow: var(--neu-shadow-flat);">
                <div style="display: flex; justify-content: center; margin-bottom: 12px; color: var(--text-muted);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    </svg>
                </div>
                <h3 style="color: var(--text-primary); font-size: 1.1rem; font-weight: 700;">Keine Leistungen gefunden</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Passen Sie Ihren Suchbegriff an oder fügen Sie eine eigene GalaBau-Position hinzu.</p>
                <button type="button" class="neu-btn neu-btn-primary" onclick="toggleCustomServiceForm()" style="margin-top: 14px;">
                    Neue Leistung definieren
                </button>
            </div>
        `;
        return;
    }

    let html = "";
    items.forEach(it => {
        const itemId = it.id || ('serv-' + Math.random().toString(36).substr(2, 9));
        const priceFormatted = formatCurrency(it.unitPrice);
        const icon = it.icon || "🌿";
        const unit = it.standardUnit || "Std";
        const category = it.category || "GalaBau";
        const workers = it.workers || "1 Facharbeiter";
        const desc = it.description || "Fachgerechte Ausführung nach anerkannten Regeln der Technik.";

        const isCustom = it.isCustom || String(itemId).startsWith('custom-');

        html += `
            <div class="catalog-card" id="cat-card-${itemId}">
                <div class="catalog-card-header">
                    <span class="catalog-card-icon">${icon}</span>
                    <div class="catalog-card-title-wrap">
                        <div class="catalog-card-title">${escapeHtml(it.name)}</div>
                        <span class="catalog-card-category">${escapeHtml(category)}</span>
                    </div>
                </div>

                <p class="catalog-card-desc">${escapeHtml(desc)}</p>

                <div class="catalog-card-meta">
                    <span class="catalog-card-unit">Einheit: <strong>${escapeHtml(unit)}</strong> (${escapeHtml(workers)})</span>
                    <span class="catalog-card-price">${priceFormatted} <small style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted);">netto</small></span>
                </div>

                <div class="catalog-card-actions">
                    <div class="catalog-qty-stepper">
                        <button type="button" class="catalog-stepper-btn" onclick="adjustCatalogCardQty('${itemId}', -1)" title="Menge verringern">−</button>
                        <input type="number" id="qty-${itemId}" class="catalog-qty-input" value="1" min="0.5" step="0.5">
                        <button type="button" class="catalog-stepper-btn" onclick="adjustCatalogCardQty('${itemId}', 1)" title="Menge erhöhen">+</button>
                    </div>
                    <button type="button" class="neu-btn neu-btn-primary catalog-btn-add" onclick="addCatalogItemToInvoice('${itemId}')" title="Direkt in aktuelle Rechnung übernehmen">
                        In Rechnung übernehmen
                    </button>
                    ${isCustom ? `
                        <button type="button" class="neu-btn" onclick="deleteCustomCatalogItem('${itemId}')" title="Leistung aus dem Katalog löschen" style="color: #dc2626; padding: 6px 10px; font-size: 0.8rem;">
                            Löschen
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
};

window.adjustCatalogCardQty = function(itemId, delta) {
    const input = document.getElementById(`qty-${itemId}`);
    if (!input) return;
    let val = parseFloat(input.value) || 1;
    val = Math.max(0.5, val + delta);
    input.value = val;
};

window.addCatalogItemToInvoice = function(itemId) {
    const qtyInput = document.getElementById(`qty-${itemId}`);
    const qty = qtyInput ? (parseFloat(qtyInput.value) || 1) : 1;
    addCatalogServiceToDoc(itemId, qty);
    updateAllAppStatesAndBadges();
};

window.toggleCustomServiceForm = function() {
    const form = document.getElementById('catalog-custom-form');
    if (!form) return;
    form.style.display = (form.style.display === 'none' || !form.style.display) ? 'block' : 'none';
};

window.saveCustomServiceToCatalog = function() {
    const nameInput = document.getElementById('custom-service-name');
    const catInput = document.getElementById('custom-service-cat');
    const unitInput = document.getElementById('custom-service-unit');
    const priceInput = document.getElementById('custom-service-price');
    const descInput = document.getElementById('custom-service-desc');

    if (!nameInput || !nameInput.value.trim()) {
        showToast("Bitte geben Sie eine Leistungsbezeichnung ein.");
        if (nameInput) nameInput.focus();
        return;
    }

    const price = parseFloat(priceInput ? priceInput.value : 0) || 55;
    const newService = {
        id: "custom-" + Date.now(),
        name: nameInput.value.trim(),
        category: catInput ? catInput.value : "GalaBau",
        standardUnit: unitInput ? unitInput.value : "Std",
        unitPrice: price,
        description: descInput ? descInput.value.trim() : "Fachgerechte Ausführung nach GalaBau-Standard.",
        icon: "🌿",
        workers: "1 Facharbeiter"
    };

    let customItems = [];
    const raw = localStorage.getItem('palnau_custom_catalog');
    if (raw) {
        try { customItems = JSON.parse(raw) || []; } catch (e) {}
    }
    customItems.unshift(newService);
    localStorage.setItem('palnau_custom_catalog', JSON.stringify(customItems));
    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud();
    }

    // Reset inputs
    nameInput.value = "";
    if (descInput) descInput.value = "";
    if (priceInput) priceInput.value = "";
    toggleCustomServiceForm();

    renderCatalogView();
    showToast(`Neue Leistung "${newService.name}" dauerhaft im Katalog gespeichert!`);
};

window.deleteCustomCatalogItem = function(itemId) {
    if (!itemId) return;
    let customItems = [];
    const raw = localStorage.getItem('palnau_custom_catalog');
    if (raw) {
        try { customItems = JSON.parse(raw) || []; } catch (e) {}
    }
    customItems = customItems.filter(it => it.id !== itemId);
    localStorage.setItem('palnau_custom_catalog', JSON.stringify(customItems));
    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud();
    }
    renderCatalogView();
    showToast("Leistung aus dem Katalog gelöscht.");
};

// ==========================================================================
// KUNDENVERWALTUNG (CRM) - PROFESSIONELLE DATENBANK-TABELLE
// Aggregates client portfolio, total gross revenues, and 1-click invoice creation
// ==========================================================================

let clientsSearchQuery = '';
let clientsSegmentFilter = 'all';
let clientsSortOrder = 'revenue_desc';
const openClientRows = new Set();

window.handleClientsSearch = function(query) {
    clientsSearchQuery = (query || "").toLowerCase().trim();
    const clearBtn = document.getElementById('clients-search-clear');
    if (clearBtn) clearBtn.style.display = query ? 'inline-block' : 'none';
    renderClientsView();
};

window.clearClientsSearch = function() {
    const input = document.getElementById('clients-search-input');
    const clearBtn = document.getElementById('clients-search-clear');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    clientsSearchQuery = '';
    renderClientsView();
};

window.setClientsSegmentFilter = function(segment, btn) {
    clientsSegmentFilter = segment;
    if (btn && btn.parentElement) {
        Array.from(btn.parentElement.children).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    renderClientsView();
};

window.handleClientsSortChange = function(sortValue) {
    clientsSortOrder = sortValue;
    renderClientsView();
};

window.toggleClientInvoicesRow = function(clientKey) {
    if (openClientRows.has(clientKey)) {
        openClientRows.delete(clientKey);
    } else {
        openClientRows.add(clientKey);
    }
    renderClientsView();
};

window.renderClientsView = function() {
    const tbody = document.getElementById('crm-clients-table-body');
    if (!tbody) return;

    const archive = getInvoicesArchive();

    // Aggregate by client
    const clientsMap = {};
    archive.forEach(inv => {
        if (!inv.client || !inv.client.name) return;
        const key = inv.client.name.trim().toLowerCase();
        if (!clientsMap[key]) {
            clientsMap[key] = {
                key: key,
                name: inv.client.name.trim(),
                street: inv.client.street || "",
                zipCity: inv.client.zipCity || "",
                invoices: [],
                totalGross: 0,
                totalNet: 0,
                totalTax: 0,
                lastInvoiceDate: inv.docDate,
                recentService: (inv.items && inv.items[0]) ? inv.items[0].title : "GalaBau Arbeiten"
            };
        }
        clientsMap[key].invoices.push(inv);
        clientsMap[key].totalGross += (parseFloat(inv.totalGross) || 0);
        clientsMap[key].totalNet += (parseFloat(inv.totalNet) || 0);
        clientsMap[key].totalTax += (parseFloat(inv.totalTax) || 0);
        if (inv.client.street) clientsMap[key].street = inv.client.street;
        if (inv.client.zipCity) clientsMap[key].zipCity = inv.client.zipCity;
    });

    let allClients = Object.values(clientsMap);

    // Filter by Search Query
    let filtered = allClients;
    if (clientsSearchQuery) {
        filtered = filtered.filter(c => {
            const n = c.name.toLowerCase();
            const s = c.street.toLowerCase();
            const z = c.zipCity.toLowerCase();
            return n.includes(clientsSearchQuery) || s.includes(clientsSearchQuery) || z.includes(clientsSearchQuery);
        });
    }

    // Filter by Segment
    if (clientsSegmentFilter === 'stamm') {
        filtered = filtered.filter(c => c.invoices.length >= 2);
    } else if (clientsSegmentFilter === 'top') {
        filtered = filtered.filter(c => c.totalGross >= 1000);
    } else if (clientsSegmentFilter === 'single') {
        filtered = filtered.filter(c => c.invoices.length === 1);
    }

    // Dynamic KPIs based on active filter
    const totalClientsCount = filtered.length;
    const totalRevenue = filtered.reduce((s, c) => s + c.totalGross, 0);
    const avgPerClient = totalClientsCount > 0 ? (totalRevenue / totalClientsCount) : 0;
    
    // Top client in this filtered segment
    const sortedByRevenue = [...filtered].sort((a, b) => b.totalGross - a.totalGross);
    const topClient = sortedByRevenue.length > 0 ? sortedByRevenue[0] : null;

    const kpiCount = document.getElementById('kpi-clients-count');
    const kpiRev = document.getElementById('kpi-clients-revenue');
    const kpiAvg = document.getElementById('kpi-clients-avg');
    const kpiTop = document.getElementById('kpi-clients-top');
    const kpiTopSub = document.getElementById('kpi-clients-top-sub');

    if (kpiCount) kpiCount.textContent = String(totalClientsCount);
    if (kpiRev) kpiRev.textContent = formatCurrency(totalRevenue);
    if (kpiAvg) kpiAvg.textContent = formatCurrency(avgPerClient);
    if (kpiTop) kpiTop.textContent = topClient ? topClient.name : "-";
    if (kpiTopSub) {
        if (topClient) {
            kpiTopSub.textContent = `Umsatzstärkster (${formatCurrency(topClient.totalGross)})`;
        } else {
            kpiTopSub.textContent = "Keine Kunden im Filter";
        }
    }

    // Sorting
    filtered.sort((a, b) => {
        if (clientsSortOrder === 'revenue_desc') return b.totalGross - a.totalGross;
        if (clientsSortOrder === 'revenue_asc') return a.totalGross - b.totalGross;
        if (clientsSortOrder === 'name_asc') return a.name.localeCompare(b.name, 'de');
        if (clientsSortOrder === 'count_desc') return b.invoices.length - a.invoices.length;
        if (clientsSortOrder === 'date_desc') {
            const da = parseGermanDate(a.lastInvoiceDate).getTime();
            const db = parseGermanDate(b.lastInvoiceDate).getTime();
            return db - da;
        }
        return b.totalGross - a.totalGross;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 48px 24px;">
                    <div style="font-weight: 700; color: var(--text-primary); font-size: 1.05rem;">Keine passenden Kundeneinträge gefunden</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Passen Sie Ihre Suche oder Filter an, oder erstellen Sie einen neuen Beleg.</div>
                    <button type="button" class="crm-action-btn primary" onclick="createNewInvoiceInGenerator()" style="margin-top: 14px;">
                        Neuer Beleg im Generator
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    let rowsHtml = "";
    filtered.forEach(client => {
        const isCompany = /\b(gmbh|ag|ug|kg|gbr|e\.k\.|stadt|gemeinde|verwaltung|immobilien|bau)\b/i.test(client.name);
        const parts = client.name.split(' ').filter(Boolean);
        const initials = isCompany ? "FA" : (parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]) : client.name.substring(0, 2)).toUpperCase();
        
        let badgeHtml = "";
        if (client.totalGross >= 1500) {
            badgeHtml = `<span class="crm-badge crm-badge-top">Top-Umsatz</span>`;
        } else if (client.invoices.length >= 2) {
            badgeHtml = `<span class="crm-badge crm-badge-stamm">Stammkunde</span>`;
        } else {
            badgeHtml = `<span class="crm-badge crm-badge-single">Einmalauftrag</span>`;
        }

        const addressDisplay = (client.street || client.zipCity) 
            ? `${escapeHtml(client.street)}${client.street && client.zipCity ? ' • ' : ''}${escapeHtml(client.zipCity)}`
            : '<span style="color: var(--text-muted); font-style: italic;">Keine Anschrift hinterlegt</span>';

        const isExpanded = openClientRows.has(client.key);

        rowsHtml += `
            <tr class="crm-row ${isExpanded ? 'highlight-row' : ''}">
                <td>
                    <div class="crm-client-cell">
                        <div class="crm-avatar ${isCompany ? 'company' : ''}">${initials}</div>
                        <div class="crm-client-meta">
                            <span class="crm-client-name" title="${escapeHtml(client.name)}">
                                ${escapeHtml(client.name)}
                            </span>
                            <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                                ${badgeHtml}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.4;">
                        ${addressDisplay}
                    </div>
                </td>
                <td style="text-align: center;">
                    <span class="crm-badge ${client.invoices.length > 1 ? 'crm-badge-active' : 'crm-badge-closed'}" style="font-size: 0.78rem;">
                        ${client.invoices.length} ${client.invoices.length === 1 ? 'Beleg' : 'Belege'}
                    </span>
                </td>
                <td>
                    <div style="font-size: 0.84rem; font-weight: 700; color: var(--text-primary);">
                        ${escapeHtml(client.lastInvoiceDate || '-')}
                    </div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(client.recentService)}">
                        ${escapeHtml(client.recentService)}
                    </div>
                </td>
                <td style="text-align: right;">
                    <div style="font-weight: 800; font-size: 0.95rem; color: #059669;">
                        ${formatCurrency(client.totalGross)}
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">
                        Netto: ${formatCurrency(client.totalNet)}
                    </div>
                </td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center; align-items: center; flex-wrap: wrap;">
                        <button type="button" class="crm-action-btn primary" onclick="createInvoiceForClient('${escapeHtml(client.name)}')" title="Neuen Beleg für diesen Kunden vorbereiten">
                            Beleg erstellen
                        </button>
                        <button type="button" class="crm-action-btn" onclick="toggleClientInvoicesRow('${client.key}')" title="Belege dieses Kunden einsehen">
                            ${isExpanded ? 'Schließen' : `Belege (${client.invoices.length})`}
                        </button>
                        <button type="button" class="crm-action-btn" onclick="deleteClient('${escapeHtml(client.name)}')" title="Kunden und alle zugehörigen Belege unwiderruflich löschen" style="color: #dc2626;">
                            Löschen
                        </button>
                    </div>
                </td>
            </tr>
        `;

        // Expandable Sub-Row showing client's invoices
        if (isExpanded) {
            let invSubRows = "";
            client.invoices.forEach(inv => {
                invSubRows += `
                    <tr>
                        <td style="font-weight: 700; color: var(--text-primary);">${escapeHtml(inv.docNumber)}</td>
                        <td>${escapeHtml(inv.docDate)}</td>
                        <td style="color: var(--text-secondary);">${escapeHtml((inv.items && inv.items[0]) ? inv.items[0].title : 'GalaBau')}</td>
                        <td style="text-align: right;">${formatCurrency(inv.totalNet)}</td>
                        <td style="text-align: right; color: #ea580c;">${formatCurrency(inv.totalTax)}</td>
                        <td style="text-align: right; font-weight: 700; color: #059669;">${formatCurrency(inv.totalGross)}</td>
                        <td style="text-align: center;">
                            <div style="display: flex; gap: 4px; justify-content: center;">
                                <button type="button" class="crm-action-btn" style="padding: 3px 8px; font-size: 0.7rem;" onclick="editInvoiceInGenerator('${inv.id}')" title="Im Generator öffnen">
                                    Bearbeiten
                                </button>
                                <button type="button" class="crm-action-btn" style="padding: 3px 8px; font-size: 0.7rem;" onclick="downloadInvoicePdfDirect('${inv.id}')" title="PDF Beleg drucken / herunterladen">
                                    PDF
                                </button>
                                <button type="button" class="crm-action-btn" style="padding: 3px 8px; font-size: 0.7rem; color: #dc2626;" onclick="deleteInvoiceFromArchive('${inv.id}')" title="Rechnung dauerhaft löschen">
                                    Löschen
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            rowsHtml += `
                <tr class="crm-sub-row">
                    <td colspan="6">
                        <div class="crm-sub-container">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary);">
                                    Abrechnungshistorie für ${escapeHtml(client.name)} (${client.invoices.length} Rechnungen)
                                </span>
                                <button type="button" class="crm-action-btn" style="padding: 3px 8px; font-size: 0.72rem;" onclick="showInvoicesForClient('${escapeHtml(client.name)}')">
                                    Im Rechnungsarchiv filtern →
                                </button>
                            </div>
                            <table class="crm-sub-table">
                                <thead>
                                    <tr>
                                        <th>Beleg-Nr.</th>
                                        <th>Datum</th>
                                        <th>Hauptleistung</th>
                                        <th style="text-align: right;">Netto</th>
                                        <th style="text-align: right;">19% USt</th>
                                        <th style="text-align: right;">Brutto</th>
                                        <th style="text-align: center;">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${invSubRows}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            `;
        }
    });

    tbody.innerHTML = rowsHtml;
};

window.exportClientsToCsv = function() {
    const archive = getInvoicesArchive();
    const clientsMap = {};
    archive.forEach(inv => {
        if (!inv.client || !inv.client.name) return;
        const key = inv.client.name.trim().toLowerCase();
        if (!clientsMap[key]) {
            clientsMap[key] = {
                name: inv.client.name.trim(),
                street: inv.client.street || "",
                zipCity: inv.client.zipCity || "",
                invoicesCount: 0,
                totalGross: 0,
                totalNet: 0,
                lastDate: inv.docDate
            };
        }
        clientsMap[key].invoicesCount++;
        clientsMap[key].totalGross += (parseFloat(inv.totalGross) || 0);
        clientsMap[key].totalNet += (parseFloat(inv.totalNet) || 0);
    });

    const rows = [
        ["Kunde / Firma", "Strasse", "PLZ / Ort", "Anzahl Belege", "Umsatz Netto", "Umsatz Brutto", "Letzter Beleg"]
    ];

    Object.values(clientsMap).forEach(c => {
        rows.push([
            `"${c.name.replace(/"/g, '""')}"`,
            `"${c.street.replace(/"/g, '""')}"`,
            `"${c.zipCity.replace(/"/g, '""')}"`,
            c.invoicesCount,
            c.totalNet.toFixed(2),
            c.totalGross.toFixed(2),
            `"${c.lastDate || ''}"`
        ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Palnau_Kundenstamm_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Kundenstamm als CSV exportiert!");
};

window.createInvoiceForClient = function(clientName) {
    const archive = getInvoicesArchive();
    const inv = archive.find(i => i.client && i.client.name === clientName);
    createNewInvoiceInGenerator();
    if (inv && inv.client) {
        appState.client = {
            name: inv.client.name,
            street: inv.client.street || "",
            zipCity: inv.client.zipCity || ""
        };
        saveState();
        renderAll();
    }
    showToast(`Rechnungsformular für "${clientName}" vorbereitet.`);
};

window.showInvoicesForClient = function(clientName) {
    switchAppView('overview');
    const searchInput = document.getElementById('overview-search-input');
    if (searchInput) searchInput.value = clientName;
    handleOverviewSearch(clientName);
};

// ==========================================================================
// FINANZ-QUARTALE & UST-BERICHT (DATEV/BWA TABLE) CONTROLLER
// Quarterly breakdowns, VAT liabilities and year/quarter aggregations
// ==========================================================================

// ==========================================================================
// APP 5: FINANZ-DASHBOARD, POWER BI CONTROLLING & MONATSRECHNUNG
// ==========================================================================
let finActiveSubTab = 'dashboard'; // 'dashboard' | 'monthly' | 'quarters'
let finSelectedMonth = 'all'; // 'all' | '01' | '02' ... '12'
let quartersSelectedYear = 2026;
const openQuarterRows = new Set();

const GERMAN_MONTH_NAMES = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
];
const GERMAN_MONTH_SHORT = [
    "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
    "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"
];

window.switchFinSubTab = function(tab) {
    finActiveSubTab = tab;
    const btnDash = document.getElementById('btn-fin-tab-dashboard');
    const btnMonth = document.getElementById('btn-fin-tab-monthly');
    const btnQuart = document.getElementById('btn-fin-tab-quarters');

    const viewDash = document.getElementById('fin-tab-view-dashboard');
    const viewMonth = document.getElementById('fin-tab-view-monthly');
    const viewQuart = document.getElementById('fin-tab-view-quarters');

    if (btnDash) btnDash.classList.toggle('active', tab === 'dashboard');
    if (btnMonth) btnMonth.classList.toggle('active', tab === 'monthly');
    if (btnQuart) btnQuart.classList.toggle('active', tab === 'quarters');

    if (viewDash) viewDash.style.display = tab === 'dashboard' ? 'block' : 'none';
    if (viewMonth) viewMonth.style.display = tab === 'monthly' ? 'block' : 'none';
    if (viewQuart) viewQuart.style.display = tab === 'quarters' ? 'block' : 'none';

    const hTitle = document.getElementById('fin-header-title');
    const hSub = document.getElementById('fin-header-subtitle');
    if (hTitle && hSub) {
        if (tab === 'dashboard') {
            hTitle.textContent = "Finanz-Dashboard & Power BI Controlling";
            hSub.textContent = "Visuelle Monatsanalysen • Säulendiagramme & KPIs • Palnau Gartenbau GmbH";
        } else if (tab === 'monthly') {
            hTitle.textContent = "Monats-Rechnung & Beleg-Journal";
            hSub.textContent = "Vollständige Monatsabrechnung aller Ausgangsrechnungen • Druckfertiger Abrechnungsbogen";
        } else {
            hTitle.textContent = "Finanz-Quartale & USt-Voranmeldung";
            hSub.textContent = "Fiskalisches Buchungsjournal nach UStG • Finanzamt Pforzheim (St.-Nr.: 41413-45017) • 19% Regelbesteuerung";
        }
    }

    renderQuartersView();
};

window.setFinMonthFilter = function(month, btn) {
    finSelectedMonth = month;
    const pills = document.querySelectorAll('#fin-month-pills .neu-filter-pill');
    pills.forEach(p => {
        const oc = p.getAttribute('onclick') || '';
        p.classList.toggle('active', oc.includes(`'${month}'`));
    });
    renderQuartersView();
};

window.setQuartersYearFilter = function(year, btn) {
    quartersSelectedYear = year;
    const pills = document.querySelectorAll('#quarters-year-pills .neu-filter-pill');
    pills.forEach(p => {
        const oc = p.getAttribute('onclick') || '';
        p.classList.toggle('active', oc.includes(`'${year}'`) || (year === 2026 && oc.includes('2026')));
    });
    renderQuartersView();
};

window.toggleQuarterInvoicesRow = function(qIdx) {
    if (openQuarterRows.has(qIdx)) {
        openQuarterRows.delete(qIdx);
    } else {
        openQuarterRows.add(qIdx);
    }
    renderQuartersView();
};

function getFilteredFinInvoices() {
    const archive = getInvoicesArchive();
    let invoices = archive.filter(inv => inv.docType !== 'angebot');

    if (quartersSelectedYear !== 'all') {
        const targetYear = parseInt(quartersSelectedYear, 10);
        invoices = invoices.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === targetYear;
        });
    }

    if (finSelectedMonth !== 'all') {
        const targetMonthIdx = parseInt(finSelectedMonth, 10) - 1;
        invoices = invoices.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getMonth() === targetMonthIdx;
        });
    }

    return invoices;
}

window.toggleInvoicePaymentStatus = function(invId) {
    if (typeof toggleInvoicePaidStatus === 'function') {
        toggleInvoicePaidStatus(invId);
    }
};

// ==========================================================================
// RENDER SUBVIEW 1: POWER BI DASHBOARD (WITH AUSGABEN VERRECHNUNG & ERGEBNIS)
// ==========================================================================
function renderPowerBiDashboard() {
    const archive = getInvoicesArchive();
    const actualInvoices = archive.filter(inv => inv.docType !== 'angebot');

    const curYear = (quartersSelectedYear === 'all') ? 2026 : parseInt(quartersSelectedYear, 10);

    // Year-filtered for annual calculations and chart
    const yearFiltered = (quartersSelectedYear === 'all')
        ? actualInvoices
        : actualInvoices.filter(inv => parseGermanDate(inv.docDate).getFullYear() === parseInt(quartersSelectedYear, 10));

    // Fully filtered for selected month & year
    const filteredInvoices = getFilteredFinInvoices();

    // 1. Compute Revenue (Einnahmen)
    const sumGross = filteredInvoices.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);
    const sumNet = filteredInvoices.reduce((s, inv) => s + (parseFloat(inv.totalNet) || 0), 0);
    const sumTax = filteredInvoices.reduce((s, inv) => s + (parseFloat(inv.totalTax) || 0), 0);
    const countInvoices = filteredInvoices.length;

    // Unique clients in period
    const uniqueClients = new Set();
    filteredInvoices.forEach(inv => {
        if (inv.client && inv.client.name) uniqueClients.add(inv.client.name.trim());
    });

    // Average ticket
    const avgNet = countInvoices > 0 ? (sumNet / countInvoices) : 0;
    const avgGross = countInvoices > 0 ? (sumGross / countInvoices) : 0;

    // Payment / Cashflow status
    const paidInvoices = filteredInvoices.filter(i => {
        const st = (i.paymentStatus || i.status || '').toLowerCase();
        return st === 'bezahlt';
    });
    const paidGross = paidInvoices.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);
    const openGross = sumGross - paidGross;
    const paidRatePct = sumGross > 0 ? Math.round((paidGross / sumGross) * 100) : 100;

    // 2. Compute Expenses (Betriebsausgaben & Monatsabweichungen)
    let periodExpenses = {
        totalGross: 0,
        totalNet: 0,
        estimatedVat: 0,
        recurringTotal: 0,
        deviationsTotal: 0,
        recurringList: [],
        deviationsList: [],
        categoryBreakdown: {}
    };

    if (typeof getExpensesForMonth === 'function') {
        if (finSelectedMonth !== 'all') {
            periodExpenses = getExpensesForMonth(curYear, finSelectedMonth);
        } else {
            if (typeof getExpensesForYear === 'function') {
                const yExp = getExpensesForYear(curYear);
                periodExpenses.totalGross = yExp.totalGross;
                periodExpenses.totalNet = yExp.totalNet;
                periodExpenses.estimatedVat = yExp.totalVat;
                periodExpenses.recurringTotal = yExp.totalRecurring;
                periodExpenses.deviationsTotal = yExp.totalDeviations;
                periodExpenses.categoryBreakdown = yExp.categoryBreakdown;
                periodExpenses.deviationsList = yExp.allDeviations;
            }
        }
    }

    const expensesGross = periodExpenses.totalGross || 0;
    const expensesNet = periodExpenses.totalNet || 0;
    const expensesVat = periodExpenses.estimatedVat || 0;

    // Net Result (Betriebsergebnis: Einnahmen minus Ausgaben)
    const netProfit = sumGross - expensesGross;
    const coverageRatePct = expensesGross > 0 ? Math.round((sumGross / expensesGross) * 100) : (sumGross > 0 ? 100 : 0);

    // --------------------------------------------------------------------------
    // VORMONATS-VERGLEICH & TREND-PFEILE (Veränderung Einnahmen & Ausgaben)
    // --------------------------------------------------------------------------
    let prevPeriodLabel = 'VM';
    let prevGross = 0;
    let prevExpenses = 0;

    if (finSelectedMonth !== 'all') {
        const m = parseInt(finSelectedMonth, 10);
        const prevM = m > 1 ? (m - 1) : 12;
        const prevY = m > 1 ? curYear : (curYear - 1);
        const prevMKey = String(prevM).padStart(2, '0');
        const prevMonthName = GERMAN_MONTH_SHORT[prevM - 1];
        prevPeriodLabel = prevMonthName;

        const prevInvoices = actualInvoices.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === prevY && (d.getMonth() + 1) === prevM;
        });
        prevGross = prevInvoices.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);

        if (typeof getExpensesForMonth === 'function') {
            const pExp = getExpensesForMonth(prevY, prevMKey);
            prevExpenses = pExp.totalGross || 0;
        }
    } else {
        prevPeriodLabel = `VJ ${curYear - 1}`;
        const prevInvoices = actualInvoices.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === (curYear - 1);
        });
        prevGross = prevInvoices.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);

        if (typeof getExpensesForYear === 'function') {
            const pExp = getExpensesForYear(curYear - 1);
            prevExpenses = pExp.totalGross || 0;
        }
    }

    // Trend Einnahmen
    const incomeDiff = sumGross - prevGross;
    let incomeTrendText = '';
    let incomeTrendClass = 'neutral';
    if (prevGross > 0) {
        const pct = Math.round((Math.abs(incomeDiff) / prevGross) * 100);
        if (incomeDiff > 0) {
            incomeTrendText = `▲ +${pct}% ggü. ${prevPeriodLabel}`;
            incomeTrendClass = 'up';
        } else if (incomeDiff < 0) {
            incomeTrendText = `▼ -${pct}% ggü. ${prevPeriodLabel}`;
            incomeTrendClass = 'down';
        } else {
            incomeTrendText = `● ±0% ggü. ${prevPeriodLabel}`;
            incomeTrendClass = 'neutral';
        }
    } else if (sumGross > 0) {
        incomeTrendText = `▲ +${formatCurrency(sumGross)} (Neu)`;
        incomeTrendClass = 'up';
    } else {
        incomeTrendText = `● 0,00 €`;
        incomeTrendClass = 'neutral';
    }

    // Trend Ausgaben
    const expDiff = expensesGross - prevExpenses;
    let expTrendText = '';
    let expTrendClass = 'neutral';
    if (prevExpenses > 0) {
        const pct = Math.round((Math.abs(expDiff) / prevExpenses) * 100);
        if (expDiff > 0) {
            expTrendText = `▲ +${pct}% ggü. ${prevPeriodLabel}`;
            expTrendClass = 'down'; // Höhere Ausgaben -> Rot/Warnung
        } else if (expDiff < 0) {
            expTrendText = `▼ -${pct}% ggü. ${prevPeriodLabel}`;
            expTrendClass = 'up'; // Geringere Ausgaben -> Grün/Ersparnis
        } else {
            expTrendText = `● ±0% ggü. ${prevPeriodLabel}`;
            expTrendClass = 'neutral';
        }
    } else if (expensesGross > 0) {
        expTrendText = `▲ +${formatCurrency(expensesGross)}`;
        expTrendClass = 'down';
    } else {
        expTrendText = `● 0,00 €`;
        expTrendClass = 'neutral';
    }

    // Populate KPI Cards
    const elGrossTitle = document.getElementById('pbi-kpi-gross-title');
    const elGrossVal = document.getElementById('pbi-kpi-gross-val');
    const elGrossSub = document.getElementById('pbi-kpi-gross-sub');
    const elTrendGross = document.getElementById('pbi-trend-gross');
    const elMeterGross = document.getElementById('pbi-meter-gross');

    if (elGrossTitle) elGrossTitle.textContent = finSelectedMonth !== 'all' ? `Einnahmen (${GERMAN_MONTH_SHORT[parseInt(finSelectedMonth, 10) - 1]})` : 'Jahreseinnahmen (Brutto)';
    if (elGrossVal) elGrossVal.textContent = formatCurrency(sumGross);
    if (elGrossSub) {
        if (finSelectedMonth !== 'all') {
            const diffSign = incomeDiff >= 0 ? '+' : '';
            elGrossSub.textContent = `Vormonat: ${formatCurrency(prevGross)} (${diffSign}${formatCurrency(incomeDiff)})`;
        } else {
            elGrossSub.textContent = `Gesamtvolumen Ausgangsrechnungen`;
        }
    }
    if (elTrendGross) {
        elTrendGross.textContent = incomeTrendText;
        elTrendGross.className = `pbi-trend-badge ${incomeTrendClass}`;
        elTrendGross.title = `Vormonat (${prevPeriodLabel}): ${formatCurrency(prevGross)} | Veränderung: ${incomeDiff >= 0 ? '+' : ''}${formatCurrency(incomeDiff)}`;
    }

    // KPI 2: Betriebsausgaben
    const elExpVal = document.getElementById('pbi-kpi-expenses-val');
    const elExpSub = document.getElementById('pbi-kpi-expenses-sub');
    const elExpTitle = document.getElementById('pbi-kpi-expenses-title');
    const elTrendExp = document.getElementById('pbi-trend-expenses');
    const elMeterExp = document.getElementById('pbi-meter-expenses');

    if (elExpTitle) elExpTitle.textContent = finSelectedMonth !== 'all' ? `Ausgaben (${GERMAN_MONTH_SHORT[parseInt(finSelectedMonth, 10) - 1]})` : 'Jahresausgaben (Kosten)';
    if (elExpVal) elExpVal.textContent = formatCurrency(expensesGross);
    if (elExpSub) {
        if (finSelectedMonth !== 'all') {
            const diffSign = expDiff >= 0 ? '+' : '';
            elExpSub.textContent = `Vormonat: ${formatCurrency(prevExpenses)} (${diffSign}${formatCurrency(expDiff)})`;
        } else {
            elExpSub.textContent = `Fix: ${formatCurrency(periodExpenses.recurringTotal)} + Sonder: ${formatCurrency(periodExpenses.deviationsTotal)}`;
        }
    }
    if (elTrendExp) {
        elTrendExp.textContent = expTrendText;
        elTrendExp.className = `pbi-trend-badge ${expTrendClass}`;
        elTrendExp.removeAttribute('style');
        elTrendExp.title = `Vormonat (${prevPeriodLabel}): ${formatCurrency(prevExpenses)} | Veränderung: ${expDiff >= 0 ? '+' : ''}${formatCurrency(expDiff)}`;
    }
    if (elMeterExp) {
        const expMeterPct = Math.min(100, Math.max(10, Math.round((expensesGross / (sumGross || expensesGross || 1)) * 100)));
        elMeterExp.style.width = `${expMeterPct}%`;
    }

    // KPI 3: Betriebsergebnis (Saldo)
    const elNetVal = document.getElementById('pbi-kpi-net-val');
    const elNetSub = document.getElementById('pbi-kpi-net-sub');
    const elTrendNet = document.getElementById('pbi-trend-net');
    const elMeterNet = document.getElementById('pbi-meter-net');

    const prevNetProfit = prevGross - prevExpenses;
    const netDiff = netProfit - prevNetProfit;

    if (elNetVal) {
        const sign = netProfit > 0 ? '+' : '';
        elNetVal.textContent = `${sign}${formatCurrency(netProfit)}`;
        elNetVal.style.color = netProfit >= 0 ? '#059669' : '#dc2626';
    }
    if (elNetSub) {
        if (finSelectedMonth !== 'all') {
            const diffSign = netDiff >= 0 ? '+' : '';
            elNetSub.textContent = `Vormonat: ${formatCurrency(prevNetProfit)} (${diffSign}${formatCurrency(netDiff)})`;
        } else {
            elNetSub.textContent = netProfit >= 0 
                ? `Überschuss nach allen Ausgaben` 
                : `Defizit / Unterdeckung im Zeitraum`;
        }
    }
    if (elTrendNet) {
        let netTrendText = '';
        let netTrendClass = netProfit >= 0 ? 'up' : 'down';
        if (netDiff > 0) {
            netTrendText = `▲ +${formatCurrency(netDiff)} ggü. ${prevPeriodLabel}`;
            netTrendClass = 'up';
        } else if (netDiff < 0) {
            netTrendText = `▼ -${formatCurrency(Math.abs(netDiff))} ggü. ${prevPeriodLabel}`;
            netTrendClass = 'down';
        } else {
            netTrendText = netProfit >= 0 ? '▲ Überschuss' : '▼ Defizit';
        }
        elTrendNet.textContent = netTrendText;
        elTrendNet.className = `pbi-trend-badge ${netTrendClass}`;
        elTrendNet.title = `Vormonat (${prevPeriodLabel}): ${formatCurrency(prevNetProfit)} | Saldo-Veränderung: ${netDiff >= 0 ? '+' : ''}${formatCurrency(netDiff)}`;
    }
    if (elMeterNet) {
        elMeterNet.style.background = netProfit >= 0 ? '#10b981' : '#ef4444';
        elMeterNet.style.width = netProfit >= 0 ? '100%' : '35%';
    }

    // KPI 4: 19% USt-Zahllast nach Vorsteuer
    const elTaxVal = document.getElementById('pbi-kpi-tax-val');
    const elTaxSub = document.getElementById('pbi-kpi-tax-sub');
    if (elTaxVal) {
        const netTaxPayable = Math.max(0, sumTax - expensesVat);
        elTaxVal.textContent = formatCurrency(netTaxPayable);
    }
    if (elTaxSub) {
        elTaxSub.textContent = expensesVat > 0 
            ? `USt ${formatCurrency(sumTax)} abzgl. ${formatCurrency(expensesVat)} Vorsteuer`
            : `Zahllast an Finanzamt Pforzheim`;
    }

    // KPI 5: Kostendeckung & Quote
    const elPaidVal = document.getElementById('pbi-kpi-paid-val');
    const elPaidSub = document.getElementById('pbi-kpi-paid-sub');
    const elPaidRate = document.getElementById('pbi-kpi-paid-rate');
    const elMeterPaid = document.getElementById('pbi-meter-paid');

    if (elPaidVal) elPaidVal.textContent = `${coverageRatePct}%`;
    if (elPaidSub) elPaidSub.textContent = `${formatCurrency(paidGross)} vereinnahmt (von ${formatCurrency(sumGross)})`;
    if (elPaidRate) {
        elPaidRate.textContent = coverageRatePct >= 100 ? `${coverageRatePct}% gedeckt` : `${coverageRatePct}% Unterdeckung`;
        elPaidRate.className = `pbi-trend-badge ${coverageRatePct >= 100 ? 'up' : 'down'}`;
    }
    if (elMeterPaid) elMeterPaid.style.width = `${Math.min(100, coverageRatePct)}%`;

    // KPI 6: Belege & Kunden
    const elInvoicesVal = document.getElementById('pbi-kpi-invoices-val');
    const elInvoicesSub = document.getElementById('pbi-kpi-invoices-sub');
    const elClientCount = document.getElementById('pbi-kpi-client-count');

    if (elInvoicesVal) elInvoicesVal.textContent = `${countInvoices} Beleg${countInvoices === 1 ? '' : 'e'}`;
    if (elInvoicesSub) elInvoicesSub.textContent = `Ø ${formatCurrency(avgNet)} Netto / Auftrag`;
    if (elClientCount) elClientCount.textContent = `${uniqueClients.size} Kunde${uniqueClients.size === 1 ? '' : 'n'}`;

    // Update Year Label in chart header
    const chartYearLabel = document.getElementById('pbi-chart-year-label');
    if (chartYearLabel) chartYearLabel.textContent = String(curYear);

    // 2. VISUAL 1: 12-MONTH POWER BI COLUMN CHART (EINNAHMEN VS. AUSGABEN)
    const chartContainer = document.getElementById('pbi-bar-chart-container');
    if (chartContainer) {
        const monthlyStats = [];
        let maxBarVal = 1000;

        for (let m = 0; m < 12; m++) {
            const mKey = String(m + 1).padStart(2, '0');
            const mInvoices = yearFiltered.filter(inv => {
                const d = parseGermanDate(inv.docDate);
                return d.getMonth() === m;
            });
            const mNet = mInvoices.reduce((s, inv) => s + (parseFloat(inv.totalNet) || 0), 0);
            const mGross = mInvoices.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);

            let mExp = { totalGross: 0, totalNet: 0, recurringTotal: 0, deviationsTotal: 0 };
            if (typeof getExpensesForMonth === 'function') {
                mExp = getExpensesForMonth(curYear, mKey);
            }

            const mExpGross = mExp.totalGross || 0;
            if (mGross > maxBarVal) maxBarVal = mGross;
            if (mExpGross > maxBarVal) maxBarVal = mExpGross;

            monthlyStats.push({
                monthIdx: m,
                key: mKey,
                shortName: GERMAN_MONTH_SHORT[m],
                fullName: GERMAN_MONTH_NAMES[m],
                count: mInvoices.length,
                net: mNet,
                gross: mGross,
                expGross: mExpGross,
                balance: mGross - mExpGross
            });
        }

        let chartHtml = '';
        monthlyStats.forEach(stat => {
            const isSelected = (finSelectedMonth === stat.key);
            const incomeHeightPct = maxBarVal > 0 ? Math.round((stat.gross / maxBarVal) * 100) : 0;
            const expHeightPct = maxBarVal > 0 ? Math.round((stat.expGross / maxBarVal) * 100) : 0;

            const balSign = stat.balance >= 0 ? '+' : '';
            const balLabel = stat.balance >= 0 ? 'Überschuss' : 'Defizit';
            const tooltipText = `${stat.fullName} ${curYear}: \nEinnahmen: ${formatCurrency(stat.gross)} \nAusgaben: ${formatCurrency(stat.expGross)} \nErgebnis: ${balSign}${formatCurrency(stat.balance)} (${balLabel})`;

            chartHtml += `
                <div class="pbi-chart-col-group ${isSelected ? 'active' : ''}" onclick="setFinMonthFilter('${isSelected ? 'all' : stat.key}')" title="${escapeHtml(tooltipText)}">
                    <div class="pbi-col-bars-pair">
                        <div class="pbi-col-bar-income" style="height: ${Math.max(3, incomeHeightPct)}%;" title="Einnahmen: ${formatCurrency(stat.gross)}"></div>
                        <div class="pbi-col-bar-expenses" style="height: ${Math.max(3, expHeightPct)}%;" title="Ausgaben: ${formatCurrency(stat.expGross)}"></div>
                    </div>
                    <span class="pbi-col-label">${stat.shortName}</span>
                </div>
            `;
        });
        chartContainer.innerHTML = chartHtml;
    }

    // 3. VISUAL 2: CASHFLOW & PAYMENT STATUS BREAKDOWN
    const stackBar = document.getElementById('pbi-status-stack-bar');
    const statusList = document.getElementById('pbi-status-list-container');
    const cashPeriodBadge = document.getElementById('pbi-cashflow-period-badge');

    if (cashPeriodBadge) {
        cashPeriodBadge.textContent = finSelectedMonth !== 'all' 
            ? `${GERMAN_MONTH_NAMES[parseInt(finSelectedMonth, 10) - 1]} ${quartersSelectedYear !== 'all' ? quartersSelectedYear : ''}` 
            : `Gesamtjahr ${quartersSelectedYear}`;
    }

    if (stackBar && statusList) {
        let paidSum = 0;
        let paidCount = 0;
        let openSum = 0;
        let openCount = 0;
        let overdueSum = 0;
        let overdueCount = 0;

        const now = new Date();
        filteredInvoices.forEach(inv => {
            const gr = parseFloat(inv.totalGross) || 0;
            const st = (inv.paymentStatus || inv.status || '').toLowerCase();
            if (st === 'bezahlt') {
                paidSum += gr;
                paidCount++;
            } else {
                const docD = parseGermanDate(inv.docDate);
                const diffDays = Math.floor((now - docD) / (1000 * 60 * 60 * 24));
                if (diffDays > 14) {
                    overdueSum += gr;
                    overdueCount++;
                } else {
                    openSum += gr;
                    openCount++;
                }
            }
        });

        const totalStack = (paidSum + openSum + overdueSum) || 1;
        const paidPct = Math.round((paidSum / totalStack) * 100);
        const openPct = Math.round((openSum / totalStack) * 100);
        const overduePct = Math.max(0, 100 - paidPct - openPct);

        stackBar.innerHTML = `
            <div class="pbi-status-stack-seg" style="width: ${paidPct}%; background: #10b981;" title="Bezahlt: ${formatCurrency(paidSum)} (${paidPct}%)"></div>
            <div class="pbi-status-stack-seg" style="width: ${openPct}%; background: #38bdf8;" title="Im Zahlungsziel: ${formatCurrency(openSum)} (${openPct}%)"></div>
            <div class="pbi-status-stack-seg" style="width: ${overduePct}%; background: #ef4444;" title="Überfällig: ${formatCurrency(overdueSum)} (${overduePct}%)"></div>
        `;

        statusList.innerHTML = `
            <div class="pbi-status-row">
                <div class="pbi-status-info">
                    <span class="pbi-status-dot" style="background: #10b981;"></span>
                    <div>
                        <div class="pbi-status-name">Vollständig bezahlt & vereinnahmt</div>
                        <div class="pbi-status-pct">${paidCount} Beleg${paidCount === 1 ? '' : 'e'}</div>
                    </div>
                </div>
                <div class="pbi-status-amounts">
                    <div class="pbi-status-val" style="color: #059669;">${formatCurrency(paidSum)}</div>
                    <div class="pbi-status-pct">${paidPct}% vom Volumen</div>
                </div>
            </div>

            <div class="pbi-status-row">
                <div class="pbi-status-info">
                    <span class="pbi-status-dot" style="background: #38bdf8;"></span>
                    <div>
                        <div class="pbi-status-name">Offen (im regulären Zahlungsziel)</div>
                        <div class="pbi-status-pct">${openCount} Beleg${openCount === 1 ? '' : 'e'}</div>
                    </div>
                </div>
                <div class="pbi-status-amounts">
                    <div class="pbi-status-val" style="color: #0284c7;">${formatCurrency(openSum)}</div>
                    <div class="pbi-status-pct">${openPct}% vom Volumen</div>
                </div>
            </div>

            <div class="pbi-status-row">
                <div class="pbi-status-info">
                    <span class="pbi-status-dot" style="background: #ef4444;"></span>
                    <div>
                        <div class="pbi-status-name">Überfällig / Mahnwesen</div>
                        <div class="pbi-status-pct">${overdueCount} Beleg${overdueCount === 1 ? '' : 'e'}</div>
                    </div>
                </div>
                <div class="pbi-status-amounts">
                    <div class="pbi-status-val" style="color: #dc2626;">${formatCurrency(overdueSum)}</div>
                    <div class="pbi-status-pct">${overduePct}% vom Volumen</div>
                </div>
            </div>
        `;
    }

    // 4. VISUAL 3: TOP CLIENTS RANKING
    const topClientsContainer = document.getElementById('pbi-top-clients-container');
    if (topClientsContainer) {
        const clientRevenueMap = {};
        filteredInvoices.forEach(inv => {
            const name = (inv.client && inv.client.name) ? inv.client.name.trim() : "Unbekannter Kunde";
            if (!clientRevenueMap[name]) {
                clientRevenueMap[name] = { name: name, count: 0, gross: 0, net: 0 };
            }
            clientRevenueMap[name].count++;
            clientRevenueMap[name].gross += (parseFloat(inv.totalGross) || 0);
            clientRevenueMap[name].net += (parseFloat(inv.totalNet) || 0);
        });

        const sortedClients = Object.values(clientRevenueMap).sort((a, b) => b.gross - a.gross).slice(0, 5);
        const topClientMax = sortedClients.length > 0 ? sortedClients[0].gross : 1;

        if (sortedClients.length === 0) {
            topClientsContainer.innerHTML = `
                <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 0.85rem;">
                    Keine Umsätze für diesen Zeitraum erfasst.
                </div>
            `;
        } else {
            let clientRowsHtml = '';
            sortedClients.forEach((cl, idx) => {
                const widthPct = Math.round((cl.gross / topClientMax) * 100);
                const sharePct = sumGross > 0 ? Math.round((cl.gross / sumGross) * 100) : 0;
                clientRowsHtml += `
                    <div class="pbi-rank-item">
                        <div class="pbi-rank-num">#${idx + 1}</div>
                        <div class="pbi-rank-content">
                            <div class="pbi-rank-top-line">
                                <span class="pbi-rank-name">${escapeHtml(cl.name)}</span>
                                <span class="pbi-rank-amount">${formatCurrency(cl.gross)} <span style="font-weight: 500; font-size: 0.72rem; color: #64748b;">(${sharePct}%)</span></span>
                            </div>
                            <div class="pbi-rank-bar-bg">
                                <div class="pbi-rank-bar-fill" style="width: ${widthPct}%;"></div>
                            </div>
                        </div>
                    </div>
                `;
            });
            topClientsContainer.innerHTML = clientRowsHtml;
        }
    }

    // 5. VISUAL 4: LEISTUNGS- & GEWERKEVERTEILUNG (BWA)
    const catContainer = document.getElementById('pbi-categories-container');
    if (catContainer) {
        const catMap = {
            "Garten- & Gehölzpflege": { total: 0, count: 0, icon: "🌿" },
            "Pflaster- & Wegebau": { total: 0, count: 0, icon: "🧱" },
            "Rollrasen & Begrünung": { total: 0, count: 0, icon: "🌱" },
            "Baumfällung & Häckseln": { total: 0, count: 0, icon: "🌲" },
            "Erd- & Baggerarbeiten": { total: 0, count: 0, icon: "🚜" },
            "Winterdienst & Weiteres": { total: 0, count: 0, icon: "❄️" }
        };

        filteredInvoices.forEach(inv => {
            const items = inv.items || [];
            items.forEach(it => {
                const title = (it.title || "").toLowerCase();
                const total = parseFloat(it.total) || 0;
                if (title.includes('hecke') || title.includes('strauch') || title.includes('pflege') || title.includes('beet') || title.includes('schnitt')) {
                    catMap["Garten- & Gehölzpflege"].total += total;
                    catMap["Garten- & Gehölzpflege"].count++;
                } else if (title.includes('pflaster') || title.includes('stein') || title.includes('terrasse') || title.includes('weg') || title.includes('bord')) {
                    catMap["Pflaster- & Wegebau"].total += total;
                    catMap["Pflaster- & Wegebau"].count++;
                } else if (title.includes('rasen') || title.includes('rollrasen') || title.includes('saat') || title.includes('einsaat')) {
                    catMap["Rollrasen & Begrünung"].total += total;
                    catMap["Rollrasen & Begrünung"].count++;
                } else if (title.includes('baum') || title.includes('fällung') || title.includes('skt') || title.includes('häcksel') || title.includes('wurzel')) {
                    catMap["Baumfällung & Häckseln"].total += total;
                    catMap["Baumfällung & Häckseln"].count++;
                } else if (title.includes('bagger') || title.includes('erd') || title.includes('aushub') || title.includes('boden') || title.includes('kies')) {
                    catMap["Erd- & Baggerarbeiten"].total += total;
                    catMap["Erd- & Baggerarbeiten"].count++;
                } else {
                    catMap["Winterdienst & Weiteres"].total += total;
                    catMap["Winterdienst & Weiteres"].count++;
                }
            });
        });

        let catHtml = '';
        Object.entries(catMap).forEach(([catName, data]) => {
            catHtml += `
                <div class="pbi-cat-box">
                    <div class="pbi-cat-title">${data.icon} ${escapeHtml(catName)}</div>
                    <div class="pbi-cat-amount">${formatCurrency(data.total)}</div>
                    <div class="pbi-cat-sub">${data.count} Position${data.count === 1 ? '' : 'en'}</div>
                </div>
            `;
        });
        catContainer.innerHTML = catHtml;
    }

    // 6. VISUAL 5: MONATLICHE BETRIEBSAUSGABEN & KOSTENBLÖCKE
    const expContainer = document.getElementById('pbi-expenses-content-container');
    const expPeriodBadge = document.getElementById('pbi-expenses-period-badge');
    const expTitle = document.getElementById('pbi-expenses-visual-title');

    const curPeriodName = (finSelectedMonth !== 'all') 
        ? `${GERMAN_MONTH_NAMES[parseInt(finSelectedMonth, 10) - 1]} ${curYear}` 
        : `Gesamtjahr ${curYear}`;

    if (expPeriodBadge) expPeriodBadge.textContent = curPeriodName;
    if (expTitle) expTitle.textContent = `Monatliche Betriebsausgaben & Verrechnung (${curPeriodName})`;

    if (expContainer) {
        const catBreakdown = periodExpenses.categoryBreakdown || {};
        const devList = periodExpenses.deviationsList || [];
        const maxCat = Math.max(...Object.values(catBreakdown), 100);

        let catBarsHtml = '';
        Object.entries(catBreakdown).forEach(([cat, val]) => {
            const pct = Math.round((val / maxCat) * 100);
            const share = expensesGross > 0 ? Math.round((val / expensesGross) * 100) : 0;
            catBarsHtml += `
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; color: #334155; margin-bottom: 2px;">
                        <span>${escapeHtml(cat)}</span>
                        <span>${formatCurrency(val)} <span style="font-weight: 500; font-size: 0.72rem; color: #94a3b8;">(${share}%)</span></span>
                    </div>
                    <div style="height: 6px; background: #f1f5f9; border-radius: 9999px; overflow: hidden;">
                        <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, #f43f5e, #be123c); border-radius: 9999px;"></div>
                    </div>
                </div>
            `;
        });

        let devBadgesHtml = '';
        if (devList.length === 0) {
            devBadgesHtml = `<span style="font-size: 0.78rem; color: #94a3b8; font-style: italic;">Keine spezifischen Sonderausgaben / Abweichungen für diesen Zeitraum erfasst.</span>`;
        } else {
            devList.forEach(dev => {
                devBadgesHtml += `
                    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; margin: 4px;">
                        <span style="font-weight: 800; color: #be123c; font-size: 0.78rem;">${escapeHtml(dev.title)}</span>
                        <strong style="color: #9f1239; font-size: 0.8rem;">${formatCurrency(dev.amount)}</strong>
                        <span style="font-size: 0.68rem; color: #64748b;">(${dev.date || dev.monthKey})</span>
                    </div>
                `;
            });
        }

        expContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; padding: 16px 20px;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 0.76rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Kosten nach Kategorien</span>
                        <strong style="font-size: 0.95rem; color: #e11d48;">Gesamt: ${formatCurrency(expensesGross)}</strong>
                    </div>
                    ${catBarsHtml || '<div style="color: #94a3b8; font-size: 0.8rem;">Keine Ausgabendaten verfügbar</div>'}
                </div>

                <div style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.76rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Sonderausgaben & Monatsabweichungen (${devList.length})</span>
                            <span style="font-size: 0.75rem; font-weight: 700; color: #be123c;">${formatCurrency(periodExpenses.deviationsTotal)}</span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 16px;">
                            ${devBadgesHtml}
                        </div>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="display: block; font-size: 0.82rem; color: #0f172a;">Laufende Fixkosten-Basis:</strong>
                            <span style="font-size: 0.74rem; color: #64748b;">Miete, Löhne, Fuhrpark, Beratung & Versicherungen</span>
                        </div>
                        <strong style="font-size: 0.95rem; color: #0284c7;">${formatCurrency(periodExpenses.recurringTotal)} / Mo.</strong>
                    </div>
                </div>
            </div>
        `;
    }
}

// ==========================================================================
// RENDER SUBVIEW 2: MONATS-RECHNUNG & BELEGJOURNAL
// ==========================================================================
function renderMonthlyFinancesView() {
    const tbody = document.getElementById('fin-monthly-table-body');
    const tfoot = document.getElementById('fin-monthly-table-footer');
    if (!tbody) return;

    const filteredInvoices = getFilteredFinInvoices();

    // Sort descending by date
    const sorted = [...filteredInvoices].sort((a, b) => {
        const da = a.dateIso || a.docDate || '';
        const db = b.dateIso || b.docDate || '';
        return db.localeCompare(da);
    });

    const sumNet = sorted.reduce((s, inv) => s + (parseFloat(inv.totalNet) || 0), 0);
    const sumTax = sorted.reduce((s, inv) => s + (parseFloat(inv.totalTax) || 0), 0);
    const sumGross = sorted.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);
    const count = sorted.length;

    // Update banner labels
    const elLabel = document.getElementById('fin-monthly-label');
    const elNet = document.getElementById('fin-monthly-sum-net');
    const elTax = document.getElementById('fin-monthly-sum-tax');
    const elGross = document.getElementById('fin-monthly-sum-gross');
    const elCount = document.getElementById('fin-monthly-sum-count');

    const periodTitle = (finSelectedMonth !== 'all')
        ? `${GERMAN_MONTH_NAMES[parseInt(finSelectedMonth, 10) - 1]} ${quartersSelectedYear !== 'all' ? quartersSelectedYear : ''}`
        : `Alle Monate ${quartersSelectedYear !== 'all' ? quartersSelectedYear : '(Gesamt)'}`;

    if (elLabel) elLabel.textContent = periodTitle;
    if (elNet) elNet.textContent = formatCurrency(sumNet);
    if (elTax) elTax.textContent = formatCurrency(sumTax);
    if (elGross) elGross.textContent = formatCurrency(sumGross);
    if (elCount) elCount.textContent = `${count} Beleg${count === 1 ? '' : 'e'}`;

    if (sorted.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="padding: 36px; text-align: center; color: #94a3b8;">
                    Keine Ausgangsrechnungen für ${escapeHtml(periodTitle)} gefunden.
                </td>
            </tr>
        `;
    } else {
        let rowsHtml = '';
        sorted.forEach(inv => {
            const isPaid = (inv.paymentStatus || inv.status || '').toLowerCase() === 'bezahlt';
            const clientName = (inv.client && inv.client.name) ? inv.client.name : "Kunde";
            const clientCity = (inv.client && inv.client.zipCity) ? inv.client.zipCity : "";
            const leadItem = (inv.items && inv.items[0]) ? inv.items[0].title : "GalaBau Leistung";

            rowsHtml += `
                <tr class="crm-row">
                    <td>
                        <strong style="color: #0284c7; cursor: pointer;" onclick="editInvoiceInGenerator('${inv.id}')" title="Im Generator öffnen">
                            ${escapeHtml(inv.docNumber)}
                        </strong>
                    </td>
                    <td>${escapeHtml(inv.docDate)}</td>
                    <td>
                        <div style="font-weight: 700; color: var(--text-primary);">${escapeHtml(clientName)}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(clientCity)}</div>
                    </td>
                    <td>
                        <span style="font-size: 0.82rem; color: #334155;">${escapeHtml(leadItem)}</span>
                    </td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(inv.totalNet)}</td>
                    <td style="text-align: right; color: #ea580c; font-weight: 700;">${formatCurrency(inv.totalTax)}</td>
                    <td style="text-align: right; font-weight: 800; color: #059669; font-size: 0.95rem;">${formatCurrency(inv.totalGross)}</td>
                    <td style="text-align: center;">
                        <button type="button" class="crm-badge ${isPaid ? 'crm-badge-active' : 'crm-badge-closed'}" onclick="toggleInvoicePaymentStatus('${inv.id}')" title="Klicken um Status zu wechseln" style="cursor: pointer; border: none;">
                            ${isPaid ? '✓ Bezahlt' : '⏳ Offen'}
                        </button>
                    </td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 4px; justify-content: center;">
                            <button type="button" class="crm-action-btn primary" onclick="editInvoiceInGenerator('${inv.id}')" title="Im Generator bearbeiten">
                                Öffnen
                            </button>
                            <button type="button" class="crm-action-btn" onclick="downloadInvoicePdfDirect('${inv.id}')" title="PDF drucken / exportieren">
                                PDF
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = rowsHtml;
    }

    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td colspan="4" style="font-weight: 800; font-size: 0.95rem;">
                    Summe ${escapeHtml(periodTitle)}
                </td>
                <td style="text-align: right; font-weight: 800; color: var(--text-primary);">
                    ${formatCurrency(sumNet)}
                </td>
                <td style="text-align: right; font-weight: 800; color: #ea580c;">
                    ${formatCurrency(sumTax)}
                </td>
                <td style="text-align: right; font-weight: 900; color: #059669; font-size: 1.05rem;">
                    ${formatCurrency(sumGross)}
                </td>
                <td colspan="2" style="text-align: center;">
                    <button type="button" class="crm-action-btn primary" onclick="openMonthlyStatementModal()" title="Monatsabrechnung drucken">
                        🖨️ Drucken
                    </button>
                </td>
            </tr>
        `;
    }
}

// ==========================================================================
// RENDER SUBVIEW 3: QUARTERS TABLE (EXISTING COMPLIANT LOGIC)
// ==========================================================================
function renderQuartersTableView() {
    const tbody = document.getElementById('crm-quarters-table-body');
    const tfoot = document.getElementById('crm-quarters-table-footer');
    if (!tbody) return;

    const archive = getInvoicesArchive();
    const actualInvoices = archive.filter(inv => inv.docType !== 'angebot');

    const yearFiltered = (quartersSelectedYear === 'all')
        ? actualInvoices
        : actualInvoices.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === parseInt(quartersSelectedYear, 10);
        });

    const sumGross = yearFiltered.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);
    const sumNet = yearFiltered.reduce((s, inv) => s + (parseFloat(inv.totalNet) || 0), 0);
    const sumTax = yearFiltered.reduce((s, inv) => s + (parseFloat(inv.totalTax) || 0), 0);
    const sumCount = yearFiltered.length;

    const yearNum = (quartersSelectedYear === 'all') ? 2026 : parseInt(quartersSelectedYear, 10);

    const quarters = [
        { id: 1, name: "1. Quartal (Q1)", period: "01.01. – 31.03.", deadline: `10. Mai ${yearNum}`, invoices: [], gross: 0, net: 0, tax: 0 },
        { id: 2, name: "2. Quartal (Q2)", period: "01.04. – 30.06.", deadline: `10. August ${yearNum}`, invoices: [], gross: 0, net: 0, tax: 0 },
        { id: 3, name: "3. Quartal (Q3)", period: "01.07. – 30.09.", deadline: `10. November ${yearNum}`, invoices: [], gross: 0, net: 0, tax: 0 },
        { id: 4, name: "4. Quartal (Q4)", period: "01.10. – 31.12.", deadline: `10. Februar ${yearNum + 1}`, invoices: [], gross: 0, net: 0, tax: 0 }
    ];

    yearFiltered.forEach(inv => {
        const d = parseGermanDate(inv.docDate);
        const m = d.getMonth() + 1;
        const qIdx = Math.floor((m - 1) / 3);
        if (quarters[qIdx]) {
            quarters[qIdx].invoices.push(inv);
            quarters[qIdx].gross += (parseFloat(inv.totalGross) || 0);
            quarters[qIdx].net += (parseFloat(inv.totalNet) || 0);
            quarters[qIdx].tax += (parseFloat(inv.totalTax) || 0);
        }
    });

    let html = "";
    quarters.forEach(q => {
        const isExpanded = openQuarterRows.has(q.id);
        const hasInvoices = q.invoices.length > 0;
        let statusClass = (q.id === 1) ? "crm-badge-closed" : (q.id === 2 ? "crm-badge-active" : "crm-badge-future");

        html += `
            <tr class="crm-row ${isExpanded ? 'highlight-row' : ''}">
                <td>
                    <div style="font-weight: 800; color: var(--text-primary); font-size: 0.92rem;">
                        ${escapeHtml(q.name)} ${quartersSelectedYear !== 'all' ? quartersSelectedYear : ''}
                    </div>
                    <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
                        Zeitraum: ${q.period}${quartersSelectedYear !== 'all' ? quartersSelectedYear : ''}
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.84rem; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 5px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${q.deadline}
                    </div>
                    <div style="margin-top: 3px;">
                        <span class="crm-badge ${statusClass}">§ 18 UStG Frist</span>
                    </div>
                </td>
                <td style="text-align: center;">
                    <span class="crm-badge ${hasInvoices ? 'crm-badge-active' : 'crm-badge-closed'}" style="font-size: 0.78rem;">
                        ${q.invoices.length} ${q.invoices.length === 1 ? 'Beleg' : 'Belege'}
                    </span>
                </td>
                <td style="text-align: right; font-weight: 700;">${formatCurrency(q.net)}</td>
                <td style="text-align: right; font-weight: 800; color: #ea580c;">${formatCurrency(q.tax)}</td>
                <td style="text-align: right; font-weight: 800; color: #059669; font-size: 0.95rem;">${formatCurrency(q.gross)}</td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                        <button type="button" class="crm-action-btn ${hasInvoices ? 'primary' : ''}" onclick="toggleQuarterInvoicesRow(${q.id})" ${!hasInvoices ? 'disabled style="opacity:0.6;"' : ''} title="Belegjournal für ${q.name} aufklappen">
                            ${isExpanded ? 'Schließen' : `Details (${q.invoices.length})`}
                        </button>
                    </div>
                </td>
            </tr>
        `;

        if (isExpanded && hasInvoices) {
            let invSubRows = "";
            q.invoices.forEach(inv => {
                const cName = (inv.client && inv.client.name) ? inv.client.name : "Kunde";
                invSubRows += `
                    <tr>
                        <td style="font-weight: 700; color: var(--text-primary);">${escapeHtml(inv.docNumber)}</td>
                        <td>${escapeHtml(inv.docDate)}</td>
                        <td style="font-weight: 600;">${escapeHtml(cName)}</td>
                        <td style="color: var(--text-secondary);">${escapeHtml((inv.items && inv.items[0]) ? inv.items[0].title : 'GalaBau')}</td>
                        <td style="text-align: right;">${formatCurrency(inv.totalNet)}</td>
                        <td style="text-align: right; color: #ea580c;">${formatCurrency(inv.totalTax)}</td>
                        <td style="text-align: right; font-weight: 700; color: #059669;">${formatCurrency(inv.totalGross)}</td>
                        <td style="text-align: center;">
                            <div style="display: flex; gap: 4px; justify-content: center;">
                                <button type="button" class="crm-action-btn" style="padding: 3px 8px; font-size: 0.7rem;" onclick="editInvoiceInGenerator('${inv.id}')" title="Im Generator öffnen">
                                    Bearbeiten
                                </button>
                                <button type="button" class="crm-action-btn" style="padding: 3px 8px; font-size: 0.7rem;" onclick="downloadInvoicePdfDirect('${inv.id}')" title="PDF drucken / herunterladen">
                                    PDF
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `
                <tr class="crm-sub-row">
                    <td colspan="7">
                        <div class="crm-sub-container">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary);">
                                    Buchungsjournal: ${escapeHtml(q.name)} (${q.invoices.length} Ausgangsrechnungen)
                                </span>
                                <span style="font-size: 0.74rem; font-weight: 700; color: #ea580c;">
                                    USt-Voranmeldung Zahllast: ${formatCurrency(q.tax)}
                                </span>
                            </div>
                            <table class="crm-sub-table">
                                <thead>
                                    <tr>
                                        <th>Beleg-Nr.</th>
                                        <th>Datum</th>
                                        <th>Auftraggeber</th>
                                        <th>Leistung</th>
                                        <th style="text-align: right;">Netto (Kz 81)</th>
                                        <th style="text-align: right;">19% USt (Kz 83)</th>
                                        <th style="text-align: right;">Brutto</th>
                                        <th style="text-align: center;">Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${invSubRows}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            `;
        }
    });

    tbody.innerHTML = html;

    if (tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td colspan="2" style="font-weight: 800; font-size: 0.95rem;">
                    Jahressumme ${quartersSelectedYear !== 'all' ? quartersSelectedYear : '(Gesamt)'}
                </td>
                <td style="text-align: center; font-weight: 800;">
                    ${sumCount} Belege
                </td>
                <td style="text-align: right; font-weight: 800;">
                    ${formatCurrency(sumNet)}
                </td>
                <td style="text-align: right; font-weight: 800; color: #ea580c;">
                    ${formatCurrency(sumTax)}
                </td>
                <td style="text-align: right; font-weight: 800; color: #059669; font-size: 1rem;">
                    ${formatCurrency(sumGross)}
                </td>
                <td style="text-align: center;">
                    <button type="button" class="crm-action-btn" onclick="exportQuartersToCsv()" title="Quartalsbericht als CSV exportieren">
                        CSV Export
                    </button>
                </td>
            </tr>
        `;
    }
}

// Master Render Function for Finanzen View
window.renderQuartersView = function() {
    // Update active filter badge in top bar
    const filterBadge = document.getElementById('fin-active-filter-badge');
    if (filterBadge) {
        const mLabel = (finSelectedMonth !== 'all') ? GERMAN_MONTH_NAMES[parseInt(finSelectedMonth, 10) - 1] : 'Alle Monate';
        const yLabel = (quartersSelectedYear !== 'all') ? quartersSelectedYear : 'Alle Jahre';
        filterBadge.textContent = `Filter: ${mLabel} ${yLabel} • 19% Regelbesteuerung (Pforzheim)`;
    }

    renderPowerBiDashboard();
    renderMonthlyFinancesView();
    renderQuartersTableView();
};

// ==========================================================================
// MONATSRECHNUNG MODAL & DIN A4 EXPORT
// ==========================================================================
window.openMonthlyStatementModal = function() {
    const modal = document.getElementById('fin-monthly-statement-modal');
    const content = document.getElementById('fin-monthly-statement-content');
    const modalTitle = document.getElementById('fin-statement-modal-title');
    if (!modal || !content) return;

    const filteredInvoices = getFilteredFinInvoices();
    const periodLabel = (finSelectedMonth !== 'all')
        ? `${GERMAN_MONTH_NAMES[parseInt(finSelectedMonth, 10) - 1]} ${quartersSelectedYear !== 'all' ? quartersSelectedYear : ''}`
        : `Gesamtjahr ${quartersSelectedYear !== 'all' ? quartersSelectedYear : ''}`;

    if (modalTitle) modalTitle.textContent = `Monatsabrechnung • ${periodLabel}`;

    const sumNet = filteredInvoices.reduce((s, inv) => s + (parseFloat(inv.totalNet) || 0), 0);
    const sumTax = filteredInvoices.reduce((s, inv) => s + (parseFloat(inv.totalTax) || 0), 0);
    const sumGross = filteredInvoices.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);

    let rowsHtml = '';
    filteredInvoices.forEach(inv => {
        const clientName = (inv.client && inv.client.name) ? inv.client.name : "Kunde";
        const isPaid = (inv.paymentStatus || inv.status || '').toLowerCase() === 'bezahlt';
        rowsHtml += `
            <tr>
                <td style="font-weight: 700;">${escapeHtml(inv.docNumber)}</td>
                <td>${escapeHtml(inv.docDate)}</td>
                <td>${escapeHtml(clientName)}</td>
                <td style="text-align: right;">${formatCurrency(inv.totalNet)}</td>
                <td style="text-align: right; color: #ea580c;">${formatCurrency(inv.totalTax)}</td>
                <td style="text-align: right; font-weight: 700;">${formatCurrency(inv.totalGross)}</td>
                <td style="text-align: center;">${isPaid ? 'Bezahlt' : 'Offen'}</td>
            </tr>
        `;
    });

    content.innerHTML = `
        <div class="fin-statement-sheet">
            <div class="fin-statement-header">
                <div>
                    <div class="fin-statement-brand">Palnau Gartenbau GmbH</div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                        Garten- und Landschaftsbau • Erdarbeiten • Pflasterbau
                    </div>
                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">
                        Reihelberg 3, 75210 Keltern • Steuernummer: 41413-45017 • Finanzamt Pforzheim
                    </div>
                </div>
                <div class="fin-statement-meta">
                    <strong style="color: #0f172a;">MONATSABRECHNUNG</strong><br>
                    Abrechnungszeitraum: <strong>${escapeHtml(periodLabel)}</strong><br>
                    Erstellt am: ${new Date().toLocaleDateString('de-DE')}
                </div>
            </div>

            <div style="display: flex; gap: 14px; margin-bottom: 20px;">
                <div style="flex: 1; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Nettoumsatz (Kz 81)</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #059669; margin-top: 2px;">${formatCurrency(sumNet)}</div>
                </div>
                <div style="flex: 1; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">19% USt-Zahllast (Kz 83)</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #ea580c; margin-top: 2px;">${formatCurrency(sumTax)}</div>
                </div>
                <div style="flex: 1; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Gesamtumsatz Brutto</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 2px;">${formatCurrency(sumGross)}</div>
                </div>
                <div style="flex: 1; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Anzahl Ausgangsbelege</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #0284c7; margin-top: 2px;">${filteredInvoices.length}</div>
                </div>
            </div>

            <table class="fin-statement-table">
                <thead>
                    <tr>
                        <th>Beleg-Nr.</th>
                        <th>Datum</th>
                        <th>Kunde / Empfänger</th>
                        <th style="text-align: right;">Netto</th>
                        <th style="text-align: right;">19% USt</th>
                        <th style="text-align: right;">Brutto</th>
                        <th style="text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px;">Keine Belege vorhanden</td></tr>'}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3">Gesamtsumme ${escapeHtml(periodLabel)}</td>
                        <td style="text-align: right;">${formatCurrency(sumNet)}</td>
                        <td style="text-align: right; color: #ea580c;">${formatCurrency(sumTax)}</td>
                        <td style="text-align: right; color: #059669;">${formatCurrency(sumGross)}</td>
                        <td style="text-align: center;">${filteredInvoices.length} Belege</td>
                    </tr>
                </tfoot>
            </table>

            <div class="fin-statement-footer-signs">
                <div class="fin-sign-box">
                    Ort, Datum
                </div>
                <div class="fin-sign-box">
                    Unterschrift Geschäftsführung
                </div>
                <div class="fin-sign-box">
                    Geprüft Buchhaltung / StB
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
};

window.closeMonthlyStatementModal = function() {
    const modal = document.getElementById('fin-monthly-statement-modal');
    if (modal) modal.style.display = 'none';
};

window.printMonthlyStatementSheet = function() {
    window.print();
};

window.exportFinancesToCsv = function() {
    const filteredInvoices = getFilteredFinInvoices();
    const periodLabel = (finSelectedMonth !== 'all')
        ? `${GERMAN_MONTH_NAMES[parseInt(finSelectedMonth, 10) - 1]}_${quartersSelectedYear}`
        : `Jahr_${quartersSelectedYear}`;

    const rows = [
        ["Belegnummer", "Datum", "Kunde", "Strasse", "PLZ_Ort", "Leistung", "Netto_EUR", "USt19_EUR", "Brutto_EUR", "Zahlungsstatus"]
    ];

    filteredInvoices.forEach(inv => {
        const clientName = (inv.client && inv.client.name) ? inv.client.name : "";
        const street = (inv.client && inv.client.street) ? inv.client.street : "";
        const zipCity = (inv.client && inv.client.zipCity) ? inv.client.zipCity : "";
        const leadItem = (inv.items && inv.items[0]) ? inv.items[0].title : "";
        const net = parseFloat(inv.totalNet) || 0;
        const tax = parseFloat(inv.totalTax) || 0;
        const gross = parseFloat(inv.totalGross) || 0;
        const status = (inv.paymentStatus || inv.status || 'offen');

        rows.push([
            `"${inv.docNumber || ''}"`,
            `"${inv.docDate || ''}"`,
            `"${clientName}"`,
            `"${street}"`,
            `"${zipCity}"`,
            `"${leadItem.replace(/"/g, '""')}"`,
            net.toFixed(2),
            tax.toFixed(2),
            gross.toFixed(2),
            `"${status}"`
        ]);
    });

    const sumNet = filteredInvoices.reduce((s, inv) => s + (parseFloat(inv.totalNet) || 0), 0);
    const sumTax = filteredInvoices.reduce((s, inv) => s + (parseFloat(inv.totalTax) || 0), 0);
    const sumGross = filteredInvoices.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);

    rows.push([
        `"SUMME (${periodLabel})"`,
        `""`,
        `""`,
        `""`,
        `""`,
        `""`,
        sumNet.toFixed(2),
        sumTax.toFixed(2),
        sumGross.toFixed(2),
        `"${filteredInvoices.length} Belege"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Palnau_Finanzen_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Finanz-Journal ${periodLabel} als CSV exportiert!`);
};

window.exportQuartersToCsv = function() {
    const archive = getInvoicesArchive();
    const yearFiltered = (quartersSelectedYear === 'all')
        ? archive
        : archive.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === parseInt(quartersSelectedYear, 10);
        });

    const quarters = [
        { name: "Q1", period: "01.01.–31.03.", count: 0, net: 0, tax: 0, gross: 0 },
        { name: "Q2", period: "01.04.–30.06.", count: 0, net: 0, tax: 0, gross: 0 },
        { name: "Q3", period: "01.07.–30.09.", count: 0, net: 0, tax: 0, gross: 0 },
        { name: "Q4", period: "01.10.–31.12.", count: 0, net: 0, tax: 0, gross: 0 }
    ];

    yearFiltered.forEach(inv => {
        const d = parseGermanDate(inv.docDate);
        const m = d.getMonth() + 1;
        const qIdx = Math.floor((m - 1) / 3);
        if (quarters[qIdx]) {
            quarters[qIdx].count++;
            quarters[qIdx].net += (parseFloat(inv.totalNet) || 0);
            quarters[qIdx].tax += (parseFloat(inv.totalTax) || 0);
            quarters[qIdx].gross += (parseFloat(inv.totalGross) || 0);
        }
    });

    const rows = [
        ["Finanz-Quartal", "Zeitraum", "Anzahl Belege", "Nettoumsatz (Kz 81)", "19% USt Zahllast (Kz 83)", "Bruttoumsatz"]
    ];

    quarters.forEach(q => {
        rows.push([
            `"${q.name}"`,
            `"${q.period}"`,
            q.count,
            q.net.toFixed(2),
            q.tax.toFixed(2),
            q.gross.toFixed(2)
        ]);
    });

    // Total Row
    const totalNet = quarters.reduce((s, q) => s + q.net, 0);
    const totalTax = quarters.reduce((s, q) => s + q.tax, 0);
    const totalGross = quarters.reduce((s, q) => s + q.gross, 0);
    const totalCount = quarters.reduce((s, q) => s + q.count, 0);

    rows.push([
        `"Jahressumme ${quartersSelectedYear}"`,
        `"01.01.–31.12."`,
        totalCount,
        totalNet.toFixed(2),
        totalTax.toFixed(2),
        totalGross.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Palnau_USt_Quartale_${quartersSelectedYear}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Quartalsbericht als CSV exportiert!");
};

window.filterOverviewByQuarter = function(year, quarterNum) {
    switchAppView('overview');
    setOverviewPeriodFilter('quarter');
    const subSelect = document.getElementById('overview-sub-period-select');
    if (subSelect) {
        subSelect.value = `${year}-Q${quarterNum}`;
        handleSubPeriodChange(subSelect.value);
    }
};

// ==========================================================================
// DARLEHEN & INVESTITIONSKREDIT (PERSISTENT LOGIC, BUDGETS & LEDGER)
// ==========================================================================

const LOANS_STORAGE_KEY = 'palnau_loans_data';

window.getLoanData = function() {
    const raw = localStorage.getItem(LOANS_STORAGE_KEY);
    if (!raw) {
        const initial = (typeof DEFAULT_LOAN_DATA !== 'undefined')
            ? JSON.parse(JSON.stringify(DEFAULT_LOAN_DATA))
            : {
                budgets: { bga: 8000.00, betriebsmittel: 34500.00, uebernahme: 30000.00 },
                entries: []
            };
        localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.budgets === 'object' && Array.isArray(parsed.entries)) {
            if (parsed.budgets.bga === undefined) parsed.budgets.bga = 8000;
            // 7.500 € von Topf 3 (Übernahme) in Topf 2 (Betriebsmittel) aufsummiert:
            // Topf 2: 27.000 + 7.500 = 34.500 €
            // Topf 3: 37.500 - 7.500 = 30.000 €
            if (parsed.budgets.betriebsmittel === undefined || parsed.budgets.betriebsmittel === 27000 || parsed.budgets.betriebsmittel < 34500) {
                parsed.budgets.betriebsmittel = 34500.00;
            }
            if (parsed.budgets.uebernahme === undefined || parsed.budgets.uebernahme === 37500 || parsed.budgets.uebernahme > 30000) {
                parsed.budgets.uebernahme = 30000.00;
            }
            // If loan-ent-1 is still the old 35000, adjust to 27500 so Topf 3 remains within 30000
            const ent1 = parsed.entries.find(e => e.id === 'loan-ent-1' && e.amount === 35000);
            if (ent1) {
                ent1.amount = 27500.00;
            }
            localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(parsed));
            return parsed;
        }
        throw new Error("Invalid loan structure");
    } catch (e) {
        console.warn("Corrupt loans data, restoring default", e);
        const initial = (typeof DEFAULT_LOAN_DATA !== 'undefined')
            ? JSON.parse(JSON.stringify(DEFAULT_LOAN_DATA))
            : {
                budgets: { bga: 8000.00, betriebsmittel: 34500.00, uebernahme: 30000.00 },
                entries: []
            };
        localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }
};

window.saveLoanData = function(data) {
    localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(data));
    updateAllAppStatesAndBadges();
    if (typeof renderLoansView === 'function') {
        renderLoansView();
    }
    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud();
    }
};

let loanFilterPot = 'all'; // 'all' | 'bga' | 'betriebsmittel' | 'uebernahme'
let loanFilterSearch = '';

window.filterLoanEntriesByPot = function(pot) {
    loanFilterPot = pot;
    const pills = ['all', 'bga', 'betriebsmittel', 'uebernahme'];
    pills.forEach(p => {
        const btn = document.getElementById(`pill-pot-${p}`);
        if (btn) btn.classList.toggle('active', p === pot);
    });
    renderLoansView();
};

window.handleLoanSearch = function(val) {
    loanFilterSearch = (val || '').toLowerCase().trim();
    const clearBtn = document.getElementById('loan-search-clear');
    if (clearBtn) clearBtn.style.display = val ? 'inline-block' : 'none';
    renderLoansView();
};

window.clearLoanSearch = function() {
    const input = document.getElementById('loan-search-input');
    const clearBtn = document.getElementById('loan-search-clear');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    loanFilterSearch = '';
    renderLoansView();
};

window.renderLoansView = function() {
    const loanData = getLoanData();
    const budgets = loanData.budgets || { bga: 8000, betriebsmittel: 34500, uebernahme: 30000 };
    const entries = loanData.entries || [];

    // 1. Calculate pot totals
    const spentBga = entries.filter(e => e.pot === 'bga').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const spentBetrieb = entries.filter(e => e.pot === 'betriebsmittel').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const spentUebernahme = entries.filter(e => e.pot === 'uebernahme').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    const totalBudget = (parseFloat(budgets.bga) || 0) + (parseFloat(budgets.betriebsmittel) || 0) + (parseFloat(budgets.uebernahme) || 0);
    const totalSpent = spentBga + spentBetrieb + spentUebernahme;
    const totalRemaining = totalBudget - totalSpent;
    const usagePercent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100) : 0;

    // 2. Update KPI Ribbon
    const kpiBudget = document.getElementById('kpi-loan-total-budget');
    const kpiSpent = document.getElementById('kpi-loan-total-spent');
    const kpiSpentSub = document.getElementById('kpi-loan-spent-sub');
    const kpiRemaining = document.getElementById('kpi-loan-total-remaining');
    const kpiUsage = document.getElementById('kpi-loan-usage-percent');

    if (kpiBudget) kpiBudget.textContent = formatCurrency(totalBudget);
    if (kpiSpent) kpiSpent.textContent = formatCurrency(totalSpent);
    if (kpiSpentSub) kpiSpentSub.textContent = `${entries.length} Buchung${entries.length === 1 ? '' : 'en'} erfasst`;
    if (kpiRemaining) kpiRemaining.textContent = formatCurrency(totalRemaining);
    if (kpiUsage) kpiUsage.textContent = `${usagePercent.toFixed(1).replace('.', ',')} %`;

    // 3. Render 3 Pots Cards with gala-bau info tooltips
    const potsContainer = document.getElementById('loan-pots-container');
    if (potsContainer) {
        const potsDef = [
            {
                key: 'bga',
                name: 'BGA Ausstattung',
                label: 'Investitionskredit Topf 1',
                budget: parseFloat(budgets.bga) || 0,
                spent: spentBga,
                cardClass: 'pot-bga',
                fillClass: 'fill-bga',
                tooltipTitle: 'Betriebs- & Geschäftsausstattung (BGA)',
                tooltipItems: [
                    '<strong>GalaBau Maschinen & Geräte:</strong> z. B. Akku-Heckenscheren, Freischneider, Motorsägen, Rasenmäher, Rüttelplatten, Minibagger.',
                    '<strong>Fuhrpark & Logistik:</strong> Anhänger, Ladekrane, Pritschenwagen, Aufbauten.',
                    '<strong>Werkstatt & Büro:</strong> Regalsysteme, Werkbänke, Profi-Werkzeuge, IT-Hardware.'
                ]
            },
            {
                key: 'betriebsmittel',
                name: 'Betriebsmittel',
                label: 'Investitionskredit Topf 2',
                budget: parseFloat(budgets.betriebsmittel) || 0,
                spent: spentBetrieb,
                cardClass: 'pot-betriebsmittel',
                fillClass: 'fill-betriebsmittel',
                tooltipTitle: 'Betriebsmittel (Gartenbau)',
                tooltipItems: [
                    '<strong>Baustoffe & Schüttgüter:</strong> Mutterboden gesiebt, Pflastersplitt, Schottertragschichten, Natursteine, Pflasterklinker.',
                    '<strong>Pflanzgut & Begrünung:</strong> Rollrasen, Gehölze, Stauden, Saatmischungen, Dünger, Rindenmulch.',
                    '<strong>Betriebsstoffe & PSA:</strong> Treibstoffe, Geräteöle, Schutzkleidung, Arbeitshandschuhe, Schnittschutzausrüstung.'
                ]
            },
            {
                key: 'uebernahme',
                name: 'Auf-/Übernahme',
                label: 'Investitionskredit Topf 3',
                budget: parseFloat(budgets.uebernahme) || 0,
                spent: spentUebernahme,
                cardClass: 'pot-uebernahme',
                fillClass: 'fill-uebernahme',
                tooltipTitle: 'Firmen- & Geschäftsübernahme',
                tooltipItems: [
                    '<strong>Kaufpreis Übernahme:</strong> Tranchen für Kundenstamm, Goodwill und Übernahme des bestehenden Betriebs Palnau.',
                    '<strong>Rechts- & Notarkosten:</strong> Notarielle Beurkundung, Handelsregisteranmeldung, Übergabeverträge.',
                    '<strong>Übergangsliquidität:</strong> Fortführung laufender Aufträge und Startkapital.'
                ]
            }
        ];

        let potsHtml = '';
        potsDef.forEach(p => {
            const rem = p.budget - p.spent;
            const pct = p.budget > 0 ? (p.spent / p.budget) * 100 : 0;
            const count = entries.filter(e => e.pot === p.key).length;
            const listItemsHtml = p.tooltipItems.map(i => `<li>${i}</li>`).join('');

            potsHtml += `
                <div class="loan-pot-card ${p.cardClass}">
                    <div class="loan-pot-header">
                        <div class="loan-pot-title-wrap">
                            <span class="loan-pot-label">${escapeHtml(p.label)}</span>
                            <span class="loan-pot-name">${escapeHtml(p.name)}</span>
                        </div>
                        <div class="info-tooltip-wrap">
                            <div class="info-icon-trigger" tabindex="0" title="GalaBau Erläuterung anzeigen">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                <span>GalaBau Info</span>
                            </div>
                            <div class="info-tooltip-box">
                                <div class="tooltip-header">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="16" x2="12" y2="12"></line>
                                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                    </svg>
                                    ${escapeHtml(p.tooltipTitle)}
                                </div>
                                <div class="tooltip-section-title">GalaBau Verwendungsbeispiele:</div>
                                <ul class="tooltip-list">
                                    ${listItemsHtml}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="loan-pot-figures">
                        <div class="loan-figure-item">
                            <span class="loan-figure-label">Budget</span>
                            <span class="loan-figure-val">${formatCurrency(p.budget)}</span>
                        </div>
                        <div class="loan-figure-item">
                            <span class="loan-figure-label">Verbraucht</span>
                            <span class="loan-figure-val val-orange">${formatCurrency(p.spent)}</span>
                        </div>
                        <div class="loan-figure-item">
                            <span class="loan-figure-label">Verfügbar</span>
                            <span class="loan-figure-val val-green">${formatCurrency(rem)}</span>
                        </div>
                    </div>

                    <div class="loan-progress-wrap">
                        <div class="loan-progress-label-row">
                            <span>Ausschöpfung: <strong>${pct.toFixed(1).replace('.', ',')} %</strong></span>
                            <span>${count} Buchung${count === 1 ? '' : 'en'}</span>
                        </div>
                        <div class="loan-progress-track">
                            <div class="loan-progress-fill ${p.fillClass}" style="width: ${Math.min(100, Math.max(0, pct))}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        potsContainer.innerHTML = potsHtml;
    }

    // 4. Filter & Render Ledger Table
    let filtered = [...entries];
    if (loanFilterPot !== 'all') {
        filtered = filtered.filter(e => e.pot === loanFilterPot);
    }
    if (loanFilterSearch) {
        const s = loanFilterSearch;
        filtered = filtered.filter(e => {
            const p = (e.purpose || '').toLowerCase();
            const r = (e.receiptNo || e.receiptNumber || '').toLowerCase();
            const n = (e.notes || '').toLowerCase();
            const d = (e.date || '').toLowerCase();
            return p.includes(s) || r.includes(s) || n.includes(s) || d.includes(s);
        });
    }

    // Sort by date descending
    filtered.sort((a, b) => {
        const da = parseGermanDate(a.date).getTime();
        const db = parseGermanDate(b.date).getTime();
        return db - da;
    });

    const tbody = document.getElementById('loan-ledger-table-body');
    const tfoot = document.getElementById('loan-ledger-table-footer');

    if (tbody) {
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 42px 20px;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 1.05rem;">Keine Mittelentnahmen gefunden</div>
                        <div style="font-size: 0.84rem; color: var(--text-muted); margin-top: 4px;">Passen Sie Ihren Filter an oder erfassen Sie einen neuen Entnahmeposten.</div>
                        <button type="button" class="crm-action-btn primary" onclick="openAddLoanEntryModal()" style="margin-top: 12px;">
                            + Erste Entnahme erfassen
                        </button>
                    </td>
                </tr>
            `;
        } else {
            let rowsHtml = '';
            const potLabels = {
                'bga': 'BGA Ausstattung',
                'betriebsmittel': 'Betriebsmittel',
                'uebernahme': 'Auf-/Übernahme'
            };

            filtered.forEach(entry => {
                const pBadgeClass = `pot-badge-${entry.pot || 'bga'}`;
                const pLabel = potLabels[entry.pot] || entry.pot;
                const receiptDisplay = entry.receiptNo || entry.receiptNumber || '—';
                const notesDisplay = entry.notes ? `<div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(entry.notes)}</div>` : '';

                rowsHtml += `
                    <tr class="crm-row">
                        <td style="font-weight: 700; color: #475569; white-space: nowrap;">
                            ${escapeHtml(entry.date)}
                        </td>
                        <td>
                            <span class="pot-badge ${pBadgeClass}">
                                ${escapeHtml(pLabel)}
                            </span>
                        </td>
                        <td>
                            <div style="font-weight: 700; color: var(--text-primary);">
                                ${escapeHtml(entry.purpose)}
                            </div>
                            ${notesDisplay}
                        </td>
                        <td style="font-family: monospace; font-size: 0.82rem; color: #475569;">
                            ${escapeHtml(receiptDisplay)}
                        </td>
                        <td style="text-align: right; font-weight: 800; font-size: 0.98rem; color: #ea580c; white-space: nowrap;">
                            ${formatCurrency(entry.amount)}
                        </td>
                        <td style="text-align: center;">
                            <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                                <button type="button" class="crm-action-btn" onclick="openAddLoanEntryModal('${entry.id}')" title="Posten bearbeiten">
                                    Bearbeiten
                                </button>
                                <button type="button" class="crm-action-btn" onclick="deleteLoanEntry('${entry.id}')" title="Posten löschen" style="color: #dc2626;">
                                    Löschen
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = rowsHtml;
        }
    }

    if (tfoot) {
        const sumFiltered = filtered.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        tfoot.innerHTML = `
            <tr>
                <td colspan="4" style="font-weight: 800; font-size: 0.92rem; color: var(--text-primary);">
                    Summe ausgewählte Entnahmen (${filtered.length} Posten)
                </td>
                <td style="text-align: right; font-weight: 800; color: #ea580c; font-size: 1.05rem;">
                    ${formatCurrency(sumFiltered)}
                </td>
                <td style="text-align: center;">
                    ${loanFilterPot !== 'all' || loanFilterSearch ? `
                        <button type="button" class="crm-action-btn" onclick="filterLoanEntriesByPot('all'); const si = document.getElementById('loan-search-input'); if (si) si.value=''; handleLoanSearch('');" style="font-size: 0.72rem;">
                            Filter löschen
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }
};

window.openAddLoanEntryModal = function(entryId = null) {
    const modal = document.getElementById('loan-entry-modal');
    const title = document.getElementById('loan-entry-modal-title');
    const editIdInput = document.getElementById('loan-entry-edit-id');
    const potSelect = document.getElementById('loan-entry-pot');
    const amountInput = document.getElementById('loan-entry-amount');
    const dateInput = document.getElementById('loan-entry-date');
    const purposeInput = document.getElementById('loan-entry-purpose');
    const receiptInput = document.getElementById('loan-entry-receipt');
    const notesInput = document.getElementById('loan-entry-notes');

    if (!modal) return;

    const delBtn = document.getElementById('loan-entry-delete-btn');

    if (entryId) {
        const data = getLoanData();
        const entry = (data.entries || []).find(e => e.id === entryId);
        if (entry) {
            if (title) title.textContent = "Mittelentnahme bearbeiten";
            if (editIdInput) editIdInput.value = entry.id;
            if (potSelect) potSelect.value = entry.pot || 'bga';
            if (amountInput) amountInput.value = entry.amount;
            if (dateInput) dateInput.value = entry.date;
            if (purposeInput) purposeInput.value = entry.purpose;
            if (receiptInput) receiptInput.value = entry.receiptNo || entry.receiptNumber || '';
            if (notesInput) notesInput.value = entry.notes || '';
            if (delBtn) delBtn.style.display = 'block';
        }
    } else {
        if (title) title.textContent = "Mittelentnahme erfassen";
        if (editIdInput) editIdInput.value = "";
        if (potSelect) potSelect.value = loanFilterPot !== 'all' ? loanFilterPot : 'bga';
        if (amountInput) amountInput.value = "";
        if (dateInput) {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yyyy = now.getFullYear();
            dateInput.value = `${dd}.${mm}.${yyyy}`;
        }
        if (purposeInput) purposeInput.value = "";
        if (receiptInput) receiptInput.value = "";
        if (notesInput) notesInput.value = "";
        if (delBtn) delBtn.style.display = 'none';
    }

    modal.style.display = 'flex';
    modal.classList.add('open');
};

window.closeLoanEntryModal = function() {
    const modal = document.getElementById('loan-entry-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
};

window.handleSaveLoanEntry = function(event) {
    if (event) event.preventDefault();

    const editId = document.getElementById('loan-entry-edit-id')?.value;
    const pot = document.getElementById('loan-entry-pot')?.value || 'bga';
    const amount = parseFloat(document.getElementById('loan-entry-amount')?.value) || 0;
    const date = document.getElementById('loan-entry-date')?.value?.trim() || new Date().toLocaleDateString('de-DE');
    const purpose = document.getElementById('loan-entry-purpose')?.value?.trim() || 'Mittelentnahme';
    const receiptNo = document.getElementById('loan-entry-receipt')?.value?.trim() || '';
    const notes = document.getElementById('loan-entry-notes')?.value?.trim() || '';

    if (amount <= 0) {
        showToast("Bitte einen gültigen Entnahmebetrag größer 0 angeben.");
        return;
    }

    const loanData = getLoanData();
    if (!Array.isArray(loanData.entries)) loanData.entries = [];

    if (editId) {
        const idx = loanData.entries.findIndex(e => e.id === editId);
        if (idx >= 0) {
            loanData.entries[idx] = {
                ...loanData.entries[idx],
                pot,
                amount,
                date,
                purpose,
                receiptNo,
                receiptNumber: receiptNo,
                notes,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        const newEntry = {
            id: 'loan-ent-' + Date.now(),
            pot,
            amount,
            date,
            purpose,
            receiptNo,
            receiptNumber: receiptNo,
            notes,
            createdAt: new Date().toISOString()
        };
        loanData.entries.unshift(newEntry);
    }

    saveLoanData(loanData);
    closeLoanEntryModal();
    showToast("Mittelentnahme erfolgreich gespeichert!");
};

window.deleteLoanEntry = function(entryId) {
    if (!entryId) return;
    const loanData = getLoanData();
    loanData.entries = (loanData.entries || []).filter(e => String(e.id) !== String(entryId));
    saveLoanData(loanData);
    if (typeof renderLoansView === 'function') renderLoansView();
    showToast("Entnahmeposten gelöscht.");
};

window.handleDeleteCurrentLoanEntry = function() {
    const editId = document.getElementById('loan-entry-edit-id')?.value;
    if (!editId) return;
    deleteLoanEntry(editId);
    closeLoanEntryModal();
};

// Budgets Adjustment Modal Handlers
window.openEditBudgetsModal = function() {
    const modal = document.getElementById('loan-budgets-modal');
    const bgaInput = document.getElementById('budget-bga-input');
    const betriebInput = document.getElementById('budget-betriebsmittel-input');
    const uebernahmeInput = document.getElementById('budget-uebernahme-input');
    const totalPreview = document.getElementById('budget-total-preview');

    if (!modal) return;

    const loanData = getLoanData();
    const budgets = loanData.budgets || { bga: 8000, betriebsmittel: 34500, uebernahme: 30000 };

    if (bgaInput) bgaInput.value = budgets.bga ?? 8000;
    if (betriebInput) betriebInput.value = budgets.betriebsmittel ?? 34500;
    if (uebernahmeInput) uebernahmeInput.value = budgets.uebernahme ?? 30000;

    function updatePreview() {
        const bga = parseFloat(bgaInput?.value) || 0;
        const betrieb = parseFloat(betriebInput?.value) || 0;
        const ueber = parseFloat(uebernahmeInput?.value) || 0;
        if (totalPreview) totalPreview.textContent = formatCurrency(bga + betrieb + ueber);
    }

    if (bgaInput) bgaInput.oninput = updatePreview;
    if (betriebInput) betriebInput.oninput = updatePreview;
    if (uebernahmeInput) uebernahmeInput.oninput = updatePreview;

    updatePreview();
    modal.style.display = 'flex';
    modal.classList.add('open');
};

window.closeLoanBudgetsModal = function() {
    const modal = document.getElementById('loan-budgets-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
};

window.handleSaveLoanBudgets = function(event) {
    if (event) event.preventDefault();

    const bga = parseFloat(document.getElementById('budget-bga-input')?.value) || 0;
    const betrieb = parseFloat(document.getElementById('budget-betriebsmittel-input')?.value) || 0;
    const ueber = parseFloat(document.getElementById('budget-uebernahme-input')?.value) || 0;

    const loanData = getLoanData();
    loanData.budgets = {
        bga: bga,
        betriebsmittel: betrieb,
        uebernahme: ueber
    };

    saveLoanData(loanData);
    closeLoanBudgetsModal();
    showToast("Kreditbudgets erfolgreich aktualisiert!");
};

window.exportLoanReportToCsv = function() {
    const loanData = getLoanData();
    const budgets = loanData.budgets || { bga: 8000, betriebsmittel: 34500, uebernahme: 30000 };
    const entries = loanData.entries || [];

    const potLabels = {
        'bga': 'BGA Ausstattung',
        'betriebsmittel': 'Betriebsmittel',
        'uebernahme': 'Auf-/Übernahme'
    };

    const rows = [
        ["Kredit-Verwendungsnachweis - Palnau Gartenbau GmbH"],
        [`Stand: ${new Date().toLocaleDateString('de-DE')}`],
        [],
        ["Budget BGA", (budgets.bga || 0).toFixed(2)],
        ["Budget Betriebsmittel", (budgets.betriebsmittel || 0).toFixed(2)],
        ["Budget Auf-/Übernahme", (budgets.uebernahme || 0).toFixed(2)],
        ["Gesamter Kreditrahmen", ((budgets.bga || 0) + (budgets.betriebsmittel || 0) + (budgets.uebernahme || 0)).toFixed(2)],
        [],
        ["Datum", "Kredittopf", "Verwendungszweck", "Beleg-Nr.", "Notiz / Händler", "Entnahmebetrag (€)"]
    ];

    entries.forEach(e => {
        rows.push([
            `"${e.date}"`,
            `"${potLabels[e.pot] || e.pot}"`,
            `"${(e.purpose || '').replace(/"/g, '""')}"`,
            `"${(e.receiptNo || e.receiptNumber || '').replace(/"/g, '""')}"`,
            `"${(e.notes || '').replace(/"/g, '""')}"`,
            (parseFloat(e.amount) || 0).toFixed(2)
        ]);
    });

    const totalSpent = entries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    rows.push([]);
    rows.push(["Gesamtsumme Entnahmen", "", "", "", "", totalSpent.toFixed(2)]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Palnau_Darlehen_Mittelverwendung_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Kreditbericht als CSV exportiert!");
};

// ==========================================================================
// ARBEITSZEITKONTO & ÜBERSTUNDEN-VERWALTUNG (AZK)
// ==========================================================================

const WORKTIME_STORAGE_KEY = 'palnau_worktime_data_v1';

const DEFAULT_WORKTIME_DATA = {
    employees: [
        {
            id: 'emp-1',
            name: 'Florian Keller',
            role: 'Vorarbeiter GalaBau',
            weeklyHours: 40,
            initialBalance: 0.0,
            status: 'active'
        },
        {
            id: 'emp-2',
            name: 'Stefan Becker',
            role: 'Facharbeiter Grünpflege & Gehölzschnitt',
            weeklyHours: 40,
            initialBalance: 0.0,
            status: 'active'
        },
        {
            id: 'emp-3',
            name: 'Marius Weber',
            role: 'Facharbeiter Pflaster & Naturstein',
            weeklyHours: 40,
            initialBalance: 0.0,
            status: 'active'
        },
        {
            id: 'emp-4',
            name: 'Andrei Priala',
            role: 'Geschäftsführung & Bauleitung',
            weeklyHours: 40,
            initialBalance: 0.0,
            status: 'active'
        }
    ],
    entries: [
        // Florian Keller
        {
            id: 'wt-1',
            employeeId: 'emp-1',
            date: '17.01.2026',
            dateIso: '2026-01-17',
            monthKey: '2026-01',
            monthLabel: 'Januar 2026',
            type: 'aufbau',
            hours: 4.0,
            purpose: 'Winterdienst & Räumdienst Bereitschaft Wochenende'
        },
        {
            id: 'wt-2',
            employeeId: 'emp-1',
            date: '14.02.2026',
            dateIso: '2026-02-14',
            monthKey: '2026-02',
            monthLabel: 'Februar 2026',
            type: 'aufbau',
            hours: 6.5,
            purpose: 'Pflasterarbeiten Überstunden Objekt Dietlingen'
        },
        {
            id: 'wt-3',
            employeeId: 'emp-1',
            date: '27.02.2026',
            dateIso: '2026-02-27',
            monthKey: '2026-02',
            monthLabel: 'Februar 2026',
            type: 'abbau',
            hours: 4.0,
            purpose: 'Freizeitausgleich früher Feierabend Freitag'
        },
        {
            id: 'wt-4',
            employeeId: 'emp-1',
            date: '14.03.2026',
            dateIso: '2026-03-14',
            monthKey: '2026-03',
            monthLabel: 'März 2026',
            type: 'aufbau',
            hours: 6.0,
            purpose: 'Großbaustelle Pforzheim Pflasterverlegung'
        },
        {
            id: 'wt-5',
            employeeId: 'emp-1',
            date: '20.03.2026',
            dateIso: '2026-03-20',
            monthKey: '2026-03',
            monthLabel: 'März 2026',
            type: 'aufbau',
            hours: 4.0,
            purpose: 'Heckenschnitt & Rollrasen Fertigstellung'
        },

        // Stefan Becker
        {
            id: 'wt-6',
            employeeId: 'emp-2',
            date: '24.01.2026',
            dateIso: '2026-01-24',
            monthKey: '2026-01',
            monthLabel: 'Januar 2026',
            type: 'aufbau',
            hours: 4.5,
            purpose: 'Baumfällung & Häckselarbeiten Notfall Astbruch'
        },
        {
            id: 'wt-7',
            employeeId: 'emp-2',
            date: '21.02.2026',
            dateIso: '2026-02-21',
            monthKey: '2026-02',
            monthLabel: 'Februar 2026',
            type: 'aufbau',
            hours: 4.5,
            purpose: 'Rückschnitt & Großstrauchbeseitigung'
        },
        {
            id: 'wt-8',
            employeeId: 'emp-2',
            date: '06.03.2026',
            dateIso: '2026-03-06',
            monthKey: '2026-03',
            monthLabel: 'März 2026',
            type: 'abbau',
            hours: 4.0,
            purpose: 'Freizeitausgleich halber Tag'
        },
        {
            id: 'wt-9',
            employeeId: 'emp-2',
            date: '21.03.2026',
            dateIso: '2026-03-21',
            monthKey: '2026-03',
            monthLabel: 'März 2026',
            type: 'aufbau',
            hours: 4.0,
            purpose: 'Frühjahrsbepflanzung Kundenanlagen'
        },

        // Marius Weber
        {
            id: 'wt-10',
            employeeId: 'emp-3',
            date: '07.02.2026',
            dateIso: '2026-02-07',
            monthKey: '2026-02',
            monthLabel: 'Februar 2026',
            type: 'aufbau',
            hours: 5.0,
            purpose: 'Minibagger-Aushubarbeiten Baugrube'
        },
        {
            id: 'wt-11',
            employeeId: 'emp-3',
            date: '28.02.2026',
            dateIso: '2026-02-28',
            monthKey: '2026-02',
            monthLabel: 'Februar 2026',
            type: 'aufbau',
            hours: 7.0,
            purpose: 'Samstagseinsatz Naturstein-Wegebau'
        },

        // Andrei Priala
        {
            id: 'wt-12',
            employeeId: 'emp-4',
            date: '10.01.2026',
            dateIso: '2026-01-10',
            monthKey: '2026-01',
            monthLabel: 'Januar 2026',
            type: 'aufbau',
            hours: 5.0,
            purpose: 'Kundenberatung & Baustellenaufmaß vor Ort'
        },
        {
            id: 'wt-13',
            employeeId: 'emp-4',
            date: '14.02.2026',
            dateIso: '2026-02-14',
            monthKey: '2026-02',
            monthLabel: 'Februar 2026',
            type: 'aufbau',
            hours: 5.5,
            purpose: 'Materialdisposition & Lieferantenabstimmung'
        },
        {
            id: 'wt-14',
            employeeId: 'emp-4',
            date: '07.03.2026',
            dateIso: '2026-03-07',
            monthKey: '2026-03',
            monthLabel: 'März 2026',
            type: 'aufbau',
            hours: 6.0,
            purpose: 'Kalkulation & Großkunden-Angebotserstellung'
        },
        {
            id: 'wt-15',
            employeeId: 'emp-4',
            date: '21.03.2026',
            dateIso: '2026-03-21',
            monthKey: '2026-03',
            monthLabel: 'März 2026',
            type: 'aufbau',
            hours: 6.0,
            purpose: 'Projektleitung & Qualitätsabnahme Pflasterflächen'
        }
    ]
};

window.getWorktimeData = function() {
    const raw = localStorage.getItem(WORKTIME_STORAGE_KEY);
    if (!raw) {
        localStorage.setItem(WORKTIME_STORAGE_KEY, JSON.stringify(DEFAULT_WORKTIME_DATA));
        return JSON.parse(JSON.stringify(DEFAULT_WORKTIME_DATA));
    }
    try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.employees) && Array.isArray(parsed.entries)) {
            return parsed;
        }
        throw new Error("Invalid worktime structure");
    } catch (e) {
        console.warn("Corrupt worktime data, resetting to default", e);
        localStorage.setItem(WORKTIME_STORAGE_KEY, JSON.stringify(DEFAULT_WORKTIME_DATA));
        return JSON.parse(JSON.stringify(DEFAULT_WORKTIME_DATA));
    }
};

window.saveWorktimeData = function(data) {
    localStorage.setItem(WORKTIME_STORAGE_KEY, JSON.stringify(data));
    updateAllAppStatesAndBadges();
    if (typeof renderWorktimeView === 'function') {
        renderWorktimeView();
    }
    if (window.PalnauCloudSync && typeof window.PalnauCloudSync.pushLocalToCloud === 'function') {
        window.PalnauCloudSync.pushLocalToCloud();
    }
};

let worktimeActiveSubTab = 'cards'; // 'cards' | 'ledger'
let worktimeMonthFilter = 'all'; // 'all' | 'YYYY-MM'
let worktimeSearchQuery = '';

window.switchWorktimeSubTab = function(tab) {
    worktimeActiveSubTab = tab;
    const btnCards = document.getElementById('btn-wt-tab-cards');
    const btnLedger = document.getElementById('btn-wt-tab-ledger');
    const viewCards = document.getElementById('wt-view-cards');
    const viewLedger = document.getElementById('wt-view-ledger');

    if (btnCards) btnCards.classList.toggle('active', tab === 'cards');
    if (btnLedger) btnLedger.classList.toggle('active', tab === 'ledger');
    if (viewCards) viewCards.style.display = tab === 'cards' ? 'block' : 'none';
    if (viewLedger) viewLedger.style.display = tab === 'ledger' ? 'block' : 'none';

    renderWorktimeView();
};

window.setWorktimeMonthFilter = function(month) {
    worktimeMonthFilter = month;
    const pills = document.querySelectorAll('#wt-month-pills .neu-pill-btn');
    pills.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        btn.classList.toggle('active', onclickAttr.includes(`'${month}'`));
    });
    renderWorktimeView();
};

window.handleWorktimeSearch = function(val) {
    worktimeSearchQuery = (val || '').toLowerCase().trim();
    const clearBtn = document.getElementById('wt-search-clear');
    if (clearBtn) clearBtn.style.display = val ? 'inline-block' : 'none';
    renderWorktimeView();
};

window.clearWorktimeSearch = function() {
    const input = document.getElementById('wt-search-input');
    const clearBtn = document.getElementById('wt-search-clear');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    worktimeSearchQuery = '';
    renderWorktimeView();
};

window.renderWorktimeView = function() {
    const wtData = getWorktimeData();
    const employees = wtData.employees || [];
    const entries = wtData.entries || [];

    // Filter entries by month if selected
    const monthFilteredEntries = (worktimeMonthFilter === 'all')
        ? entries
        : entries.filter(e => e.monthKey === worktimeMonthFilter);

    // Compute Totals
    let totalCompanyBalance = 0;
    let totalAufbau = 0;
    let totalAbbau = 0;

    employees.forEach(emp => {
        const empAllEntries = entries.filter(e => e.employeeId === emp.id);
        const empAufbau = empAllEntries.filter(e => e.type === 'aufbau').reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
        const empAbbau = empAllEntries.filter(e => e.type === 'abbau' || e.type === 'auszahlung').reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
        totalCompanyBalance += (parseFloat(emp.initialBalance) || 0) + empAufbau - empAbbau;
    });

    monthFilteredEntries.forEach(e => {
        const h = parseFloat(e.hours) || 0;
        if (e.type === 'aufbau') totalAufbau += h;
        else if (e.type === 'abbau' || e.type === 'auszahlung') totalAbbau += h;
    });

    // Update KPI Ribbon
    const kpiBalance = document.getElementById('wt-kpi-total-balance');
    const kpiEmpCount = document.getElementById('wt-kpi-emp-count');
    const kpiAufbau = document.getElementById('wt-kpi-total-aufbau');
    const kpiAbbau = document.getElementById('wt-kpi-total-abbau');
    const kpiAufbauSub = document.getElementById('wt-kpi-aufbau-sub');
    const kpiAbbauSub = document.getElementById('wt-kpi-abbau-sub');

    if (kpiBalance) {
        const sign = totalCompanyBalance > 0 ? '+' : '';
        kpiBalance.textContent = `${sign}${totalCompanyBalance.toFixed(1).replace('.', ',')} Std.`;
        kpiBalance.style.color = totalCompanyBalance >= 0 ? '#15803d' : '#b91c1c';
    }
    if (kpiEmpCount) {
        kpiEmpCount.textContent = String(employees.length);
    }
    if (kpiAufbau) {
        kpiAufbau.textContent = `+${totalAufbau.toFixed(1).replace('.', ',')} Std.`;
    }
    if (kpiAbbau) {
        kpiAbbau.textContent = `-${totalAbbau.toFixed(1).replace('.', ',')} Std.`;
    }
    if (kpiAufbauSub) {
        kpiAufbauSub.textContent = worktimeMonthFilter === 'all' ? 'Alle Monate gesamt' : 'Im ausgewählten Monat';
    }
    if (kpiAbbauSub) {
        kpiAbbauSub.textContent = worktimeMonthFilter === 'all' ? 'Alle Monate gesamt' : 'Im ausgewählten Monat';
    }

    // 1. RENDER TAB 1: EMPLOYEE CARDS
    const empGrid = document.getElementById('wt-employee-grid');
    if (empGrid) {
        let filteredEmployees = employees;
        if (worktimeSearchQuery) {
            filteredEmployees = employees.filter(emp => {
                const name = (emp.name || '').toLowerCase();
                const role = (emp.role || '').toLowerCase();
                return name.includes(worktimeSearchQuery) || role.includes(worktimeSearchQuery);
            });
        }

        if (filteredEmployees.length === 0) {
            empGrid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">👷‍♂️</div>
                    <strong style="display: block; font-size: 1.05rem; color: #0f172a; margin-bottom: 4px;">Keine Mitarbeiter gefunden</strong>
                    <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 16px;">Legen Sie Ihren ersten Mitarbeiter an, um Überstunden und Zeitausgleich zu verwalten.</p>
                    <button type="button" class="neu-btn neu-btn-primary" onclick="openAddEmployeeModal()">+ Jetzt Mitarbeiter anlegen</button>
                </div>
            `;
        } else {
            let cardsHtml = '';
            filteredEmployees.forEach(emp => {
                const empEntries = entries.filter(e => e.employeeId === emp.id);
                const empAufbau = empEntries.filter(e => e.type === 'aufbau').reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
                const empAbbau = empEntries.filter(e => e.type === 'abbau' || e.type === 'auszahlung').reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
                const currentBalance = (parseFloat(emp.initialBalance) || 0) + empAufbau - empAbbau;

                // Balance status styling
                let heroClass = 'neutral';
                let balanceLabel = 'Überstunden-Saldo';
                let glowStatusText = 'Konto ausgeglichen (0,0 h)';
                if (currentBalance > 0) {
                    heroClass = 'positive';
                    balanceLabel = 'Überstunden-Guthaben';
                    glowStatusText = 'Guthaben im Plus';
                } else if (currentBalance < 0) {
                    heroClass = 'negative';
                    balanceLabel = 'Minusstunden';
                    glowStatusText = 'Minusstunden (Defizit)';
                }

                const sign = currentBalance > 0 ? '+' : '';
                const balanceFormatted = `${sign}${currentBalance.toFixed(1).replace('.', ',')} Std.`;

                // Calculate progress bar scale & width
                const maxReferenceHours = Math.max(40, Math.ceil(Math.abs(currentBalance) / 10) * 10);
                const progressWidthPercent = currentBalance === 0 
                    ? 0 
                    : Math.min(100, Math.max(8, Math.round((Math.abs(currentBalance) / maxReferenceHours) * 100)));
                const progressBarRatioText = `${Math.abs(currentBalance).toFixed(1).replace('.', ',')} / ${maxReferenceHours} Std.`;

                // Distinct Initials
                const initials = emp.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'M';

                // Calculate Month-by-Month summary for this employee
                const monthsMap = {};
                empEntries.forEach(e => {
                    const mk = e.monthKey || '2026-03';
                    const ml = e.monthLabel || 'März 2026';
                    if (!monthsMap[mk]) {
                        monthsMap[mk] = { label: ml, aufbau: 0, abbau: 0 };
                    }
                    const h = parseFloat(e.hours) || 0;
                    if (e.type === 'aufbau') monthsMap[mk].aufbau += h;
                    else monthsMap[mk].abbau += h;
                });

                const sortedMonths = Object.keys(monthsMap).sort().reverse();
                let monthRowsHtml = '';
                if (sortedMonths.length === 0) {
                    monthRowsHtml = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 10px;">Noch keine Monatsbuchungen erfasst</td></tr>`;
                } else {
                    sortedMonths.forEach(mk => {
                        const m = monthsMap[mk];
                        const mDiff = m.aufbau - m.abbau;
                        const mDiffSign = mDiff > 0 ? '+' : '';
                        const mDiffColor = mDiff > 0 ? '#15803d' : (mDiff < 0 ? '#b91c1c' : '#475569');
                        monthRowsHtml += `
                            <tr>
                                <td style="font-weight: 600;">${escapeHtml(m.label)}</td>
                                <td style="color: #059669; font-weight: 700;">+${m.aufbau.toFixed(1).replace('.', ',')} Std.</td>
                                <td style="color: #2563eb; font-weight: 700;">-${m.abbau.toFixed(1).replace('.', ',')} Std.</td>
                                <td style="font-weight: 800; color: ${mDiffColor}; text-align: right;">${mDiffSign}${mDiff.toFixed(1).replace('.', ',')} Std.</td>
                            </tr>
                        `;
                    });
                }

                cardsHtml += `
                    <div class="worktime-emp-card">
                        <div class="worktime-emp-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <div class="worktime-emp-profile">
                                <div class="worktime-emp-avatar">${initials}</div>
                                <div>
                                    <div class="worktime-emp-name">${escapeHtml(emp.name)}</div>
                                    <div class="worktime-emp-role">${escapeHtml(emp.role || 'Fachkraft')} • ${emp.weeklyHours || 40}h/Woche</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                                <button type="button" class="neu-btn" onclick="openEditEmployeeModal('${emp.id}')" title="Mitarbeiterdaten bearbeiten" style="padding: 5px 8px; font-size: 0.78rem; display: inline-flex; align-items: center;">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <div class="neu-action-menu-wrap">
                                    <button type="button" class="neu-action-menu-trigger neu-trigger-sm" onclick="toggleActionMenu(event, 'emp-menu-${emp.id}')" title="Weitere Aktionen für ${escapeHtml(emp.name)}">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="1.5"></circle>
                                            <circle cx="12" cy="5" r="1.5"></circle>
                                            <circle cx="12" cy="19" r="1.5"></circle>
                                        </svg>
                                    </button>
                                    <div class="neu-action-menu-dropdown" id="emp-menu-${emp.id}">
                                        <button type="button" class="neu-menu-item" onclick="closeAllActionMenus(); openEditEmployeeModal('${emp.id}');">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            <span>Mitarbeiter bearbeiten</span>
                                        </button>
                                        <button type="button" class="neu-menu-item" onclick="closeAllActionMenus(); openWorktimeStatement('${emp.id}');">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                            <span>Kontoauszug / PDF</span>
                                        </button>
                                        <div class="neu-menu-divider"></div>
                                        <button type="button" class="neu-menu-item neu-menu-item-danger" onclick="closeAllActionMenus(); promptDeleteEmployee('${emp.id}');">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            <span>Mitarbeiter löschen</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Current Balance Hero with Glowing Overtime Progress Bar -->
                        <div class="worktime-balance-hero ${heroClass}" style="flex-direction: column; align-items: stretch; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                                <div>
                                    <span class="worktime-balance-label">${balanceLabel}</span>
                                    <div style="font-size: 0.74rem; color: #64748b; margin-top: 1px;">
                                        Aufbau: +${empAufbau.toFixed(1).replace('.', ',')} | Abbau: -${empAbbau.toFixed(1).replace('.', ',')} Std.
                                    </div>
                                </div>
                                <span class="worktime-balance-number ${heroClass}">${balanceFormatted}</span>
                            </div>

                            <!-- Visual Overtime Progress Bar (Green glow for positive, Red glow for negative) -->
                            <div class="worktime-progress-container">
                                <div class="worktime-progress-header">
                                    <span class="worktime-progress-status ${heroClass}">
                                        <span class="worktime-glow-bulb ${heroClass}"></span>
                                        ${glowStatusText}
                                    </span>
                                    <span class="worktime-progress-ratio">${progressBarRatioText}</span>
                                </div>
                                <div class="worktime-progress-track">
                                    <div class="worktime-progress-fill ${heroClass}" style="width: ${progressWidthPercent}%;" title="${balanceFormatted}"></div>
                                </div>
                                <div class="worktime-progress-scale">
                                    <span>0 Std.</span>
                                    <span>Referenz: ${maxReferenceHours} Std.</span>
                                </div>
                            </div>
                        </div>

                        <!-- Monthly breakdown table -->
                        <div style="border: 1px solid #f1f5f9; border-radius: 8px; overflow: hidden; background: #fafafa;">
                            <table class="worktime-month-stats-table">
                                <thead>
                                    <tr>
                                        <th>Monat</th>
                                        <th>Aufbau (+)</th>
                                        <th>Abbau (-)</th>
                                        <th style="text-align: right;">Monatssaldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${monthRowsHtml}
                                </tbody>
                            </table>
                        </div>

                        <!-- Quick Actions (Clean and minimalist: Aufbau & Abbau) -->
                        <div class="worktime-quick-actions" style="grid-template-columns: 1fr 1fr;">
                            <button type="button" class="worktime-quick-btn worktime-quick-btn-aufbau" onclick="openAddWorktimeEntryModal('${emp.id}', 'aufbau')" title="Überstunden für diesen Mitarbeiter aufbauen">
                                ➕ Überstunden
                            </button>
                            <button type="button" class="worktime-quick-btn worktime-quick-btn-abbau" onclick="openAddWorktimeEntryModal('${emp.id}', 'abbau')" title="Freizeitausgleich / Überstunden abbauen">
                                ➖ Freizeitausgleich
                            </button>
                        </div>
                    </div>
                `;
            });
            empGrid.innerHTML = cardsHtml;
        }
    }

    // 2. RENDER TAB 2: LEDGER TABLE
    const ledgerTbody = document.getElementById('wt-ledger-tbody');
    const ledgerCount = document.getElementById('wt-ledger-count');
    if (ledgerTbody) {
        let filteredEntries = monthFilteredEntries;
        if (worktimeSearchQuery) {
            filteredEntries = filteredEntries.filter(e => {
                const emp = employees.find(em => em.id === e.employeeId);
                const empName = (emp ? emp.name : '').toLowerCase();
                const purp = (e.purpose || '').toLowerCase();
                return empName.includes(worktimeSearchQuery) || purp.includes(worktimeSearchQuery);
            });
        }

        // Sort by date descending
        const sortedEntries = [...filteredEntries].sort((a, b) => {
            const da = a.dateIso || a.date;
            const db = b.dateIso || b.date;
            return db.localeCompare(da);
        });

        if (ledgerCount) {
            ledgerCount.textContent = `${sortedEntries.length} Buchung${sortedEntries.length === 1 ? '' : 'en'}`;
        }

        if (sortedEntries.length === 0) {
            ledgerTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 30px; text-align: center; color: #94a3b8;">
                        Keine Überstunden-Buchungen für den gewählten Filter gefunden.
                    </td>
                </tr>
            `;
        } else {
            let tRows = '';
            sortedEntries.forEach(entry => {
                const emp = employees.find(e => e.id === entry.employeeId);
                const empName = emp ? escapeHtml(emp.name) : 'Unbekannt';
                const isAufbau = entry.type === 'aufbau';
                const badgeClass = isAufbau ? 'badge-aufbau' : 'badge-abbau';
                const badgeLabel = isAufbau ? '+ Aufbau' : '- Abbau (frei)';
                const sign = isAufbau ? '+' : '-';
                const hoursColor = isAufbau ? '#059669' : '#2563eb';
                const hoursFormatted = `${sign}${(parseFloat(entry.hours) || 0).toFixed(1).replace('.', ',')} Std.`;

                tRows += `
                    <tr>
                        <td style="padding: 10px 14px; font-weight: 600; color: #1e293b;">${escapeHtml(entry.date)}</td>
                        <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${empName}</td>
                        <td style="padding: 10px 14px;"><span class="${badgeClass}">${badgeLabel}</span></td>
                        <td style="padding: 10px 14px; text-align: right; font-weight: 800; color: ${hoursColor}; font-size: 0.95rem;">${hoursFormatted}</td>
                        <td style="padding: 10px 14px; color: #334155; font-size: 0.85rem;">${escapeHtml(entry.purpose || '—')}</td>
                        <td style="padding: 10px 14px; text-align: center; white-space: nowrap;">
                            <div style="display: inline-flex; gap: 6px; justify-content: center; align-items: center;">
                                <button type="button" class="neu-btn" onclick="openEditWorktimeEntryModal('${entry.id}')" title="Buchung bearbeiten" style="padding: 4px 8px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    <span>Bearbeiten</span>
                                </button>
                                <button type="button" class="neu-btn neu-btn-danger" onclick="deleteWorktimeEntry('${entry.id}')" title="Buchung löschen" style="padding: 4px 7px; font-size: 0.78rem; display: inline-flex; align-items: center;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            ledgerTbody.innerHTML = tRows;
        }
    }
};

// ==========================================================================
// WORKTIME MODALS MANAGEMENT
// ==========================================================================

window.openAddEmployeeModal = function() {
    const modal = document.getElementById('worktime-employee-modal');
    const title = document.getElementById('wt-emp-modal-title');
    const deleteBtn = document.getElementById('wt-emp-delete-btn');
    const form = document.getElementById('wt-employee-form');

    if (form) form.reset();
    const editIdEl = document.getElementById('wt-emp-edit-id');
    if (editIdEl) editIdEl.value = '';
    const weeklyHoursEl = document.getElementById('wt-emp-weekly-hours');
    if (weeklyHoursEl) weeklyHoursEl.value = '40';
    const initBalEl = document.getElementById('wt-emp-initial-balance');
    if (initBalEl) initBalEl.value = '0.0';
    const statusEl = document.getElementById('wt-emp-status');
    if (statusEl) statusEl.value = 'active';

    if (title) title.textContent = "Neuen Mitarbeiter anlegen";
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
    }
};

window.openEditEmployeeModal = function(empId) {
    const wtData = getWorktimeData();
    const emp = (wtData.employees || []).find(e => e.id === empId);
    if (!emp) return;

    const modal = document.getElementById('worktime-employee-modal');
    const title = document.getElementById('wt-emp-modal-title');
    const deleteBtn = document.getElementById('wt-emp-delete-btn');

    const editIdEl = document.getElementById('wt-emp-edit-id');
    if (editIdEl) editIdEl.value = emp.id;
    const nameEl = document.getElementById('wt-emp-name');
    if (nameEl) nameEl.value = emp.name || '';
    const roleEl = document.getElementById('wt-emp-role');
    if (roleEl) roleEl.value = emp.role || '';
    const weeklyHoursEl = document.getElementById('wt-emp-weekly-hours');
    if (weeklyHoursEl) weeklyHoursEl.value = emp.weeklyHours || 40;
    const initBalEl = document.getElementById('wt-emp-initial-balance');
    if (initBalEl) initBalEl.value = emp.initialBalance || 0;
    const statusEl = document.getElementById('wt-emp-status');
    if (statusEl) statusEl.value = emp.status || 'active';

    if (title) title.textContent = `Mitarbeiter bearbeiten • ${emp.name}`;
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
    }
};

window.closeEmployeeModal = function() {
    const modal = document.getElementById('worktime-employee-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
};

window.handleSaveEmployee = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const editId = document.getElementById('wt-emp-edit-id').value;
    const name = (document.getElementById('wt-emp-name').value || '').trim();
    const role = (document.getElementById('wt-emp-role').value || '').trim();
    const weeklyHours = parseFloat(document.getElementById('wt-emp-weekly-hours').value) || 40;
    const initialBalance = parseFloat(document.getElementById('wt-emp-initial-balance').value) || 0;
    const status = document.getElementById('wt-emp-status').value || 'active';

    if (!name) {
        showToast("Bitte den Namen des Mitarbeiters eingeben.");
        return;
    }

    const wtData = getWorktimeData();
    if (!Array.isArray(wtData.employees)) wtData.employees = [];
    if (!Array.isArray(wtData.entries)) wtData.entries = [];

    if (editId) {
        // Edit existing
        const idx = wtData.employees.findIndex(em => em.id === editId);
        if (idx !== -1) {
            wtData.employees[idx].name = name;
            wtData.employees[idx].role = role;
            wtData.employees[idx].weeklyHours = weeklyHours;
            wtData.employees[idx].initialBalance = initialBalance;
            wtData.employees[idx].status = status;
        }
        showToast(`Mitarbeiter "${name}" aktualisiert.`);
    } else {
        // Add new
        const newEmp = {
            id: 'emp-' + Date.now(),
            name,
            role: role || 'Fachkraft GalaBau',
            weeklyHours,
            initialBalance,
            status
        };
        wtData.employees.push(newEmp);
        showToast(`Mitarbeiter "${name}" erfolgreich angelegt!`);
    }

    saveWorktimeData(wtData);
    closeEmployeeModal();
};

window.promptDeleteEmployee = function(empId) {
    if (!empId) return;
    const wtData = getWorktimeData();
    const emp = (wtData.employees || []).find(e => e.id === empId);
    if (!emp) return;

    const entryCount = (wtData.entries || []).filter(e => e.employeeId === empId).length;
    let msg = `Möchten Sie den Mitarbeiter "${emp.name}" wirklich aus dem Arbeitszeitkonto löschen?`;
    if (entryCount > 0) {
        msg += ` ACHTUNG: Es werden auch alle ${entryCount} gebuchten Überstunden- und Ausgleichseinträge dieses Mitarbeiters unwiderruflich gelöscht!`;
    }

    showAppConfirm(
        msg,
        function() {
            const currentData = getWorktimeData();
            currentData.employees = (currentData.employees || []).filter(e => e.id !== empId);
            currentData.entries = (currentData.entries || []).filter(e => e.employeeId !== empId);

            saveWorktimeData(currentData);
            closeEmployeeModal();
            showToast(`Mitarbeiter "${emp.name}" wurde erfolgreich gelöscht.`);
        },
        {
            title: `Mitarbeiter "${emp.name}" löschen?`,
            confirmText: "Mitarbeiter unwiderruflich löschen",
            cancelText: "Abbrechen",
            btnColor: "#dc2626"
        }
    );
};

window.handleDeleteCurrentEmployee = function() {
    const editId = document.getElementById('wt-emp-edit-id').value;
    if (!editId) return;
    promptDeleteEmployee(editId);
};

// --- Worktime Entry Modal ---

window.openAddWorktimeEntryModal = function(preselectedEmpId, defaultType) {
    const wtData = getWorktimeData();
    const employees = (wtData.employees || []).filter(e => e.status !== 'inactive');
    if (employees.length === 0) {
        showToast("Bitte legen Sie zuerst mindestens einen Mitarbeiter an.");
        openAddEmployeeModal();
        return;
    }

    const modal = document.getElementById('worktime-entry-modal');
    const title = document.getElementById('wt-entry-modal-title');
    const deleteBtn = document.getElementById('wt-entry-delete-btn');
    const form = document.getElementById('wt-entry-form');
    const selectEmp = document.getElementById('wt-entry-employee-id');

    if (form) form.reset();
    document.getElementById('wt-entry-edit-id').value = '';

    // Populate employee select
    if (selectEmp) {
        selectEmp.innerHTML = employees.map(emp => `
            <option value="${emp.id}">${escapeHtml(emp.name)} (${escapeHtml(emp.role || 'Fachkraft')})</option>
        `).join('');
        if (preselectedEmpId) {
            selectEmp.value = preselectedEmpId;
        }
    }

    // Default Date Today
    const today = new Date();
    const dayStr = String(today.getDate()).padStart(2, '0');
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const yearStr = today.getFullYear();
    const dateInput = document.getElementById('wt-entry-date');
    if (dateInput) dateInput.value = `${dayStr}.${monthStr}.${yearStr}`;
    const hoursInput = document.getElementById('wt-entry-hours');
    if (hoursInput) hoursInput.value = '4.0';

    // Type radio
    const chosenType = defaultType || 'aufbau';
    const radios = document.getElementsByName('wt-entry-type-radio');
    radios.forEach(r => {
        r.checked = (r.value === chosenType);
    });
    updateWorktimeTypeVisual(chosenType);

    if (title) title.textContent = chosenType === 'abbau' ? "Freizeitausgleich / Abbau erfassen" : "Überstunden buchen (+ Aufbau)";
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
    }
};

window.openEditWorktimeEntryModal = function(entryId) {
    const wtData = getWorktimeData();
    const entry = (wtData.entries || []).find(e => e.id === entryId);
    if (!entry) return;

    const modal = document.getElementById('worktime-entry-modal');
    const title = document.getElementById('wt-entry-modal-title');
    const deleteBtn = document.getElementById('wt-entry-delete-btn');
    const selectEmp = document.getElementById('wt-entry-employee-id');

    // Populate employee select
    if (selectEmp) {
        selectEmp.innerHTML = (wtData.employees || []).map(emp => `
            <option value="${emp.id}">${escapeHtml(emp.name)} (${escapeHtml(emp.role || 'Fachkraft')})</option>
        `).join('');
        selectEmp.value = entry.employeeId;
    }

    const editIdEl = document.getElementById('wt-entry-edit-id');
    if (editIdEl) editIdEl.value = entry.id;
    const dateEl = document.getElementById('wt-entry-date');
    if (dateEl) dateEl.value = entry.date || '';
    const hoursEl = document.getElementById('wt-entry-hours');
    if (hoursEl) hoursEl.value = entry.hours || 0;
    const purposeEl = document.getElementById('wt-entry-purpose');
    if (purposeEl) purposeEl.value = entry.purpose || '';

    const radios = document.getElementsByName('wt-entry-type-radio');
    radios.forEach(r => {
        r.checked = (r.value === entry.type);
    });
    updateWorktimeTypeVisual(entry.type);

    if (title) title.textContent = "Überstunden-Buchung bearbeiten";
    if (deleteBtn) deleteBtn.style.display = 'inline-block';
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
    }
};

window.closeWorktimeEntryModal = function() {
    const modal = document.getElementById('worktime-entry-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
};

window.updateWorktimeTypeVisual = function(type) {
    const radios = document.getElementsByName('wt-entry-type-radio');
    radios.forEach(r => {
        const parent = r.closest('label');
        if (parent) {
            if (r.checked) {
                parent.style.borderColor = r.value === 'aufbau' ? '#059669' : '#2563eb';
                parent.style.background = r.value === 'aufbau' ? '#ecfdf5' : '#eff6ff';
            } else {
                parent.style.borderColor = '#cbd5e1';
                parent.style.background = '#f8fafc';
            }
        }
    });
};

window.setWorktimeQuickPurpose = function(text) {
    const input = document.getElementById('wt-entry-purpose');
    if (input) {
        input.value = text;
        input.focus();
    }
};

window.handleSaveWorktimeEntry = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const editId = document.getElementById('wt-entry-edit-id').value;
    const employeeId = document.getElementById('wt-entry-employee-id').value;
    const dateStr = (document.getElementById('wt-entry-date').value || '').trim();
    const hours = parseFloat(document.getElementById('wt-entry-hours').value) || 0;
    const purpose = (document.getElementById('wt-entry-purpose').value || '').trim();

    let chosenType = 'aufbau';
    const radios = document.getElementsByName('wt-entry-type-radio');
    radios.forEach(r => {
        if (r.checked) chosenType = r.value;
    });

    if (!employeeId) {
        showToast("Bitte einen Mitarbeiter auswählen.");
        return;
    }
    if (hours <= 0) {
        showToast("Bitte eine Stundenzahl größer 0 angeben.");
        return;
    }
    if (!dateStr) {
        showToast("Bitte ein Datum angeben.");
        return;
    }

    // Parse Month Key & Label
    const dateParts = dateStr.split('.');
    let monthKey = '2026-03';
    let monthLabel = 'März 2026';
    let dateIso = new Date().toISOString().slice(0, 10);

    const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember"
    ];

    if (dateParts.length === 3) {
        const d = dateParts[0].padStart(2, '0');
        const m = dateParts[1].padStart(2, '0');
        const y = dateParts[2].length === 2 ? '20' + dateParts[2] : dateParts[2];
        monthKey = `${y}-${m}`;
        dateIso = `${y}-${m}-${d}`;
        const mIdx = parseInt(m, 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
            monthLabel = `${monthNames[mIdx]} ${y}`;
        }
    }

    const wtData = getWorktimeData();
    const emp = wtData.employees.find(em => em.id === employeeId);
    const empName = emp ? emp.name : 'Mitarbeiter';

    if (editId) {
        const idx = wtData.entries.findIndex(en => en.id === editId);
        if (idx !== -1) {
            wtData.entries[idx] = {
                ...wtData.entries[idx],
                employeeId,
                date: dateStr,
                dateIso,
                monthKey,
                monthLabel,
                type: chosenType,
                hours,
                purpose
            };
        }
        showToast(`Buchung für ${empName} aktualisiert.`);
    } else {
        const newEntry = {
            id: 'wt-' + Date.now(),
            employeeId,
            date: dateStr,
            dateIso,
            monthKey,
            monthLabel,
            type: chosenType,
            hours,
            purpose
        };
        wtData.entries.push(newEntry);
        const actionWord = chosenType === 'aufbau' ? `+${hours.toFixed(1).replace('.', ',')} Überstunden aufgebaut` : `-${hours.toFixed(1).replace('.', ',')} Überstunden abgebaut`;
        showToast(`${empName}: ${actionWord}`);
    }

    saveWorktimeData(wtData);
    closeWorktimeEntryModal();
};

window.handleDeleteCurrentWorktimeEntry = function() {
    const editId = document.getElementById('wt-entry-edit-id').value;
    if (!editId) return;
    deleteWorktimeEntry(editId);
};

window.deleteWorktimeEntry = function(entryId) {
    if (!entryId) return;
    showAppConfirm(
        "Möchten Sie diesen Überstunden-Eintrag wirklich löschen?",
        function() {
            const wtData = getWorktimeData();
            wtData.entries = (wtData.entries || []).filter(e => e.id !== entryId);
            saveWorktimeData(wtData);
            if (typeof closeWorktimeEntryModal === 'function') {
                closeWorktimeEntryModal();
            }
            showToast("Buchung gelöscht.");
        },
        {
            title: "Buchung löschen?",
            confirmText: "Löschen",
            cancelText: "Abbrechen",
            btnColor: "#dc2626"
        }
    );
};

// --- Statement & CSV Export ---

window.openWorktimeStatement = function(empId) {
    const wtData = getWorktimeData();
    const emp = (wtData.employees || []).find(e => e.id === empId);
    if (!emp) return;

    const modal = document.getElementById('worktime-statement-modal');
    const sheet = document.getElementById('worktime-statement-sheet');
    if (!modal || !sheet) return;

    const entries = (wtData.entries || [])
        .filter(e => e.employeeId === emp.id)
        .sort((a, b) => (a.dateIso || a.date).localeCompare(b.dateIso || b.date));

    let runningBalance = parseFloat(emp.initialBalance) || 0;
    let totalAufbau = 0;
    let totalAbbau = 0;

    let rowsHtml = '';
    entries.forEach(e => {
        const h = parseFloat(e.hours) || 0;
        const isAufbau = e.type === 'aufbau';
        if (isAufbau) {
            totalAufbau += h;
            runningBalance += h;
        } else {
            totalAbbau += h;
            runningBalance -= h;
        }

        const typeLabel = isAufbau ? '+ Aufbau (Mehrarbeit)' : '- Abbau (Freizeitausgleich)';
        const typeColor = isAufbau ? '#15803d' : '#2563eb';
        const hoursSign = isAufbau ? '+' : '-';

        rowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 10px; font-weight: 600;">${escapeHtml(e.date)}</td>
                <td style="padding: 8px 10px; color: ${typeColor}; font-weight: 700;">${typeLabel}</td>
                <td style="padding: 8px 10px; font-weight: 800; text-align: right; color: ${typeColor};">${hoursSign}${h.toFixed(1).replace('.', ',')} Std.</td>
                <td style="padding: 8px 10px; color: #334155;">${escapeHtml(e.purpose || '—')}</td>
                <td style="padding: 8px 10px; text-align: right; font-weight: 800; color: #0f172a;">${runningBalance > 0 ? '+' : ''}${runningBalance.toFixed(1).replace('.', ',')} Std.</td>
            </tr>
        `;
    });

    if (entries.length === 0) {
        rowsHtml = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">Keine Buchungen vorhanden.</td></tr>`;
    }

    const finalSign = runningBalance > 0 ? '+' : '';
    const finalColor = runningBalance > 0 ? '#15803d' : (runningBalance < 0 ? '#b91c1c' : '#0f172a');

    sheet.innerHTML = `
        <div style="font-family: inherit; color: #0f172a; line-height: 1.45;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px;">
                <div>
                    <h1 style="font-size: 1.35rem; font-weight: 800; margin: 0 0 4px 0; color: #0f172a;">Palnau Gartenbau GmbH</h1>
                    <div style="font-size: 0.85rem; color: #475569;">Reihelberg 3 • 75210 Keltern • Tel: 07231 466641</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.1rem; font-weight: 800; color: #ea580c;">ARBEITSZEITKONTO-NACHWEIS</div>
                    <div style="font-size: 0.82rem; color: #64748b;">Stand: ${new Date().toLocaleDateString('de-DE')}</div>
                </div>
            </div>

            <!-- Employee Meta Box -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
                <div>
                    <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #64748b; display: block;">Mitarbeiter</span>
                    <strong style="font-size: 1.15rem; color: #0f172a;">${escapeHtml(emp.name)}</strong>
                    <div style="font-size: 0.85rem; color: #475569;">${escapeHtml(emp.role || 'Fachkraft')}</div>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #64748b; display: block;">Wochenarbeitszeit</span>
                    <strong style="font-size: 1rem; color: #0f172a;">${emp.weeklyHours || 40} Stunden / Woche</strong>
                    <div style="font-size: 0.85rem; color: #64748b;">Startsaldo: ${(parseFloat(emp.initialBalance) || 0).toFixed(1).replace('.', ',')} Std.</div>
                </div>
            </div>

            <!-- Ledger Table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                        <th style="padding: 8px 10px;">Datum</th>
                        <th style="padding: 8px 10px;">Vorgang</th>
                        <th style="padding: 8px 10px; text-align: right;">Stunden</th>
                        <th style="padding: 8px 10px;">Einsatz / Grund</th>
                        <th style="padding: 8px 10px; text-align: right;">Stand Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <!-- Summary Box -->
            <div style="display: flex; justify-content: flex-end; margin-bottom: 36px;">
                <div style="width: 320px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 12px 16px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
                        <span>Gesamt Überstunden aufgebaut:</span>
                        <strong style="color: #15803d;">+${totalAufbau.toFixed(1).replace('.', ',')} Std.</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                        <span>Gesamt Freizeitausgleich abgebaut:</span>
                        <strong style="color: #2563eb;">-${totalAbbau.toFixed(1).replace('.', ',')} Std.</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 800; border-top: 1.5px solid #cbd5e1; padding-top: 6px; color: ${finalColor};">
                        <span>Aktuelles Überstunden-Saldo:</span>
                        <span>${finalSign}${runningBalance.toFixed(1).replace('.', ',')} Std.</span>
                    </div>
                </div>
            </div>

            <!-- Signatures -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
                <div>
                    <div style="border-bottom: 1px solid #475569; height: 35px; margin-bottom: 6px;"></div>
                    <div style="font-size: 0.8rem; color: #475569; text-align: center;">Datum, Unterschrift Arbeitnehmer (${escapeHtml(emp.name)})</div>
                </div>
                <div>
                    <div style="border-bottom: 1px solid #475569; height: 35px; margin-bottom: 6px;"></div>
                    <div style="font-size: 0.8rem; color: #475569; text-align: center;">Datum, Unterschrift Palnau Gartenbau GmbH</div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    modal.classList.add('open');
};

window.closeWorktimeStatementModal = function() {
    const modal = document.getElementById('worktime-statement-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
};

window.printWorktimeStatementSheet = function() {
    const sheet = document.getElementById('worktime-statement-sheet');
    if (!sheet) return;

    const printWin = window.open('', '', 'width=850,height=900');
    if (!printWin) {
        window.print();
        return;
    }
    printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Arbeitszeitkonto-Nachweis • Palnau Gartenbau GmbH</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #0f172a; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px 10px; font-size: 13px; }
                @media print {
                    body { margin: 15mm; }
                }
            </style>
        </head>
        <body>
            ${sheet.innerHTML}
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    printWin.document.close();
};

window.exportWorktimeToCsv = function() {
    const wtData = getWorktimeData();
    const employees = wtData.employees || [];
    const entries = wtData.entries || [];

    const rows = [
        ["Datum", "Mitarbeiter", "Position", "Buchungsart", "Stunden", "Monat", "Grund / Baustelle"]
    ];

    entries.forEach(e => {
        const emp = employees.find(em => em.id === e.employeeId);
        const empName = emp ? emp.name : 'Unbekannt';
        const empRole = emp ? (emp.role || '') : '';
        const typeLabel = e.type === 'aufbau' ? 'Aufbau' : 'Abbau';
        const sign = e.type === 'aufbau' ? '+' : '-';
        const hVal = (parseFloat(e.hours) || 0).toFixed(2);

        rows.push([
            `"${e.date}"`,
            `"${empName.replace(/"/g, '""')}"`,
            `"${empRole.replace(/"/g, '""')}"`,
            `"${typeLabel}"`,
            `"${sign}${hVal}"`,
            `"${e.monthLabel || e.monthKey || ''}"`,
            `"${(e.purpose || '').replace(/"/g, '""')}"`
        ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Palnau_Arbeitszeitkonto_Ueberstunden_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Arbeitszeitkonto als CSV exportiert!");
};

/* ==========================================================================
   APP 6: MONATLICHE BETRIEBSAUSGABEN, FIXKOSTEN & SONDERABWEICHUNGEN
   ========================================================================== */

const EXPENSES_STORAGE_KEY = 'palnau_monthly_expenses_v1';

const DEFAULT_EXPENSES_DATA = {
    recurring: [
        {
            id: "rec-1",
            title: "Betriebshof & Lagerhalle Reihelberg 3",
            category: "Miete & Betriebsstätte",
            amount: 1450.00,
            taxRate: 19,
            status: "paid",
            notes: "Monatliche Kaltmiete + Betriebskostenvorauszahlung",
            active: true
        },
        {
            id: "rec-2",
            title: "Löhne & Gehälter (Fachkräfte & Vorarbeiter)",
            category: "Personalkosten",
            amount: 5600.00,
            taxRate: 0,
            status: "paid",
            notes: "Grundlöhne Garten- & Landschaftsbau zzgl. SV-Beiträge",
            active: true
        },
        {
            id: "rec-3",
            title: "Fuhrpark-Leasing (2x Pritschenwagen & Anhänger)",
            category: "Fahrzeuge & Fuhrpark",
            amount: 1280.00,
            taxRate: 19,
            status: "paid",
            notes: "Monatliche Leasingrate Mercedes Sprinter & Tandem-Tieflader",
            active: true
        },
        {
            id: "rec-4",
            title: "Kraftstoff & Diesel Sammelrechnung",
            category: "Fahrzeuge & Fuhrpark",
            amount: 850.00,
            taxRate: 19,
            status: "paid",
            notes: "Tankkarten-Abrechnung Baustellenfahrzeuge & Rüstfahrten",
            active: true
        },
        {
            id: "rec-5",
            title: "Maschinenwartung & Rüstgeräte-Service",
            category: "Werkzeuge & Maschinen",
            amount: 480.00,
            taxRate: 19,
            status: "paid",
            notes: "Wartungsvertrag Stihl Motorsägen, Rüttelplatten & Schneidegeräte",
            active: true
        },
        {
            id: "rec-6",
            title: "Betriebshaftpflicht & BG Bau",
            category: "Versicherungen & Beiträge",
            amount: 420.00,
            taxRate: 0,
            status: "paid",
            notes: "GalaBau-Haftpflicht VHV & Berufsgenossenschaft der Bauwirtschaft",
            active: true
        },
        {
            id: "rec-7",
            title: "Steuerberater, Buchhaltung & IT-Systeme",
            category: "Büro & Beratung",
            amount: 390.00,
            taxRate: 19,
            status: "paid",
            notes: "Monatliche Betreuung Kanzlei Pforzheim & Cloud-Infrastruktur",
            active: true
        },
        {
            id: "rec-8",
            title: "Werbung & Regionale Akquise (Google & Anzeigen)",
            category: "Marketing & Werbung",
            amount: 250.00,
            taxRate: 19,
            status: "paid",
            notes: "Lokales Marketing Keltern, Pforzheim und Enzkreis",
            active: true
        }
    ],
    deviations: []
};

window.expensesSelectedMonth = '09'; // Standardmäßig September
window.expensesSelectedYear = 2026;
window.expensesActiveSubTab = 'month';

// --- Storage Functions ---

window.getExpensesData = function() {
    try {
        const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(DEFAULT_EXPENSES_DATA));
            return JSON.parse(JSON.stringify(DEFAULT_EXPENSES_DATA));
        }
        const parsed = JSON.parse(raw);
        if (!parsed.recurring || !Array.isArray(parsed.recurring)) {
            parsed.recurring = JSON.parse(JSON.stringify(DEFAULT_EXPENSES_DATA.recurring));
        }
        if (!parsed.deviations || !Array.isArray(parsed.deviations)) {
            parsed.deviations = [];
        }

        let needsSave = false;
        const dummyDevIds = ['dev-1', 'dev-2', 'dev-3', 'dev-4', 'dev-5', 'dev-6', 'dev-7'];

        // 1. September-Einträge des Nutzers erfassen und auf alle Monate als Fixkosten übertragen
        const userEntriesToTransfer = [];
        parsed.deviations.forEach(d => {
            const isDummy = dummyDevIds.includes(d.id);
            const isSeptember = d.monthKey === '2026-09' || d.monthKey === '2025-09' || 
                                (typeof d.monthKey === 'string' && d.monthKey.endsWith('-09')) ||
                                (typeof d.date === 'string' && (d.date.includes('.09.') || d.date.includes('/09/'))) ||
                                (typeof d.title === 'string' && d.title.toLowerCase().includes('september')) ||
                                (typeof d.notes === 'string' && d.notes.toLowerCase().includes('september'));

            // Benutzerdefinierte September-Einträge oder vom Benutzer erfasste Sonderausgaben als Fixkosten übernehmen
            if (isSeptember || !isDummy) {
                userEntriesToTransfer.push(d);
            }
        });

        if (userEntriesToTransfer.length > 0) {
            userEntriesToTransfer.forEach(entry => {
                const existingIdx = parsed.recurring.findIndex(r => 
                    String(r.id) === String(entry.id) ||
                    (r.title && entry.title && r.title.trim().toLowerCase() === entry.title.trim().toLowerCase())
                );
                if (existingIdx !== -1) {
                    parsed.recurring[existingIdx] = {
                        ...parsed.recurring[existingIdx],
                        title: entry.title,
                        category: entry.category || parsed.recurring[existingIdx].category || 'Sonstige Ausgaben',
                        amount: parseFloat(entry.amount) || parsed.recurring[existingIdx].amount,
                        taxRate: entry.taxRate !== undefined ? entry.taxRate : parsed.recurring[existingIdx].taxRate,
                        status: entry.status || parsed.recurring[existingIdx].status || 'paid',
                        notes: entry.notes || parsed.recurring[existingIdx].notes || '',
                        active: true
                    };
                } else {
                    parsed.recurring.push({
                        id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                        title: entry.title,
                        category: entry.category || 'Sonstige Ausgaben',
                        amount: parseFloat(entry.amount) || 0,
                        taxRate: entry.taxRate !== undefined ? entry.taxRate : 19,
                        status: entry.status || 'paid',
                        notes: entry.notes || '',
                        active: true
                    });
                }
            });
            needsSave = true;
        }

        // 2. Dummy-Einträge und abweichende Kosten vollständig bereinigen
        if (parsed.deviations.length > 0) {
            parsed.deviations = [];
            needsSave = true;
        }

        if (needsSave) {
            localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(parsed));
        }

        return parsed;
    } catch (e) {
        console.warn("Error reading expenses data, fallback to defaults", e);
        return JSON.parse(JSON.stringify(DEFAULT_EXPENSES_DATA));
    }
};

window.saveExpensesData = function(data) {
    try {
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving expenses data", e);
    }
    if (typeof updateAllAppStatesAndBadges === 'function') {
        updateAllAppStatesAndBadges();
    }
    if (typeof renderPowerBiDashboard === 'function' && currentActiveView === 'quarters') {
        renderPowerBiDashboard();
    }
    if (typeof renderExpensesView === 'function' && currentActiveView === 'expenses') {
        renderExpensesView();
    }
    if (window.PalnauCloudSync && typeof PalnauCloudSync.requestSync === 'function') {
        PalnauCloudSync.requestSync();
    }
};

// --- Financial Calculation Helpers for Single Month & Full Year ---

window.getExpensesForMonth = function(year, monthKeyOrIdx) {
    const data = getExpensesData();
    const curYear = parseInt(year, 10) || 2026;
    let mStr = String(monthKeyOrIdx);
    if (mStr.length === 1) mStr = '0' + mStr;
    if (mStr.includes('-')) {
        mStr = mStr.split('-')[1];
    }
    const fullKey = `${curYear}-${mStr}`;

    let recurringTotal = 0;
    let recurringNet = 0;
    let recurringVat = 0;
    const categoryBreakdown = {};

    // 1. Regular Recurring Costs (active ones)
    (data.recurring || []).forEach(item => {
        if (item.active === false) return;
        const gross = parseFloat(item.amount) || 0;
        const rate = parseFloat(item.taxRate) || 0;
        const net = rate > 0 ? (gross / (1 + rate / 100)) : gross;
        const vat = gross - net;

        recurringTotal += gross;
        recurringNet += net;
        recurringVat += vat;

        const cat = item.category || 'Sonstige Ausgaben';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + gross;
    });

    // 2. Month-specific deviations (Sonderausgaben / Abweichungen)
    let deviationsTotal = 0;
    let deviationsNet = 0;
    let deviationsVat = 0;
    const deviationsList = [];

    (data.deviations || []).forEach(item => {
        if (item.monthKey === fullKey) {
            const gross = parseFloat(item.amount) || 0;
            const rate = parseFloat(item.taxRate) || 0;
            const net = rate > 0 ? (gross / (1 + rate / 100)) : gross;
            const vat = gross - net;

            deviationsTotal += gross;
            deviationsNet += net;
            deviationsVat += vat;

            const cat = item.category || 'Sonstige Ausgaben';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + gross;
            deviationsList.push(item);
        }
    });

    const totalGross = recurringTotal + deviationsTotal;
    const totalNet = recurringNet + deviationsNet;
    const estimatedVat = recurringVat + deviationsVat;

    return {
        year: curYear,
        monthStr: mStr,
        fullKey,
        totalGross,
        totalNet,
        estimatedVat,
        recurringTotal,
        deviationsTotal,
        categoryBreakdown,
        deviationsList,
        count: (data.recurring || []).filter(r => r.active !== false).length + deviationsList.length
    };
};

window.getExpensesForYear = function(year) {
    const curYear = parseInt(year, 10) || 2026;
    const data = getExpensesData();

    let totalGross = 0;
    let totalNet = 0;
    let totalVat = 0;
    let totalRecurring = 0;
    let totalDeviations = 0;
    const categoryBreakdown = {};
    const allDeviations = [];

    // Recurring costs run 12 times a year
    (data.recurring || []).forEach(item => {
        if (item.active === false) return;
        const grossMonthly = parseFloat(item.amount) || 0;
        const rate = parseFloat(item.taxRate) || 0;
        const netMonthly = rate > 0 ? (grossMonthly / (1 + rate / 100)) : grossMonthly;
        const vatMonthly = grossMonthly - netMonthly;

        const grossAnnual = grossMonthly * 12;
        const netAnnual = netMonthly * 12;
        const vatAnnual = vatMonthly * 12;

        totalGross += grossAnnual;
        totalNet += netAnnual;
        totalVat += vatAnnual;
        totalRecurring += grossAnnual;

        const cat = item.category || 'Sonstige Ausgaben';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + grossAnnual;
    });

    // Year deviations
    (data.deviations || []).forEach(item => {
        if ((item.monthKey || '').startsWith(String(curYear))) {
            const gross = parseFloat(item.amount) || 0;
            const rate = parseFloat(item.taxRate) || 0;
            const net = rate > 0 ? (gross / (1 + rate / 100)) : gross;
            const vat = gross - net;

            totalGross += gross;
            totalNet += net;
            totalVat += vat;
            totalDeviations += gross;

            const cat = item.category || 'Sonstige Ausgaben';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + gross;
            allDeviations.push(item);
        }
    });

    return {
        year: curYear,
        totalGross,
        totalNet,
        totalVat,
        totalRecurring,
        totalDeviations,
        categoryBreakdown,
        allDeviations
    };
};

// --- View Subtabs & Filters ---

window.switchExpensesSubTab = function(subTab) {
    window.expensesActiveSubTab = subTab;

    const views = {
        'month': document.getElementById('exp-view-month'),
        'recurring': document.getElementById('exp-view-recurring'),
        'matrix': document.getElementById('exp-view-matrix')
    };

    Object.entries(views).forEach(([k, el]) => {
        if (el) el.style.display = (k === subTab) ? 'block' : 'none';
    });

    const buttons = {
        'month': document.getElementById('btn-exp-tab-month'),
        'recurring': document.getElementById('btn-exp-tab-recurring'),
        'matrix': document.getElementById('btn-exp-tab-matrix')
    };

    Object.entries(buttons).forEach(([k, btn]) => {
        if (btn) btn.classList.toggle('active', k === subTab);
    });

    renderExpensesView();
};

window.setExpensesMonthFilter = function(monthStr) {
    if (monthStr.length === 1) monthStr = '0' + monthStr;
    window.expensesSelectedMonth = monthStr;
    renderExpensesView();
    if (typeof updateAllAppStatesAndBadges === 'function') {
        updateAllAppStatesAndBadges();
    }
};

window.setExpensesYearFilter = function(year, btnEl) {
    window.expensesSelectedYear = year;
    const parent = btnEl ? btnEl.parentElement : document.getElementById('exp-year-pills');
    if (parent) {
        parent.querySelectorAll('.neu-filter-pill').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');
    }
    renderExpensesView();
    if (typeof updateAllAppStatesAndBadges === 'function') {
        updateAllAppStatesAndBadges();
    }
};

// --- Expenses UI Rendering ---

window.renderExpensesView = function() {
    const curYear = window.expensesSelectedYear === 'all' ? 2026 : (parseInt(window.expensesSelectedYear, 10) || 2026);
    const curMonth = window.expensesSelectedMonth || '03';
    const monthIdx = parseInt(curMonth, 10) - 1;
    const monthName = GERMAN_MONTH_NAMES[monthIdx] || 'März';

    const monthExp = getExpensesForMonth(curYear, curMonth);
    const yearExp = getExpensesForYear(curYear);

    // 1. Month Pills Bar
    const pillsContainer = document.getElementById('exp-month-pills');
    if (pillsContainer) {
        let pillsHtml = '';
        for (let m = 0; m < 12; m++) {
            const mKey = String(m + 1).padStart(2, '0');
            const isSel = (mKey === curMonth);
            const mStat = getExpensesForMonth(curYear, mKey);
            const hasDev = (mStat.deviationsList && mStat.deviationsList.length > 0);
            pillsHtml += `
                <button type="button" class="neu-filter-pill ${isSel ? 'active' : ''}" onclick="setExpensesMonthFilter('${mKey}')" style="position: relative; display: flex; align-items: center; gap: 4px;">
                    <span>${GERMAN_MONTH_SHORT[m]}</span>
                    ${hasDev ? '<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #e11d48;" title="Monats-Abweichung vorhanden"></span>' : ''}
                </button>
            `;
        }
        pillsContainer.innerHTML = pillsHtml;
    }

    // 2. KPI Ribbon
    const elPeriod = document.getElementById('exp-kpi-period-badge');
    const elTotVal = document.getElementById('exp-kpi-total-val');
    const elTotSub = document.getElementById('exp-kpi-total-sub');
    const elRecVal = document.getElementById('exp-kpi-recurring-val');
    const elRecSub = document.getElementById('exp-kpi-recurring-sub');
    const elDevVal = document.getElementById('exp-kpi-deviations-val');
    const elDevSub = document.getElementById('exp-kpi-deviations-sub');
    const elAnnVal = document.getElementById('exp-kpi-annual-val');

    if (elPeriod) elPeriod.textContent = `${monthName} ${curYear}`;
    if (elTotVal) elTotVal.textContent = formatCurrency(monthExp.totalGross);
    if (elTotSub) elTotSub.textContent = `Netto: ${formatCurrency(monthExp.totalNet)} | MwSt: ${formatCurrency(monthExp.estimatedVat)}`;
    if (elRecVal) elRecVal.textContent = formatCurrency(monthExp.recurringTotal);
    if (elRecSub) elRecSub.textContent = `Laufende Basis jeden Monat`;
    if (elDevVal) elDevVal.textContent = formatCurrency(monthExp.deviationsTotal);
    if (elDevSub) elDevSub.textContent = `${monthExp.deviationsList.length} Abweichung(en) in ${monthName}`;
    if (elAnnVal) elAnnVal.textContent = formatCurrency(yearExp.totalGross);

    // 3. Tab 1: Monats-Ausgaben & Abweichungen
    const devTitle = document.getElementById('exp-deviations-section-title');
    if (devTitle) devTitle.textContent = `Monatsspezifische Abweichungen & Sonderausgaben (${monthName} ${curYear})`;

    const devContainer = document.getElementById('exp-deviations-container');
    if (devContainer) {
        if (monthExp.deviationsList.length === 0) {
            devContainer.innerHTML = `
                <div style="padding: 24px; text-align: center; color: #64748b;">
                    <div style="font-size: 1.5rem; margin-bottom: 6px;">✨</div>
                    <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Keine Sonderabweichungen für ${monthName} ${curYear}</strong>
                    <p style="font-size: 0.85rem; color: #94a3b8; margin: 0 0 14px 0;">In diesem Monat gelten ausschließlich die regulären monatlichen Fixkosten.</p>
                    <button type="button" class="neu-btn neu-btn-primary" onclick="openAddExpenseModal('deviation')" style="font-size: 0.8rem; padding: 6px 14px;">
                        + Erste Monatsabweichung für ${monthName} erfassen
                    </button>
                </div>
            `;
        } else {
            let tableRows = '';
            monthExp.deviationsList.forEach(dev => {
                const statusCls = dev.status === 'paid' ? 'paid' : 'planned';
                const statusTxt = dev.status === 'paid' ? '✓ Bezahlt' : '⏳ Geplant';
                tableRows += `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">${escapeHtml(dev.date || dev.monthKey)}</td>
                        <td style="padding: 10px 14px;">
                            <strong style="display: block; color: #0f172a; font-size: 0.9rem;">${escapeHtml(dev.title)}</strong>
                            ${dev.notes ? `<span style="font-size: 0.75rem; color: #64748b;">${escapeHtml(dev.notes)}</span>` : ''}
                        </td>
                        <td style="padding: 10px 14px;">
                            <span class="expenses-category-tag">${escapeHtml(dev.category || 'Sonstiges')}</span>
                        </td>
                        <td style="padding: 10px 14px; text-align: right; font-weight: 800; color: #be123c; font-size: 0.95rem;">
                            ${formatCurrency(dev.amount)}
                        </td>
                        <td style="padding: 10px 14px; text-align: center; font-size: 0.8rem; color: #64748b;">
                            ${dev.taxRate || 0}% MwSt
                        </td>
                        <td style="padding: 10px 14px; text-align: center;">
                            <span class="expenses-status-pill ${statusCls}">${statusTxt}</span>
                        </td>
                        <td style="padding: 10px 14px; text-align: right; white-space: nowrap;">
                            <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end;">
                                <button type="button" class="neu-btn" onclick="openEditExpenseModal('${dev.id}', true)" title="Abweichung bearbeiten" style="padding: 5px 10px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    <span>Bearbeiten</span>
                                </button>
                                <button type="button" class="neu-btn neu-btn-danger" onclick="deleteExpenseItem('${dev.id}', true)" title="Abweichung löschen" style="padding: 5px 8px; font-size: 0.8rem; display: inline-flex; align-items: center;">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            devContainer.innerHTML = `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="background: #fff1f2; border-bottom: 2px solid #fecdd3; text-align: left; font-size: 0.75rem; color: #9f1239; text-transform: uppercase;">
                                <th style="padding: 8px 14px;">Belegdatum</th>
                                <th style="padding: 8px 14px;">Bezeichnung / Zweck</th>
                                <th style="padding: 8px 14px;">Kategorie</th>
                                <th style="padding: 8px 14px; text-align: right;">Betrag (Brutto)</th>
                                <th style="padding: 8px 14px; text-align: center;">Vorsteuer</th>
                                <th style="padding: 8px 14px; text-align: center;">Status</th>
                                <th style="padding: 8px 14px; text-align: right;">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            `;
        }
    }

    const recTitle = document.getElementById('exp-recurring-section-title');
    if (recTitle) recTitle.textContent = `Reguläre monatliche Fixkosten-Blöcke (${monthName} ${curYear})`;

    const recContainer = document.getElementById('exp-recurring-container');
    if (recContainer) {
        const data = getExpensesData();
        const activeRecurring = (data.recurring || []).filter(r => r.active !== false);

        let recRows = '';
        activeRecurring.forEach(r => {
            recRows += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 14px;">
                        <strong style="color: #0f172a; font-size: 0.88rem;">${escapeHtml(r.title)}</strong>
                        ${r.notes ? `<div style="font-size: 0.74rem; color: #64748b;">${escapeHtml(r.notes)}</div>` : ''}
                    </td>
                    <td style="padding: 10px 14px;">
                        <span class="expenses-category-tag">${escapeHtml(r.category || 'Fixkosten')}</span>
                    </td>
                    <td style="padding: 10px 14px; text-align: right; font-weight: 800; color: #0284c7; font-size: 0.92rem;">
                        ${formatCurrency(r.amount)}
                    </td>
                    <td style="padding: 10px 14px; text-align: center; font-size: 0.8rem; color: #64748b;">
                        ${r.taxRate || 0}% MwSt
                    </td>
                    <td style="padding: 10px 14px; text-align: center;">
                        <span class="expenses-status-pill paid">Dauerhaft aktiv</span>
                    </td>
                    <td style="padding: 10px 14px; text-align: right; white-space: nowrap;">
                        <button type="button" class="neu-btn" onclick="openEditExpenseModal('${r.id}', false)" title="Fixkosten anpassen" style="padding: 5px 12px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            <span>Anpassen</span>
                        </button>
                    </td>
                </tr>
            `;
        });

        recContainer.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 0.75rem; color: #475569; text-transform: uppercase;">
                            <th style="padding: 8px 14px;">Kostenblock</th>
                            <th style="padding: 8px 14px;">Kategorie</th>
                            <th style="padding: 8px 14px; text-align: right;">Monatlicher Betrag</th>
                            <th style="padding: 8px 14px; text-align: center;">Vorsteuer</th>
                            <th style="padding: 8px 14px; text-align: center;">Status</th>
                            <th style="padding: 8px 14px; text-align: right;">Aktion</th>
                        </tr>
                    </thead>
                    <tbody>${recRows}</tbody>
                </table>
            </div>
        `;
    }

    // 4. Tab 2: Master-Vorlage
    const masterContainer = document.getElementById('exp-master-recurring-container');
    if (masterContainer) {
        const data = getExpensesData();
        let masterRows = '';
        (data.recurring || []).forEach(r => {
            const isActive = r.active !== false;
            masterRows += `
                <tr style="border-bottom: 1px solid #f1f5f9; ${isActive ? '' : 'opacity: 0.5;'}">
                    <td style="padding: 10px 14px;">
                        <strong style="color: #0f172a; font-size: 0.88rem;">${escapeHtml(r.title)}</strong>
                        ${r.notes ? `<div style="font-size: 0.74rem; color: #64748b;">${escapeHtml(r.notes)}</div>` : ''}
                    </td>
                    <td style="padding: 10px 14px;">
                        <span class="expenses-category-tag">${escapeHtml(r.category || 'Fixkosten')}</span>
                    </td>
                    <td style="padding: 10px 14px; text-align: right; font-weight: 800; color: #0f172a; font-size: 0.92rem;">
                        ${formatCurrency(r.amount)}
                    </td>
                    <td style="padding: 10px 14px; text-align: center; font-size: 0.8rem; color: #64748b;">
                        ${r.taxRate || 0}% MwSt
                    </td>
                    <td style="padding: 10px 14px; text-align: center;">
                        <button type="button" class="neu-btn" onclick="toggleRecurringExpenseActive('${r.id}')" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 700; ${isActive ? 'background: #dcfce7; color: #15803d;' : 'background: #fee2e2; color: #b91c1c;'}">
                            ${isActive ? '✓ Aktiv' : '✕ Pausiert'}
                        </button>
                    </td>
                    <td style="padding: 10px 14px; text-align: right; white-space: nowrap;">
                        <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end;">
                            <button type="button" class="neu-btn" onclick="openEditExpenseModal('${r.id}', false)" title="Fixkosten bearbeiten" style="padding: 5px 10px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                <span>Bearbeiten</span>
                            </button>
                            <button type="button" class="neu-btn neu-btn-danger" onclick="deleteExpenseItem('${r.id}', false)" title="Fixkosten löschen" style="padding: 5px 8px; font-size: 0.8rem; display: inline-flex; align-items: center;">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        masterContainer.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 0.75rem; color: #475569; text-transform: uppercase;">
                            <th style="padding: 8px 14px;">Kostenblock</th>
                            <th style="padding: 8px 14px;">Kategorie</th>
                            <th style="padding: 8px 14px; text-align: right;">Monatlicher Betrag</th>
                            <th style="padding: 8px 14px; text-align: center;">Vorsteuer</th>
                            <th style="padding: 8px 14px; text-align: center;">Status</th>
                            <th style="padding: 8px 14px; text-align: right;">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>${masterRows}</tbody>
                </table>
            </div>
        `;
    }

    // 5. Tab 3: 12-Monate Matrix
    const matrixYearLabel = document.getElementById('exp-matrix-year-label');
    if (matrixYearLabel) matrixYearLabel.textContent = String(curYear);

    const matrixContainer = document.getElementById('exp-matrix-container');
    if (matrixContainer) {
        const categories = [
            "Personalkosten",
            "Miete & Betriebsstätte",
            "Fahrzeuge & Fuhrpark",
            "Werkzeuge & Maschinen",
            "Material & Sonderausgaben",
            "Versicherungen & Beiträge",
            "Büro & Beratung",
            "Marketing & Werbung",
            "Sonstige Ausgaben"
        ];

        // Gather 12 months stats
        const monthlyData = [];
        for (let m = 0; m < 12; m++) {
            const mKey = String(m + 1).padStart(2, '0');
            monthlyData.push(getExpensesForMonth(curYear, mKey));
        }

        let headerMonthsHtml = '';
        for (let m = 0; m < 12; m++) {
            headerMonthsHtml += `<th style="text-align: right; padding: 8px 10px;">${GERMAN_MONTH_SHORT[m]}</th>`;
        }

        let catRowsHtml = '';
        categories.forEach(cat => {
            let rowAnnual = 0;
            let cellsHtml = '';
            for (let m = 0; m < 12; m++) {
                const val = (monthlyData[m].categoryBreakdown && monthlyData[m].categoryBreakdown[cat]) || 0;
                rowAnnual += val;
                cellsHtml += `<td style="text-align: right; padding: 8px 10px; color: ${val > 0 ? '#0f172a' : '#cbd5e1'}; font-weight: ${val > 0 ? '600' : 'normal'};">${val > 0 ? formatCurrency(val) : '—'}</td>`;
            }
            catRowsHtml += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 14px; font-weight: 700; color: #334155; white-space: nowrap;">${escapeHtml(cat)}</td>
                    ${cellsHtml}
                    <td style="text-align: right; padding: 8px 14px; font-weight: 800; color: #be123c; background: #fff1f2;">${formatCurrency(rowAnnual)}</td>
                </tr>
            `;
        });

        // Total Row
        let totalCellsHtml = '';
        let grandAnnual = 0;
        for (let m = 0; m < 12; m++) {
            const mTot = monthlyData[m].totalGross;
            grandAnnual += mTot;
            totalCellsHtml += `<td style="text-align: right; padding: 10px 10px; font-weight: 800; color: #0f172a;">${formatCurrency(mTot)}</td>`;
        }

        matrixContainer.innerHTML = `
            <table class="expenses-matrix-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 10px 14px;">Kategorie</th>
                        ${headerMonthsHtml}
                        <th style="text-align: right; padding: 10px 14px; background: #fecdd3; color: #881337;">Jahressumme</th>
                    </tr>
                </thead>
                <tbody>
                    ${catRowsHtml}
                </tbody>
                <tfoot>
                    <tr style="border-top: 2px solid #0f172a; background: #f8fafc;">
                        <td style="padding: 10px 14px; font-weight: 800; color: #0f172a;">GESAMTAUSGABEN</td>
                        ${totalCellsHtml}
                        <td style="text-align: right; padding: 10px 14px; font-weight: 900; color: #e11d48; font-size: 0.95rem; background: #fecdd3;">${formatCurrency(grandAnnual)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    }
};

// --- Modal & Form Actions ---

window.openAddExpenseModal = function(mode) {
    const modal = document.getElementById('expense-entry-modal');
    const titleEl = document.getElementById('exp-modal-title');
    const deleteBtn = document.getElementById('exp-delete-btn');
    const form = document.getElementById('exp-entry-form');

    if (form) form.reset();
    document.getElementById('exp-edit-id').value = '';

    const isDev = (mode === 'deviation');
    const devRadio = document.getElementById('exp-mode-deviation');
    const recRadio = document.getElementById('exp-mode-recurring');
    if (devRadio && recRadio) {
        devRadio.checked = isDev;
        recRadio.checked = !isDev;
    }
    toggleExpenseModalType(isDev ? 'deviation' : 'recurring');

    // Default target month & date
    const curYear = window.expensesSelectedYear === 'all' ? 2026 : (parseInt(window.expensesSelectedYear, 10) || 2026);
    const curMonth = window.expensesSelectedMonth || '03';
    const monthSelect = document.getElementById('exp-target-month');
    if (monthSelect) monthSelect.value = `${curYear}-${curMonth}`;

    const dateInput = document.getElementById('exp-target-date');
    if (dateInput) {
        const today = new Date();
        const dStr = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${dStr}.${curMonth}.${curYear}`;
    }

    if (titleEl) titleEl.textContent = isDev ? "Monats-Abweichung / Sonderausgabe erfassen" : "Regulären Fixkosten-Block erfassen";
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
    }
};

window.openEditExpenseModal = function(id, isDeviation) {
    const data = getExpensesData();
    data.recurring = data.recurring || [];
    data.deviations = data.deviations || [];

    const idStr = String(id || '');
    let isDev = (isDeviation === true || isDeviation === 'true' || isDeviation === 'dev');
    let item = null;

    if (isDev) {
        item = data.deviations.find(d => String(d.id) === idStr);
        if (!item) {
            item = data.recurring.find(r => String(r.id) === idStr);
            if (item) isDev = false;
        }
    } else {
        item = data.recurring.find(r => String(r.id) === idStr);
        if (!item) {
            item = data.deviations.find(d => String(d.id) === idStr);
            if (item) isDev = true;
        }
    }

    if (!item) {
        console.warn("Ausgabe konnte nicht gefunden werden für ID:", id);
        showToast("Ausgabe konnte nicht gefunden werden.");
        return;
    }

    const modal = document.getElementById('expense-entry-modal');
    const form = document.getElementById('exp-entry-form');
    if (form) form.reset();

    const titleEl = document.getElementById('exp-modal-title');
    const deleteBtn = document.getElementById('exp-delete-btn');
    const editIdEl = document.getElementById('exp-edit-id');

    if (editIdEl) {
        editIdEl.value = (isDev ? 'dev:' : 'rec:') + String(item.id);
    }

    const devRadio = document.getElementById('exp-mode-deviation');
    const recRadio = document.getElementById('exp-mode-recurring');
    if (devRadio && recRadio) {
        devRadio.checked = isDev;
        recRadio.checked = !isDev;
    }
    toggleExpenseModalType(isDev ? 'deviation' : 'recurring');

    const monthSelect = document.getElementById('exp-target-month');
    if (monthSelect) {
        if (item.monthKey) {
            monthSelect.value = item.monthKey;
        } else {
            const curYear = window.expensesSelectedYear === 'all' ? 2026 : (parseInt(window.expensesSelectedYear, 10) || 2026);
            const curMonth = window.expensesSelectedMonth || '09';
            monthSelect.value = `${curYear}-${curMonth}`;
        }
    }

    const dateInput = document.getElementById('exp-target-date');
    if (dateInput) {
        dateInput.value = item.date || '';
    }

    const titleInput = document.getElementById('exp-title-input');
    if (titleInput) {
        titleInput.value = item.title || '';
    }

    const catInput = document.getElementById('exp-category-input');
    if (catInput) {
        catInput.value = item.category || 'Sonstige Ausgaben';
        if (item.category && catInput.value !== item.category) {
            const opt = document.createElement('option');
            opt.value = item.category;
            opt.textContent = item.category;
            opt.selected = true;
            catInput.appendChild(opt);
        }
    }

    const amtInput = document.getElementById('exp-amount-input');
    if (amtInput) {
        amtInput.value = (item.amount !== undefined && item.amount !== null) ? item.amount : '';
    }

    const taxInput = document.getElementById('exp-tax-rate-input');
    if (taxInput) {
        taxInput.value = String(item.taxRate !== undefined ? item.taxRate : 19);
    }

    const statusInput = document.getElementById('exp-status-input');
    if (statusInput) {
        statusInput.value = item.status || 'paid';
    }

    const notesInput = document.getElementById('exp-notes-input');
    if (notesInput) {
        notesInput.value = item.notes || '';
    }

    if (titleEl) {
        titleEl.textContent = isDev ? "Monats-Abweichung bearbeiten" : "Fixkosten-Vorlage anpassen";
    }
    if (deleteBtn) {
        deleteBtn.style.display = 'inline-flex';
    }
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
    }
};

window.closeExpenseModal = function() {
    const modal = document.getElementById('expense-entry-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
    const editIdEl = document.getElementById('exp-edit-id');
    if (editIdEl) editIdEl.value = '';
};

window.toggleExpenseModalType = function(mode) {
    const monthRow = document.getElementById('exp-month-select-row');
    if (monthRow) {
        monthRow.style.display = (mode === 'deviation') ? 'grid' : 'none';
    }
};

window.handleSaveExpense = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const editIdStr = (document.getElementById('exp-edit-id')?.value || '').trim();
    const title = (document.getElementById('exp-title-input')?.value || '').trim();
    const amount = parseFloat(document.getElementById('exp-amount-input')?.value) || 0;
    const category = document.getElementById('exp-category-input')?.value || 'Sonstige Ausgaben';
    const taxRate = parseFloat(document.getElementById('exp-tax-rate-input')?.value) || 0;
    const status = document.getElementById('exp-status-input')?.value || 'paid';
    const notes = (document.getElementById('exp-notes-input')?.value || '').trim();

    let isDeviation = true;
    const devRadio = document.getElementById('exp-mode-deviation');
    if (devRadio) isDeviation = devRadio.checked;

    if (!title) {
        showToast("Bitte eine Bezeichnung für die Ausgabe angeben.");
        return;
    }
    if (amount <= 0) {
        showToast("Bitte einen Betrag größer 0,00 € angeben.");
        return;
    }

    const data = getExpensesData();
    data.recurring = data.recurring || [];
    data.deviations = data.deviations || [];

    if (editIdStr) {
        // UPDATE MODE: Vorhandenen Eintrag im State präzise überschreiben, keine Duplikate erzeugen!
        const rawId = editIdStr.replace(/^(dev:|rec:)/, '');
        const foundInDevIdx = data.deviations.findIndex(d => String(d.id) === String(rawId));
        const foundInRecIdx = data.recurring.findIndex(r => String(r.id) === String(rawId));

        if (isDeviation) {
            const monthKey = document.getElementById('exp-target-month')?.value || '2026-09';
            const date = (document.getElementById('exp-target-date')?.value || '').trim() || new Date().toLocaleDateString('de-DE');

            if (foundInDevIdx !== -1) {
                // Abweichung in place überschreiben
                data.deviations[foundInDevIdx] = {
                    ...data.deviations[foundInDevIdx],
                    title,
                    amount,
                    category,
                    taxRate,
                    status,
                    notes,
                    monthKey,
                    date
                };
            } else if (foundInRecIdx !== -1) {
                // War vorher Fixkosten, jetzt als Monats-Abweichung gespeichert
                data.recurring.splice(foundInRecIdx, 1);
                data.deviations.push({
                    id: rawId.startsWith('dev-') ? rawId : ('dev-' + Date.now()),
                    monthKey,
                    date,
                    title,
                    amount,
                    category,
                    taxRate,
                    status,
                    notes
                });
            } else {
                // Fallback
                data.deviations.push({
                    id: 'dev-' + Date.now(),
                    monthKey,
                    date,
                    title,
                    amount,
                    category,
                    taxRate,
                    status,
                    notes
                });
            }
            showToast(`Monats-Abweichung „${title}“ aktualisiert.`);
        } else {
            // Fixkosten-Block
            if (foundInRecIdx !== -1) {
                // Bestehenden Fixkosten-Eintrag in place überschreiben
                data.recurring[foundInRecIdx] = {
                    ...data.recurring[foundInRecIdx],
                    title,
                    amount,
                    category,
                    taxRate,
                    status,
                    notes,
                    active: data.recurring[foundInRecIdx].active !== false
                };
            } else if (foundInDevIdx !== -1) {
                // War vorher Abweichung, jetzt dauerhafte Fixkosten
                data.deviations.splice(foundInDevIdx, 1);
                data.recurring.push({
                    id: rawId.startsWith('rec-') ? rawId : ('rec-' + Date.now()),
                    title,
                    amount,
                    category,
                    taxRate,
                    status,
                    notes,
                    active: true
                });
            } else {
                // Fallback
                data.recurring.push({
                    id: 'rec-' + Date.now(),
                    title,
                    amount,
                    category,
                    taxRate,
                    status,
                    notes,
                    active: true
                });
            }
            showToast(`Fixkosten-Block „${title}“ aktualisiert.`);
        }
    } else {
        // NEUER EINTRAG
        if (isDeviation) {
            const monthKey = document.getElementById('exp-target-month')?.value || '2026-09';
            const date = (document.getElementById('exp-target-date')?.value || '').trim() || new Date().toLocaleDateString('de-DE');
            const newDev = {
                id: 'dev-' + Date.now(),
                monthKey,
                date,
                title,
                category,
                amount,
                taxRate,
                status,
                notes
            };
            data.deviations.push(newDev);
            showToast(`Monats-Abweichung „${title}“ (${formatCurrency(amount)}) gespeichert.`);
        } else {
            const newRec = {
                id: 'rec-' + Date.now(),
                title,
                category,
                amount,
                taxRate,
                status,
                notes,
                active: true
            };
            data.recurring.push(newRec);
            showToast(`Laufender Fixkostenblock „${title}“ (${formatCurrency(amount)}/Monat) angelegt.`);
        }
    }

    const editIdEl = document.getElementById('exp-edit-id');
    if (editIdEl) editIdEl.value = '';

    saveExpensesData(data);
    closeExpenseModal();
};

window.handleDeleteCurrentExpense = function() {
    const editIdStr = (document.getElementById('exp-edit-id')?.value || '').trim();
    if (!editIdStr) return;
    const isDevItem = editIdStr.startsWith('dev:');
    const rawId = editIdStr.replace(/^(dev:|rec:)/, '');
    deleteExpenseItem(rawId, isDevItem);
};

window.deleteExpenseItem = function(id, isDeviation) {
    const promptText = isDeviation 
        ? "Möchten Sie diese Monats-Abweichung wirklich löschen?" 
        : "Möchten Sie diesen wiederkehrenden Fixkostenblock wirklich dauerhaft löschen?";

    showAppConfirm(
        promptText,
        function() {
            const data = getExpensesData();
            const idStr = String(id);
            data.deviations = (data.deviations || []).filter(d => String(d.id) !== idStr);
            data.recurring = (data.recurring || []).filter(r => String(r.id) !== idStr);
            saveExpensesData(data);
            closeExpenseModal();
            showToast("Ausgabe gelöscht.");
        },
        {
            title: "Ausgabe löschen?",
            confirmText: "Löschen",
            cancelText: "Abbrechen",
            btnColor: "#dc2626"
        }
    );
};

window.toggleRecurringExpenseActive = function(id) {
    const data = getExpensesData();
    const item = (data.recurring || []).find(r => r.id === id);
    if (!item) return;
    item.active = (item.active === false) ? true : false;
    saveExpensesData(data);
    showToast(`Fixkostenblock „${item.title}“ ist nun ${item.active ? 'aktiv' : 'pausiert'}.`);
};

window.exportExpensesToCsv = function() {
    const curYear = window.expensesSelectedYear === 'all' ? 2026 : (parseInt(window.expensesSelectedYear, 10) || 2026);
    const data = getExpensesData();

    const rows = [
        ["Typ", "Monat / Belegdatum", "Bezeichnung / Kostenblock", "Kategorie", "Betrag Brutto", "Vorsteuersatz", "Status", "Notizen"]
    ];

    // Master Recurring
    (data.recurring || []).forEach(r => {
        rows.push([
            "Dauerhafte Fixkosten",
            "Jeden Monat",
            `"${(r.title || '').replace(/"/g, '""')}"`,
            `"${(r.category || '').replace(/"/g, '""')}"`,
            (parseFloat(r.amount) || 0).toFixed(2),
            `${r.taxRate || 0}%`,
            r.active !== false ? "Aktiv" : "Pausiert",
            `"${(r.notes || '').replace(/"/g, '""')}"`
        ]);
    });

    // Deviations
    (data.deviations || []).forEach(d => {
        rows.push([
            "Monats-Abweichung",
            d.date || d.monthKey,
            `"${(d.title || '').replace(/"/g, '""')}"`,
            `"${(d.category || '').replace(/"/g, '""')}"`,
            (parseFloat(d.amount) || 0).toFixed(2),
            `${d.taxRate || 0}%`,
            d.status === 'paid' ? "Bezahlt" : "Geplant",
            `"${(d.notes || '').replace(/"/g, '""')}"`
        ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Palnau_Gartenbau_Betriebsausgaben_${curYear}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Ausgaben- und Kostenplan als CSV exportiert!");
};




