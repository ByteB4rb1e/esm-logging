import { getLevelName, LogLevel } from './log-level';
import { MillisecondsSinceUnixEpoch } from './helper/datetime';

//---------------------------------------------------------------------------
// The logging record
//---------------------------------------------------------------------------

/**
 * options for instantiating a new log record
 */
export interface LogRecordOptions {
    /**
     * The numeric level of the logging event (such as 10 for DEBUG, 20 for
     * INFO, etc). Note that this is converted to two attributes of the
     * LogRecord: levelno for the numeric value and levelname for the
     * corresponding level name.
     */
    level: number,
    file?: string,
    /**
     * The line number in the source file where the logging call was made.
     */
    lno?: number,
    /**
     * The event description message, which can be a %-format string with
     * placeholders for variable data, or an arbitrary object (see Using
     * arbitrary objects as messages).
     */
    msg: string,
    /**
     * Variable data to merge into the msg argument to obtain the event
     * description.
     */
    args?: any[],
}

export type LogRecordFactory = { (name: string, options: LogRecordOptions): LogRecord };

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

export var logRecordFactory = (scope: string, options: LogRecordOptions) => {
    return new LogRecord(scope, options)
};

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
