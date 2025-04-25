# esm-logging

> This README is a stub. Working on it. Currently stabilizing the build
  environment after that I'll make it nice around here.

A quasi-port of the Python standard library logging module to ECMAScript.

# Why?

First of, because logging is important. It is important for debugging purposes,
leading to faster and more resilient development, for traceability leading to
better security. Most logging libraries I've discovered didn't satisfy me,
introduced weird concepts and all in all just weren't great. Other programming
language ecosystems offer way nicer logging facilities. Take Rust for example,
or... Python! Python has PEP, giving it a very structured approach towards
implementing new features and that's also how its logging facilities came to be
([PEP 282](https://peps.python.org/pep-0282/)). Python's logging facilities are
implemented by the [logging]() module, which is part of the standard library and
has been since 2002. It was originally authored by Vinay Sajip

# Roadmap

- do a quasi-port of the logging module with minimal amount of adaption
- add documentation
- add support for asynchronous calls
- implement Open Cybersecurity Framework (OCSF) formatter
- implement (Browser) local storage handler as a replacement for file handler

# Usage

For the time being, please check out my [CI
service](https://bitbucket.org/byteb4rb1e/esm-logging/pipelines), for an idea on
how to build this.
