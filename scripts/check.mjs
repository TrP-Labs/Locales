#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const catalogs = ['strings', 'bot'];
export const languages = () => readdirSync(resolve(root, 'locales'), { withFileTypes: true })
	.filter((entry) => entry.isDirectory() && /^[a-z]{2}(?:-[A-Za-z0-9]{2,8})?$/.test(entry.name))
	.map((entry) => entry.name).sort();
export const readCatalog = (locale, catalog) => JSON.parse(readFileSync(resolve(root, 'locales', locale, `${catalog}.json`), 'utf8'));
const placeholders = (text) => [...text.matchAll(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g)].map(([value]) => value).sort().join(',');
const urls = (text) => [...text.matchAll(/https?:\/\/[^\s<>`"\)]+/g)].map(([value]) => value).sort().join(',');
const normalize = (text) => text.replace(/\s+/g, ' ').trim();
export const sourceGaps = (source, appSource) => Object.keys(appSource)
	.filter((key) => key !== '$schema' && !(key in source));

// Language-independent checks: English word lists incorrectly reject words
// shared by French, German, Czech and Polish. Identical text requires a
// translator's explicit exception instead of silently counting as finished.
export function validate(source, target, catalog, exceptions = new Set()) {
	const errors = [];
	for (const key of Object.keys(target)) {
		if (!(key in source)) errors.push(`${key}: unknown key`);
	}
	for (const [key, english] of Object.entries(source)) {
		const translated = target[key];
		if (typeof english !== 'string' || !english.trim()) {
			errors.push(`${key}: source must be a nonempty string`);
			continue;
		}
		if (typeof translated !== 'string' || !translated.trim()) {
			errors.push(`${key}: missing or empty translation`);
			continue;
		}
		if (placeholders(english) !== placeholders(translated)) errors.push(`${key}: placeholders differ`);
		if (urls(english) !== urls(translated)) errors.push(`${key}: URLs differ`);
		if (normalize(translated) === normalize(english) && !exceptions.has(`${catalog}:${key}`)) {
			errors.push(`${key}: identical to English; translate or explicitly record a legitimate exception`);
		}
		// Discord refuses overlong descriptions during command registration.
		if (catalog === 'bot' && /^bot_(?:command|option)_.*_description$/.test(key) && translated.length > 100) {
			errors.push(`${key}: Discord description exceeds 100 characters (${translated.length})`);
		}
		if (catalog === 'bot' && /^bot_edit_shift_.*_label$/.test(key) && translated.length > 45) {
			errors.push(`${key}: Discord modal label exceeds 45 characters (${translated.length})`);
		}
		if (catalog === 'bot' && /^bot_poll_/.test(key) && key !== 'bot_poll_question' && translated.length > 55) {
			errors.push(`${key}: Discord poll answer exceeds 55 characters (${translated.length})`);
		}
	}
	return errors;
}

export function check(selected = languages()) {
	const errors = [];
	for (const locale of selected) {
		if (locale === 'en') continue;
		const path = resolve(root, 'locales', locale, '.same-as-english');
		const exceptions = new Set(existsSync(path) ? readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean) : []);
		for (const catalog of catalogs) {
			try {
				const source = readCatalog('en', catalog);
				const failures = validate(source, readCatalog(locale, catalog), catalog, exceptions);
				errors.push(...failures.map((failure) => `${locale}/${catalog}: ${failure}`));
				console.log(`${locale}/${catalog}: ${Object.keys(source).length} source strings; ${failures.length} problems`);
			} catch (error) { errors.push(`${locale}/${catalog}: ${error.message}`); }
		}
	}
	return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	const selected = process.argv.slice(2);
	const unknown = selected.filter((locale) => !languages().includes(locale));
	const errors = unknown.length ? unknown.map((locale) => `Unknown locale: ${locale}`) : check(selected.length ? selected : undefined);
	for (const error of errors.slice(0, 40)) console.error(error);
	if (errors.length > 40) console.error(`… ${errors.length - 40} further problems`);
	process.exitCode = errors.length ? 1 : 0;
}
