/*---------------------------------------------------------------------------
   Level related stuff
  ---------------------------------------------------------------------------

  Default levels and level names, these can be replaced with any positive set
  of values having corresponding names. There is a pseudo-level, NOTSET, which
  is only really there as a lower limit for user-defined levels. Handlers and
  loggers are initialized with NOTSET so that they will log all messages, even
  at user-defined levels.
*/

export type LogLevel = number;

/**
 * An indication that something unexpected happened, or that a problem might
 * occur in the near future (e.g. ‘disk space low’). The software is still
 * working as expected.
 */
export const CRITICAL = 50;
export const FATAL = CRITICAL;

/**
 * Due to a more serious problem, the software has not been able to perform some
 * function.
 */
export const ERROR = 40;

/**
 * An indication that something unexpected happened, or that a problem might
 * occur in the near future (e.g. ‘disk space low’). The software is still
 * working as expected.
 */
export const WARNING = 30;
export const WARN = WARNING;

/**
 * Confirmation that things are working as expected.
 */
export const INFO = 20;

/**
 * Detailed information, typically only of interest to a developer trying to
 * diagnose a problem.
 */
export const DEBUG = 10;

/**
 * When set on a logger, indicates that ancestor loggers are to be consulted to
 * determine the effective level. If that still resolves to NOTSET, then all
 * events are logged. When set on a handler, all events are handled.
 */
export const NOTSET = 0;

const LEVELTONAME: {[key: number]: string} = {
    [CRITICAL]: 'CRITICAL',
    [ERROR]: 'ERROR',
    [WARNING]: 'WARNING',
    [INFO]: 'INFO',
    [DEBUG]: 'DEBUG',
    [NOTSET]: 'NOTSET'
}

const NAMETOLEVEL: {[key: string]: number} = {
    CRITICAL: CRITICAL,
    ERROR: ERROR,
    WARNING: WARNING,
    INFO: INFO,
    DEBUG: DEBUG,
    NOTSET: NOTSET,
}

function getLevelNamesMapping() {
    return Object.assign({}, NAMETOLEVEL);
}

/**
 * Return the textual or numeric representation of logging level 'level'
 *
 * @param level
 */
export function getLevelName(level: string|number): string|number {
    var result: string|number = LEVELTONAME[level as number];
    if (result !== undefined) { return result }
    result = NAMETOLEVEL[level as string];
    if (result !== undefined) { return result }
    return `Level ${level}`;
}

/**
 * Associate 'levelName' with 'level'
 *
 * @param level
 * @param levelName
 */
export function addLevelName(level: number, levelName: string) {
    LEVELTONAME[level] = levelName;
    NAMETOLEVEL[levelName] = level;
}

export function checkLevel(level: number|string): number {
    var rv: number;

    if (typeof level == 'number') { rv = level }

    else if (typeof level == 'string') {
        if (!Object.keys(NAMETOLEVEL).includes(level as string)) {
            throw new Error(`Unknown level: ${level}`)
        }

        rv = NAMETOLEVEL[level]
    }

    else {
        throw new Error(`Level not a number or valid string: ${level}`)
    }

    return rv
}
