/**
 * Polyfill for `RegExp.escape`, ensuring compatibility with environments
 * that do not yet support this method.
 *
 * @see src/types/regexp.d.ts For the TypeScript type declaration.
 */
if (!RegExp.escape) {
    RegExp.escape = function (str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
}
