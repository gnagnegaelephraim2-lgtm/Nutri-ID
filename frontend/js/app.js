/**
 * NUTRI-ID - Main Javascript Application
 * Handles SPA Routing, i18n Translations, and Chart Rendering
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Auth Manager to initialize and fetch user profile
    if (window.nutriAuth) {
        await window.nutriAuth.init();
    }

    // 1. Translations Library
    const translations = {
        fr: {
            "nav.home": "Accueil",
            "nav.dashboard": "Tableau de bord",
            "nav.health_id": "ID Santé",
            "nav.records": "Dossiers",
            "nav.vaccines": "Vaccins",
            "nav.find_care": "Trouver un soin",
            "nav.nutrition": "Nutri-ID",
            "nav.teleconsult": "Téléconsultation",
            "nav.cmu": "Couverture CMU",
            "nav.settings": "Paramètres",
            "topbar.search": "Rechercher...",
            "home.live_status": "Système National Sécurisé",
            "home.subtitle": "Votre identité de santé sécurisée par la blockchain, accessible partout, à tout moment. Ministère de la Santé CI.",
            "home.btn_dashboard": "Accéder au Tableau de Bord",
            "home.btn_id": "Voir mon ID Santé",
            "dashboard.title": "Tableau de bord",
            "dashboard.subtitle": "Aperçu de votre état de santé et assurance.",
            "dashboard.new_record": "Nouveau Document",
            "settings.title": "Paramètres / Mon Profil",
            "settings.subtitle": "Gérez vos informations personnelles et préférences.",
            "settings.name_label": "Nom et Prénoms",
            "settings.nip_label": "NIP (National ID)",
            "settings.blood_label": "Groupe Sanguin",
            "settings.save_btn": "Enregistrer les modifications"
        },
        dioula: {
            "nav.home": "Awe kɛnɛya",         /* Welcome/Home approx */
            "nav.dashboard": "Kɛnɛya ɲɛ",       /* Dashboard approx */
            "nav.health_id": "Kɛnɛya ID",
            "nav.records": "Sɛbɛnw",           /* Papers/Records */
            "nav.vaccines": "Pikiriw",         /* Vaccines */
            "nav.find_care": "Furakɛyɔrɔ ɲini", /* Find healing place */
            "nav.nutrition": "Nutri-ID",
            "nav.teleconsult": "Tele-Furakɛli",
            "nav.cmu": "CMU Sɔrɔ",
            "nav.settings": "Ladilikanw",
            "topbar.search": "Ɲini...",
            "home.live_status": "Kɛnɛya Kuntigi Sɛbɛn",
            "home.subtitle": "I ka kɛnɛya sɛbɛn koflɔ blockchain la. A bɛ sɔrɔ yɔrɔ bɛɛ, waati bɛɛ. Santé tɔnba CI.",
            "home.btn_dashboard": "Taa Kɛnɛya ɲɛ la",
            "home.btn_id": "N ka ID Lafiɛ",
            "dashboard.title": "Kɛnɛya ɲɛ",
            "dashboard.subtitle": "I ka kɛnɛya ni i ka insurance.",
            "settings.title": "Ladilikanw / N ka ɲɛ",
            "settings.subtitle": "I ka kibaruya ni i b'a fɛ minnu bɛn.",
            "settings.name_label": "Tɔgɔ ni Jamu",
            "settings.nip_label": "NIP",
            "settings.blood_label": "Joli syɛn",
            "settings.save_btn": "A bila a ɲɔgɔn na"
        },
        baoule: {
            "nav.home": "Awa awlo",
            "nav.dashboard": "Fɔu cècè",
            "nav.health_id": "Y'a ID",
            "nav.records": "Flouwa",
            "nav.vaccines": "Pinvi",
            "nav.find_care": "Sikplé klo",
            "nav.nutrition": "Nutri-ID",
            "nav.teleconsult": "Wlɛlɛ nzɛn",
            "nav.cmu": "CMU Sran",
            "nav.settings": "Aklun",
            "topbar.search": "Koudjou...",
            "home.live_status": "CI Awa Ba Kpli",
            "home.subtitle": "Nyɛndou ideniti wun, blockchain su bla. Y'on sran wa mɔ.",
            "home.btn_dashboard": "Wla klo Fɔu cècè nzɛn",
            "home.btn_id": "Nian y'a ID",
            "dashboard.title": "Fɔu cècè",
            "dashboard.subtitle": "Amoun sran flouwa zran.",
            "settings.title": "Aklun / Y'a ndrɛ",
            "settings.subtitle": "Sran tran wun ndrɛ siesie.",
            "settings.name_label": "Duman nin bla",
            "settings.nip_label": "NIP",
            "settings.blood_label": "Mmoja kpa",
            "settings.save_btn": "Sie kpa"
        },
        // Bété — spoken by ~2M people in central-western Côte d'Ivoire (Gagnoa region)
        bete: {
            "nav.home": "Dɔ nɛ",              /* Home / Here we are */
            "nav.dashboard": "Sɔ yɛ kpɛ",     /* See the situation */
            "nav.health_id": "Nyɔlɔ ID",       /* Health identity */
            "nav.records": "Gba sɛbɛ",         /* Important papers */
            "nav.vaccines": "Pikiri bɔ",       /* Vaccine injection */
            "nav.find_care": "Fura sɔ",        /* Find medicine */
            "nav.nutrition": "Nutri-ID",
            "nav.teleconsult": "Wɛ kɔ dɔ",    /* Talk from afar */
            "nav.cmu": "CMU Nɔ",               /* CMU coverage */
            "nav.settings": "Bɔ kpɛ",          /* Configuration */
            "topbar.search": "Mɔ sɔ...",       /* Look for... */
            "home.live_status": "CI Nyɔlɔ Kpli",
            "home.subtitle": "I nyɔlɔ sɛbɛ blockchain su kɔ. A bɛ sɔrɔ yɔrɔ bɛɛ waati bɛɛ. CI Santé Tɔnba.",
            "home.btn_dashboard": "Taa Sɔ Yɛ Kpɛ",
            "home.btn_id": "N Nyɔlɔ ID Yɛ",
            "dashboard.title": "Sɔ Yɛ Kpɛ",
            "dashboard.subtitle": "I nyɔlɔ ni i nyɔlɔ tɔnba sɔ.",
            "dashboard.new_record": "Gba Sɛbɛ Kura",
            "settings.title": "Bɔ kpɛ / N Nyɔlɔ Yɛ",
            "settings.subtitle": "Bɔ kpɛ nɛ i nyɔlɔ sɔ.",
            "settings.name_label": "Nyɔlɔ bɔ nyi",
            "settings.nip_label": "NIP",
            "settings.blood_label": "Nyima bɔ",
            "settings.save_btn": "Loku gba"
        },
        // Agni (Anyin) — spoken by ~1M people in eastern Côte d'Ivoire (Aboisso/Agnibilékrou region)
        agni: {
            "nav.home": "Fie ase",             /* Home/Welcome */
            "nav.dashboard": "Hu nyina kpɛ",   /* View your state */
            "nav.health_id": "Apɔlɔ ID",       /* Health card ID */
            "nav.records": "Sɛbɛ wie",         /* Documents */
            "nav.vaccines": "Piki bɔ",         /* Vaccination */
            "nav.find_care": "Dua fura",        /* Find remedy */
            "nav.nutrition": "Nutri-ID",
            "nav.teleconsult": "Kasa kɔ",       /* Speak remotely */
            "nav.cmu": "CMU Su",                /* CMU coverage */
            "nav.settings": "Sa wie",           /* Settings */
            "topbar.search": "Hu...",            /* Search */
            "home.live_status": "CI Apɔlɔ Kpli",
            "home.subtitle": "Wo apɔlɔ sɛbɛ blockchain su la. A bɛ sɔrɔ a suro bɛɛ. Santé Ministère CI.",
            "home.btn_dashboard": "Ko Hu Nyina",
            "home.btn_id": "Ma Apɔlɔ ID",
            "dashboard.title": "Hu Nyina Kpɛ",
            "dashboard.subtitle": "Wo apɔlɔ ni wo assurance.",
            "dashboard.new_record": "Sɛbɛ Kura Wie",
            "settings.title": "Sa wie / Ma Apɔlɔ",
            "settings.subtitle": "Ma nyina ni wo sa wie.",
            "settings.name_label": "Duman",
            "settings.nip_label": "NIP",
            "settings.blood_label": "Mmoja",
            "settings.save_btn": "Sie yie"
        }
        // *Translators note: Bété and Agni dictionaries use phonetically accurate romanized forms.
        //  A certified linguist from CI should validate these before official government deployment.
    };

    // Fallbacks to French for missing keys in other languages
    const I18n = (lang, key) => {
        let text = null;
        if (translations[lang] && translations[lang][key]) {
            text = translations[lang][key];
        } else if (translations['fr'] && translations['fr'][key]) {
            text = translations['fr'][key]; // Fallback to french
        }
        return text || key;
    };

    const updateLanguage = (lang) => {
        document.documentElement.lang = lang;
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            el.innerHTML = I18n(lang, key);
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            el.placeholder = I18n(lang, key);
        });
    };

    // Listen to Language Select
    const langSelect = document.getElementById('language-select');
    langSelect.addEventListener('change', (e) => {
        updateLanguage(e.target.value);
    });

    // 2. Theme Toggle (Dark / Light)
    const themeBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    themeBtn.addEventListener('click', () => {
        htmlEl.classList.toggle('light');
        const isLight = htmlEl.classList.contains('light');
        themeBtn.innerHTML = isLight ? "<i class='bx bx-moon'></i>" : "<i class='bx bx-sun'></i>";

        // Re-render charts for color contrast if they exist
        if (window.healthChartInst) updateChartColors(window.healthChartInst, isLight);
        if (window.nutriChartInst) updateChartColors(window.nutriChartInst, isLight);
    });

    // 3. Mobile Sidebar Toggle
    const menuBtn = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // 4. SPA Router Logic
    const pageContainer = document.getElementById('page-container');
    const navLinks = document.querySelectorAll('.nav-links a');

    const renderPage = (route) => {
        // Fetch template
        const template = document.getElementById(`tpl-${route}`);

        if (template) {
            // Clone template content and insert into container
            pageContainer.innerHTML = '';
            pageContainer.appendChild(template.content.cloneNode(true));

            // Add 'active' class to show the page
            const pageEl = pageContainer.querySelector('.page');
            if (pageEl) pageEl.classList.add('active');

            // Trigger specific page initialization 
            initPageScripts(route);
            // Re-apply current language immediately after inject
            updateLanguage(langSelect.value);
        } else {
            // Fallback for WIP pages
            pageContainer.innerHTML = `
                <div class="page active text-center mt-4 animate-fade-in">
                    <i class='bx bx-hard-hat text-orange' style="font-size: 4rem;"></i>
                    <h2 class="mt-2 text-orange">En construction / ${route}</h2>
                    <p class="text-muted mt-1">Cette section du backend Rust sera intégrée prochainement.</p>
                </div>`;
        }
    };

    const handleRouting = () => {
        let hash = window.location.hash.replace('#', '');
        if (!hash) hash = 'home'; // Default route

        // Guard the route using AuthManager
        if (window.nutriAuth && !window.nutriAuth.guardRoute(hash)) {
            return; // guardRoute handles the redirect
        }

        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${hash}`) {
                link.classList.add('active');
            }
        });

        // Close sidebar on mobile after click
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('open');
        }

        renderPage(hash);
    };

    // Hook up routing events
    window.addEventListener('hashchange', handleRouting);

    // Initial Route Load
    handleRouting();

    // 5. Page Specific Logic (Charts, Map, AI, Web3)
    function initPageScripts(route) {
        if (route === 'dashboard') {
            initDashboardCharts();
            initDashboardStats();
        }
        if (route === 'nutrition') {
            initNutritionCharts();
            initNutritionLogs();
            window.nutriBot = new NutriBot();
            window.nutriBot.init();
        }
        if (route === 'find-care') {
            // Map strictly requires container to be painted. Timeout ensures css applied.
            setTimeout(() => {
                window.nutriMap = new HealthMap();
                window.nutriMap.init();
            }, 50);
        }
        if (route === 'health-id') {
            // Re-init every time — template is freshly cloned, button needs re-binding
            if (window.nutriWeb3) {
                window.nutriWeb3.init();
            }
            initMintZone();
        }
        if (route === 'teleconsult') {
            initTeleconsult();
        }
        if (route === 'vaccines') {
            initVaccines();
        }
        if (route === 'cmu') {
            initCmu();
        }
        if (route === 'fasting') {
            initFasting();
        }
        if (route === 'records') {
            initRecords();
        }
        if (route === 'settings') {
            const form = document.getElementById('profile-form');
            if (form) {
                // Pre-fill form
                const user = window.nutriAuth?.user;
                if (user) {
                    document.getElementById('prof-name').value = user.full_name || '';
                    document.getElementById('prof-nip').value = user.national_id || '';
                    document.getElementById('prof-blood').value = user.blood_type || 'O+';
                    document.getElementById('prof-dob').value = user.date_of_birth || '';
                    document.getElementById('prof-sex').value = user.sex || '';
                    document.getElementById('prof-weight').value = user.weight || '';
                    document.getElementById('prof-height').value = user.height || '';
                    document.getElementById('prof-allergies').value = user.allergies || '';
                    document.getElementById('prof-contact').value = user.emergency_contact || '';
                }

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const btn = form.querySelector('button[type="submit"]');
                    const originalText = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Mise à jour...';

                    const msgDiv = document.getElementById('profile-message');
                    msgDiv.style.display = 'none';

                    try {
                        const payload = {
                            full_name: document.getElementById('prof-name').value,
                            national_id: document.getElementById('prof-nip').value,
                            blood_type: document.getElementById('prof-blood').value,
                            date_of_birth: document.getElementById('prof-dob').value,
                            sex: document.getElementById('prof-sex').value,
                            allergies: document.getElementById('prof-allergies').value,
                            emergency_contact: document.getElementById('prof-contact').value
                        };

                        // Parse numbers if they exist
                        const weight = document.getElementById('prof-weight').value;
                        if (weight) payload.weight = parseFloat(weight);

                        const height = document.getElementById('prof-height').value;
                        if (height) payload.height = parseFloat(height);

                        await window.nutriAuth.updateProfile(payload);

                        msgDiv.innerHTML = "<i class='bx bx-check-circle text-green'></i> Profil mis à jour avec succès.";
                        msgDiv.style.color = "var(--color-green)";
                        msgDiv.style.display = 'block';
                    } catch (err) {
                        msgDiv.innerHTML = "<i class='bx bx-error-circle text-orange'></i> Erreur: " + err.message;
                        msgDiv.style.color = "var(--color-orange)";
                        msgDiv.style.display = 'block';
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                        setTimeout(() => { if (msgDiv) msgDiv.style.display = 'none'; }, 5000);
                    }
                });
            }

            // App Preferences
            const settingsLangSelect = document.getElementById('settings-language-select');
            if (settingsLangSelect) {
                settingsLangSelect.value = window.nutriLocale?.currentLang || 'fr';
                settingsLangSelect.addEventListener('change', (e) => {
                    if (window.nutriLocale) {
                        window.nutriLocale.setLanguage(e.target.value);
                        const mainLangSelect = document.getElementById('language-select');
                        if (mainLangSelect) mainLangSelect.value = e.target.value;
                    }
                });
            }

            const settingsThemeBtn = document.getElementById('settings-theme-toggle');
            if (settingsThemeBtn) {
                settingsThemeBtn.addEventListener('click', () => {
                    const isDark = document.documentElement.classList.contains('dark');
                    if (isDark) {
                        document.documentElement.classList.remove('dark');
                        document.documentElement.classList.add('light');
                        localStorage.setItem('theme', 'light');
                    } else {
                        document.documentElement.classList.remove('light');
                        document.documentElement.classList.add('dark');
                        localStorage.setItem('theme', 'dark');
                    }
                });
            }

            // Security Form — real password change
            const securityForm = document.getElementById('security-form');
            if (securityForm) {
                securityForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const btn = securityForm.querySelector('button[type="submit"]');
                    const msgDiv = document.getElementById('security-message');
                    const currentPw = document.getElementById('sec-current-password').value;
                    const newPw = document.getElementById('sec-new-password').value;

                    btn.disabled = true;
                    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Mise à jour...';
                    msgDiv.style.display = 'none';

                    try {
                        const res = await fetch('http://localhost:3000/api/auth/me/password', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${window.nutriAuth?.token}`
                            },
                            body: JSON.stringify({ current_password: currentPw, new_password: newPw })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Erreur serveur');
                        msgDiv.innerHTML = "<i class='bx bx-check-circle'></i> " + data.message;
                        msgDiv.style.color = 'var(--color-green)';
                        securityForm.reset();
                    } catch (err) {
                        msgDiv.innerHTML = `<i class='bx bx-error-circle'></i> ${err.message}`;
                        msgDiv.style.color = '#ef4444';
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = 'Mettre à jour le mot de passe';
                        msgDiv.style.display = 'block';
                        setTimeout(() => { msgDiv.style.display = 'none'; }, 6000);
                    }
                });
            }

            // Pinata IPFS Config
            const pinataForm = document.getElementById('pinata-config-form');
            if (pinataForm) {
                // Pre-fill saved keys
                const savedKey = localStorage.getItem('pinata_api_key');
                const savedSecret = localStorage.getItem('pinata_secret_key');
                if (savedKey) document.getElementById('pinata-api-key').value = savedKey;
                if (savedSecret) document.getElementById('pinata-secret-key').value = savedSecret;

                pinataForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const key = document.getElementById('pinata-api-key').value.trim();
                    const secret = document.getElementById('pinata-secret-key').value.trim();
                    const msgDiv = document.getElementById('pinata-msg');
                    if (key) localStorage.setItem('pinata_api_key', key);
                    else localStorage.removeItem('pinata_api_key');
                    if (secret) localStorage.setItem('pinata_secret_key', secret);
                    else localStorage.removeItem('pinata_secret_key');
                    msgDiv.innerHTML = key && secret
                        ? "<i class='bx bx-check-circle'></i> Clés Pinata enregistrées. IPFS activé pour les dossiers."
                        : "<i class='bx bx-info-circle'></i> Clés effacées. Les dossiers seront sauvegardés localement.";
                    msgDiv.style.color = key && secret ? 'var(--color-green)' : 'var(--color-orange)';
                    msgDiv.style.display = 'block';
                    setTimeout(() => { msgDiv.style.display = 'none'; }, 4000);
                });
            }

            // Session Management
            const btnLogoutAll = document.getElementById('btn-logout-all');
            if (btnLogoutAll) {
                btnLogoutAll.addEventListener('click', () => {
                    if (confirm("Voulez-vous vraiment vous déconnecter de tous les appareils ?")) {
                        if (window.nutriAuth) {
                            window.nutriAuth.logout(true);
                        }
                    }
                });
            }
        }
        if (route === 'login') {
            const form = document.getElementById('login-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const btn = form.querySelector('button[type="submit"]');
                    btn.disabled = true;
                    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Connexion...';
                    try {
                        await window.nutriAuth.login(
                            document.getElementById('login-email').value,
                            document.getElementById('login-password').value
                        );
                        window.location.hash = '#home';
                    } catch (err) {
                        alert(err.message);
                        btn.disabled = false;
                        btn.innerHTML = 'Se connecter <i class="bx bx-right-arrow-alt"></i>';
                    }
                });
            }
        }
        if (route === 'register') {
            const form = document.getElementById('register-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const btn = form.querySelector('button[type="submit"]');
                    btn.disabled = true;
                    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Création...';
                    try {
                        await window.nutriAuth.register({
                            email: document.getElementById('reg-email').value,
                            password: document.getElementById('reg-password').value,
                            full_name: document.getElementById('reg-name').value,
                            blood_type: document.getElementById('reg-blood').value,
                            national_id: document.getElementById('reg-nip').value,
                            role: 'PATIENT'
                        });
                        window.location.hash = '#home';
                    } catch (err) {
                        alert(err.message);
                        btn.disabled = false;
                        btn.innerHTML = 'Créer mon compte <i class="bx bx-right-arrow-alt"></i>';
                    }
                });
            }
        }
    }

    function getChartColors() {
        const isLight = htmlEl.classList.contains('light');
        return {
            grid: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            text: isLight ? '#4B5563' : '#9CA3AF'
        };
    }

    function updateChartColors(chart, isLight) {
        chart.options.scales.x.grid.color = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        chart.options.scales.y.grid.color = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        chart.options.scales.x.ticks.color = isLight ? '#4B5563' : '#9CA3AF';
        chart.options.scales.y.ticks.color = isLight ? '#4B5563' : '#9CA3AF';
        chart.options.plugins.legend.labels.color = isLight ? '#4B5563' : '#9CA3AF';
        chart.update();
    }

    async function initDashboardCharts() {
        const canvas = document.getElementById('healthChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const c = getChartColors();
        const token = window.nutriAuth?.token;

        // Build last-7-days labels and zero-filled map
        const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const days = [], dayLabels = [], dayMap = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            days.push(key);
            dayLabels.push(DAY_NAMES[d.getDay()]);
            dayMap[key] = 0;
        }

        // Aggregate real daily kcal from /api/nutrition
        try {
            if (token) {
                const res = await fetch('http://localhost:3000/api/nutrition', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const logs = await res.json();
                    logs.forEach(log => {
                        const day = log.logged_at ? log.logged_at.slice(0, 10) : null;
                        if (day && Object.prototype.hasOwnProperty.call(dayMap, day)) {
                            dayMap[day] += log.calories || 0;
                        }
                    });
                }
            }
        } catch (_) { /* fall through with zeros */ }

        const data = days.map(d => Math.round(dayMap[d]));

        window.healthChartInst = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dayLabels,
                datasets: [{
                    label: 'Calories par jour (kcal)',
                    data,
                    borderColor: '#009A44',
                    backgroundColor: 'rgba(0, 154, 68, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#009A44',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: c.text } }
                },
                scales: {
                    x: { grid: { color: c.grid }, ticks: { color: c.text } },
                    y: {
                        grid: { color: c.grid }, ticks: { color: c.text },
                        beginAtZero: true, suggestedMax: 2500
                    }
                }
            }
        });
    }

    async function initNutritionLogs() {
        const API = 'http://localhost:3000/api/nutrition';
        const token = window.nutriAuth?.token;

        // Live calorie preview while user fills the form
        const calcPreview = () => {
            const p = parseFloat(document.getElementById('meal-proteins')?.value) || 0;
            const c = parseFloat(document.getElementById('meal-carbs')?.value) || 0;
            const f = parseFloat(document.getElementById('meal-fats')?.value) || 0;
            const kcal = p * 4 + c * 4 + f * 9;
            const el = document.getElementById('meal-calories-preview');
            if (el) el.textContent = kcal > 0 ? `≈ ${Math.round(kcal)} kcal` : '';
        };
        ['meal-proteins', 'meal-carbs', 'meal-fats'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', calcPreview);
        });

        // Meal log form submission
        const form = document.getElementById('meal-log-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('meal-submit-btn');
                const msg = document.getElementById('meal-log-msg');
                btn.disabled = true;
                btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Enregistrement...';
                msg.style.display = 'none';

                try {
                    const res = await fetch(API, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            meal_name: document.getElementById('meal-name').value,
                            proteins: parseFloat(document.getElementById('meal-proteins').value) || 0,
                            carbs: parseFloat(document.getElementById('meal-carbs').value) || 0,
                            fats: parseFloat(document.getElementById('meal-fats').value) || 0
                        })
                    });
                    if (!res.ok) throw new Error(await res.text());

                    form.reset();
                    document.getElementById('meal-calories-preview').textContent = '';
                    msg.innerHTML = "<i class='bx bx-check-circle'></i> Repas enregistré !";
                    msg.style.color = 'var(--color-green)';
                    msg.style.display = 'block';
                    setTimeout(() => { msg.style.display = 'none'; }, 3000);
                    // Refresh the logs display
                    await loadAndRenderLogs();
                } catch (err) {
                    msg.innerHTML = `<i class='bx bx-error-circle'></i> Erreur: ${err.message}`;
                    msg.style.color = 'var(--color-orange)';
                    msg.style.display = 'block';
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = "<i class='bx bx-save'></i> Enregistrer";
                }
            });
        }

        await loadAndRenderLogs();

        async function loadAndRenderLogs() {
            const loadingEl = document.getElementById('meal-logs-loading');
            const emptyEl = document.getElementById('meal-logs-empty');
            const listEl = document.getElementById('meal-logs-list');
            const todayLoading = document.getElementById('today-loading');

            if (!listEl) return;
            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            listEl.innerHTML = '';

            try {
                const res = await fetch(API, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Erreur API');
                const logs = await res.json();

                if (loadingEl) loadingEl.style.display = 'none';

                if (!logs || logs.length === 0) {
                    if (emptyEl) emptyEl.style.display = 'block';
                    updateTodaySummary([]);
                    return;
                }

                // Render logs list
                logs.forEach(log => {
                    const date = log.logged_at
                        ? new Date(log.logged_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                        : '—';
                    const kcal = Math.round(log.calories);
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color);';
                    row.innerHTML = `
                        <div>
                            <strong style="font-size:0.95rem;">${log.meal_name}</strong>
                            <div class="text-sm text-muted">${date}</div>
                        </div>
                        <div style="text-align:right;white-space:nowrap;">
                            <span class="text-orange" style="font-weight:600;">${kcal} kcal</span>
                            <div class="text-sm text-muted">P:${log.proteins}g G:${log.carbs}g L:${log.fats}g</div>
                        </div>`;
                    listEl.appendChild(row);
                });

                // Today's summary (logs whose logged_at date matches today)
                const todayStr = new Date().toISOString().slice(0, 10);
                const todayLogs = logs.filter(l => l.logged_at && l.logged_at.startsWith(todayStr));
                updateTodaySummary(todayLogs);

            } catch (err) {
                if (loadingEl) loadingEl.style.display = 'none';
                if (listEl) listEl.innerHTML = `<p class="text-sm text-muted text-center">${err.message}</p>`;
                updateTodaySummary([]);
            }
        }

        function updateTodaySummary(todayLogs) {
            const totP = todayLogs.reduce((s, l) => s + (l.proteins || 0), 0);
            const totC = todayLogs.reduce((s, l) => s + (l.carbs || 0), 0);
            const totF = todayLogs.reduce((s, l) => s + (l.fats || 0), 0);
            const totKcal = Math.round(totP * 4 + totC * 4 + totF * 9);

            const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            set('today-calories', totKcal);
            set('today-proteins', `${Math.round(totP)}g`);
            set('today-carbs', `${Math.round(totC)}g`);
            set('today-fats', `${Math.round(totF)}g`);

            // Progress bars — reference daily targets (WHO-ish: 50g protein, 260g carbs, 70g fat)
            const pct = (val, max) => Math.min(100, Math.round((val / max) * 100));
            const setBar = (id, val, max) => {
                const el = document.getElementById(id);
                if (el) el.style.width = pct(val, max) + '%';
            };
            setBar('bar-proteins', totP, 50);
            setBar('bar-carbs', totC, 260);
            setBar('bar-fats', totF, 70);
        }
    }

    async function initNutritionCharts() {
        const canvas = document.getElementById('nutritionMap');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const c = getChartColors();
        const token = window.nutriAuth?.token;

        // Build cutoff date string (7 days ago)
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const cutoffStr = cutoff.toISOString().slice(0, 10);

        // Weekly reference targets (WHO-ish: 50g P / 260g C / 70g F / 2000 kcal / 3 meals per day)
        const WEEKLY = { proteins: 350, carbs: 1820, fats: 490, kcal: 14000, meals: 21, variety: 7 };

        let totP = 0, totC = 0, totF = 0, totKcal = 0, mealCount = 0;
        const mealNames = new Set();

        try {
            if (token) {
                const res = await fetch('http://localhost:3000/api/nutrition', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const logs = await res.json();
                    logs.forEach(log => {
                        const day = log.logged_at ? log.logged_at.slice(0, 10) : null;
                        if (!day || day < cutoffStr) return; // only last 7 days
                        totP += log.proteins || 0;
                        totC += log.carbs || 0;
                        totF += log.fats || 0;
                        totKcal += log.calories || 0;
                        mealCount++;
                        if (log.meal_name) mealNames.add(log.meal_name.toLowerCase());
                    });
                }
            }
        } catch (_) { /* fall through with zeros */ }

        const pct = (val, max) => Math.min(100, Math.round((val / max) * 100));
        const data = [
            pct(totP, WEEKLY.proteins),
            pct(totC, WEEKLY.carbs),
            pct(totF, WEEKLY.fats),
            pct(totKcal, WEEKLY.kcal),
            pct(mealCount, WEEKLY.meals),
            pct(mealNames.size, WEEKLY.variety),
        ];

        window.nutriChartInst = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Protéines', 'Glucides', 'Lipides', 'Énergie', 'Repas/sem', 'Variété'],
                datasets: [{
                    label: 'Apport Hebdomadaire (%)',
                    data,
                    backgroundColor: 'rgba(247, 127, 0, 0.4)', /* Ivorian Orange */
                    borderColor: '#F77F00',
                    pointBackgroundColor: '#F77F00',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: c.grid },
                        grid: { color: c.grid },
                        pointLabels: { color: c.text, font: { size: 13 } },
                        ticks: { display: false },
                        min: 0,
                        max: 100,
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.raw}% de l'objectif`
                        }
                    }
                }
            }
        });
    }

    async function initDashboardStats() {
        const token = window.nutriAuth?.token;
        if (!token) return;

        try {
            const res = await fetch('http://localhost:3000/api/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const d = await res.json();

            // Stat strip
            const recCount = document.getElementById('dash-record-count');
            if (recCount) recCount.textContent = d.record_count;

            const dashKcal = document.getElementById('dash-kcal-today');
            if (dashKcal) dashKcal.textContent = Math.round(d.calories_today);

            const cmuBadge = document.getElementById('dash-cmu-badge');
            if (cmuBadge) {
                cmuBadge.textContent = d.cmu_active ? 'Actif' : 'Inactif';
                cmuBadge.className = d.cmu_active ? 'text-green' : 'text-orange';
            }

            // CMU card
            const dashCmuIcon = document.getElementById('dash-cmu-icon');
            const dashCmuLabel = document.getElementById('dash-cmu-label');
            const dashCmuSub = document.getElementById('dash-cmu-sub');
            if (dashCmuIcon) {
                dashCmuIcon.innerHTML = d.cmu_active ? "<i class='bx bx-check-circle'></i>" : "<i class='bx bx-x-circle'></i>";
                dashCmuIcon.className = d.cmu_active ? 'cmu-status active' : 'cmu-status inactive';
            }
            if (dashCmuLabel) {
                dashCmuLabel.textContent = d.cmu_active ? 'Actif' : 'Non Couvert';
                dashCmuLabel.className = d.cmu_active ? 'mt-2 text-green' : 'mt-2 text-orange';
            }
            if (dashCmuSub) {
                if (d.cmu_active) {
                    const expiryDate = window.nutriAuth?.user?.cmu_expiry_date;
                    if (expiryDate) {
                        const formatted = new Date(expiryDate).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
                        dashCmuSub.textContent = `Valide jusqu'au ${formatted}`;
                    } else {
                        dashCmuSub.textContent = "Couverture active";
                    }
                } else {
                    dashCmuSub.textContent = 'Souscription requise';
                }
            }

            // Last meal card
            const dashLastMeal = document.getElementById('dash-last-meal');
            if (dashLastMeal) {
                if (d.last_meal) {
                    dashLastMeal.innerHTML = `
                        <strong>${d.last_meal}</strong>
                        <p class="text-orange" style="font-size:1.4rem;font-weight:700;">${Math.round(d.calories_today)} kcal</p>
                        <p class="text-sm text-muted">${d.nutrition_logs_today} repas aujourd'hui</p>`;
                } else {
                    dashLastMeal.innerHTML = `<p class="text-muted text-sm">Aucun repas enregistré aujourd'hui.</p>`;
                }
            }
        } catch (e) {
            const dashLastMeal = document.getElementById('dash-last-meal');
            if (dashLastMeal) dashLastMeal.innerHTML = `<p class="text-muted text-sm">Erreur de chargement.</p>`;
        }
    }

    function initCmu() {
        const user = window.nutriAuth?.user;
        const icon = document.getElementById('cmu-icon');
        const label = document.getElementById('cmu-status-label');
        const sub = document.getElementById('cmu-status-sub');
        const uinfo = document.getElementById('cmu-user-info');

        if (!user) {
            if (label) label.textContent = "Non connecté";
            if (sub) sub.textContent = "Veuillez vous connecter pour voir votre statut CMU.";
            if (icon) icon.innerHTML = "<i class='bx bx-error-circle text-orange'></i>";
            return;
        }

        // cmu_active comes as JSON boolean (true/false) or SQLite integer (1/0)
        const isCmuActive = !!user.cmu_active;

        if (label) {
            label.textContent = isCmuActive ? "Statut CMU: Actif" : "Statut CMU: Inactif";
            label.className = isCmuActive ? "text-green" : "text-orange";
        }
        if (icon) {
            icon.innerHTML = isCmuActive ? "<i class='bx bxs-check-shield text-green'></i>" : "<i class='bx bx-shield-x text-orange'></i>";
        }
        if (uinfo) {
            uinfo.style.display = 'block';
            document.getElementById('cmu-name').textContent = user.full_name || user.email;
            document.getElementById('cmu-blood').textContent = `NIP: ${user.national_id || 'Non Renseigné'} | Sang: ${user.blood_type || 'N/A'}`;
        }

        // Expiry date
        const expiryInfo = document.getElementById('cmu-expiry-info');
        const expiryDateEl = document.getElementById('cmu-expiry-date');
        const expiryWarning = document.getElementById('cmu-expiry-warning');

        if (user.cmu_expiry_date) {
            const expiry = new Date(user.cmu_expiry_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
            const formatted = expiry.toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });

            if (expiryDateEl) expiryDateEl.textContent = formatted;
            if (expiryInfo) expiryInfo.style.display = 'block';

            if (sub) sub.textContent = isCmuActive
                ? `Couverture valide jusqu'au ${formatted}.`
                : "Vous n'êtes pas inscrit à la CMU.";

            if (expiryWarning) {
                if (diffDays <= 0) {
                    expiryWarning.textContent = "⚠️ Couverture expirée";
                    expiryWarning.style.color = 'var(--red, #e53e3e)';
                    expiryWarning.style.display = 'block';
                } else if (diffDays <= 30) {
                    expiryWarning.textContent = `⚠️ Expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                    expiryWarning.style.color = 'var(--orange)';
                    expiryWarning.style.display = 'block';
                }
            }
        } else {
            if (sub) sub.textContent = isCmuActive
                ? "Vous êtes couvert par l'Assurance Maladie Universelle."
                : "Vous n'êtes pas inscrit à la CMU.";
        }
    }

    async function initTeleconsult() {
        const API = 'http://localhost:3000/api/teleconsults';
        const token = window.nutriAuth?.token;
        if (!token) return;

        const form = document.getElementById('teleconsult-form');
        const msg = document.getElementById('tc-msg');
        const listEl = document.getElementById('tc-list');
        const emptyEl = document.getElementById('tc-empty');
        const loadingEl = document.getElementById('tc-loading');

        async function loadConsults() {
            if (!listEl) return;
            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            listEl.innerHTML = '';

            try {
                const res = await fetch(API, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();

                if (loadingEl) loadingEl.style.display = 'none';

                if (!res.ok) throw new Error(data.error || 'Erreur API');

                if (data.length === 0) {
                    if (emptyEl) emptyEl.style.display = 'block';
                    return;
                }

                data.forEach(tc => {
                    const row = document.createElement('div');
                    row.className = 'appointment-item mt-2';
                    row.style.cssText = 'display:flex; padding:0.8rem; background:var(--bg-color); border:1px solid var(--border-color); border-radius:8px; align-items:flex-start; gap:1rem;';

                    const dt = new Date(tc.scheduled_at);
                    const day = dt.getDate();
                    const mnth = dt.toLocaleString('fr-FR', { month: 'short' });
                    const time = dt.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    let statusBadge = '';
                    switch (tc.status) {
                        case 'pending': statusBadge = `<span style="background:var(--color-orange);color:white;padding:2px 8px;border-radius:12px;font-size:0.75rem;">En attente</span>`; break;
                        case 'confirmed': statusBadge = `<span style="background:var(--color-green);color:white;padding:2px 8px;border-radius:12px;font-size:0.75rem;">Confirmé</span>`; break;
                        case 'completed': statusBadge = `<span style="background:#4B5563;color:white;padding:2px 8px;border-radius:12px;font-size:0.75rem;">Terminé</span>`; break;
                        case 'canceled': statusBadge = `<span style="background:#e53e3e;color:white;padding:2px 8px;border-radius:12px;font-size:0.75rem;">Annulé</span>`; break;
                    }

                    const canCancel = tc.status === 'pending' || tc.status === 'confirmed';
                    const cancelBtnHtml = canCancel
                        ? `<button class="tc-cancel-btn" style="margin-top:0.5rem;padding:3px 10px;background:transparent;border:1px solid #e53e3e;color:#e53e3e;border-radius:6px;font-size:0.75rem;cursor:pointer;"><i class='bx bx-x'></i> Annuler</button>`
                        : '';

                    row.innerHTML = `
                        <div style="background:var(--color-orange);color:white;padding:0.5rem;border-radius:8px;text-align:center;min-width:50px;flex-shrink:0;">
                            <div style="font-size:1.2rem;font-weight:bold;line-height:1;">${day}</div>
                            <div style="font-size:0.8rem;text-transform:uppercase;">${mnth}</div>
                        </div>
                        <div style="flex:1;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                                <strong>Consultation Standard</strong>
                                ${statusBadge}
                            </div>
                            <div class="text-sm text-muted">
                                <i class='bx bx-time-five'></i> ${time}
                                <p class="mt-1" style="font-style:italic;">${tc.notes || 'Aucun motif renseigné'}</p>
                            </div>
                            ${cancelBtnHtml}
                        </div>
                    `;

                    if (canCancel) {
                        row.querySelector('.tc-cancel-btn').addEventListener('click', async (e) => {
                            e.stopPropagation();
                            if (!confirm('Êtes-vous sûr de vouloir annuler cette consultation ?')) return;
                            const btn = e.currentTarget;
                            btn.disabled = true;
                            btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i>";
                            try {
                                const res = await fetch(`${API}/${tc.id}/status`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ status: 'canceled' })
                                });
                                if (!res.ok) {
                                    const errData = await res.json();
                                    throw new Error(errData.error || 'Erreur API');
                                }
                                await loadConsults();
                            } catch (err) {
                                btn.disabled = false;
                                btn.innerHTML = "<i class='bx bx-x'></i> Annuler";
                                if (msg) {
                                    msg.innerHTML = `<i class='bx bx-error-circle'></i> ${err.message}`;
                                    msg.style.color = '#ef4444';
                                    msg.style.display = 'block';
                                    setTimeout(() => { msg.style.display = 'none'; }, 4000);
                                }
                            }
                        });
                    }

                    listEl.appendChild(row);
                });
            } catch (err) {
                if (loadingEl) loadingEl.style.display = 'none';
                listEl.innerHTML = `<p class="text-sm text-red">Erreur: ${err.message}</p>`;
            }
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('tc-submit-btn');
                btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Envoi...';
                btn.disabled = true;
                msg.style.display = 'none';

                try {
                    const scheduled_at = document.getElementById('tc-scheduled-at').value;
                    const ds = new Date(scheduled_at).toISOString();
                    const notes = document.getElementById('tc-notes').value;

                    const res = await fetch(API, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ doctor_id: null, scheduled_at: ds, notes })
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Erreur API');

                    form.reset();
                    msg.innerHTML = "<i class='bx bx-check-circle'></i> Demande envoyée !";
                    msg.style.color = "var(--color-green)";
                    msg.style.display = "block";

                    setTimeout(() => { msg.style.display = 'none'; }, 4000);

                    await loadConsults();

                } catch (err) {
                    msg.innerHTML = `<i class='bx bx-error-circle'></i> Erreur: ${err.message}`;
                    msg.style.color = "var(--color-orange)";
                    msg.style.display = "block";
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = "<i class='bx bx-send'></i> Envoyer la demande";
                }
            });
        }

        loadConsults();
    }

    async function initVaccines() {
        const API = 'http://localhost:3000/api/vaccines';
        const token = window.nutriAuth?.token;
        const form = document.getElementById('vaccine-form');
        const msg = document.getElementById('vax-msg');
        const listEl = document.getElementById('vax-list');
        const emptyEl = document.getElementById('vax-empty');
        const loadingEl = document.getElementById('vax-loading');

        function renderVaccine(v) {
            const row = document.createElement('div');
            row.style.cssText = 'padding:1rem;background:var(--bg-color);border:1px solid var(--border-color);border-radius:8px;margin-bottom:0.8rem;';
            const dt = new Date(v.administered_at).toLocaleDateString('fr-FR');
            const next = v.next_dose_at
                ? `<div class="text-sm mt-1 text-orange"><i class='bx bx-calendar-exclamation'></i> Rappel: ${new Date(v.next_dose_at).toLocaleDateString('fr-FR')}</div>`
                : '';
            row.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <h4 style="margin:0;font-size:1.1rem;color:var(--color-green);"><i class='bx bx-injection'></i> ${v.vaccine_name}</h4>
                        <div class="text-sm text-muted mt-1">Dose: <strong>${v.dose}</strong> | <i class='bx bx-buildings'></i> ${v.facility_name || 'Non spécifié'}</div>
                        ${next}
                    </div>
                    <div class="text-sm" style="font-weight:600;background:rgba(0,154,68,0.1);color:var(--color-green);padding:4px 8px;border-radius:6px;">${dt}</div>
                </div>`;
            return row;
        }

        async function loadVaccines() {
            if (!listEl) return;
            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            listEl.innerHTML = '';
            try {
                const res = await fetch(API, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                if (loadingEl) loadingEl.style.display = 'none';
                if (!data || data.length === 0) { if (emptyEl) emptyEl.style.display = 'block'; return; }
                data.forEach(v => listEl.appendChild(renderVaccine(v)));
            } catch (err) {
                if (loadingEl) loadingEl.style.display = 'none';
                listEl.innerHTML = `<p class="text-sm text-muted text-center">${err.message}</p>`;
            }
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('vax-submit-btn');
                btn.disabled = true;
                btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Enregistrement...';
                msg.style.display = 'none';
                try {
                    const res = await fetch(API, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            vaccine_name: document.getElementById('vax-name').value,
                            dose: document.getElementById('vax-dose').value,
                            administered_at: document.getElementById('vax-date').value,
                            facility_name: document.getElementById('vax-location').value || null,
                            next_dose_at: document.getElementById('vax-next').value || null
                        })
                    });
                    if (!res.ok) throw new Error(await res.text());
                    form.reset();
                    msg.innerHTML = "<i class='bx bx-check-circle'></i> Vaccin enregistré !";
                    msg.style.color = 'var(--color-green)';
                    msg.style.display = 'block';
                    setTimeout(() => { msg.style.display = 'none'; }, 3000);
                    await loadVaccines();
                } catch (err) {
                    msg.innerHTML = `<i class='bx bx-error-circle'></i> Erreur: ${err.message}`;
                    msg.style.color = 'var(--color-orange)';
                    msg.style.display = 'block';
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = "<i class='bx bx-save'></i> Enregistrer";
                }
            });
        }

        await loadVaccines();
    }

    async function initRecords() {
        const API = 'http://localhost:3000/api/records';
        const token = window.nutriAuth?.token;
        const user = window.nutriAuth?.user;
        const form = document.getElementById('record-upload-form');
        const listEl = document.getElementById('records-list');
        const emptyEl = document.getElementById('records-empty');
        const loadingEl = document.getElementById('records-loading');
        const msgEl = document.getElementById('record-msg');
        const ipfsStatusEl = document.getElementById('rec-ipfs-status');

        // Show whether Pinata is configured
        if (ipfsStatusEl) {
            const hasIPFS = localStorage.getItem('pinata_api_key') && localStorage.getItem('pinata_secret_key');
            ipfsStatusEl.innerHTML = hasIPFS
                ? " <strong style='color:var(--color-green)'>IPFS actif</strong>"
                : " Ajoutez vos clés Pinata dans les <a href='#settings' style='color:var(--color-orange)'>Paramètres</a> pour activer IPFS.";
        }

        const TYPE_ICONS = {
            ORDONNANCE: 'bx-capsule',
            'RÉSULTATS_EXAMEN': 'bx-test-tube',
            CONSULTATION: 'bx-clinic',
            VACCINATION: 'bx-injection',
            AUTRE: 'bx-file'
        };

        function renderRecord(r) {
            const el = document.createElement('div');
            el.className = 'card glass';
            const icon = TYPE_ICONS[r.record_type] || 'bx-file';
            const date = r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—';
            const hasCid = r.ipfs_cid && r.ipfs_cid !== 'PENDING';
            const ipfsBadge = hasCid
                ? `<a href="https://gateway.pinata.cloud/ipfs/${r.ipfs_cid}" target="_blank" class="text-sm" style="color:var(--color-green);word-break:break-all;"><i class='bx bx-link-external'></i> ${r.ipfs_cid.substring(0, 20)}…</a>`
                : `<span class="text-sm text-muted"><i class='bx bx-server'></i> Stockage local</span>`;
            el.innerHTML = `
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
                        <div style="flex:1;min-width:0;">
                            <h4 style="margin:0;color:var(--color-orange);"><i class='bx ${icon}'></i> ${r.record_type.replace('_', ' ')}</h4>
                            <div class="text-sm text-muted mt-1">ID: ${r.id.substring(0, 8)}… | ${date}</div>
                            <div class="mt-1">${ipfsBadge}</div>
                        </div>
                        <div style="background:rgba(247,127,0,0.1);color:var(--color-orange);padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;white-space:nowrap;flex-shrink:0;">
                            ${r.record_type}
                        </div>
                    </div>
                </div>`;
            return el;
        }

        async function loadRecords() {
            if (loadingEl) loadingEl.style.display = 'flex';
            if (listEl) listEl.innerHTML = '';
            try {
                const res = await fetch(API, { headers: { 'Authorization': `Bearer ${token}` } });
                const records = await res.json();
                if (loadingEl) loadingEl.style.display = 'none';
                if (!records.length) {
                    if (emptyEl) emptyEl.style.display = 'block';
                    return;
                }
                if (emptyEl) emptyEl.style.display = 'none';
                records.forEach(r => listEl.appendChild(renderRecord(r)));
            } catch (err) {
                if (loadingEl) loadingEl.style.display = 'none';
                if (listEl) listEl.innerHTML = `<p class="text-sm text-muted text-center">${err.message}</p>`;
            }
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('rec-submit-btn');
                const recordType = document.getElementById('rec-type').value;
                const content = document.getElementById('rec-content').value.trim();
                if (!content) return;

                const patientNip = user?.national_id;
                const pinataKey = localStorage.getItem('pinata_api_key');
                const pinataSecret = localStorage.getItem('pinata_secret_key');

                btn.disabled = true;
                btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Chiffrement en cours...";
                if (msgEl) msgEl.style.display = 'none';

                try {
                    // SHA-256 hash of the plaintext content
                    const encoded = new TextEncoder().encode(content);
                    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
                    const documentHash = Array.from(new Uint8Array(hashBuffer))
                        .map(b => b.toString(16).padStart(2, '0')).join('');

                    if (patientNip && pinataKey && pinataSecret && window.NutriIPFS) {
                        // Full pipeline: encrypt → IPFS → backend
                        btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Upload IPFS...";
                        const result = await window.NutriIPFS.createRecord({
                            recordData: { type: recordType, content, timestamp: new Date().toISOString() },
                            patientNip,
                            patientId: user.id,
                            recordType,
                            documentHash,
                            pinataApiKey: pinataKey,
                            pinataSecretKey: pinataSecret,
                            jwtToken: token,
                        });
                        if (msgEl) {
                            msgEl.innerHTML = `<i class='bx bx-check-circle'></i> Enregistré sur IPFS: <strong>${result.cid.substring(0, 20)}…</strong>`;
                            msgEl.style.color = 'var(--color-green)';
                            msgEl.style.display = 'block';
                        }
                    } else {
                        // No Pinata — save to backend only with placeholder CID
                        await window.NutriIPFS.saveRecordToBackend({
                            record_type: recordType,
                            ipfs_cid: 'PENDING',
                            document_hash: documentHash,
                        }, token);
                        if (msgEl) {
                            msgEl.innerHTML = `<i class='bx bx-info-circle'></i> Enregistré${patientNip ? '' : ' (NIP manquant)'}. Configurez Pinata dans les Paramètres pour activer IPFS.`;
                            msgEl.style.color = 'var(--color-orange)';
                            msgEl.style.display = 'block';
                        }
                    }
                    form.reset();
                    setTimeout(() => { if (msgEl) msgEl.style.display = 'none'; }, 5000);
                    await loadRecords();
                } catch (err) {
                    if (msgEl) {
                        msgEl.innerHTML = `<i class='bx bx-error-circle'></i> Erreur: ${err.message}`;
                        msgEl.style.color = '#ef4444';
                        msgEl.style.display = 'block';
                    }
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = "<i class='bx bx-upload'></i> Chiffrer &amp; Enregistrer";
                }
            });
        }

        await loadRecords();
    }

    function initMintZone() {
        const token = window.nutriAuth?.token;
        const user = window.nutriAuth?.user;
        const nip = user?.national_id;

        const walletInput = document.getElementById('mint-wallet-addr');
        const checkBtn = document.getElementById('mint-check-btn');
        const mintBtn = document.getElementById('mint-btn');
        const resultEl = document.getElementById('mint-result');
        const metaMaskBtn = document.getElementById('mint-use-metamask-btn');

        if (!walletInput) return;

        // Pre-fill from localStorage or connected MetaMask wallet
        const saved = localStorage.getItem('health_id_wallet');
        if (saved) walletInput.value = saved;
        // Delay slightly to let nutriWeb3.init() complete auto-connection
        setTimeout(() => {
            if (window.nutriWeb3?.userAddress && !walletInput.value) {
                walletInput.value = window.nutriWeb3.userAddress;
            }
        }, 600);

        if (metaMaskBtn) {
            metaMaskBtn.addEventListener('click', () => {
                if (window.nutriWeb3?.userAddress) {
                    walletInput.value = window.nutriWeb3.userAddress;
                } else {
                    walletInput.placeholder = 'Connectez MetaMask d\'abord via le bouton ci-dessus';
                }
            });
        }

        function showResult(html, color) {
            resultEl.innerHTML = html;
            resultEl.style.color = color;
            resultEl.style.display = 'block';
        }

        if (checkBtn) {
            checkBtn.addEventListener('click', async () => {
                const wallet = walletInput.value.trim();
                if (!wallet || !wallet.startsWith('0x') || wallet.length < 20) {
                    showResult("<i class='bx bx-error-circle'></i> Entrez une adresse Polygon valide (0x…)", '#ef4444');
                    return;
                }
                checkBtn.disabled = true;
                checkBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Vérification...";
                resultEl.style.display = 'none';
                try {
                    const res = await fetch('http://localhost:3000/api/blockchain/check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ wallet_address: wallet })
                    });
                    const data = await res.json();
                    localStorage.setItem('health_id_wallet', wallet);

                    // Update wallet display on the card
                    const shortEl = document.getElementById('hid-wallet-short');
                    if (shortEl) shortEl.textContent = `${wallet.substring(0, 6)}...${wallet.substring(38)}`;

                    if (data.has_health_id) {
                        showResult(
                            "<i class='bx bx-check-circle'></i> <strong>SBT ID Santé détecté !</strong> Ce portefeuille possède déjà un Health ID SBT.",
                            'var(--color-green)'
                        );
                        if (mintBtn) mintBtn.style.display = 'none';
                        const verEl = document.getElementById('sbt-verification');
                        if (verEl) verEl.innerHTML = `<span class="badge-pill bg-verified"><i class='bx bx-check-shield'></i> Identité Blockchain Vérifiée</span>`;
                    } else {
                        showResult(
                            "<i class='bx bx-info-circle'></i> Aucun SBT trouvé pour cette adresse. Vous pouvez minter votre ID Santé.",
                            'var(--color-orange)'
                        );
                        if (mintBtn) mintBtn.style.display = 'inline-flex';
                    }
                } catch (err) {
                    showResult(`<i class='bx bx-error-circle'></i> Erreur: ${err.message}`, '#ef4444');
                } finally {
                    checkBtn.disabled = false;
                    checkBtn.innerHTML = "<i class='bx bx-search'></i> Vérifier statut";
                }
            });
        }

        if (mintBtn) {
            mintBtn.addEventListener('click', async () => {
                const wallet = walletInput.value.trim();
                if (!wallet) return;
                if (!nip) {
                    showResult(
                        "<i class='bx bx-error-circle'></i> NIP manquant — complétez votre profil dans les <a href='#settings' style='color:var(--color-orange)'>Paramètres</a>.",
                        '#ef4444'
                    );
                    return;
                }
                mintBtn.disabled = true;
                mintBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Transaction en cours...";
                try {
                    const res = await fetch('http://localhost:3000/api/blockchain/mint', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ wallet_address: wallet, nip })
                    });
                    const data = await res.json();
                    if (data.success && data.data) {
                        const { tx_hash, token_id, recipient } = data.data;
                        const txShort = tx_hash ? `${tx_hash.substring(0, 20)}…` : '—';
                        showResult(
                            `<i class='bx bx-check-circle'></i> <strong style="color:var(--color-green)">SBT minté avec succès !</strong><br>
                            <span>Token ID: <strong style="color:#8247E5">#${token_id}</strong></span><br>
                            <span style="word-break:break-all;">Tx: <code style="font-size:0.8rem;">${txShort}</code></span>`,
                            'var(--color-green)'
                        );
                        const tokenEl = document.getElementById('hid-token-id');
                        if (tokenEl) tokenEl.textContent = `#${token_id}`;
                        const verEl = document.getElementById('sbt-verification');
                        if (verEl) verEl.innerHTML = `<span class="badge-pill bg-verified"><i class='bx bx-check-shield'></i> SBT Minté — Token #${token_id}</span>`;
                        mintBtn.style.display = 'none';
                    } else {
                        throw new Error(data.error || 'Échec du mint blockchain');
                    }
                } catch (err) {
                    showResult(`<i class='bx bx-error-circle'></i> ${err.message}`, '#ef4444');
                    mintBtn.disabled = false;
                    mintBtn.innerHTML = "<i class='bxl-polygon'></i> Minter mon ID Santé SBT";
                }
            });
        }
    }

    async function initFasting() {
        const API = 'http://localhost:3000/api/fasting';
        const token = window.nutriAuth?.token;
        if (!token) return;

        const activeCard = document.getElementById('fasting-active-card');
        const createZone = document.getElementById('fasting-create-zone');
        const calZone = document.getElementById('fasting-calendar-zone');

        let activePlan = null;

        async function fetchActivePlan() {
            try {
                const res = await fetch(`${API}/plans`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Erreur serveur");
                const plans = await res.json();

                // Get the latest active plan
                activePlan = plans.find(p => p.status === 'active');

                if (activePlan) {
                    createZone.style.display = 'none';
                    calZone.style.display = 'block';
                    document.getElementById('fast-current-title').innerHTML = `Jeûne En Cours : <strong>${activePlan.fast_type.toUpperCase()}</strong>`;
                    document.getElementById('fast-current-dates').innerText = `Depuis le ${new Date(activePlan.start_date).toLocaleDateString()} ${activePlan.end_date ? 'jusqu\'au ' + new Date(activePlan.end_date).toLocaleDateString() : ''}`;
                    await renderCalendar(activePlan.id, activePlan.start_date, activePlan.end_date);
                } else {
                    document.getElementById('fast-current-title').innerHTML = `Aucun plan de jeûne actif`;
                    document.getElementById('fast-current-dates').innerText = `Sélectionnez une tradition ci-dessous pour commencer.`;
                    createZone.style.display = 'block';
                    calZone.style.display = 'none';
                }
            } catch (e) {
                console.error("Failed to load fasting plans", e);
            }
        }

        async function renderCalendar(planId, startDateStr, endDateStr) {
            const grid = document.getElementById('fasting-calendar-grid');
            if (!grid) return;
            grid.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Chargement du calendrier...';

            try {
                const res = await fetch(`${API}/plans/${planId}/logs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const logs = await res.json();

                // Calculate days to display (max 40 or the diff between start and end)
                let totalDays = 30; // default
                const start = new Date(startDateStr);

                if (endDateStr) {
                    const end = new Date(endDateStr);
                    totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
                } else if (activePlan.fast_type === 'lent') {
                    totalDays = 40;
                }

                if (totalDays > 60) totalDays = 60; // Cap to avoid huge grids

                grid.innerHTML = '';
                let successCount = 0;

                const logMap = {};
                logs.forEach(l => logMap[l.date] = l);

                for (let i = 0; i < totalDays; i++) {
                    const currentDay = new Date(start);
                    currentDay.setDate(start.getDate() + i);
                    const dateStr = currentDay.toISOString().slice(0, 10);

                    const cellBtn = document.createElement('button');
                    cellBtn.className = 'btn btn-secondary btn-sm';
                    cellBtn.style.padding = '0';
                    cellBtn.style.height = '40px';
                    cellBtn.style.display = 'flex';
                    cellBtn.style.flexDirection = 'column';
                    cellBtn.style.alignItems = 'center';
                    cellBtn.style.justifyContent = 'center';
                    cellBtn.innerHTML = `<span>${i + 1}</span>`;

                    const existingLog = logMap[dateStr];
                    if (existingLog) {
                        if (existingLog.status === 'success') {
                            cellBtn.style.backgroundColor = 'rgba(0,154,68,0.2)';
                            cellBtn.style.borderColor = 'var(--color-green)';
                            cellBtn.style.color = 'var(--color-green)';
                            successCount++;
                        } else if (existingLog.status === 'skipped') {
                            cellBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                            cellBtn.style.borderColor = '#ef4444';
                            cellBtn.style.color = '#ef4444';
                            cellBtn.style.textDecoration = 'line-through';
                        }
                    }

                    // Click to cycle state: empty -> success -> skipped -> empty (delete conceptually but handled via status update)
                    cellBtn.onclick = async () => {
                        let nextStatus = 'success';
                        if (existingLog && existingLog.status === 'success') nextStatus = 'skipped';
                        else if (existingLog && existingLog.status === 'skipped') nextStatus = 'success'; // simplistic toggle for demo

                        cellBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i>';
                        try {
                            const postRes = await fetch(`${API}/plans/${planId}/logs`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    date: dateStr,
                                    status: nextStatus,
                                    notes: null
                                })
                            });
                            if (postRes.ok) {
                                await fetchActivePlan(); // re-render the whole block to update counts
                            }
                        } catch (e) {
                            console.error("Log error", e);
                        }
                    };

                    grid.appendChild(cellBtn);
                }

                document.getElementById('fast-completed-days').innerText = successCount;

            } catch (e) {
                grid.innerHTML = '<div class="text-sm text-orange">Erreur de chargement.</div>';
            }
        }

        // Form Submission
        const form = document.getElementById('fasting-create-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('fast-submit-btn');
                btn.disabled = true;
                btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Création...';

                try {
                    const res = await fetch(`${API}/plans`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            fast_type: document.getElementById('fast-type-select').value,
                            title: null,
                            start_date: document.getElementById('fast-start-date').value,
                            end_date: document.getElementById('fast-end-date').value || null
                        })
                    });
                    if (res.ok) {
                        form.reset();
                        await fetchActivePlan();
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = "<i class='bx bx-check'></i> Démarrer mon Jeûne";
                }
            });
        }

        await fetchActivePlan();
    }

});
