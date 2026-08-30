# TrP Labs i18n

Every word the [TrP Tools](https://github.com/TrP-Labs) website says, in every
language it says it in. One folder per language, one `strings.jsonc` inside it.

```
locales/
  en/strings.jsonc    ← the source. English is written here first.
  de/strings.jsonc
  …
```

The site is built from these files rather than reading them at runtime, so a
translation reaches people when the next version of TrP Tools ships.

## Helping out

You do not need to install anything, and you do not need to be a programmer.
Everything is one text file you can edit in the browser.

1. Open [`locales/en/strings.jsonc`](locales/en/strings.jsonc) and read the
   notes at the top — the comments through the file explain what each group of
   strings is for and where it appears.
2. Copy it into `locales/<your-language>/strings.jsonc`, using the
   [two-letter code](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes)
   for your language (`cs`, `de`, `es`, `pl`, `ru` …).
3. Translate the text on the **right** of each colon. Leave the key on the left
   exactly as it is — that is what the site looks the string up by.
4. Open a pull request.

Ask in the [Discord server](https://discord.gg/W5nzCmYC5K) if you would rather
be walked through it, or if you are not sure what a string means in context.

## The rules that matter

**Keep the keys.** `"dashboard_shifts_delete_confirm"` is an address, not
words. Renaming it makes the site lose that string.

**Keep the placeholders.** `{name}`, `{count}`, `{route}` are filled in when
the page is drawn. Spell them exactly as they appear — but move them wherever
your language wants them:

```jsonc
"dashboard_routes_created": "Route {name} created"      // en
"dashboard_routes_created": "Route {name} erstellt"     // de — same placeholder
```

**Partial is fine.** Anything you have not translated falls back to English, so
there is no need to finish a language before opening a pull request.

**Comments are yours.** The file is JSONC, so `//` comments are allowed
anywhere and are stripped when the site is built. Leave notes for whoever picks
the language up after you.

## Adding a language to the site

Translating the file is the first half. The second is a one-line change in the
website's own repository, which lists the languages it ships — say in your pull
request that you would like the language enabled and someone will do it.

## Licence

MIT, the same as the rest of TrP Tools. See [LICENSE](LICENSE).
