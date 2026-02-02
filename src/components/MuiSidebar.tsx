'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  TextField,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
  InputAdornment,
  Button,
  Alert,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Add as AddIcon,
  InsertDriveFile as FileIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { SidebarTab, VirtualFile, Language, AppSettings } from '@/types';

interface MuiSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  files: VirtualFile[];
  activeFileId: string | null;
  currentLanguage: Language;
  onFileSelect: (fileId: string) => void;
  onFileCreate: (name: string, language: Language) => void;
  onFileRename: (id: string, newName: string) => void;
  onFileDelete: (id: string) => void;
  onSearchResultClick: (fileId: string, lineNumber: number) => void;
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onClearData: () => void;
}

const tabs = [
  { id: 'files' as SidebarTab, icon: <FolderIcon />, label: 'Explorer' },
  { id: 'search' as SidebarTab, icon: <SearchIcon />, label: 'Search' },
  { id: 'settings' as SidebarTab, icon: <SettingsIcon />, label: 'Settings' },
];

export function MuiSidebar({
  activeTab,
  onTabChange,
  files,
  activeFileId,
  currentLanguage,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
  onSearchResultClick,
  settings,
  onUpdateSetting,
  onClearData,
}: MuiSidebarProps) {
  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      {/* Tab Bar */}
      <Box
        sx={{
          width: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 1,
          bgcolor: 'background.default',
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        {tabs.map((tab) => (
          <Tooltip key={tab.id} title={tab.label} placement="right">
            <IconButton
              onClick={() => onTabChange(tab.id)}
              sx={{
                mb: 0.5,
                color: activeTab === tab.id ? 'primary.main' : 'text.secondary',
                bgcolor: activeTab === tab.id ? 'action.selected' : 'transparent',
                borderRadius: 2,
                '&:hover': {
                  bgcolor: activeTab === tab.id ? 'action.selected' : 'action.hover',
                },
              }}
            >
              {tab.icon}
            </IconButton>
          </Tooltip>
        ))}
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="User" placement="right">
          <IconButton sx={{ color: 'text.secondary' }}>
            <PersonIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Panel Content */}
      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {activeTab === 'files' && (
          <FileExplorerPanel
            files={files}
            activeFileId={activeFileId}
            currentLanguage={currentLanguage}
            onFileSelect={onFileSelect}
            onFileCreate={onFileCreate}
            onFileRename={onFileRename}
            onFileDelete={onFileDelete}
          />
        )}
        {activeTab === 'search' && (
          <SearchPanel
            files={files}
            onFileSelect={onFileSelect}
            onResultClick={onSearchResultClick}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onUpdateSetting={onUpdateSetting}
            onClearData={onClearData}
          />
        )}
      </Box>
    </Box>
  );
}

// File Explorer Panel
function FileExplorerPanel({
  files,
  activeFileId,
  currentLanguage,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
}: {
  files: VirtualFile[];
  activeFileId: string | null;
  currentLanguage: Language;
  onFileSelect: (fileId: string) => void;
  onFileCreate: (name: string, language: Language) => void;
  onFileRename: (id: string, newName: string) => void;
  onFileDelete: (id: string) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; fileId: string } | null>(null);

  // Show all files, not filtered by language
  const displayedFiles = files;

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim(), currentLanguage);
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleRenameFile = () => {
    if (editingFileId && editingFileName.trim()) {
      onFileRename(editingFileId, editingFileName.trim());
      setEditingFileId(null);
      setEditingFileName('');
    }
  };

  const handleContextMenu = (event: React.MouseEvent, fileId: string) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, fileId });
  };

  const handleCloseMenu = () => setContextMenu(null);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Explorer
        </Typography>
        <Tooltip title="New File">
          <IconButton size="small" onClick={() => setIsCreating(true)}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ px: 1, py: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5 }}>
          <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
            Project
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {isCreating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5 }}>
            <TextField
              size="small"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') { setIsCreating(false); setNewFileName(''); }
              }}
              placeholder="filename.py"
              autoFocus
              sx={{ flex: 1, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }}
            />
            <IconButton size="small" onClick={handleCreateFile}><CheckIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => { setIsCreating(false); setNewFileName(''); }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        )}

        <List dense disablePadding>
          {displayedFiles.map((file) => (
            <ListItem
              key={file.id}
              disablePadding
              secondaryAction={
                editingFileId !== file.id && (
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleContextMenu(e, file.id)}
                    sx={{ opacity: 0, '.MuiListItem-root:hover &': { opacity: 1 } }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )
              }
              onContextMenu={(e) => handleContextMenu(e, file.id)}
            >
              <ListItemButton
                selected={activeFileId === file.id}
                onClick={() => onFileSelect(file.id)}
                sx={{ borderRadius: 1, py: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Box
                    component="img"
                    src={file.name.endsWith('.py') ? '/python.svg' : file.name.endsWith('.c') ? '/c.svg' : undefined}
                    alt=""
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: 0.5,
                    }}
                  />
                </ListItemIcon>
                {editingFileId === file.id ? (
                  <TextField
                    size="small"
                    value={editingFileName}
                    onChange={(e) => setEditingFileName(e.target.value)}
                    onBlur={handleRenameFile}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameFile();
                      if (e.key === 'Escape') { setEditingFileId(null); setEditingFileName(''); }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    sx={{ flex: 1, '& .MuiInputBase-input': { py: 0.25, fontSize: '0.875rem' } }}
                  />
                ) : (
                  <ListItemText primary={file.name} primaryTypographyProps={{ variant: 'body2', noWrap: true }} />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={() => {
          const file = files.find(f => f.id === contextMenu?.fileId);
          if (file) { setEditingFileId(file.id); setEditingFileName(file.name); }
          handleCloseMenu();
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (contextMenu?.fileId && confirm('Delete this file?')) onFileDelete(contextMenu.fileId);
          handleCloseMenu();
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

// Search Panel
function SearchPanel({
  files,
  onFileSelect,
  onResultClick,
}: {
  files: VirtualFile[];
  onFileSelect: (fileId: string) => void;
  onResultClick: (fileId: string, lineNumber: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ fileId: string; fileName: string; line: number; content: string; matchStart: number; matchEnd: number }>>([]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }

    const searchResults: typeof results = [];
    files.forEach((file) => {
      const lines = file.content.split('\n');
      lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const matchIndex = lowerLine.indexOf(lowerQuery);
        if (matchIndex !== -1) {
          searchResults.push({
            fileId: file.id,
            fileName: file.name,
            line: index + 1,
            content: line.trim(),
            matchStart: matchIndex,
            matchEnd: matchIndex + query.length,
          });
        }
      });
    });
    setResults(searchResults.slice(0, 50));
  }, [query, files]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Search
        </Typography>
      </Box>
      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search in files..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>,
          }}
        />
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        {results.length > 0 ? (
          <List dense disablePadding>
            {results.map((result, idx) => (
              <ListItem key={idx} disablePadding>
                <ListItemButton onClick={() => onResultClick(result.fileId, result.line)} sx={{ borderRadius: 1 }}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="primary.main">{result.fileName}</Typography>
                      <Typography variant="caption" color="text.disabled">:{result.line}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block' }} noWrap>
                      {result.content}
                    </Typography>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : query ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No results found</Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Type to search in files</Typography>
        )}
      </Box>
    </Box>
  );
}

// Settings Panel
function SettingsPanel({
  settings,
  onUpdateSetting,
  onClearData,
}: {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onClearData: () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Settings
        </Typography>
      </Box>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Editor Settings */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Editor</Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Font Size: {settings.fontSize}px</Typography>
            <Slider
              value={settings.fontSize}
              onChange={(_, value) => onUpdateSetting('fontSize', value as number)}
              min={10}
              max={24}
              step={1}
              size="small"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Tab Size: {settings.tabSize}</Typography>
            <Slider
              value={settings.tabSize}
              onChange={(_, value) => onUpdateSetting('tabSize', value as number)}
              min={2}
              max={8}
              step={2}
              size="small"
            />
          </Box>

          <FormControlLabel
            control={<Switch checked={settings.showLineNumbers} onChange={(e) => onUpdateSetting('showLineNumbers', e.target.checked)} size="small" />}
            label={<Typography variant="body2">Show Line Numbers</Typography>}
          />

          <FormControlLabel
            control={<Switch checked={settings.wordWrap} onChange={(e) => onUpdateSetting('wordWrap', e.target.checked)} size="small" />}
            label={<Typography variant="body2">Word Wrap</Typography>}
          />
        </Paper>

        {/* Clear Data */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Data & Storage</Typography>
          <Button
            variant={confirmClear ? 'contained' : 'outlined'}
            color="error"
            size="small"
            onClick={() => {
              if (confirmClear) { onClearData(); setConfirmClear(false); }
              else { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); }
            }}
          >
            {confirmClear ? 'Confirm Clear All' : 'Clear All Data'}
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
