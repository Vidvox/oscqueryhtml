const assert = require('assert');
const index = require('../src/index.js');

describe('Basic', () => {
    describe('math', () => {
        it('should add correctly', () => {
            assert.equal(1 + 1, 2);
        });
    });
});

describe('util', () => {
    describe('getDataEvent', () => {
        it('returns data-event value', () => {
            let obj = {'attributes': {'data-event': {'value': 'keypress'}}};
            assert.equal(index.getDataEvent(obj), 'keypress');
            obj = {'attributes': {'class': 'container'}}
            assert.equal(index.getDataEvent(obj), null);
        });
    });
});

