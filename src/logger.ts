/**
 * This module defines functions and classes which implement a flexible event
 * logging system for applications and libraries.
 * 
 * The key benefit of having the logging API provided by a standard library
 * module is that all Python modules can participate in logging, so your
 * application log can include your own messages integrated with messages from
 * third-party modules.
 * 
 * Here’s a simple example of idiomatic usage:
 *
 * ```javascript
 * // myapp.ts
 * import * as logging from 'eslib/logging';
 * import * as mylib from './mylib';
 * const logger = logging.getLogger(__name__);
 * 
 * function main() {
 *     logging.basicConfig({filename: 'myapp.log', level: logging.INFO});
 *     logger.info('Started');
 *     mylib.doSomething();
 *     logger.info('Finished');
 * }
 * 
 * main();
 * ```
 *
 * ```javascript
 * // mylib.ts
 * import * as logging from 'eslib/logging';
 * const logger = logging.getLogger(__name__);
 * 
 * function do_something() {
 *     logger.info('Doing something')
 * }
 * ```
 *
 * If you run `myapp.ts`, you should see this in myapp.log:
 *
 * ```
 * INFO:__main__:Started
 * INFO:mylib:Doing something
 * INFO:__main__:Finished
 * ```
 *
 * The key feature of this idiomatic usage is that the majority of code is
 * simply creating a module level logger with `getLogger(__name__)`, and using
 * that logger to do any needed logging. This is concise, while allowing
 * downstream code fine-grained control if needed. Logged messages to the
 * module-level logger get forwarded to handlers of loggers in higher-level
 * modules, all the way up to the highest-level logger known as the root logger;
 * this approach is known as hierarchical logging.
 *
 * For logging to be useful, it needs to be configured: setting the levels and
 * destinations for each logger, potentially changing how specific modules log,
 * often based on command-line arguments or application configuration. In most
 * cases, like the one above, only the root logger needs to be so configured,
 * since all the lower level loggers at module level eventually forward their
 * messages to its handlers. basicConfig() provides a quick way to configure the
 * root logger that handles many use cases.
 *
 * The module provides a lot of functionality and flexibility. If you are
 * unfamiliar with logging, the best way to get to grips with it is to view the
 * tutorials (see the links above and on the right).
 *
 * The basic classes defined by the module, together with their attributes and
 * methods, are listed in the sections below.
 *
 * * Loggers expose the interface that application code directly uses.
 * * Handlers send the log records (created by loggers) to the appropriate
 *   destination.
 * * Filters provide a finer grained facility for determining which log records
 *   to output.
 * * Formatters specify the layout of log records in the final output.
 * @module logging
 */
import { 
    KeyError,
    MyError,
    NotImplementedError,
    StackTrace,
    ValueError,
} from './helper/error';

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

/**
 * context of a logging event/trigger
 */
export interface LogOptions{
    excInfo: ExecutionInfo|Error|null,
    extra: {[key: string]: any}|null,
    stackInfo: boolean,
    stackLevel: number
}

/**
 * options for instantiating a new log record
 */
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

export type MillisecondsSinceUnixEpoch = number;

/**
 * LogRecord instances are created every time something is logged. They contain
 * all the information pertinent to  the event being logged. The main
 * information parssed in is msg and args, which are combined using str(msg) %
 * args to create the message field of the record. The record also includes
 * information such as when the record was created, the source line where the
 * logging call was made, and any exception information to be logged.
 */
export class LogRecord {
    public readonly levelno: LogLevel;
    public readonly levelname: string|LogLevel;
    public readonly scope: string;

    public readonly created: MillisecondsSinceUnixEpoch = Date.now();

    constructor(scope: string, options: LogRecordOptions) {
        this.levelno = options.level;
        this.levelname = getLevelName(options.level);
        this.scope = scope;
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
    filter(record: LogRecord): boolean {
        if (this.slen == 0 || this.scope == record.scope) { return true }
        else if (!record.scope.substring(0, this.slen)) { return false }
        return (record.scope[this.slen] == '.')
    }
}

export type FilterCallable = (record: LogRecord) => boolean;

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
    filter(record: LogRecord): LogRecord|null {

        for (var i = 0; i < this.filters.length; i += 1) {
            let result: boolean|LogRecord = false;

            let filter = this.filters[i];

            if (typeof (filter as Filter).filter == 'function') {
                result = (filter as Filter).filter(record)
            }
            else {
                result = (filter as unknown as FilterCallable)(record)
            }

            if (!result) { return null }

            if ((result as any) instanceof LogRecord) { record = result as unknown as LogRecord }
        }

        return record
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

var throwErrors: boolean = true;

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

    /**
     * Initialize the logger with a name and an optional level
     *
     * @param scope - 
     * @param level -
     * @param manager -
     */
    constructor(scope: string, level?: LogLevel, manager?: Manager) {
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
        if (this.isEnabledFor(DEBUG)) { this._log(DEBUG, msg, options) }
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
    protected _log(level: LogLevel, msg: string, options?: LogOptions) {
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

    /**
     * Call the handlers for the specified record.
     *
     * This method is used for unpickled records received from a socket, as well
     * as those created locally. Logger-level filtering is applied.
     */
    protected handle(scope: string, record: LogRecord) {
        if (this.disabled) { return }
        var maybeRecord = this.filter(record);
        if (!maybeRecord) { return }
        if ((maybeRecord as any) instanceof LogRecord) { record = maybeRecord }
        this.callHandlers(record)
    }

    /**
     * Pass a record to all relevant handlers.
     *
     * Loop through all handlers for this logger and its parents n the logger
     * hierarchy. If no handler was found, output a one-off error message to
     * sys.stderr. Stop searching up the hierarchy whenever a logger with the
     * "propagate" attribute set to zero is found - that will be the last logger
     * whose handlers are called.
     */
    protected callHandlers(record: LogRecord) {
        var c: Logger|null = this;
        var found = 0;

        while (c) {
            for (var i = 0; i < c.handlers.length; i += 1) {
                let hdlr = c.handlers[i];

                found = found + 1;

                if (record.levelno >= hdlr.level) { hdlr.handle(record) }
            }

            if (!c.propagate) { c = null }
            else { c = c.parent_ }
        }

        if (found == 0) {
            if (lastResort) {
                if (record.levelno >= lastResort.level) {
                    lastResort.handle(record)
                }
                else if (throwErrors && (this.manager && !this.manager.emittedNoHandlerWarning)) {
                    console.error(
                        `No handlers could be found for logger ${this.scope}`
                    );

                    this.manager.emittedNoHandlerWarning = true;
                }
            }
        }
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
    public emittedNoHandlerWarning: boolean = false;
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

export interface PercentFormatterStyleOptions {
    fmt?: string,
    defaults: {[key: string]: any};
}

class PercentFormatterStyle {
    public static defaultFormat = '%(message)s';
    public static asctimeFormat = '%(asctime)s';
    public static asctimeSearch = '%(asctime)';
    public static validationPattern = 
        /%\(\w+\)[#0+ -]*(\*|\d+)?(\.(\*|\d+))?[diouxefgcrsa%]/;

    private fmt: string;
    private defaults: {[key: string]: any};

    constructor(options: PercentFormatterStyleOptions) {
        this.fmt = options.fmt ?? PercentFormatterStyle.defaultFormat;
        this.defaults = options.defaults;
    }

    usesTime(): boolean {
        return  this.fmt.match(PercentFormatterStyle.asctimeFormat) ? true : false
    }

    /**
     * Validate the input format, ensure it matches the correct style
     */
    validate() {
        if (!PercentFormatterStyle.validationPattern.test(this.fmt)) {
            throw new ValueError(
                `Invalid format '${this.fmt}' for ` +
                `'${PercentFormatterStyle.defaultFormat[0]}'`
            )
        }
    }

    protected _format(record: LogRecord): string {
        var defaults = this.defaults;
        var values: {[key: string]: any}|null;
        if (defaults) { values = {...this.defaults, ...Object.entries(record)} }
        else { values = Object.entries(record) }
        //TODO: implement formatting
        return 'would do some formatting';
    }

    format(record: LogRecord): string {
        try {
            return this._format(record)
        }
        catch (e) {
            throw new ValueError(`formatting field not found in record: ${e}`)
        }
    }
}

const basicFormat = '%(level)s:%(name)s:%(message)s';

const styles: {[key: string]: [{ new(options: PercentFormatterStyleOptions): PercentFormatterStyle}, string]} = {
    '%': [PercentFormatterStyle, basicFormat],
}

export interface FormatterOptions {
    fmt?: string
    datefmt?: any
    style?: string
    validate?: boolean
    defaults?: {[key: string]: any}
}

export class Formatter {
    public static defaultTimeFormat = '%Y-%M';
    public static defaultMsecFormat = '%s,%30d';

    protected style: any;
    protected fmt: string;
    protected datefmt: any;

    /**
     * Initialize the formatter with specified format strings.
     *
     * Initialize the formatter either with the specified format string, or a
     * default as described above. Allow for specialized date formatting with
     * the optional datefmt argument. If datefmt is omitted, you get an
     * ISO8601-like (or RFC 3339-like) format.
     *
     * Use a style parameter of '%', '{' or '$' to specify that you want to
     * use one of %-formatting, :meth:`str.format` (``{}``) formatting or
     * :class:`string.Template` formatting in your format string.
     */
    constructor(options?: FormatterOptions) {
        options = options ?? {};
        var style = options.style ?? '%';
        var validate = options.validate ?? true;

        if (!Object.keys(styles).includes(style ?? '')) {
            throw new ValueError(`style must be one of: ${Object.keys(styles).join(', ')}`)
        }

        this.style = new styles[style][0]({
            fmt: options.fmt,
            defaults: options.defaults ?? {}
        });

        if (validate) { this.style.validate() }

        this.fmt = this.style.fmt;

        this.datefmt = options.datefmt;
    }

    /**
     * Return the creation time of the specified LogRecord as formatted text.
     * 
     * This method should be called from format() by a formatter which
     * wants to make use of a formatted time. This method can be overridden
     * in formatters to provide for any specific requirement, but the
     * basic behaviour is as follows: if datefmt (a string) is specified,
     * it is used with time.strftime() to format the creation time of the
     * record. Otherwise, an ISO8601-like (or RFC 3339-like) format is used.
     * The resulting string is returned. This function uses a user-configurable
     * function to convert the creation time to a tuple. By default,
     * time.localtime() is used; to change this for a particular formatter
     * instance, set the 'converter' attribute to a function with the same
     * signature as time.localtime() or time.gmtime(). To change it for all
     * formatters, for example if you want all logging times to be shown in GMT,
     * set the 'converter' attribute in the Formatter class.
     */
    formatTime(record: LogRecord, datefmt?: any): string {

        //TODO: record.created
        if (datefmt) {
            //TODO: time.strftime
        }
        else {
            //TODO: time.strftime
        }

        return 'some time';
    }

    /**
     * Format and return the specified exception information as a string.

     * This default implementation just uses
     * traceback.print_exception()
     */
    formatError(ei: MyError): string {
        //TODO
        return 'some error';
    }


}

const handlers: {[key: string]: Handler} = {}; // map of handler names to
                                               // handlers
const handlerList: WeakRef<Handler>[] = []; // added to allow handlers to be removed in reverse
                        // order of initialization

function addHandlerRef(handler: Handler) {
    handlerList.push(new WeakRef(handler));
}

const defaultFormatter = new Formatter();

export class Handler extends Filterer {

    protected _scope: string|null = null;
    protected formatter: Formatter|null = null;
    protected _level: number;
    protected _closed: boolean = false;

    constructor(level: LogLevel) {
        super();
        this._level = checkLevel(level);
        // Add the handler to the global handlerList (for cleanup on shutdown)
        addHandlerRef(this);
    }

    get level(): number { return this._level }
    set level(level: LogLevel|string) { this.level = checkLevel(level) }

    get scope(): string|null { return this._scope }
    set scope(scope: string) { this._scope = scope }
    get closed(): boolean { return this._closed }

    /**
     * Format the specified record.
     * 
     * If a formatter is set, use it. Otherwise, use the default formatter for
     * the module.
     */
    format(record: LogRecord) {
        var fmt: Formatter|null = null;

        if (this.formatter) { fmt = this.formatter }
        else { fmt = defaultFormatter }
    }

    /**
     * Do whatever it takes to actually log the specified logging record.
     *
     * This version is intended to be implemented by subclasses and so raises a
     * NotImplementedError.
     */
    emit(record: LogRecord) {
        throw new NotImplementedError(
            'emit must be implemented by Handler subclass'
        )
    }

    /**
     * Conditionally emit the specfied logging record.
     *
     * Emission depends on filters which may have been added to the handler.
     * Wrap the actual emission of the record with acquisition/release of the
     * I/O thread lock.
     */
     handle(record: LogRecord) {
        var rv = this.filter(record);
        if ((rv as any) instanceof LogRecord) {
            record = rv as unknown as LogRecord
        }
        if (rv) {
            //locking here
            this.emit(record)
        }
    }

    /**
     * Tidy up any resources used by the handler
     *
     * This version removes the handler from an internal map of handlers, which
     * is used for handler lookup by scope. Subclasses should ensure that this
     * gets called from overriden close() methods.
     */
    close() {
        this._closed = true;

        if (this.scope && Object.keys(handlers).includes(this.scope)) {
            delete handlers[this.scope]
        }
    }

    /**
     * Handle errors which occur during an emit() call.
     *
     * This method should be called from handlers when an exception is
     * encountered during an emit() call. If raiseExceptions is false,
     * exceptions get silently ignored. This is what is mostly wanted
     * for a logging system - most users will not care about errors in
     * the logging system, they are more interested in application errors.
     * You could, however, replace this with a custom handler if you wish.
     * The record which was being processed is passed in to this method.
     */
    handleError(record: LogRecord) {
        throw new NotImplementedError(
            'still need to find portable way for stacktracing...'
        )
    }
}

export class StderrHandler extends Handler {
    constructor(level: LogLevel) {
        super(level);
    }
}

const defaultLastResort = new StderrHandler(WARNING);
export var lastResort = defaultLastResort;
