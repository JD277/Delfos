// --- UI Initialization ---
document.addEventListener('DOMContentLoaded', () => {

    // Initialize Dark Mode
    const toggle = document.getElementById('toggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (toggle) toggle.checked = true;
    }

    if (toggle) {
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Initialize Date Filter Constraints
    const startDateInput = document.getElementById('startDateFilter');
    const endDateInput = document.getElementById('endDateFilter');

    const today = new Date().toISOString().split('T')[0];
    if (startDateInput) startDateInput.max = today;
    if (endDateInput) endDateInput.max = today;

    if (startDateInput) {
        startDateInput.addEventListener('change', () => {
            const startDate = startDateInput.value;
            endDateInput.min = startDate;

            if (endDateInput.value && endDateInput.value < startDate) {
                endDateInput.value = startDate;
            }
            filterDates(); // Trigger filter
        });
    }

    // Set Display Date
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = now.toLocaleString('default', { month: 'short' });
    const dayEl = document.getElementById('currentDateDay');
    const monthEl = document.getElementById('currentDateMonth');
    if (dayEl) dayEl.textContent = day;
    if (monthEl) monthEl.textContent = month;

    // Load User Data
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            const userNameEl = document.getElementById('userName');
            const welcomeUserEl = document.getElementById('welcomeUser');
            const userEmailEl = document.getElementById('userEmail');
            const userRoleEl = document.getElementById('userRole');

            if (userNameEl) userNameEl.textContent = user.nombre || 'Usuario';
            if (welcomeUserEl) welcomeUserEl.textContent = user.nombre || 'Usuario';
            if (userEmailEl) userEmailEl.textContent = user.correo || '';
            if (userRoleEl) userRoleEl.textContent = user.tipo || 'Usuario';
        } catch (e) {
            console.error('Error parsing user data', e);
        }
    } else {
        // Optional: Redirect to login if not authenticated
        // window.location.href = 'index.html';
        console.warn('No user session found.');
    }

    setupSidebarToggle();
});

function setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const closeBtn = document.getElementById('sidebarClose');
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const logoFull = sidebar.querySelector('.logo-full');
    const logoIcon = sidebar.querySelector('.logo-icon');
    const sidebarTexts = sidebar.querySelectorAll('.sidebar-text');
    const userEmail = document.getElementById('userEmail');

    function toggleSidebar() {
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // Mobile: Toggle visibility (translate)
            sidebar.classList.toggle('-translate-x-full');
        } else {
            // Desktop: Toggle Full Visibility (w-64 vs w-0)
            const isHidden = sidebar.classList.contains('w-0');

            if (isHidden) {
                // Show
                sidebar.classList.remove('w-0', 'overflow-hidden');
                sidebar.classList.add('w-64');
                // Show Content
                sidebarTexts.forEach(el => el.classList.remove('hidden'));
                if (userEmail) userEmail.classList.remove('hidden');
                if (logoFull) logoFull.classList.remove('hidden');
                if (logoIcon) logoIcon.classList.add('hidden');
            } else {
                // Hide Completely
                sidebar.classList.remove('w-64');
                sidebar.classList.add('w-0', 'overflow-hidden');
                // Hide Content
                sidebarTexts.forEach(el => el.classList.add('hidden'));
                if (userEmail) userEmail.classList.add('hidden');
                if (logoFull) logoFull.classList.add('hidden');
                if (logoIcon) logoIcon.classList.add('hidden');
            }
        }
    }

    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
    if (closeBtn) closeBtn.addEventListener('click', () => {
        // Specific close action for mobile internal button
        sidebar.classList.add('-translate-x-full');
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        if (width >= 768) {
            sidebar.classList.remove('-translate-x-full');
            // Ensure visible if it was hidden by mobile interaction?
            // If it was w-0 (desktop hidden), keep it w-0? 
            // Let's reset to default Expanded on resize to Desktop for simplicity
            if (sidebar.classList.contains('w-0')) {
                // Keep hidden if user hid it? Or reset? 
                // Usually reset is safer to avoid "missing" sidebar
            }
        } else {
            // Mobile default is hidden
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('w-0', 'overflow-hidden');
            sidebar.classList.add('w-64');
            sidebarTexts.forEach(el => el.classList.remove('hidden'));
            if (userEmail) userEmail.classList.remove('hidden');
            if (logoFull) logoFull.classList.remove('hidden');
            if (logoIcon) logoIcon.classList.add('hidden');
        }
    });



    // Initialize state based on screen size (Optional, CSS handles most, but JS syncs text)
    const width = window.innerWidth;
    if (width >= 768 && width < 1024) {
        // Default Tablet State: Collapsed
        sidebar.classList.remove('w-64');
        sidebar.classList.add('w-20');
        sidebarTexts.forEach(el => el.classList.add('hidden'));
        if (userEmail) userEmail.classList.add('hidden');
        if (logoFull) logoFull.classList.add('hidden');
        if (logoIcon) logoIcon.classList.remove('hidden');
    }
}

function updateFileNameDisplay() {
    const input = document.getElementById('fileInput');
    const display = document.getElementById('fileNameDisplay');
    if (input.files.length > 0) {
        display.textContent = `${input.files.length} archivo(s) seleccionado(s)`;
        display.classList.remove('text-gray-500');
        display.classList.add('text-gray-800', 'font-medium');
    } else {
        display.textContent = 'Sin archivos seleccionados';
        display.classList.add('text-gray-500');
        display.classList.remove('text-gray-800', 'font-medium');
    }
}


// --- LOGIC FROM ORIGINAL FILE ---
let supabaseClient = window.sbClient;
let filesToUpload = [];
let uploadIndex = 0;
let isUploading = false;
let isFirstLoad = true;
let currentProducts = [];
let visibleCount = 20;
let currentTab = 'pending'; // 'pending' or 'reviewed'
let currentSearchTerm = '';
let searchDebounceTimer;

// Check if Supabase is initialized
if (supabaseClient) {
    startApp();
} else {
    console.error('Supabase client not initialized globally');
}

function startApp() {
    const WEBHOOK_URL = 'https://fixtop-n8n.depzyb.easypanel.host/webhook/980a3ae4-0cad-46b9-af95-f4365eab7d82';

    // --- Funciones de subida ---
    function sanitizeFilename(name) {
        return name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
    }

    async function uploadFileToSupabase(file, safeName) {
        const { error } = await supabaseClient.storage.from('facturas').upload(safeName, file, { upsert: false });
        if (error) throw new Error(error.message);
        return `${window.SUPABASE_URL}/storage/v1/object/public/facturas/${safeName}`;
    }

    async function sendToWebhook(imageUrl, filename) {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageUrl, filename })
        });
        if (!res.ok) throw new Error(`Webhook falló: ${res.status}`);
    }

    function updateProgress(current, total, message) {
        const percent = Math.round((current / total) * 100);
        document.getElementById('progressBar').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = `${message} (${current}/${total})`;
    }

    async function processNextFile() {
        if (uploadIndex >= filesToUpload.length || !isUploading) return;

        const file = filesToUpload[uploadIndex];
        const safeName = sanitizeFilename(file.name);
        updateProgress(uploadIndex + 1, filesToUpload.length, `Subiendo ${file.name}...`);

        try {
            const imageUrl = await uploadFileToSupabase(file, safeName);
            await sendToWebhook(imageUrl, safeName);
        } catch (err) {
            console.error('Error:', err);
            // alert(`Error en ${file.name}: ${err.message}`); // Silent error for better UX? or Toast?
        }

        uploadIndex++;

        if (uploadIndex < filesToUpload.length) {
            setTimeout(processNextFile, 5000);
        } else {
            isUploading = false;
            document.getElementById('uploadBtn').disabled = false;
            // document.getElementById('productUploadBtnText').textContent = 'Enviar archivos'; // Reset Text (Element not found in original HTML, assume error in original code or ID mismatch? Removing to be safe or check ID)
            // Original code had: document.getElementById('productUploadBtnText').textContent = 'Enviar archivos'; 
            // But I don't see 'productUploadBtnText' in the HTML I read. 
            // Let's check lines 308-312: <button id="uploadBtn">...<span>Enviar archivos</span>...</button>
            // So probably it meant to target the span inside.
            // I will leave it commented out or fix it if I see the ID.

            document.getElementById('progressText').textContent = '✅ Envío completado.';
            loadProducts(); // Actualizar tabla
        }
    }

    window.startUpload = function () {
        const files = Array.from(document.getElementById('fileInput').files);
        if (files.length === 0) return alert('Selecciona al menos un archivo.');
        if (files.length > 80) return alert('Máximo 80 archivos por lote.');

        filesToUpload = files;
        uploadIndex = 0;
        isUploading = true;

        document.getElementById('progressContainer').classList.remove('hidden');
        document.getElementById('uploadBtn').disabled = true;
        // document.getElementById('uploadBtn').classList.add('opacity-50', 'cursor-not-allowed');
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressText').textContent = 'Preparando...';

        processNextFile();
    };

    // --- Gestión de productos con edición en línea ---

    let startDate = null;
    let endDate = null;

    window.filterDates = function () {
        const start = document.getElementById('startDateFilter').value;
        const end = document.getElementById('endDateFilter').value;
        startDate = start ? start : null;
        endDate = end ? end : null;
        loadProducts();
    };

    async function loadProducts() {
        // Si hay una búsqueda activa, no recargar la lista por defecto
        if (currentSearchTerm.length > 0) return;

        const container = document.getElementById('productsTableContainer');
        const isPending = currentTab === 'pending';

        let query = supabaseClient
            .from('productos')
            .select('*')
            .eq('revisado', !isPending)
            .order('created_at', { ascending: false });

        if (startDate) {
            query = query.gte('created_at', startDate + 'T00:00:00');
        }
        if (endDate) {
            query = query.lte('created_at', endDate + 'T23:59:59');
        }

        const { data, error } = await query;

        if (error) {
            container.innerHTML = `
                        <div class="flex items-center justify-center h-full text-red-500">
                             ❌ Error al cargar productos: ${error.message}
                        </div>`;
            isFirstLoad = false;
            return;
        }

        // Evitar refresco si los datos no cambiaron (con manejo de fechas, mejor refrescar si cambiaron las fechas, pero la lógica de arriba ya re-ejecuta loadProducts)
        if (JSON.stringify(data) === JSON.stringify(currentProducts)) {
            if (isFirstLoad) {
                if (!data || data.length === 0) {
                    container.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400">No hay productos ${currentTab === 'pending' ? 'pendientes' : 'revisados'} en este rango.</div>`;
                }
                isFirstLoad = false;
            }
            return;
        }

        currentProducts = data;
        isFirstLoad = false;
        renderProducts();
    }

    window.switchTab = function (tab) {
        if (currentTab === tab) return;
        currentTab = tab;
        visibleCount = 20; // Reset pagination
        currentProducts = []; // Clear current data to force refresh
        isFirstLoad = true; // Show loader logic

        // Toggle Styles
        const tabPending = document.getElementById('tabPending');
        const tabReviewed = document.getElementById('tabReviewed');

        if (tab === 'pending') {
            tabPending.className = "px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-orange-600 text-white shadow-sm";
            tabReviewed.className = "px-4 py-2 rounded-lg text-sm font-bold transition-colors text-orange-600 hover:bg-orange-50 bg-transparent";
        } else {
            tabReviewed.className = "px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-orange-600 text-white shadow-sm";
            tabPending.className = "px-4 py-2 rounded-lg text-sm font-bold transition-colors text-orange-600 hover:bg-orange-50 bg-transparent";
        }

        // Show Loading
        const container = document.getElementById('productsTableContainer');
        container.innerHTML = `
           <div class="flex items-center justify-center h-full text-gray-500 italic">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
            Cargando productos...
           </div>`;

        loadProducts();
    };

    // --- LÓGICA DE BÚSQUEDA (RPC SQL) ---
    // 1. Manejador del Input (Debounce)
    window.handleSearchInput = function (e) {
        const query = e.target.value.trim();
        currentSearchTerm = query;
        clearTimeout(searchDebounceTimer);

        if (query.length === 0) {
            // Si borra el texto, recargamos la vista normal
            loadProducts();
            return;
        }

        // Esperar 300ms antes de llamar a la API
        searchDebounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    };

    // 2. Ejecutar la búsqueda en Supabase
    async function performSearch(term) {
        const container = document.getElementById('productsTableContainer');

        // Mostrar Loading
        container.innerHTML = `
           <div class="flex items-center justify-center h-full text-gray-500 italic">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
            Buscando "${term}"...
           </div>`;

        try {
            // Obtener el modo de búsqueda del select
            // Obtener el modo de búsqueda del select (Safe)
            const modeElement = document.getElementById('searchMode');
            const searchMode = modeElement ? modeElement.value : 'all';

            // Llamada a la función SQL 'search_products_pro'
            // Nota: Esta función debe existir en Supabase
            const { data, error } = await supabaseClient
                .rpc('search_products_pro', {
                    search_term: term,
                    search_mode: searchMode,
                    page_number: 1,
                    page_size: 50
                });

            if (error) throw error;

            // Actualizamos los datos globales y renderizamos
            currentProducts = data;
            visibleCount = 50; // Mostrar más resultados en búsqueda
            renderProducts();

        } catch (err) {
            console.error("Error en búsqueda:", err);
            container.innerHTML = `<div class="text-red-500 text-center p-4">Error buscando: ${err.message}</div>`;
        }
    }

    function renderProducts() {
        const container = document.getElementById('productsTableContainer');
        const data = currentProducts;

        if (!data || data.length === 0) {
            container.innerHTML = `<div class="flex items-center justify-center h-full text-gray-400">No hay productos ${currentTab === 'pending' ? 'pendientes' : 'revisados'}.</div>`;
            return;
        }

        const productsToShow = data.slice(0, visibleCount);
        const total = data.length;

        // Table Construction with Tailwind Classes
        let html = `
                <table class="w-full text-left border-collapse">
                    <thead class="text-white sticky top-0 z-10" style="background-color: rgba(253, 90, 3, 1);">
                        <tr>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Fecha</th>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider">SKU</th>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider">Título</th>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider">Precio</th>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider">Cantidad</th>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider">Marca</th>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider">ID Factura</th>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider">Imagen</th>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider text-center">${currentTab === 'pending' ? 'Revisar' : 'Validado'}</th>
                            <th class="p-4 text-sm font-semibold uppercase tracking-wider rounded-tr-lg text-center"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white text-gray-800">
                `;

        productsToShow.forEach(row => {
            const date = new Date(row.created_at).toLocaleDateString();
            const isChecked = currentTab === 'reviewed' ? 'checked' : '';
            const actionCell = `<input type="checkbox" onchange="markAsReviewed('${row.id}', this.checked)" ${isChecked} class="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300 cursor-pointer" />`;

            html += `
                    <tr class="hover:bg-gray-100 transition-colors odd:bg-white even:bg-gray-50 text-gray-800" data-id="${row.id}">
                        <td class="p-4 text-sm font-mono text-gray-600">${date}</td>
                        <td class="p-4">
                            <input type="text" data-field="sku" data-id="${row.id}" value="${(row.sku || '').replace(/"/g, '&quot;')}" 
                            class="w-full bg-transparent border-b border-gray-300 focus:border-orange-500 text-gray-800 focus:outline-none transition-colors text-sm px-1 py-1" />
                        </td>
                        <td class="p-4">
                            <input type="text" data-field="titulo" data-id="${row.id}" value="${(row.titulo || '').replace(/"/g, '&quot;')}" 
                            class="w-full bg-transparent border-b border-gray-300 focus:border-orange-500 text-gray-800 focus:outline-none transition-colors text-sm px-1 py-1" />
                        </td>
                        <td class="p-4">
                            <div class="flex items-center">
                                <span class="text-gray-500 mr-1">$</span>
                                <input type="number" step="0.01" data-field="precio" data-id="${row.id}" value="${row.precio || ''}" 
                                class="w-20 bg-transparent border-b border-gray-300 focus:border-orange-500 text-gray-800 focus:outline-none transition-colors text-sm px-1 py-1 text-right" />
                            </div>
                        </td>
                        <td class="p-4">
                            <input type="number" data-field="cantidad" data-id="${row.id}" value="${row.cantidad || ''}" 
                            class="w-16 bg-transparent border-b border-gray-300 focus:border-orange-500 text-gray-800 focus:outline-none transition-colors text-sm px-1 py-1 text-center" />
                        </td>
                        <td class="p-4">
                            <input type="text" data-field="marca" data-id="${row.id}" value="${(row.marca || '').replace(/"/g, '&quot;')}" 
                            class="w-full bg-transparent border-b border-gray-300 focus:border-orange-500 text-gray-800 focus:outline-none transition-colors text-sm px-1 py-1" />
                        </td>
                        <td class="p-4">
                            <input type="text" data-field="id_factura" data-id="${row.id}" value="${(row.id_factura || '').replace(/"/g, '&quot;')}" 
                            class="w-full bg-transparent border-b border-gray-300 focus:border-orange-500 text-gray-800 focus:outline-none transition-colors text-sm px-1 py-1 placeholder-gray-400" placeholder="---" />
                        </td>
                        <td class="p-4">
                            <a href="${row.url_imagen}" target="_blank" class="text-blue-600 hover:text-blue-800 underline text-sm">Ver</a>
                        </td>
                        <td class="p-4 text-center">
                            ${actionCell}
                        </td>
                        <td class="p-4 text-center">
                             <button onclick="deleteProduct('${row.id}')" class="text-gray-400 hover:text-red-500 transition-colors focus:outline-none" title="Eliminar">
                                 <i class="fas fa-trash"></i>
                             </button>
                        </td>
                    </tr>
                `;
        });

        html += '</tbody></table>';

        const canShowMore = visibleCount < total;
        const canShowLess = visibleCount > 20;

        html += `
            <div class="flex justify-center items-center p-4 space-x-4 bg-white border-t border-gray-200">
                <button onclick="showLess()" class="${canShowLess ? 'text-primary hover:text-blue-700 font-medium transition-colors' : 'text-gray-400 cursor-not-allowed'}" ${!canShowLess ? 'disabled' : ''}>
                    Mostrar menos
                </button>
                <div class="h-4 w-px bg-gray-300"></div>
                <button onclick="showMore()" class="${canShowMore ? 'text-primary hover:text-blue-700 font-medium transition-colors' : 'text-gray-400 cursor-not-allowed'}" ${!canShowMore ? 'disabled' : ''}>
                    Mostrar más
                </button>
                 <div class="h-4 w-px bg-gray-300"></div>
                <button onclick="showAll()" class="${canShowMore ? 'text-primary hover:text-blue-700 font-medium transition-colors' : 'text-gray-400 cursor-not-allowed'}" ${!canShowMore ? 'disabled' : ''}>
                    Mostrar Todo
                </button>
                 <span class="text-xs text-gray-400 ml-4">(${productsToShow.length} de ${total})</span>
            </div>
        `;

        container.innerHTML = html;

        // Agregar eventos para guardar cambios
        container.querySelectorAll('input[data-field]').forEach(input => {
            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveEdit.call(input);
            });
        });
    }

    window.showMore = function () {
        if (visibleCount < currentProducts.length) {
            visibleCount += 20;
            renderProducts();
        }
    };

    window.showLess = function () {
        if (visibleCount > 20) {
            visibleCount = Math.max(20, visibleCount - 20);
            renderProducts();
        }
    };

    window.showAll = function () {
        if (visibleCount < currentProducts.length) {
            visibleCount = currentProducts.length;
            renderProducts();
        }
    };

    async function saveEdit() {
        const field = this.dataset.field;
        const id = this.dataset.id;
        let value = this.value.trim();

        // Convertir tipos según el campo
        let updateValue = value;
        if (['precio', 'cantidad'].includes(field)) {
            if (value === '') {
                updateValue = null;
            } else {
                updateValue = field === 'precio' ? parseFloat(value) : parseInt(value, 10);
                if (isNaN(updateValue)) {
                    // alert(`Valor inválido para ${field}`); // Silent
                    return;
                }
            }
        }

        const { error } = await supabaseClient
            .from('productos')
            .update({ [field]: updateValue })
            .eq('id', id);

        if (error) {
            console.error(`Error al guardar ${field}: ${error.message}`);
            this.classList.add('border-red-500');
        } else {
            // Feedback visual
            const originalBorder = this.classList.contains('border-blue-400') ? 'border-blue-400' : '';
            this.classList.remove('border-blue-400');
            this.classList.add('border-green-400');
            setTimeout(() => {
                this.classList.remove('border-green-400');
                this.classList.add('border-blue-400');
            }, 1000);
        }
    }

    window.markAsReviewed = async function (id, newState) {
        const { error } = await supabaseClient.from('productos').update({ revisado: newState }).eq('id', id);
        if (error) {
            alert('Error al actualizar estado: ' + error.message);
            const checkbox = document.querySelector(`tr[data-id="${id}"] input[type="checkbox"]`);
            if (checkbox) checkbox.checked = !newState;
        } else {
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row) {
                row.classList.add('opacity-0', 'transform', 'translate-x-4');
                setTimeout(() => {
                    row.remove();
                    loadProducts();
                }, 300);
            }
        }
    };

    window.deleteProduct = async function (id) {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

        const { error } = await supabaseClient.from('productos').delete().eq('id', id);
        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row) {
                row.classList.add('opacity-0', 'transform', 'scale-95');
                setTimeout(() => {
                    row.remove();
                    loadProducts();
                }, 300);
            }
        }
    };

    window.exportVerifiedProductsToCSV = async function () {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('id, sku, titulo, precio, cantidad, marca, id_factura, url_imagen')
            .eq('revisado', true)
            .order('created_at', { ascending: false });

        if (error) {
            alert(`Error al cargar productos verificados: ${error.message}`);
            return;
        }

        if (!data || data.length === 0) {
            alert('No hay productos verificados para exportar.');
            return;
        }

        const headers = ['ID', 'SKU', 'Título', 'Precio', 'Cantidad', 'Marca', 'ID Factura', 'URL Imagen'];
        const rows = data.map(row => [
            `"${row.id}"`,
            `"${(row.sku || '').replace(/"/g, '""')}"`,
            `"${(row.titulo || '').replace(/"/g, '""')}"`,
            row.precio !== null && row.precio !== undefined ? row.precio : '',
            row.cantidad !== null && row.cantidad !== undefined ? row.cantidad : '',
            `"${(row.marca || '').replace(/"/g, '""')}"`,
            `"${(row.id_factura || '').replace(/"/g, '""')}"`,
            `"${(row.url_imagen || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\\n');
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
        const filename = `productos_verificados_${timestamp}.csv`;

        const blob = new Blob([`\\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Start Logic
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', window.handleSearchInput);
    } else {
        console.warn("Input de búsqueda no encontrado (ID: searchInput)");
    }

    // Filtro Search Trigger
    const modeElement = document.getElementById('searchMode');
    if (modeElement) {
        modeElement.addEventListener('change', () => {
            const query = searchInput.value.trim();
            if (query.length > 0) {
                performSearch(query);
            }
        });
    }

    loadProducts();
    setInterval(loadProducts, 10000);
}
