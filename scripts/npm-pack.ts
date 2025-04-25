import * as child_process from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as util from 'node:util';

const SCRIPTNAME = path.basename(__filename);

const DEFAULT_INPUT_DIR: string = path.join('build', 'release');
const DEFAULT_OUTPUT_DIR: string = 'dist';
const DEFAULT_ASSETS_INDEX_BASENAME: string = 'assets.txt';
const DEFAULT_DOCS_DIRNAME: string = 'docs/';
const DEFAULT_LIB_DIRNAME: string = 'lib/';

function usage(exec: string): string {
    return `
Usage: ${exec} [OPTIONS] [INPUT] [OUTPUT] [DOCS]

Create a tarball from a package

This script is a wrapper around \`npm pack\`. 

This project uses npm pack to distribute its assets, even though it's not the
most ideal as the resulting tarball has a directory structure specific to npm
packages. The reason it is still utilized though is because it does not require
any additional dependencies outside the Node.js/npm runtime environment.

It copies the current working directory to a temporary directory, moves the
build artifacts to the root of it and then starts \`npm pack\` from within that
directory.

This is necessary, because traditional directory layout of build environments
isn't compatible with npm pack routine. With npm packages, usually build
artifacts are transpiled into the same directory as their sources and then
excluded via e.g.  \`.gitignore\`. This is how the \`npm pack\` routine expects
it, which gives poor isolation between sources and build artifacts.

Positional arguments:

    INPUT  - directory of build output used as the input for packaging
             [default:${DEFAULT_INPUT_DIR}]

    OUTPUT - directory to output the package (tarball) into
             [default:${DEFAULT_OUTPUT_DIR}]

    DOCS   - directory containing documentation, which is used as an auxiliary
             input for packaging alongside INPUT.

Options:

    -d, --docs-dirname - name of directory to output documentation into
                         (if supplied through DOCS).
                         [default:${DEFAULT_DOCS_DIRNAME}]

    -l, --lib-dirname  - name of directory to output transpiled module into
                         [default:${DEFAULT_LIB_DIRNAME}]
`;
}

export interface PackageOptions {
    inputDir: string,
    outputDir: string,
    docsInputDir: string | null,
    docsOutputDirname: string,
    libOutputDirname: string,
}

/**
 * recursively traverse a directory and yield all paths relative to the root
 *
 * @param root - path where to start traversal from
 */
export function* listFiles(
    root: string,
    trueRoot?: string,
): Generator<string, void, unknown> {
    trueRoot = trueRoot ?? root;
    if (!fs.existsSync(root)) {
        throw new Error(`path does not exist: '${root}'`);
    }

    var files = fs.readdirSync(root);

    for (var i = 0; i < files.length; i++) {
        let filePath = path.join(root, files[i]);
        let stat = fs.lstatSync(filePath);

        if (stat.isDirectory()) { yield* listFiles(filePath, trueRoot) }
        else { yield path.relative(trueRoot, filePath); }
    };
};

/**
 * TODO: write TSDOC block comment
 */
function pack(options: PackageOptions): void {
    var cwd = process.cwd();

    if (path.dirname(options.inputDir) == path.basename(options.inputDir)) {
        throw new Error('inputDir must have a nesting depth of at least 2')
    }

    if ([path.sep, '.'].includes(options.inputDir[0])) {
        throw new Error(`inputDir must be a relative path inside of '${cwd}'`)
    }

    console.log(`${SCRIPTNAME}: creating temporary directory...`);
    const tempDir = fs.mkdtempSync(path.join(
        os.tmpdir(),
        `${path.basename(cwd)}-`
    ));

    console.log(`${SCRIPTNAME}: copying metadata...`);
    [
        'package.json',
        'LICENSE',
        'README.md',
    ].forEach((target) => {
        // TODO: sync file stats
        fs.cpSync(
            path.join(cwd, target),
            path.join(tempDir, target),
            {
                filter: (src: string, dest: string) => {
                    console.log(
                        `cp: ${path.relative(cwd, src)} > ${dest}`
                    );
                    return true;
                }
            }
        );
    });

    if (options.docsInputDir) {
        console.log(`${SCRIPTNAME}: docs supplied, will copy...`);
        // TODO: sync file stats
        fs.cpSync(
            path.join(cwd, options.docsInputDir),
            path.join(tempDir, options.docsOutputDirname),
            {
                recursive: true,
                filter: (src: string, dest: string) => {
                    console.log(
                        `cp: ${path.relative(cwd, src)} > ${dest}`
                    );
                    return true;
                }
            }
        );
    }

    else {
        console.log(`${SCRIPTNAME}: no docs supplied, will not copy...`);
    }

    console.log(`${SCRIPTNAME}: copying build output...`);
    fs.cpSync(
        options.inputDir,
        path.join(tempDir, options.libOutputDirname),
        {
            recursive: true,
            filter: (src: string, dest: string) => {
                console.log(
                    `cp: ${path.relative(cwd, src)} > ${dest}`
                );
                return true;
            }
        }
    );

    const outputDir = path.resolve(cwd, options.outputDir);
    console.log(`mkdir: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`npm: pack --pack-destination ${outputDir}`);
    child_process.execSync(
        `npm pack --pack-destination ${outputDir}`,
        {
            cwd: tempDir,
            stdio: "inherit"
        }
    );
}

if (require.main === module) {
    // minimum number of positional arguments
    const minPosargs: number = 2;

    // default values of options arguments
    const defaultOptargs: {[key: string]: any} = {
        'docs-dirname': DEFAULT_DOCS_DIRNAME,
        'lib-dirname': DEFAULT_LIB_DIRNAME,
    };

    // required options arguments
    const requiredOptargs: string[] = [
        'docs-dirname',
        'lib-dirname',
    ];

    // the interface of parseArgs is very simple and Typescript does not play
    // nicely with it, since it expects any reassignments to be of the same type
    // as the primitives parseArgs allows. That's why I'm doing a lot of `as
    // unknown as whatever` kung-fu down below. The node runtime doesn't care
    // anyway...
    var {values, positionals} = util.parseArgs({
        options: {
            'docs-dirname': {
                type: 'string',
                short: 'd'
            },
            'lib-dirname': {
                type: 'string',
                short: 'd'
            },
            'help': {
                type: 'boolean',
                short: 'h'
            }
        },
        allowPositionals: true
    });

    // there's probably a prettier way as to not have to reassign this just to
    // make tsc happy, but I'm a little exhausted...
    const args: string[] = positionals;

    if (values.help != undefined) {
        const exec = [
            'ts-node',
            path.join(path.basename(__dirname), path.basename(__filename))
        ].join(' ');
        console.log(usage(exec));
        process.exit(1);
    }

    values = {...defaultOptargs, ...values};

    var errors: boolean = false;

    for (var requiredOptarg of requiredOptargs) {
        if (!(requiredOptarg in values)) {
            console.error(
                `error: missing options argument: --${requiredOptarg}`
            );
            errors = true;
        }
    }

    if (positionals.length < minPosargs) {
        if (positionals.length == 1) {
            positionals.push(DEFAULT_OUTPUT_DIR);
        }

        else if (positionals.length == 0) {
            positionals.push(DEFAULT_INPUT_DIR);
            positionals.push(DEFAULT_OUTPUT_DIR);
        }
    }

    if (errors != false) {
        console.log(`supply -h/--help, for more information.`)
        process.exit(1);
    }

    pack({
        inputDir: positionals[0],
        outputDir: positionals[1],
        docsInputDir: positionals[2] ?? null,
        docsOutputDirname: values['docs-dirname']!,
        libOutputDirname: values['lib-dirname']!,
    });
}
