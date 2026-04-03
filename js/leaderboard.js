const Leaderboard = {
    modal: null,
    listEl: null,
    statusEl: null,
    currentUserEl: null,
    refreshBtn: null,
    tabs: [],
    activeMetric: 'xp',
    refreshTimer: null,
    pollIntervalMs: 15000,
    requestId: 0,
    initialized: false,

    init() {
        if (this.initialized) {
            return;
        }

        this.modal = document.getElementById('leaderboard-modal');
        this.listEl = document.getElementById('leaderboard-list');
        this.statusEl = document.getElementById('leaderboard-refresh-status');
        this.currentUserEl = document.getElementById('leaderboard-current-user');
        this.refreshBtn = document.getElementById('leaderboard-refresh-btn');
        this.tabs = Array.from(document.querySelectorAll('.leaderboard-tab'));

        if (!this.modal || !this.listEl || !this.statusEl || !this.currentUserEl) {
            return;
        }

        this.tabs.forEach((button) => {
            button.addEventListener('click', () => {
                this.setMetric(button.dataset.metric || 'xp');
            });
        });

        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                this.refresh(true);
            });
        }

        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.close();
            }
        });

        window.addEventListener('java-odyssey:progress-synced', () => {
            if (this.isOpen()) {
                this.refresh(true);
            }
        });

        this.updateActiveTabUi();
        this.initialized = true;
    },

    isOpen() {
        return !!this.modal && this.modal.style.display === 'flex';
    },

    open(metric = null) {
        this.init();
        if (!this.modal) {
            return;
        }

        if (metric) {
            this.activeMetric = metric;
        }

        this.updateActiveTabUi();
        this.modal.style.display = 'flex';
        this.refresh(true);
        this.startPolling();
    },

    close() {
        if (!this.modal) {
            return;
        }

        this.stopPolling();
        this.modal.style.display = 'none';
    },

    setMetric(metric) {
        const safeMetric = ['xp', 'level', 'time_completed'].includes(metric)
            ? metric
            : 'xp';

        if (safeMetric === this.activeMetric && this.listEl?.children.length) {
            return;
        }

        this.activeMetric = safeMetric;
        this.updateActiveTabUi();
        this.refresh(true);
    },

    updateActiveTabUi() {
        this.tabs.forEach((button) => {
            const isActive = (button.dataset.metric || 'xp') === this.activeMetric;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    },

    startPolling() {
        this.stopPolling();
        this.refreshTimer = window.setInterval(() => {
            this.refresh();
        }, this.pollIntervalMs);
    },

    stopPolling() {
        if (this.refreshTimer) {
            window.clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    },

    setStatus(text, isError = false) {
        if (!this.statusEl) {
            return;
        }

        this.statusEl.textContent = text;
        this.statusEl.classList.toggle('is-error', !!isError);
    },

    setLoadingState(isLoading) {
        if (!this.refreshBtn) {
            return;
        }

        this.refreshBtn.disabled = isLoading;
        this.refreshBtn.textContent = isLoading ? 'Summoning...' : 'Refresh';
    },

    getMetricMeta() {
        switch (this.activeMetric) {
            case 'level':
                return {
                    title: 'Highest Level',
                    empty: 'No guardians have risen through the ranks yet.',
                    scoreLabel: 'Level'
                };
            case 'time_completed':
                return {
                    title: 'Fastest Clear',
                    empty: 'No Chapter 1 clear times have been recorded yet.',
                    scoreLabel: 'Best Time'
                };
            case 'xp':
            default:
                return {
                    title: 'Highest XP',
                    empty: 'No XP records have been etched into the hall yet.',
                    scoreLabel: 'Total XP'
                };
        }
    },

    async refresh(force = false) {
        this.init();
        if (!this.modal || !this.listEl) {
            return;
        }

        const currentRequestId = ++this.requestId;
        const metricMeta = this.getMetricMeta();

        this.setLoadingState(true);
        this.setStatus(`Reading the ${metricMeta.title.toLowerCase()} tablets...`);

        try {
            const url = `php/leaderboard.php?metric=${encodeURIComponent(this.activeMetric)}&limit=10${force ? `&_=${Date.now()}` : ''}`;
            const response = await fetch(url, {
                credentials: 'same-origin',
                cache: 'no-store'
            });
            const data = await response.json().catch(() => null);

            if (currentRequestId !== this.requestId) {
                return;
            }

            if (!response.ok || !data || !data.success) {
                throw new Error((data && data.message) || 'Failed to load the leaderboard.');
            }

            this.render(data);
            this.setStatus(`Updated ${this.formatRefreshTime(data.refreshed_at)}. Auto-refresh every 15s.`);
        } catch (error) {
            if (currentRequestId !== this.requestId) {
                return;
            }

            this.listEl.innerHTML = `
                <div class="leaderboard-empty">
                    The hall is quiet right now. Please try again in a moment.
                </div>
            `;
            this.currentUserEl.hidden = true;
            this.currentUserEl.innerHTML = '';
            this.setStatus(error.message || 'Unable to load the leaderboard right now.', true);
        } finally {
            if (currentRequestId === this.requestId) {
                this.setLoadingState(false);
            }
        }
    },

    render(data) {
        const entries = Array.isArray(data.entries) ? data.entries : [];
        const currentUser = data.current_user || null;
        const metricMeta = this.getMetricMeta();

        if (entries.length === 0) {
            this.listEl.innerHTML = `
                <div class="leaderboard-empty">
                    ${metricMeta.empty}
                </div>
            `;
        } else {
            this.listEl.innerHTML = entries.map((entry) => this.renderEntry(entry)).join('');
        }

        this.renderCurrentUser(currentUser, entries);
    },

    renderEntry(entry) {
        const rank = Number(entry.rank_position) || 0;
        const rankClass = rank > 0 && rank <= 3 ? ` leaderboard-row-top-${rank}` : '';
        const currentClass = entry.is_current_user ? ' leaderboard-row-current' : '';

        return `
            <article class="leaderboard-row${rankClass}${currentClass}">
                <div class="leaderboard-rank-badge">
                    <span class="leaderboard-rank-number">#${rank || '-'}</span>
                    <span class="leaderboard-rank-caption">${this.escapeHtml(this.getRankCaption(rank))}</span>
                </div>
                <div class="leaderboard-player-block">
                    <div class="leaderboard-player-topline">
                        <h3 class="leaderboard-player-name">${this.escapeHtml(entry.username || 'Unknown Guardian')}</h3>
                        ${entry.is_current_user ? '<span class="leaderboard-you-chip">You</span>' : ''}
                    </div>
                    <div class="leaderboard-player-facts">
                        ${this.renderFactPills(entry)}
                    </div>
                </div>
                <div class="leaderboard-score-block">
                    <span class="leaderboard-score-label">${this.escapeHtml(this.getMetricMeta().scoreLabel)}</span>
                    <strong class="leaderboard-score-value">${this.escapeHtml(this.getPrimaryScore(entry))}</strong>
                    <span class="leaderboard-score-subtext">${this.escapeHtml(this.getSecondaryScore(entry))}</span>
                </div>
            </article>
        `;
    },

    renderCurrentUser(currentUser, entries) {
        if (!this.currentUserEl) {
            return;
        }

        if (!currentUser) {
            this.currentUserEl.hidden = true;
            this.currentUserEl.innerHTML = '';
            return;
        }

        const isListed = entries.some((entry) => Number(entry.user_id) === Number(currentUser.user_id));
        const rankText = currentUser.rank_position
            ? `#${currentUser.rank_position}`
            : 'Not Ranked Yet';
        const helperText = this.activeMetric === 'time_completed' && !currentUser.time_completed
            ? 'Finish Chapter 1 to claim a spot in the speed records.'
            : (isListed
                ? 'Your row is highlighted below in the hall.'
                : 'You are outside the top 10, but your standing is still tracked here.');

        this.currentUserEl.hidden = false;
        this.currentUserEl.innerHTML = `
            <div class="leaderboard-current-card">
                <div class="leaderboard-current-rank-block">
                    <span class="leaderboard-current-kicker">Your Standing</span>
                    <strong class="leaderboard-current-rank-text">${this.escapeHtml(rankText)}</strong>
                </div>
                <div class="leaderboard-current-main">
                    <strong class="leaderboard-current-name">${this.escapeHtml(currentUser.username || 'Guardian')}</strong>
                    <div class="leaderboard-current-facts">
                        ${this.renderFactPills(currentUser)}
                    </div>
                </div>
                <div class="leaderboard-current-score">
                    <span>${this.escapeHtml(this.getPrimaryScore(currentUser))}</span>
                    <small>${this.escapeHtml(helperText)}</small>
                </div>
            </div>
        `;
    },

    renderFactPills(entry) {
        const facts = [
            { label: 'Level', value: String(Number(entry.level) || 1) },
            { label: 'XP', value: `${this.formatNumber(entry.xp)} XP` },
            { label: 'Clear', value: this.getCompletionMeta(entry, 'short') }
        ];

        return facts.map((fact) => `
            <span class="leaderboard-fact-pill">
                <span class="leaderboard-fact-label">${this.escapeHtml(fact.label)}</span>
                <span class="leaderboard-fact-value">${this.escapeHtml(fact.value)}</span>
            </span>
        `).join('');
    },

    getRankCaption(rank) {
        if (rank === 1) return 'Champion';
        if (rank === 2) return 'Second';
        if (rank === 3) return 'Third';
        if (rank > 0) return 'Hall Rank';
        return 'Unranked';
    },

    getPrimaryScore(entry) {
        if (this.activeMetric === 'level') {
            return `Level ${Number(entry.level) || 1}`;
        }

        if (this.activeMetric === 'time_completed') {
            return entry.time_completed
                ? this.formatDuration(entry.time_completed)
                : 'No clear yet';
        }

        return `${this.formatNumber(entry.xp)} XP`;
    },

    getSecondaryScore(entry) {
        if (this.activeMetric === 'level') {
            const clearText = entry.time_completed
                ? `Clear ${this.formatDuration(entry.time_completed)}`
                : 'No clear yet';
            return `${this.formatNumber(entry.xp)} XP | ${clearText}`;
        }

        if (this.activeMetric === 'time_completed') {
            return `Lv. ${Number(entry.level) || 1} | ${this.formatNumber(entry.xp)} XP`;
        }

        return `Level ${Number(entry.level) || 1} | ${this.getCompletionMeta(entry, 'short')}`;
    },

    getEntryMeta(entry) {
        const level = `Level ${Number(entry.level) || 1}`;
        const xp = `${this.formatNumber(entry.xp)} total XP`;
        return `${level} | ${xp} | ${this.getCompletionMeta(entry)}`;
    },

    getCompletionMeta(entry, variant = 'full') {
        if (entry.time_completed) {
            const duration = this.formatDuration(entry.time_completed);
            return variant === 'short'
                ? duration
                : `Chapter 1 in ${duration}`;
        }

        return variant === 'short'
            ? 'Not cleared'
            : 'Chapter 1 not yet cleared';
    },

    formatDuration(totalSeconds) {
        const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
        const minutes = Math.floor(safeSeconds / 60);
        const seconds = safeSeconds % 60;
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m ${seconds}s`;
        }

        return `${minutes}m ${seconds}s`;
    },

    formatNumber(value) {
        return new Intl.NumberFormat().format(Math.max(0, Number(value) || 0));
    },

    formatRefreshTime(value) {
        const date = value ? new Date(value) : new Date();
        if (Number.isNaN(date.getTime())) {
            return 'just now';
        }

        return date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        });
    },

    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
};

window.Leaderboard = Leaderboard;

document.addEventListener('DOMContentLoaded', () => {
    Leaderboard.init();
});
