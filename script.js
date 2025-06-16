document.addEventListener("DOMContentLoaded", function() {
    
    /************************************************
     * DYNAMIC HEADER & FOOTER LOADING
     ************************************************/
    
    const headerPlaceholder = document.getElementById("header-placeholder");
    const footerPlaceholder = document.getElementById("footer-placeholder");

    const isSubfolder = window.location.pathname.includes('/classifiche/');
    const basePath = isSubfolder ? '..' : '.';

    if (headerPlaceholder) {
        fetch(`${basePath}/header.html`)
            .then(response => {
                if (!response.ok) throw new Error('Header not found');
                return response.text();
            })
            .then(data => {
                headerPlaceholder.innerHTML = data;
                adjustNavigation(isSubfolder);
            })
            .catch(error => console.error('Error loading header:', error));
    }

    if (footerPlaceholder) {
        fetch(`${basePath}/footer.html`)
            .then(response => {
                if (!response.ok) throw new Error('Footer not found');
                return response.text();
            })
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(error => console.error('Error loading footer:', error));
    }

    function adjustNavigation(isInSubfolder) {
        const navLinks = document.querySelectorAll('#header-placeholder nav a');
        const currentPath = window.location.pathname;

        navLinks.forEach(link => {
            const originalHref = link.getAttribute('href');
            let finalHref = originalHref;

            if (isInSubfolder) {
                finalHref = `../${originalHref}`;
                link.setAttribute('href', finalHref);
            }
            
            if (new URL(link.href).pathname === currentPath) {
                link.classList.add('active');
            }
        });
    }

    /************************************************
     * LIVE SEARCH FUNCTIONALITY (for componenti.html)
     ************************************************/
    
    const searchInput = document.getElementById('component-search');
    const motoriTableBody = document.querySelector('#rankings-motori tbody');

    if (searchInput && motoriTableBody) {
        let allMotori = [];
        const data_path = `${basePath}/ebike-data.json`;

        fetch(data_path)
            .then(response => response.json())
            .then(data => {
                allMotori = data.motori;
                renderMotoriTable(allMotori);
            })
            .catch(error => console.error('Error loading component data:', error));

        searchInput.addEventListener('keyup', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredMotori = allMotori.filter(motore => 
                motore.marca.toLowerCase().includes(searchTerm) ||
                motore.modello.toLowerCase().includes(searchTerm)
            );
            renderMotoriTable(filteredMotori);
        });
    }

    function renderMotoriTable(motori) {
        motoriTableBody.innerHTML = ''; // Clear existing table rows
        if (motori.length === 0) {
            motoriTableBody.innerHTML = '<tr><td colspan="8">Nessun componente trovato.</td></tr>';
            return;
        }
        motori.forEach(motore => {
            const row = `
                <tr>
                    <td>${motore.posizione}</td>
                    <td class="model-name">${motore.marca}</td>
                    <td>${motore.modello}</td>
                    <td>${motore.coppia} Nm</td>
                    <td>${motore.peso_kg} kg</td>
                    <td>${motore.potenza_picco_w} W</td>
                    <td><span class="rating-badge">${motore.valutazione}</span></td>
                    <td><a href="${motore.fonte_url}" target="_blank" rel="noopener noreferrer" class="link-button">Verifica</a></td>
                </tr>`;
            motoriTableBody.innerHTML += row;
        });
    }
});