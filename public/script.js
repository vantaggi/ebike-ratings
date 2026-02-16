/**
 * Maps Italian component names to their English plural identifiers.
 * This is used for generating correct URLs and selecting data from the correct category.
 */
function getComponentType(name) {
    switch(name) {
        case 'Motore': return 'motori';
        case 'Batteria': return 'batterie';
        case 'Freni': return 'freni';
        case 'Forcella':
        case 'Ammortizzatore': return 'sospensioni';
        default: return '';
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener("DOMContentLoaded", function() {

    /**
     * Safely escapes HTML special characters to prevent XSS.
     * @param {string} str The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        const s = String(str);
        return s.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
    }

    /**
     * Basic check for safe URLs to prevent javascript: or other malicious protocols.
     * @param {string} url The URL to check.
     * @returns {boolean} True if the URL is safe.
     */
    function isSafeUrl(url) {
        if (!url) return false;
        const normalizedUrl = url.trim().toLowerCase();
        return normalizedUrl.startsWith('http://') ||
               normalizedUrl.startsWith('https://') ||
               normalizedUrl.startsWith('/') ||
               normalizedUrl.startsWith('..');
    }

    // Ensure main element has ID for skip link
    const mainElement = document.querySelector('main');
    if (mainElement) {
        if (!mainElement.id) {
            mainElement.id = 'main-content';
        } else {
             // If main already has an ID, we should theoretically update the skip link to point to it.
             // However, the skip link is inside header.html which is loaded asynchronously.
             // For this micro-UX task, we simply ensure a default ID is present if missing.
             // In a more complex app, we would dynamically update the anchor href.
        }
    }

    /************************************************
     * CONFIGURATION
     ************************************************/
    const BACK_TO_TOP_THRESHOLD = 300;
    const isSubfolder = window.location.pathname.includes('/classifiche/');
    const basePath = isSubfolder ? '..' : '.';
    const dataPath = `${basePath}/ebike-data.json`;

    /************************************************
     * DYNAMIC HEADER & FOOTER
     ************************************************/

    function loadTemplate(url, placeholder, callback) {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Template not found at ${url}`);
                return response.text();
            })
            .then(data => {
                if (placeholder) {
                    placeholder.innerHTML = data;
                }
                if (callback) callback();
            })
            .catch(error => console.error(`Error loading template from ${url}:`, error));
    }

    const headerPlaceholder = document.getElementById("header-placeholder");
    const footerPlaceholder = document.getElementById("footer-placeholder");

    if (headerPlaceholder) {
        loadTemplate(`${basePath}/header.html`, headerPlaceholder, () => adjustNavigation(isSubfolder));
    }
    if (footerPlaceholder) {
        loadTemplate(`${basePath}/footer.html`, footerPlaceholder, initBackToTop);
    }

    function initBackToTop() {
        const backToTopButton = document.getElementById('back-to-top');
        if (!backToTopButton) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > BACK_TO_TOP_THRESHOLD) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    function adjustNavigation(isInSubfolder) {
        const navLinks = document.querySelectorAll('#header-placeholder nav a');
        const currentPath = window.location.pathname;

        navLinks.forEach(link => {
            const originalHref = link.getAttribute('href');
            let finalHref = originalHref;

            if (isInSubfolder && !originalHref.startsWith('..')) {
                finalHref = `../${originalHref}`;
                link.setAttribute('href', finalHref);
            }
            
            if (new URL(link.href).pathname === currentPath) {
                link.classList.add('active');
            }
        });
    }

    /************************************************
     * GENERIC TABLE RENDERING
     ************************************************/

    function renderComponentTable(tableBody, items, renderer) {
        if (!tableBody) return;
        tableBody.innerHTML = ''; // Clear the table
        if (!items || items.length === 0) {
            const colspan = tableBody.parentElement.querySelector('thead tr').childElementCount;
            tableBody.innerHTML = `<tr><td colspan="${colspan}">Nessun dato trovato.</td></tr>`;
            return;
        }
        // ⚡ Bolt Optimization: Batch DOM updates to prevent layout thrashing
        // Instead of appending to innerHTML in each iteration, we build the string once.
        const rows = items.map(item => renderer(item)).join('');
        tableBody.innerHTML = rows;
    }

    /************************************************
     * RATING LOGIC
     ************************************************/
    const WEIGHTS = {
        motore: 0.40,
        batteria: 0.30,
        freni: 0.15,
        sospensioni: 0.15
    };

    function calculateCompositeScore(eBike, allData) {
        const motore = allData.motori.find(m => m.id === eBike.id_motore);
        const batteria = allData.batterie.find(b => b.id === eBike.id_batteria);
        const freni = allData.freni.find(f => f.id === eBike.id_freni);
        const forcella = allData.sospensioni.find(s => s.id === eBike.id_forcella);
        const ammortizzatore = allData.sospensioni.find(s => s.id === eBike.id_ammortizzatore);

        let totalScore = 0;
        let totalWeight = 0;

        if (motore && motore.valutazione) {
            totalScore += motore.valutazione * WEIGHTS.motore;
            totalWeight += WEIGHTS.motore;
        }
        if (batteria && batteria.valutazione) {
            totalScore += batteria.valutazione * WEIGHTS.batteria;
            totalWeight += WEIGHTS.batteria;
        }
        if (freni && freni.valutazione) {
            totalScore += freni.valutazione * WEIGHTS.freni;
            totalWeight += WEIGHTS.freni;
        }

        // Average suspension score
        let suspensionScore = 0;
        let suspensionCount = 0;
        if (forcella && forcella.valutazione) {
            suspensionScore += forcella.valutazione;
            suspensionCount++;
        }
        if (ammortizzatore && ammortizzatore.valutazione) {
            suspensionScore += ammortizzatore.valutazione;
            suspensionCount++;
        }
        if (suspensionCount > 0) {
            const avgSuspensionScore = suspensionScore / suspensionCount;
            totalScore += avgSuspensionScore * WEIGHTS.sospensioni;
            totalWeight += WEIGHTS.sospensioni;
        }

        if (totalWeight === 0) return 0;

        const weightedAverage = totalScore / totalWeight;
        return weightedAverage.toFixed(1);
    }

    /************************************************
     * HELPER FUNCTIONS
     ************************************************/
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    /************************************************
     * COMPARISON PAGE
     ************************************************/

    const tableConfig = {
        'e_bikes': {
            headers: ['Modello', 'Categoria', 'Anno', 'Valutazione', 'Motore', 'Batteria', 'Freni'],
            dataKeys: ['modello', 'categoria', 'anno', 'valutazione', 'id_motore', 'id_batteria', 'id_freni']
        },
        'motori': {
            headers: ['Modello', 'Marca', 'Valutazione', 'Coppia (Nm)', 'Peso (kg)', 'Potenza di Picco (W)', 'Anno Rilascio'],
            dataKeys: ['modello', 'marca', 'valutazione', 'coppia_max_nm', 'peso_kg', 'potenza_picco_w', 'anno_rilascio']
        },
        'batterie': {
            headers: ['Modello', 'Marca', 'Valutazione', 'Capacità (Wh)', 'Anno Rilascio'],
            dataKeys: ['modello', 'marca', 'valutazione', 'capacita_wh', 'anno_rilascio']
        },
        'freni': {
            headers: ['Modello', 'Marca', 'Valutazione', 'Tipo', 'Anno Rilascio'],
            dataKeys: ['modello', 'marca', 'valutazione', 'tipo', 'anno_rilascio']
        },
        'sospensioni': {
            headers: ['Modello', 'Marca', 'Valutazione', 'Tipo', 'Escursione (mm)', 'Anno Rilascio'],
            dataKeys: ['modello', 'marca', 'valutazione', 'tipo', 'escursione_mm', 'anno_rilascio']
        }
    };

    function populateColumnToggle(category) {
        const container = document.getElementById('column-toggle-container');
        if (!container) return;

        const config = tableConfig[category];
        container.innerHTML = ''; // Clear old checkboxes

        config.headers.forEach((header, index) => {
            // The first column ('Modello') is fixed and cannot be hidden.
            if (index === 0) return;

            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.dataset.columnIndex = index + 1; // Use 1-based index for nth-child selector
            checkbox.addEventListener('change', handleColumnToggle);

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(header));
            container.appendChild(label);
        });
    }

    function handleColumnToggle(event) {
        const columnIndex = event.target.dataset.columnIndex;
        const table = document.querySelector('.comparison-table');
        if (!table) return;

        const cells = table.querySelectorAll(`th:nth-child(${columnIndex}), td:nth-child(${columnIndex})`);
        cells.forEach(cell => {
            cell.style.display = event.target.checked ? '' : 'none';
        });
    }

    function renderComparisonTable(category, allData) {
        const container = document.getElementById('comparison-table-container');
        if (!container) return;

        const config = tableConfig[category];
        const items = [...allData[category]]; // Create a shallow copy to avoid modifying original data

        if (!config || !items) {
            container.innerHTML = '<p>Configurazione o dati non trovati per questa categoria.</p>';
            return;
        }

        // Special handling for e-bike score calculation and sorting
        if (category === 'e_bikes') {
            items.forEach(bike => {
                bike.valutazione = calculateCompositeScore(bike, allData);
            });
            // Sort by score descending
            items.sort((a, b) => b.valutazione - a.valutazione);
        }

        const table = document.createElement('table');
        table.className = 'comparison-table';

        // Create Headers
        const thead = document.createElement('thead');
        let headerHtml = '<tr>';
        config.headers.forEach((header, index) => {
            headerHtml += `<th class="${index === 0 ? 'fixed-column' : ''}">${header}</th>`;
        });
        headerHtml += '</tr>';
        thead.innerHTML = headerHtml;
        table.appendChild(thead);

        // Create Body
        const tbody = document.createElement('tbody');
        items.forEach(item => {
            let rowHtml = '<tr>';
            config.dataKeys.forEach((key, index) => {
                const isFixed = index === 0;
                let cellContent = item[key] !== undefined && item[key] !== null ? item[key] : 'N/D';

                // Create link for the first column (Modello)
                if (isFixed) {
                    const detailUrl = category === 'e_bikes'
                        ? `${basePath}/classifiche/scheda-ebike.html?id=${encodeURIComponent(item.id)}`
                        : `${basePath}/classifiche/scheda-componente.html?type=${encodeURIComponent(category)}&id=${encodeURIComponent(item.id)}`;

                    const linkText = (category !== 'e_bikes' && item.marca)
                        ? `${escapeHTML(item.marca)} ${escapeHTML(item.modello)}`
                        : escapeHTML(item.modello);

                    cellContent = `<a href="${escapeHTML(detailUrl)}">${linkText}</a>`;

                } else if (category === 'e_bikes' && ['id_motore', 'id_batteria', 'id_freni'].includes(key)) {
                    // Special rendering for linked components in e-bikes table
                    if (key === 'id_motore') {
                        const motor = allData.motori.find(m => m.id === cellContent);
                        cellContent = motor ? `${escapeHTML(motor.marca)} ${escapeHTML(motor.modello)}` : 'N/D';
                    } else if (key === 'id_batteria') {
                        const battery = allData.batterie.find(b => b.id === cellContent);
                        cellContent = battery ? `${escapeHTML(battery.marca)} ${escapeHTML(battery.modello)}` : 'N/D';
                    } else if (key === 'id_freni') {
                         const brake = allData.freni.find(f => f.id === cellContent);
                         cellContent = brake ? `${escapeHTML(brake.marca)} ${escapeHTML(brake.modello)}` : 'N/D';
                    }
                } else {
                    // For all other data cells, including e-bikes general info, escape the content
                    cellContent = escapeHTML(cellContent);
                }

                // Add a rating badge for the 'valutazione' key
                if (key === 'valutazione' && cellContent !== 'N/D' && cellContent > 0) {
                    cellContent = `<span class="rating-badge">${cellContent}</span>`;
                } else if (key === 'valutazione') {
                    cellContent = 'N/D';
                }


                rowHtml += `<td class="${isFixed ? 'fixed-column model-name' : ''}">${cellContent}</td>`;
            });
            rowHtml += '</tr>';
            tbody.innerHTML += rowHtml;
        });
        table.appendChild(tbody);

        container.innerHTML = ''; // Clear previous table
        container.appendChild(table);

        // Populate checkboxes after rendering the table
        populateColumnToggle(category);
    }


    /************************************************
     * COMPONENT DETAIL PAGE
     ************************************************/

    function renderComponentDetail(type, item) {
        // --- Sanitize and Format Display ---
        const formatHeader = (key) => {
            const words = key.replace(/_/g, ' ').split(' ');
            return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        };

        const mainContainer = document.getElementById('component-detail-main');
        if (!item) {
            mainContainer.innerHTML = '<h2>Componente non trovato</h2>';
            return;
        }

        const modelName = `${item.marca ? item.marca : ''} ${item.modello}`;

        // --- Update Meta Tags ---
        // textContent is safe
        document.getElementById('page-title').textContent = `${modelName} - Dettagli e Specifiche | E-Bike Ratings`;
        document.getElementById('page-description').setAttribute('content', `Scopri le specifiche tecniche dettagliate per il componente ${modelName}.`);

        // --- Populate Hero ---
        document.getElementById('component-model-name').textContent = modelName;
        const ratingContainer = document.getElementById('component-rating-container');
        if (item.valutazione) {
            ratingContainer.innerHTML = `
                <span>Punteggio</span>
                <div id="component-final-score" class="rating-badge large">${escapeHTML(item.valutazione)}</div>
            `;
            ratingContainer.style.display = 'flex';
        } else {
            ratingContainer.innerHTML = '';
            ratingContainer.style.display = 'none';
        }

        // --- Populate Specs List ---
        const specsList = document.getElementById('component-specs-list');
        specsList.innerHTML = ''; // Clear
        const excludedKeys = ['id', 'posizione', 'modello', 'marca', 'valutazione', 'note', 'analisi_completa', 'fonte_url', 'analisi'];


        for (const [key, value] of Object.entries(item)) {
            if (!excludedKeys.includes(key) && value !== null && value !== undefined && value !== '') {
                const displayValue = Array.isArray(value)
                    ? value.map(v => escapeHTML(v)).join(', ')
                    : escapeHTML(value);
                specsList.innerHTML += `
                    <li>
                        <strong>${escapeHTML(formatHeader(key))}:</strong>
                        <span>${displayValue}</span>
                    </li>`;
            }
        }
        // Add a link to the source if it exists
        if(item.fonte_url && isSafeUrl(item.fonte_url)) {
             specsList.innerHTML += `
                    <li>
                        <strong>Fonte:</strong>
                        <span><a href="${escapeHTML(item.fonte_url)}" target="_blank" rel="noopener noreferrer">Link alla fonte</a></span>
                    </li>`;
        }


        // --- Populate Analysis Section ---
        const analysisContainer = document.getElementById('component-analysis-container');
        const analysisText = item.note || item.analisi; // Use 'note' for components, 'analisi' as fallback
        if (analysisText) {
            analysisContainer.innerHTML = `
                <h2>Analisi del Componente</h2>
                <p>${escapeHTML(analysisText)}</p>
            `;
            analysisContainer.style.display = 'block';
        } else {
            analysisContainer.innerHTML = '';
            analysisContainer.style.display = 'none';
        }
    }


    /************************************************
     * DYNAMIC E-BIKE RANKINGS & DETAIL
     ************************************************/
    const renderEBikeRow = (eBike, allData) => {
        const motore = allData.motori.find(m => m.id === eBike.id_motore);
        const batteria = allData.batterie.find(b => b.id === eBike.id_batteria);
        const freni = allData.freni.find(f => f.id === eBike.id_freni);
        const forcella = allData.sospensioni.find(s => s.id === eBike.id_forcella);
        const ammortizzatore = allData.sospensioni.find(s => s.id === eBike.id_ammortizzatore);

        const score = calculateCompositeScore(eBike, allData);
        const scoreBadge = score > 0 ? `<span class="rating-badge">${escapeHTML(score)}</span>` : 'N/D';

        const getComponentDetails = (comp) => {
            if (!comp) return 'N/D';
            const rating = comp.valutazione ? ` (${escapeHTML(comp.valutazione)})` : '';
            return `${escapeHTML(comp.marca)} ${escapeHTML(comp.modello)}${rating}`;
        };

        return `
            <tr>
                <td>${escapeHTML(eBike.posizione) || '-'}</td>
                <td class="model-name"><a href="${basePath}/classifiche/scheda-ebike.html?id=${encodeURIComponent(eBike.id)}">${escapeHTML(eBike.modello)}</a></td>
                <td>${scoreBadge}</td>
                <td class="model-summary">
                    <strong>Motore:</strong> ${getComponentDetails(motore)}<br>
                    <strong>Batteria:</strong> ${getComponentDetails(batteria)}<br>
                    <strong>Freni:</strong> ${getComponentDetails(freni)}<br>
                    <strong>Forcella:</strong> ${getComponentDetails(forcella)}<br>
                    <strong>Ammortizzatore:</strong> ${getComponentDetails(ammortizzatore)}
                </td>
            </tr>`;
    };

    function renderEBikeDetail(eBike, allData) {
        // Find components
        const motore = allData.motori.find(m => m.id === eBike.id_motore);
        const batteria = allData.batterie.find(b => b.id === eBike.id_batteria);
        const freni = allData.freni.find(f => f.id === eBike.id_freni);
        const forcella = allData.sospensioni.find(s => s.id === eBike.id_forcella);
        const ammortizzatore = allData.sospensioni.find(s => s.id === eBike.id_ammortizzatore);

        const score = calculateCompositeScore(eBike, allData);

        // Populate Hero
        document.getElementById('ebike-model-name').textContent = eBike.modello;
        const scoreElement = document.getElementById('ebike-final-score');
        const scoreContainer = scoreElement.parentElement;
        if (score > 0) {
            scoreElement.textContent = score;
            scoreContainer.style.display = 'flex';
        } else {
            scoreContainer.style.display = 'none';
        }


        // Update Meta Tags
        document.getElementById('page-title').textContent = `${eBike.modello} - Recensione e Punteggio | E-Bike Ratings`;
        document.getElementById('page-description').setAttribute('content', `Scopri la valutazione dettagliata e i componenti della ${eBike.modello}. Punteggio finale: ${score}, basato su test di motore, batteria e freni.`);

        // Populate Key Specs
        const specsList = document.getElementById('ebike-specs-list');
        specsList.innerHTML = ''; // Clear
        const components = { 'Motore': motore, 'Batteria': batteria, 'Freni': freni, 'Forcella': forcella, 'Ammortizzatore': ammortizzatore };
        for(const [name, component] of Object.entries(components)) {
            if (component) {
                const ratingBadge = component.valutazione ? `<span class="rating-badge small">${escapeHTML(component.valutazione)}</span>` : '';
                const componentType = getComponentType(name);
                const componentUrl = componentType
                    ? `${basePath}/classifiche/scheda-componente.html?type=${encodeURIComponent(componentType)}&id=${encodeURIComponent(component.id)}`
                    : '#';

                specsList.innerHTML += `
                    <li>
                        <strong>${escapeHTML(name)}:</strong>
                        <a href="${escapeHTML(componentUrl)}">
                            <span>${escapeHTML(component.marca)} ${escapeHTML(component.modello)}</span>
                            ${ratingBadge}
                        </a>
                    </li>`;
            }
        }

        // Populate Analysis (assuming it exists in the ebike object, if not, this can be extended)
        const analysisContent = document.getElementById('ebike-analysis-content');
        if (eBike.analisi_completa) {
            analysisContent.innerHTML = `<p>${escapeHTML(eBike.analisi_completa)}</p>`;
        } else {
            analysisContent.innerHTML = '<p>Nessuna analisi dettagliata disponibile per questo modello.</p>';
        }
    }


    /************************************************
     * RENDERERS & MAIN DATA LOADING
     ************************************************/

    const renderers = {
        motori: (item) => `
            <tr>
                <td>${escapeHTML(item.posizione) || '-'}</td>
                <td class="model-name"><a href="${basePath}/classifiche/scheda-componente.html?type=motori&id=${encodeURIComponent(item.id)}">${escapeHTML(item.marca)} ${escapeHTML(item.modello)}</a></td>
                <td>${escapeHTML(item.coppia_max_nm) || 'N/D'} Nm</td>
                <td>${escapeHTML(item.peso_kg) || 'N/D'} kg</td>
                <td>${escapeHTML(item.potenza_picco_w) || 'N/D'} W</td>
                <td>${item.valutazione ? `<span class="rating-badge">${escapeHTML(item.valutazione)}</span>` : 'N/D'}</td>
            </tr>`,
        batterie: (item) => `
            <tr>
                <td>${escapeHTML(item.posizione) || '-'}</td>
                <td class="model-name"><a href="${basePath}/classifiche/scheda-componente.html?type=batterie&id=${encodeURIComponent(item.id)}">${escapeHTML(item.marca)} ${escapeHTML(item.modello)}</a></td>
                <td>${escapeHTML(item.capacita_wh) || 'N/D'} Wh</td>
                <td>${item.valutazione ? `<span class="rating-badge">${escapeHTML(item.valutazione)}</span>` : 'N/D'}</td>
            </tr>`,
        freni: (item) => `
            <tr>
                <td>${escapeHTML(item.posizione) || '-'}</td>
                <td class="model-name"><a href="${basePath}/classifiche/scheda-componente.html?type=freni&id=${encodeURIComponent(item.id)}">${escapeHTML(item.marca)} ${escapeHTML(item.modello)}</a></td>
                <td>${escapeHTML(item.tipo) || 'N/D'}</td>
                <td>${escapeHTML(item.numero_pistoncini) || 'N/D'}</td>
                <td>${item.valutazione ? `<span class="rating-badge">${escapeHTML(item.valutazione)}</span>` : 'N/D'}</td>
            </tr>`,
        sospensioni: (item) => `
            <tr>
                <td>${escapeHTML(item.posizione) || '-'}</td>
                <td class="model-name"><a href="${basePath}/classifiche/scheda-componente.html?type=sospensioni&id=${encodeURIComponent(item.id)}">${escapeHTML(item.marca)} ${escapeHTML(item.modello)}</a></td>
                <td>${escapeHTML(item.tipo) || 'N/D'}</td>
                <td>${item.escursione_mm ? `${escapeHTML(item.escursione_mm)} mm` : 'N/A'}</td>
                <td>${item.valutazione ? `<span class="rating-badge">${escapeHTML(item.valutazione)}</span>` : 'N/D'}</td>
            </tr>`
    };

    fetch(dataPath)
        .then(response => {
            if (!response.ok) throw new Error(`Data not found at ${dataPath}`);
            return response.json();
        })
        .then(data => {
            // Render E-Bike table on index.html
            const ebikeRankingsBody = document.getElementById('ebike-rankings-body');
            if (ebikeRankingsBody) {
                renderComponentTable(ebikeRankingsBody, data.e_bikes, (eBike) => renderEBikeRow(eBike, data));
            }

            // Render E-Bike detail page
            if (document.getElementById('ebike-model-name')) { // More specific selector
                const bikeId = getUrlParameter('id');
                if (bikeId) {
                    const bikeData = data.e_bikes.find(b => b.id === bikeId);
                    if (bikeData) {
                        renderEBikeDetail(bikeData, data);
                    } else {
                        document.querySelector('.scheda-ebike-main').innerHTML = '<h2>E-Bike non trovata</h2>';
                    }
                }
            }

            // Render Component detail page
            if (document.getElementById('component-detail-main')) {
                const type = getUrlParameter('type');
                const id = getUrlParameter('id');

                if (type && id && data[type]) {
                    const itemData = data[type].find(item => item.id === id);
                    if (itemData) {
                        renderComponentDetail(type, itemData);
                    } else {
                        document.getElementById('component-detail-main').innerHTML = '<h2>Componente non trovato</h2>';
                    }
                } else {
                     document.getElementById('component-detail-main').innerHTML = '<h2>Parametri non validi o mancanti per caricare il componente.</h2>';
                }
            }

            // Comparison Page Logic
            const comparisonContainer = document.getElementById('comparison-table-container');
            if (comparisonContainer) {
                const categorySelector = document.getElementById('category-select');

                const updateComparisonView = () => {
                    const selectedCategory = categorySelector.value;
                    renderComparisonTable(selectedCategory, data);
                };

                // Initial render
                updateComparisonView();

                // Add event listener for changes
                categorySelector.addEventListener('change', updateComparisonView);
            }

            // Render component tables on any page that has them
            for (const type in renderers) {
                const tableBody = document.querySelector(`[data-component-type="${type}"] tbody, #${type}-rankings-body`);
                if (tableBody) {
                    renderComponentTable(tableBody, data[type], renderers[type]);
                }
            }

            // Search functionality for the components page
            const searchInput = document.getElementById('component-search');
            const searchAnnouncer = document.getElementById('search-results-announcer');

            if (searchInput) {
                searchInput.addEventListener('keyup', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    let totalResults = 0;

                    for (const type in renderers) {
                        const tableBody = document.querySelector(`[data-component-type="${type}"] tbody`);
                        if (tableBody) {
                            const filteredData = data[type].filter(item =>
                                (item.marca + " " + item.modello).toLowerCase().includes(searchTerm)
                            );
                            renderComponentTable(tableBody, filteredData, renderers[type]);
                            totalResults += filteredData.length;
                        }
                    }

                    if (searchAnnouncer) {
                        searchAnnouncer.textContent = `${totalResults} risultati trovati`;
                    }
                });
            }

            // Filter and Sort functionality for Motors table
            const sortMotori = document.getElementById('sort-motori');
            const filterMarcaMotori = document.getElementById('filter-marca-motori');
            const motoriTableBody = document.querySelector('[data-component-type="motori"] tbody');

            if (sortMotori && filterMarcaMotori && motoriTableBody) {
                // Populate brand filter
                const motorBrands = [...new Set(data.motori.map(m => m.marca))];
                motorBrands.sort().forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand;
                    option.textContent = brand;
                    filterMarcaMotori.appendChild(option);
                });

                // Function to apply filters and sort
                const applyMotorFilters = () => {
                    let filteredData = [...data.motori]; // Start with original data
                    const brand = filterMarcaMotori.value;
                    const sortBy = sortMotori.value;

                    // Apply brand filter
                    if (brand !== 'all') {
                        filteredData = filteredData.filter(m => m.marca === brand);
                    }

                    // Apply sort
                    switch(sortBy) {
                        case 'valutazione':
                            filteredData.sort((a, b) => b.valutazione - a.valutazione);
                            break;
                        case 'coppia':
                            filteredData.sort((a, b) => b.coppia - a.coppia);
                            break;
                        case 'peso_kg':
                            filteredData.sort((a, b) => a.peso_kg - b.peso_kg);
                            break;
                        case 'posizione':
                        default:
                            filteredData.sort((a, b) => a.posizione - b.posizione);
                            break;
                    }

                    renderComponentTable(motoriTableBody, filteredData, renderers.motori);
                };

                // Add event listeners
                sortMotori.addEventListener('change', applyMotorFilters);
                filterMarcaMotori.addEventListener('change', applyMotorFilters);
            }
        })
        .catch(error => console.error('Error loading main data:', error));

    /************************************************
     * CONTACT FORM HANDLING
     ************************************************/
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.textContent = 'Invio in corso...';

            setTimeout(() => {
                contactForm.innerHTML = `
                    <div style="padding: 24px; background-color: var(--color-surface-container); border-radius: var(--radius-medium); text-align: center; border: 1px solid var(--color-primary);">
                        <h3 style="color: var(--color-primary); margin-bottom: 12px;">Messaggio Inviato!</h3>
                        <p style="color: var(--color-on-surface);">Grazie per averci contattato. Ti risponderemo al più presto.</p>
                    </div>`;
                // Ensure the message is visible/focused if needed, but replacement is usually sufficient.
            }, 1500);
        });
    }
});
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getComponentType };
}