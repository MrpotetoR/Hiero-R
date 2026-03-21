# Contributing to hiero-enterprise-react

Thank you for your interest in contributing! This project follows the contribution guidelines of the [Hiero](https://github.com/hiero-ledger) ecosystem.

## Getting started

1. **Fork** this repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-user>/hiero-enterprise-react.git
   cd hiero-enterprise-react
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/i-coders-uttecam/hiero-enterprise-react.git
   ```
4. **Install dependencies:**
   ```bash
   pnpm install
   ```
5. **Create a feature branch:**
   ```bash
   git checkout -b feat/my-new-feature
   ```

## Development workflow

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Lint
pnpm lint
```

## DCO Sign-Off (required)

All commits **must** include a DCO sign-off line. This certifies that you have the right to submit the code under the project's open-source license.

```bash
git commit --signoff -S -m "feat: add useBalance hook"
```

This adds the following line to your commit message:

```
Signed-off-by: Your Name <your.email@example.com>
```

If you forgot to sign-off previous commits, you can amend:

```bash
# Last commit only
git commit --amend --signoff --no-edit

# Multiple commits (interactive rebase)
git rebase --signoff HEAD~N
```

## GPG Signing (required)

All commits **must** be GPG signed. Set up GPG signing:

```bash
# List your GPG keys
gpg --list-secret-keys --keyid-format=long

# Configure git to use your GPG key
git config user.signingkey YOUR_KEY_ID
git config commit.gpgsign true

# Each commit must use -S flag
git commit --signoff -S -m "your message"
```

For detailed instructions on generating a GPG key and adding it to GitHub, see:
[GitHub GPG Documentation](https://docs.github.com/en/authentication/managing-commit-signature-verification)

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add useTokenInfo hook
fix: handle null balance in useBalance
docs: update README quickstart section
test: add MirrorNodeClient pagination tests
chore: update dependencies
refactor: simplify HieroProvider context
```

## Pull requests

1. Ensure all tests pass: `pnpm test`
2. Ensure type checking passes: `pnpm typecheck`
3. Update documentation if needed
4. Reference any related issues in the PR description
5. All commits must be DCO signed and GPG signed

## Code style

- TypeScript strict mode enabled
- Use explicit return types on exported functions
- JSDoc comments on all public API functions
- Prefer `interface` over `type` for object shapes
- Use barrel exports (`index.ts`) per package

## Project structure

```
packages/
├── core/       # Base services (HieroClient, AccountService, MirrorNodeClient)
├── react/      # React hooks and HieroProvider
└── sample-app/ # Next.js demo application
```

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
