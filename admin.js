const fileListElement = document.getElementById('quiz-file-list');
const unavailableBanner = document.getElementById('admin-unavailable');
const emptyState = document.getElementById('admin-empty');
const editorPanel = document.getElementById('admin-editor');
const filenameElement = document.getElementById('editor-filename');
const hintElement = document.getElementById('editor-hint');
const contentElement = document.getElementById('editor-content');
const statusElement = document.getElementById('admin-status');
const saveButton = document.getElementById('save-btn');
const reloadButton = document.getElementById('reload-btn');

let currentFile = null;
let originalContent = '';
let apiAvailable = false;

async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        cache: 'no-store',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
    }
    return data;
}

function setStatus(message, type = '') {
    statusElement.textContent = message;
    statusElement.className = `admin-status${type ? ` ${type}` : ''}`;
}

function setDirty(isDirty) {
    saveButton.textContent = isDirty ? 'Save file *' : 'Save file';
}

async function loadFileList() {
    const data = await apiFetch('/api/quiz-files');
    fileListElement.innerHTML = '';

    data.files.forEach(filename => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `quiz-file-btn${filename === currentFile ? ' active' : ''}`;
        button.textContent = filename;
        button.addEventListener('click', () => openFile(filename));
        item.appendChild(button);
        fileListElement.appendChild(item);
    });
}

async function openFile(filename, forceReload = false) {
    if (!forceReload && currentFile === filename && contentElement.value === originalContent) {
        highlightActiveFile(filename);
        return;
    }

    if (currentFile && contentElement.value !== originalContent && !forceReload) {
        const keepEditing = confirm('You have unsaved changes. Discard them and open another file?');
        if (!keepEditing) return;
    }

    const data = await apiFetch(`/api/quiz/${encodeURIComponent(filename)}`);
    currentFile = filename;
    originalContent = data.content;
    contentElement.value = data.content;
    filenameElement.textContent = filename;
    hintElement.textContent = filename === 'manifest.md'
        ? 'Controls which quiz files appear in the game and their order.'
        : 'Edit difficulty, timing, and other quiz rules in the JSON config block.';
    emptyState.hidden = true;
    editorPanel.hidden = false;
    setDirty(false);
    setStatus('');
    highlightActiveFile(filename);
}

function highlightActiveFile(filename) {
    fileListElement.querySelectorAll('.quiz-file-btn').forEach(button => {
        button.classList.toggle('active', button.textContent === filename);
    });
}

async function saveCurrentFile() {
    if (!currentFile) return;

    saveButton.disabled = true;
    setStatus('Saving…');

    try {
        await apiFetch(`/api/quiz/${encodeURIComponent(currentFile)}`, {
            method: 'POST',
            body: JSON.stringify({ content: contentElement.value })
        });
        originalContent = contentElement.value;
        setDirty(false);
        setStatus(`Saved ${currentFile}. Reload the game to pick up changes.`, 'success');
    } catch (error) {
        setStatus(error.message, 'error');
    } finally {
        saveButton.disabled = false;
    }
}

contentElement.addEventListener('input', () => {
    setDirty(contentElement.value !== originalContent);
    if (statusElement.classList.contains('success')) {
        setStatus('');
    }
});

saveButton.addEventListener('click', () => void saveCurrentFile());
reloadButton.addEventListener('click', () => {
    if (!currentFile) return;
    void openFile(currentFile, true);
});

document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        void saveCurrentFile();
    }
});

async function init() {
    try {
        await loadFileList();
        apiAvailable = true;
        unavailableBanner.hidden = true;
    } catch {
        apiAvailable = false;
        unavailableBanner.hidden = false;
        fileListElement.innerHTML = '<li><span class="admin-hint">Start <code>python3 serve.py</code> to load files.</span></li>';
    }
}

void init();
