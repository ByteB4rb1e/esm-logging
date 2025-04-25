import {expect, jest, test} from '@jest/globals';

describe('Logger', () => {
    it('can be instantiated', () => {
        //const logger = new logging.log_level.Logger('test', 0);
    })
});

describe('getLevelName', () => {
    var logging: any;

    beforeEach(() => {
        // there are a couple of singletons, which I'm not yet sure if they need
        // to be reloaded for every test case
        logging = require('../src');
    });

    it('numeric to textual representation of built-ins', () => {
        expect(
            logging.log_level.getLevelName(logging.log_level.CRITICAL)
        ).toBe('CRITICAL');
        expect(
            logging.log_level.getLevelName(logging.log_level.FATAL)
        ).toBe('CRITICAL');
        expect(
            logging.log_level.getLevelName(logging.log_level.ERROR)
        ).toBe('ERROR');
        expect(
            logging.log_level.getLevelName(logging.log_level.WARNING)
        ).toBe('WARNING');
        expect(
            logging.log_level.getLevelName(logging.log_level.WARN)
        ).toBe('WARNING');
        expect(
            logging.log_level.getLevelName(logging.log_level.INFO)
        ).toBe('INFO');
        expect(
            logging.log_level.getLevelName(logging.log_level.DEBUG)
        ).toBe('DEBUG');
        expect(
            logging.log_level.getLevelName(logging.log_level.NOTSET)
        ).toBe('NOTSET');
    });

    it('textual to numeric representation of built-ins', () => {
        expect(
            logging.log_level.getLevelName('CRITICAL')
        ).toBe(logging.log_level.CRITICAL);
        expect(
            logging.log_level.getLevelName('FATAL')
        ).toBe(`Level FATAL`);
        expect(
            logging.log_level.getLevelName('ERROR')
        ).toBe(logging.log_level.ERROR);
        expect(
            logging.log_level.getLevelName('WARNING')
        ).toBe(logging.log_level.WARNING);
        expect(
            logging.log_level.getLevelName('WARN')
        ).toBe('Level WARN');
        expect(
            logging.log_level.getLevelName('INFO')
        ).toBe(logging.log_level.INFO);
        expect(
            logging.log_level.getLevelName('DEBUG')
        ).toBe(logging.log_level.DEBUG);
        expect(
            logging.log_level.getLevelName('NOTSET')
        ).toBe(logging.log_level.NOTSET);
    });
});


describe('addLevelName', () => {
    var logging: any;

    beforeEach(() => {
        logging = require('../src');
    });

    it('numeric to textual representation of built-ins', () => {
        logging.log_level.addLevelName(80, 'FOOBAR');
        expect(logging.log_level.getLevelName(80)).toBe('FOOBAR');
        expect(logging.log_level.getLevelName('FOOBAR')).toBe(80);
    })
});
