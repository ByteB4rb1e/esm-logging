import * as yargs from 'yargs';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as child_process from 'child_process';

const usage = `Create a tarball from a package

This script is a wrapper around \`npm pack\`. 

It copies the current working directory to a temporary directory, moves the
build artifacts to the root of it and then starts \`npm pack\` from within that
directory.

This is necessary, because traditional directory layout of build environments
isn't really compatible with npm and Typescript transpilation. With
Typescript/npm packages, usually build artifacts are transpiled into the same
directory as their sources and then excluded via e.g.  \`.gitignore\`. This is
how the \`npm pack\` workflow expects it. I don't like the isolation between 
build artifacts and sources that come with it.`

const argv = require('yargs')
    .usage('$0 [args] inputDir outputDir', usage)
    .positional('inputDir', {
            type: 'string',
            default: 'build/production',
            describe: 'path to package build'
    })
    .positional('outputDir', {
            type: 'string',
            default: 'dist',
            describe: 'path to dist directory'
    })
    .demandOption(['inputDir', 'outputDir'])
    .help()
    .argv;

var cwd = process.cwd();

if (path.dirname(argv.inputDir) == path.basename(argv.inputDir)) {
    throw new Error('inputDir must have a nesting depth of at least 2')
}

if ([path.sep, '.'].includes(argv.inputDir[0])) {
    throw new Error(`inputDir must be a relative path inside of '${cwd}'`)
}

const buildDir = path.join(cwd, 'build', 'pack');
const nodeModulesDir = path.join(cwd, 'node_modules');
const gitDir = path.join(cwd, '.git/');

const tempDir = fs.mkdtempSync(path.join(
    os.tmpdir(),
    `${path.basename(cwd)}-`
));
const tempBuildPath = path.join(tempDir, argv.inputDir)
const tempBuildDir = path.join(tempDir, path.dirname(argv.inputDir))
const tempDistDir = path.join(tempDir, 'dist');

console.log(`cp: ${process.cwd()} > ${tempDir}`);
fs.cpSync(
    process.cwd(),
    tempDir,
    {
        recursive: true,
        filter: (src: string, dest: string) => {
            if (src.startsWith(nodeModulesDir)) { return false }
            if (src.startsWith(gitDir)) { return false }
            if (src.startsWith(buildDir)) { return false }
            console.log(
                `cp: ${path.relative(cwd, src)} > ${path.relative(cwd, dest)}`
            );
            return true;
        }
    }
);

console.log(`cp: ${tempBuildPath} > ${tempDir}`);
fs.cpSync(
    tempBuildPath,
    tempDir,
    {
        recursive: true,
        filter: (src: string, dest: string) => {
            console.log(
                `cp (tmp): ${path.relative(tempDir, src)} > ${path.relative(tempDir, dest)}`
            );
            return true;
        }
    }
);

console.log(`rm: ${tempBuildDir}`);
fs.rmSync(tempBuildDir, { recursive: true, force: true });

console.log(`mkdir: ${tempDistDir}`);
fs.mkdirSync(tempDistDir, { recursive: true });

console.log(`npm: pack --pack-destination ${argv.outputDir}`);
if (child_process.spawnSync(
    'npm',
    [
        'pack',
        '--pack-destination',
        argv.outputDir
    ],
    {
        cwd: tempDir,
        stdio: "inherit"
    }
).status) { process.exit(1) }

console.log(`mkdir: ${argv.outputDir}`);
fs.mkdirSync(argv.outputDir, {recursive: true});

console.log(`cp: ${tempDistDir} > ${argv.outputDir}`);
fs.cpSync(
    tempDistDir,
    argv.outputDir,
    {
        recursive: true,
        filter: (src: string, dest: string) => {
            console.log(
                `cp (tmp): ${path.relative(tempDir, src)} > ${path.relative(tempDir, dest)}`
            );
            return true;
        }
    }
);
