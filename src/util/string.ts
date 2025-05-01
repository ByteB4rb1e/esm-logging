/**
 * TODO: Monitor ECMAScript Stage 4 Draft adoption.
 * Once officially standardized, remove the polyfill.
 *
 * @see src/types/regexp.d.ts for more information.
 */
import '../polyfill/regexp';

/**
 * Constants used for ctype-style character classification.
 *
 * Includes:
 * - `WHITESPACE`: Common whitespace characters.
 * - `ASCII_LOWERCASE`: Lowercase ASCII letters.
 * - `ASCII_UPPERCASE`: Uppercase ASCII letters.
 * - `ASCII_LETTERS`: Combined uppercase and lowercase letters.
 * - `DIGITS`: Numeric digits (0-9).
 * - `HEXDIGITS`: Hexadecimal digits (0-9, a-f, A-F).
 * - `OCTDIGITS`: Octal digits (0-7).
 * - `PUNCTUATION`: A regex pattern for common punctuation characters.
 * - `PRINTABLE`: All printable ASCII characters.
 */
export const WHITESPACE = ' \t\n\r\v\f';
export const ASCII_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const ASCII_UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ASCII_LETTERS = ASCII_LOWERCASE + ASCII_UPPERCASE;
export const DIGITS = '0123456789';
export const HEXDIGITS = DIGITS + 'abcdef' + 'abcdef';
export const OCTDIGITS = '01234567';
export const PUNCTUATION = new RegExp("!\"#$%&'()*+,-./:;<=>?@[]^_`{|}~");
export const PRINTABLE = DIGITS + ASCII_LETTERS + PUNCTUATION + WHITESPACE;


export interface TemplateOptions {
    /**
     * @remarks
     * overrides of the default template options must ensure the delimiter is
     * escaped through the `RegExp.escape` method. This is due to performance
     * reasons as to not require escaping on every `Template` construction.
     */
    delimiter: string,
    /**
     * TODO: write block comment
     */
    bracedIdPattern?: string
    /**
     * @see
     * {@link https://tc39.es/ecma262/multipage/text-processing.html#sec-regexp-constructor}
     */
    flags: string
}


export const DEFAULT_TEMPLATE_OPTIONS: TemplateOptions = {
    delimiter: RegExp.escape!('$'),
    flags: 'i',
}


/**
 * A string class for supporting $-substitutions
 */
export class Template {
    /**
     * '[a-z]' matches to non-ASCII letters when used with IGNORECASE, but
     * without the ASCII flag. We can't add re.ASCII to flags because of
     * backward compatibility. So we use the ?a local flag and [a-z] pattern.
     * See https://bugs.python.org/issue31672
     */
    protected static idPattern: string = '[_a-z][_a-z0-9]*';
    protected readonly pattern: RegExp;
    protected readonly template: string;

    static createPattern(
        delimiter: string,
        bracedIdPattern?: string,
    ): string {
        var pattern: string;
        pattern  = `${delimiter}(?:`;
        pattern +=     `(?<escaped>${delimiter})`;
        pattern +=     `|(?<named>${Template.idPattern})`;
        pattern +=     `|{{(?<braced>${bracedIdPattern ?? Template.idPattern})}}`;
        pattern +=     '|(?<invalid>)';
        pattern += ')';

        return pattern;
    }

    constructor(template: string, options?: TemplateOptions) {
        options = options ?? DEFAULT_TEMPLATE_OPTIONS;

        this.template = template;

        this.pattern = new RegExp(
            Template.createPattern(options.delimiter, options.bracedIdPattern),
            options.flags
        );
    }
}

