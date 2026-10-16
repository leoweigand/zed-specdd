# SpecDD for Zed

[SpecDD](https://specdd.ai) language support for [Zed](https://zed.dev), based on
the language contract used by the [VS Code plugin](https://github.com/specdd/vscode-plugin).

This is an initial language extension. It recognises `.sdd` files and provides:

- Syntax highlighting for section headers, comments, task states and IDs,
  scenario steps, explicit paths and globs, symbol references and inline code.
- Outline entries for sections, scenarios, examples and tasks.
- Two-space indentation and the editor's toggle-comment command.
- `spec`, `scenario`, `tasks` and `task` snippets.

The Tree-sitter grammar is intended for editing and highlighting. It is not a
strict SpecDD validator. Paths and symbols are highlighted; resolving them and
opening their targets needs a language server.

## Try it in Zed

1. Clone this repository.
2. In Zed, run **zed: install dev extension** from the command palette and select
   the repository directory.
3. Open `examples/example.sdd` and the outline panel. Type `spec` in an empty
   `.sdd` file to insert a specification template.

Zed fetches the grammar from the commit pinned in `extension.toml` and compiles it
with its automatically downloaded WASI SDK. This extension needs no Rust code.
It has not yet been submitted to Zed's extension registry.

## Development

Use Node.js 22 or newer and a C compiler (`cc`, Clang or GCC):

```sh
npm ci
npm run check
```

`npm run check` regenerates the parser, runs the Tree-sitter corpus tests, and
checks parsing, highlighting, outlines and snippets. CI also checks that the
generated parser files are committed.

```sh
npm run generate
npx --no-install tree-sitter parse examples/example.sdd
npx --no-install tree-sitter query languages/specdd/highlights.scm examples/example.sdd
```

The grammar lives in `grammar.js` with a small EOF scanner in `src/scanner.c`.
Commit generated `src/parser.c`, `src/grammar.json`, `src/node-types.json` and
`src/tree_sitter/` whenever the grammar changes. Zed's configuration and queries
live in `languages/specdd/`; snippets live in `snippets/specdd.json`.

To try local grammar changes, temporarily set `[grammars.specdd].repository` to
`file:///absolute/path/to/zed-specdd` and `rev` to a local commit containing those
changes, then rebuild the dev extension. Before pushing, restore the GitHub URL
and pin `rev` to the full SHA of a committed grammar revision. The pin necessarily
points to an earlier commit in this repository; a documentation-only change does
not need a new grammar pin.

## Towards VS Code feature parity

Follow-up work includes strict diagnostics, key-value highlighting, context-aware
completions and hovers, reference resolution, document links and related-spec
navigation. Diagnostics and semantic editor features should share an
editor-independent language server, with a Rust/Wasm adapter to launch it in Zed.
VS Code-specific commands need to be mapped to Zed's supported extension APIs.

## Language reference and licence

[`reference/LANGUAGE.md`](reference/LANGUAGE.md) is an unchanged snapshot from
[`specdd/vscode-plugin` at `e73d3bb`](https://github.com/specdd/vscode-plugin/tree/e73d3bb8738d2a575723146f91bc8ad85b208135).
It is the language reference for this port.

Licensed under [Apache-2.0](LICENSE). See [NOTICE](NOTICE) for upstream attribution.
