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
 * Usage: node scripts/build.mjs [--check]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { stripComments } from './jsonc-to-json.mjs';

const CHECK = process.argv.includes('--check');
const ROOT = 'locales';

let failed = false;

for (const locale of readdirSync(ROOT).sort()) {
	const source = join(ROOT, locale, 'strings.jsonc');
	if (!existsSync(source)) continue;

	const target = join(ROOT, locale, 'strings.json');

	let messages;
	try {
		messages = JSON.parse(stripComments(readFileSync(source, 'utf8')));
	} catch (error) {
		console.error(`${source}: not valid JSONC — ${error.message}`);
		failed = true;
		continue;
	}

	delete messages.$schema;

	const json = JSON.stringify(messages, null, '\t') + '\n';

	if (CHECK) {
		const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
		if (current !== json) {
			console.error(`${target} is out of date — run \`node scripts/build.mjs\` and commit.`);
			failed = true;
		} else {
			console.log(`${target} is up to date (${Object.keys(messages).length} strings).`);
		}
		continue;
	}

	writeFileSync(target, json);
	console.log(`Wrote ${target} (${Object.keys(messages).length} strings).`);
}

process.exit(failed ? 1 : 0);
