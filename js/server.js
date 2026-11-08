import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { bioInp, bioPreview, displayNamePreview, loadingBG, mostPlayedList, pfpBGselect, pfpChoices, pfpPreview, userBioInput, usernamePreview } from "./dom.js";
import { consoleLookup, getPlatform } from "./cores.js";
import { getGameMetadata } from "./metadata.js";

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

if (signupUsername) {
    signupUsername.addEventListener("input", ()=> {
        signupUsername.value =  signupUsername.value.replace(/[^a-z0-9]/g, "");
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

if (document.body.classList.contains("settings")) {
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, bio, avatar_bg, collection, avatar_url, username")
        .eq("uuid", user.id)
        .maybeSingle();
    displayNamePreview.value = profile.display_name || profile.username;
    pfpPreview.src = profile.avatar_url;
    usernamePreview.textContent = profile.username;
    displayNamePreview.addEventListener("change", async () => {
        const display_name = displayNamePreview.value.trim();
        const { error } = await supabase
            .from("profiles")
            .update({ display_name })
            .eq("uuid", user.id);
        if (error) {
            console.error("Failed to save display name:", error);
        }
    });
    pfpChoices.forEach(choice => {
        choice.addEventListener("click", async () => {
            pfpChoices.forEach(el => el.classList?.remove("selected"));
            const avatar_url = choice.src.replace(window.location.origin, "");
            const { error } = await supabase
                .from("profiles")
                .update({ avatar_url })
                .eq("uuid", user.id);
            if (error) {
                console.error("Failed to save avatar:", error);
            }
            choice.classList.add("selected");
            pfpPreview.src = avatar_url;
        });
    });
    pfpBGselect.addEventListener("input", async () => {
        const avatar_bg = pfpBGselect.value.trim();
        const { error } = await supabase
            .from("profiles")
            .update({ avatar_bg })
            .eq("uuid", user.id);
        if (error) {
            console.error("Failed to save avatar:", error);
        }
        pfpPreview.style.background = avatar_bg;
    });
    pfpPreview.style.background = profile.avatar_bg || "black";
    pfpBGselect.value = profile.avatar_bg;
    document.querySelector(`img[src="${profile.avatar_url.replace(window.location.origin, "")}"]`).classList.add("selected");
    bioInp.value = profile.bio || "";
    bioPreview.innerHTML = marked.parse(bioInp.value.trim());
    bioInp.addEventListener("input", ()=> {
        bioPreview.innerHTML = DOMPurify.sanitize(marked.parse(bioInp.value.trim()))
    });
    bioInp.addEventListener("change", async () => {
        const bio = bioInp.value.trim();
        const { error } = await supabase
            .from("profiles")
            .update({ bio })
            .eq("uuid", user.id);
        if (error) {
            console.error("Failed to save bio:", error);
        }
    });
}

if (document.getElementById("profile")) {
    if (user && document.body.classList.contains("self")) {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("display_name, bio, created_at, collection, avatar_url, username, avatar_bg, title")
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
            document.getElementById("pfAvatar").style.background = profile.avatar_bg;
            document.getElementById("pfDP").textContent = profile.display_name || profile.username;
            const date = new Date(profile.created_at);
            const formatted = new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            }).format(date);
            const createdAt = new Date(profile.created_at.replace(" ", "T"));
            const now = new Date();
            const days = Math.floor((now - createdAt) / 86400000);
            if (days < 7) {
                window.utitle = "Newbie"
            } else if (days < 30) {
                window.utitle = "Novice"
            } else if (days < 90) {
                window.utitle = "Amateur"
            } else if (days < 180) {
                window.utitle = "Seasoned"
            } else if (days < 270) {
                window.utitle = "Elite"
            } else if (days < 365) {
                window.utitle = "Expert"
            } else if (days < 730) {
                window.utitle = "Elder"
            } else if (days < 1460) {
                window.utitle = "Veteran"
            } else {
                window.utitle = "Primordial"
            }
            if (profile.title) window.utitle = profile.title;
            document.getElementById("joinDate").textContent = `${window.utitle} \u2022 Joined ${formatted}`;
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
                    <img src="${metadata.cover || metadata.icon || "/assets/img/cover.svg"}"alt="Cover">
                    <div class="liCol">
                        <h3>${metadata?.title ?? game.filename}</h3>
                        <p>Console: ${consoleLookup[getPlatform(game.filename)]}</p>
                        <p>${Math.round(game.playtime / 360) / 10} hours on record.</p>
                    </div>
                `;
                mostPlayedList.appendChild(li);
            }
            bioPreview.innerHTML = DOMPurify.sanitize(marked.parse(profile.bio));
        }
    } else if (document.body.classList.contains("other")) {
        const username = decodeURIComponent(
            window.location.pathname.split("/").pop()
        );
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("uuid, username, display_name, bio, created_at, collection, avatar_url, avatar_bg, title")
            .eq("username", username)
            .maybeSingle();

        if (profile.display_name) {
            document.title = `${profile.display_name}'s Profile | Tungsten Emulator`
        } else {
            document.title = `${profile.username}'s Profile | Tungsten Emulator`
        }

        try {
            const { data: um, error: ume } = await supabase
                .from("profiles")
                .select("username, display_name, avatar_url, avatar_bg")
                .eq("uuid", user.id)
                .maybeSingle();
            document.getElementById("avatar").src = window.um.avatar_url;
            document.getElementById("avatar").style.background = um.avatar_bg;
            document.getElementById("displayName").textContent = um.display_name || um.username;
        } catch(err) {
            
        }
    
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
            document.getElementById("pfAvatar").style.background = profile.avatar_bg;
            console.log(profile);
            document.getElementById("pfDP").textContent = profile.display_name || profile.username;
            const date = new Date(profile.created_at);
            const formatted = new Intl.DateTimeFormat("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            }).format(date);
            const createdAt = new Date(profile.created_at.replace(" ", "T"));
            const now = new Date();
            const days = Math.floor((now - createdAt) / 86400000);
            if (days < 7) {
                window.utitle = "Newbie"
            } else if (days < 30) {
                window.utitle = "Novice"
            } else if (days < 90) {
                window.utitle = "Amateur"
            } else if (days < 180) {
                window.utitle = "Seasoned"
            } else if (days < 270) {
                window.utitle = "Elite"
            } else if (days < 365) {
                window.utitle = "Expert"
            } else if (days < 730) {
                window.utitle = "Elder"
            } else if (days < 1460) {
                window.utitle = "Veteran"
            } else {
                window.utitle = "Primordial"
            }
            if (profile.title) window.utitle = profile.title;
            document.getElementById("joinDate").textContent = `${window.utitle} \u2022 Joined ${formatted}`;
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
                if (metadata) {
                    li.innerHTML = `
                        <img src="${metadata.cover || metadata.icon || "/assets/img/cover.svg"}"alt="Cover">
                        <div class="liCol">
                            <h3>${metadata?.title ?? game.filename}</h3>
                            <p>Console: ${consoleLookup[getPlatform(game.filename)]}</p>
                            <p>${Math.round(game.playtime / 360) / 10} hours on record.</p>
                        </div>
                    `;
                }
                mostPlayedList.appendChild(li);
            }
            bioPreview.innerHTML = DOMPurify.sanitize(marked.parse(profile.bio)) || "";
        }
    }
}

if (document.getElementById("avatar")) {
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url, avatar_bg")
        .eq("uuid", user.id)
        .maybeSingle();
    document.getElementById("avatar").src = profile.avatar_url || "/assets/img/avatarBlank.svg";
    document.getElementById("avatar").style.background = profile.avatar_bg || "transparent";
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
