module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        'airbnb-base',
    ],
    rules: {
        'arrow-parens': [
            'error',
            'always',
        ],
        'comma-dangle': [
            'error',
            'always-multiline',
        ],
        'import/no-unresolved': [
            'off',
        ],
        indent: [
            'error',
            4,
        ],
        'no-param-reassign': [
            'error',
            {
                props: false,
            },
        ],
        'no-underscore-dangle': [
            'error',
            {
                'allow': ['_id'],
            }
        ]
    },
};