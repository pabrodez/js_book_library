// Firebase configuration
let firebaseConfig = {
    apiKey: "AIzaSyDVKIpqKH-bE4bYpbo1Kic2cNDN2_OgHSE",
    authDomain: "jslibrary-bb192.firebaseapp.com",
    databaseURL: "https://jslibrary-bb192.firebaseio.com",
    projectId: "jslibrary-bb192",
    storageBucket: "jslibrary-bb192.appspot.com",
    messagingSenderId: "142042406858",
    appId: "1:142042406858:web:13b30e73c57480896c7933"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let database = firebase.database();

// book class
class Book {
  constructor(title, author, pages, read, id) {
    this.title = title;
    this.author = author;
    this.pages = pages;
    this.read = read;
    this.id = id;
  }
}

// array of books
let currentLibrary = [];

// data snapshot to array when initializing UI and render
// returns array of objects, and each object has a book key property and its value is the book object
function getDatabaseToArrayRunFunc (funcToRun) {
  database.ref('/books').once('value', (snap) => {  
    let afa = JSON.parse(JSON.stringify(snap.val()));
    afa = Object.values(afa);    
    funcToRun(afa)
  });
}
getDatabaseToArrayRunFunc(render);

function addBookToDatabase (inputs) {
  // assumes inputs is the result of calling form.elements
  let newKey = database.ref('books').push().key;
  let newBook = new Book(inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, newKey);
  database.ref('books/' + newBook.id).set(newBook);
}

function removeBookFromDatabase (key) {
  database.ref('/books').once('value', (snap) => {  
    let afa = JSON.parse(JSON.stringify(snap.val()));
    afa = Object.values(afa); 
    database.ref('/books/' + key).remove();
  });
}

// takes array of book objects and displays list item with properties
function render(array) {     
  array.forEach((elem) => {
    let elemValues = Object.values(elem);
    let bookObject = elem;       
    
    let li = document.createElement('li');
    li.setAttribute("data-id", elem.id);
    li.classList.add('book-box');
    
    let buttonRead = document.createElement("button");
    buttonRead.classList.add('not-read');
    if (elem.read === "true") {buttonRead.classList.add('read')};
    buttonRead.addEventListener('click', (event) => {       
      database.ref("/books").once('value', (snap) => {  
        let afa = JSON.parse(JSON.stringify(snap.val()));
        afa = Object.values(afa);
        let bookId = event.target.parentNode.parentNode.getAttribute("data-id"); 
        let foundBook = afa.find((e) => e.id == bookId);
        database.ref("/books/" + bookId).update({read: `${foundBook.read == "true" ? "false" : "true"}`});
        event.target.classList.toggle('read');  
      });
    });     
    
    let buttonRemove = document.createElement("button");
    buttonRemove.classList.add('buttonRemove');
    buttonRemove.addEventListener('click', (event) => {
      let bookId = event.target.parentNode.parentNode.getAttribute('data-id');  
      database.ref('/books/' + bookId).remove();
      event.target.parentNode.parentNode.remove();
    });    
    
    let buttonEdit = document.createElement("button");
    buttonEdit.innerText = "Edit";
    buttonEdit.classList.add('buttonEdit');
    buttonEdit.addEventListener('click', (e) => {
      let bookId = e.target.parentNode.parentNode.getAttribute('data-id');
      document.querySelector('.modal-form').setAttribute('data-book', bookId);
      database.ref('books/' + bookId).once('value', (snap) => {        
        let formElems = document.querySelector(".modal-form").elements;
        let book = snap.val();
        formElems[0].value = book.title;
        formElems[1].value = book.author;
        formElems[2].value = book.pages;
        formElems[3].value = book.read;
        bookForm.classList.toggle("open");
        modalBack.classList.toggle("open");
      })      
    });
     
    let bookRow = `<div class="details"><h3>${bookObject.title}</h3><h5>${bookObject.author}</h5><p>${bookObject.pages} pages</p></div>`;
    li.insertAdjacentHTML('afterbegin', bookRow);
    let actionList = document.createElement('div');
    actionList.classList.add('action-list');
    [buttonRead, buttonRemove, buttonEdit].forEach(button => actionList.appendChild(button));
    li.appendChild(actionList);
    
    document.querySelector('#bookList').appendChild(li);
        
  })
}

// button to show form
let buttShowForm = document.querySelector("#show-form");
let modalBack = document.querySelector(".modal-back");
buttShowForm.addEventListener("click", () => {
  bookForm.classList.toggle("open");
  modalBack.classList.toggle("open");
});

// button to close form
document.querySelector("#close-form").addEventListener('click', () => {
  bookForm.classList.toggle("open");
  modalBack.classList.toggle("open");
  bookForm.setAttribute('data-book', "");
  bookForm.reset();
})

// logic for adding/updating book with form
let bookForm = document.querySelector(".modal-form");
bookForm.addEventListener("submit", (e) => {
  // if data-book attr is populated, it's an update, else add a new book  
  if (e.target.getAttribute('data-book')) {
    let bookId = e.target.getAttribute('data-book');
    let formElem = bookForm.elements;
    database.ref('books/' + bookId).update({
      title:  formElem[0].value,
      author: formElem[1].value,
      pages:  formElem[2].value,
      read:   formElem[3].value
    }, (error) => {
      if (error) {
        console.log("Error on update:" + error);
      } else {
        let details = document.querySelector(`[data-id=${bookId}]`).childNodes;
        let formElems = document.querySelector(".modal-form").elements;
        details[0].childNodes[0].innerText = formElems[0].value;
        details[0].childNodes[1].innerText = formElems[1].value;
        details[0].childNodes[2].innerText = formElems[2].value;
        formElems[3].value ==  "true" ? details[1].childNodes[0].classList.add('read') : details[1].childNodes[0].classList.remove('read');
        
        bookForm.setAttribute('data-book', "");
        bookForm.reset();
        bookForm.classList.toggle("open");
        modalBack.classList.toggle("open");
      }
    });
  } else {
    let formElem = bookForm.elements;
    addBookToDatabase(formElem);
    database.ref('books').once('value', (snap) => {
      let library = JSON.parse(JSON.stringify(snap.val()));
      library = Object.values(library);
      render(library.slice(-1));
    })
    bookForm.reset();
    bookForm.classList.toggle("open");
    modalBack.classList.toggle("open");
  }
});