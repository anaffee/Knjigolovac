
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getDatabase, ref, child, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import { app, auth, db, db1 } from "./firebase.js";

let profileNav = document.getElementById("profileNav");
let profileNav1 = document.getElementById("profileNav1");

let logoutBtn = document.getElementById("logout");
let logoutBtn1 = document.getElementById("logout1");

let burger = document.querySelector('.navbarBurger');
let menu = document.querySelector('.navbarMenu');
let close = document.querySelector('.navbarClose');
let backdrop = document.querySelector('.navbarBackdrop');
let adminNav = document.querySelector(".admin");
let navbar = document.querySelector(".ml-auto");
const welcome = document.getElementById("welcomePart");
const cijeliNavbar = document.querySelector("nav");
const heroSection = document.querySelector(".hero");

logoutBtn.addEventListener("click", logout);
logoutBtn1.addEventListener("click", logout);
burger.addEventListener('click', toggleMenu);
close.addEventListener('click', toggleMenu);
backdrop.addEventListener('click', toggleMenu);

adminNav.addEventListener("click", function () {
    onAuthStateChanged(auth, async (user) => {
        try {
            const snap = await get(ref(db, `admin/${user.uid}`));
            const isAdmin = snap.val() === true;
            if(isAdmin){
                await prikazSvihKorisnika(user);
            }
        } catch (error) {
            console.error("Greška kod provjere admin statusa:"+ error);
        }
    });
});


onAuthStateChanged(auth, (user) => {
    if (user) {
        navbar.style.visibility = "visible";
        profileNav.style.display = "flex";
        profileNav1.style.display = "flex";
    }
    else {
        navbar.style.visibility = "hidden";
        profileNav.style.display = "none";
        profileNav1.style.display = "none";
    }
})

function logout() {
    signOut(auth)
        .then(() => {
            if (welcome) {
                welcome.style.display = "none";
            }
            profileNav.style.display = "none";
            profileNav1.style.display = "none";

            window.location.href = "./knjigolovac.html";
        })
        .catch((error) => {
            console.error("Error kod sign out: " + error.message);
        });
}

function toggleMenu() {
    menu.classList.toggle('hidden');
}

if (cijeliNavbar || heroSection){
    const heroOffsetTop = heroSection.offsetTop + heroSection.offsetHeight;

    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY;

        if (scrollPos >= heroOffsetTop) {
            cijeliNavbar.classList.remove("bg-transparent");
            cijeliNavbar.classList.add("bg-[var(--light)]", "shadow-md");
        } else {
            cijeliNavbar.classList.remove("bg-[var(--light)]", "shadow-md");
            cijeliNavbar.classList.add("bg-transparent");
        }
    });
}

    

    