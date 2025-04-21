import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getDatabase, ref, child, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { getAuth, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {app, auth, db, db1} from "./firebase.js";

let reviewBox = document.querySelector(".reviewBox");
let recenzijaWarning = document.getElementById("warningRecenzija");
let submitRecenzija = document.getElementById("submitRecenzija");
let naslovInput = document.getElementById("naslov");
let opisInput = document.getElementById("opis");

submitRecenzija.addEventListener("click", recenzija);

let isAdmin = false;
let trenutniUser = false;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        trenutniUser = user.uid
        isAdmin = await provjeraAdmina(user.uid);
        dohvatRecenzija();
    } else {
        trenutniUser = null;
        isAdmin = false;
        dohvatRecenzija(); 
    }
});

async function dohvatRecenzija() {
    const querySnapshot = await getDocs(collection(db1, "reviews"));
    let sveRecenzije = [];
    const idBook = localStorage.getItem("idKnjige");
    let reviewHTML = "";
    recenzijaWarning.innerHTML = "";

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        // console.log(data);
        if (data.id === idBook) {
            reviewHTML += kreirajHTMLRecenziju({...data, 
                docId: doc.id,
                 isCurrentUser: data.korisnikId === trenutniUser}); 
        }
        else if(parseInt(data.id) === data.id) {
            sveRecenzije.push({...data, 
                docId: doc.id,
                 isCurrentUser: data.korisnikId === trenutniUser}); 
        }
    });
    
    const randomRecenzije = sveRecenzije.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    randomRecenzije.forEach(recenzija => {
        reviewHTML += kreirajHTMLRecenziju(recenzija); 
    });

    reviewBox.innerHTML = reviewHTML || "<p>Nema dostupnih recenzija za ovu knjigu.</p>";

    document.querySelectorAll(".edit").forEach(btn=>{
        btn.addEventListener("click", (e)=>{
            // console.log("das")
            const docId = e.target.dataset.docId;
            prikaziEdit(docId);
        })
    })

    if (isAdmin) {
        document.querySelectorAll(".deleteReview").forEach(button => {
            button.addEventListener("click", async (e) => {
                const docId = e.target.dataset.docId;
                let odg = confirm("Jeste li sigurni da želite obrisati ovu recenziju?");
                if (odg) {
                    await deleteRecenziju(docId);
                }
            });
        });
    }
}
function prikaziEdit(docId){
    let reviewEle = document.querySelector(`[data-review-id="${docId}"]`);
    let naslov = document.querySelector(".reviewTitle").textContent;
    let opis = document.querySelector(".reviewDesc").textContent;
    let stars = reviewEle.querySelectorAll(".maskStar.bg-yellow-300");
    let ratingInputs = document.querySelectorAll('input[name="rating-1"]');
    let ratingStar = stars.length;

    naslovInput.value = naslov;
    opisInput.value = opis;

    ratingInputs.forEach(input=>{
        input.checked = parseInt(input.value) == ratingStar;
    })

    submitRecenzija.textContent = "Ažuriraj recenziju";
    submitRecenzija.dataset.editMode = "true";
    submitRecenzija.dataset.docId = docId;
    
}

async function deleteRecenziju(docId) {
    try {
        await deleteDoc(doc(db1, "reviews", docId));
        
        const [userId, bookId] = docId.split('_');
        
        if (userId && bookId) {
            await remove(ref(db, "Korisnik/" + userId + "/recenzije/" + bookId));
        }
        
        recenzijaWarning.innerHTML = "Recenzija uspješno obrisana!";
        await dohvatRecenzija();
    } catch (error) {
        console.error("Greška pri brisanju:", error);
        recenzijaWarning.innerHTML = "Došlo je do greške pri brisanju recenzije.";
    }
}

function kreirajHTMLRecenziju(recenzija) {
    const starRating = parseInt(recenzija.star);
    let html = `
        <div data-review-id="${recenzija.docId}" class="review mb-[20px] border border-black-400 relative p-2 rounded-lg" data-review-id="${recenzija.docId}">
            <div class="absolute top-2 right-2 flex flex-row items-center">
        ${recenzija.isCurrentUser ? `<button class="edit text-[var(--darkbrown)]  font-bold bg-white border-white rounded p-2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-md mr-[15px]"  
                                    data-doc-id="${recenzija.docId}">
                                Uredi
                            </button>`
                         : ''}
        ${isAdmin ? `
                <button class="deleteReview   text-[var(--light)]  font-bold bg-[var(--bluish)] rounded-full w-6 h-6 flex items-center justify-center transition-all duration-300 ease-in-out hover:shadow-md hover:scale-110" 
                        data-doc-id="${recenzija.docId}">
                    ×
                </button>
            ` : ''}
            </div>
            <div class="rating rating-lg rating-half">
    `;

    for (let i = 1; i <= 5; i++) {
        html += `
          <div class="mask mask-star opacity-100 ${i <= starRating ? 'bg-yellow-300' : 'bg-gray'}" aria-label="${i} star"></div>
        `;
    }
    html += `
            </div>
            <h2 class="review-user">${recenzija.korisnik}</h2>
            <h3 class="reviewTitle">${recenzija.naslov}</h3>
            <p class="reviewDesc">${recenzija.opis}</p>
        </div>
    `;

    return html;
}

async function recenzija() {
    const user = auth.currentUser;
    if (user) {
        let rating = document.querySelector('input[name="rating-1"]:checked');
        let idKnjiga = localStorage.getItem("idKnjige");
        let authorKnjige = localStorage.getItem("authorKnjige");
        let titleKnjige = localStorage.getItem("titleKnjige");
        let naslov = naslovInput.value;
        let opis = opisInput.value;
        let userId = user.uid;
       
        if (rating) {
            rating = parseInt(rating.value);
        } else {
            rating = null;
        }
        
        let provjera = true;
        if (!naslov || naslov == " " || !opis || opis == " " || rating === null) {
            recenzijaWarning.innerHTML = "Niste unijeli sve podatke. Molim vas pokušajte ponovno.";
            provjera = false;
        }

        if(provjera){
            const recenzijaData = {
                id: idKnjiga,
                korisnik: user.displayName,
                naslov: naslov,
                opis: opis,
                star: rating,
                titleKnjige: titleKnjige,
                authorKnjige: authorKnjige,
                korisnikId: userId 
            };

            try {
                const isEditMode = submitRecenzija.dataset.editMode === "true"
                let docId;
                if (isEditMode) {
                  docId = submitRecenzija.dataset.docId;
                } else {
                    docId = `${userId}_${idKnjiga}`;
                }
                await update(ref(db, "Korisnik/" + userId + "/recenzije/" + idKnjiga), recenzijaData);
                await setDoc(doc(db1, "reviews", docId), recenzijaData);
                
                naslovInput.value = "";
                opisInput.value = "";

                if (document.querySelector('input[name="rating-1"]:checked')) {
                    document.querySelector('input[name="rating-1"]:checked').checked = false;
                }

                recenzijaWarning.innerHTML = "Recenzija uspješno dodana!";
                submitRecenzija.textContent = "Pošalji recenziju";
                submitRecenzija.dataset.editMode = "false";

                submitRecenzija.removeAttribute("data-doc-id");

                await dohvatRecenzija();
                
            } catch (error) {
                console.error("Greška:", error);
                recenzijaWarning.innerHTML = "Došlo je do greške pri spremanju recenzije.";
            }
        }
    } else {
        recenzijaWarning.innerHTML = "Morate biti prijavljeni da biste ostavili recenziju.";
    }
}

async function provjeraAdmina(userId) {
    try {
        const snap = await get(ref(db, `admin/${userId}`));
        return snap.val() === true;
    } catch (error) {
        console.error("Greška pri provjeri admin statusa:", error);
        return false;
    }
}

dohvatRecenzija();