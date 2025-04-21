import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getDatabase, ref, child, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { getAuth, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { app, auth, db, db1 } from "./firebase.js";

const neubrajaj = ["wishlist", "citam", "name", "recenzije", "description", "id", "pfp"];

let google = localStorage.getItem("google");
let idKnjiga = localStorage.getItem("idKnjige");
let authorKnjige = localStorage.getItem("authorKnjige");
let titleKnjige = localStorage.getItem("titleKnjige");

let stvoriListuBtn = document.getElementById("stvoriListu");
let firebaseLista = document.getElementById("firebaseLista");
let knjigaContainer = document.getElementById("knjigeContainer");
let uProcitano = false;
let uWishlistu = false;
let knjigaId;

stvoriListuBtn.addEventListener("click", stvoriListu);

if (google == "false") {
    // console.log(google)
    fetchKnjige();
} else if (google == "true") {
    odabirUrla(idKnjiga, authorKnjige, titleKnjige);
}

async function fetchKnjige() {
    try {
        //Koristila sam json umisto api-a jer mi je stalno api blokavao :(
        // const response = await fetch("https://gutendex.com/books/");
        const response = await fetch("../gutenindex.json");
        const data = await response.json();
        const knjige = data.results;

        prikaziKnjigu(knjige);
    } catch (error) {
        knjigaContainer.innerHTML = "Error pri prikazivanju knjiga iz gutendex api :" +error;
    }
}

async function provjera(bookId) {
    const user = auth.currentUser;
    const userId = user.uid;

    try {
        const wishlistRef = ref(db, `Korisnik/${userId}/wishlist/${bookId}`);
        const wishlistSnapshot = await get(wishlistRef);

        if (wishlistSnapshot.exists()) {
            const wishlistBooks = wishlistSnapshot.val();

            if (wishlistBooks.idBook == bookId) {
                uWishlistu = true;
                uProcitano = false;
            }
        }

    } catch (error) {
        console.error("Error kod wishlista:", error);
    }

    try {
        const citamRef = ref(db, `Korisnik/${userId}/citam/${bookId}`);
        const citamSnapshot = await get(citamRef);

        if (citamSnapshot.exists()) {
            const citamBooks = citamSnapshot.val();
            if (citamBooks.idBook == bookId) {
                uProcitano = true;
                uWishlistu = false;

            }
            // console.log("citam " + uProcitano);
        }

    } catch (error) {
        console.error("Error kod citam:", error);
    }
    return { uWishlistu, uProcitano };
}

function stvoriStars(rating) {
    // console.log(rating)
    const fullStars = Math.floor(rating);
    let halfStar = false;
    if (rating % 1 >= 0.5) {
        halfStar = true;
    }
    // console.log(halfStar)
    const emptyStars = 5 - fullStars - halfStar;
    let starsHTML = "<div class='rating rating-xl rating-half'>";

    for (let i = 0; i < fullStars; i++) {
        starsHTML += "<input type='radio' name='rating' class='mask mask-star-2 mask-half-1 bg-yellow-400' checked disabled />";
        starsHTML += "<input type='radio' name='rating' class='mask mask-star-2 mask-half-2 bg-yellow-400' checked disabled />";

    }

    if (halfStar) {
        starsHTML += "<input type='radio' name='rating-11' class='mask mask-star-2 bg-yellow-400 mask-half-1' checked disabled />";
        starsHTML += "<input type='radio' name='rating-11' class='mask mask-star-2 bg-gray-500 mask-half-2' checked disabled />";

    }

    for (let i = 0; i < emptyStars; i++) {
        starsHTML += "<input type='radio' name='rating-11' class='mask mask-star-2 bg-gray-500 mask-half-1' checked disabled />";
        starsHTML += "<input type='radio' name='rating-11' class='mask mask-star-2 bg-gray-500 mask-half-2' checked disabled />";
    }

    starsHTML += "</div>";

    return starsHTML;
}

async function fetchBookRecenzije(bookId) {
    try {
        const querySnapshot = await getDocs(collection(db1, "reviews"));
        let ukupniRating = 0;
        let reviewCount = 0;
        const bookReviews = [];
        // console.log(bookId)
        querySnapshot.forEach((doc) => {
            const review = doc.data();
            // console.log("Review:", review);

            if (review.id == bookId) {
                // console.log(review.id)
                bookReviews.push(review);

                ukupniRating += review.star;
                // console.log(ukupniRating)
                reviewCount++;
            }
        });

        return {
            averageRating: reviewCount > 0 ? (ukupniRating / reviewCount) : 0,
            reviews: bookReviews
        };

    } catch (error) {
        console.error("Error kod reviews:", error);
        return {
            averageRating: 0,
            reviewCount: 0,
            reviews: []
        };
    }
}

async function prikaziKnjigu(knjige) {
    let book = knjige.find(book => book.id == idKnjiga);
    knjigaId = book;
    const reviews = await fetchBookRecenzije(book.id);
    const avgRating = reviews.averageRating;
    const ratingStars = stvoriStars(avgRating);
    // console.log(reviews)
    const bezBrowsing = book.bookshelves.map((shelf) => {
        return shelf.startsWith("Browsing:") ? shelf.replace("Browsing: ", "") : shelf;
    });

    const bookshelfHTML = bezBrowsing.map(zanr => {
        return `
            <div class="text-[15px] text-[var(--brownish)] p-3 bg-[var(--bluish)] rounded-xl font-bold text-[var(--light)]">${zanr}</div>
        `;
    }).join("");

    const knjigaContent = `
    <div class="flex flex-col items-center">
        <div class="relative relative [@media(max-width:850px)]:flex [@media(max-width:850px)]:flex-col  [@media(max-width:850px)]:items-center">
        <div class="absolute top-0 right-0 flex flex-col [@media(max-width:850px)]:relative  [@media(max-width:850px)]:flex-row">
              <div class="rounded-full bg-white p-3 shadow-[4px_0_10px_0_rgba(0,0,0,0.1)]">
                <svg class="save w-[40px] h-[40px] text-gray-800 dark:text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z"/>
                </svg>
              </div>
              <div class="rounded-full bg-white p-3 shadow-[4px_0_10px_0_rgba(0,0,0,0.1)]">
                <svg class="procitala w-[40px] h-[40px] text-black-800 dark:text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
              </div>
              <div class="rounded-full bg-white p-3 shadow-[4px_0_10px_0_rgba(0,0,0,0.1)]"  onclick="noviListmodal.showModal()">
                <svg xmlns="http://www.w3.org/2000/svg" class="noviList w-[40px] h-[40px]  text-black-800 dark:text-black"
                  fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
            </div>
            <div class="w-[500px] h-[500px] bg-[var(--lightbrown)] rounded-full flex justify-center items-center">
                <img src="${book.formats['image/jpeg']}" class="inset-0 w-[300px]" />
            </div>
        </div>
        <div class="flex items-center gap-2 mt-4">
            ${ratingStars}
        </div>
        <button class="btn mt-[20px] text-[var(--light)] w-[250px] font-bold bg-[var(--bluish)] border rounded p-2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-md" onclick="my_modal_3.showModal()">Pogledajte recenzije!</button>    
    </div>
    <div class="w-[50%] [@media(max-width:850px)]:w-auto">
        <h1 class="font-extrabold text-4xl text-[var(--darkbrown)] p-3">${book.title}</h1>
        <h2 class="font-bold text-3xl text-[var(--dark)] p-3">${book.authors.map(author => author.name).join(", ")}</h2>
        <div class="w-[100%] flex flex-row flex-wrap [@media(max-width:850px)]:justify-center gap-2"> ${bookshelfHTML} </div>
        <p class="text-[15px] text-[var(--brownish)] p-3 max-h-[400px] overflow-auto mb-[20px]">${book.summaries ? book.summaries[0] : 'Nažalost, nema kratkog sadržaja.'}</p>
        <div id="btnBooks" class="flex flex-row gap-2"></div>
    </div>`;

    knjigaContainer.innerHTML = knjigaContent;
    let noviListBtn = document.querySelector(".noviList");

    noviListBtn.addEventListener("click", loadListe);

    await provjera(book.id);
    updateBtnIcons(book.id);
    setupBookEventListeners(book);
}

async function odabirUrla(bookId, bookAuthors, bookTitle) {

    let url = `https://www.googleapis.com/books/v1/volumes?q=${bookId}+${encodeURIComponent(bookTitle)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const book = data.items.find(item => item.id === bookId);
            if (book) {
                prikaziGoogleKnjigu(book);
                return;
            }

            let podudaranjeNaslova = data.items.find(naslov =>
                naslov.volumeInfo.title.toLowerCase() == bookTitle.toLowerCase()
            );
            if (podudaranjeNaslova) {
                prikaziGoogleKnjigu(podudaranjeNaslova);
                return;
            }
        }

        let searchItems = `${bookTitle} ${bookAuthors}`;
        url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchItems)}`;
        const response2 = await fetch(url);
        const data2 = await response2.json();

        if ( data2.totalItems > 0) {
            let bestMatch = data2.items.find(item =>
                item.volumeInfo.title == bookTitle
            ) 
            if (!bestMatch) {
                bestMatch = data2.items[0];
              }

            prikaziGoogleKnjigu(bestMatch);
        } else {
            knjigaContainer.innerHTML = "Nije pronađena knjiga.";
        }
    } catch (error) {
        console.error("Error kod Google api-a:", error);
        knjigaContainer.innerHTML = "Došlo je do greške. Molim vas pokušajte ponovno";
    }
}

async function prikaziGoogleKnjigu(book) {
    const reviews = await fetchBookRecenzije(book.id);
    const avgRating = reviews.averageRating;
    const ratingStars = stvoriStars(avgRating);
    knjigaId = book;

    const knjigaContent = `
    <div class="flex flex-col items-center  justiy-between w-[100%]">
        <div class="relative [@media(max-width:850px)]:flex [@media(max-width:850px)]:flex-col  [@media(max-width:850px)]:items-center">
          <div class="absolute top-0 right-0 flex flex-col [@media(max-width:850px)]:relative  [@media(max-width:850px)]:flex-row">
              <div class="rounded-full bg-white p-3 shadow-[4px_0_10px_0_rgba(0,0,0,0.1)]">
                <svg class="save w-[40px] h-[40px] text-gray-800 dark:text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z"/>
                </svg>
              </div>
              <div class="rounded-full bg-white p-3 shadow-[4px_0_10px_0_rgba(0,0,0,0.1)]">
                <svg class="procitala w-[40px] h-[40px] text-black-800 dark:text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
              </div>
              <div class="rounded-full bg-white p-3 shadow-[4px_0_10px_0_rgba(0,0,0,0.1)]"  onclick="noviListmodal.showModal()">
                <svg xmlns="http://www.w3.org/2000/svg" class="noviList w-[40px] h-[40px]  text-black-800 dark:text-black"
                  fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
            </div>
            <div class="w-[500px] h-[500px] bg-[var(--lightbrown)] rounded-full flex justify-center items-center [@media(max-width:850px)]:w-300px [@media(max-width:850px)]:h-300px ">
                <img src="${book.volumeInfo.imageLinks?.thumbnail}" class="inset-0 w-[300px] [@media(max-width:850px)]:300px"/>
            </div>
        </div>
        <div class="flex items-center gap-2 mt-4">
            ${ratingStars}
        </div>
        <button class="btn mt-[20px] text-[var(--light)] font-bold bg-[var(--bluish)] border rounded p-2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-md" onclick="my_modal_3.showModal()">Pogledajte recenzije!</button>
    </div>
    <div class="w-[90%] sd:w-[50%] mx-auto flex flex-col sd:items-center">
        <h1 class="font-extrabold text-4xl text-[var(--darkbrown)] p-3">${book.volumeInfo.title}</h1>
        <h2 class="font-bold text-3xl text-[var(--dark)] p-3">${book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : 'Unknown Author'}</h2>
        <p class="text-[15px] text-[var(--brownish)] p-3 h-[500px] overflow-auto mb-[20px] ">${book.volumeInfo.description || 'No summary available.'}</p>
        <div id="btnBooks1" class="flex flex-row gap-2"></div>
    </div>`;

    knjigaContainer.innerHTML = knjigaContent;

    let noviListBtn = document.querySelector(".noviList");
    noviListBtn.addEventListener("click", loadListe);

    await provjera(book.id);
    updateBtnIcons(book.id);
    setupBookEventListeners(book);
}

function wishlistBaza(book) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = user.uid;
            const bookId = book.id;

            const bookData = {
                idBook: bookId,
                titleBook: book.volumeInfo?.title || book.title,
                imageUrlBook: book.volumeInfo?.imageLinks?.thumbnail || book.formats?.["image/jpeg"],
            };

            set(ref(db, "Korisnik/" + userId + "/wishlist/" + bookId), bookData)
                .then(() => {
                    uWishlistu = true;
                    uProcitano = false;
                    updateBtnIcons(book.id);

                })
                .catch((error) => {
                    console.error("Error kod wishlista:", error);
                });
        }
    });
    removeFromCitam(book)
}

function citamBaza(book) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = user.uid;
            const bookId = book.id;

            const bookData = {
                idBook: bookId,
                titleBook: book.volumeInfo?.title || book.title,
                imageUrlBook: book.volumeInfo?.imageLinks?.thumbnail || book.formats?.["image/jpeg"],
            };

            set(ref(db, "Korisnik/" + userId + "/citam/" + bookId), bookData)
                .then(() => {
                    uProcitano = true;
                    uWishlistu = false;
                    updateBtnIcons(bookId);
                })
                .catch((error) => {
                    console.error("Error kod citam", error);
                });
        }
    });
    removeFromWishlist(book)
}

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
                    uWishlistu = false;

                    updateBtnIcons(book.id);
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
            uProcitano = false;

            updateBtnIcons(book.id);
        }
    } catch (error) {
        console.error("Greška pri micanju knjige iz citam:", error);
    }
}

async function updateBtnIcons(bookId) {
    try {
        const status = await provjera(bookId);

        document.querySelectorAll(`.save path`).forEach(path => {
            if (status.uWishlistu) {
                path.setAttribute("fill", "currentColor");
                path.setAttribute("d", "M7.833 2c-.507 0-.98.216-1.318.576A1.92 1.92 0 0 0 6 3.89V21a1 1 0 0 0 1.625.78L12 18.28l4.375 3.5A1 1 0 0 0 18 21V3.889c0-.481-.178-.954-.515-1.313A1.808 1.808 0 0 0 16.167 2H7.833Z");
            } else {
                path.setAttribute("fill", "none");
                path.setAttribute("d", "m17 21-5-4-5 4V3.889a.92.92 0 0 1 .244-.629.808.808 0 0 1 .59-.26h8.333a.81.81 0 0 1 .589.26.92.92 0 0 1 .244.63V21Z");
            }
        });

        document.querySelectorAll(`.procitala path`).forEach(path => {
            if (status.uProcitano) {
                path.setAttribute("fill","none");
                path.setAttribute("d", "M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z");
            } else {
                path.setAttribute("fill", "none");
                path.setAttribute("d", "M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z");
            }
        });
    } catch (error) {
        console.error("Error kod updatanja svgs:", error);
    }
}

async function handleBtns(btn, isSaveBtn, book) {
    try {
        // console.log(btn)
        if (isSaveBtn) {
            const status = await provjera(book.id);
            if (status.uWishlistu) {
                await removeFromWishlist(book);
            } else {
                await wishlistBaza(book);
            }
        } else {
            const status = await provjera(book.id);
            if (status.uProcitano) {
                await removeFromCitam(book);
            } else {
                await citamBaza(book);
            }
        }

        await updateBtnIcons(book.id);
    } catch (error) {
        console.error("Error kod book svgs:", error);
    }
}

function setupBookEventListeners(book) {

    document.querySelectorAll(".save").forEach(btn => {
        btn.addEventListener("click", () => handleBtns(btn, true, book));
    });
    document.querySelectorAll(".procitala").forEach(btn => {
        btn.addEventListener("click", () => handleBtns(btn, false, book));
    });

    updateBtnIcons(book.id);
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
            // console.log(listName)
            if (!neubrajaj.includes(listName.toLowerCase())) {
                let BookuListi = false;

                if (knjigaId) {
                    let bookId = knjigaId.id;
                    let userList = userData[listName];
                  
                    if (bookId in userList) {
                        BookuListi = true;
                    }
                  }

                const listElement = document.createElement("div");
                listElement.className = "flex flex-row justify-between p-5 bg-[var(--light)] items-center";
                listElement.innerHTML = `
                    <h3 class="text-bold text-m">${listName}</h3>
                    <div class="flex flex-row">
                        <button class="akcijaBtn bg-[var(--bluish)] border rounded p-2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-md ${BookuListi ? 'removeBotun' : 'addBotun'}" 
                                data-list="${listName}">
                            ${BookuListi ? 'Makni' : 'Dodaj'}
                        </button>
                    </div>
                `;
                firebaseLista.appendChild(listElement);
                imaList = true;
            }

        })
        if (!imaList) {
            firebaseLista.innerHTML = "Nemate niti jednu listu.";
        }
    }

    document.querySelectorAll(".akcijaBtn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const listName = btn.dataset.list;
            if (btn.classList.contains("addBotun")) {
                await dodajBookuList(listName);
            } else {
                await removeBookFromList(listName);
            }
            await loadListe();
        });
    });
}

async function dodajBookuList(listName) {
    try {
        const listRef = ref(db, `Korisnik/${auth.currentUser.uid}/${listName}/${knjigaId.id}`);

        const bookInfo = {
            idBook: knjigaId.id,
            titleBook: knjigaId.volumeInfo?.title || knjigaId.title,
            imageUrlBook: knjigaId.volumeInfo?.imageLinks?.thumbnail || knjigaId.formats?.["image/jpeg"],
        };

        await update(listRef, bookInfo);
    } catch (error) {
        console.error("Greška pri dodavanju knjige:"+ error);
    }
}

async function removeBookFromList(listName) {
    try {
        const listRef = ref(db, `Korisnik/${auth.currentUser.uid}/${listName}/${knjigaId.id}`);
        await remove(listRef);
    } catch (error) {
        console.error("Greška pri uklanjanju knjige:"+ error);
    }
}


async function stvoriListu() {
    let listaIme = document.getElementById("listaIme").value;
    let warningPoruka = document.querySelector(".warningList");
    warningPoruka.innerHTML = "";

    if (!listaIme) {
        warningPoruka.innerHTML = "Molim vas unesite ime liste";
    }

    if (neubrajaj.some(rijec => listaIme.toLowerCase() == rijec.toLowerCase())) {
        warningPoruka.innerHTML = "Vaša lista ne može imati takvo ime.";
    }

    try {
        const userRef = ref(db, `Korisnik/${auth.currentUser.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists() && Object.keys(snapshot.val()).some(name => name.toLowerCase() === listaIme.toLowerCase())) {
            warningPoruka.innerHTML = "Lista s tim imenom već postoji.";
        }

        await dodajBookuList(listaIme);

        warningPoruka.innerHTML = "Nova lista kreirana i knjiga dodana!";
        await loadListe();

    } catch (error) {
        warningPoruka.innerHTML = "Došlo je do greske pri stvaranju liste: " + error;
    }
}