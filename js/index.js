if (document.getElementById("currentYear")) {
    document.getElementById("currentYear").textContent = new Date().getFullYear();
}
if (!localStorage.getItem("tungstenTheme")) localStorage.setItem("tungstenTheme", "basicDark");

export function applyTheme() {
    document.body.classList.remove("basicLight");
    document.body.classList.remove("basicDark");
    document.body.classList.remove("xenonLight");
    document.body.classList.remove("xenonDark");
    document.body.classList.remove("leptonLight");
    document.body.classList.remove("leptonDark");

    document.body.classList.remove("vermillionDark");
    document.body.classList.remove("apricotLight");
    document.body.classList.remove("saffronLight");
    document.body.classList.remove("asparagusLight");
    document.body.classList.remove("viridianDark");
    document.body.classList.remove("cascadeLight");
    document.body.classList.remove("zephyrDark");
    document.body.classList.remove("wisteriaLight");
    
    document.body.classList.remove("apple");
    document.body.classList.remove("candy");
    document.body.classList.remove("cardboard");
    document.body.classList.remove("galaxy");
    
    document.body.classList.remove("obsidian");
    document.body.classList.remove("dune");
    document.body.classList.remove("abyss");
    document.body.classList.remove("forest");
    document.body.classList.remove("tundra");
    document.body.classList.remove("blossom");

    document.body.classList.add(localStorage.getItem("tungstenTheme"));
}

applyTheme();

const tag1 = document.getElementById("tag1");
const tag2 = document.getElementById("tag2");
const tag3 = document.getElementById("tag3");

function reset() {
    tag1.style.color = "var(--col-btnText)";
    tag2.style.color = "var(--col-btnText)";
    tag3.style.color = "var(--col-btnText)";
}

function animateTags() {
    reset();

    setTimeout(() => {
        tag1.style.color = "var(--col-error)";
    }, 1000);

    setTimeout(() => {
        tag2.style.color = "var(--col-warning)";
    }, 2000);

    setTimeout(() => {
        tag3.style.color = "var(--col-success)";
    }, 3000);

    setTimeout(() => {
        reset();
        animateTags();
    }, 4000);
}

if (tag1 && tag2 && tag3) {
    animateTags();
}

document.addEventListener("keydown", (e)=> {
    if (e.code === "Slash" && e.shiftKey && e.altKey) {
        const a = document.createElement("a");
        a.href = "/settings";
        a.click();
    } else if (e.code === "KeyC" && e.altKey && e.shiftKey) {
        const a = document.createElement("a");
        a.href = "/collection";
        a.click();
    } else if (e.code === "KeyP" && e.altKey) {
        const a = document.createElement("a");
        a.href = "/profile/me";
        a.click();
    }
});

if (window.location.hostname === "xenon-emulator.netlify.app") {
    const a = document.createElement("a");
    a.href = `https://tungsten-emulator.pages.dev${window.location.pathname}`;
    a.click();
}