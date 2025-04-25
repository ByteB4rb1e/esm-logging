import { LogRecord } from './log-record';

//---------------------------------------------------------------------------
// Filter classes and functions
//---------------------------------------------------------------------------

export type FilterCallable = (record: LogRecord) => boolean;

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

