#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { catalogs, check, languages, readCatalog, root, sourceGaps } from './check.mjs';

// Validate every catalogue before touching either app. This uses the checkout
// directly, avoiding GitHub's raw-content cache after a translation commit.
const args = process.argv.slice(2);
const dry = args.includes('--check');
const targets = { strings: resolve(root, '../trptools-frontend'), bot: resolve(root, '../trptools-bot') };
for (let i = 0; i < args.length; i++) {
	if (args[i] === '--check') continue;
	const catalog = args[i] === '--frontend' ? 'strings' : args[i] === '--bot' ? 'bot' : undefined;
	if (!catalog || !args[i + 1] || args[i + 1].startsWith('--')) {
		throw new Error('Usage: node scripts/sync.mjs [--check] [--frontend PATH] [--bot PATH]');
	}
	targets[catalog] = resolve(args[++i]);
}
const errors = check();
if (errors.length) throw new Error(`Refusing to sync incomplete or invalid translations:\n${errors.slice(0, 20).join('\n')}`);
for (const catalog of catalogs) {
	if (!existsSync(resolve(targets[catalog], 'package.json'))) throw new Error(`App checkout missing: ${targets[catalog]}`);
	const currentEnglish = resolve(targets[catalog], 'messages/en.json');
	if (existsSync(currentEnglish)) {
		const source = readCatalog('en', catalog);
		const current = JSON.parse(readFileSync(currentEnglish, 'utf8'));
		const missing = sourceGaps(source, current);
		if (missing.length) throw new Error(`Canonical ${catalog} source is behind the app by ${missing.length} keys. Recover them into English JSONC and translate before syncing: ${missing.slice(0, 10).join(', ')}`);
	}
}
let different = 0;
for (const catalog of catalogs) {
	for (const locale of languages()) {
		const target = resolve(targets[catalog], 'messages', `${locale}.json`);
		const content = JSON.stringify(readCatalog(locale, catalog), null, '\t') + '\n';
		if (existsSync(target) && readFileSync(target, 'utf8') === content) continue;
		different++;
		if (dry) { console.error(`Out of date: ${target}`); continue; }
		mkdirSync(resolve(targets[catalog], 'messages'), { recursive: true });
		writeFileSync(`${target}.tmp`, content);
		renameSync(`${target}.tmp`, target);
		console.log(`Synced ${catalog}/${locale}`);
	}
}
if (dry && different) process.exitCode = 1;
else console.log(dry ? 'Both apps match the canonical catalogs.' : `Synced ${different} catalogs. Commit and release both apps to ship them.`);
