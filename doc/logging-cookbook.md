# Using logging in multiple modules

Multiple calls to `logging.getLogger('someLogger')` return a reference to the
same logger object. This is true not only within the same module, but also
across modules as long as it is in the same Python interpreter process. It is
true for references to the same object; additionally, application code can
define and configure a parent logger in one module and create (but not
configure) a child logger in a separate module, and all logger calls to the
child will pass up to the parent. Here is a main module:

``javascript
import * as logging from 'eslib/logging';
import * as my_module from './my_module';

// create logger with 'spam_application'
var logger = logging.getLogger('spam_application');
logger.setLevel(logging.DEBUG);

// create file handler which logs even debug messages
var fh = logging.FileHandler('spam.log')
fh.setLevel(logging.DEBUG);

// create console handler with a higher log level
var ch = logging.StreamHandler();
ch.setLevel(logging.ERROR);

// create formatter and add it to the handlers
var formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s');
fh.setFormatter(formatter);
ch.setFormatter(formatter);

// add the handlers to the logger
logger.addHandler(fh);
logger.addHandler(ch);

logger.info('creating an instance of auxiliary_module.Auxiliary')
```
