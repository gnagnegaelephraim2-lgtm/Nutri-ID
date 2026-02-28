/**
 * NUTRI-ID - Auth Manager Logic
 * Handles JWT storage, API requests for login/register, and route guarding.
 */

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('nutriid_token') || null;
        this.user = null;
        this.baseUrl = 'http://localhost:3000/api/auth';
    }

    async init() {
        if (this.token) {
            await this.fetchProfile();
        }
        this.updateSidebar();
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#btn-logout')) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    async login(email, password) {
        try {
            const res = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || data || 'Erreur de connexion');

            this.token = data.token;
            localStorage.setItem('nutriid_token', this.token);
            await this.fetchProfile();
            this.updateSidebar();
            return true;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(payload) {
        try {
            const res = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || data || 'Erreur lors de l\'inscription');

            this.token = data.token;
            localStorage.setItem('nutriid_token', this.token);
            await this.fetchProfile();
            this.updateSidebar();
            return true;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    async fetchProfile() {
        try {
            const res = await fetch(`${this.baseUrl}/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (res.ok) {
                this.user = await res.json();
            } else {
                this.logout(false); // Token invalid/expired
            }
        } catch (e) {
            console.error('Failed to fetch profile', e);
        }
    }

    async updateProfile(payload) {
        if (!this.token) throw new Error("Non authentifié");

        try {
            const res = await fetch(`${this.baseUrl}/me/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour');

            // Reload user profile in memory to update UI elements like the Health ID card
            await this.fetchProfile();
            this.updateSidebar();

            // If the ID view is open and we just updated data, try to refresh it
            if (window.location.hash === '#health-id' && window.nutriWeb3) {
                window.nutriWeb3.init();
            }

            return true;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    logout(redirect = true) {
        this.token = null;
        this.user = null;
        localStorage.removeItem('nutriid_token');
        if (redirect) window.location.hash = '#login';
    }

    isAuthenticated() {
        return !!this.token;
    }

    guardRoute(routeId) {
        const publicRoutes = ['login', 'register'];
        if (!this.isAuthenticated() && !publicRoutes.includes(routeId)) {
            window.location.hash = '#login';
            return false;
        }
        if (this.isAuthenticated() && publicRoutes.includes(routeId)) {
            window.location.hash = '#home'; // auto-redirect if already logged in
            return false;
        }
        return true;
    }

    updateSidebar() {
        const userArea = document.querySelector('.bottom-user');
        if (!userArea) return;

        if (this.user) {
            const name = this.user.full_name || this.user.email.split('@')[0];
            const initials = name.substring(0, 2).toUpperCase();
            userArea.style.display = 'flex';
            userArea.innerHTML = `
                <div class="user-avatar">${initials}</div>
                <div class="user-info">
                    <h4>${name}</h4>
                    <span>${this.user.role}</span>
                </div>
                <button id="btn-logout" title="Se déconnecter" style="background:none;border:none;color:var(--color-orange);cursor:pointer;margin-left:auto;">
                    <i class='bx bx-log-out fs-lg'></i>
                </button>
            `;
        } else {
            userArea.style.display = 'none';
        }
    }
}

window.nutriAuth = new AuthManager();
