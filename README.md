# TrP Labs translations

This repository is the source of truth for the website and Discord bot's text.
Translations are edited and reviewed directly in Git, without a Crowdin
subscription or API token. Crowdin uploads are optional and manual; its workflow
never downloads translations over these files.

`locales/en/strings.jsonc` is the website's American English source, and
`locales/en/bot.jsonc` is the bot's. Their comments explain context. The `.json`
files beside them are generated. Other languages are authored directly in
`locales/<language>/strings.json` and `bot.json`.

## Update and ship

1. Edit the English JSONC sources when copy changes, then run
   `node scripts/build.mjs`.
2. Translate the new or changed values in every target language. Keep keys,
   `{placeholders}`, link destinations and Markdown formatting intact. Use
   natural full sentences; preserve game and product names. Review existing
   translations whenever an English value changes, even if its key stays the same.
3. Run `node scripts/build.mjs --check`, `node --test scripts/check.test.mjs`,
   and `node scripts/check.mjs`. CI runs these too. The last command refuses
   missing/empty/extra keys, changed placeholders or URLs, untranslated English,
   Discord command descriptions over 100 characters, modal labels over 45,
   and poll answers over 55. These checks do not
   replace a fluent speaker's review of meaning and grammar.
4. Run `node scripts/sync.mjs` to vendor validated catalogs into sibling
   `trptools-frontend/messages` and `trptools-bot/messages`. This reads local
   files, so it works offline and immediately after editing. It also refuses
   to erase newer English feature keys already present in either app. Use
   `--frontend PATH --bot PATH` for a different checkout layout, or `--check`
   to verify both copies without writing them.
5. Commit and push this repository to `prod`, then commit the vendored messages
   in both apps, run their checks and release/deploy them. The website compiles
   messages into its build; the bot bundles its own catalogs. A Locales push
   alone does not change either running app.

For an English-identical value that is legitimately correct (a proper name,
placeholder-only text, or a word shared with the target language), record
`strings:<key>` or `bot:<key>` on a line in that locale's `.same-as-english`.
Review these exceptions carefully. Never add an ordinary English sentence just
to satisfy the checker. To check one language, run `node scripts/check.mjs de`.

## Add a language

Add both catalogs under its locale directory and complete them before syncing.
Give it an endonym and flag in the frontend, then list its tag in
`project.inlang/settings.json`. Import its bot catalog in `src/i18n/catalog.ts`.
Those explicit lists decide which languages ship. The current languages are
English, Czech, German, French, Polish, Russian and Ukrainian.

Both apps retain `scripts/pull-locales.sh` for fetching committed catalogs from
`TrP-Labs/Locales@prod` when no local checkout is available. No Crowdin call is
involved. GitHub's raw-content cache can lag a fresh push; prefer the local sync
for release preparation.

## Optional Crowdin

The manual **Optional Crowdin source upload** workflow needs
`CROWDIN_PROJECT_ID` and `CROWDIN_PERSONAL_TOKEN` repository secrets. It uploads
only English sources. Automatic uploads and translation downloads are disabled
because of the plan's string limit and to protect direct translation edits.
Do not merge an old `l10n_crowdin` export over newer direct translations.

MIT; see [LICENSE](LICENSE).
