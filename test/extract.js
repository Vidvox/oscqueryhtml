const assert = require('assert');
const index = require('../src/index.js');

describe('extractControlPaths', () => {
    describe('two controls', () => {
        it('returns two paths', () => {
            let data = {
                'FULL_PATH': '/',
                'CONTENTS' : {
                    'dir' : {
                        'FULL_PATH': '/dir',
                        'CONTENTS' : {
                            'a_control' : {
                                'FULL_PATH': '/dir/a_control',
                                'TYPE' : 'c',
                            },
                            'b_control' : {
                                'FULL_PATH': '/dir/b_control',
                                'TYPE' : 'r',
                            }
                        }
                    }
                }
            };
            let paths = index.extractControlPaths(data);
            assert.deepEqual(paths, ['/dir/a_control', '/dir/b_control']);
        });
    });
    describe('has contents and type', () => {
        it('returns two paths', () => {
            let data = {
                'FULL_PATH': '/',
                'CONTENTS' : {
                    'dir' : {
                        'FULL_PATH': '/dir',
                        'CONTENTS' : {
                            'a_control' : {
                                'FULL_PATH': '/dir/a_control',
                                'TYPE' : 'c',
                            },
                        },
                        'TYPE': 'i'
                    }
                }
            };
            let paths = index.extractControlPaths(data);
            assert.deepEqual(paths, ['/dir/a_control', '/dir']);
        });
    });
});

