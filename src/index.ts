/**
 * This module defines functions and classes which implement a flexible,
 * idiomatic event logging system for ECMAScript applications and libraries. It
 * is a (quasi) vanilla port of the CPython 3.13 standard library logging
 * module.
 *
 * The key benefit of having the logging API provided by a standard library
 * module is that all Python modules can participate in logging, so your
 * application log can include your own messages integrated with messages from
 * third-party modules.
 *
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
 *
 * TODO: reintroduce multi-threading support
 *
 * > "Enums aren't real, they can hurt you though.". There are a couple of
 *   situations where it might make sense to translate a group of integer
 *   constants to an enum, but enum isn't a real type and allows for dynamically
 *   modifying it's behavior dynamically, since the underlying type is an
 *   object, which is mutable. So we would loose the immutability of the
 *   constants. Therefore we're stickng to the "old-school" convention.
 *
 * @module logging
 */

export * as config from './config';
export * as filter from './filter';
export * as formatter from './formatter';
export * as handler from './handler';
// screw community conventions, whoever came up with the idea of aliasing
// imports in pascal case, or camel case doesn't seem to care about naming
// collisions. I'm sticking to snake case as this avoids naming collisions.
export * as log_level from './log-level';
export * as log_record from './log-record';
export * as logger from './logger';
export * as manager from './manager';











