document.addEventListener('DOMContentLoaded', () => {
    // Global state variables
    let fullData = {};
    let currentCategory = null;
    let editingId = null;

    // DOM Elements
    const categorySelector = document.getElementById('category-selector');
    const componentForm = document.getElementById('component-form');
    const formFields = document.getElementById('form-fields');
    const formTitle = document.getElementById('form-title');
    const tableContainer = document.getElementById('table-container');
    const saveAllButton = document.getElementById('save-all-changes');
    const cancelEditButton = document.getElementById('cancel-edit');

    // --- INITIALIZATION ---
    async function initialize() {
        try {
            const response = await fetch('/ebike-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            fullData = await response.json();
            populateCategorySelector();
        } catch (error) {
            console.error("Error fetching initial data:", error);
            alert("Impossibile caricare i dati. Controlla la console per i dettagli.");
        }
    }

    // --- EVENT LISTENERS ---
    categorySelector.addEventListener('change', handleCategoryChange);
    componentForm.addEventListener('submit', handleFormSubmit);
    saveAllButton.addEventListener('click', handleSaveAllChanges);
    cancelEditButton.addEventListener('click', resetForm);

    // --- CORE LOGIC ---
    function populateCategorySelector() {
        const categories = Object.keys(fullData);
        categorySelector.innerHTML = '<option value="">-- Scegli una categoria --</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            categorySelector.appendChild(option);
        });
    }

    function handleCategoryChange() {
        currentCategory = categorySelector.value;
        if (currentCategory) {
            renderTable();
            renderFormFields();
            resetForm();
        } else {
            tableContainer.innerHTML = '';
            formFields.innerHTML = '';
        }
    }

    function renderTable() {
        if (!currentCategory || !fullData[currentCategory]) {
            tableContainer.innerHTML = '<p>Seleziona una categoria per visualizzare i dati.</p>';
            return;
        }

        const items = fullData[currentCategory];
        if (items.length === 0) {
            tableContainer.innerHTML = '<p>Nessun componente in questa categoria.</p>';
            return;
        }

        const headers = Object.keys(items[0]);
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    ${headers.map(h => `<th>${h}</th>`).join('')}
                    <th>Azioni</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        ${headers.map(h => `<td>${item[h] === undefined ? '' : item[h]}</td>`).join('')}
                        <td>
                            <button class="edit-btn" data-id="${item.id}">Modifica</button>
                            <button class="delete-btn" data-id="${item.id}">Elimina</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);

        // Add event listeners to the new buttons
        table.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEditClick));
        table.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteClick));
    }

    function renderFormFields() {
        formFields.innerHTML = '';
        if (!currentCategory || fullData[currentCategory].length === 0) {
            return;
        }
        const sampleItem = fullData[currentCategory][0];
        const fields = Object.keys(sampleItem);

        fields.forEach(field => {
            if (field === 'id') return; // ID is managed automatically

            const div = document.createElement('div');
            const label = document.createElement('label');
            label.for = `field-${field}`;
            label.textContent = field;

            const input = document.createElement('input');
            input.id = `field-${field}`;
            input.name = field;
            input.type = (typeof sampleItem[field] === 'number') ? 'number' : 'text';
            if (input.type === 'number') {
                input.step = 'any'; // Allow decimals
            }
            input.placeholder = `Inserisci ${field}`;

            div.appendChild(label);
            div.appendChild(input);
            formFields.appendChild(div);
        });
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        if (!currentCategory) {
            alert("Per favore, seleziona prima una categoria.");
            return;
        }

        const formData = new FormData(componentForm);
        const newItem = {};
        let isValid = true;

        // Dynamically get fields from the form
        const formInputs = formFields.querySelectorAll('input');
        formInputs.forEach(input => {
            const key = input.name;
            const value = input.type === 'number' ? parseFloat(input.value) : input.value;

            if (input.type === 'number' && isNaN(value)) {
                 // allow empty number fields
                 newItem[key] = undefined;
            } else {
                 newItem[key] = value;
            }
        });

        if (!isValid) return;

        if (editingId !== null) {
            // Update existing item
            const index = fullData[currentCategory].findIndex(item => item.id === editingId);
            if (index > -1) {
                fullData[currentCategory][index] = { ...fullData[currentCategory][index], ...newItem };
            }
        } else {
            // Add new item
            const newId = fullData[currentCategory].length > 0
                ? Math.max(...fullData[currentCategory].map(item => item.id)) + 1
                : 1;
            newItem.id = newId;
            fullData[currentCategory].push(newItem);
        }

        renderTable();
        resetForm();
    }

    function handleEditClick(event) {
        const id = parseInt(event.target.dataset.id);
        editingId = id;

        const itemToEdit = fullData[currentCategory].find(item => item.id === id);
        if (!itemToEdit) return;

        // Populate form
        const formInputs = formFields.querySelectorAll('input');
        formInputs.forEach(input => {
            const key = input.name;
            if (itemToEdit.hasOwnProperty(key)) {
                input.value = itemToEdit[key];
            }
        });

        formTitle.textContent = `Modifica Componente (ID: ${id})`;
        cancelEditButton.style.display = 'inline-block';
        componentForm.querySelector('button[type="submit"]').textContent = 'Aggiorna Componente';
        window.scrollTo({ top: formFields.offsetTop, behavior: 'smooth' });
    }

    function handleDeleteClick(event) {
        const id = parseInt(event.target.dataset.id);
        if (confirm(`Sei sicuro di voler eliminare il componente con ID ${id}?`)) {
            const index = fullData[currentCategory].findIndex(item => item.id === id);
            if (index > -1) {
                fullData[currentCategory].splice(index, 1);
                renderTable();
            }
        }
    }

    function resetForm() {
        componentForm.reset();
        editingId = null;
        formTitle.textContent = 'Aggiungi Nuovo Componente';
        cancelEditButton.style.display = 'none';
        componentForm.querySelector('button[type="submit"]').textContent = 'Salva Componente';
    }

    async function handleSaveAllChanges() {
        if (!confirm("Sei sicuro di voler sovrascrivere il file ebike-data.json con le modifiche attuali?")) {
            return;
        }
        try {
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fullData, null, 2), // Pretty print JSON
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message || "Dati salvati con successo!");
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error saving data:", error);
            alert(`Errore nel salvataggio dei dati: ${error.message}`);
        }
    }

    // --- START ---
    initialize();
});
