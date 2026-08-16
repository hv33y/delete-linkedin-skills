(async function () {
    var POLL = 50;
    var TIMEOUT = 10000;
    var PAUSE_BETWEEN = 500;    // ms between each deletion
    var MAX_RETRIES = 3;        // retries per skill before skipping

    function visible(el) { return el && el.offsetParent !== null; }

    function btnByText(txt) {
        return Array.prototype.slice.call(document.querySelectorAll('button'))
            .find(function (b) { return visible(b) && b.innerText.trim() === txt; });
    }

    function skillEditLinks() {
        return Array.prototype.slice.call(
            document.querySelectorAll('a[href*="/details/skills/edit/forms/"]')
        ).filter(function (a) {
            var label = (a.getAttribute('aria-label') || '').trim();
            return visible(a) && /^edit .+ skill$/i.test(label);
        });
    }

    function closeUpsell() {
        var dialogs = document.querySelectorAll('[role="dialog"], .artdeco-modal');
        for (var i = 0; i < dialogs.length; i++) {
            var d = dialogs[i];
            if (!visible(d)) continue;
            var x = d.querySelector('button[aria-label*="Dismiss" i], button[aria-label*="Close" i]');
            if (x) { x.click(); return true; }
            var nt = Array.prototype.slice.call(d.querySelectorAll('button'))
                .find(function (b) { return /no thanks|not now|maybe later|skip|dismiss|close/i.test(b.innerText); });
            if (nt) { nt.click(); return true; }
        }
        return false;
    }

    function closeAllModals() {
        closeUpsell();
        document.querySelectorAll('[role="dialog"] button[aria-label*="Close" i], [role="dialog"] button[aria-label*="Dismiss" i]').forEach(function(b) {
            if (visible(b)) b.click();
        });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }

    function waitFor(getter) {
        return new Promise(function (resolve, reject) {
            var start = Date.now();
            (function poll() {
                closeUpsell();
                var el;
                try { el = getter(); } catch (e) {}
                if (el) return resolve(el);
                if (Date.now() - start > TIMEOUT) return reject(new Error("timeout"));
                setTimeout(poll, POLL);
            })();
        });
    }

    function sleep(ms) {
        return new Promise(function (r) { setTimeout(r, ms); });
    }

    // Scroll to load all skills
    async function loadAllSkills() {
        console.log("📜 Scrolling to load all skills...");
        var lastCount = 0;
        for (var i = 0; i < 20; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await sleep(500);
            var current = skillEditLinks().length;
            if (current === lastCount && current > 0) break;
            lastCount = current;
        }
        window.scrollTo(0, 0);
        await sleep(500);
        console.log("✅ Found " + skillEditLinks().length + " skills to delete.");
    }

    async function deleteOneSkill() {
        var links = skillEditLinks();
        if (links.length === 0) return false;

        var before = links.length;
        var editLink = links[0];

        editLink.scrollIntoView({ behavior: 'instant', block: 'center' });
        await sleep(200);
        editLink.click();

        var deleteSkillBtn = await waitFor(function () { return btnByText('Delete skill'); });
        deleteSkillBtn.click();

        var confirmBtn = await waitFor(function () { return btnByText('Delete'); });
        confirmBtn.click();

        await waitFor(function () { return skillEditLinks().length < before; });
        return true;
    }

    // ========== MAIN ==========
    var janitor = setInterval(closeUpsell, 150);
    var deleted = 0;

    console.log("🚀 SKILL PURGE STARTED — Will not stop until ALL are gone.");

    try {
        await loadAllSkills();

        while (true) {
            var remaining = skillEditLinks().length;

            if (remaining === 0) {
                // Double check — scroll and reload
                await loadAllSkills();
                remaining = skillEditLinks().length;
                if (remaining === 0) {
                    console.log("🎉 ALL DONE! Deleted " + deleted + " skills. Zero remaining.");
                    break;
                }
            }

            console.log("🗑️ Deleting #" + (deleted + 1) + " | Remaining: " + remaining);

            var success = false;
            for (var attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    success = await deleteOneSkill();
                    if (success) break;
                } catch (e) {
                    console.log("⚠️ Attempt " + attempt + " failed. Retrying...");
                    closeAllModals();
                    await sleep(1000 * attempt);
                }
            }

            if (success) {
                deleted++;
                console.log("✅ Deleted #" + deleted);
            } else {
                console.log("❌ Couldn't delete a skill. Refreshing page...");
                closeAllModals();
                await sleep(2000);
                // Force scroll reload
                await loadAllSkills();
            }

            await sleep(PAUSE_BETWEEN);
        }
    } finally {
        clearInterval(janitor);
    }

    console.log("🏁 TOTAL DELETED: " + deleted);
})();
