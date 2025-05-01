import {expect, jest, test} from '@jest/globals';
import * as log_level from '../src/log-level';

describe('Logger', () => {
    it('can be instantiated', () => {
        //const logger = new log_level.Logger('test', 0);
    })
});

describe('getLevelName', () => {
    it('numeric to textual representation of built-ins', () => {
        expect(
            log_level.getLevelName(log_level.CRITICAL)
        ).toBe('CRITICAL');
        expect(
            log_level.getLevelName(log_level.FATAL)
        ).toBe('CRITICAL');
        expect(
            log_level.getLevelName(log_level.ERROR)
        ).toBe('ERROR');
        expect(
            log_level.getLevelName(log_level.WARNING)
        ).toBe('WARNING');
        expect(
            log_level.getLevelName(log_level.WARN)
        ).toBe('WARNING');
        expect(
            log_level.getLevelName(log_level.INFO)
        ).toBe('INFO');
        expect(
            log_level.getLevelName(log_level.DEBUG)
        ).toBe('DEBUG');
        expect(
            log_level.getLevelName(log_level.NOTSET)
        ).toBe('NOTSET');
    });

    it('textual to numeric representation of built-ins', () => {
        expect(
            log_level.getLevelName('CRITICAL')
        ).toBe(log_level.CRITICAL);
        expect(
            log_level.getLevelName('FATAL')
        ).toBe(`Level FATAL`);
        expect(
            log_level.getLevelName('ERROR')
        ).toBe(log_level.ERROR);
        expect(
            log_level.getLevelName('WARNING')
        ).toBe(log_level.WARNING);
        expect(
            log_level.getLevelName('WARN')
        ).toBe('Level WARN');
        expect(
            log_level.getLevelName('INFO')
        ).toBe(log_level.INFO);
        expect(
            log_level.getLevelName('DEBUG')
        ).toBe(log_level.DEBUG);
        expect(
            log_level.getLevelName('NOTSET')
        ).toBe(log_level.NOTSET);
    });
});


describe('addLevelName', () => {
    it('numeric to textual representation of built-ins', () => {
        log_level.addLevelName(80, 'FOOBAR');
        expect(log_level.getLevelName(80)).toBe('FOOBAR');
        expect(log_level.getLevelName('FOOBAR')).toBe(80);
    })
});
