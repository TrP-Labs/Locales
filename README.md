# TrP Labs i18n

Every word the [TrP Tools](https://github.com/TrP-Labs) website says, in every
language it says it in.

```
locales/
  en/strings.jsonc    ← the English source. The only file edited by hand.
  en/strings.json     ← generated from it; what Crowdin reads.
  de/strings.json     ← written by Crowdin. Do not edit here.
  …
```

Translation happens in **[Crowdin](https://crowdin.com/project/trp-labs)**, not
in this repository. Pushing English here sends it up; finished translations
come back as a pull request opened by the `Crowdin` workflow.

## Helping translate

You do not need to install anything, clone anything, or be a programmer.
[Join the project on Crowdin](https://crowdin.com/project/trp-labs) and pick
your language — Crowdin shows you one string at a time with its context, keeps
the placeholders safe, and warns you when something looks wrong.

Ask in the [Discord server](https://discord.gg/W5nzCmYC5K) if you would like a
language added that is not listed yet, or if a string does not make sense in
context.

Anything you have not translated falls back to English, so a partial language
is useful and safe.

## Changing the English

English is the one thing edited here rather than in Crowdin, because it is the
source everything else is translated from.

1. Edit `locales/en/strings.jsonc`. It is JSONC, so `//` comments are allowed
   anywhere — that is where a string's context for translators lives.
2. Run `node scripts/build.mjs` to regenerate `locales/en/strings.json`.
3. Commit both. CI fails if the generated file is out of step with its source.

Two rules that matter:

**Keep the keys.** `"dashboard_shifts_delete_confirm"` is an address, not
words. Renaming one makes the site lose that string — and Crowdin treats it as
a brand new string, losing every translation of it.

**Keep the placeholders.** `{name}`, `{count}`, `{route}` are filled in when
the page is drawn. Translators may move them; nobody should rename them.

## How a word reaches the website

```
  edit locales/en/strings.jsonc          (here)
      ↓ push to prod
  Crowdin workflow uploads the source     (.github/workflows/crowdin.yml)
      ↓ people translate
  Crowdin opens a pull request back here  (branch: l10n_crowdin)
      ↓ merge
  trptools-frontend ./scripts/pull-locales.sh
      ↓ commit + release
  the website
```

The last two steps are deliberate rather than automatic: the site compiles its
strings at build time, so a language ships when a build ships. A language is
also only *shown* once its tag is listed in the frontend's
`project.inlang/settings.json` — that is the switch that decides a translation
is complete enough to put in front of people.

## Setup this repository needs

The `Crowdin` workflow needs two repository secrets, under
**Settings → Secrets and variables → Actions**:

| Secret | Where it comes from |
| --- | --- |
| `CROWDIN_PROJECT_ID` | The Crowdin project's **Tools → API** tab. |
| `CROWDIN_PERSONAL_TOKEN` | [crowdin.com/settings#api-key](https://crowdin.com/settings#api-key). Scope it to Projects (read), Translation status (read), Source files & strings (read/write), Translations (read/write). Add Screenshots (read/write) as well if the same token is used for the site's screenshot script, which this workflow does not need. |

It also needs **Settings → Actions → General → Allow GitHub Actions to create
and approve pull requests** switched on, or opening the translation pull
request fails even though the workflow's permissions look right.

## Licence

MIT, the same as the rest of TrP Tools. See [LICENSE](LICENSE).
