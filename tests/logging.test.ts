import * as logging from '../src/logging';

describe('Logger', () => {
    it('can be instantiated', () => {
        const logger = new logging.Logger('test', 0);
    })
});
