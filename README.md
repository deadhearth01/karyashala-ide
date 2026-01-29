# WASM Code Compiler

A browser-based WebAssembly compiler that supports **C** and **Python** code execution directly in the browser.

## Architecture

### Python Execution (Pyodide)
```
Monaco Editor
   |
   | Run
   v
Web Worker
   |
   | Pyodide (WASM)
   |
stdout / stderr
```

### C Execution (C Interpreter)
```
Monaco Editor
   |
   | Run
   v
Web Worker (C Sandbox)
   |
   ├─ Parse C code
   ├─ Execute
   └─ Return output
```

## Features

- 🐍 **Python Execution**: Full Python support via Pyodide (WebAssembly)
- 🔧 **C Execution**: C code interpretation in browser
- 🎨 **Monaco Editor**: VS Code's editor with syntax highlighting
- 🌙 **Dark/Light Theme**: Professional blue/white theme with dark mode
- ⚡ **Web Workers**: Non-blocking code execution
- 📊 **Execution Metrics**: Time tracking and status reporting

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Python Runtime**: Pyodide (CPython compiled to WebAssembly)
- **Styling**: Tailwind CSS v4
- **Code Execution**: Web Workers for sandboxed execution

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Git (for cloning and version control)

### Installation & Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/deadhearth01/ai-karyashala-ide.git
cd ai-karyashala-ide
```

#### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Next.js 16.1.5
- Monaco Editor
- Tailwind CSS v4
- shadcn/ui components
- TypeScript

#### 3. Development Server

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000)

To run on a specific port:
```bash
npm run dev -- --port 3002
```

#### 4. Production Build

```bash
npm run build
```

Start the production server:
```bash
npm start
```

### Configuration

No additional configuration needed. The application works out-of-the-box with:
- Tailwind CSS v4 configured with neutral color palette
- Monaco Editor with Python and C language support
- Pyodide (Python WASM) loaded from CDN
- Security features enabled by default (copy/paste blocking, function keys disabled)

### Usage

1. **Select Language**: Choose between Python or C from the dropdown
2. **Write Code**: Use Monaco Editor to write your code
3. **Run Code**: Click the "Run" button to execute
4. **View Output**: Results appear in the output panel on the right
5. **Record Keystrokes**: Click "Start Recording" to track typing activity, then "Stop Recording" to save
6. **Replay Recording**: Click "Play Recording" at your preferred speed (0.5x, 1x, 2x, 4x)

### Troubleshooting

#### Python `input()` Not Supported
Python's `input()` function is not supported in the browser environment. Use hardcoded values instead:
```python
# ❌ This won't work
name = input("Enter name: ")

# ✅ Use this instead
name = "John"
print(f"Hello, {name}")
```

#### C `scanf()` Not Supported
C's `scanf()` function is not supported in the browser environment. Use hardcoded values:
```c
// ❌ This won't work
int x;
scanf("%d", &x);

// ✅ Use this instead
int x = 42;
printf("Number: %d\n", x);
```

#### Slow First Python Load
The first time you run Python code, Pyodide needs to download (~50MB) and initialize. This takes 5-10 seconds. Subsequent runs are much faster.

#### Copy/Paste Blocked
By default, copy/paste is disabled for security. Click the "Copy/Paste" toggle button (shows as OFF/ON) to enable it when needed.

## Project Structure

```
wasm-compiler/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles with Tailwind
│   │   ├── layout.tsx       # Root layout with ThemeProvider
│   │   └── page.tsx         # Main compiler page
│   ├── components/
│   │   ├── CodeEditor.tsx   # Monaco Editor wrapper
│   │   ├── Header.tsx       # App header with theme toggle
│   │   ├── LanguageSelector.tsx
│   │   ├── OutputPanel.tsx  # Console output display
│   │   ├── StatusBar.tsx    # Execution status
│   │   └── ThemeProvider.tsx
│   ├── hooks/
│   │   ├── usePythonWorker.ts  # Pyodide Web Worker
│   │   └── useCWorker.ts       # C Interpreter Web Worker
│   └── types/
│       └── index.ts         # TypeScript types
├── next.config.js
├── tailwind.config.js
└── package.json
```

## How It Works

### Python (Pyodide)

1. Monaco Editor captures Python code
2. Code is sent to a Web Worker
3. Pyodide (CPython compiled to WASM) executes the code
4. stdout/stderr are captured and returned
5. Results displayed in Output Panel

### C (Interpreter)

1. Monaco Editor captures C code
2. Code is sent to a Web Worker
3. A lightweight C interpreter parses and executes the code
4. Supports: printf, variables, loops, conditionals, functions
5. Results displayed in Output Panel

## Extending for More Languages

To add support for additional languages:

1. Create a new worker hook in `src/hooks/`
2. Add the language to `LanguageSelector.tsx`
3. Add default code template in `page.tsx`
4. Configure Monaco Editor language support

## Future Enhancements

- [ ] Full Clang-to-WASM compilation for C
- [ ] JavaScript/TypeScript execution
- [ ] Rust via wasm-pack
- [ ] Multiple file support
- [ ] Input/stdin support
- [ ] Test case validation
- [ ] Supabase integration for saving code

## License

MIT
