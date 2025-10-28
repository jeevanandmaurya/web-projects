//Database using LocalStorage - Simplified Implementation

//Main storage object for primary CRUD operations
const mainStorage = {
    prefix: 'note_',

    //Create Note
    createNote(note) {
        const key = this.prefix + note.id;
        const value = JSON.stringify(note.content);
        localStorage.setItem(key, value);
    },

    //Read Note
    readNote(id) {
        const key = this.prefix + id;
        const value = localStorage.getItem(key);
        if (value) {
            return { id, content: JSON.parse(value) };
        }
        return null;
    },

    //Update Note
    updateNote(note) {
        const key = this.prefix + note.id;
        const value = JSON.stringify(note.content);
        localStorage.setItem(key, value);
    },

    //Delete Note (moves to Trash)
    deleteNote(id) {
        const key = this.prefix + id;
        const value = localStorage.getItem(key);
        if (value) {
            const note = { id, content: JSON.parse(value) };
            trashStorage.trash(note, new Date().toISOString());
            localStorage.removeItem(key);
            return true;
        }
        return false;
    },

    //Get All Notes
    getAllNotesId() {
        const notesIds = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const noteId = key.replace(this.prefix, '');
                notesIds.push(noteId);
            }
        }
        return notesIds;
    },
    getAllNotes() {
        const notes = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const noteId = key.replace(this.prefix, '');
                const value = localStorage.getItem(key);
                notes.push({ id: noteId, content: JSON.parse(value) });
            }
        }
        return notes;
    },

    //Clear All Notes
    clearAllNotes() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
};

//Trash object for trash operations
const trashStorage = {
    prefix: 'trash_',

    //Trash a Note
    trash(note, deletedAt) {
        const key = this.prefix + note.id;
        const value = JSON.stringify({content: note.content, deletedAt: deletedAt || new Date().toISOString()});
        localStorage.setItem(key, value);
        
    },

    //Restore from Trash
    restore(id, mainStorage) {
        const key = this.prefix + id;
        const value = localStorage.getItem(key);
        if (value) {
            const data = JSON.parse(value);
            const note = { id, content: data.content };
            mainStorage.createNote(note);
            localStorage.removeItem(key);
            return true;
        }
        return false;
    },
    readTrash(id) {
        const key = this.prefix + id;
        const value = localStorage.getItem(key);
        if (value) {
            const data = JSON.parse(value);
            return { id, content: data.content, deletedAt: data.deletedAt };
        }
        return null;
    },

    //Permanent Delete from Trash
    permanentDelete(id) {
        const key = this.prefix + id;
        localStorage.removeItem(key);
    },

    //Get All Trashed Notes
    getAllTrashed() {
        const trashed = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const id = key.replace(this.prefix, '');
                const value = localStorage.getItem(key);
                const data = JSON.parse(value);
                trashed.push({ id, content: data.content, deletedAt: data.deletedAt });
            }
        }
        return trashed;
    },
    getAllTrashedId() {
        const trashedIds = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                const id = key.replace(this.prefix, '');
                trashedIds.push(id);
            }
        }
        return trashedIds;
    },

    //Clear All Trash
    clearAllTrash() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }
};

//Theme Context
const themeContext = {
    key: 'app_theme',
    getTheme() {
        return localStorage.getItem(this.key)||"light";
    },
    setTheme(theme) {
        localStorage.setItem(this.key, theme);
    }
};

//Export storage objects and compatibility functions
export { mainStorage, trashStorage, themeContext };
