const assert = require('assert');
const index = require('../src/index.js');

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

describe('buildSingleControl', () => {
    describe('i', () => {
        it('returns int control', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p'};
            let html = index.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="range" value="0" />' +
                         '<span class="curr-val">0</span>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="parseInt" ' +
                         'data-setter="int" /></span>');
        });
    });
    describe('i with min,max', () => {
        it('returns int control with min and max', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'MIN': 0, 'MAX': 10}]};
            let html = index.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="range" min="0" max="10" value="0" />' +
                         '<span class="curr-val">0</span>' +
                         '<span class="range-val"> (0-10)</span>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="parseInt" ' +
                         'data-setter="int" /></span>');
        });
    });
    describe('i with vals', () => {
        it('returns int control with values in a dropdown', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'VALS': [3,4,5,6]}]};
            let html = index.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<select><option value="3" >3</option>' +
                         '<option value="4" >4</option>' +
                         '<option value="5" >5</option>' +
                         '<option value="6" >6</option>' +
                         '</select>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="value" /></span>');
        });
    });
    describe('i with min,max almost the same', () => {
        it('returns int control with checkbox', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'MIN': 8, 'MAX': 9}]};
            let html = index.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="checkbox" data-first="8" ' +
                         'data-second="9"/> 8, 9' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="sendCheckbox" ' +
                         'data-setter="setCheckbox" /></span>');
        });
    });
    describe('i with only 2 vals', () => {
        it('returns int control with checkbox', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'VALS': [5, 10]}]};
            let html = index.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="checkbox" data-first="5" ' +
                         'data-second="10"/> 5, 10' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="sendCheckbox" ' +
                         'data-setter="setCheckbox" /></span>');
        });
    });
    describe('i with min,max exactly the same', () => {
        it('returns int control with button', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'MIN': 20, 'MAX': 20}]};
            let html = index.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="button" value="20" data-first="20"/>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="sendSingle" /></span>');
        });
    });
    describe('i with only 1 val', () => {
        it('returns int control with button', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'VALS': [32]}]};
            let html = index.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="button" value="32" data-first="32"/>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="sendSingle" /></span>');
        });
    });
});

