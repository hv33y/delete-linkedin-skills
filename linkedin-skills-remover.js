(async function () {
    var TIMEOUT = 12000;
    var PAUSE_BETWEEN = 5000;
    var BREAK_EVERY = 10;
    var BREAK_DURATION = 60000;
    var MAX_DELETIONS = 50;

    if (window.linkedinSkillsRemover && window.linkedinSkillsRemover.running) {
        console.warn('Skills remover is already running.');
        return;
    }

    var state = { running: true, stop: false, deleted: 0 };
    window.linkedinSkillsRemover = state;

    function visible(el) { return el && el.getClientRects().length > 0; }

    function btnByText(txt) {
        return Array.from(document.querySelectorAll('button'))
            .find(function (b) { return visible(b) && b.innerText.trim() === txt; });
    }

    function skillEditLinks() {
        return Array.from(document.querySelectorAll('a[href*="/details/skills/edit/forms/"]'))
            .filter(function (a) {
                return visible(a) && /^edit .+ skill$/i.test(a.getAttribute('aria-label') || '');
            });
    }

    function closeUpsell() {
        var dialogs = document.querySelectorAll('[role="dialog"], .artdeco-modal');
        for (var i = 0; i < dialogs.length; i++) {
            var dialog = dialogs[i];
            if (!visible(dialog) || !/premium|try it free|free trial|on a roll/i.test(dialog.innerText)) continue;
            var close = dialog.querySelector('button[aria-label*="Dismiss" i], button[aria-label*="Close" i]') ||
                Array.from(dialog.querySelectorAll('button')).find(function (b) {
                    return /no thanks|not now|maybe later|skip|dismiss|close/i.test(b.innerText);
                });
            if (close) { close.click(); return true; }
        }
        return false;
    }

    function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

    async function pause(ms) {
        var end = Date.now() + ms;
        while (!state.stop && Date.now() < end) {
            await sleep(Math.min(250, end - Date.now()));
        }
    }

    async function waitFor(getter) {
        var start = Date.now();
        while (!state.stop && Date.now() - start < TIMEOUT) {
            closeUpsell();
            var result = getter();
            if (result) return result;
            await sleep(200);
        }
        throw new Error(state.stop ? 'Stopped by user' : 'Timed out waiting for LinkedIn');
    }

    async function loadAllSkills() {
        var previous = -1;
        var stable = 0;
        for (var i = 0; i < 30 && !state.stop; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await pause(800);
            var current = skillEditLinks().length;
            stable = current === previous ? stable + 1 : 0;
            previous = current;
            if (stable >= 3) break;
        }
        window.scrollTo(0, 0);
        await pause(500);
        console.log('Visible skills:', skillEditLinks().length);
    }

    async function deleteOneSkill() {
        var edit = skillEditLinks()[0];
        if (!edit) return false;
        var href = edit.getAttribute('href');
        var label = edit.getAttribute('aria-label');

        edit.scrollIntoView({ block: 'center' });
        await pause(400);
        if (state.stop) return false;
        edit.click();

        var remove = await waitFor(function () { return btnByText('Delete skill'); });
        if (state.stop) return false;
        remove.click();

        var confirm = await waitFor(function () { return btnByText('Delete'); });
        if (state.stop) return false;
        confirm.click();

        await waitFor(function () {
            return !skillEditLinks().some(function (a) {
                return a.getAttribute('href') === href && a.getAttribute('aria-label') === label;
            });
        });
        return true;
    }

    console.log('Skills remover started. To stop: window.linkedinSkillsRemover.stop = true');
    try {
        await loadAllSkills();
        while (!state.stop && state.deleted < MAX_DELETIONS) {
            if (!skillEditLinks().length) {
                await loadAllSkills();
                if (!skillEditLinks().length) break;
            }
            if (!await deleteOneSkill()) break;
            state.deleted++;
            console.log('Deleted:', state.deleted);
            if (state.deleted % BREAK_EVERY === 0) {
                console.log('Taking a break...');
                await pause(BREAK_DURATION);
            } else {
                await pause(PAUSE_BETWEEN);
            }
        }
    } catch (error) {
        console.error('Stopped:', error.message);
        console.warn('Check the page before starting another run.');
    } finally {
        state.running = false;
        console.log('Finished. Deleted:', state.deleted);
    }
})();
