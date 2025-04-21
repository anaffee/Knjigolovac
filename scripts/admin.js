import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getDatabase, ref, child, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import {app, auth, db, db1} from "./firebase.js";

let modal = document.getElementById("my_modal_1");
let divKorisnici = document.getElementById("prikazKorisnika");
divKorisnici.innerHTML = "Loading..."; 

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const isAdmin = await provjeraAdmina(user.uid);
        if (!isAdmin) {
        // divKorisnici.innerHTML = "Nemate pristup ovoj stranici.";
        modal.showModal();
    } else {
        await prikazSvihKorisnika(user);
    }
    }
});

async function prikazSvihKorisnika() {
    const korisniciRef = ref(db, "Korisnik");
    get(korisniciRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const korisnici = snapshot.val();
                divKorisnici.innerHTML = ""; 

                for (const userId in korisnici) {
                    const korisnik = korisnici[userId];

                    let korisnikDiv = `
                    <div class="bg-[var(--lightish)] p-5 border rounded flex flex-row justify-between [@media(max-width:680px)]:flex-col [@media(max-width:680px)]:items-center" >
                        <div class="w-[100px] flex flex-col items-center justify-center">
                            <img src="${korisnik.pfp}" width="50" height="50" />
                            <h3 class="text-[var(--darkbluish)] font-bold text-xl">${korisnik.name}</h3>
                        </div>
                        <div class="flex flex-row">
                            <button class="deleteBtn text-[var(--light)] mt-[5px] font-bold bg-[var(--bluish)] border rounded p-2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-md" data-userid="${userId}">Izbriši</button>
                            <button class="profileBtn text-[var(--light)] mt-[5px] font-bold bg-[var(--bluish)] border rounded p-2 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-md" data-userid="${userId}">Profile</button>
                        </div>
                    </div>
                    `;

                    divKorisnici.innerHTML +=korisnikDiv;
                }

                document.querySelectorAll(".deleteBtn").forEach(button => {
                    button.addEventListener("click", (e) => {
                        const userId = e.target.getAttribute("data-userid");
                        deleteUser(userId);
                    });
                });
                document.querySelectorAll(".profileBtn").forEach(button => {
                    button.addEventListener("click", (e) => {
                        const userId = e.target.getAttribute("data-userid");
                        window.location.href = `./profile.html#${userId}`;

                    });
                });
            } else {
                divKorisnici.innerHTML = "Nema korisnika .";
            }
        })
        .catch((error) => {
            divKorisnici.innerHTML = "Error" +error;
        });
}

async function deleteUser(userId) {
    
    let odg = window.confirm("Jeste li sigurni da želite izbrisat ovaj profil?");
    if (odg) {
        try {
            const userRef = ref(db, `Korisnik/${userId}`);
            await remove(userRef);
            
            alert("Izbrisan je profil");
            prikazSvihKorisnika(); 
        } catch (error) {
            console.error("Error kod brisanja profila:", error);
        }
    }
}

async function provjeraAdmina(userId) {
    try {
        const admin = await get(ref(db, `admin/${userId}`));
        return admin.val() === true;
    } catch {
        return false;
    }
}

