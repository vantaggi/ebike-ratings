document.addEventListener("DOMContentLoaded", function() {

    /************************************************
     * CONFIGURATION
     ************************************************/
    const isSubfolder = window.location.pathname.includes('/classifiche/');
    const basePath = isSubfolder ? '..' : '.';
    const dataPath = `${basePath}/ebike-data.json`;

    const componentConfig = {
        'motori': {
            containerId: '#rankings-motori tbody',
            columns: [
                { header: '#', render: item => item.posizione },
                { header: 'Marca', render: item => `<td class="model-name">${item.marca}</td>` },
                { header: 'Modello', render: item => item.modello },
                { header: 'Coppia', render: item => `${item.coppia} Nm` },
                { header: 'Peso', render: item => `${item.peso_kg} kg` },
                { header: 'Potenza di Picco', render: item => `${item.potenza_picco_w} W` },
                { header: 'Valutazione', render: item => `<span class="rating-badge">${item.valutazione}</span>` },
                { header: 'Fonte', render: item => `<a href="${item.fonte_url}" target="_blank" rel="noopener noreferrer" class="link-button">Verifica</a>` }
            ]
        },
        'batterie': {
            containerId: '#rankings-batterie tbody',
            columns: [
                { header: '#', render: item => item.posizione },
                { header: 'Marca', render: item => `<td class="model-name">${item.marca}</td>` },
                { header: 'Modello', render: item => item.modello },
                { header: 'Capacità', render: item => `${item.capacita} Wh` },
                { header: 'Valutazione', render: item => `<span class="rating-badge">${item.valutazione}</span>` }
            ]
        },
        'brakes': {
            containerId: '#rankings-freni tbody',
            columns: [
                { header: '#', render: item => item.posizione },
                { header: 'Modello', render: item => `<td class="model-name">${item.marca} ${item.modello}</td>` },
                { header: 'Valutazione', render: item => `<span class="rating-badge">${item.valutazione}</span>` },
                { header: 'Analisi', render: item => `<td class="model-summary">${item.analisi}</td>` }
            ]
        },
        'suspensions': {
            containerId: '#rankings-sospensioni tbody',
            columns: [
                { header: '#', render: item => item.posizione },
                { header: 'Marca', render: item => `<td class="model-name">${item.marca}</td>` },
                { header: 'Modello', render: item => item.modello },
                { header: 'Tipo', render: item => item.tipo },
                { header: 'Escursione', render: item => item.escursione_mm ? `${item.escursione_mm} mm` : 'N/A' },
                { header: 'Valutazione', render: item => `<span class="rating-badge">${item.valutazione}</span>` },
                { header: 'Analisi', render: item => `<td class="model-summary">${item.analisi}</td>` }
            ]
        }
    };

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

    function renderTable(container, items, columns) {
        container.innerHTML = '';
        if (items.length === 0) {
            container.innerHTML = `<tr><td colspan="${columns.length}">Nessun dato trovato.</td></tr>`;
            return;
        }
        items.forEach(item => {
            const row = document.createElement('tr');
            const cells = columns.map(column => {
                const cellContent = column.render(item);
                // If render returns a full <td>, use it. Otherwise, wrap in a <td>.
                return cellContent.startsWith('<td') ? cellContent : `<td>${cellContent}</td>`;
            }).join('');
            row.innerHTML = cells;
            container.appendChild(row);
        });
    }

    /************************************************
     * DYNAMIC E-BIKE RANKINGS (for index.html)
     ************************************************/

    function renderEBikeRankings(eBikes, allData) {
        const ebikeRankingsBody = document.getElementById('ebike-rankings-body');
        if (!ebikeRankingsBody) return;

        ebikeRankingsBody.innerHTML = '';
        if (eBikes.length === 0) {
            ebikeRankingsBody.innerHTML = '<tr><td colspan="4">Nessuna e-bike trovata.</td></tr>';
            return;
        }

        eBikes.forEach(eBike => {
            const motore = allData.motori.find(m => m.id === eBike.motore_id);
            const batteria = allData.batterie.find(b => b.id === eBike.batteria_id);
            const freni = allData.brakes.find(f => f.id === eBike.freni_id);

            const row = `
                <tr>
                    <td>${eBike.posizione}</td>
                    <td class="model-name">${eBike.modello}</td>
                    <td><span class="rating-badge">${eBike.punteggio_finale}</span></td>
                    <td class="model-summary">
                        <strong>Motore:</strong> ${motore ? `${motore.marca} ${motore.modello} (${motore.valutazione})` : 'N/D'}<br>
                        <strong>Batteria:</strong> ${batteria ? `${batteria.marca} ${batteria.modello} (${batteria.valutazione})` : 'N/D'}<br>
                        <strong>Freni:</strong> ${freni ? `${freni.marca} ${freni.modello} (${freni.valutazione})` : 'N/D'}
                    </td>
                </tr>`;
            ebikeRankingsBody.innerHTML += row;
        });
    }

    /************************************************
     * MAIN DATA LOADING AND INITIALIZATION
     ************************************************/

    fetch(dataPath)
        .then(response => {
            if (!response.ok) throw new Error(`Data not found at ${dataPath}`);
            return response.json();
        })
        .then(data => {
            // Render E-Bike table on the main page
            if (document.getElementById('ebike-rankings-body')) {
                renderEBikeRankings(data.e_bikes, data);
            }

            // Initial render of Component tables
            const componentContainers = document.querySelectorAll('[data-component-type]');
            if (componentContainers.length > 0) {
                componentContainers.forEach(container => {
                    const componentType = container.dataset.componentType;
                    const config = componentConfig[componentType];
                    const tableBody = container.querySelector('tbody');

                    if (config && tableBody) {
                        const items = data[componentType];
                        if (items) {
                            renderTable(tableBody, items, config.columns);
                        } else {
                            console.error(`Data for component type '${componentType}' not found in ebike-data.json`);
                            tableBody.innerHTML = `<tr><td colspan="${config.columns.length}">Errore: dati non trovati.</td></tr>`;
                        }
                    }
                });

                // Add search functionality if the search input exists
                const searchInput = document.getElementById('component-search');
                if (searchInput) {
                    searchInput.addEventListener('keyup', (e) => {
                        const searchTerm = e.target.value.toLowerCase();

                        componentContainers.forEach(container => {
                            const componentType = container.dataset.componentType;
                            const config = componentConfig[componentType];
                            const tableBody = container.querySelector('tbody');
                            const allItems = data[componentType];

                            if (config && tableBody && allItems) {
                                const filteredItems = allItems.filter(item => {
                                    const brand = item.marca ? item.marca.toLowerCase() : '';
                                    const model = item.modello ? item.modello.toLowerCase() : '';
                                    return brand.includes(searchTerm) || model.includes(searchTerm);
                                });
                                renderTable(tableBody, filteredItems, config.columns);
                            }
                        });
                    });
                }
            }
        })
        .catch(error => console.error('Error loading main data:', error));

});