#include "tree_sitter/parser.h"

// An explicit EOF token lets every line require a terminator while accepting
// files without a final newline. No scanner state is needed.
void *tree_sitter_specdd_external_scanner_create(void) { return NULL; }
void tree_sitter_specdd_external_scanner_destroy(void *payload) { (void)payload; }
unsigned tree_sitter_specdd_external_scanner_serialize(void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}
void tree_sitter_specdd_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}
bool tree_sitter_specdd_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;
  if (valid_symbols[0] && lexer->eof(lexer)) {
    lexer->result_symbol = 0;
    return true;
  }
  return false;
}
