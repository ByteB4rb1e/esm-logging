import {expect, jest, test} from '@jest/globals';

describe('Logger', () => {
    it('can be instantiated', () => {
        //const logger = new logging.Logger('test', 0);
    })
});

describe('getLevelName', () => {
    var logging: any;

    beforeEach(() => {
        logging = require('../src/logging');
    });

    it('numeric to textual representation of built-ins', () => {
        expect(
            logging.getLevelName(logging.CRITICAL)
        ).toBe('CRITICAL');
        expect(
            logging.getLevelName(logging.FATAL)
        ).toBe('CRITICAL');
        expect(
            logging.getLevelName(logging.ERROR)
        ).toBe('ERROR');
        expect(
            logging.getLevelName(logging.WARNING)
        ).toBe('WARNING');
        expect(
            logging.getLevelName(logging.WARN)
        ).toBe('WARNING');
        expect(
            logging.getLevelName(logging.INFO)
        ).toBe('INFO');
        expect(
            logging.getLevelName(logging.DEBUG)
        ).toBe('DEBUG');
        expect(
            logging.getLevelName(logging.NOTSET)
        ).toBe('NOTSET');
    });

    it('textual to numeric representation of built-ins', () => {
        expect(
            logging.getLevelName('CRITICAL')
        ).toBe(logging.CRITICAL);
        expect(
            logging.getLevelName('FATAL')
        ).toBe(`Level FATAL`);
        expect(
            logging.getLevelName('ERROR')
        ).toBe(logging.ERROR);
        expect(
            logging.getLevelName('WARNING')
        ).toBe(logging.WARNING);
        expect(
            logging.getLevelName('WARN')
        ).toBe('Level WARN');
        expect(
            logging.getLevelName('INFO')
        ).toBe(logging.INFO);
        expect(
            logging.getLevelName('DEBUG')
        ).toBe(logging.DEBUG);
        expect(
            logging.getLevelName('NOTSET')
        ).toBe(logging.NOTSET);
    });
});


describe('addLevelName', () => {
    var logging: any;

    beforeEach(() => {
        logging = require('../src/logging');
    });

    it('numeric to textual representation of built-ins', () => {
        logging.addLevelName(80, 'FOOBAR');
        expect(logging.getLevelName(80)).toBe('FOOBAR');
        expect(logging.getLevelName('FOOBAR')).toBe(80);
    })
});
