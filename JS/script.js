document.addEventListener('DOMContentLoaded', () => {
    // === Animation on Load ===
    const loginHeader = document.getElementById('loginHeader');
    requestAnimationFrame(() => {
        loginHeader.classList.remove('opacity-0', 'translate-y-4');
        loginHeader.classList.add('animate-fade-in-up');
    });

    // === Supabase Configuration ===
    const SUPABASE_URL = 'https://voedeobojnlsjfxhkbhy.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZWRlb2Jvam5sc2pmeGhrYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODM3MzcsImV4cCI6MjA3MTU1OTczN30.ySOeKnQLKomzyh3tFSaNJdiHD5amS2fmSpKFzFZJNLA';

    // Initialize Supabase Client
    // Ensure supabase object is available from CDN
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    if (!supabase) {
        console.error('Supabase library not loaded.');
        showMessage('Error interno: No se pudo cargar la librería de autenticación.', 'error');
    }

    // === Elements ===
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const messageContainer = document.getElementById('messageContainer');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    // === Toggle Password Visibility ===
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        const icon = togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });

    // === Form Submission ===
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset message
        hideMessage();

        // 1. Basic Validation
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showMessage('Por favor, completa todos los campos.', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showMessage('Por favor, ingresa un correo electrónico válido.', 'error');
            return;
        }

        // 2. Loading State
        setLoading(true);

        try {
            // 3. Supabase Custom Auth (Table 'Users' with DNI)
            // Step 1: Check if Email exists
            const { data: user, error } = await supabase
                .from('Users')
                .select('*')
                .eq('correo', email)
                .maybeSingle();

            if (error) {
                console.error('Database Error:', error);
                // Show specific error for debugging
                const detail = error.message || error.hint || JSON.stringify(error);
                showMessage(`Error de base de datos: ${detail}`, 'error');
                return;
            }

            if (!user) {
                // Email not found
                console.warn('Login Failed: Email not found');
                showMessage('El correo electrónico no está registrado.', 'error');
                return;
            }

            // Step 2: Validate DNI (Check specific field)
            // We use loose equality (==) to match if DNI is stored as number vs string
            if (user.dni == password) {
                console.log('Login Success:', user);
                // Save user session
                localStorage.setItem('currentUser', JSON.stringify(user));
                showMessage('¡Credenciales válidas! Acceso permitido. Redirigiendo...', 'success');
                // Redirection after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'extractor-de-facturas.html';
                }, 1500);
            } else {
                // DNI incorrect
                console.warn('Login Failed: Invalid DNI');
                showMessage('El DNI ingresado es incorrecto.', 'error');
            }

        } catch (err) {
            console.error('Unexpected Error:', err);
            showMessage('Ocurrió un error inesperado de red.', 'error');
        } finally {
            setLoading(false);
        }
    });

    // === Helper Functions ===

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
            submitBtn.classList.add('cursor-not-allowed', 'opacity-70');
        } else {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
            submitBtn.classList.remove('cursor-not-allowed', 'opacity-70');
        }
    }

    function showMessage(msg, type) {
        messageContainer.textContent = msg;
        messageContainer.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'border-red-400', 'border-green-400', 'border');

        // Reset animation
        messageContainer.classList.remove('animate-fade-in-up', 'opacity-100');
        void messageContainer.offsetWidth; // trigger reflow

        if (type === 'error') {
            messageContainer.classList.add('bg-red-50', 'text-red-600', 'border', 'border-red-200');
        } else {
            messageContainer.classList.add('bg-green-50', 'text-green-600', 'border', 'border-green-200');
        }

        messageContainer.classList.remove('hidden');
        // Add animation logic manually for "slide up" effect using CSS classes available or transitions
        // We used transition classes in HTML: transform transition-all duration-500 translate-y-2 opacity-0

        requestAnimationFrame(() => {
            messageContainer.classList.remove('translate-y-2', 'opacity-0');
            messageContainer.classList.add('opacity-100', 'translate-y-0');
        });
    }

    function hideMessage() {
        messageContainer.classList.add('translate-y-2', 'opacity-0');
        messageContainer.classList.remove('opacity-100', 'translate-y-0');

        // Wait for transition to finish before hiding display
        setTimeout(() => {
            // Only add hidden if it is still meant to be hidden (in case rapid clicks happen)
            if (messageContainer.classList.contains('opacity-0')) {
                messageContainer.classList.add('hidden');
            }
        }, 500);
    }
});
