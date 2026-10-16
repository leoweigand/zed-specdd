// A forgiving editor grammar. Strict semantic validation belongs in a language server.
const SECTIONS = [
  'Spec', 'Platform', 'Purpose', 'Structure', 'Owns', 'Can modify', 'Can read',
  'References', 'Must', 'Must not', 'Forbids', 'Depends on', 'Exposes', 'Accepts',
  'Returns', 'Raises', 'Handles', 'Done when', 'Scenario', 'Example',
];

module.exports = grammar({
  name: 'specdd',
  extras: $ => [],
  externals: $ => [$._eof],

  rules: {
    source_file: $ => repeat(choice($.section, $.tasks_section, $.comment, $._blank_line)),

    section: $ => prec.right(seq($.section_header, repeat($._body))),
    tasks_section: $ => prec.right(seq($.tasks_header, repeat(choice($.task, $._body)))),

    section_header: $ => seq(
      field('name', $.section_name), ':',
      optional(seq($._space, field('title', $.section_title))), $._end_of_line,
    ),
    tasks_header: $ => seq('Tasks', ':', optional($._space), $._end_of_line),
    section_name: $ => choice(...SECTIONS),
    section_title: $ => /[^\r\n]+/,

    _body: $ => choice($.body_entry, $.continuation, $.comment, $._blank_line),
    body_entry: $ => seq('  ', optional(choice($.scenario_step, $._content)), $._end_of_line),
    continuation: $ => seq(token(/ {4,}/), optional($._content), $._end_of_line),
    scenario_step: $ => prec(1, seq($.step_keyword, optional(seq($._space, $._content)))),
    step_keyword: $ => choice('Given', 'When', 'Then', 'And', 'But'),

    task: $ => prec(2, seq(
      '  ', field('state', $.task_marker),
      optional(seq($._space, optional(seq($.task_id, $._space)), field('text', $._content))),
      $._end_of_line,
    )),
    task_marker: $ => choice('[ ]', '[x]', '[X]', '[-]', '[!]', '[?]'),
    task_id: $ => token(prec(2, /#[0-9]+/)),

    _content: $ => seq($._inline, repeat(choice($._space, $._inline))),
    _inline: $ => choice($.inline_code, $.path, $.symbol_reference, $.text, $._opening_punctuation),
    inline_code: $ => token(prec(3, /`[^`\r\n]*`/)),
    path: $ => token(prec(2, /(?:\.\/|\.\.\/|\/)(?:[A-Za-z0-9_*?.,{}\[\]\/\-]*[A-Za-z0-9_*?{}\[\]\/\-])?/)),
    symbol_reference: $ => token(prec(2, /@[_A-Za-z](?:[_A-Za-z0-9.:#\\/?!]*[_A-Za-z0-9#\\/?!])?/)),
    text: $ => choice(/[^ \t\r\n`(\[{<"']+/, '`'),
    _opening_punctuation: $ => choice('(', '[', '{', '<', '"', "'"),

    comment: $ => seq(token(/[ \t]*#[^\r\n]*/), $._end_of_line),
    _blank_line: $ => choice(/[ \t]*(?:\r\n|\n|\r)/, seq($._space, $._eof)),
    _space: $ => /[ \t]+/,
    _newline: $ => /\r\n|\n|\r/,
    _end_of_line: $ => choice($._newline, $._eof),
  },
});
