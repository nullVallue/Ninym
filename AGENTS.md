# AGENTS.md - Developer Guidelines for Ninym

This document provides guidelines for agentic coding agents working on this repository.

---

## Project Structure

```
Ninym/
├── ninym/                  # Main Next.js application
│   ├── ninym/              # Next.js 14 frontend (src/ directory)
│   └── tts/                # Python TTS module
├── kokoro-tts/            # Python FastAPI TTS backend
├── ninym.py               # Python CLI tool
└── Cat/                   # Reserved for future use
```

---

## Build Commands

### Next.js Frontend (ninym/ninym/)

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Python Backend (kokoro-tts/)

**Note:** Use conda environment with Python 3.10.19:
```bash
conda activate 3.10
```

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI server
cd kokoro-tts && uvicorn main:app --reload
```

### Python LLM Prompt Backend (ninym/prompt/)

**Note:** Use conda environment with Python 3.10.19:
```bash
conda activate 3.10
```

```bash
# Install Python dependencies
cd ninym/prompt && pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --reload
```

**Configuration:** Set `NEXT_PUBLIC_PROMPT_API_URL` in your Next.js `.env.local` file to point to the Python endpoint (defaults to `http://localhost:8000/api/chat/prompt`).

### Running a Single Test

**Note:** No test framework is currently configured. To add tests:

```bash
# For TypeScript/React (recommend Vitest)
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run a single test with Vitest
npx vitest run --reporter=verbose path/to/testfile.test.ts

# For Python (recommend pytest)
pip install pytest

# Run a single test
pytest path/to/test_file.py::test_function_name
```

---

## Code Style Guidelines

### TypeScript / React / Next.js

#### General
- Use strict TypeScript mode (enabled in tsconfig.json)
- Use functional components with hooks
- Prefer TypeScript interfaces over types for object shapes
- Enable strict null checks

#### Imports
- Use path aliases: `@/*` maps to `./src/*`
- Order imports: external libs → internal components → styles
- Use named exports for utilities, default for components
- Example:
  ```typescript
  import { useState, useEffect } from 'react'
  import { motion } from 'motion/react'
  import ChatBubble from '@/components/chat/ChatBubble'
  import { cn } from '@/lib/utils'
  ```

#### Naming Conventions
- **Files**: kebab-case for components (`ChatBubble.tsx`), camelCase for utilities (`useIsInView.tsx`)
- **Components**: PascalCase (`ChatBubble`, `MarkdownRenderer`)
- **Hooks**: camelCase with `use` prefix (`useIsInView`)
- **Variables/functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE

#### Types
- Use explicit return types for exported functions
- Avoid `any`, use `unknown` when type is uncertain
- Use interfaces for props:
  ```typescript
  interface ChatBubbleProps {
    isSender: boolean
    content: string
  }
  ```

#### Tailwind CSS
- Use utility classes for styling
- Custom colors defined in `tailwind.config.ts`:
  - `primary`, `secondary`, `dark`, `light`
  - `accent.primary`, `accent.secondary`
  - HSL-based: `background`, `foreground`, `muted`, `destructive`, `border`, etc.
- Use `cn()` utility for conditional classes (from `tailwind-merge`)
- Example:
  ```tsx
  className={cn(
    "flex justify-end py-3",
    isSender ? "bg-secondary" : "bg-muted"
  )}
  ```

#### Error Handling
- Use try/catch with specific error types
- Log errors appropriately (console.error for client-side)
- Return meaningful error messages to users
- Handle async errors with proper try/catch in hooks

#### Component Patterns
- Extract reusable logic into custom hooks
- Keep components focused (single responsibility)
- Use proper prop typing with TypeScript interfaces
- Memoize expensive computations with `useMemo`/`useCallback`

### Python

#### General
- Follow PEP 8 style guidelines
- Use type hints where beneficial
- Keep functions small and focused

#### Imports
- Standard library → third-party → local
- Use explicit imports

#### Naming
- `snake_case` for functions and variables
- `PascalCase` for classes
- `SCREAMING_SNAKE_CASE` for constants

#### Error Handling
- Use specific exception types
- Include context in error messages
- Log appropriately

---

## Linting

### TypeScript
ESLint is configured with `next/core-web-vitals` preset. Run:
```bash
npm run lint
```

### Python (Recommended)
Install ruff for linting:
```bash
pip install ruff
ruff check .
```

---

## Environment Variables

- Create `.env.local` for local development
- Never commit secrets to version control
- Use `.gitignore` to exclude sensitive files

---

## Key Dependencies

### Frontend
- Next.js 14
- React 18
- Tailwind CSS 3.4
- Motion (for animations)
- lucide-react (icons)
- next-themes (dark mode)

### Backend
- FastAPI
- Pydantic
- Torch/Torchaudio
- Kokoro TTS

---

## Notes for Agents

1. When modifying Tailwind classes, ensure consistency with existing patterns
2. Use the `cn()` utility from `@/lib/utils` for conditional class merging
3. When adding new dependencies, verify compatibility with existing versions
4. Test changes in development before building for production
5. Follow the existing code patterns in each module when adding new features
6. **Never guess**: If you are unsure about anything (code behavior, API usage, library features, etc.), you MUST either ask the user for clarification or look it up online using web search or web fetch tools. Guess work can lead to bugs and wasted time.
7. When asked to make commits, follow the guidelines in `COMMIT_GUIDELINES.md`
