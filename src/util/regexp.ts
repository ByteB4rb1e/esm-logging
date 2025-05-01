export type SubstitutionCallable = (match: RegExpExecArray|null) => string;


/**
 * Return the string obtained by replacing the leftmost non-overlapping
 * occurrences of the pattern in `input` by the `substitution`. `substitution`
 * can be either a string or a callable; if a string, backslash escapes in it
 * are processed. If it is a callable, it's passed the `RegExpExecArray` object
 * and must return a substitution string to be used.
 */
export function substitute(
    pattern: RegExp,
    input: string,
    substitution: string|SubstitutionCallable,
): string {
    return input.replace(pattern, (match, ...groups) => {
        const execArray = pattern.exec(match);

        if (typeof substitution === "function") return substitution(execArray);

        return substitution.replace(
            /\\(\d+)/g,
            (_, index) => execArray?.[Number(index)] ?? ''
        );
    });
}
