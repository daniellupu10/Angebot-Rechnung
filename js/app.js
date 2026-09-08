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
    saveState();
}

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
    appState.items.splice(index, 1);
    renderTable();
    updateTotals();
    updateSmartDock();
    saveState();
}

function updateRowItem(index, field, value) {
    const item = appState.items[index];
    if (!item) return;

    if (field === 'quantity' || field === 'price') {
        item[field] = parseFloat(value) || 0;
        item.total = Math.round(item.quantity * item.price * 100) / 100;
        
        // Update Row Total Cell directly on desktop & mobile
        const totalCell = document.getElementById(`row-total-${index}`);
        if (totalCell) totalCell.textContent = formatCurrency(item.total);
        const mobileTotalCell = document.getElementById(`row-total-mobile-${index}`);
        if (mobileTotalCell) mobileTotalCell.textContent = formatCurrency(item.total);
    } else {
        item[field] = value;
    }

    // Bidirectional sync between desktop and mobile input fields
    if (field === 'quantity') {
        const dtQty = document.getElementById(`dt-qty-${index}`);
        const mbQty = document.getElementById(`mb-qty-${index}`);
        if (dtQty && dtQty.value != item.quantity) dtQty.value = item.quantity;
        if (mbQty && mbQty.value != item.quantity) mbQty.value = item.quantity;
    } else if (field === 'price') {
        const dtPrice = document.getElementById(`dt-price-${index}`);
        const mbPrice = document.getElementById(`mb-price-${index}`);
        if (dtPrice && dtPrice.value != item.price) dtPrice.value = item.price;
        if (mbPrice && mbPrice.value != item.price) mbPrice.value = item.price;
    } else if (field === 'unit') {
        const dtUnit = document.getElementById(`dt-unit-${index}`);
        const mbUnit = document.getElementById(`mb-unit-${index}`);
        if (dtUnit && dtUnit.value !== item.unit) dtUnit.value = item.unit;
        if (mbUnit && mbUnit.value !== item.unit) mbUnit.value = item.unit;
    }

    updateTotals();
    updateSmartDock();
    saveState();
}

// Render Document Items Table (Interactive Screen View)
function renderTable() {
    const tbody = document.getElementById('doc-table-body');
    if (!tbody) return;

    tbody.innerHTML = "";

    if (appState.items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; color:#94a3b8; padding:32px 10px; font-style:italic;">
                    Noch keine Positionen vorhanden. Klicken Sie unten auf <strong>"➕ Leistung aus Katalog wählen"</strong> oder <strong>"✏️ Freie Position anlegen"</strong>.
                </td>
            </tr>
        `;
        return;
    }

    appState.items.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = 'table-row-item';
        tr.innerHTML = `
            <!-- Mobile Header (Visible on smartphones) -->
            <div class="mobile-card-header">
                <span class="mobile-pos-badge">Position #${index + 1}</span>
                <button type="button" class="row-action-delete" title="Position löschen" onclick="removeItemFromDoc(${index})">✕</button>
            </div>

            <!-- Desktop Position Column -->
            <td class="col-pos" style="width: 32px; text-align: center; font-weight: bold; color: #64748b;">${index + 1}</td>

            <!-- Description & Title -->
            <td class="col-desc">
                <input type="text" class="item-title-field" value="${escapeHtml(item.title)}" placeholder="Bezeichnung (z. B. Heckenschnitt)..." oninput="updateRowItem(${index}, 'title', this.value)">
                <textarea class="item-desc-field" rows="1" placeholder="Detaillierte Beschreibung..." oninput="updateRowItem(${index}, 'description', this.value)">${escapeHtml(item.description)}</textarea>
            </td>

            <!-- Desktop Columns -->
            <td class="col-qty" style="width: 60px;">
                <input type="number" step="0.5" id="dt-qty-${index}" class="item-number-field" value="${item.quantity}" oninput="updateRowItem(${index}, 'quantity', this.value)">
            </td>
            <td class="col-unit" style="width: 50px; text-align: center;">
                <select class="item-select-field" id="dt-unit-${index}" onchange="updateRowItem(${index}, 'unit', this.value)">
                    <option value="Std" ${item.unit === 'Std' ? 'selected' : ''}>Std</option>
                    <option value="Psch" ${item.unit === 'Psch' ? 'selected' : ''}>Psch</option>
                    <option value="m²" ${item.unit === 'm²' ? 'selected' : ''}>m²</option>
                    <option value="m" ${item.unit === 'm' ? 'selected' : ''}>m</option>
                    <option value="Stk" ${item.unit === 'Stk' ? 'selected' : ''}>Stk</option>
                    <option value="t" ${item.unit === 't' ? 'selected' : ''}>t</option>
                    <option value="m³" ${item.unit === 'm³' ? 'selected' : ''}>m³</option>
                </select>
            </td>
            <td class="col-price" style="width: 80px;">
                <input type="number" step="0.5" id="dt-price-${index}" class="item-number-field" value="${item.price}" oninput="updateRowItem(${index}, 'price', this.value)">
            </td>
            <td class="col-total" style="width: 85px; text-align: right; font-weight: bold;" id="row-total-${index}">
                ${formatCurrency(item.total)}
            </td>
            <td class="col-delete" style="width: 25px; text-align: center;">
                <button type="button" class="row-action-delete" title="Position löschen" onclick="removeItemFromDoc(${index})">✕</button>
            </td>

            <!-- Mobile Fields Grid (Visible on smartphones) -->
            <div class="mobile-item-fields-grid">
                <div class="mobile-field-group">
                    <label class="mobile-field-label">Menge</label>
                    <input type="number" step="0.5" id="mb-qty-${index}" class="item-number-field" value="${item.quantity}" oninput="updateRowItem(${index}, 'quantity', this.value)">
                </div>
                <div class="mobile-field-group">
                    <label class="mobile-field-label">Einheit</label>
                    <select class="item-select-field" id="mb-unit-${index}" onchange="updateRowItem(${index}, 'unit', this.value)">
                        <option value="Std" ${item.unit === 'Std' ? 'selected' : ''}>Std</option>
                        <option value="Psch" ${item.unit === 'Psch' ? 'selected' : ''}>Psch</option>
                        <option value="m²" ${item.unit === 'm²' ? 'selected' : ''}>m²</option>
                        <option value="m" ${item.unit === 'm' ? 'selected' : ''}>m</option>
                        <option value="Stk" ${item.unit === 'Stk' ? 'selected' : ''}>Stk</option>
                        <option value="t" ${item.unit === 't' ? 'selected' : ''}>t</option>
                        <option value="m³" ${item.unit === 'm³' ? 'selected' : ''}>m³</option>
                    </select>
                </div>
                <div class="mobile-field-group">
                    <label class="mobile-field-label">Einzelpreis (€)</label>
                    <input type="number" step="0.5" id="mb-price-${index}" class="item-number-field" value="${item.price}" oninput="updateRowItem(${index}, 'price', this.value)">
                </div>
                <div class="mobile-field-group">
                    <label class="mobile-field-label">Gesamtpreis</label>
                    <div style="height: 40px; display: flex; align-items: center; font-weight: 800; color: #10b981; font-size: 16px;" id="row-total-mobile-${index}">
                        ${formatCurrency(item.total)}
                    </div>
                </div>
            </div>
        `;
        tbody.appendChild(tr);
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
                <span class="addon-pill-title">${addon.icon || '🌿'} ${escapeHtml(addon.title)}</span>
                <span class="addon-pill-price">+${formatCurrency(addon.price)}</span>
            </div>
            <button class="neu-btn" style="padding:4px 10px; font-size:0.7rem;">+ Hinzufügen</button>
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
    
    if (btnRechnung && btnAngebot) {
        btnRechnung.classList.toggle('active', !isQuote);
        btnRechnung.classList.toggle('invoice-active', !isQuote);
        btnAngebot.classList.toggle('active', isQuote);
        btnAngebot.classList.toggle('quote-active', isQuote);
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
                    Steuernummer: 41413-45017<br>
                    USt-ID: DE987654321
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

function closeCatalogModal() {
    const modal = document.getElementById('catalog-modal');
    if (modal) modal.classList.remove('open');
}

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
    document.getElementById('btn-mode-rechnung').addEventListener('click', () => setDocType('rechnung'));
    document.getElementById('btn-mode-angebot').addEventListener('click', () => setDocType('angebot'));

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
 */
function exportToPdf() {
    renderCleanDocument();
    
    const cleanElement = document.getElementById('clean-pdf-document');
    if (!cleanElement) {
        showToast("Fehler beim Vorbereiten des Dokuments.");
        return;
    }
    const filename = `${appState.docNumber || 'Dokument'}_Palnau_Gartenbau.pdf`;

    showToast("PDF wird generiert...");

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
            showToast("PDF erfolgreich heruntergeladen!");
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
        }, 300);
    } else {
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
            }, 300);
        }
        showToast("Willkommen! Editor erfolgreich freigeschaltet.");
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
    if (confirm("Möchten Sie den Editor sperren und sich abmelden?")) {
        localStorage.removeItem('palnau_studio_auth');
        sessionStorage.removeItem('palnau_studio_auth');
        
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
        showToast("Editor gesperrt.");
    }
}

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

