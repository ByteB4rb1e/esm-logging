import { MyError, ValueError } from './helper/error';
import { LogRecord } from './log-record';

//---------------------------------------------------------------------------
// Formatter classes and functions
//---------------------------------------------------------------------------

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

const BASIC_FORMAT = '%(level)s:%(name)s:%(message)s';

export const STYLES: {[key: string]: [{ new(options: PercentFormatterStyleOptions): PercentFormatterStyle}, string]} = {
    '%': [PercentFormatterStyle, BASIC_FORMAT],
}

export interface FormatterOptions {
    fmt?: string
    datefmt?: any
    style?: string
    validate?: boolean
    defaults?: {[key: string]: any}
}

/**
 * Formatter instances are used to convert a LogRecord to text.
 *
 * Formatters need to know how a LogRecord is constructed. They are
 * responsible for converting a LogRecord to (usually) a string which can
 * be interpreted by either a human or an external system. The base Formatter
 * allows a formatting string to be specified. If none is supplied, the
 * style-dependent default value, "%(message)s", "{message}", or
 * "${message}", is used.
 *
 * The Formatter can be initialized with a format string which makes use of
 * knowledge of the LogRecord attributes - e.g. the default value mentioned
 * above makes use of the fact that the user's message and arguments are pre-
 * formatted into a LogRecord's message attribute. Currently, the useful
 * attributes in a LogRecord are described by:
 *
 * %(name)s            Name of the logger (logging channel)
 * %(levelno)s         Numeric logging level for the message (DEBUG, INFO,
 *                     WARNING, ERROR, CRITICAL)
 * %(levelname)s       Text logging level for the message ("DEBUG", "INFO",
 *                     "WARNING", "ERROR", "CRITICAL")
 * %(pathname)s        Full pathname of the source file where the logging
 *                     call was issued (if available)
 * %(filename)s        Filename portion of pathname
 * %(module)s          Module (name portion of filename)
 * %(lineno)d          Source line number where the logging call was issued
 *                     (if available)
 * %(funcName)s        Function name
 * %(created)f         Time when the LogRecord was created (time.time_ns() / 1e9
 *                     return value)
 * %(asctime)s         Textual time when the LogRecord was created
 * %(msecs)d           Millisecond portion of the creation time
 * %(relativeCreated)d Time in milliseconds when the LogRecord was created,
 *                     relative to the time the logging module was loaded
 *                     (typically at application startup time)
 * %(thread)d          Thread ID (if available)
 * %(threadName)s      Thread name (if available)
 * %(taskName)s        Task name (if available)
 * %(process)d         Process ID (if available)
 * %(message)s         The result of record.getMessage(), computed just as
 *                     the record is emitted
 */
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

        if (!Object.keys(STYLES).includes(style ?? '')) {
            throw new ValueError(`style must be one of: ${Object.keys(STYLES).join(', ')}`)
        }

        this.style = new STYLES[style][0]({
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

export const DEFAULT_FORMATTER = new Formatter();
