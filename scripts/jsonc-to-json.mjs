#!/usr/bin/env node
/**
 * Strips comments from a JSONC file and writes strict JSON.
 *
 * The Locales repository is authored in JSONC because comments are how a
 * translator is told what a string is for and what its placeholders carry.
 * The message-format plugin reads strict JSON, so the comments come off here,
 * during the sync — which means the build never has to understand them and a
 * note can be as long as it needs to be without shipping to anyone's browser.
 *
 * Character by character rather than by regular expression: `//` and `/*`
 * appear inside real translated strings (a URL, a date format), and a regex
 * that does not track whether it is inside a string literal silently truncates
 * the file at the first one.
 *
 * Usage: node scripts/jsonc-to-json.mjs <in.jsonc> <out.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';

export function stripComments(source) {
	let out = '';
	let i = 0;

	while (i < source.length) {
		const char = source[i];

		if (char === '"') {
			// Copy the whole string literal verbatim, escapes included, so
			// nothing inside it is ever mistaken for a comment.
			out += char;
			i++;
			while (i < source.length) {
				out += source[i];
				if (source[i] === '\\') {
					out += source[i + 1] ?? '';
					i += 2;
					continue;
				}
				if (source[i] === '"') {
					i++;
					break;
				}
				i++;
			}
			continue;
		}

		if (char === '/' && source[i + 1] === '/') {
			while (i < source.length && source[i] !== '\n') i++;
			continue;
		}

		if (char === '/' && source[i + 1] === '*') {
			i += 2;
			while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++;
			i += 2;
			continue;
		}

		out += char;
		i++;
	}

	// A trailing comma is legal in JSONC and is the likeliest thing to survive
	// a hand edit, so it is forgiven rather than made someone's problem.
	return out.replace(/,(\s*[}\]])/g, '$1');
}

// Importable as a library — the CLI below only runs when this file is the
// entry point, so `build.mjs` can reuse the stripper without it trying to read
// argv of its own.
const [input, output] = process.argv.slice(2);

if (import.meta.url !== `file://${process.argv[1]}`) {
	// Imported, not run.
} else if (!input || !output) {
	console.error('usage: jsonc-to-json.mjs <in.jsonc> <out.json>');
	process.exit(2);
} else runCli();

function runCli() {
let parsed;
try {
	parsed = JSON.parse(stripComments(readFileSync(input, 'utf8')));
} catch (error) {
	console.error(`${input}: not valid JSONC — ${error.message}`);
	process.exit(1);
}

if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
	console.error(`${input}: expected an object of messages.`);
	process.exit(1);
}

writeFileSync(output, JSON.stringify(parsed, null, '\t') + '\n');
}
