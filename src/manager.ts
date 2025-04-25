import { 
    Logger,
    LoggerClass,
    RootLogger,
    ROOT,
} from './logger';
import { LogRecordFactory } from './log-record';
import {
    LogLevel,
    NOTSET,
    checkLevel,
} from './log-level'


//---------------------------------------------------------------------------
// Manager classes and functions
//---------------------------------------------------------------------------

var loggerClass = Logger;

/**
 * Placeholder instance
 */
class Placeholder {
    protected loggers: Logger[] = [];

    /**
     * initialize with the specified logger being a child of this placeholder.
     */
    constructor(logger: Logger) { this.push(logger) }

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
    public readonly root: RootLogger;
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
    constructor(root: RootLogger) {
        this.root = root;
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
                var ph = rv;
                rv = new (this._loggerClass ?? loggerClass)(scope, NOTSET);
            }
            else {
                rv = new (this._loggerClass ?? loggerClass)(scope, NOTSET);
                this.loggers[scope] = rv;
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


/**
 * log manager (singleton)
 */
export const MANAGER = new Manager(ROOT);
