document.addEventListener("DOMContentLoaded", function() {

    /************************************************
     * CONFIGURATION
     ************************************************/
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
        loadTemplate(`${basePath}/footer.html`, footerPlaceholder);
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
        items.forEach(item => {
            tableBody.innerHTML += renderer(item);
        });
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
            dataKeys: ['modello', 'marca', 'valutazione', 'coppia', 'peso_kg', 'potenza_picco_w', 'anno_rilascio']
        },
        'batterie': {
            headers: ['Modello', 'Marca', 'Valutazione', 'Capacità (Wh)', 'Anno Rilascio'],
            dataKeys: ['modello', 'marca', 'valutazione', 'capacita', 'anno_rilascio']
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
                        ? `${basePath}/classifiche/scheda-ebike.html?id=${item.id}`
                        : `${basePath}/classifiche/scheda-componente.html?type=${category}&id=${item.id}`;

                    const linkText = (category !== 'e_bikes' && item.marca)
                        ? `${item.marca} ${item.modello}`
                        : item.modello;

                    cellContent = `<a href="${detailUrl}">${linkText}</a>`;

                } else if (category === 'e_bikes') {
                    // Special rendering for linked components in e-bikes table
                    if (key === 'id_motore') {
                        const motor = allData.motori.find(m => m.id === cellContent);
                        cellContent = motor ? `${motor.marca} ${motor.modello}` : 'N/D';
                    } else if (key === 'id_batteria') {
                        const battery = allData.batterie.find(b => b.id === cellContent);
                        cellContent = battery ? `${battery.marca} ${battery.modello}` : 'N/D';
                    } else if (key === 'id_freni') {
                         const brake = allData.freni.find(f => f.id === cellContent);
                         cellContent = brake ? `${brake.marca} ${brake.modello}` : 'N/D';
                    }
                }

                // Add a rating badge for the 'valutazione' key
                if (key === 'valutazione' && cellContent !== 'N/D') {
                    cellContent = `<span class="rating-badge">${cellContent}</span>`;
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
        document.getElementById('page-title').textContent = `${modelName} - Dettagli e Specifiche | E-Bike Ratings`;
        document.getElementById('page-description').setAttribute('content', `Scopri le specifiche tecniche dettagliate per il componente ${modelName}.`);

        // --- Populate Hero ---
        document.getElementById('component-model-name').textContent = modelName;
        const ratingContainer = document.getElementById('component-rating-container');
        if (item.valutazione) {
            ratingContainer.innerHTML = `
                <span>Punteggio</span>
                <div id="component-final-score" class="rating-badge large">${item.valutazione}</div>
            `;
        } else {
            ratingContainer.innerHTML = '';
        }

        // --- Populate Specs List ---
        const specsList = document.getElementById('component-specs-list');
        specsList.innerHTML = ''; // Clear
        const excludedKeys = ['id', 'posizione', 'modello', 'marca', 'valutazione', 'analisi', 'fonte_url'];

        for (const [key, value] of Object.entries(item)) {
            if (!excludedKeys.includes(key) && value !== null && value !== undefined) {
                specsList.innerHTML += `
                    <li>
                        <strong>${formatHeader(key)}:</strong>
                        <span>${value}</span>
                    </li>`;
            }
        }
        // Add a link to the source if it exists
        if(item.fonte_url) {
             specsList.innerHTML += `
                    <li>
                        <strong>Fonte:</strong>
                        <span><a href="${item.fonte_url}" target="_blank" rel="noopener noreferrer">Link al sito del produttore</a></span>
                    </li>`;
        }


        // --- Populate Analysis Section ---
        const analysisContainer = document.getElementById('component-analysis-container');
        if (item.analisi) {
            analysisContainer.innerHTML = `
                <h2>Analisi del Componente</h2>
                <p>${item.analisi}</p>
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

        return `
            <tr>
                <td>${eBike.posizione}</td>
                <td class="model-name"><a href="${basePath}/classifiche/scheda-ebike.html?id=${eBike.id}">${eBike.modello}</a></td>
                <td><span class="rating-badge">${score}</span></td>
                <td class="model-summary">
                    <strong>Motore:</strong> ${motore ? `${motore.marca} ${motore.modello} (${motore.valutazione})` : 'N/D'}<br>
                    <strong>Batteria:</strong> ${batteria ? `${batteria.marca} ${batteria.modello} (${batteria.valutazione})` : 'N/D'}<br>
                    <strong>Freni:</strong> ${freni ? `${freni.marca} ${freni.modello} (${freni.valutazione})` : 'N/D'}<br>
                    <strong>Forcella:</strong> ${forcella ? `${forcella.marca} ${forcella.modello} (${forcella.valutazione})` : 'N/D'}<br>
                    <strong>Ammortizzatore:</strong> ${ammortizzatore ? `${ammortizzatore.marca} ${ammortizzatore.modello} (${ammortizzatore.valutazione})` : 'N/D'}
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
        document.getElementById('ebike-final-score').textContent = score;

        // Update Meta Tags
        document.getElementById('page-title').textContent = `${eBike.modello} - Recensione e Punteggio | E-Bike Ratings`;
        document.getElementById('page-description').setAttribute('content', `Scopri la valutazione dettagliata e i componenti della ${eBike.modello}. Punteggio finale: ${score}, basato su test di motore, batteria e freni.`);

        // Populate Key Specs
        const specsList = document.getElementById('ebike-specs-list');
        specsList.innerHTML = ''; // Clear
        const components = { 'Motore': motore, 'Batteria': batteria, 'Freni': freni, 'Forcella': forcella, 'Ammortizzatore': ammortizzatore };
        for(const [name, component] of Object.entries(components)) {
            if (component) {
                specsList.innerHTML += `
                    <li>
                        <strong>${name}:</strong>
                        <span>${component.marca} ${component.modello}</span>
                        <span class="rating-badge small">${component.valutazione}</span>
                    </li>`;
            }
        }

        // Populate Analysis (assuming it exists in the ebike object, if not, this can be extended)
        const analysisContent = document.getElementById('ebike-analysis-content');
        if (eBike.analisi) {
            analysisContent.innerHTML = eBike.analisi;
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
                <td>${item.posizione}</td>
                <td class="model-name">${item.marca}</td>
                <td>${item.modello}</td>
                <td>${item.coppia} Nm</td>
                <td>${item.peso_kg} kg</td>
                <td>${item.potenza_picco_w} W</td>
                <td><span class="rating-badge">${item.valutazione}</span></td>
                <td><a href="${item.fonte_url}" target="_blank" rel="noopener noreferrer" class="link-button">Verifica</a></td>
            </tr>`,
        batterie: (item) => `
            <tr>
                <td>${item.posizione}</td>
                <td class="model-name">${item.marca}</td>
                <td>${item.modello}</td>
                <td>${item.capacita} Wh</td>
                <td><span class="rating-badge">${item.valutazione}</span></td>
            </tr>`,
        freni: (item) => `
            <tr>
                <td>${item.posizione}</td>
                <td class="model-name">${item.marca} ${item.modello}</td>
                <td>${item.tipo}</td>
                <td><span class="rating-badge">${item.valutazione}</span></td>
                <td class="model-summary">${item.analisi}</td>
            </tr>`,
        sospensioni: (item) => `
            <tr>
                <td>${item.posizione}</td>
                <td class="model-name">${item.marca}</td>
                <td>${item.modello}</td>
                <td>${item.tipo}</td>
                <td>${item.escursione_mm ? `${item.escursione_mm} mm` : 'N/A'}</td>
                <td><span class="rating-badge">${item.valutazione}</span></td>
                <td class="model-summary">${item.analisi}</td>
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
            if (searchInput) {
                searchInput.addEventListener('keyup', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    for (const type in renderers) {
                        const tableBody = document.querySelector(`[data-component-type="${type}"] tbody`);
                        if (tableBody) {
                            const filteredData = data[type].filter(item =>
                                (item.marca + " " + item.modello).toLowerCase().includes(searchTerm)
                            );
                            renderComponentTable(tableBody, filteredData, renderers[type]);
                        }
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
});