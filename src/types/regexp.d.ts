interface RegExpConstructor {
    /**
     * @see
     * {@link https://tc39.es/proposal-regex-escaping/#sec-regexp.escape
     * | ECMAScript Stage 4 Draft}
     */
    escape?(str: string): string;
}
