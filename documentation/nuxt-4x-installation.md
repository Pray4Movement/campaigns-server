# Nuxt 4.x Installation Guide

## Prerequisites

- Node.js 20.x or newer (recommended: active LTS release)
- Text editor (recommended: VS Code with Vue extension or WebStorm)
- Terminal

## Installation Steps

### 1. Create New Project

Open terminal and run one of these commands to create a new project:

```bash
# npm
npm create nuxt@latest <project-name>

# yarn
yarn create nuxt@latest <project-name>

# pnpm
pnpm create nuxt@latest <project-name>

# bun
bun create nuxt@latest <project-name>
```

### 2. Navigate to Project Directory

```bash
cd <project-name>

# Optional: Open in VS Code
code <project-name>
```

### 3. Start Development Server

```bash
# npm
npm run dev -- -o

# yarn
yarn dev --open

# pnpm
pnpm dev -o

# bun
bun run dev -o
```

## Additional Notes

- Browser will automatically open at http://localhost:3000
- Recommended to use even-numbered Node.js versions
- Optional: Install Nuxtr VS Code extension for enhanced development experience