
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getDatabase, ref, child, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { app, auth, db, db1 } from "./firebase.js";

const displayIme = document.getElementById("prikaziIme");
const opis = document.getElementById("opis");
let wishlistDiv = document.getElementById("wishlistDiv");
let citamDiv = document.getElementById("citamDiv");
let recenzijeDiv = document.getElementById("recenzijeDiv");
let vaseListeDiv = document.getElementById("vaseListe");
const urlUserId = window.location.hash.substring(1);
const neubrajaj = ["wishlist", "citam", "name", "recenzije", "description", "id", "pfp"];

async function provjeraAdmina(userId) {
    try {
        const snap = await get(ref(db, `admin/${userId}`));
        return snap.val() === true;
    } catch {
        return false;
    }
}

async function provjeriCurrentUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userIdToDisplay = urlUserId || user.uid;

            get(ref(db, "Korisnik/" + userIdToDisplay))
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const korisnik = snapshot.val();

                        let username = korisnik.name;
                        displayIme.innerText = username;

                        let description = korisnik.description || "No description";
                        opis.innerText = description;

                        if (user.uid === userIdToDisplay || provjeraAdmina(user.uid)) {

                            const deleteBtn = document.createElement("button");
                            deleteBtn.textContent = "Izbriši profil";
                            deleteBtn.addEventListener("click", () => deleteUserProfile(userIdToDisplay));
                            deleteBtn.className = "btn mt-[50px] text-[var(--light)] w-[250px] font-bold bg-[var(--bluish)] border rounded p-2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-md";
                            document.querySelector(".deleteBox").appendChild(deleteBtn);
                        }

                        wishlist(userIdToDisplay);
                        citam(userIdToDisplay);
                        stvoriRecenzije(userIdToDisplay);
                        vaseListe(userIdToDisplay);
                    } else {
                        console.log("User data nije pronadeno");
                    }
                });
        }
    });
}

function vaseListe(userId) {
    vaseListeDiv.innerHTML = "";

    get(ref(db, "Korisnik/" + userId))
        .then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                let hasLists = false;

                Object.keys(userData).forEach(listName => {
                    if (!neubrajaj.includes(listName.toLowerCase())) {
                        hasLists = true;
                        const lista = userData[listName];

                        let divLista = document.createElement("div");
                        divLista.className = " flex-col flex p-3 rounded-2xl p-2 gap-5 bg-[var(--superlight)]  ";
                        divLista.innerHTML = `<h2 class="ml-[50px] text-2xl font-extrabold text-[var(--darkbrown)]">${listName}</h2><div class="booksContainer max-h-[480px] flex flex-row gap-3 items-center overflow-auto"></div>`;

                        const booksContainer = divLista.querySelector(".booksContainer");

                        Object.keys(lista).forEach((bookId) => {
                            const book = lista[bookId];
                            let knjiga = stvoriKnjigu(book);
                            booksContainer.innerHTML += knjiga;
                        });

                        vaseListeDiv.appendChild(divLista);
                    }
                });

                if (!hasLists) {
                    vaseListeDiv.innerHTML = "Nema knjiga...";
                }
            } else {
                vaseListeDiv.innerHTML = "Nema knjiga...";
            }
        })
        .catch((error) => {
            vaseListeDiv.innerHTML = "Došlo je do greške pri učitavanju..." +error;
        });
}

function wishlist(userId) {
    get(ref(db, "Korisnik/" + userId + "/wishlist"))
        .then((snapshot) => {
            if (snapshot.exists()) {
                const books = snapshot.val();

                Object.keys(books).forEach((bookId) => {
                    const book = books[bookId];

                    // console.log(book.idBook);

                    let knjiga = stvoriKnjigu(book);

                    wishlistDiv.innerHTML += knjiga;
                });
            } else {
                wishlistDiv.innerHTML = "Nema knjiga...";
            }
        })
        .catch((error) => {
            console.error("Error kod wishlist:", error);
        });
}

function citam(userId) {
    get(ref(db, "Korisnik/" + userId + "/citam"))
        .then((snapshot) => {
            if (snapshot.exists()) {
                const books = snapshot.val();

                Object.keys(books).forEach((bookId) => {
                    const book = books[bookId];

                    // console.log(book.idBook);

                    let knjiga = stvoriKnjigu(book);

                    citamDiv.innerHTML += knjiga;
                });
            } else {
                citamDiv.innerHTML += "Nema knjiga...";

            }
        })
        .catch((error) => {
            console.error("Error kod citam:", error);
        });
}

function stvoriKnjigu(book) {
    const authors = book.volumeInfo && book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "";
    // console.log(authors)
    const knjiga = `
          <div id="${book.idBook}"  data-title="${book.titleBook}" data-authors="${authors}
             onclick="popup2.showModal()" class="bookDiv w-[250px]  h-[360px] flex flex-col flex-shrink-0 items-center justify-center rounded-2xl p-1  ">
            <div class="flex items-center flex-col ">
              <div class="flex justify-center items-center mb-5 bg-[var(--lightish)] rounded-lg w-full h-[245px] p-10 ">
                <img src="${book.imageUrlBook}" class=" w-[150px] h-[225px] object-cover transform transition-all duration-500 ease-in-out hover:scale-105" />
              </div>
              <h1 class="text-center text-[var(--darkbrown)] font-extrabold text-xl w-[150px]">${book.titleBook}</h1>

            </div>
          </div>
    `;
    return knjiga;
}

async function stvoriRecenzije(userId) {
    try {
        const currentUser = auth.currentUser;
        const isCurrentUser = currentUser && currentUser.uid === userId;

        const isAdmin = await provjeraAdmina(currentUser?.uid); 
        const snapshot = await get(ref(db, "Korisnik/" + userId + "/recenzije"));

        if (snapshot.exists()) {
            const recenzije = snapshot.val();
            let htmlContent = "";
            // console.log(recenzije)

            for (const recenzija of Object.values(recenzije)) {
                // console.log(recenzija.id)
                const starRating = parseInt(recenzija.star);
                let bookCover = '';
                let bookTitle = '';
                let data;
                let books;
                let url;
                let knjigaTitle = recenzija.titleKnjige;
                let knjigaAuthor = recenzija.authorKnjige;

                const search = `${knjigaTitle} ${knjigaAuthor}`;
                // console.log(bookId);
                // console.log(bookAuthors);

                try {
                    // const gutendexResponse = await fetch(`https://gutendex.com/books`);
                    const gutendexResponse = await fetch("../gutenindex.json");

                    data = await gutendexResponse.json();
                    const knjige = data.results;
                    let book = knjige.find(book => book.id == recenzija.id);
                    if (book) {

                        bookCover = book.formats['image/jpeg'];
                        bookTitle = book.title;
                        // console.log(bookCover)

                    }
                    else {
                        const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${recenzija.id}&${encodeURIComponent(search)}`);
                        data = await googleResponse.json();
                        books = data.items;
                        // console.log(data.items)
                        if (books === undefined) {
                            url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(search)}`;
                            try {
                                const response = await fetch(url);
                                data = await response.json();
                                books = data.items;
                                // console.log(books)
                                if (books && books.length > 0) {
                                    // console.log(books.length)
                                    for (let i = 0; i < books.length; i++) {

                                        if (books[i].volumeInfo.title == knjigaTitle) {
                                            bookCover = books[i].volumeInfo.imageLinks?.thumbnail || "";
                                            bookTitle = books[i].volumeInfo.title || "Nepoznata knjiga";
                                        }
                                    }

                                }

                            } catch (error) {
                                console.error("Error kod Google api-a:"+ error);
                            }
                        }
                        else {
                            if (books && books.length > 0) {
                                for (let i = 0; i < books.length; i++) {
                                    // console.log(books[i].volumeInfo.title)
                                    // console.log(knjigaTitle)
                                    if (books[i].volumeInfo.title == knjigaTitle) {
                                        bookCover = books[i].volumeInfo.imageLinks?.thumbnail || "";
                                        bookTitle = books[i].volumeInfo.title || "Nepoznata knjiga";
                                        // console.log(bookTitle)
                                    }
                                }

                            }
                        }

                    }
                } catch (error) {
                    console.error("Error kod book detalja:"+ error);
                }

                let htmlRecenzija = `
                    <div class="review mb-[20px] border bg-[white] p-5 flex flex-row justify-between relative rounded-lg w-[80%]">
                    ${(isCurrentUser || isAdmin) ? `
                        <button class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center delete-review" 
                                data-review-id="${recenzija.id}" data-user-id="${userId}"  data-book-id="${recenzija.id}">
                            ×
                        </button>
                    ` : ''}
                    <div class="flex flex-col ">
                        <img src="${bookCover}" class="w-[150px] h-[225px] object-cover " />
                    </div>
                    <div class="w-[80%] ">
                        <h1 class="text-[var(--darkbrown)] font-extrabold text-l">${bookTitle}</h1>

                        <div class="rating rating-lg">
                `;

                for (let i = 1; i <= 5; i++) {
                    htmlRecenzija += `
                        <div class="mask mask-star opacity-100 mb-[15px] ${i <= starRating ? 'bg-yellow-300' : 'bg-gray'}" aria-label="${i} star"></div>
                    `;
                }

                htmlRecenzija += `
                        </div>
                            <h3 class="font-extrabold text-[25px] mb-[10px]">${recenzija.naslov}</h3>
                            <p class="">${recenzija.opis}</p>
                        </div>
                    </div>
                `;

                htmlContent += htmlRecenzija;
            }

            recenzijeDiv.innerHTML = htmlContent;

            if (isCurrentUser || isAdmin) {
                document.querySelectorAll('.delete-review').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const reviewId = e.target.getAttribute("data-review-id");
                        const userId = e.target.getAttribute("data-user-id");
                        const bookId = e.target.getAttribute("data-book-id");
                        // console.log(bookId);
                        // console.log(userId);

                        let odg = confirm("Jeste li sigurni da želite obrisati ovu recenziju?");
                        if (odg) {
                            try {
                                await remove(ref(db, `Korisnik/${userId}/recenzije/${reviewId}`));
                                await deleteDoc(doc(db1, "reviews", `${userId}_${bookId}`));
                                e.target.closest(".review").remove();
                                alert("Recenzija je uspješno obrisana!");
                            } catch (error) {
                                alert("Došlo je do greške prilikom brisanja recenzije.");
                            }
                        }
                    });
                });
            }
        } else {
            console.log("Nema recenzija");
            recenzijeDiv.innerHTML = "Nemate recenzije";
        }
    } catch (error) {
        console.error("Error kod recenzija:", error);
        recenzijeDiv.innerHTML = "Error loading reviews.";
    }
}

async function deleteUserProfile(userId) {
    let odg = confirm("Jeste li sigurni da želite izbrisati profil?");
    if (odg) {
        await remove(ref(db, `Korisnik/${userId}/`));
        let docData = await getDocs(collection(db1, "reviews"));
        if (docData) {
            const userDocs = docData.docs.filter(doc => doc.id.startsWith(userId));
            for (let data of userDocs) {
                await deleteDoc(doc(db1, "reviews", data.id));
            }
        }
        alert("Uspješno je izbrisan profil!");
        window.location.href = "./knjigolovac.html";
    }
}

provjeriCurrentUser();
