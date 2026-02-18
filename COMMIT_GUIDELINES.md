# Commit Guidelines

Based on [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/#specification)

## Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Description |
|------|-------------|
| `feat` | New feature (correlates with MINOR in SemVer) |
| `fix` | Bug fix (correlates with PATCH in SemVer) |
| `build` | Changes that affect the build system or external dependencies |
| `chore` | Other changes that don't modify src or test files |
| `ci` | Changes to CI configuration files and scripts |
| `docs` | Documentation only changes |
| `style` | Changes that don't affect the meaning of the code (formatting) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Code change that improves performance |
| `test` | Adding missing tests or correcting existing tests |
| `revert` | Reverts a previous commit |

## Breaking Changes

Indicate breaking changes in one of two ways:

1. **Footer**: `BREAKING CHANGE: <description>`
2. **Type prefix**: Use `!` after type/scope, e.g., `feat!: <description>`

Breaking changes correlate with MAJOR in SemVer.

## Rules

1. Commits MUST be prefixed with a type
2. Type MUST be lowercase
3. Description MUST follow the colon and space
4. Description is a short summary of the code changes
5. Use imperative mood (e.g., "add feature" not "added feature")
6. Don't end description with a period

## Examples

### Basic
```
docs: correct spelling of CHANGELOG
```

### With scope
```
feat(lang): add Polish language
```

### With body
```
fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Reviewed-by: Z
Refs: #123
```

### Breaking change with footer
```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

### Breaking change with `!`
```
feat!: send an email to the customer when a product is shipped
```

### Breaking change with scope and `!`
```
feat(api)!: send an email to the customer when a product is shipped
```

## Why Use Conventional Commits

- Automatically generating CHANGELOGs
- Automatically determining semantic version bumps
- Communicating the nature of changes to teammates
- Triggering build and publish processes
