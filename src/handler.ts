import * as stream from 'stream';

import { LogLevel, checkLevel, NOTSET } from './log-level';
import { LogRecord } from './log-record';
import { Formatter, DEFAULT_FORMATTER } from './formatter';
import { Filterer } from './filter';
import { NotImplementedError } from './helper/error';

if (typeof window === 'undefined') {
    const stream = require('stream');
}
else {
    const stream = require('./helper/stream');
}

//---------------------------------------------------------------------------
// Handler classes and functions
//----------------------------------------------------------------------------

type Handlers = {[key: string]: Handler};

/**
 * map of handler names to handlers
 */
const HANDLERS: Handlers = {}; 

/**
 * added to allow handlers to be removed in reverse order of initialization
 */
const HANDLER_LIST: WeakRef<Handler>[] = [];

/**
 * Add a handler to the internal cleanup list using a weak reference.
 *
 * @param handler -
 */
function addHandlerRef(handler: Handler) {
    HANDLER_LIST.push(new WeakRef(handler));
}

/**
 * Get a handler with the specified *name*, or None if there isn't one with
 * that name.
 */
export function getHandlerByName(name: string): Handler|null {
    return HANDLERS[name] ?? null
}

/**
 * Return all known handler names as an immutable set
 */
export function getHandlerNames(): Handlers { return Object.freeze(HANDLERS) }

/**
 * Handler instances dispatch logging events to specific destinations.
 *
 * The base handler class. Acts as a placeholder which defines the Handler
 * interface. Handlers can optionally use Formatter instances to format
 * records as desired. By default, no formatter is specified; in this case,
 * the 'raw' message as determined by record.message is logged.
 */
export class Handler extends Filterer {

    protected _scope: string|null = null;
    protected _formatter: Formatter|null = null;
    protected _level: number;
    protected _closed: boolean = false;

    /**
     * Initializes the instance - basically setting the formatter to None
     * and the filter list to empty
     */
    constructor(level?: LogLevel) {
        super();
        this._level = checkLevel(level ?? NOTSET);
        // Add the handler to the global HANDLER_LIST (for cleanup on shutdown)
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
        else { fmt = DEFAULT_FORMATTER }
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

        if (this.scope && Object.keys(HANDLERS).includes(this.scope)) {
            delete HANDLERS[this.scope]
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

    set formatter(fmt: Formatter) { this._formatter = fmt }
}

export interface FileHandlerOptions {
    filename: string
    filemode?: string
    encoding?: string
    errors?: string
}

/**
 * A handler class which writes logging records, appropriately formatted,
   to a stream. Note that this class does not close the stream, as
   sys.stdout or sys.stderr may be used.
 */
export class StreamHandler extends Handler {
    constructor(stream?: stream.Writable) {
        super();
    }
}

export class FileHandler extends StreamHandler {
    constructor(options: FileHandlerOptions) {
        super();
    }
}

/**
 * This class is like a StreamHandler using sys.stderr, but always uses
 * whatever sys.stderr is currently set to rather than the value of
 * sys.stderr at handler construction time.
 */
 export class StderrHandler extends Handler {
    /**
     * Initialize the handler.
     */
    constructor(level: LogLevel) { super(level) }
}
