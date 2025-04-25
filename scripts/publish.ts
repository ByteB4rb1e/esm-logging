import * as yargs from 'yargs';
import * as child_process from 'child_process';

const usage = `Publish a package

This is a wrapper around \`npm publish\`.

It reads a npm registry url, and authentication token from input arguments,
configures npm (in the project context) for publishing, then publishes and 
restores the npm configuration.
`

const argv = require('yargs')
    .usage('$0 [args]')
    .option('registry', {
        alias: 'r',
        describe: 'URL of npm registry',
        type: 'string'
    })
    .option('authToken', {
        alias: 't',
        describe: 'authentication token',
        type: 'string'
    })
    .demandOption(['registry'])
    .help()
    .argv;

argv.authToken = process.env.NPM_AUTH_TOKEN ?? argv.authToken;

if (!argv.registry) { throw new Error('no url provided.')}
if (!argv.authToken) {
    throw new Error(
        'no authToken or \'NPM_AUTH_TOKEN\' environment variable provided.'
    )
}

console.info(`npm: set registry ${argv.registry} --location project`);
if(child_process.spawnSync(
    'npm',
    ['set', 'registry', argv.registry],
    { stdio: "inherit" }
).status) { process.exit(1) }

const registry = argv.registry.replace('https://', '').replace('http://', '');

const authTokenConfigItemName = '${registry}/:_authToken';

console.info(`npm: set _authToken ...`);
if (child_process.spawnSync(
    'npm',
    ['set', authTokenConfigItemName, argv.authToken, '--location', 'project'],
    { stdio: "inherit" }
).status) { process.exit(1) }

console.info(`npm: publish`);
if (child_process.spawnSync('npm', ['publish'], { stdio: "inherit" }).status) {
    process.exit(1);
};

console.info(`npm: delete registry --location project`);
if (child_process.spawnSync(
    'npm',
    ['config', 'delete', 'registry', '--location', 'project'],
    { stdio: "inherit" }
).status) { process.exit(1) }

console.info(`npm: delete _authToken ... --location project`);
if (child_process.spawnSync(
    'npm',
    ['config', 'delete', authTokenConfigItemName, '--location', 'project'],
    { stdio: "inherit" }
).status) { process.exit(1) }


