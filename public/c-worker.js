// C Compiler Web Worker - Module type worker for ES imports
// This worker imports from browsercc and handles C compilation

import { compile } from './browsercc/index-c.js';
import { WASI, File, OpenFile, ConsoleStdout } from './browsercc/browser_wasi_shim.js';

let isReady = false;

// Initialize compiler
async function initCompiler() {
  try {
    self.postMessage({ type: 'status', data: 'Loading C compiler...' });
    self.postMessage({ type: 'progress', data: 20 });
    
    // Test that imports work by checking if compile function exists
    if (typeof compile !== 'function') {
      throw new Error('Compile function not loaded');
    }
    
    self.postMessage({ type: 'progress', data: 60 });
    self.postMessage({ type: 'status', data: 'Compiler loaded!' });
    
    // Mark as ready
    isReady = true;
    self.postMessage({ type: 'progress', data: 100 });
    self.postMessage({ type: 'status', data: 'Ready' });
    self.postMessage({ type: 'ready' });
    
  } catch (error) {
    console.error('C compiler init error:', error);
    const errorMessage = error.message || String(error);
    let userMessage = 'Failed to load C compiler';
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      userMessage = 'Network error: Unable to download C compiler. Check your connection.';
    } else {
      userMessage = 'Failed to initialize C compiler: ' + errorMessage;
    }
    
    self.postMessage({ type: 'error', error: userMessage });
  }
}

// Compile and run C code
async function compileAndRun(sourceCode) {
  if (!isReady) {
    return {
      stdout: '',
      stderr: 'Compiler not ready',
      status: 'error',
      executionTime: 0
    };
  }
  
  const startTime = performance.now();
  let stdout = '';
  let stderr = '';
  
  try {
    self.postMessage({ type: 'status', data: 'Compiling...' });
    
    // Compile the code using browsercc
    const { module: wasmModule, compileOutput } = await compile({
      source: sourceCode,
      fileName: 'main.c',
      flags: ['-std=c17']
    });
    
    // Capture compile output
    if (compileOutput) {
      stderr += compileOutput;
    }
    
    if (!wasmModule) {
      const executionTime = performance.now() - startTime;
      return {
        stdout: '',
        stderr: stderr || 'Compilation failed',
        status: 'error',
        executionTime
      };
    }
    
    self.postMessage({ type: 'status', data: 'Running...' });
    
    // Set up WASI runtime
    const stdin = new Uint8Array(0);
    const fds = [
      new OpenFile(new File(stdin)),  // stdin
      new ConsoleStdout((data) => {   // stdout
        stdout += new TextDecoder().decode(data);
      }),
      new ConsoleStdout((data) => {   // stderr
        stderr += new TextDecoder().decode(data);
      }),
    ];
    
    const wasi = new WASI([], [], fds);
    
    // Instantiate and run
    const instance = await WebAssembly.instantiate(wasmModule, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
    
    const exitCode = wasi.start(instance);
    const executionTime = performance.now() - startTime;
    
    self.postMessage({ type: 'status', data: 'Ready' });
    
    return {
      stdout,
      stderr,
      status: exitCode === 0 ? 'success' : 'error',
      executionTime
    };
    
  } catch (error) {
    const executionTime = performance.now() - startTime;
    const errorMessage = error.message || String(error);
    
    // Handle normal program exit
    if (errorMessage.includes('exit with exit code 0')) {
      self.postMessage({ type: 'status', data: 'Ready' });
      return {
        stdout,
        stderr,
        status: 'success',
        executionTime
      };
    }
    
    self.postMessage({ type: 'status', data: 'Ready' });
    return {
      stdout,
      stderr: stderr + '\n' + errorMessage,
      status: 'error',
      executionTime
    };
  }
}

// Message handler
self.onmessage = async function(e) {
  const { type, code } = e.data;
  
  if (type === 'init') {
    await initCompiler();
  } else if (type === 'run') {
    const result = await compileAndRun(code);
    self.postMessage({ type: 'result', result });
  }
};
