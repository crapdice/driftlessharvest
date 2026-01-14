
// AB Engine
export const AB = (() => {
    const cache = {};
    const params = new URLSearchParams(window.location.search);

    function getConfig() {
        return window.CONFIG || { meta: { abTestingEnabled: false } };
    }

    function weightedPick(variants) {
        const entries = Object.entries(variants);
        const total = entries.reduce((s, [, v]) => s + v.weight, 0);
        let r = Math.random() * total;

        for (const [k, v] of entries) {
            if ((r -= v.weight) <= 0) return k;
        }
        return entries[0][0];
    }

    function logExposure(name, variant) {
        if (typeof window.logExposure === 'function') {
            window.logExposure({ experiment: name, variant, path: window.location.pathname });
        }
    }

    function isExperimentActive(exp) {
        if (!exp.schedule) return true;
        const now = new Date();
        if (exp.schedule.start && new Date(exp.schedule.start) > now) return false;
        if (exp.schedule.end && new Date(exp.schedule.end) < now) return false;
        return true;
    }

    function resolve(name) {
        const CONFIG = getConfig();
        if (!CONFIG.experiments || !CONFIG.experiments[name]) return null;

        if (!CONFIG.meta.abTestingEnabled) {
            return Object.values(CONFIG.experiments[name].variants)[0];
        }

        if (cache[name]) return cache[name];

        const exp = CONFIG.experiments[name];
        const forced = params.get(name);

        // 1. Query param forcing
        if (forced && exp.variants[forced]) {
            logExposure(name, forced);
            return (cache[name] = exp.variants[forced]);
        }

        // 2. Winner lock-in
        if (CONFIG.meta.winnerLockIn?.enabled) {
            const locked = CONFIG.meta.winnerLockIn.winners?.[name];
            if (locked && exp.variants[locked]) {
                logExposure(name, locked);
                return (cache[name] = exp.variants[locked]);
            }
        }

        // 3. Season-aware gating
        if (!isExperimentActive(exp)) {
            const fallbackKey = Object.keys(exp.variants)[0];
            logExposure(name, fallbackKey);
            return (cache[name] = exp.variants[fallbackKey]);
        }

        // 4. Normal assignment
        let key;
        if (CONFIG.meta.assignmentStrategy === "localStorage") {
            key = localStorage.getItem(`ab_${name}`);
            if (!key) {
                key = weightedPick(exp.variants);
                localStorage.setItem(`ab_${name}`, key);
            }
        } else {
            key = weightedPick(exp.variants);
        }

        logExposure(name, key);
        return (cache[name] = exp.variants[key]);
    }

    return { resolve };
})();
