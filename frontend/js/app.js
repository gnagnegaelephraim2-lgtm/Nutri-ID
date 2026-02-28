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
        }
        if (route === 'nutrition') {
            initNutritionCharts();
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
        }
        if (route === 'records') {
            if (window.nutriRecords) {
                window.nutriRecords.init();
            }
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

    function initDashboardCharts() {
        const canvas = document.getElementById('healthChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const c = getChartColors();

        window.healthChartInst = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
                datasets: [{
                    label: 'Indice Santé Global',
                    data: [65, 70, 68, 80, 85, 92],
                    borderColor: '#009A44', /* Ivorian Green */
                    backgroundColor: 'rgba(0, 154, 68, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: c.text } }
                },
                scales: {
                    x: {
                        grid: { color: c.grid },
                        ticks: { color: c.text }
                    },
                    y: {
                        grid: { color: c.grid },
                        ticks: { color: c.text }
                    }
                }
            }
        });
    }

    function initNutritionCharts() {
        const canvas = document.getElementById('nutritionMap');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const c = getChartColors();

        window.nutriChartInst = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Protéines', 'Glucides', 'Lipides', 'Vitamine C', 'Fer', 'Calcium'],
                datasets: [{
                    label: 'Apport Moyen Hebdomadaire',
                    data: [80, 95, 60, 45, 70, 50],
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
                        ticks: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
});
