// This script handles dynamic content loading and interactive features.

document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. DYNAMIC HEADER & FOOTER LOADING ---
    
    // Define paths for header and footer.
    // Use a base path to correctly locate files from any page depth.
    const base_path = window.location.origin;
    const header_path = `${base_path}/header.html`;
    const footer_path = `${base_path}/footer.html`;

    const headerPlaceholder = document.getElementById("header-placeholder");
    const footerPlaceholder = document.getElementById("footer-placeholder");

    // Fetch and insert the header, then set the active navigation link.
    if (headerPlaceholder) {
        fetch(header_path)
            .then(response => response.text())
            .then(data => {
                headerPlaceholder.innerHTML = data;
                setActiveNav();
            })
            .catch(error => console.error('Error loading header:', error));
    }

    // Fetch and insert the footer.
    if (footerPlaceholder) {
        fetch(footer_path)
            .then(response => response.text())
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(error => console.error('Error loading footer:', error));
    }

    // Function to highlight the active page in the navigation menu.
    function setActiveNav() {
        const currentPage = window.location.pathname;
        let navId;

        // Determine which navigation item corresponds to the current page.
        if (currentPage.includes("index.html") || currentPage === "/") {
            navId = "nav-index";
        } else if (currentPage.includes("e-bike.html")) {
            navId = "nav-e-bike";
        } else if (currentPage.includes("componenti.html")) {
            navId = "nav-componenti";
        } else if (currentPage.includes("marchi.html")) {
            navId = "nav-marchi";
        } else if (currentPage.includes("metodologia.html")) {
            navId = "nav-metodologia";
        } else if (currentPage.includes("chi-siamo.html")) {
            navId = "nav-chi-siamo";
        } else if (currentPage.includes("contatti.html")) {
            navId = "nav-contatti";
        }

        if (navId) {
            const activeLink = document.getElementById(navId);
            if (activeLink) {
                activeLink.classList.add("active");
            }
        }
    }

    // --- 2. LIVE SEARCH FUNCTIONALITY (for componenti.html) ---
    
    const searchInput = document.getElementById('component-search');
    const motoriTableBody = document.querySelector('#rankings-motori tbody');

    // Only run this part if we are on the components page
    if (searchInput && motoriTableBody) {
        let allMotori = [];

        // Fetch component data from the JSON file.
        fetch(`${base_path}/ebike-data.json`)
            .then(response => response.json())
            .then(data => {
                allMotori = data.motori;
                renderMotoriTable(allMotori); // Initial render of the full table
            })
            .catch(error => console.error('Error loading component data:', error));

        // Listen for user input in the search bar.
        searchInput.addEventListener('keyup', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            // Filter the motor list based on the search term.
            const filteredMotori = allMotori.filter(motore => {
                return (
                    motore.marca.toLowerCase().includes(searchTerm) ||
                    motore.modello.toLowerCase().includes(searchTerm)
                );
            });
            
            // Re-render the table with the filtered results.
            renderMotoriTable(filteredMotori);
        });
    }

    // Function to render rows in the motor rankings table.
    function renderMotoriTable(motori) {
        motoriTableBody.innerHTML = ''; // Clear existing table rows

        if (motori.length === 0) {
            motoriTableBody.innerHTML = '<tr><td colspan="6">Nessun componente trovato.</td></tr>';
            return;
        }

        motori.forEach(motore => {
            const row = `
                <tr>
                    <td>${motore.posizione}</td>
                    <td class="model-name">${motore.marca}</td>
                    <td>${motore.modello}</td>
                    <td>${motore.tipo}</td>
                    <td>${motore.coppia}</td>
                    <td><span class="rating-badge">${motore.valutazione}</span></td>
                </tr>
            `;
            motoriTableBody.innerHTML += row;
        });
    }
});