---
description: Prepare a release commit — bump the version, replace WEPOS_SINCE tokens, update the readme changelog, build the distribution zip, and commit (does not tag or push).
argument-hint: <version> (e.g. 2.1.0, no leading "v")
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git diff:*), Bash(git show:*), Bash(git tag:*), Bash(git ls-remote:*), Bash(grep:*), Bash(date:*), Bash(npm:*), Bash(composer:*), Bash(ls:*), Edit, Read
---

Prepare release **$1** for this WordPress plugin (wePOS — Point Of Sale for
WooCommerce & Dokan, slug `wepos`).

This command prepares the release **commit** only — bump the version, replace the
`WEPOS_SINCE` tokens, write the changelog, build the zip as a **pre-flight
check**, and commit. It **does not tag and does not push**. Tagging and pushing
are the maintainer's own steps, handled outside this command.

That separation matters here: `.github/workflows/deploy.yml` runs on
`on: push: tags: - "*"`, so pushing *any* tag rebuilds the plugin, deploys it to
the WordPress.org SVN repository, and publishes a GitHub release. There is no
`v*` filter and no dry-run — a pushed tag ships to wp.org users immediately.
Never create or push one on the user's behalf.

## Preconditions — verify first, abort with a clear message if any fail

1. A version argument was given in `$1`. If empty, stop and ask for one.
2. `$1` is a valid semver `X.Y.Z` with **no** leading `v`. If it has a `v`, strip it.
3. The working tree is clean (`git status --porcelain` is empty). If not, stop and
   show what's dirty — do not bundle unrelated changes into a release commit.
4. The webpack dev server (`npm start`) is **not** running. Check for
   `build/runtime.asset.php`: while it exists, PHP loads scripts from
   `http://localhost:8887` instead of `build/`, and a zip built in that state ships
   a plugin that renders nothing. If it is present, stop and ask the user to stop
   the dev server; `npm run build` in step 5 clears it, but confirm first rather
   than racing a live watcher.
5. `v$1` was not already released. Check `git tag -l v$1` and
   `git ls-remote --tags origin v$1` — both empty. If either has it, that version
   already shipped to wp.org; stop and ask which number to use instead. Read-only
   check: do not create or delete any tag.
6. `$1` is greater than the current version (read from `package.json`'s
   `"version"`, and cross-check the `Version:` header in `wepos.php`). If it is
   lower or equal, warn and ask to confirm. If `package.json`, `wepos.php` and
   `readme.txt` already disagree with each other, say so — the previous release
   drifted and the mismatch needs a decision before continuing.

## Steps

1. Bump `package.json`'s top-level `"version"` to `$1` with Edit. **This is the
   single source of truth** — `bin/make-zip.js` reads it and rewrites the other
   three version strings during `npm run zip`:
   - `wepos.php` — the `Version:` plugin header
   - `wepos.php` — the `public $version = '...';` property (line ~61)
   - `readme.txt` — the `Stable tag:` line

   Do not hand-edit those three; let the zip script write them so the regexes and
   the value stay in agreement. Verify them in step 6 instead.

2. Replace the `@since WEPOS_SINCE` / `@deprecated WEPOS_SINCE` tokens **before**
   building: `npm run version-replace`.

   This runs first, not as part of the build, for two reasons:
   - `npm run release` runs `version-replace` *after* `wp-scripts build`, so a
     token living in a `src/**` TypeScript file would get bundled into `build/`
     literally. Running it up front keeps the compiled output honest.
   - `deploy.yml` **never** runs `version-replace`. Whatever is committed is what
     ships, so an unreplaced token reaches wp.org verbatim.

   Confirm nothing is left: `grep -rn "WEPOS_SINCE" includes src templates assets wepos.php`
   must come back empty (the `bin/scripts/version-replace.js` source itself is
   outside those paths and is expected to still mention the token).

3. Update the **readme.txt changelog** — `readme.txt` is the only changelog in
   this repo (there is no `CHANGELOG.md`), and it is what users see on the plugin
   update screen.
   - Under the `## Changelog` heading (line ~164), insert a new section above the
     newest existing one. Newest first. The heading format is
     `= v$1 ( <Month D, YYYY> ) =` — a leading `v`, spaces inside the parens, and
     a long-form date from `date "+%B %-d, %Y"`.
   - Bullets use `-` and are prefixed with a bold marker matching the existing
     entries: `- **new:**`, `- **fix:**`, `- **update:**`, `- **tweak:**`.
   - **Write for shop owners, not developers.** Read the last two entries before
     drafting: they describe user-visible behaviour ("Tax breakdown is now
     displayed in the new POS cart UI"), never file names, class names, or hook
     names. Translate each commit into what changed on screen.

   Draft the bullets from commits since the last tag:
   `git log v<previous-version>..HEAD --pretty=format:'- %s'`
   Drop merge commits, lockfile chores, CI-only changes, and pure formatting.
   Collapse several commits on one fix into a single bullet.

4. Update `## Upgrade Notice` (line ~399) **only if this release needs one** — a
   breaking change, a required wePOS Pro version, or a migration step. Add a
   `= $1 =` block with one plain line. The section is sparse on purpose (it still
   only carries the 1.3.0 note); do not add a filler entry for a routine release.

5. Pre-flight build: `npm run release`. This chains
   `composer install --no-dev` → `composer du -o` → `npm install` → `npm run build`
   → `npm run makepot` → `npm run version-replace` → `npm run zip`.

   On success, `ls -lh dist/*.zip` — expect `dist/wepos-$1.zip`. If the build
   fails, stop and surface the error; do not commit a broken build, since
   `deploy.yml` runs the same build and would fail the same way. `dist/` is
   git-ignored (`*.zip`) and is **not** committed — CI regenerates the artifact
   that actually ships.

   Note: `wp i18n make-pot` needs WP-CLI on PATH. If `npm run makepot` fails for
   that reason, say so plainly rather than committing a stale
   `languages/wepos.pot`.

6. Verify the version landed in all four places and nothing else moved:

   ```
   grep -n '^Version:\|public \$version' wepos.php
   grep -n '^Stable tag:' readme.txt
   grep -n '"version"' package.json
   ```

   Use **single** quotes — in double quotes the shell eats `\$version` into a
   `$` end-of-line anchor and the property line silently never matches.

   All four must read `$1`.

7. **Review `git status` before staging.** The 2.0.1 release commit swept in
   `composer.lock` and a re-mozarted `dependencies/Appsero/Insights.php`; do not
   repeat that. Step 5's `composer install --no-dev` and `npm install` can touch
   `composer.lock` and `package-lock.json` — inspect each diff and drop the ones
   that are incidental churn (`git checkout -- <file>`).

   Stage and commit only the release payload:
   - `package.json` (and `package-lock.json` only if the bump genuinely changed it)
   - `wepos.php`, `readme.txt`
   - every file `version-replace` rewrote in step 2
   - `languages/wepos.pot`

   ```
   git commit -m "chore: Release version $1"
   ```

   (Matches the existing convention — see `git log -1 v2.0.1`.)

8. Restore the dev toolchain, which step 5 stripped: `composer install`.
   The `post-install-cmd` hook only runs Mozart when `COMPOSER_DEV_MODE` is set,
   so after `--no-dev` the repo has no `vendor/bin/mozart` and no `phpcs`.
   Leaving it that way breaks `composer phpcs` on the next task.

9. **Stop at the commit.** Do not tag. Do not push. Report what landed — the
   version, the changelog entry, the zip path, and the commit sha — and leave
   tagging and publishing to the user.

## Notes

- `deploy.yml` fires on **any** tag matching `*`, not just `v*`. A stray tag push
  starts a wp.org deploy, and there is no staging step between the tag and users.
  This command therefore never runs `git tag` or `git push` — it only reads tags
  in precondition 5 to confirm the version is unused.
- The wp.org deploy runs `composer install && composer install --no-dev -o &&
  npm install && npm run build`, then hands the tree to
  `10up/action-wordpress-plugin-deploy`, which filters it through `.distignore`.
  `.svnignore` is legacy and is not read by that action. `.distignore` excludes
  `/src`, `/assets/src`, `/bin`, `/tests` and `/docs` but keeps `build/`,
  `assets/js`, `assets/css` and `dependencies/` — so the release only works if
  the build step succeeded.
- CI never runs `version-replace`. Anything still saying `WEPOS_SINCE` in a
  committed file ships that way, which is why step 2 comes before the build and
  is verified by grep.
- Four version strings, one source: `package.json` drives the zip filename and,
  through `bin/make-zip.js`, the two `wepos.php` strings and the `readme.txt`
  `Stable tag:`. Never hand-edit the derived three.
- If this release pairs with a wePOS Pro release (`../wepos-pro`), the two are
  released separately — this command touches only the free plugin. Note any
  minimum Pro version in the Upgrade Notice.
- Compatibility headers (`Requires at least`, `Tested up to`, `WC tested up to`)
  live in both `wepos.php` and `readme.txt` and must stay in sync. This command
  does not bump them; if the release was tested against a newer WP or WooCommerce,
  raise it with the user and edit both files.
