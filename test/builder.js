const assert = require('assert');
const index = require('../src/index.js');
const builder = require('../src/builder.js');

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

var g_supportHtml5Color;

describe('buildSingleControl', () => {
    describe('i', () => {
        it('returns int control', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p'};
            let html = builder.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="range" value="0" />' +
                         '<span class="curr-range-val">' +
                         '<span class="curr-val">0</span>' +
                         '</span>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="parseInt" ' +
                         'data-setter="int" /></span>');
        });
    });
    describe('i with min,max', () => {
        it('returns int control with min and max', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'MIN': 0, 'MAX': 10}]};
            let html = builder.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="range" min="0" max="10" value="0" />' +
                         '<span class="curr-range-val">' +
                         '<span class="curr-val">0</span>' +
                         '<span class="range-val"> (0-10)</span>' +
                         '</span>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="parseInt" ' +
                         'data-setter="int" /></span>');
        });
    });
    describe('i with vals', () => {
        it('returns int control with values in a dropdown', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'VALS': [3,4,5,6]}]};
            let html = builder.buildSingleControl(data, 'i', [0], 0);
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
            let html = builder.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="button" data-toggle="yes" value="8" ' +
                         'data-first="8" data-second="9"/>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="parseIntToggle" ' +
                         'data-setter="setToggle" /></span>');
        });
    });
    describe('i with only 2 vals', () => {
        it('returns int control with checkbox', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'VALS': [5, 10]}]};
            let html = builder.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="button" data-toggle="yes" value="5" ' +
                         'data-first="5" data-second="10"/>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="parseIntToggle" ' +
                         'data-setter="setToggle" /></span>');
        });
    });
    describe('i with min,max exactly the same', () => {
        it('returns int control with button', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'MIN': 20, 'MAX': 20}]};
            let html = builder.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="button" value="20" data-first="20"/>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="parseSingle" ' +
                         'data-setter="button" /></span>');
        });
    });
    describe('i with only 1 val', () => {
        it('returns int control with button', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': [{'VALS': [32]}]};
            let html = builder.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<input type="button" value="32" data-first="32"/>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="i" data-getter="parseSingle" ' +
                         'data-setter="button" /></span>');
        });
    });
    describe('i with invalid size of RANGE', () => {
        it('returns a message about invalid node', () => {
            let data = {'TYPE': 'i', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': []};
            let html = builder.buildSingleControl(data, 'i', [0], 0);
            assert.equal(html,
                         '<span class="error">Invalid node: RANGE needs ' +
                         'MIN,MAX or VALS</span>');
        });
    });
    describe('h', () => {
        it('returns longlong control', () => {
            let data = {'TYPE': 'h', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p'};
            let html = builder.buildSingleControl(data, 'h', [0], 0);
            assert.equal(html,
                         '<input type="range" value="0"/>' +
                         '<span class="curr-range-val">' +
                         '<span class="curr-val">0</span>' +
                         '</span>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="h" data-getter="parseInt64" ' +
                         'data-setter="int64" /></span>');
        });
    });
    describe('F', () => {
        it('returns false control', () => {
            let data = {'TYPE': 'F', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p'};
            let html = builder.buildSingleControl(data, 'F', [0], 0);
            assert.equal(html,
                         '<input type="button" value="false"/>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="F" data-getter="boolToggle" ' +
                         'data-setter="setToggle" /></span>');
        });
    });
    describe('r creates colorPicker', () => {
        it('returns an html5 color control', () => {
            let cfg = {supportHtml5Color: true};
            let data = {'TYPE': 'r', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': []};
            let html = builder.buildSingleControl(data, 'r', [0], 0, cfg);
            assert.equal(html,
                         '<input type="color" value="#4466ff" />' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="r" data-getter="color" ' +
                         'data-setter="color" /></span>');
        });
        it('returns a third-party color control', () => {
            let data = {'TYPE': 'r', 'DESCRIPTION': 'desc', 'FULL_PATH': '/p',
                        'RANGE': []};
            let html = builder.buildSingleControl(data, 'r', [0], 0);
            assert.equal(html,
                         '<div class="color-control" data-value="#4466ff">' +
                         '</div>' +
                         '<span class="details" data-full-path="/p" ' +
                         'data-type="r" data-getter="color" ' +
                         'data-setter="color" /></span>');
        });
    });
});

