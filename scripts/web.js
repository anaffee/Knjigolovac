import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { app, auth, db, db1 } from "./firebase.js";
import { updateIkoneBtn } from "./popup.js";

let trazilica = document.getElementById("filterInput");
const googleBtn = document.getElementById("googleBtn");
// const bookListContainer = document.getElementById("bookList");
let filterBtn = document.getElementById("filterBtn");
let filterDrawer = document.getElementById("filterDrawer");
let bookList = document.getElementById("bookList");
let bookList1 = document.getElementById("bookList1");
let trenutniPage = document.getElementById("currentPage");
let prosliPage = document.getElementById("prevPage");
let sljedeciPage = document.getElementById("nextPage");
const uniqueCategories = [];

let filterOpened = false;
let currentPage = 1;
const trenutnaStr = 8;
let allBooks = [];

filterBtn.addEventListener("click", openFilter);

googleBtn.addEventListener("click", function () {
  let googleInput = document.getElementById("googleInput").value;
  document.querySelector(".filterBotun").style.display = "none";

  fetchGoogleBooks(googleInput);
});

async function fetchKnjige() {
  try {
    const response = await fetch("../gutenindex.json");
    const data = await response.json();
    allBooks = data.results;

    streliceStr();
    prikaziKnjigezaStr();
    stvoriZanrove(allBooks);
    searchbar(allBooks);
  } catch (error) {
    console.error("Error kod dohvaćanja:", error);
  }
}

async function fetchGoogleBooks(input) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${input}&maxResults=40`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items) {
      allBooks = data.items;
      currentPage = 1;
      await prikaziKnjigezaStr();
      streliceStr();
    }
  } catch (error) {
    console.error("Error kod knjiga:", error);
  }
}

async function prikaziKnjigezaStr() {
  bookList.innerHTML = "";
  bookList1.innerHTML = "";

  const startIndex = (currentPage - 1) * trenutnaStr;
  const endIndex = startIndex + trenutnaStr;
  const booksToDisplay = allBooks.slice(startIndex, endIndex);

  if (booksToDisplay[0].volumeInfo) {
    bookList.style.display = "none";
    bookList1.style.display = "flex";

    let allBooksHTML = "";
    for (let book of booksToDisplay) {
      let bookHtml = await stvoriGoogleKnjigu(book);
      allBooksHTML += bookHtml;
    }

    bookList1.innerHTML = allBooksHTML;
  } else {
    bookList.style.display = "flex";
    bookList1.style.display = "none";

    let allBooksHTML = "";
    for (const book of booksToDisplay) {
      const bookHtml = await stvoriBookHTML(book);
      allBooksHTML += bookHtml;
    }
    bookList.innerHTML = allBooksHTML;
  }
}


function streliceStr() {
  const totalPages = Math.ceil(allBooks.length / trenutnaStr);

  trenutniPage.textContent = `Str. ${currentPage}`;

  if (currentPage === 1) {
    prosliPage.disabled = true;
  } else {
    prosliPage.disabled = false;
  }

  if (currentPage == totalPages) {
    sljedeciPage.disabled = true;
  } else if (totalPages == 0) {
    sljedeciPage.disabled = true;
  } else {
    sljedeciPage.disabled = false;
  }
}

prosliPage.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    prikaziKnjigezaStr();
    streliceStr();
  }
});

sljedeciPage.addEventListener("click", () => {
  const totalPages = Math.ceil(allBooks.length / trenutnaStr);
  if (currentPage < totalPages) {
    currentPage++;
    prikaziKnjigezaStr();
    streliceStr();
  }
});

function stvoriStars(rating) {
  // console.log(rating)
  const fullStars = Math.floor(rating);
  let halfStar = false;
  if (rating % 1 >= 0.5) {
    halfStar = true;
  }
  const emptyStars = 5 - fullStars - halfStar;
  let starsHTML = "<div class='rating rating-xl rating-half '>";

  for (let i = 0; i < fullStars; i++) {
    starsHTML += "<input type='radio' name='rating' class='mask mask-star-2 mask-half-1 bg-yellow-400 !opacity-100' checked disabled />";
    starsHTML += "<input type='radio' name='rating' class='mask mask-star-2 mask-half-2 bg-yellow-400 !opacity-100' checked disabled />";
  }

  if (halfStar) {
    starsHTML += "<input type='radio' name='rating' class='mask mask-star-2 mask-half-1 bg-yellow-400 !opacity-100' checked disabled />";
    starsHTML += "<input type='radio' name='rating-11' class='mask mask-star-2 bg-gray-500 mask-half-2 !opacity-100' disabled />";

  }

  for (let i = 0; i < emptyStars; i++) {
    starsHTML += "<input type='radio' name='rating-11' class='mask mask-star-2 bg-gray-500 mask-half-1 !opacity-100' disabled />";
    starsHTML += "<input type='radio' name='rating-11' class='mask mask-star-2 bg-gray-500 mask-half-2 !opacity-100' disabled />";
  }

  starsHTML += "</div>";

  return starsHTML;
}

async function fetchBookRecenzije(bookId) {
  try {
    const querySnapshot = await getDocs(collection(db1, "reviews"));

    let totalRating = 0;
    let reviewCount = 0;
    const reviewsForBook = [];

    querySnapshot.forEach((doc) => {
      const review = doc.data();
      if (review.id == bookId) {

        reviewsForBook.push(review);

        totalRating += review.star;
        reviewCount++;
      }
    });

    return {
      averageRating: reviewCount > 0 ? (totalRating / reviewCount) : 0,
      reviews: reviewsForBook
    };

  } catch (error) {
    console.error("Error fetching reviews:"+ error);
    return {
      averageRating: 0,
      reviews: []
    };
  }
}
async function stvoriGoogleKnjigu(book) {
  const reviews = await fetchBookRecenzije(book.id);

  const ratingStars = stvoriStars(reviews.averageRating);
  // console.log(ratingStars)
  return `
   <div id="${book.id}" data-authors="${book.volumeInfo.authors}" data-title="${book.volumeInfo.title}" class="bookDiv kartica flex flex-col items-center justify-between rounded-2xl p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md h-auto min-h-[380px] sm:h-[420px] md:h-[400px] lg:h-[420px] w-full max-w-[290px] mx-auto">
  <div class="w-full h-[200px] sm:h-[240px] md:h-[220px] lg:h-[240px] mb-4 flex justify-center items-center bg-[var(--lightish)] p-2 rounded-lg">
      <img src="${book.volumeInfo.imageLinks?.thumbnail}" alt="${book.volumeInfo.title}" 
           class="h-full w-auto object-contain max-w-full" />
  </div>
  <div class="w-full flex flex-col items-center flex-grow">
      <h1 class="text-center text-[var(--darkbrown)] font-extrabold text-lg sm:text-xl md:text-lg lg:text-xl line-clamp-2 mb-2 px-2">
          ${skratiNaslov(book.volumeInfo.title)}
      </h1>
      <div class="flex flex-wrap justify-center gap-x-2 gap-y-1 w-full px-2">
          <h2 class="text-center text-[var(--brownish)] font-bold text-sm sm:text-[15px] truncate max-w-full">
          ${book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : 'Unknown Author'}
              </h2>
      </div>
           <div class="flex items-center gap-2 mt-4">
          ${ratingStars}
      </div>

  </div>
</div>
    `;
}

async function stvoriBookHTML(book) {
  const reviews = await fetchBookRecenzije(book.id);
  const ratingStars = stvoriStars(reviews.averageRating);

  return `
    <div id="${book.id}" class="bookDiv kartica flex flex-col items-center justify-between rounded-2xl p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md h-auto min-h-[380px] sm:h-[420px] md:h-[400px] lg:h-[420px] w-full max-w-[290px] mx-auto">
      <div class="w-full h-[200px] sm:h-[240px] md:h-[220px] lg:h-[240px] mb-4 flex justify-center items-center bg-[var(--lightish)] p-2 rounded-lg">
        <img src="${book.formats['image/jpeg']}" alt="${book.title}" 
             class="h-full w-auto object-contain max-w-full" />
      </div>
      <div class="w-full flex flex-col items-center flex-grow">
        <h1 class="text-center text-[var(--darkbrown)] font-extrabold text-lg sm:text-xl md:text-lg lg:text-xl line-clamp-2 mb-2 px-2">
            ${skratiNaslov(book.title)}
        </h1>
        <div class="flex flex-wrap justify-center gap-x-2 gap-y-1 w-full px-2">
            ${book.authors.map(author => `
                <h2 class="text-center text-[var(--brownish)] font-bold text-sm sm:text-[15px] truncate max-w-full">
                    ${author.name}
                </h2>
            `).join('')}
        </div>
        <div class="flex items-center gap-2 mt-4">
            ${ratingStars}
        </div>
      </div>
    </div>`;
}

function skratiNaslov(title) {
  return title.length > 20 ? title.slice(0, 17) + '...' : title;
}

function openFilter() {
  if (!filterOpened) {
    filterDrawer.style.display = "block";
    filterDrawer.classList.add("filterDrawer");
    bookList.classList.add("bookListShifted");
    bookList1.classList.add("bookListShifted");

    filterOpened = true;

  } else {
    filterDrawer.style.display = "none";
    filterDrawer.classList.remove("filterDrawer");
    bookList.classList.remove("bookListShifted");
    bookList1.classList.remove("bookListShifted");

    filterOpened = false;
  }
}

function stvoriZanrove(knjiga) {
  const zanrovi = [];

  knjiga.forEach((book) => {
    const bezBrowsing = book.bookshelves.map((shelf) => {
      return shelf.startsWith("Browsing:") ? shelf.replace("Browsing: ", "") : shelf;
    });

    zanrovi.push(...bezBrowsing);
  });

  zanrovi.forEach(shelf => {
    if (uniqueCategories.indexOf(shelf) === -1) {
      uniqueCategories.push(shelf);
    }
  });

  const zanroviSelect = document.getElementById("filterSelect");
  uniqueCategories.forEach(zanr => {
    const zanrOption = `
      <option value="${zanr}">${zanr}</option>`;
    zanroviSelect.innerHTML += zanrOption;
  });

  zanroviSelect.addEventListener("change", function () {
    const selectedGenre = zanroviSelect.value;
    zanroviFilter(knjiga, selectedGenre);
  });
}

function zanroviFilter(knjige, selectedGenre) {
  currentPage = 1;

  if (selectedGenre === "Sve") {
    allBooks = knjige;
  } else {
    allBooks = knjige.filter((book) => {
      const bezBrowsing = book.bookshelves?.map((shelf) => {
        return shelf.startsWith("Browsing:") ? shelf.replace("Browsing: ", "") : shelf;
      });
      return bezBrowsing?.some((shelf) => shelf === selectedGenre);
    });
  }

  prikaziKnjigezaStr();
  streliceStr();
}

function searchbar(knjige) {
  trazilica.addEventListener("keyup", function (elem) {
    let slovo = elem.target.value.toLowerCase();
    currentPage = 1;
    if (slovo === "") {
      prikaziKnjigezaStr();
      streliceStr();
      return;
    }

    const filteredBooks = knjige.filter((knjiga) => {
      const titleMatch = knjiga.title?.toLowerCase().indexOf(slovo) !== -1;
      const authorMatch = knjiga.authors?.some((author) =>
        author.name?.toLowerCase().indexOf(slovo) !== -1
      ) ||
        knjiga.volumeInfo?.authors?.some(author =>
          author.toLowerCase().indexOf(slovo) !== -1
        );

      return titleMatch || authorMatch;
    });

    allBooks = filteredBooks;
    prikaziKnjigezaStr();
    streliceStr();
  });
}

async function dohvacanjeTopKnjiga() {
  try {
    const reviewsSnapshot = await getDocs(collection(db1, "reviews"));

    const bookRatings = {};

      reviewsSnapshot.forEach(function (doc) {
      const review = doc.data();

      if (review.titleKnjige) {
        const bookTitle = review.titleKnjige;
        // console.log(bookRatings[bookTitle]); 

        if (bookRatings[bookTitle]) {
          bookRatings[bookTitle].total = bookRatings[bookTitle].total + review.star;
          bookRatings[bookTitle].count = bookRatings[bookTitle].count + 1;
        } else {
          bookRatings[bookTitle] = {
            total: review.star,
            count: 1,
            titleKnjige: review.titleKnjige,
            id: review.id
          };
        }
      }
    });

    const booksWithRatings = [];
    for (let key in bookRatings) {
      const ratingData = bookRatings[key];
      const averageRating = ratingData.total / ratingData.count;
    
      if (averageRating >= 4) {
        booksWithRatings.push({
          id: ratingData.id,
          averageRating: averageRating,
          reviewCount: ratingData.count,
          titleKnjige: ratingData.titleKnjige
        });
      }
    }
    booksWithRatings.sort(function (a, b) {
      let rezultat;
      if (b.averageRating === a.averageRating) {
        rezultat = b.reviewCount - a.reviewCount;
      } else {
        rezultat = b.averageRating - a.averageRating;
      }
      return rezultat;
    });
    // console.log(booksWithRatings);
    return booksWithRatings.slice(0, 5);
  } catch (error) {
    return [];
  }
}


async function topKnjige() {
  const swiperWrapper = document.querySelector(".swiper-wrapper");
  swiperWrapper.innerHTML = "";
  const topRatedBooks = await dohvacanjeTopKnjiga();

  let jsonKnjige = [];
  try {
    const response = await fetch("../gutenindex.json");
    const data = await response.json();
    jsonKnjige = data.results;
  } catch (error) {
    console.error("Error kod json books:", error);
  }

  for (const book of topRatedBooks) {
    try {
      let bookCover = "";
      let bookTitle = book.titleKnjige;
      let pronadenaKnjiga = false;
      // console.log(book.titleKnjige)

      const localKnjiga = jsonKnjige.find(b => b.id == book.id);
      
      if (localKnjiga) {
        bookCover = localKnjiga.formats?.["image/jpeg"] ;
        bookTitle = localKnjiga.title;
        pronadenaKnjiga = true;
      }

      if (!pronadenaKnjiga) {
        try {
          const query = encodeURIComponent(book.titleKnjige);
          const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
          const data = await googleResponse.json();
          // console.log(data)
          let pronadenaGoogleKnjiga = null;

          if ( data.totalItems > 0) {
            pronadenaGoogleKnjiga = data.items.find(item => {
              return item.volumeInfo.title == book.titleKnjige
          });
            
            if (!pronadenaGoogleKnjiga) {
              pronadenaGoogleKnjiga = data.items[0];
            }

            if (pronadenaGoogleKnjiga) {
              bookCover = pronadenaGoogleKnjiga.volumeInfo.imageLinks?.thumbnail;
              bookTitle = pronadenaGoogleKnjiga.volumeInfo.title;
            }
          }
        } catch (googleError) {
          console.error("Google Books API:", googleError);
        }
      }
      const slideHTML = `
        <div class="swiper-slide flex justify-center ">
          <div class="flex flex-col items-center">
            <img src="${bookCover}" 
                 class="h-60 w-40 rounded-xl shadow-md object-cover" />
            <div class="mt-2 text-center w-full px-2">
              <h3 class="font-medium text-sm line-clamp-1">${bookTitle}</h3>
              <div class="flex justify-center items-center mt-1">
                ${stvoriStars(book.averageRating)}
                <span class="text-xs text-gray-500 ml-1">(${book.reviewCount})</span>
              </div>
            </div>
          </div>
        </div>
      `;
      swiperWrapper.innerHTML += slideHTML;

    } catch (error) {
      console.error("Error učitavanje knjige"+ error);
    }
  }
  swiper();
}

//Korišten https://swiperjs.com/swiper-api
function swiper() {
  window.swiper = new Swiper('.swiper-container', {
    slidesPerView: 'auto',
    spaceBetween: 20,
    loop: true,
    autoplay: {
      delay: 3000,
    },
  });
}

topKnjige()
fetchKnjige();