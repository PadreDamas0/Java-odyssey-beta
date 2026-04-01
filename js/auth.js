const Auth = {
    currentUser: null,
    remoteProgress: null,
    authPromise: null,
    lastProgressSignature: '',

    init() {
        this.initAuthPage();

        if (document.body.classList.contains('game-page')) {
            this.bootstrapFromPage();
            this.bindProgressFlush();
        }
    },

    bootstrapFromPage() {
        const bootstrap = window.__AUTH_BOOTSTRAP__;
        if (!bootstrap || !bootstrap.user) {
            return false;
        }

        this.currentUser = {
            userId: Number(bootstrap.user.user_id),
            username: bootstrap.user.username,
            email: bootstrap.user.email
        };
        this.remoteProgress = bootstrap.progress || null;

        if (this.remoteProgress) {
            this.lastProgressSignature = JSON.stringify({
                level: Math.max(1, Number(this.remoteProgress.level) || 1),
                coins: Math.max(0, Number(this.remoteProgress.coins) || 0),
                hp: Math.max(0, Number(this.remoteProgress.hp) || 0)
            });
        }

        this.updateAuthLabels();
        this.hideOverlay();
        return true;
    },

    initAuthPage() {
        const messageEl = document.getElementById('auth-message');
        if (!messageEl) {
            return;
        }

        if (window.location.protocol === 'file:') {
            this.showMessage(
                messageEl,
                'error',
                'This page was opened as a local file. PHP will not run in file mode. Start Apache and MySQL in XAMPP, move the project into htdocs, then open it with http://localhost/.../login.php or register.php.'
            );

            document.querySelectorAll('form.auth-form').forEach((form) => {
                form.addEventListener('submit', (event) => {
                    event.preventDefault();
                });
            });

            return;
        }

        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        const success = params.get('success');
        const username = params.get('username');
        const email = params.get('email');

        if (username) {
            const usernameInput = document.querySelector('input[name="username"]');
            if (usernameInput) {
                usernameInput.value = username;
            }
        }

        if (email) {
            const emailInput = document.querySelector('input[name="email"]');
            if (emailInput) {
                emailInput.value = email;
            }
        }

        if (error) {
            this.showMessage(messageEl, 'error', error);
        } else if (success) {
            this.showMessage(messageEl, 'success', success);
        }

        if (error || success || username || email) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },

    showMessage(element, type, text) {
        element.hidden = false;
        element.className = `auth-message is-${type}`;
        element.textContent = text;
    },

    hideOverlay() {
        const overlay = document.getElementById('auth-loading-overlay');
        if (overlay) {
            overlay.hidden = true;
            overlay.style.display = 'none';
        }
    },

    async requireGameAccess() {
        if (this.currentUser || this.bootstrapFromPage()) {
            return true;
        }

        if (this.authPromise) {
            return this.authPromise;
        }

        this.authPromise = fetch('php/auth_check.php?mode=json', {
            credentials: 'same-origin',
            cache: 'no-store'
        })
            .then(async (response) => {
                const data = await response.json().catch(() => null);
                if (!response.ok || !data || !data.authenticated) {
                    window.location.replace('login.php?error=' + encodeURIComponent('Please log in to access the game.'));
                    return false;
                }

                this.currentUser = {
                    userId: Number(data.user.user_id),
                    username: data.user.username,
                    email: data.user.email
                };
                this.remoteProgress = data.progress || null;
                if (this.remoteProgress) {
                    this.lastProgressSignature = JSON.stringify({
                        level: Math.max(1, Number(this.remoteProgress.level) || 1),
                        coins: Math.max(0, Number(this.remoteProgress.coins) || 0),
                        hp: Math.max(0, Number(this.remoteProgress.hp) || 0)
                    });
                }
                this.updateAuthLabels();
                this.hideOverlay();
                return true;
            })
            .catch((error) => {
                console.error('Failed to validate the session.', error);
                const message = document.getElementById('auth-loading-error');
                if (message) {
                    this.showMessage(message, 'error', 'Unable to validate your session. Please refresh or log in again.');
                }
                return false;
            });

        return this.authPromise;
    },

    updateAuthLabels() {
        if (!this.currentUser) {
            return;
        }

        document.body.dataset.userId = String(this.currentUser.userId);

        document.querySelectorAll('[data-auth-username]').forEach((element) => {
            element.textContent = this.currentUser.username;
        });

        const userIdElement = document.getElementById('session-user-id');
        if (userIdElement) {
            userIdElement.textContent = String(this.currentUser.userId);
        }

        const hudName = document.getElementById('hud-player-name');
        if (hudName && hudName.textContent.trim() === 'Trainee Guardian') {
            hudName.textContent = this.currentUser.username;
        }
    },

    getUserScopedKey(baseKey) {
        if (!this.currentUser || !this.currentUser.userId) {
            return baseKey;
        }

        return `${baseKey}_user_${this.currentUser.userId}`;
    },

    getRemotePlayerProfile() {
        if (!this.currentUser) {
            return null;
        }

        const profile = {
            name: this.currentUser.username,
            userId: this.currentUser.userId
        };

        if (!this.remoteProgress) {
            return profile;
        }

        const level = Math.max(1, Number(this.remoteProgress.level) || 1);
        const hp = Math.max(0, Number(this.remoteProgress.hp) || 100);

        profile.level = level;
        profile.gold = Math.max(0, Number(this.remoteProgress.coins) || 0);
        profile.hp = hp;
        profile.maxHp = Math.max(100 + Math.max(0, level - 1) * 10, hp);

        return profile;
    },

    syncPlayerProgress(playerState) {
        if (!this.currentUser || !playerState) {
            return Promise.resolve();
        }

        const payload = {
            level: Math.max(1, Number(playerState.level) || 1),
            coins: Math.max(0, Number(playerState.gold) || 0),
            hp: Math.max(0, Number(playerState.hp) || 0)
        };
        const signature = JSON.stringify(payload);

        if (signature === this.lastProgressSignature) {
            return Promise.resolve();
        }

        return fetch('php/save_progress.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(async (response) => {
                const data = await response.json().catch(() => null);
                if (!response.ok || !data || !data.success) {
                    throw new Error((data && data.message) || 'Failed to save progress.');
                }

                this.lastProgressSignature = signature;
                this.remoteProgress = {
                    level: payload.level,
                    coins: payload.coins,
                    hp: payload.hp
                };
            })
            .catch((error) => {
                console.warn('Progress sync skipped:', error.message);
            });
    },

    sendProgressBeacon(playerState) {
        if (!navigator.sendBeacon || !this.currentUser || !playerState) {
            return;
        }

        const payload = {
            level: Math.max(1, Number(playerState.level) || 1),
            coins: Math.max(0, Number(playerState.gold) || 0),
            hp: Math.max(0, Number(playerState.hp) || 0)
        };
        const signature = JSON.stringify(payload);

        if (signature === this.lastProgressSignature) {
            return;
        }

        const data = new Blob([JSON.stringify(payload)], {
            type: 'application/json'
        });

        navigator.sendBeacon('php/save_progress.php', data);
        this.lastProgressSignature = signature;
    },

    bindProgressFlush() {
        window.addEventListener('beforeunload', () => {
            if (window.GameState && window.GameState.player) {
                this.sendProgressBeacon(window.GameState.player);
            }
        });
    }
};

window.Auth = Auth;

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
