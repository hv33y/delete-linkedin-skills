# LinkedIn Profile Skills Removal

A browser-console script for removing skills from your own LinkedIn profile.

## Usage

1. Sign in to LinkedIn and open [your skills page](https://www.linkedin.com/in/me/details/skills/).
2. Open your browser's developer console.
3. Review and paste `linkedin-skills-remover.js`, then press Enter. Your browser may require you to allow pasting first.
4. Keep the tab open while it runs. Refresh the page afterward to check the results.

The script removes **all available skills**, not a selected subset. Back up anything you want to keep first. There is no undo.

## Why these changes?

The previous version waited only 500 ms between deletions and retried failed deletion steps, which could lead to repeated clicks when LinkedIn was slow to respond. It also had no way to request a stop without refreshing or closing the tab. The revised script spaces out deletions, supports stopping between actions, checks the targeted skill disappears, and stops on unexpected errors instead of retrying a potentially destructive action.

## Controls

The settings at the top of the script are:

| Setting | Default | Purpose |
| --- | --- | --- |
| `PAUSE_BETWEEN` | 5000 ms | Wait between deletions |
| `BREAK_EVERY` | 10 | Take a longer break after this many deletions |
| `BREAK_DURATION` | 60000 ms | Length of the longer break |
| `MAX_DELETIONS` | 50 | Maximum deletions in one run |
| `TIMEOUT` | 12000 ms | Maximum wait for a page control or a deletion to complete |

To stop the script between actions, run:

```javascript
window.linkedinSkillsRemover.stop = true;
```

Refreshing or closing the tab also stops the script. A deletion already confirmed may still finish.

The script stops on unexpected errors instead of retrying potentially destructive clicks. It relies on LinkedIn's current page layout and English button labels, so it may need updating if the site changes. Longer delays do not guarantee protection from automated-activity restrictions.
