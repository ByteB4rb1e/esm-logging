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
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'test-reports',
                outputName: 'junit-report.xml'
            }
        ],
    ],
    roots: ['./tests']
}
