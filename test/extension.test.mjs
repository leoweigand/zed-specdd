import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const cli = resolve('node_modules/.bin/tree-sitter');
const run = (...args) => execFileSync(cli, args, { encoding: 'utf8', stdio: 'pipe' });

function withSpec(source, callback) {
  const directory = mkdtempSync(join(tmpdir(), 'zed-specdd-'));
  const file = join(directory, 'fixture.sdd');
  try {
    writeFileSync(file, source);
    return callback(file);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('all canonical sections parse and appear in the outline', () => {
  const sections = [
    'Spec: Example', 'Platform: TypeScript', 'Purpose:', 'Structure:', 'Owns:',
    'Can modify:', 'Can read:', 'References:', 'Must:', 'Must not:', 'Forbids:',
    'Depends on:', 'Exposes:', 'Accepts:', 'Returns:', 'Raises:', 'Handles:',
    'Tasks:', 'Done when:', 'Scenario: One', 'Example:', 'Scenario: Two', 'Example: Two',
  ];
  withSpec(sections.join('\n'), file => {
    const tree = run('parse', '--no-ranges', file);
    assert.doesNotMatch(tree, /ERROR|MISSING/);
    const outline = run('query', 'languages/specdd/outline.scm', file);
    assert.equal((outline.match(/capture: (?:\d+ - )?item,/g) ?? []).length, sections.length);
  });
});

test('LF, CRLF and CR work with and without a final newline', () => {
  for (const ending of ['\n', '\r\n', '\r']) {
    for (const finalNewline of ['', ending]) {
      const source = ['Spec: Lines', 'Tasks:', '  [x] #12 Done', '    More text', '  # Comment'].join(ending) + finalNewline;
      withSpec(source, file => {
        const tree = run('parse', '--no-ranges', file);
        assert.doesNotMatch(tree, /ERROR|MISSING/);
        assert.equal((tree.match(/\(task_id\)/g) ?? []).length, 1);
        assert.equal((tree.match(/\(comment\)/g) ?? []).length, 1);
        assert.equal((tree.match(/\(continuation/g) ?? []).length, 1);
      });
    }
  }
});

test('empty files and trailing blank whitespace parse', () => {
  for (const source of ['', '  ', '\t  ', 'Spec: Blank\nTasks:  \n  [ ] Work\n  ']) {
    withSpec(source, file => assert.doesNotMatch(run('parse', '--no-ranges', file), /ERROR|MISSING/));
  }
});

test('highlight queries cover task states, references, code and scenario steps', () => {
  const captures = run('query', 'languages/specdd/highlights.scm', 'examples/example.sdd');
  for (const expected of ['title', 'string', 'comment', 'keyword', 'number', 'link_uri', 'function', 'constant.builtin', 'operator']) {
    assert.match(captures, new RegExp(` - ${expected},`));
  }
  assert.equal((captures.match(/ - punctuation.list_marker,/g) ?? []).length, 6);
});

test('comments and embedded or escaped @ text do not become references', () => {
  const source = 'Spec: Boundaries\nMust:\n  email@example.com \\@literal (@Real).\n  Andorra\n  # @Comment\n    Given continuation\n';
  withSpec(source, file => {
    const tree = run('parse', '--no-ranges', file);
    assert.equal((tree.match(/\(symbol_reference\)/g) ?? []).length, 1);
    assert.doesNotMatch(tree, /scenario_step/);
    const captures = run('query', 'languages/specdd/highlights.scm', file);
    assert.match(captures, /text: `@Real`/);
  });
});

test('unbalanced backticks and fence markers remain editable prose', () => {
  withSpec('Spec: Code\nMust:\n  An unmatched `backtick\n  ```\n  A `balanced` span\n', file => {
    assert.doesNotMatch(run('parse', '--no-ranges', file), /ERROR|MISSING/);
  });
});

test('the example specification and all snippets parse', () => {
  assert.doesNotMatch(run('parse', 'examples/example.sdd'), /ERROR|MISSING/);
  const snippets = JSON.parse(readFileSync('snippets/specdd.json', 'utf8'));
  for (const [name, snippet] of Object.entries(snippets)) {
    let body = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body;
    body = body.replace(/\$\{\d+:([^}]*)\}/g, '$1').replace(/\$\d+/g, '');
    if (name === 'SpecDD task') body = `Tasks:\n  ${body}`;
    if (!body.startsWith('Spec:')) body = `Spec: Snippet\n${body}`;
    withSpec(body, file => assert.doesNotMatch(run('parse', '--no-ranges', file), /ERROR|MISSING/, name));
  }
});
