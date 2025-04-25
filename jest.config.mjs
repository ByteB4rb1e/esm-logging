/** @type {import('ts-jest').JestConfigurationWithTsJest} **/
export default {
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
