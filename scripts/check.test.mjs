import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourceGaps, validate } from './check.mjs';

test('English exports cannot masquerade as complete translations', () => {
	assert.match(validate({ save: 'Save' }, { save: 'Save' }, 'strings')[0], /identical to English/);
	assert.match(validate({ save: 'Save this' }, { save: 'Save\nthis' }, 'strings')[0], /identical to English/);
	assert.deepEqual(validate({ name: 'Roblox' }, { name: 'Roblox' }, 'strings', new Set(['strings:name'])), []);
});
test('missing keys, empty text and unknown keys are refused', () => {
	const failures = validate({ one: 'One', two: 'Two' }, { one: '', stray: 'Extra' }, 'strings');
	assert.equal(failures.length, 3);
});
test('placeholder names and repeated occurrences must survive reordering', () => {
	assert.deepEqual(validate({ greeting: '{name}: {count}, {name}' }, { greeting: '{count} — {name} / {name}' }, 'strings'), []);
	assert.match(validate({ greeting: '{name} {name}' }, { greeting: '{name}' }, 'strings')[0], /placeholders differ/);
});
test('translated link labels keep their destinations', () => {
	assert.deepEqual(validate({ link: '[Open](https://trptools.com)' }, { link: '[Ouvrir](https://trptools.com)' }, 'strings'), []);
	assert.match(validate({ link: 'https://trptools.com' }, { link: 'https://example.com' }, 'strings')[0], /URLs differ/);
});
test('Discord rejects descriptions above its registration limit', () => {
	assert.match(validate({ bot_command_begin_description: 'Begin' }, { bot_command_begin_description: 'x'.repeat(101) }, 'bot')[0], /exceeds 100/);
});
test('a stale canonical source cannot erase newer app feature messages', () => {
	assert.deepEqual(sourceGaps({ common_save: 'Save' }, { $schema: 'editor', common_save: 'Save', host_title: 'Host' }), ['host_title']);
});
test('modal and poll translations must fit without hiding words', () => {
	assert.match(validate({ bot_edit_shift_note_label: 'Note' }, { bot_edit_shift_note_label: 'x'.repeat(46) }, 'bot')[0], /exceeds 45/);
	assert.match(validate({ bot_poll_loved_it: 'Loved' }, { bot_poll_loved_it: 'x'.repeat(56) }, 'bot')[0], /exceeds 55/);
});
