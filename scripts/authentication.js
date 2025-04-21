
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getDatabase, ref, child, get, set, update, remove, push } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import {app, auth, db,db1} from "./firebase.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const provider = new GoogleAuthProvider();

const GoogleSignup = document.getElementById("googleSignUp");
let signupBox = document.getElementById("signupBox");
let loginBox = document.getElementById("loginBox");
loginBox.style.display="none"; 

let warning = document.getElementById("warning");

const klikLogin = document.getElementById("klikLogin");
const klikSignUp = document.getElementById("klikSignup");

const welcome = document.getElementById("welcomePart");
const dobrodosli = document.getElementById("dobrodosliUser");
let profileNav = document.getElementById("profileNav");
let profileNav1 = document.getElementById("profileNav1");
let passwordIcons = document.querySelectorAll(".form-control svg")

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signup");

signupBtn.addEventListener("click", prijava);
loginBtn.addEventListener("click", login);
GoogleSignup.addEventListener("click", GooglePrijava);

klikLogin.addEventListener("click", function(){
    signupBox.style.display="none";
    loginBox.style.display="flex";
});

klikSignUp.addEventListener("click", function(){
    signupBox.style.display="flex";
    loginBox.style.display="none";
});

async function login(e) {
    e.preventDefault();
    // console.log("gv")
    warning.innerHTML = "";

    const email = document.getElementById("emailLogin").value;
    const password = document.getElementById("passwordLogin").value;
    if (email === "" || password === "") {
        warning.innerHTML = "Molim vas unesite sve podatke";
    }
    else {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                // console.log(user);
                provjeriCurrentUser();
                
            })
            .catch((error) => {
                console.log( "Error kod login: " +error);
            })
    }
}

async function prijava(e) {
    e.preventDefault();

    warning.innerHTML = "";
    const Username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPass = document.getElementById("confirmPassword").value;

    if (!email || !Username || !password || !confirmPass) {
        warning.innerHTML = "Molim vas unesite sve podatke";
    }

    if (!sigurniPass(password)) {
        warning.innerHTML = "Zaporka vam nije jaka. Molim vas pokušajte ponovno.";
    }

    if (password !== confirmPass) {
        warning.innerHTML = "Zaporke vam se ne podudaraju. Molim vas pokušajte ponovno.";
    }

    try {
        const userInfo = await createUserWithEmailAndPassword(auth, email, password);
        const user = userInfo.user;

        await updateProfile(user, {
            displayName: Username
        });

        provjeriCurrentUser();

        const userId = user.uid;
        const korisnik = {
            id: userId,
            name: user.displayName,
            pfp: "../images/pfp.webp",
            description: "",
            wishlist: {},
            citam: {},
        };

        await set(ref(db, "Korisnik/" + userId), korisnik);
        await setDoc(doc(db1, "users", `${userId}`), korisnik);

        location.reload();
    } catch (error) {
        warning.innerHTML = "Greška prilikom registracije: " + error.message;
    }
}


function sigurniPass(password) {
    if (password.length < 8) {
        return false;
    }

    let velikaSlova = false;
    let brojevi = false;
    let posebniZnakovi = false;

    for (let i = 0; i < password.length; i++) {
        const char = password[i];

        if (char >= "A" && char <= "Z") {
            velikaSlova = true;
        }
        if (char >= "0" && char <= "9") {
            brojevi = true;
        }
        if ('!@#$%^&*(),.?":{}|<>'.indexOf(char) !== -1) {
            posebniZnakovi = true;
        }
    }
    if (velikaSlova && brojevi && posebniZnakovi) {
        return true;
    }
    else {
        return false;
    }
}

async function GooglePrijava() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        // console.log(user);
        const userId = user.uid;  
        const displayName = user.displayName;  
        const email = user.email;  
        const photoURL = "../images/pfp.webp"; 

        const korisnikData = {
            id: userId,
            name: displayName,
            email: email,
            pfp: photoURL,
            description: "", 
            wishlist: {},  
            citam: {}  
        };

        await set(ref(db, "Korisnik/" + userId), korisnikData);

    } catch (error) {
        console.error("Error:" + error.message);
    }
}


async function provjeriCurrentUser(){
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // console.log(user.displayName);
            // console.log(user)
            welcome.style.display = "flex";
            loginBox.style.display="none";
            signupBox.style.display="none";
            profileNav.style.display="flex"
            profileNav1.style.display="flex"

            dobrodosli.innerText =`Dobrodošli ${user.displayName}!`;
        } else {
            console.log("Nema korisnika");
            profileNav.style.display="none"
            profileNav1.style.display="none"
            welcome.style.display="none";
            signupBox.style.display="flex";
        }
      });
}

passwordIcons.forEach(icon => {
    icon.addEventListener("click", function() {
      let input = this.parentElement.querySelector("input");
      let isPassword = input.type == "password";
      
      input.type = isPassword ? "text" : "password";
      this.innerHTML = isPassword ? 
        `<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
         <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />` :
        `<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />`;
    });
  });

provjeriCurrentUser();
