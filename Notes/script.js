
import { mainStorage, trashStorage, themeContext } from './database.js';

//loading elements
const body = document.body
const sidebarToggle = document.getElementById("sidebarToggle")
const sidebarItems = document.querySelectorAll(".menu-item")
const themeToggle = document.getElementById("themeToggle")
const buttons = document.getElementsByName("button")
const sidebar = document.querySelector(".sidebar")

//Event Listeners
//Theme Toggle
themeToggle.addEventListener('click', function () {
    if (themeContext.getTheme() === "light") {
        themeContext.setTheme("dark");
    } else {
        themeContext.setTheme("light");
    }
    applyTheme(themeContext.getTheme());
})

//Sidebar Toggle
sidebarToggle.addEventListener('click', function () {
    body.classList.toggle("sidebar-hide")
    sidebarToggle.innerText = body.classList.contains("sidebar-hide") ? ">" : "<"
})

//Sidebar Item Selection
sidebarItems.forEach(item => {
    item.addEventListener('click', function () {
        if (item.classList.contains("active")) return;
        sidebarItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        switchTab(item.id);
    });
});

//Dashboard

//Note Management
const dashboard = document.querySelector(".dashboard");
const noteList = document.querySelector(".noteList");
const notesContainer = document.querySelector(".notesContainer");
const noteEditor = document.querySelector(".noteEditor");

//Trash Management
const trash = document.querySelector(".trash");
const trashActions = document.querySelector(".trashActions");
const trashContainer = document.querySelector(".trashContainer");

//Functions
//View Toggle
let firstLoad = true;
function switchTab(id) {
    if (id === "notes") {
        showListView();
    } else if (id === "trash") {
        showTrashView();
    }
}
function showListView() {

    if (!hideTrashView()) {
        noteList.style.display = 'flex';
        noteEditor.style.display = 'none';
    }
    dashboard.style.display = 'flex';

    if (firstLoad) {
        loadNotes();
        firstLoad = false;
    }
}
function hideListView() {
    dashboard.style.display = 'none';
}
function showEditorView(noteId) {
    noteList.style.display = 'none';
    noteEditor.style.display = 'flex';
    noteEditor.noteId = noteId;
    renderNote(noteId);
}
function applyTheme(theme) {
    if (theme === "dark") {
        body.classList.add("dark-theme");
    } else {
        body.classList.remove("dark-theme");
    }
}
function createNoteObject(id) {
    return {
        id: id,
        content: {
            title: "",
            body: ""
        }
    };
}
function createNoteCard(noteId) {
    const noteCard = document.createElement('div');
    const note = mainStorage.readNote(noteId);
    noteCard.className = 'noteCard';
    noteCard.id = noteId;
    noteCard.innerHTML = `
        <h3>${note.content.title}</h3>
        <p>${note.content.body}</p>
        <div class="noteActions">
            <button class="editBtn">Edit</button>
            <button class="deleteBtn">Delete</button>
        </div>
    `;
    return noteCard;
}
function updateNoteCard(noteId) {
    const noteCard = document.getElementById(noteId);
    const note = mainStorage.readNote(noteId);
    if (note) {
        noteCard.querySelector('h3').innerText = note.content.title;
        noteCard.querySelector('p').innerText = note.content.body;
    } else {
        notesContainer.removeChild(noteCard);
    }
}
function loadNotes() {
    const notesIds = mainStorage.getAllNotesId();
    notesIds.forEach(noteId => {
        const noteCard = createNoteCard(noteId);
        notesContainer.append(noteCard);
    });
}
function renderNote(noteId) {
    const note = mainStorage.readNote(noteId);
    if (note) {
        noteEditor.querySelector('#noteTitle').value = note.content.title;
        noteEditor.querySelector('#noteContent').value = note.content.body;
    }
}
async function renderOverlay(type) {
    //type: 'deleteWarning', 'closeWarning', 'savedMessage'
    //set display to absolute for corresponding type
    document.querySelector(".overlayContainer").style.display = 'block';
    const overlayBox = document.querySelector(`.${type}`);

    overlayBox.style.display = 'flex';
    if (type !== 'savedMessage') {
        let savedMessage = document.querySelector(".savedMessage")
        savedMessage.style.display = 'none';
        savedMessage.classList.remove("popup");
    }
    const confirmation = await new Promise((resolve) => {
        if (type === 'savedMessage') {
            overlayBox.classList.add("popup");
            setTimeout(() => {
                overlayBox.style.display = 'none';
                if (overlayBox.classList.contains("popup")) {
                    overlayBox.classList.remove("popup");
                    resolve("Saved");
                }
            }, 5000);

        } else if (type === 'deleteWarning') {
            //wait of Click , dont exit without confirmation
            //Confirmation handling
            overlayBox.querySelector('.confirmDelete').addEventListener('click', function () {
                overlayBox.style.display = 'none';
                resolve("Yes");
            });
            overlayBox.querySelector('.cancelDelete').addEventListener('click', function () {
                overlayBox.style.display = 'none';
                resolve("No");
            });
        } else if (type === 'closeWarning') {
            //Confirmation handling
            overlayBox.querySelector('.saveAndClose').addEventListener('click', function () {
                overlayBox.style.display = 'none';
                resolve("Yes");
            });
            overlayBox.querySelector('.discardAndClose').addEventListener('click', function () {
                overlayBox.style.display = 'none';
                resolve("No");
            });
            overlayBox.querySelector('.cancelClose').addEventListener('click', function () {
                overlayBox.style.display = 'none';
                resolve("Cancel");
            });
        }
    });
    document.querySelector(".overlayContainer").style.display = 'none';
    return confirmation;
}

//Event Listeners

//New Note
const newNote = document.querySelector(".newNote");

newNote.addEventListener('click', function () {

    const noteId = `${Date.now()}`;
    const note = createNoteObject(noteId);
    mainStorage.createNote(note);
    const noteCard = createNoteCard(noteId);
    notesContainer.append(noteCard);
    //Open New Note in Editor
    showEditorView(noteId);
})
//Note Card Actions
noteList.addEventListener('click', async function (e) {
    //Delete Note
    if (e.target.classList.contains('deleteBtn')) {
        const noteCard = e.target.closest('.noteCard');
        const noteId = noteCard.id;

        let confirmation = await renderOverlay('deleteWarning');
        if (confirmation !== "Yes") {
            return;
        }
        mainStorage.deleteNote(noteId);
        notesContainer.removeChild(document.getElementById(noteId));
        //trashing note card
        const trashCard = createTrashCard(noteId);
        trashContainer.append(trashCard);
    }
    //Edit Note
    else if (e.target.classList.contains('editBtn')) {
        const noteCard = e.target.closest('.noteCard');
        const noteId = noteCard.id;
        showEditorView(noteId);
    }
});

//Note Editor Actions
noteEditor.addEventListener('click', async function (e) {

    //Save Note
    if (e.target.classList.contains('saveBtn')) {
        const noteId = noteEditor.noteId;
        const note = mainStorage.readNote(noteId);
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        note.content.title = title;
        note.content.body = content;
        mainStorage.updateNote(note);
        updateNoteCard(noteId);

        renderOverlay('savedMessage');

    }
    //Delete Note 
    else if (e.target.classList.contains('deleteBtn')) {
        const noteId = noteEditor.noteId;

        let confirmation = await renderOverlay('deleteWarning');
        if (confirmation !== "Yes") {
          
            return;
        }
        mainStorage.deleteNote(noteId);
        updateNoteCard(noteId);
        //trashing note card
        const trashCard = createTrashCard(noteId);
        trashContainer.append(trashCard);
     
        showListView();

    }
    //Close Editor
    else if (e.target.classList.contains('closeBtn')) {
        const confirmation = await renderOverlay('closeWarning');
        if (confirmation === "Yes") {
            
            // saveChanges();
            showListView();

        } else if (confirmation === "No") {
            showListView();
          
        } else {
           
        }
    }
});


//Time update in Editor
const datetimeSpan = document.getElementById('datetime');
setInterval(() => {
    const now = new Date();
    datetimeSpan.innerText = now.toLocaleString();
}, 1000);

// Initialize to list view
showListView();
// Apply Default/Saved Theme
applyTheme(themeContext.getTheme());




//Functions for Trash Management will go here
let firstLoadTrash = true;
function showTrashView() {
    hideListView();
    trash.style.display = 'flex';
}
function hideTrashView() {
    if (trash.style.display === 'flex') {
        trash.style.display = 'none';
        return true;
    }
    return false;
}
function loadTrashNotes() {
  
    const trashIds = trashStorage.getAllTrashedId();
    trashIds.forEach(trashId => {
        const trashCard = createTrashCard(trashId);
        trashContainer.append(trashCard);
    });
}
function createTrashCard(trashId) {
 
    const trashCard = document.createElement('div');
    const trashedNote = trashStorage.readTrash(trashId);
    trashCard.className = 'trashCard';
    trashCard.id = trashId;
    trashCard.innerHTML = `
        <h3>${trashedNote.content.title}</h3>
        <p>${trashedNote.content.body}</p>
        <div class="noteActions">
            <button class="restoreBtn">Restore</button>
            <button class="permanentDeleteBtn">Delete Permanently</button>
        </div>
    `;
    return trashCard;
}

//Event Listeners for Trash Actions
trashActions.querySelector('.restoreAllBtn').addEventListener('click', async function () {

       
    let confirmation = await renderOverlayNew('Are you sure you want to restore all notes from trash?', [
        { id: 'confirmRestoreAll', label: 'Yes' },
        { id: 'cancelRestoreAll', label: 'No' }
    ]);
    if (confirmation !== "confirmRestoreAll") {
    
        return;
    }
    
    const trashIds = trashStorage.getAllTrashedId();
    trashIds.forEach(trashId => {
        trashStorage.restore(trashId, mainStorage);
        notesContainer.append(createNoteCard(trashId));
        
    });
    trashContainer.innerHTML = '';
});
trashActions.querySelector('.emptyTrashBtn').addEventListener('click', async function () {

    let confirmation = await renderOverlayNew('Are you sure you want to permanently delete all notes from trash?', [
        { id: 'confirmEmptyTrash', label: 'Yes' },
        { id: 'cancelEmptyTrash', label: 'No' }
    ]);
  
    if (confirmation !== "confirmEmptyTrash") {
        return;
    }
    trashStorage.clearAllTrash();
    trashContainer.innerHTML = '';
  
});

trashContainer.addEventListener('click', async function (e) {
    //Restore Note
    if (e.target.classList.contains('restoreBtn')) {

        let confirmation = await renderOverlayNew('Are you sure you want to restore this note from trash?', [
            { id: 'confirmRestore', label: 'Yes' },
            { id: 'cancelRestore', label: 'No' }
        ]);

        if (confirmation !== "confirmRestore") {
          
            return;
        }

        const trashCard = e.target.closest('.trashCard');
        const trashId = trashCard.id;
        trashStorage.restore(trashId, mainStorage);
        trashContainer.removeChild(trashCard);
        notesContainer.append(createNoteCard(trashId));
 
    }
    //Permanent Delete
    else if (e.target.classList.contains('permanentDeleteBtn')) {

        let confirmation = await renderOverlayNew('Are you sure you want to permanently delete this note from trash?', [
            { id: 'confirmPermanentDelete', label: 'Yes' },
            { id: 'cancelPermanentDelete', label: 'No' }
        ]);

        if (confirmation !== "confirmPermanentDelete") {
    
            return;
        }

        const trashCard = e.target.closest('.trashCard');
        const trashId = trashCard.id;
        trashStorage.permanentDelete(trashId);
        trashContainer.removeChild(trashCard);

    }
});

// Initialize Trash
if (firstLoadTrash) {
    loadTrashNotes();
    firstLoadTrash = false;
}



//Overlay Management Functions with advance features will go here
async function renderOverlayNew(question,options) {
    //question is text
    //options is array of options {yes: 'Yes', no: 'No', cancel: 'Cancel'}
    const overlay = document.querySelector('.dynamic-overlay');
    overlay.style.display = 'flex';
    overlay.parentElement.style.display = 'block';
    overlay.innerHTML = `
        <h3>${question}</h3>
        <div class="confirmationBtns">
            ${options.map(option => `<button id="${option.id}">${option.label}</button>`).join('')}
        </div>
    `;

    const confirmation = await new Promise((resolve) => {
        options.forEach(option => {
            overlay.querySelector(`#${option.id}`).addEventListener('click', function () {
                overlay.style.display = 'none';
                overlay.parentElement.style.display = 'none';
                resolve(option.id);
            });
        });
    });
    return confirmation;
}
