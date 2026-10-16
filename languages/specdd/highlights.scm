(section_name) @title
(tasks_header) @title
(section_title) @string
":" @punctuation.delimiter
(comment) @comment
(step_keyword) @keyword
(task_marker) @punctuation.list_marker
((task_marker) @constant.builtin
  (#match? @constant.builtin "^\\[[xX]\\]$"))
((task_marker) @operator
  (#eq? @operator "[!]"))
((task_marker) @comment
  (#eq? @comment "[-]"))
((task_marker) @keyword
  (#eq? @keyword "[?]"))
(task_id) @number
(inline_code) @string
(path) @link_uri
(symbol_reference) @function
