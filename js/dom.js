export const uploadTrigger = document.getElementById("uploadTrigger");
export const uploadEl = document.getElementById("uploadBtn");
export const gameTitleText = document.getElementById("gameName");
export const gameHero = document.getElementById("gameHero");
export const gameLogo = document.getElementById("gameLogo");
export const runBtn = document.getElementById("run");
export const runStatusText = document.getElementById("runStatus");
export const runStatusIcon = document.getElementById("runStatusIcon");
export const reuploadBtn = document.getElementById("reuploadRom");
export const reuploadInput = document.getElementById("reuploadInput");
export const removeGameBtn = document.getElementById("removeRom");
export const gameListEl = document.getElementById("gameList");
export const noneFound = document.getElementById("noneFound");
export const recordHours = document.getElementById("recordHours");
export const loadingBG = document.getElementById("loading");
export const favouriteBtn = document.getElementById("favourite");
export const favStateIcon = document.getElementById("favState");
export const consoleText = document.getElementById("consoleIdentity");
export const gameSearch = document.getElementById("gameSearch");
export const missingBadge = document.getElementById("missing");
export const descTitle = document.getElementById("descTitle");
export const gameDesc = document.getElementById("gameDesc");
export const noDesc = document.getElementById("nodesc");
export const gSHA256 = document.getElementById("gSHA256");
export const shaWrapper = document.getElementById("shaWrapper");
export const gFilename = document.getElementById("gFilename");
export const gFilesize = document.getElementById("gFilesize");
export const mostPlayedList = document.getElementById("mostPlayedList");
export const bioCharaLimit = document.getElementById("bioCharaLimit");
export const userBioInput = document.getElementById("userBio");

const optionsTrigger = document.getElementById("runOptionsTrigger");
const optionsMenu = document.getElementById("runOptionsMenu");
export const saveLocally = document.getElementById("saveLocally");

if (shaWrapper) shaWrapper.hidden = true;
if (gameDesc) gameDesc.hidden = true;
if (noneFound) noneFound.hidden = true;
if (missingBadge) missingBadge.hidden = true;
if (gameLogo) gameLogo.style.display = "none";

// adds a game to the ui list
export function addGameToList(game) {
    const li = document.createElement("li");
    li.dataset.sha256 = game.sha256;
    li.dataset.filename = game.filename;
    li.dataset.title = game.title ?? "";
    li.classList.add("listROM");

    li.title = game.title ?? game.filename.replace(/\.[^.]+$/, "") ?? "(invalid ROM file)";

    if (game.missing)
        li.classList.add("missing");

    const img = document.createElement("img");
    img.src = game.icon || "/assets/img/avatarBlank.svg"
    const text = document.createElement("span");
    text.textContent = game.title ?? game.filename.replace(/\.[^.]+$/, "");

    li.append(
        img,
        text
    );

    gameListEl.appendChild(li);
    updateEmptyState();
}

// updates rom local state
export function markRomInstalled(sha256) {
    const li = gameListEl.querySelector(
        `[data-sha256="${sha256}"]`
    );
    if (!li)
        return;
    li.classList.remove("missing");
}

// updates display
export function showGameDetails(rom) {
    gameTitleText.textContent =
        rom.title ??
        rom.filename.replace(/\.[^.]+$/, "");

    gameTitleText.classList.remove("ital");
    gameHero.src =
        "/assets/img/avatarBlank.svg";

    runStatusText.textContent = "Play";
    runStatusIcon.textContent = "play_arrow";
}


// applies play button state refresh
export function updateRunButton(
    selectedRom,
    emulatorWindow
) {
    const running =
        emulatorWindow &&
        !emulatorWindow.closed;


    runBtn.disabled =
        !selectedRom ||
        running;
}


// Empty collection message
export function updateEmptyState() {
    noneFound.hidden =
        gameListEl.children.length > 0;
}

if (gameSearch) {
    gameSearch.addEventListener("input", () => {
        const search = gameSearch.value.trim().toLowerCase();

        const listROM = document.querySelectorAll(".listROM");
        listROM.forEach(li => {
            const title = li.title.toLowerCase();
            const filename = li.dataset.filename.toLowerCase();
            li.hidden = !title.includes(search) && !filename.includes(search);
        });
    });
}

if (optionsTrigger) {
    optionsTrigger.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!runBtn.disabled) {
            optionsMenu.classList.toggle("show");
        }
    });
}

if (optionsMenu) {
    document.addEventListener("click", () => {
        optionsMenu.classList.remove("show");
    });
}

document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.code === "KeyS") {
        event.preventDefault();
    }
});