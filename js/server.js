import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { bioCharaLimit, loadingBG, mostPlayedList, userBioInput } from "./dom.js";
import { consoleLookup, getPlatform } from "./cores.js";
import { getGameMetadata, secondsToHM } from "./metadata.js";

const projectURL = "https://uheoensvodegstcnunay.supabase.co";
const publishableKey = "sb_publishable_J9Mcy6wfFlE1OO4euTnVJg_Ncnrh35r";

export const supabase = createClient(projectURL, publishableKey);

//ui__signup
const signupEmail = document.getElementById("signupEmail");//input:text
const signupPassword = document.getElementById("signupPassword");//input:password
const signupUsername = document.getElementById("signupUsername");//input:text
const signupSubmit = document.getElementById("signupSubmit");//button
const signupError = document.getElementById("signupError");

// signup
async function signUpNewUser(email, password, username, displayName) {
    if (!email) return; if (!password) return; if (!username) return;
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: `${window.location.origin}/collection`,
            data: {
                username: username,
                display_name: displayName || username
            }
        },
    });

    if (error) { 
        signupError.style.color = "var(--col-error)";
        signupError.textContent = `ERROR: ${error.message}`;
        return;
    }

    signupError.style.color = "var(--col-success)";
    signupError.textContent = "Success! Check your email to confirm your account.";
}

if (signupSubmit) {
    signupSubmit.addEventListener("click", (e)=> {
        e.preventDefault();
        signUpNewUser(
            signupEmail.value.trim(),
            signupPassword.value.trim(),
            signupUsername.value.trim()
        );
    });
}

//ui__login
const loginGithub = document.getElementById("loginGithub"); //button
const loginDiscord = document.getElementById("loginDiscord");//button
const loginGoogle = document.getElementById("loginGoogle");//button
const loginEmail = document.getElementById("loginEmail");//input:text
const loginPassword = document.getElementById("loginPassword");//input:password
const loginSubmit = document.getElementById("loginSubmit");//button:submit
const loginError = document.getElementById("loginError");//p#loginError

//signin
async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) return;
    try {
        loginError.textContent = `ERROR: ${error.message}`;
    } catch(err) {
        console.warn(err)
    }
    window.location.href = "/collection";
}

if (loginSubmit) {
    loginSubmit.addEventListener("click", (e)=> {
        e.preventDefault();
        if (!loginEmail.value.trim()) {
            loginError.textContent = "ERROR: Missing Email.";
            return;
        } else if (!loginPassword.value.trim()) {
            loginError.textContent = "ERROR: Missing Password";
            return;
        }
        signInWithEmail(loginEmail.value.trim(), loginPassword.value.trim());
    });
}

if (loginGithub) {
    loginGithub.addEventListener("click", async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/collection`
            }
        });
    });
}

// reset password
async function forgotPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
            redirectTo: `https://${window.location.hostname}/auth/reset-password`,
        }
    )

    if (error) {
        loginError.style.color = "var(--col-error)";
        loginError.textContent = `ERROR: ${error.message}`;
        return
    }

    loginError.style.color = "var(--col-accent)";
    loginError.textContent = "If an account exists with this email, you'll receive an email with instructions to reset your password.";
    sessionStorage.setItem("recoveryEmail", email);
}

async function resetPasswordConfirm(password, confirmPassword) {
    if (password !== confirmPassword) {
        loginError.style.color = "var(--col-error)";
        loginError.textContent = `ERROR: Passwords do not match!`;
        return
    }

    const { error } = await supabase.auth.updateUser({
        password,
    });
    if (error) {
        loginError.style.color = "var(--col-error)";
        loginError.textContent = `ERROR: ${error.message}`;
        return
    }

    loginError.style.color = "var(--col-success)";
    loginError.textContent = "Password reset successfully. You will be redirected back to login in a moment."
    setTimeout(() => {
        const a = document.createElement("a");
        a.href = "/auth/login";
        a.click();
    }, 3000);
}

async function verifyOtp(code) {
    const { error } = await supabase.auth.verifyOtp({
        email: sessionStorage.getItem("recoveryEmail").trim(),
        token: code.trim(),
        type: 'recovery',
    })

    if (error) {
        loginError.textContent =
        'Invalid or expired code. Request a new recovery email.'
        return
    }
    loginError.textContent = "";
    rpC.style.display = "none";
    rpInputs.style.display = "flex";
}
const fpSubmit = document.getElementById("fpSubmit");
const rpSubmit = document.getElementById("rpSubmit");
const rp1 = document.getElementById("rp1");
const rp2 = document.getElementById("rp2");
const rpC = document.getElementById("rpC");
const rpInputs = document.getElementById("rpInputs");
const otpCodeInput = document.getElementById("code");
const otpSubmit = document.getElementById("otpSubmit");

if (rpInputs) rpInputs.style.display = "none";

if (fpSubmit) {
    fpSubmit.addEventListener("click", (e)=> {
        e.preventDefault();
        forgotPassword(loginEmail.value.trim());
    });
}
if (rpSubmit) {
    rpInputs.addEventListener("submit", (e)=> {
        e.preventDefault();
        resetPasswordConfirm(rp1.value.trim(), rp2.value.trim());
    });
}
if (otpSubmit) {
    rpC.addEventListener("submit", (e)=> {
        e.preventDefault();
        verifyOtp(otpCodeInput.value.trim());
        rpC.style.display = "none";
        rpInputs.style.display = "flex";
    });
}

// metadata injection
let loggedUser = null;
let userMetadata = null;
const outOpt = document.querySelectorAll(".gbtn");
const inOpt = document.querySelectorAll(".lbtn");
outOpt.forEach(e => {
    e.hidden = true;
});
const { data: { user }, error } = await supabase.auth.getUser();
if (user) {
    loggedUser = user;
    userMetadata = loggedUser["user_metadata"];
    if (["/auth/login", "/auth/login.html", "/auth/signup", "/auth/signup.html"].includes(window.location.pathname)) {
        window.location.href = "/collection"
    }
    outOpt.forEach(e => {
        e.hidden = false;
    });
    inOpt.forEach(e => {
        e.hidden = true;
    });
} else {
    if (document.body.classList.contains("private")) {
        const a = document.createElement("a");
        a.href = "/auth/login";
        a.click();
    }
}

if (document.getElementById("gameList")) {
    noneFound.hidden = gameList.children.length > 0;
}

if (document.getElementById("profile")) {
    if (user && document.body.classList.contains("self")) {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("display_name, bio, created_at, collection, avatar_url, username")
            .eq("uuid", user.id)
            .maybeSingle();
    
        if (profileError) {
            console.error("Profile query failed:", {
                code: profileError.code,
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint
            });
        } else if (!profile) {
            console.error("No profile found for user:", user.id);
        } else {
            document.getElementById("pfAvatar").src = profile.avatar_url || "/assets/img/avatarBlank.svg";
            document.getElementById("pfDP").textContent = profile.display_name || profile.username;
            const date = new Date(profile.created_at);
            const formatted = new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            }).format(date);
            document.getElementById("joinDate").textContent = formatted;
            const pubLink = document.getElementById("pubLink");
            pubLink.href = `/profile/${profile.username}`;
            loadingBG.classList.add("hidden");
            const sortedMostPlayed = Object.entries(profile.collection.games)
                .sort(([, a], [, b]) =>
                    Number(b.playtime ?? 0) - Number(a.playtime ?? 0)
                )
                .slice(0, 5)
                .map(([sha256, game]) => ({
                    sha256,
                    filename: game.filename,
                    playtime: Number(game.playtime ?? 0)
                }));
            for (const game of sortedMostPlayed) {
                const metadata = await getGameMetadata(
                    game.sha256,
                    getPlatform(game.filename)
                );
                const li = document.createElement("li");
                li.innerHTML = `
                    <img src="${metadata.cover || metadata.icon || "/assets/img/bannerBlank.svg"}"alt="Cover">
                    <div class="liCol">
                        <h3>${metadata?.title ?? game.filename}</h3>
                        <p>Console: ${consoleLookup[getPlatform(game.filename)]}</p>
                        <p>${Math.round(game.playtime / 360) / 10} hours on record.</p>
                    </div>
                `;
                mostPlayedList.appendChild(li);
            }
            userBioInput.value = profile.bio || "";
            bioCharaLimit.textContent = `${userBioInput.value.length}/250 chars`

            userBioInput.addEventListener("input", ()=> {
                bioCharaLimit.textContent = `${userBioInput.value.length}/250 chars`
            })
            userBioInput.addEventListener("change", async () => {
                const bio = userBioInput.value.trim();
                const { error } = await supabase
                    .from("profiles")
                    .update({ bio })
                    .eq("uuid", user.id);
                if (error) {
                    console.error("Failed to save bio:", error);
                }
            });
        }
    } else if (document.body.classList.contains("other")) {
        const username = decodeURIComponent(
            window.location.pathname.split("/").pop()
        );
        if (username.endsWith("s")) {
            document.title = `${username}' Profile | Tungsten Emulator`;
        } else {
            document.title = `${username}'s Profile | Tungsten Emulator`;
        }
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("uuid, username, display_name, bio, created_at, collection, avatar_url")
            .eq("username", username)
            .maybeSingle();
    
        if (profileError) {
            console.error("Profile query failed:", {
                code: profileError.code,
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint
            });
        } else if (!profile) {
            console.error("No profile found for user:", profile.uuid);
        } else {
            document.getElementById("pfAvatar").src = profile.avatar_url || profile.picture || "/assets/img/avatarBlank.svg";
            console.log(profile);
            document.getElementById("pfDP").textContent = profile.display_name || profile.username;
            const date = new Date(profile.created_at);
            const formatted = new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            }).format(date);
            document.getElementById("joinDate").textContent = formatted;
            loadingBG.classList.add("hidden");
            const sortedMostPlayed = Object.entries(profile.collection.games)
                .sort(([, a], [, b]) =>
                    Number(b.playtime ?? 0) - Number(a.playtime ?? 0)
                )
                .slice(0, 5)
                .map(([sha256, game]) => ({
                    sha256,
                    filename: game.filename,
                    playtime: Number(game.playtime ?? 0)
                }));
            for (const game of sortedMostPlayed) {
                const metadata = await getGameMetadata(
                    game.sha256,
                    getPlatform(game.filename)
                );
                const li = document.createElement("li");
                li.innerHTML = `
                    <img src="${metadata.cover || metadata.icon || "/assets/img/cover.svg"}"alt="Cover">
                    <div class="liCol">
                        <h3>${metadata?.title ?? game.filename}</h3>
                        <p>Console: ${consoleLookup[getPlatform(game.filename)]}</p>
                        <p>${Math.round(game.playtime / 360) / 10} hours on record.</p>
                    </div>
                `;
                mostPlayedList.appendChild(li);
            }
            userBioInput.value = profile.bio || "";
        }
    }
}

if (document.getElementById("avatar")) {
    document.getElementById("avatar").src = userMetadata.avatar_url || "/assets/img/avatarBlank.svg";
}

if (loginDiscord) {
    loginDiscord.addEventListener("click", ()=> { alert("Logging in with Discord is currently not available. Please try again later.")});
}
if (loginGoogle) {
    loginGoogle.addEventListener("click", ()=> { alert("Logging in with Google is currently not available. Please try again later.")});
}
if (document.getElementById("displayName")) {
    document.getElementById("displayName").textContent = userMetadata.display_name || userMetadata.name;
}

const signoutButton = document.getElementById("signout");
const settingsSignout = document.getElementById("settingsSignout");
if (signoutButton) {
    signoutButton.addEventListener("click", async ()=> {
        const { data, error } = await supabase.auth.signOut();
        if (!error) window.location.href = "/auth/login";
    });
}
if (settingsSignout) {
    settingsSignout.addEventListener("click", async ()=> {
        const { data, error } = await supabase.auth.signOut();
        if (!error) window.location.href = "/auth/login";
    });
}