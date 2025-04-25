# Contribution Guidelines

## Configuration

This project uses npm as a build driver.

In POSIX(-esque) shell environments (including *mingw-w64* distros) you may run
`./configure` to configure your build environment.

## Development

For configuring hot-reload transpilation of the Typescript compiler, execute 
`npm run watch`.

## Distributing

This project is distributed as a npm package. 

```
npm run dist
```

archiving output resides under `dist/`.

## CI/CD

This project uses GNU Automake as a wrapper around the MSBuild build driver to
streamline the build interface for POSIX environments.

Make sure the CI/CD container image contains GNU Make, and that the environment
variables `NPM_REGISTRY` are set.

`NPM_REGISTRY` can be derived from whatever registry service is in use (e.g.
GitLab npm Registry, Sonarqube Nexus, npmjs.com, etc.). If you're using CI/CD
built into your Git host there's a chance the URL is available as shell
environments from within the CI/CD container.

For Gitlab package registries, make sure to define the `NPM_REGISTRY` by
depending on `CI_API_V4_URL`, `CI_PROJECT_ID` inside the CI/CD container:

```sh
export NPM_REGISTRY="$CI_API_V4_URL/api/v4/projects/$CI_PROJECT_ID/packages/npm"
```
should resolve to
`https://gitlab.adesso-group.com/api/v4/projects/3842/packages/npm`

To authenticate against the Gitlab PyPI registry (archive), generate a project
[deploy token](https://docs.gitlab.com/17.8/ee/user/project/deploy_tokens/index.html)
and set it's value to `NPM_AUTH_TOKEN`.

Initialize a pipeline's shell environment through calling `./configure`, then
call each make target required in seperate pipeline steps.

Steps:

1. `sh ./configure`
*  `make clean`
*  `make build`
*  `make test`
*  `make doc`
*  `make dist`
*  `make publish`

Should there be no pipeline, just do this from your workstation if you consider
yourself to be a project maintainer. No worries, if you can publish something
you shouldn't, then there's a misconfiguration somewehere anyway...

Ideally, set up seperate pipelines for `dev`, `master` and default branches.

Only `master` should contain *dist*, and *publish* steps. However, on `dev`,
checking whether the project can be distributed (*dist*) is fine.

## Maintenance (Chores)

Maintaining this repository requires the maintainer to use a POSIX(-esque) shell
environment (*mingw-w64* distros are fine as well), in addition to the
requirements of CI/CD.

Execute all chores, by executing `make`, or `make chores`. Analyze the changes
then commit them.

### Versioning

Versioning relevant for distribution is defined via Git tags. If the HEAD of the
working tree is not tagged, the build environment increments the version to a
development version of the next patch version. Increment versions by applying a
Git tag.
