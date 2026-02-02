'use client';

import { useRef, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, AlertTitle } from '@mui/material';
import { Terminal as TerminalIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';
import { ExecutionResult, ExecutionStatus } from '@/types';

interface MuiOutputPanelProps {
  result: ExecutionResult | null;
  status: ExecutionStatus;
}

export function MuiOutputPanel({ result, status }: MuiOutputPanelProps) {
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [result]);

  const hasError = result?.status === 'error' || status === 'error';
  const hasOutput = result?.stdout || result?.stderr;

  // Empty state
  if (!hasOutput && status !== 'running') {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 3,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <TerminalIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
          Output will appear here
        </Typography>
        <Typography variant="caption" color="text.disabled">
           Click <span style={{ 
            padding: '2px 8px', 
            borderRadius: 4, 
            backgroundColor: '#10b981', 
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 500,
          }}>Run</span>
        </Typography>
      </Box>
    );
  }

  // Running state
  if (status === 'running' && !hasOutput) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Executing code...
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
          Please wait while your code runs
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Success indicator */}
      {!hasError && result?.stdout && (
        <Alert 
          severity="success" 
          icon={<CheckCircleIcon fontSize="small" />}
          sx={{ 
            borderRadius: 0, 
            py: 0.5,
            '& .MuiAlert-message': { py: 0 },
          }}
        >
          <Typography variant="caption" fontWeight={500}>
            Execution completed successfully!
          </Typography>
        </Alert>
      )}

      {/* Error indicator */}
      {hasError && result?.stderr && (
        <Alert 
          severity="error" 
          icon={<ErrorIcon fontSize="small" />}
          sx={{ 
            borderRadius: 0, 
            py: 0.5,
            '& .MuiAlert-message': { py: 0 },
          }}
        >
          <Typography variant="caption" fontWeight={500}>
            Error occurred during execution
          </Typography>
        </Alert>
      )}

      {/* Output Content */}
      <Box
        component="pre"
        ref={outputRef}
        sx={{
          flex: 1,
          p: 2,
          m: 0,
          overflow: 'auto',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          bgcolor: 'background.default',
        }}
      >
        {result?.stdout && (
          <Typography
            component="span"
            sx={{
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              color: 'text.primary',
            }}
          >
            {result.stdout}
          </Typography>
        )}
        {result?.stderr && (
          <Typography
            component="span"
            sx={{
              display: result.stdout ? 'block' : 'inline',
              mt: result.stdout ? 2 : 0,
              pt: result.stdout ? 2 : 0,
              borderTop: result.stdout ? 1 : 0,
              borderColor: 'divider',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              color: 'error.main',
            }}
          >
            {result.stderr}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
