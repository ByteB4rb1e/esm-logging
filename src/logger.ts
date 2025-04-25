import {
    LogLevel,
    DEBUG,
    NOTSET,
    WARNING,
    checkLevel,
} from './log-level';
import { 
    LogRecord,
    logRecordFactory,
    LogRecordOptions,
} from './log-record';
import { Handler, StderrHandler } from './handler';
import {
    NotImplementedError,
    KeyError,
    ValueError,
    StackTrace,
} from './helper/error';
import { Manager } from './manager';
import { Filterer } from './filter';

//---------------------------------------------------------------------------
// Logger classes and functions
//---------------------------------------------------------------------------

export type ExecutionInfo = [string, Error, StackTrace];

export var throwErrors: boolean = true;

export const DEFAULT_LAST_RESORT = new StderrHandler(WARNING);

export var lastResort = DEFAULT_LAST_RESORT;

export type LoggerClass = { new(): Logger };

/**
 * context of a logging event/trigger
 */
export interface LogOptions{
    /**
     * 
     */
    excInfo: ExecutionInfo|Error|null,
    /**
     * 
     */
    extra: {[key: string]: any}|null,
    /**
     *
     */
    stackInfo: boolean,
    /**
     *
     */
    stackLevel: number
}

const DEFAULT_LOG_OPTIONS: LogOptions = Object.freeze({
    excInfo: null,
    extra: null,
    stackInfo: false,
    stackLevel: 1
});

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
    private  _manager: Manager|null = null;
    public readonly parent: Logger|null = null;
    public readonly propagate: boolean = true;
    public readonly handlers: Handler[] = [];
    public readonly disabled: boolean = false;
    private cache: {[key: number]: boolean} = {};

    /**
     * Initialize the logger with a name and an optional level
     *
     * @param scope - 
     * @param level -
     * @param manager -
     */
    constructor(
        scope: string,
        level?: LogLevel,
    ) {
        super();

        this.scope = scope;
        this._level = checkLevel(level ?? NOTSET);
    }

    public get level() { return this._level }

    public set level(level: LogLevel) { this._level = checkLevel(level) }

    public set manager(manager: Manager) {
        if (this.manager) {
            throw new ValueError('logger can only be assigned to manager once');
        }
    }

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
            logger = logger.parent;
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
        options = options ?? DEFAULT_LOG_OPTIONS;
        options = { ...DEFAULT_LOG_OPTIONS, ...options };

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
            else { c = c.parent }
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

    /**
     * Remove the specified handler from this logger.
     */
    public addHandler(hdlr: Handler) {
        const i = this.handlers.indexOf(hdlr); 
        if (i === -1) { this.handlers.push(hdlr) }
    }

    /**
     * Remove the specified handler from this logger.
     */
    public removeHandler(hdlr: Handler) {
        const i = this.handlers.indexOf(hdlr); 
        if (i !== -1) { delete this.handlers[i] }
    }
}

/**
 * A root logger is not that different to any other logger, except that it must
 * have a logging level and there is only one instance of in a manager's
 * hierarchy.
 */
export class RootLogger extends Logger {

    constructor(level: LogLevel) {
        super('root', level);
    }
}

/**
 * root logger (singleton)
 */
export const ROOT = new RootLogger(WARNING);
