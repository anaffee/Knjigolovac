import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getDatabase, ref, child, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { getAuth, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {app, auth, db,db1} from "./firebase.js";


const imeBtn = document.getElementById("promjeniImebtn");
let promjenaImena = document.getElementById("promjenaImena");
let sifraDiv = document.querySelectorAll(".sifra");
const spremiPromjene = document.getElementById("spremiPromjene");
let kliknuto = false

promjenaImena.style.display = "none";
spremiPromjene.addEventListener("click", updatePodKorisnika);

sifraDiv.forEach(function (e) {
    e.style.display = "none";
})

imeBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (!kliknuto) {
        promjenaImena.style.display = "flex";
        kliknuto = true;
    }
    else {
        promjenaImena.style.display = "none";
        kliknuto = false;
    }
})

//Update podatke korisnika
async function updatePodKorisnika(e) {
    e.preventDefault();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userRef = ref(db, "Korisnik/" + userId);
            try {
                const snapshot = await get(userRef);
                if (snapshot.exists()) {

                    const userData = snapshot.val();
                    // console.log(userData)
                    // console.log(document.getElementById("opis").value)
                    if (kliknuto) {
                        let newUsername = document.getElementById("username").value;
                        userData.name = newUsername;
                        await updateProfile(user, {
                            displayName: newUsername
                        });
                    }
                    userData.description = document.getElementById("opis").value || "Nema opisa";
                    await set(userRef, userData);
                    alert("Podaci su uspješno ažurirani!");
                } else {
                    console.log("Data nije dostupna");
                }
            } catch (error) {
                console.log("Error dohvacanje data: ", error);
            }
        } 
    });
}

