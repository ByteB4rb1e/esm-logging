/**
 * Logging module
 *
 * This is a partial port of the logging package of the Python standard 
 * library.
 *
 * There is no point in porting the threading module. I thought about how I
 * would/could make the Python logging use the asyncio instead of the 
 * threading from the standard library .
 *
 * Why do we need our own logging library?
 *
 * Logging is essential for collaboration. It serves as a tool for debugging,
 * communicates operational excellence, and is generally required for
 * security conformance.
 *
 * * Integrate into third-party systems
 * * OCSF-compliant logging
 *
 * If an unhandled error occurs, there should be a (pop-up) alert on browsers,
 * in addition to a forceful flush of any logs destined to (abstract) stderr.
 */
import { NotImplementedError, KeyError, StackTrace } from '../error';

export const CRITICAL = 50;
export const FATAL = CRITICAL;
export const ERROR = 40;
export const WARNING = 30;
export const WARN = WARNING;
export const INFO = 20;
export const DEBUG = 10;
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


export type LogLevel = number;

export type ExecutionInfo = [string, Error, StackTrace];


export interface LogOptions{
    excInfo: ExecutionInfo|Error|null,
    extra: {[key: string]: any}|null,
    stackInfo: boolean,
    stackLevel: number
}

export interface LogRecordOptions {
    level: number,
    file?: string,
    lno?: number,
    msg: string,
    args?: any[],
}

export type LogRecordFactory = { (name: string, options: LogRecordOptions): LogRecord };

function getLevelNamesMapping() {
    return Object.assign({}, NAMETOLEVEL);
}

/**
 * Return the textual or numeric representation of logging level 'level'
 *
 * @param level
 */
function getLevelName(level: number): string|number {
    var result: string|number = LEVELTONAME[level];
    if (result !== undefined) { return result; }
    result = NAMETOLEVEL[level];
    if (result !== undefined) { return result; }
    return `Level ${level}`;
}

/**
 * Associate 'levelName' with 'level'
 *
 * @param level
 * @param levelName
 */
function addLevelName(level: number, levelName: string) {
    LEVELTONAME[level] = levelName;
    NAMETOLEVEL[level] = level;
}

/**
 * LogRecord instances are created every time something is logged. They contain
 * all the information pertinent to  the event being logged. The main
 * information parssed in is msg and args, which are combined using str(msg) %
 * args to create the message field of the record. The record also includes
 * information such as when the record was created, the source line where the
 * logging call was made, and any exception information to be logged.
 */
export class LogRecord {
    constructor(scope: string, options: LogRecordOptions) {

    }
}

var logRecordFactory = (scope: string, options: LogRecordOptions) => {
    return new LogRecord(scope, options)
};

/**
 * Filter instances are used to perform arbitrary filtering of LogRecords.
 *
 * Loggers and Handlers can optionally use Filter instances to filter records as
 * desired. The base filter class only allows events which are below a certain
 * point in the logger hierarchy. For example, a filter initialized with "A.B"
 * will allow events logged by loggers "A.B", initialized with the empty string,
 * all events are passed.
 */
export class Filter {
    public readonly scope: string;
    public readonly slen: number;

    /**
     * Initialize with the name of the logger which ,together with its children,
     * will have its events allowed through the filter. If no name is specified,
     * allow every event.
     *
     * @param name - name of logging scope
     */
    constructor(scope: string) {
        this.scope = scope ?? '';
        this.slen = this.scope.length;
    }

    /**
     * Inspect a record, if it should be logged.
     *
     * Returns true if the record should be logged, or false otherwise. If
     * deemed appropriate, the record may be modified in-place.
     *
     * @param - scope of log record to inspect
     * @param - log record to inspect
     */
    filter(scope: string, record: LogRecord): boolean {
        if (this.slen == 0 || this.scope == scope) { return true }
        else if (!scope.substring(0, this.slen)) { return false }
        return (scope[this.slen] == '.')
    }
}

export type FilterCallable = (scope: string, record: LogRecord) => boolean;

export class Filterer {
    filters: Filter[] = [];

    /**
     * Add the specified filter to this handler.
     *
     * @param filter
     */
    addFilter(filter: Filter) {
        if (!this.filters.includes(filter)) { this.filters.push(filter) }
    }

    /**
     * Remove the specified filter from this handler.
     *
     * @param filter
     */
    removeFilter(filter: Filter) {
        if (this.filters.includes(filter)) {
            this.filters.splice(this.filters.indexOf(filter), 1)
        }
    }

    /**
     * Determine if a record is loggable by consulting all the filters.
     *
     * The default is to allow the record to be logged; any filter can veto this
     * by returning a false value.
     * If a filter attached to a handler returns a log record instance, then
     * that instance is used in place of the original log record in any further
     * processing of the event by that handler.
     * If a filter returns any other true value, the original log record is used
     * in any further processing of the event by that handler.
     *
     * If none of the filters return false values, this method returns a log
     * record.
     *
     * If any of the filters return a false value, this method returns a false
     * value.
     *
     * @param filter
     */
    filter(scope: string, record: LogRecord): boolean {
        var result: null|LogRecord = null;

        for (var i = 0; i < this.filters.length; i += 1) {
            let filter = this.filters[i];

            if (typeof (filter as Filter).filter == 'function') {
                result = (filter as Filter).filter(scope, record)
            }
            else {
                result = (filter as unknown as FilterCallable)(scope, record)
            }

            if (!result) { return false }
        }

        return true
    }
}

function checkLevel(level: number|string): number {
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

/**
 * Define which class use when instantiating log records.
 *
 * @param factory - A callable which will be called to instantiate a log record.
 *                  Pass a clojure, if your factory is a class already.
 */
export function setLogRecordFactory(factory: LogRecordFactory) {
    logRecordFactory = factory
}

export function getLogRecordFactory(): LogRecordFactory {
    return logRecordFactory
}

const DEFAULTLOGOPTIONS: LogOptions = {
    excInfo: null,
    extra: null,
    stackInfo: false,
    stackLevel: 1
}

export type LoggerClass = { new(): Logger };


/**
 * Instances of the logger class represent a single logging channel. A 'logging
 * channel' indicates an area of an application. Exactly how an 'area' is
 * defined is up to the application developer. Since an application can have any
 * number of areas, logging channels are identified by a unique string.
 * Application areas can be nested (e.g. an area of input process might include
 * sub-areas "read CSV file", "read XLS files" and "read Gnumeric files"). To
 * cater for this natural nesting, channel ames are organized into a namespace
 * hierarchy where levels are separated by periods, much like the Java or Python
 * package namespace. So in the instance given above, channel names might be
 * "input" for the upper level, and "input.csv", "input.xls" and "input.gnu" for
 * the sub-levels.
 * There is no arbitrary limit to the depth of nesting.
 */
export class Logger extends Filterer {
    public readonly scope: string;
    public _level: number;
    public readonly manager: Manager|null = null;
    public readonly parent_: Logger|null = null;
    public readonly propagate: boolean = true;
    public readonly handlers: any[] = [];
    public readonly disabled: boolean = false;
    private cache: {[key: number]: boolean} = {};

    constructor(scope: string, level: LogLevel, manager?: Manager) {
        super();

        this.scope = scope;

        this._level = checkLevel(level ?? NOTSET);

        this.manager = manager ?? null;
    }

    public get level() { return this._level }

    public set level(level: LogLevel) { this._level = checkLevel(level) }

    public setLevel(level: LogLevel) {
        this.level = checkLevel(level);

        //this.manager.clearCache()
    }

    /**
     * Get the effective level for this logger.
     *
     * Loop through this logger and its parents in the logger hierarchy, looking
     * for a non-zero logging level. Return the first one found.
     */
    public getEffectiveLevel() {
        var logger: Logger|null = this;

        while (logger) {
            if (logger.level) { return logger.level }
            logger = logger.parent_
        }

        return NOTSET;
    }

    /**
     * Is this logger enabled for level 'level'?
     */
    public isEnabledFor(level: LogLevel): boolean {
        if (this.disabled) { return false }

        if (this.cache[level] === undefined && this.manager && this.manager.disable < level) {
            return this.cache[level] = (
                level >= this.getEffectiveLevel()
            );
        }

        return this.cache[level] = false;
    }

    /**
     * Log 'msg % args' with severity 'DEBUG'
     *
     * To pass exception information, use the keyword argument exc_info with
     * a true value, e.g.
     *
     * ```
     * logger.debug("Houston, we have a thorny problem", { exc_info: true })
     * ```
     */
    public debug(msg: string, options?: LogOptions) {
        if (this.isEnabledFor(DEBUG)) { this.log(DEBUG, msg, options) }
    }

    /**
     * A factory method which can be overriden in subclasses to create
     * specialized LogRecords.
     *
     * 
     */
    protected makeRecord(
        name: string,
        level: LogLevel,
        msg: string,
        options: LogOptions,
    ): LogRecord {

        var recordOptions: LogRecordOptions = {
            level: level,
            msg: msg,
        };

        var rv = logRecordFactory(name, recordOptions);

        if (options.extra !== null) {
            Object.entries(options.extra!).forEach((item) => {

                var [k, v] = item;

                if (['message', 'asctime'].includes(k as string) ||
                    (rv as {[key: string]: any}).keys().includes(k as string)) {
                    throw new KeyError('attempt to overwrite ${k} in LogRecord')
                }

                (rv as any)[k] = options.extra![k as string] as any
            })
        }

        return rv
    }

    /**
     * Low-level logging routine which creates a LogRecord and then calls the
     * handlers of this logger to handle the record.
     */
    protected log(level: LogLevel, msg: string, options?: LogOptions) {
        options = options ?? DEFAULTLOGOPTIONS;
        options = { ...DEFAULTLOGOPTIONS, ...options };

        var sinfo=null;

        if (options!.excInfo !== null) {
            if (options!.excInfo instanceof Error) {
                var excInfo: ExecutionInfo = [
                    typeof options!.excInfo,
                    options!.excInfo,
                    options!.excInfo.stack!
                ]
            }
            else if (!(options!.excInfo instanceof Array)) {
                throw new NotImplementedError("would try to get the callee stack from the system. Probably will use stacktrace.js as this needs to be implemented browser-specific.");
            }
        }

        var record = this.makeRecord(this.scope, level, msg, options)
    }

    public clear() {
        for (var property in this.cache) delete this.cache[property];
    }
}

/**
 * A root logger is not that different to any other logger, except that it must
 * have a logging level and there is only one instance of in a manager's
 * hierarchy.
 */
class RootLogger extends Logger {

    constructor(level: LogLevel, manager?: Manager) {
        super('root', level, manager);
    }
}

var loggerClass = Logger;

/**
 * Placeholder instance
 */
export class Placeholder {
    protected loggers: Logger[] = [];

    /**
     * initialize with the specified logger being a child of this placeholder.
     */
    constructor(logger: Logger) {
        this.push(logger);
    }

    /**
     * add the specified logger as a child of this placeholder
     */
    public push(logger: Logger) {
        if (!this.loggers.includes(logger)) { this.loggers.push(logger) }
    }
}

/**
 * There is [under normal circumstances] just one Manager intance, which holds
 * the hierarchy of loggers.
 */
export class Manager {
    public readonly rootLogger: RootLogger;
    protected _disable: number = 0;
    protected emittedNoHandlerWarning: boolean = false;
    protected loggers: {[key: string]: Logger} = {};
    protected _loggerClass: LoggerClass|null = null;
    protected _logRecordFactory: LogRecordFactory|null = null;

    public get disable(): number { return this._disable }

    public set disable(level: LogLevel) { this._disable = checkLevel(level) }

    /**
     * Initialize the manager with the root node of the logger hierarchy
     */
    constructor(logger: RootLogger) {
        this.rootLogger = logger;
    }

    /**
     * Get a logger with the specified name (scope name), creating it, if it
     * does not yet exist. This name is a dot-separated hierarchical name, such
     * as "a", "a.b", "a.b.c" or similar.
     *
     * If a PlaceHolder existed for the specified name [i.e. the logger didn't
     * exist but a child of it did], replace it with the created logger and fix
     * up the parent/child references which pointed to the placeholder to now
     * point to the logger.
     */
    getLogger(scope: string) {
        var rv: null|Logger = null;

        if (typeof scope != 'string') {

            rv = this.loggers[scope];

            if (rv instanceof Placeholder) {
                var ph = rv
                rv = new (this._loggerClass ?? loggerClass)(scope, NOTSET, this)

            }
            else {
                rv = new (this._loggerClass ?? loggerClass)(scope, NOTSET, this)
                this.loggers[scope] = rv
            }
        }
    }

    /**
     * Set the class to be used when instantiating a logger with this Manager.
     */
    set loggerClass(class_: LoggerClass) {
        if (class_ !== Logger) {
            if (!(class_.prototype instanceof Logger)) {
                throw new TypeError("logger not derived from logging.Logger: ")
            }
        }

        this._loggerClass = class_;
    }

    /**
     * Set the factory to be used when instantiating a log record with this
     * Manager.
     */
    set logRecordFactory(factory: LogRecordFactory) {
        this._logRecordFactory = factory;
    }

    /**
     * clear the cache for all loggers in loggerDict
     */
    public clear() {
        Object.values(this.loggers).forEach((logger) => {
            logger.clear()
        });
    }
}
