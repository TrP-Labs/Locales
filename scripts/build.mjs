#!/usr/bin/env node
/**
 * Generates the plain-JSON sources Crowdin reads, from the JSONC sources
 * people write.
 *
 * The `.jsonc` files are the authored ones: their comments are how a
 * translator is told what a group of strings is for and what its placeholders
 * carry. Crowdin's JSON parser reads strict JSON, so the comments come off
 * here. Generated rather than hand-maintained, so the two cannot drift — CI
 * regenerates and fails if the result differs from what was committed.
 *
 * `$schema` is dropped as well. It is a hint to editors, not a string anybody
 * should be asked to translate, and Crowdin would offer it as one.
 *
 * **Every `.jsonc` in a language directory is built**, rather than one file
 * with a known name. `strings.jsonc` is the website and `bot.jsonc` is the
 * Discord bot — separate catalogues because they are separate products with
 * separate releases, and because somebody translating the bot is reading
 * Discord messages rather than web pages. A third one needs a file here and a
 * `files:` entry in crowdin.yml, and nothing else.
 *
 * Usage: node scripts/build.mjs [--check]
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { stripComments } from './jsonc-to-json.mjs';

const CHECK = process.argv.includes('--check');
const ROOT = 'locales';

let failed = false;

/** Builds one authored catalogue into the strict JSON beside it. */
function build(source, target) {
	let messages;
	try {
		messages = JSON.parse(stripComments(readFileSync(source, 'utf8')));
	} catch (error) {
		console.error(`${source}: not valid JSONC — ${error.message}`);
		failed = true;
		return;
	}

	delete messages.$schema;

	const json = JSON.stringify(messages, null, '\t') + '\n';
	const count = Object.keys(messages).length;

	if (!CHECK) {
		writeFileSync(target, json);
		console.log(`Wrote ${target} (${count} strings).`);
		return;
	}

	const current = existsSync(target) ? readFileSync(target, 'utf8') : '';

	if (current !== json) {
		console.error(`${target} is out of date — run \`node scripts/build.mjs\` and commit.`);
		failed = true;
	} else {
		console.log(`${target} is up to date (${count} strings).`);
	}
}

for (const locale of readdirSync(ROOT).sort()) {
	const directory = join(ROOT, locale);
	if (!statSync(directory).isDirectory()) continue;

	for (const name of readdirSync(directory).sort()) {
		if (!name.endsWith('.jsonc')) continue;
		build(join(directory, name), join(directory, `${name.slice(0, -'.jsonc'.length)}.json`));
	}
}

process.exit(failed ? 1 : 0);
