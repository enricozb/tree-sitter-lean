const PREC = {
  apply: -1,
  parenthesized_expression: 1,
  compare: -1,

  equal: -1,
}

module.exports = grammar({
  name: 'lean',

  extras: $ => [
    $.comment,
    /\s/,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._command),

    _command: $ => choice(
      $.hash_command,
      $.open,
      $.namespace,
      $.section,
      $.example,
      $.def,
      $.inductive_type,
      $.instance,
      $.theorem,
    ),

    open: $ => seq('open', $.identifier),

    hash_command: $ => seq(
      choice('#check', '#eval', '#reduce'),
      $._expression,
    ),

    inductive_type: $ => seq(
      'inductive',
      field('name', $.identifier),
      'where',
      field('constructors', repeat1($.constructor)),
    ),

    instance: $ => seq(
      'instance',
      optional(field('name', $.identifier)),
      ':',
      field('class', $._expression),
      'where',
      field('fields', repeat1($.instance_fields)),
    ),

    instance_fields: $ => seq(
      field('name', $.identifier),
      field('parameters', $.parameter_list),
      ':',
      field('return_type', $._expression),
      ':=',
      field('implementation', $._expression),
    ),

    constructor: $ => seq(
      '|', $.identifier, ':', $.identifier,
    ),

    namespace: $ => seq(
      'namespace',
      field('name', $.identifier),
      repeat($._command),
      'end',
      $.identifier,
    ),

    section: $ => seq(
      'section',
      field('name', $.identifier),
      repeat($._command),
      'end',
      $.identifier,
    ),

    parameter_list: $ => seq(
      repeat1(
        choice($.identifier, $.annotated)
      ),
    ),

    annotated: $ => seq(
      '(',
      $.identifier,
      ':',
      $._type_annotation,
      ')',
    ),

    _type_annotation: $ => choice(
      $._expression,
      $.function_annotation,
    ),

    function_annotation: $ => seq(
      $._expression, '→', $._expression,
    ),

    def: $ => seq(
      'def',
      field('name', $.identifier),
      field('parameters', optional($.parameter_list)),
      ':=',
      $._expression,
    ),

    theorem: $ => seq(
      'theorem',
      field('name', $.identifier),
      field('parameters', optional($.parameter_list)),
      ':',
      $._expression,
      ':=',
      $.identifier,
    ),

    example: $ => seq(
      'example',
      ':',
      $._expression,
      ':=',
      $._expression,
    ),

    _expression: $ => choice(
      $.identifier,
      $._parenthesized_expression,
      $.comparison,
      $.conditional,
      $.element_of,
      $.apply,
      $.lambda,
      $.binary_expression,
      $.number,
      $.string,
    ),

    _parenthesized_expression: $ => prec(PREC.parenthesized_expression, seq(
      '(',
      $._expression,
      ')'
    )),

    conditional: $ => seq(
      'if',
      $._expression,
      'then',
      $._expression,
      'else',
      $._expression,
    ),

    lambda: $ => seq(
      'fun', $.parameter_list, '=>', $._expression,
    ),

    apply: $ => prec(PREC.apply, seq(
      field('name', $._expression),
      field('arguments', repeat1($._expression)),
    )),

    element_of: $ => seq(
      field('type', $.identifier),
      '.',
      field('field', $.identifier),
    ),

    binary_expression: $ => choice(
      prec.left(2, seq($._expression, '*', $._expression)),
      prec.left(1, seq($._expression, '+', $._expression)),
      prec.left(1, seq($._expression, '-', $._expression)),
      prec.left(PREC.equal, seq($._expression, '=', $._expression)),
    ),

    comparison: $ => prec.left(PREC.compare, seq(
      $._expression,
      choice(
        '<',
        '>',
      ),
      $._expression,
    )),

    string: $ => seq(
      '"',
      repeat(choice($._string_content, $.interpolation)),
      '"',
    ),

    interpolation: $ => seq(
      '{', $._expression, '}'
    ),

    // TODO: actual right string content, escape sequences, etc.
    _string_content: $ => /[^"]/,

    comment: $ => token(seq('--', /.*/)),

    identifier: $ => /[A-za-z][A-za-z0-9!]*/,

    number: $ => /\d+/
  }
});