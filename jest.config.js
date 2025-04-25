/** @type {import('ts-jest').JestConfigurationWithTsJest} **/
module.exports = {
    testEnvironment: "node",
    transform: {
        "^.+.tsx?$": [
            "ts-jest",
            {
                tsconfig: 'tsconfig.debug.json'
            }
        ]
    },
    roots: ['./tests']
}
