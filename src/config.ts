
import { MANAGER } from './manager';
import { ValueError } from './helper/error';
import { STYLES, Formatter } from './formatter';
import { StreamHandler, FileHandler, Handler } from './handler';
import { LogLevel } from './log-level';

//---------------------------------------------------------------------------
// Configuration classes and functions
//---------------------------------------------------------------------------

/**
 * options for basic configuration of logging module
 */
export interface BasicConfigOptions {
    /*
     * Specifies that a FileHandler be created, using the specified filename,
     * rather than a StreamHandler.
     */
    filename?: string;

    /**
     * Specifies the mode to open the file, if filename is specified (if
     * filemode is unspecified, it defaults to 'a')
     */
    filemode?: string;

    /**
     * Use the specified format string for the handler.
     */
    format?: string;

    /**
     * Use the specified date/time format.
     *
     */
    datefmt?: string;

    /**
     * If a format string is specified, use this to specify the type of format
     * string (possible values '%', '{', '$', for %-formatting,
     * :meth:`str.format` and :class:`string.Template`- defaults to '%').
     *
     * TODO: switch to enum
     */
    style?: string;

    /**
     * Set the root logger level to the specified level.
     */
    level?: LogLevel;

    /**
     * Use the specified stream to initialize the StreamHandler.  Note that this
     * argument is incompatible with 'filename' - if both are present, 'stream'
     * is ignored.
     *
     * TODO:
     */
    stream?: any;

    /**
     * If specified, this should be an iterable of already created handlers,
     * which will be added to the root logger. Any handler in the list which
     * does not have a formatter assigned will be assigned the formatter created
     * in this function.
     */
    handlers?: Handler[];

    /**
     * If this keyword  is specified as true, any existing handlers attached to
     * the root logger are removed and closed, before carrying out the
     * configuration as specified by the other arguments.
     */
    force?: boolean;

    /**
     * If specified together with a filename, this encoding is passed to the
     * created FileHandler, causing it to be used when the file is opened.
     */
    encoding?: string;

    /**
     * If specified together with a filename, this value is 
     * passed to the created FileHandler, causing it to be used 
     * when the file is opened in text mode. If not specified, 
     * the default value is `backslashreplace`.
     */
    errors?: string|null;
}

/**
 * Do basic configuration for the logging system.
 *
 * This function does nothing if the root logger already has handlers
 * configured, unless the keyword argument *force* is set to ``True``.
 * It is a convenience method intended for use by simple scripts
 * to do one-shot configuration of the logging package.
 *
 * The default behaviour is to create a StreamHandler which writes to
 * sys.stderr, set a formatter using the BASIC_FORMAT format string, and
 * add the handler to the root logger.
 *
 * A number of optional keyword arguments may be specified, which can alter
 * the default behaviour.
 *
 * Note that you could specify a stream created using open(filename, mode)
 * rather than passing the filename and mode in. However, it should be
 * remembered that StreamHandler does not close its stream (since it may be
 * using sys.stdout or sys.stderr), whereas FileHandler closes its stream
 * when the handler is closed.
 *
 * TODO: refactor logic, there apparently is some redundancy in the original
 *       code
 */
export function basicConfig(options: BasicConfigOptions) {
    const force = options.force ?? false;
    var encoding = options.encoding ?? undefined;
    var errors: string|undefined = options.errors ?? 'backslashreplace';
    var handlers = options.handlers ?? [];
    const filename = options.filename ?? null;
    const stream = options.stream ?? null;
    const filemode = options.filemode ?? 'a';
    const dateformat = options.filemode ?? null;
    const style = options.filemode ?? '%';
    const level = options.level ?? null;

    if (!Object.keys(STYLES).includes(style)) {
        throw new ValueError(
            `style must be one of: ${Object.keys(STYLES).join(', ')}`
        );
    }

    if (force) {
        for (var i = 0; i < MANAGER.root.handlers.length; i += 1) {
            let h: Handler = MANAGER.root.handlers[i];
            MANAGER.root.removeHandler(h);
            h.close();
        }
    }

    if (handlers.length == 0) {
        if (handlers === null && stream && filename) {
            throw new ValueError(
                "'stream' and 'filename' should not be specified together"
            );
        }

        else if (stream || filename) {
            throw new ValueError(
                "'stream' or 'filename' should not be specified together" +
                "with 'handlers'"
            );
        }

        if (handlers === null) {
            var h: Handler;

            if (filename) {
                if (filemode.match('b')) { errors = undefined }
                else { encoding = 'utf-8' }

                h = new FileHandler({
                    filename: filename,
                    filemode: filemode,
                    'encoding': encoding,
                    errors: errors
                });
            }

            else { h = new StreamHandler(stream) }

            handlers = [h];
        }

        for (var i = 0; i < handlers.length; i += 1) {
            let h = handlers[i];

            if (h.formatter === null) {
                h.formatter = new Formatter({
                    fmt: options.format ?? STYLES[style][1],
                    datefmt: dateformat,
                    style: style
                });
            }

            MANAGER.root.addHandler(h);
        }

        if (level !== null) { MANAGER.root.setLevel(level) }

        if (options) {
            // runtime interface guard, please let me stay. 🥺
            // the interface does not allow for additional members, but the
            // runtime environment has no concept of interfaces. We can stick to
            // the original implementation
            const keys = Object.keys(options).join(', ');

            throw new ValueError(`Unrecognised argument(s): ${keys}`);
        }
    }
}
