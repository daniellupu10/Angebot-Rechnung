/**
 * Palnau Gartenbau GmbH - Modern Neumorphic Studio Suite Engine
 * Fixed Company: Reihelberg 3, 75210 Keltern-Dietlingen
 * Tel: 07231 466641 | Email: gartenbauu@gmail.com | IBAN: DE66 6665 0085 0005 9928 34
 * Geschäftsführer: Andrei Priala
 */

// Application State
let appState = {
    docType: "rechnung", // "rechnung" | "angebot"
    docNumber: generateDocNumber("rechnung"),
    docDate: formatDateForGermanDisplay(new Date()),
    servicePeriod: getCurrentMonthGerman(),
    taxRate: 19,
    client: {
        name: "",
        street: "",
        zipCity: ""
    },
    items: [],
    notesText: "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten genannte Bankkonto."
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

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAuthOnLoad();
    initApp();
    setupEventListeners();
    setupCatalogModal();
    renderAll();
    updateAllAppStatesAndBadges();
});

function initApp() {
    const saved = localStorage.getItem('palnau_neu_studio_state');
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.warn("Could not load draft, resetting", e);
            startCleanState();
        }
    } else {
        startCleanState();
    }
}

function startCleanState() {
    appState = {
        docType: "rechnung",
        docNumber: generateDocNumber("rechnung"),
        docDate: formatDateForGermanDisplay(new Date()),
        servicePeriod: getCurrentMonthGerman(),
        taxRate: 19,
        client: {
            name: "",
            street: "",
            zipCity: ""
        },
        items: [],
        notesText: "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten genannte Bankkonto."
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
        appState.notesText = "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten genannte Bankkonto.";
    }

    renderAll();
    saveState();
    showToast(`Umschaltung: ${type === 'angebot' ? 'Angebot' : 'Rechnung'}`);
}

// Quick Notes Preset Helper (Exposed globally)
window.setNotesPreset = function(preset) {
    if (preset === '14tage') {
        appState.notesText = "Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten genannte Bankkonto.";
    } else if (preset === '30tage') {
        appState.notesText = "Wir freuen uns über Ihr Interesse. Dieses Angebot ist freibleibend und 30 Tage ab Ausstellungsdatum gültig.";
    } else if (preset === 'skonto') {
        appState.notesText = "Zahlbar innerhalb von 7 Tagen mit 2% Skonto oder innerhalb von 14 Tagen rein netto auf das unten genannte Bankkonto.";
    } else if (preset === 'bar') {
        appState.notesText = "Betrag dankend bar erhalten bei Fertigstellung und Abnahme der Arbeiten.";
    }
    document.getElementById('doc-notes-input').value = appState.notesText;
    renderCleanDocument();
    saveState();
    showToast("Zahlungshinweis aktualisiert");
};

// Item Table Management
function addCatalogServiceToDoc(serviceId) {
    const service = SERVICES_CATALOG.find(s => s.id === serviceId);
    if (!service) return;

    const rate = service.medianHourly || service.defaultHourly;
    const workers = service.typicalWorkers || 1;
    const hours = 4;
    const qty = service.defaultUnit === "Std" ? (workers * hours) : 1;
    const price = service.defaultUnit === "Std" ? rate : (rate * 4);

    const newItem = {
        title: service.name,
        description: service.defaultUnit === "Std" 
            ? `${workers} Facharbeiter × ${hours}.0 Std. × ${rate.toFixed(2)} € (${service.descriptionTemplate})`
            : service.descriptionTemplate,
        quantity: qty,
        unit: service.defaultUnit || "Std",
        price: price,
        total: Math.round(qty * price * 100) / 100
    };

    appState.items.push(newItem);
    renderTable();
    updateTotals();
    updateSmartDock();
    saveState();
    closeCatalogModal();
    showToast(`"${service.name}" eingefügt`);
}

function addAddonServiceToDoc(addonKey) {
    const addon = ADDON_SERVICES[addonKey];
    if (!addon) return;

    const newItem = {
        title: addon.title,
        description: addon.description,
        quantity: addon.quantity || 1,
        unit: addon.unit || "Psch",
        price: addon.price || 0,
        total: (addon.quantity || 1) * (addon.price || 0)
    };

    appState.items.push(newItem);
    renderTable();
    updateTotals();
    updateSmartDock();
    saveState();
    showToast(`"${addon.title}" hinzugefügt`);
}

function addCustomItemToDoc() {
    appState.items.push({
        title: "Arbeitsleistung / Material",
        description: "Detaillierte Leistungsbeschreibung",
        quantity: 1,
        unit: "Std",
        price: 60.00,
        total: 60.00
    });
    renderTable();
    updateTotals();
    updateSmartDock();
    saveState();
    showToast("Freie Position angelegt");
}

function removeItemFromDoc(index) {
    const idx = parseInt(index, 10);
    if (isNaN(idx) || idx < 0 || !appState.items || idx >= appState.items.length) return;
    const removed = appState.items.splice(idx, 1);
    renderTable();
    updateTotals();
    updateSmartDock();
    saveState();
    const itemTitle = (removed && removed[0] && removed[0].title) ? removed[0].title : "Position";
    showToast(`"${itemTitle}" entfernt.`);
}
window.removeItemFromDoc = removeItemFromDoc;

function updateRowItem(index, field, value) {
    const item = appState.items[index];
    if (!item) return;

    if (field === 'quantity' || field === 'price') {
        item[field] = parseFloat(value) || 0;
        item.total = Math.round(item.quantity * item.price * 100) / 100;
        
        // Update Row Total Cell directly
        const totalCell = document.getElementById(`row-total-${index}`);
        if (totalCell) totalCell.textContent = formatCurrency(item.total);
    } else {
        item[field] = value;
    }

    updateTotals();
    saveState();
}

// Auto resize textarea helper
window.autoResizeTextarea = function(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
};

// Render Document Items Table (Interactive Clean Desktop View)
function renderTable() {
    const tbody = document.getElementById('doc-table-body');
    if (!tbody) return;

    tbody.innerHTML = "";

    if (appState.items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:#94a3b8; padding:36px 12px; font-style:italic;">
                    Noch keine Positionen vorhanden. Klicken Sie unten auf <strong>"Leistung aus Katalog wählen (20+)"</strong> oder <strong>"Freie Position anlegen"</strong>.
                </td>
            </tr>
        `;
        return;
    }

    appState.items.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row-item';
        tr.innerHTML = `
            <td class="col-pos" style="text-align: center; font-weight: 700; color: #64748b; font-size: 13px;">${index + 1}</td>

            <td class="col-desc">
                <input type="text" class="item-title-field" value="${escapeHtml(item.title)}" placeholder="Bezeichnung (z. B. Heckenschnitt)..." oninput="updateRowItem(${index}, 'title', this.value)">
                <textarea class="item-desc-field" rows="1" placeholder="Detaillierte Leistungsbeschreibung..." oninput="updateRowItem(${index}, 'description', this.value); autoResizeTextarea(this);">${escapeHtml(item.description)}</textarea>
            </td>

            <td class="col-qty" style="text-align: right;">
                <input type="number" step="0.5" class="item-number-field item-qty-field" value="${item.quantity}" oninput="updateRowItem(${index}, 'quantity', this.value)">
            </td>

            <td class="col-unit" style="text-align: center;">
                <select class="item-select-field" onchange="updateRowItem(${index}, 'unit', this.value)">
                    <option value="Std" ${item.unit === 'Std' ? 'selected' : ''}>Std</option>
                    <option value="Psch" ${item.unit === 'Psch' ? 'selected' : ''}>Psch</option>
                    <option value="m²" ${item.unit === 'm²' ? 'selected' : ''}>m²</option>
                    <option value="m" ${item.unit === 'm' ? 'selected' : ''}>m</option>
                    <option value="Stk" ${item.unit === 'Stk' ? 'selected' : ''}>Stk</option>
                    <option value="t" ${item.unit === 't' ? 'selected' : ''}>t</option>
                    <option value="m³" ${item.unit === 'm³' ? 'selected' : ''}>m³</option>
                </select>
            </td>

            <td class="col-price" style="text-align: right;">
                <input type="number" step="0.5" class="item-number-field item-price-field" value="${item.price}" oninput="updateRowItem(${index}, 'price', this.value)">
            </td>

            <td class="col-total" style="text-align: right; font-weight: 700; color: #0f172a; font-size: 13px;" id="row-total-${index}">
                ${formatCurrency(item.total)}
            </td>

            <td class="col-delete" style="text-align: center;">
                <button type="button" class="row-action-delete" title="Position löschen" onclick="removeItemFromDoc(${index})">✕</button>
            </td>
        `;
        tbody.appendChild(tr);

        // Auto-fit initial textarea height
        const descTextarea = tr.querySelector('.item-desc-field');
        if (descTextarea) {
            autoResizeTextarea(descTextarea);
        }
    });
}

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

// Update Screen Totals
function updateTotals() {
    const totals = calculateTotals();
    const isQuote = appState.docType === "angebot";

    document.getElementById('doc-net-total').textContent = formatCurrency(totals.netTotal);
    document.getElementById('doc-tax-label').textContent = `Umsatzsteuer ${appState.taxRate}%:`;
    document.getElementById('doc-tax-amount').textContent = formatCurrency(totals.taxAmount);
    document.getElementById('doc-gross-label').textContent = isQuote ? "Angebotsbetrag:" : "Rechnungsbetrag:";
    document.getElementById('doc-gross-total').textContent = formatCurrency(totals.grossTotal);

    // Update Clean Document
    renderCleanDocument();
}

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

    // Client Fields
    document.getElementById('doc-client-name').value = appState.client.name || "";
    document.getElementById('doc-client-street').value = appState.client.street || "";
    document.getElementById('doc-client-zipcity').value = appState.client.zipCity || "";

    // Meta Details
    document.getElementById('doc-number-label').textContent = isQuote ? "Angebot Nr.:" : "Rechnung Nr.:";
    document.getElementById('doc-meta-number').value = appState.docNumber || "";
    document.getElementById('doc-meta-date').value = appState.docDate || "";
    document.getElementById('doc-period-label').textContent = isQuote ? "Gültig bis / Zeitraum:" : "Leistungszeitraum:";
    document.getElementById('doc-meta-period').value = appState.servicePeriod || "";
    document.getElementById('doc-meta-taxrate').value = appState.taxRate !== undefined ? appState.taxRate : 19;

    // Document Title
    document.getElementById('doc-main-title').textContent = isQuote ? "ANGEBOT" : "RECHNUNG";

    // Mobile Doc Badge
    const mobileDocBadge = document.getElementById('mobile-doc-badge');
    if (mobileDocBadge) {
        mobileDocBadge.textContent = isQuote ? "ANGEBOT" : "RECHNUNG";
        mobileDocBadge.classList.toggle('quote-mode', isQuote);
    }

    // Notes
    document.getElementById('doc-notes-input').value = appState.notesText || "";

    // Table & Totals
    renderTable();
    updateTotals();
    updateSmartDock();
    renderCleanDocument();
}

/**
 * GENERATE PRISTINE CLEAN DOCUMENT FOR PDF & PRINT EXPORT
 * (No input tags, no dropdown arrows, no buttons, no resize handles)
 */
function renderCleanDocument() {
    const cleanContainer = document.getElementById('clean-pdf-document');
    if (!cleanContainer) return;

    const isQuote = appState.docType === "angebot";
    const totals = calculateTotals();

    let itemsHtml = "";
    if (appState.items.length === 0) {
        itemsHtml = `<tr><td colspan="6" style="text-align:center; color:#999; padding:25px;">Keine Positionen vorhanden.</td></tr>`;
    } else {
        appState.items.forEach((item, index) => {
            itemsHtml += `
                <tr>
                    <td style="width: 30px; text-align: center;">${index + 1}</td>
                    <td>
                        <strong style="color:#222; font-size:12px;">${escapeHtml(item.title)}</strong><br>
                        <small style="color:#666; font-size:10px;">${escapeHtml(item.description)}</small>
                    </td>
                    <td style="width: 50px; text-align: right;">${item.quantity}</td>
                    <td style="width: 45px; text-align: center;">${escapeHtml(item.unit)}</td>
                    <td style="width: 75px; text-align: right;">${formatCurrency(item.price)}</td>
                    <td style="width: 80px; text-align: right; font-weight: bold;">${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
    }

    cleanContainer.innerHTML = `
        <!-- Header -->
        <div class="clean-header">
            <div class="clean-company-info">
                <strong style="font-size:13px; color:#222;">Palnau Gartenbau GmbH</strong><br>
                Reihelberg 3, 75210 Keltern-Dietlingen<br>
                Tel: 07231 466641 | Email: gartenbauu@gmail.com
            </div>
        </div>

        <!-- Client Address -->
        <div class="clean-client-address">
            <div class="clean-return-line">Palnau Gartenbau GmbH • Reihelberg 3 • 75210 Keltern-Dietlingen</div>
            <strong>${escapeHtml(appState.client.name || 'Max Mustermann')}</strong><br>
            ${escapeHtml(appState.client.street || '')}<br>
            ${escapeHtml(appState.client.zipCity || '')}
        </div>

        <!-- Document Meta Details (Right Aligned) -->
        <div class="clean-doc-details">
            <strong>${isQuote ? 'Angebot Nr.:' : 'Rechnung Nr.:'}</strong> ${escapeHtml(appState.docNumber)}<br>
            <strong>Datum:</strong> ${escapeHtml(appState.docDate)}<br>
            <strong>${isQuote ? 'Gültig bis / Zeitraum:' : 'Leistungszeitraum:'}</strong> ${escapeHtml(appState.servicePeriod)}
        </div>

        <!-- Document Heading (H1) -->
        <h1 class="clean-h1-title">${isQuote ? 'ANGEBOT' : 'RECHNUNG'}</h1>

        <!-- Pure Items Table -->
        <table class="clean-table">
            <thead>
                <tr>
                    <th style="width: 30px; text-align: center;">Pos.</th>
                    <th>Beschreibung</th>
                    <th style="width: 50px; text-align: right;">Menge</th>
                    <th style="width: 45px; text-align: center;">Einheit</th>
                    <th style="width: 75px; text-align: right;">Einzelpreis</th>
                    <th style="width: 80px; text-align: right;">Gesamt</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <!-- Totals Box -->
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
                <span>${formatCurrency(totals.grossTotal)}</span>
            </div>
        </div>

        <!-- Notes / Terms -->
        <div class="clean-notes">
            <p>${escapeHtml(appState.notesText)}</p>
        </div>

        <!-- Footer (3 Columns) -->
        <div class="clean-footer">
            <div class="clean-footer-grid">
                <div>
                    <strong>Bankverbindung:</strong><br>
                    Sparkasse Pforzheim Calw<br>
                    IBAN: DE66 6665 0085 0005 9928 34<br>
                    BIC: PFORDE66XXX
                </div>
                <div>
                    <strong>Steuerdaten:</strong><br>
                    Steuernummer: 41413-45017
                </div>
                <div>
                    <strong>Geschäftsführer:</strong><br>
                    Andrei Priala<br>
                    Tel: 07231 466641 | gartenbauu@gmail.com
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
        document.getElementById('modal-catalog-search').focus();
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

    const filtered = SERVICES_CATALOG.filter(s => {
        const matchesCategory = modalActiveCategory === "all" || s.category === modalActiveCategory;
        const matchesSearch = !modalSearchTerm ||
            s.name.toLowerCase().includes(modalSearchTerm) ||
            s.tags.some(t => t.toLowerCase().includes(modalSearchTerm));
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: #94a3b8;">Keine Leistungen gefunden.</div>`;
        return;
    }

    filtered.forEach(service => {
        const card = document.createElement('div');
        card.className = 'catalog-card-item';
        card.innerHTML = `
            <div>
                <div class="card-item-title">${service.icon || '🌿'} ${escapeHtml(service.name)}</div>
                <div class="card-item-desc">${escapeHtml(service.descriptionTemplate)}</div>
            </div>
            <div class="card-item-footer">
                <span>Ø ${service.medianHourly} €/h (${service.priceRange[0]}-${service.priceRange[1]} €)</span>
                <button class="neu-btn neu-btn-primary" style="padding: 4px 10px; font-size: 0.72rem;">+ Einfügen</button>
            </div>
        `;
        card.addEventListener('click', () => addCatalogServiceToDoc(service.id));
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
    document.getElementById('btn-load-sample').addEventListener('click', () => {
        loadSampleData(appState.docType);
        showToast("Beispiel-Vorlage eingefügt");
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
        if (confirm("Möchten Sie alle Felder leeren und ein neues Dokument starten?")) {
            startCleanState();
            renderAll();
            showToast("Neuer Beleg gestartet");
        }
    });
    document.getElementById('btn-print').addEventListener('click', () => {
        renderCleanDocument();
        window.print();
    });
    document.getElementById('btn-download-pdf').addEventListener('click', exportToPdf);

    // Custom Item Add
    document.getElementById('btn-table-add-custom').addEventListener('click', addCustomItemToDoc);

    // Direct Inputs on Document
    document.getElementById('doc-client-name').addEventListener('input', (e) => {
        appState.client.name = e.target.value;
        renderCleanDocument();
        saveState();
    });
    document.getElementById('doc-client-street').addEventListener('input', (e) => {
        appState.client.street = e.target.value;
        renderCleanDocument();
        saveState();
    });
    document.getElementById('doc-client-zipcity').addEventListener('input', (e) => {
        appState.client.zipCity = e.target.value;
        renderCleanDocument();
        saveState();
    });

    document.getElementById('doc-meta-number').addEventListener('input', (e) => {
        appState.docNumber = e.target.value;
        renderCleanDocument();
        saveState();
    });
    document.getElementById('doc-meta-date').addEventListener('input', (e) => {
        appState.docDate = e.target.value;
        renderCleanDocument();
        saveState();
    });
    document.getElementById('doc-meta-period').addEventListener('input', (e) => {
        appState.servicePeriod = e.target.value;
        renderCleanDocument();
        saveState();
    });
    document.getElementById('doc-meta-taxrate').addEventListener('change', (e) => {
        appState.taxRate = parseFloat(e.target.value) || 0;
        updateTotals();
        renderCleanDocument();
        saveState();
    });

    document.getElementById('doc-notes-input').addEventListener('input', (e) => {
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
    // Do NOT set minHeight (which caused minor subpixel overflow to generate a blank 2nd page)
    cleanElement.style.display = 'block';
    cleanElement.style.position = 'static';
    cleanElement.style.width = '794px';
    cleanElement.style.maxWidth = '794px';
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
            // If an unwanted trailing white page is generated, safely remove it
            if (totalPages > 1) {
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
    if (confirm("Möchten Sie das Studio sperren und sich abmelden?")) {
        localStorage.removeItem('palnau_studio_auth');
        sessionStorage.removeItem('palnau_studio_auth');
        
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
    }
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
        'generator': document.getElementById('app-main-shell'),
        'erechnung': document.getElementById('app-erechnung-hub'),
        'catalog': document.getElementById('app-catalog-view'),
        'clients': document.getElementById('app-clients-view'),
        'quarters': document.getElementById('app-quarters-view'),
        'loans': document.getElementById('app-loans-view')
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

window.getInvoicesArchive = function() {
    const deletedSet = getDeletedInvoicesSet();
    let list = [];
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    
    if (!raw) {
        const initialSeeds = (typeof SEED_INVOICES_ARCHIVE !== 'undefined') ? JSON.parse(JSON.stringify(SEED_INVOICES_ARCHIVE)) : [];
        list = initialSeeds.filter(seed => !deletedSet.has(String(seed.id)) && !deletedSet.has(String(seed.docNumber)));
        localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(list));
    } else {
        try {
            const parsed = JSON.parse(raw);
            list = Array.isArray(parsed) ? parsed : [];
            // Merge newly added seed invoices only if they haven't been deleted by the user
            if (typeof SEED_INVOICES_ARCHIVE !== 'undefined') {
                SEED_INVOICES_ARCHIVE.forEach(seed => {
                    const isDeleted = deletedSet.has(String(seed.id)) || deletedSet.has(String(seed.docNumber));
                    const alreadyExists = list.some(item => item.id === seed.id || item.docNumber === seed.docNumber);
                    if (!isDeleted && !alreadyExists) {
                        list.push(JSON.parse(JSON.stringify(seed)));
                    }
                });
            }
        } catch (e) {
            console.warn("Corrupt archive, restoring seed", e);
            list = [];
        }
    }

    // Filter out any accidentally stored deleted items
    list = list.filter(inv => !deletedSet.has(String(inv.id)) && !deletedSet.has(String(inv.docNumber)));

    // Normalization safeguard: ensure totalNet, totalTax, totalGross are numeric and present
    return list.map(inv => {
        const net = parseFloat(inv.totalNet ?? inv.netTotal ?? 0) || 0;
        const tax = parseFloat(inv.totalTax ?? inv.taxAmount ?? 0) || 0;
        const gross = parseFloat(inv.totalGross ?? inv.grossTotal ?? (net + tax)) || 0;
        return {
            ...inv,
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

    if (existingIndex >= 0) {
        archive[existingIndex] = { ...archive[existingIndex], ...invoiceData, updatedAt: new Date().toISOString() };
    } else {
        archive.unshift({ ...invoiceData, createdAt: new Date().toISOString() });
    }

    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
    updateAllAppStatesAndBadges();
    return archive;
};

window.saveCurrentInvoiceToArchive = function(notifyUser = true) {
    const totals = calculateTotals();
    const invoiceId = appState.activeArchiveId || ('inv-' + Date.now());
    appState.activeArchiveId = invoiceId;

    const invoiceRecord = {
        id: invoiceId,
        docType: appState.docType || "rechnung",
        docNumber: appState.docNumber || generateDocNumber("rechnung"),
        docDate: appState.docDate || formatDateForGermanDisplay(new Date()),
        servicePeriod: appState.servicePeriod || getCurrentMonthGerman(),
        taxRate: appState.taxRate || 19,
        client: {
            name: appState.client.name || "Kunde ohne Name",
            street: appState.client.street || "",
            zipCity: appState.client.zipCity || ""
        },
        items: JSON.parse(JSON.stringify(appState.items || [])),
        notesText: appState.notesText || "",
        totalNet: totals.netTotal,
        totalTax: totals.taxAmount,
        totalGross: totals.grossTotal,
        status: "ausgestellt"
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
        showToast(`Rechnung ${invoiceRecord.docNumber} (${formatCurrency(totals.grossTotal)}) im Archiv gespeichert!`);
    }
};

window.deleteInvoiceFromArchive = function(invoiceId) {
    if (!invoiceId) return;
    const archive = getInvoicesArchive();
    const target = archive.find(inv => inv.id === invoiceId);
    const docNum = target ? target.docNumber : "diese Rechnung";

    if (confirm(`Sind Sie sicher, dass Sie ${docNum} dauerhaft löschen möchten?`)) {
        markInvoiceAsDeleted(invoiceId, target ? target.docNumber : null);
        const updated = archive.filter(inv => inv.id !== invoiceId);
        localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updated));

        // If the deleted invoice was currently open in editor, clear its reference
        if (appState.activeArchiveId === invoiceId) {
            appState.activeArchiveId = null;
            const badge = document.getElementById('gen-active-status-badge');
            if (badge) {
                badge.textContent = "Modus: Neuer Beleg";
                badge.style.borderColor = '';
                badge.style.color = '';
            }
        }

        if (typeof renderOverviewInvoices === 'function') renderOverviewInvoices();
        if (typeof renderClientsView === 'function') renderClientsView();
        if (typeof renderQuartersView === 'function') renderQuartersView();
        if (typeof renderERechnungHub === 'function') renderERechnungHub();
        if (typeof renderAll === 'function') renderAll();
        updateAllAppStatesAndBadges();
        showToast(`${docNum} erfolgreich gelöscht.`);
    }
};

window.deleteClient = function(clientName) {
    if (!clientName) return;
    const archive = getInvoicesArchive();
    const clientInvoices = archive.filter(inv => (inv.client && inv.client.name) === clientName);
    const count = clientInvoices.length;

    const confirmMsg = count > 0
        ? `Möchten Sie den Kunden "${clientName}" und alle ${count} zugehörigen Belege wirklich unwiderruflich löschen?`
        : `Möchten Sie den Kunden "${clientName}" wirklich aus der Kartei löschen?`;

    if (!confirm(confirmMsg)) return;

    clientInvoices.forEach(inv => {
        markInvoiceAsDeleted(inv.id, inv.docNumber);
    });

    const updated = archive.filter(inv => !(inv.client && inv.client.name === clientName));
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(updated));

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

window.resetCurrentDoc = function() {
    if (confirm("Möchten Sie alle Felder leeren und ein neues Dokument starten?")) {
        startCleanState();
        renderAll();
        showToast("Formular geleert – Neuer Beleg angelegt.");
    }
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
    appState.docDate = invoice.docDate;
    appState.servicePeriod = invoice.servicePeriod || "";
    appState.taxRate = invoice.taxRate || 19;
    appState.client = {
        name: invoice.client ? invoice.client.name : "",
        street: invoice.client ? invoice.client.street : "",
        zipCity: invoice.client ? invoice.client.zipCity : ""
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

window.updateAllAppStatesAndBadges = function() {
    const archive = getInvoicesArchive();
    const totalCount = archive.length;
    const totalGross = archive.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);

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
    if (bCount) bCount.textContent = `${totalCount} Belege`;

    const bXml = document.getElementById('launcher-xml-badge');
    if (bXml) bXml.textContent = `${totalCount} XML`;

    const bClients = document.getElementById('launcher-clients-badge');
    if (bClients) bClients.textContent = `${uniqueClientsCount} Kunden`;

    const bQuarters = document.getElementById('launcher-quarters-badge');
    if (bQuarters) bQuarters.textContent = formatCurrency(totalGross);

    // Loans Badge
    if (typeof getLoanData === 'function') {
        const loanData = getLoanData();
        const totalBudget = (loanData.budgets?.bga || 0) + (loanData.budgets?.betriebsmittel || 0) + (loanData.budgets?.uebernahme || 0);
        const totalSpent = (loanData.entries || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
        const totalRemaining = totalBudget - totalSpent;
        const bLoans = document.getElementById('launcher-loans-badge');
        if (bLoans) bLoans.textContent = `${formatCurrency(totalRemaining)} frei`;
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
        } else if (currentActiveView === 'erechnung' && typeof renderERechnungHub === 'function') {
            renderERechnungHub();
        } else if (currentActiveView === 'loans' && typeof renderLoansView === 'function') {
            renderLoansView();
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
    sortBy: 'date-desc',
    searchTerm: ''
};

window.setOverviewPeriodFilter = function(type) {
    overviewFilter.periodType = type;

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

window.renderOverviewInvoices = function() {
    const listContainer = document.getElementById('overview-invoices-list');
    if (!listContainer) return;

    let archive = getInvoicesArchive();

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

    // 3. Sort
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

    // 4. Update KPI Ribbon
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

    // 5. Render Invoices Cards
    if (archive.length === 0) {
        listContainer.innerHTML = `
            <div style="background: #ffffff; border-radius: 12px; padding: 48px 24px; text-align: center; border: 1px dashed #cbd5e1;">
                <div style="display: flex; justify-content: center; margin-bottom: 12px;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <h3 style="color: #1e293b; font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;">Keine Rechnungen gefunden</h3>
                <p style="color: #64748b; font-size: 0.88rem; margin-bottom: 18px;">Für den gewählten Zeitraum oder Filter liegen keine ausgestellten Belege vor.</p>
                <button type="button" class="btn-overview-action btn-create-invoice" onclick="createNewInvoiceInGenerator()">
                    Jetzt erste Rechnung schreiben
                </button>
            </div>
        `;
        return;
    }

    let cardsHtml = "";
    archive.forEach(inv => {
        const clientName = (inv.client && inv.client.name) ? escapeHtml(inv.client.name) : "Kein Kundenname";
        const clientAddr = (inv.client && (inv.client.street || inv.client.zipCity))
            ? escapeHtml(`${inv.client.street ? inv.client.street + ', ' : ''}${inv.client.zipCity || ''}`)
            : "Keine Adresse hinterlegt";
        const itemCount = (inv.items && Array.isArray(inv.items)) ? inv.items.length : 0;
        const topItem = (inv.items && inv.items[0]) ? escapeHtml(inv.items[0].title) : "";
        const itemsSnippet = itemCount > 1 ? `${topItem} (+ ${itemCount - 1} weitere Positionen)` : (topItem || `${itemCount} Positionen`);

        cardsHtml += `
            <div class="overview-invoice-card" id="card-${inv.id}">
                <!-- Meta: Doc number & Date -->
                <div class="card-col-meta">
                    <span class="card-doc-num">${escapeHtml(inv.docNumber)}</span>
                    <span class="card-doc-date">Datum: ${escapeHtml(inv.docDate)}</span>
                    <span class="card-status-badge">Ausgestellt</span>
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

                <!-- Action Toolbar: Edit, Delete, PDF, XML -->
                <div class="card-col-actions">
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
    });

    listContainer.innerHTML = cardsHtml;
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
    let items = (typeof SERVICES_CATALOG !== 'undefined') ? JSON.parse(JSON.stringify(SERVICES_CATALOG)) : [];
    const customItemsRaw = localStorage.getItem('palnau_custom_catalog');
    if (customItemsRaw) {
        try {
            const customItems = JSON.parse(customItemsRaw);
            if (Array.isArray(customItems)) items = [...customItems, ...items];
        } catch (e) {}
    }

    const service = items.find(i => i.id === itemId);
    if (!service) {
        showToast("Leistung nicht gefunden.");
        return;
    }

    const qtyInput = document.getElementById(`qty-${itemId}`);
    const qty = qtyInput ? (parseFloat(qtyInput.value) || 1) : 1;

    // Add to appState.items
    const newItem = {
        id: "item-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
        title: service.name,
        description: service.description || "",
        unit: service.standardUnit || "Std",
        quantity: qty,
        unitPrice: service.unitPrice,
        total: qty * service.unitPrice
    };

    if (!Array.isArray(appState.items)) {
        appState.items = [];
    }
    appState.items.push(newItem);
    saveState();
    updateAllAppStatesAndBadges();

    showToast(`✓ "${service.name}" (${qty}x) zur Rechnung hinzugefügt!`);
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
    if (!confirm("Möchten Sie diese Leistung wirklich aus dem Katalog löschen?")) return;
    let customItems = [];
    const raw = localStorage.getItem('palnau_custom_catalog');
    if (raw) {
        try { customItems = JSON.parse(raw) || []; } catch (e) {}
    }
    customItems = customItems.filter(it => it.id !== itemId);
    localStorage.setItem('palnau_custom_catalog', JSON.stringify(customItems));
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

let quartersSelectedYear = 2026;
const openQuarterRows = new Set();

window.setQuartersYearFilter = function(year, btn) {
    quartersSelectedYear = year;
    if (btn && btn.parentElement) {
        Array.from(btn.parentElement.children).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
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

window.renderQuartersView = function() {
    const tbody = document.getElementById('crm-quarters-table-body');
    const tfoot = document.getElementById('crm-quarters-table-footer');
    if (!tbody) return;

    const archive = getInvoicesArchive();

    // Filter by year
    const yearFiltered = (quartersSelectedYear === 'all')
        ? archive
        : archive.filter(inv => {
            const d = parseGermanDate(inv.docDate);
            return d.getFullYear() === parseInt(quartersSelectedYear, 10);
        });

    const sumGross = yearFiltered.reduce((s, inv) => s + (parseFloat(inv.totalGross) || 0), 0);
    const sumNet = yearFiltered.reduce((s, inv) => s + (parseFloat(inv.totalNet) || 0), 0);
    const sumTax = yearFiltered.reduce((s, inv) => s + (parseFloat(inv.totalTax) || 0), 0);
    const sumCount = yearFiltered.length;

    // Update KPI Banner
    const yearLabel = document.getElementById('quarters-summary-year-label');
    const bGross = document.getElementById('quarters-sum-gross');
    const bNet = document.getElementById('quarters-sum-net');
    const bTax = document.getElementById('quarters-sum-tax');
    const bCount = document.getElementById('quarters-sum-count');

    if (yearLabel) yearLabel.textContent = quartersSelectedYear === 'all' ? 'Gesamtumsatz (Alle Jahre)' : `Jahresumsatz ${quartersSelectedYear} Brutto`;
    if (bGross) bGross.textContent = formatCurrency(sumGross);
    if (bNet) bNet.textContent = formatCurrency(sumNet);
    if (bTax) bTax.textContent = formatCurrency(sumTax);
    if (bCount) bCount.textContent = String(sumCount);

    const yearNum = (quartersSelectedYear === 'all') ? 2026 : parseInt(quartersSelectedYear, 10);

    // Group into 4 Quarters with statutory deadlines
    const quarters = [
        { 
            id: 1, 
            name: "1. Quartal (Q1)", 
            period: "01.01. – 31.03.", 
            deadline: `10. Mai ${yearNum}`, 
            status: "Abgeschlossen", 
            invoices: [], 
            gross: 0, 
            net: 0, 
            tax: 0 
        },
        { 
            id: 2, 
            name: "2. Quartal (Q2)", 
            period: "01.04. – 30.06.", 
            deadline: `10. August ${yearNum}`, 
            status: "Fällig / In Bearbeitung", 
            invoices: [], 
            gross: 0, 
            net: 0, 
            tax: 0 
        },
        { 
            id: 3, 
            name: "3. Quartal (Q3)", 
            period: "01.07. – 30.09.", 
            deadline: `10. November ${yearNum}`, 
            status: "In Vorbereitung", 
            invoices: [], 
            gross: 0, 
            net: 0, 
            tax: 0 
        },
        { 
            id: 4, 
            name: "4. Quartal (Q4)", 
            period: "01.10. – 31.12.", 
            deadline: `10. Februar ${yearNum + 1}`, 
            status: "In Vorbereitung", 
            invoices: [], 
            gross: 0, 
            net: 0, 
            tax: 0 
        }
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

        let statusClass = "crm-badge-future";
        if (q.id === 1) statusClass = "crm-badge-closed";
        if (q.id === 2) statusClass = "crm-badge-active";

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
                <td style="text-align: right; font-weight: 700;">
                    ${formatCurrency(q.net)}
                </td>
                <td style="text-align: right; font-weight: 800; color: #ea580c;">
                    ${formatCurrency(q.tax)}
                </td>
                <td style="text-align: right; font-weight: 800; color: #059669; font-size: 0.95rem;">
                    ${formatCurrency(q.gross)}
                </td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                        <button type="button" class="crm-action-btn ${hasInvoices ? 'primary' : ''}" onclick="toggleQuarterInvoicesRow(${q.id})" ${!hasInvoices ? 'disabled style="opacity:0.6;"' : ''} title="Belegjournal für ${q.name} aufklappen">
                            ${isExpanded ? 'Schließen' : `Details (${q.invoices.length})`}
                        </button>
                        <button type="button" class="crm-action-btn" onclick="filterOverviewByQuarter(${quartersSelectedYear !== 'all' ? quartersSelectedYear : 2026}, ${q.id})" title="Im Rechnungsarchiv filtern">
                            Archiv
                        </button>
                    </div>
                </td>
            </tr>
        `;

        // Expandable Sub-Row showing quarter's invoice ledger
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
                                <button type="button" class="crm-action-btn" style="padding: 3px 8px; font-size: 0.7rem; color: #dc2626;" onclick="deleteInvoiceFromArchive('${inv.id}')" title="Rechnung aus dem Archiv löschen">
                                    Löschen
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

    // Build Footer
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
                budgets: { bga: 8000.00, betriebsmittel: 27000.00, uebernahme: 37500.00 },
                entries: []
            };
        localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(initial));
        return initial;
    }
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.budgets === 'object' && Array.isArray(parsed.entries)) {
            if (parsed.budgets.bga === undefined) parsed.budgets.bga = 8000;
            if (parsed.budgets.betriebsmittel === undefined) parsed.budgets.betriebsmittel = 27000;
            if (parsed.budgets.uebernahme === undefined) parsed.budgets.uebernahme = 37500;
            return parsed;
        }
        throw new Error("Invalid loan structure");
    } catch (e) {
        console.warn("Corrupt loans data, restoring default", e);
        const initial = (typeof DEFAULT_LOAN_DATA !== 'undefined')
            ? JSON.parse(JSON.stringify(DEFAULT_LOAN_DATA))
            : {
                budgets: { bga: 8000.00, betriebsmittel: 27000.00, uebernahme: 37500.00 },
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
    const budgets = loanData.budgets || { bga: 8000, betriebsmittel: 27000, uebernahme: 37500 };
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
    if (!confirm("Möchten Sie diesen Entnahmeposten wirklich unwiderruflich löschen?")) return;

    const loanData = getLoanData();
    loanData.entries = (loanData.entries || []).filter(e => e.id !== entryId);
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
    const budgets = loanData.budgets || { bga: 8000, betriebsmittel: 27000, uebernahme: 37500 };

    if (bgaInput) bgaInput.value = budgets.bga ?? 8000;
    if (betriebInput) betriebInput.value = budgets.betriebsmittel ?? 27000;
    if (uebernahmeInput) uebernahmeInput.value = budgets.uebernahme ?? 37500;

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
    const budgets = loanData.budgets || { bga: 8000, betriebsmittel: 27000, uebernahme: 37500 };
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

