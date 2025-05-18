import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, child, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { getAuth, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { app, auth, db, db1 } from "./firebase.js";

const loading = document.getElementById("loading");
let knjigaId;
let firebaseLista = document.getElementById("firebaseLista");
let noviListBtn = document.querySelector(".noviList");
const neubrajaj = ["wishlist", "citam", "name", "recenzije", "description", "id", "pfp"];

noviListBtn.addEventListener("click", loadListe);
let stvoriListuBtn = document.getElementById("stvoriListu");
stvoriListuBtn.addEventListener("click", stvoriListu);

if (window.location.pathname == "/pages/profile.html") {
    const wishlistDiv = document.querySelector("#wishlistDiv");
    const citamDiv = document.querySelector("#citamDiv");
    const vaseListeDiv = document.querySelector("#vaseListe");

    wishlistDiv.addEventListener("click", dohvacanjeKnjige);
    citamDiv.addEventListener("click", dohvacanjeKnjige);
    vaseListeDiv.addEventListener("click", dohvacanjeKnjige);

} else {
    const booklist1 = document.querySelector("#bookList");
    const booklist2 = document.querySelector("#bookList1");

    booklist1.addEventListener("click", dohvacanjeKnjige);
    booklist2.addEventListener("click", dohvacanjeKnjige);
}

function dohvacanjeKnjige(event) {
    if (event.target.closest(".bookDiv")) {
        const clickedBookDiv = event.target.closest(".bookDiv");
        const bookId = clickedBookDiv.id;
        const bookTitle = clickedBookDiv.dataset.title;
        const bookAuthors = clickedBookDiv.dataset.authors;
        // console.log(bookAuthors);
        fetchKnjige(bookId);
        odabirUrla(bookId, bookTitle, bookAuthors);
    }
}

async function fetchKnjige(bookId) {
    loading.style.display = "block";
    try {
        // const response = await fetch("https://gutendex.com/books");
        const response = await fetch("../gutenindex.json");

        const data = await response.json();
        const knjige = data.results;
        const clickedBook = knjige.find(book => book.id == bookId);
        if (clickedBook) {
            knjigaId = clickedBook;

            popupKnjiga(clickedBook);
            localStorage.setItem('google', 'false');

        } else {
            console.log("Knjiga nije pronađena u Gutendex.");
        }
    } catch (error) {
        console.error("Error kod Gutendex:", error);
    } finally {
        loading.style.display = "none";
    }
}

async function odabirUrla(bookId, bookTitle, bookAuthors) {
    loading.style.display = "block";

    const search = `${bookTitle} ${bookAuthors}`;
    const encoded = encodeURIComponent(search);
    let url = `https://www.googleapis.com/books/v1/volumes?q=${bookId}&${encoded}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const books = data.items;
        console.log(books)
        if (books) {
            if (books && books.length > 0) {
                for (let i = 0; i < books.length; i++) {
                    console.log(books[i].volumeInfo.title)
                    console.log(bookTitle)
                    if (books[i].volumeInfo.title == bookTitle) {
                        bookTitle = books[i].volumeInfo.title || "Nepoznata knjiga";
                    }
                }
            }
            fetchGoogleBooks(bookId, bookTitle, bookAuthors, url);
        } else {
            url = `https://www.googleapis.com/books/v1/volumes?q=${encoded}`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                const books = data.items;
                if (books && books.length > 0) {
                    // console.log(books.length)
                    for (let i = 0; i < books.length; i++) {

                        if (books[i].volumeInfo.title == bookTitle) {
                            bookTitle = books[i].volumeInfo.title || "Nepoznata knjiga";
                        }
                    }

                }
            fetchGoogleBooks(bookId, bookTitle, bookAuthors, url);

            }
            catch(error){
                console.error("Error " +error);
            }
        }
    } catch (error) {
        console.error("Error kod Google api-a:" + error);
    }
}

async function fetchGoogleBooks(bookId, bookTitle, bookAuthors, url) {

    try {
        const response = await fetch(url);
        const data = await response.json();
        const books = data.items;
        console.log(books)
        const clickedBook = books.find(book => book.volumeInfo.title === bookTitle);
        console.log(clickedBook)
        if (clickedBook) {
            knjigaId = clickedBook;
            popupKnjiga(clickedBook, bookAuthors);
            localStorage.setItem("google", "true");
        }
    } catch (error) {
        console.error("Error kod Google api-a:" + error);
    } finally {
        loading.style.display = "none";
    }
}

function popupKnjiga(book, bookAuthors) {
    const isProfilePage = window.location.pathname == "/pages/profile.html";
    const prefix = isProfilePage ? "2" : "";
    const imgSrc = book.formats?.["image/jpeg"] || book.volumeInfo?.imageLinks?.thumbnail;
    const title = book.title || book.volumeInfo?.title || "Nepoznati naslov";

    let popImg = document.getElementById(`popImg${prefix}`);
    let popTitle = document.getElementById(`popTitle${prefix}`);
    let authorDiv = document.getElementById(`popAuthor${prefix}`);
    let btn = document.getElementById(`link${prefix}`);
    const popupDiv = document.getElementById(`popup${prefix}`);
    const closeButton = popupDiv.querySelector("button");

    popImg.src = imgSrc;
    popTitle.innerText = title;
    authorDiv.innerHTML = "";
    btn.style.display = "block";

    if (book.authors) {
        book.authors.forEach(author => {
            const authorHTML = `<h2 class="text-center text-[var(--brownish)] font-bold text-xl">${author.name}</h2>`;
            authorDiv.innerHTML += authorHTML;
        });
    } else if (book.volumeInfo?.authors) {
        const authorsHTML = `<h2 class="text-center text-[var(--brownish)] font-bold text-xl">${book.volumeInfo.authors.join(' ')}</h2>`;
        authorDiv.innerHTML += authorsHTML;
    } else {
        authorDiv.innerHTML = "Autor je nepoznat.";
    }

    btn.addEventListener("click", function () {
        localStorage.setItem("idKnjige", book.id);
        localStorage.setItem("titleKnjige", title);
        localStorage.setItem("authorKnjige", bookAuthors);
    })
    popupDiv.showModal();

    closeButton.addEventListener("click", () => {
        popupDiv.close();
    });

    updateIkoneBtn(book.id);
    bookListeners(book)
}


async function provjeraBookuList(userId, listType, bookId, status) {
    const snap = await get(ref(db, `Korisnik/${userId}/${listType}/${bookId}`));
    return snap.exists();
}

function wishlistBaza(book) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = user.uid;
            const bookData = {
                idBook: book.id,
                titleBook: book.volumeInfo?.title || book.title,
                imageUrlBook: book.volumeInfo?.imageLinks?.thumbnail || book.formats?.["image/jpeg"],
            };
            set(ref(db, "Korisnik/" + userId + "/wishlist/" + book.id), bookData)
                .then(() => {
                    updateIkoneBtn(book.id);
                })
                .catch((error) => {
                    console.error("Error kod wishlist:", error);
                });
        }
    });
    removeFromCitam(book)
}

//Dodavanje u "Pročitano"
function citamBaza(book) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = user.uid;
            const bookData = {
                idBook: book.id,
                titleBook: book.volumeInfo?.title || book.title,
                imageUrlBook: book.volumeInfo?.imageLinks?.thumbnail || book.formats?.["image/jpeg"],
            };

            update(ref(db, "Korisnik/" + userId + "/citam/" + book.id), bookData)
                .then(() => {
                    updateIkoneBtn(book.id);
                })
                .catch((error) => {
                    console.error("Error kod citam", error);
                });
        }
    });
    removeFromWishlist(book)
}

//Micanje iz "Želim pročitati"
async function removeFromWishlist(book) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const bookId = book.id;
            const bookRef = ref(db, `Korisnik/${userId}/wishlist/${bookId}`);

            try {
                const snapshot = await get(bookRef);
                if (snapshot.exists()) {
                    await remove(bookRef);
                    updateIkoneBtn(book.id);
                }
            } catch (error) {
                console.error("Greška pri micanju knjige iz wishliste:", error);
            }
        }
    });
}

async function removeFromCitam(book) {

    const user = auth.currentUser;
    const userId = user.uid;
    const bookId = book.id;
    const bookRef = ref(db, `Korisnik/${userId}/citam/${bookId}`);

    try {
        const snapshot = await get(bookRef);
        if (snapshot.exists()) {
            await remove(bookRef);
            updateIkoneBtn(book.id);
        }
    } catch (error) {
        console.error("Greška pri micanju knjige iz Čitam:" + error);
    }
}

//Updatanje svg ikona
export async function updateIkoneBtn(bookId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const wishlistStatus = await provjeraBookuList(user.uid, "wishlist", bookId, "wishlist");
        const citamStatus = await provjeraBookuList(user.uid, "citam", bookId, "read");

        document.querySelectorAll(".save path").forEach(path => {
            if (wishlistStatus) {
                path.setAttribute("fill", "currentColor");
                path.setAttribute("d", "M7.833 2c-.507 0-.98.216-1.318.576A1.92 1.92 0 0 0 6 3.89V21a1 1 0 0 0 1.625.78L12 18.28l4.375 3.5A1 1 0 0 0 18 21V3.889c0-.481-.178-.954-.515-1.313A1.808 1.808 0 0 0 16.167 2H7.833Z");
            } else {
                path.setAttribute("fill", "none");
                path.setAttribute("d", "m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z");
            }
        });

        document.querySelectorAll(".procitala path").forEach(path => {
            if (citamStatus) {
                path.setAttribute("fill", "none");
                path.setAttribute("d", "M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z");
            } else {
                path.setAttribute("fill", 'none');
                path.setAttribute("d", "M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z");
            }
        });
    } catch (error) {
        console.error("Error kod updatanja svgs:" + error);
    }
}


async function handleBookBtn(btn, isSaveBtn, book) {
    try {
        if (isSaveBtn) {
            const inWishlist = await BookuListi(book.id, "wishlist");
            if (inWishlist) {
                await removeFromWishlist(book);
            } else {
                await wishlistBaza(book);
            }
        } else {
            const inCitam = await BookuListi(book.id, "citam");
            if (inCitam) {
                await removeFromCitam(book);
            } else {
                await citamBaza(book);
            }
        }
        await updateIkoneBtn(book.id);
    } catch (error) {
        console.error("Error kod book button:" + error);
    }
}

async function BookuListi(bookId, listType) {
    const user = auth.currentUser;

    const snap = await get(ref(db, `Korisnik/${user.uid}/${listType}/${bookId}`));
    return snap.exists();
}

function bookListeners(book) {

    document.querySelectorAll(".save").forEach(btn => {
        btn.addEventListener("click", () => handleBookBtn(btn, true, book));
    });
    document.querySelectorAll(".procitala").forEach(btn => {
        btn.addEventListener("click", () => handleBookBtn(btn, false, book));
    });

    updateIkoneBtn(book.id);
}

async function loadListe() {
    firebaseLista.innerHTML = ""
    const user = auth.currentUser;
    const userId = user.uid;
    // console.log(user)
    const userRef = ref(db, `Korisnik/${userId}`);

    const snapshot = await get(userRef);
    if (snapshot.exists()) {
        const userData = snapshot.val();
        let imaList = false;

        Object.keys(userData).forEach(listName => {
            console.log(listName)
            if (!neubrajaj.includes(listName.toLowerCase())) {
                const isBookInList = knjigaId && knjigaId.id in userData[listName];

                const listElement = document.createElement("div");
                listElement.className = "flex flex-row justify-between p-5 bg-[var(--light)] items-center";
                listElement.innerHTML = `
                    <h3 class="text-bold text-m">${listName}</h3>
                    <div class="flex flex-row">
                        <button class="akcijaBtn bg-[var(--bluish)] border rounded p-2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-md ${isBookInList ? 'removeBotun' : 'addBotun'}" 
                                data-list="${listName}">
                            ${isBookInList ? 'Makni' : 'Dodaj'}
                        </button>
                    </div>
                `;
                firebaseLista.appendChild(listElement);
                imaList = true;
            }
        })
        if (!imaList) {
            firebaseLista.innerHTML = "Nemate niti jednu listu";
        }
    }
    document.querySelectorAll(".akcijaBtn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const listName = btn.dataset.list;
            if (btn.classList.contains("addBotun")) {
                await addBookToList(listName);
            } else {
                await removeBookFromList(listName);
            }
            await loadListe();
        });
    });
}

async function addBookToList(listName) {
    try {
        const listRef = ref(db, `Korisnik/${auth.currentUser.uid}/${listName}/${knjigaId.id}`);
        const bookInfo = {
            idBook: knjigaId.id,
            titleBook: knjigaId.volumeInfo?.title || knjigaId.title,
            imageUrlBook: knjigaId.volumeInfo?.imageLinks?.thumbnail || knjigaId.formats?.["image/jpeg"],
        };
        await update(listRef, bookInfo);
    } catch (error) {
        console.error("Greška pri dodavanju knjige:" + error);
    }
}

async function removeBookFromList(listName) {
    try {
        const listRef = ref(db, `Korisnik/${auth.currentUser.uid}/${listName}/${knjigaId.id}`);
        await remove(listRef);
    } catch (error) {
        console.error("Greška pri uklanjanju knjige:", error);
    }
}

async function stvoriListu() {
    let listaIme = document.getElementById("listaIme").value;
    let warningPoruka = document.querySelector(".warningList");
    warningPoruka.innerHTML = "";

    if (!listaIme) {
        warningPoruka.innerHTML = "Molim vas unesite ime liste";
    }

    if (neubrajaj.some(rijec => listaIme.toLowerCase() === rijec.toLowerCase())) {
        warningPoruka.innerHTML = "Vaša lista ne može imati takvo ime.";
    }

    try {
        const userRef = ref(db, `Korisnik/${auth.currentUser.uid}`);
        const snapshot = await get(userRef);

        let vecPostoji = Object.keys(snapshot.val()).some(name => name.toLowerCase() == listaIme.toLowerCase());
        if (snapshot.exists() && vecPostoji) {
            warningPoruka.innerHTML = "Lista s tim imenom već postoji.";
        }
        await addBookToList(listaIme);

        warningPoruka.innerHTML = "Nova lista kreirana i knjiga dodana!";
        await loadListe();

    } catch (error) {
        warningPoruka.innerHTML = "Došlo je do greške: " + error;
    }
}