import {
    saveRom,
    loadRom,
    deleteRom,
    localSaveRom
} from "./idb.js";

import { cloud, syncCollection } from "./cloud.js";
import {
    uploadTrigger, uploadEl, 
    gameListEl, noneFound, 
    gameTitleText, gameHero, runBtn, runStatusText,
    runStatusIcon, reuploadBtn, reuploadInput,
    removeGameBtn, recordHours, loadingBG,
    favouriteBtn, favStateIcon,
    consoleText, missingBadge,
    addGameToList, gameLogo,
    noDesc, gameDesc,
    gSHA256,
    shaWrapper,
    gFilename,
    gFilesize
} from "./dom.js";

import { runGame, setEmulatorCloseCallback } from "./emulator.js";

import {
    getGameMetadata
} from "./metadata.js";

import {
    getPlatform,
    getConsoleSVG,
    consoleLookup
} from "./cores.js";

let selectedRom = null;
let selectedSha256 = null;
let emulatorRunning = false;
let collectionGames = {};
let selectedFavourite = false;

noneFound.hidden = true;

uploadTrigger.addEventListener(
    "click",
    () => uploadEl.click()
);

uploadEl.addEventListener(
    "change",
    async () => {
        const file = uploadEl.files[0];
        if (!file)
            return;

        try {
            const sha256 = await hashFile(file);
            const rom = {
                sha256,
                file,
                filename: file.name,
                size: file.size,
                added: Date.now()
            };

            await saveRom(rom);
            await cloud.addGame(
                sha256,
                file.name
            );

            addGameToList(rom);
        } catch(err) {
            console.error(err);
        } finally {
            uploadEl.value = "";
        }
    }
);

function markRomInstalled(sha256) {
    const li =
        gameListEl.querySelector(
            `[data-sha256="${sha256}"]`
        );

    if (!li)
        return;
    li.classList.remove("missing");
}

function updateFavouriteButton() {
    favStateIcon.textContent =
        selectedFavourite
            ? "star"
            : "star_border";
    favStateIcon.title =
        selectedFavourite
                ? "Unfavourite Game"
                : "Favourite Game";
}

gameListEl.addEventListener(
    "click",
    async e => {
        const li =
            e.target.closest("li");
        if (!li)
            return;

        selectedSha256 =
            li.dataset.sha256;

        gameListEl
            .querySelector(".selected")
            ?.classList.remove("selected");
        li.classList.add("selected");
        const game = collectionGames[selectedSha256];
        const rom = await loadRom(selectedSha256);
        if (rom) {
            missingBadge.hidden = true;
        } else {
            missingBadge.hidden = false;
        }

        if (!rom) {
            selectedRom = null;
            selectedFavourite = game?.favourite ?? false;
            updateFavouriteButton();

            const metadata = await getGameMetadata(
                selectedSha256,
                getPlatform(li.dataset.filename)
            );

            showGameDetails({
                sha256: selectedSha256,
                filename: li.dataset.filename,
                ...metadata,
                title: game?.title ?? metadata?.title ?? li.dataset.title
            });

            reuploadBtn.hidden = false;
            updateRunButton();
            return;
        }

        const metadata =
            await getGameMetadata(
                rom.sha256,
                getPlatform(rom.filename)
            );

        selectedRom = {
            ...rom,
            ...metadata
        };

        selectedFavourite = game?.favourite ?? false;
        updateFavouriteButton();
        reuploadBtn.hidden = true;
        showGameDetails(selectedRom, rom ? true : false);
        updateRunButton();
    }
);

favouriteBtn.addEventListener(
    "click",
    async () => {

        if (!selectedSha256)
            return;

        selectedFavourite =
            !selectedFavourite;

        updateFavouriteButton();

        await cloud.favourite(
            selectedSha256,
            selectedFavourite
        );

        if (collectionGames[selectedSha256]) {
            collectionGames[selectedSha256].favourite =
                selectedFavourite;
        }
    }
);

function formatFileSize(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    let i = 0;

    while (bytes >= 1000 && i < units.length - 1) {
        bytes /= 1000;
        i++;
    }

    return `${bytes.toFixed(1)} ${units[i]}`;
}

function showGameDetails(rom, missing) {
    gameTitleText.textContent =
        rom.title ||
        rom.filename.replace(/\.[^.]+$/, "");
        
    descTitle.textContent =
        rom.title ||
        rom.filename.replace(/\.[^.]+$/, "");

    noDesc.style.display = rom.desc ? "none" : "block";
    gameDesc.style.display = rom.desc ? "block" : "none";
    gFilename.textContent = rom.filename;
    console.log(missing === undefined);
    if (missing === undefined) {
        gFilesize.textContent = "N/A"
    } else {
        gFilesize.textContent = formatFileSize(rom.size);
    }
    if (rom.desc) {
        gameDesc.innerHTML = rom.desc;
    }

    gSHA256.textContent = rom.sha256;
    shaWrapper.hidden = false;

    gameTitleText.classList.remove("ital");
    if (rom.banner) {
        gameHero.style.backgroundImage = `
        linear-gradient(
            to bottom,
            transparent 40%,
            #1a1d29 100%
        ),
        url(${rom.banner})`;
        gameHero.style.backgroundSize = "100%";
        gameHero.style.backgroundRepeat = "none";
    } else {
        const svgRef = getPlatform(rom.filename);
        gameHero.style.backgroundImage = `url(${getConsoleSVG(svgRef)})`;
        gameHero.style.backgroundRepeat = "repeat";
        if (gameHero.style.backgroundImage == "url(/assets/img/controllers/bannerBlank.svg") {
            gameHero.style.backgroundSize = "88px";
        } else {
            gameHero.style.backgroundSize = "196px auto";
        }
    }

    if (rom.logo) {
        gameLogo.style.display = "block";
        gameLogo.src = rom.logo;
        gameTitleText.style.display = "none";
    } else {
        gameTitleText.style.display = "block";
        gameLogo.style.display = "none";
        gameLogo.src = "";
    }

    try {
        consoleText.textContent = consoleLookup[getPlatform(rom.filename)];
    } catch {
        consoleText.textContent = "?????";
    }

    runStatusText.textContent = "Play";
    runStatusIcon.textContent = "play_arrow";
    const game = collectionGames[rom.sha256];
    const seconds = game?.playtime ?? 0;
    recordHours.textContent = (seconds / 3600).toFixed(1);
}

function updateRunButton() {
    runBtn.disabled =
        !selectedRom ||
        emulatorRunning;
}

removeGameBtn.addEventListener(
    "click",
    async () => {
        if (!selectedSha256)
            return;
        if (!confirm("Remove ROM? You will need to reupload your ROM to play at a later time.")) return;

        await deleteRom(
            selectedSha256
        );

        gameListEl
            .querySelector(
                `[data-sha256="${selectedSha256}"]`
            )
            ?.remove();

        selectedRom = null;
        selectedSha256 = null;
        updateEmptyState();
        updateRunButton();
    }
);

document.getElementById("removeGame").addEventListener(
    "click",
    async () => {
        if (!selectedSha256)
            return;
        if (!confirm("PERMANENTLY remove this game from your collection?\n(THIS CANNOT BE UNDONE!!!)")) return;
        await cloud.removeGame(
            selectedSha256
        );

        await deleteRom(
            selectedSha256
        );

        gameListEl
            .querySelector(
                `[data-sha256="${selectedSha256}"]`
            )
            ?.remove();

        selectedRom = null;
        selectedSha256 = null;
        updateEmptyState();
        updateRunButton();
    }
);

reuploadBtn.addEventListener(
    "click",
    () => {
        if(selectedSha256)
            reuploadInput.click();
    }
);

reuploadInput.addEventListener(
    "change",
    async () => {
        const file =
            reuploadInput.files[0];
        if(!file)
            return;
        const sha256 =
            await hashFile(file);

        if(sha256 !== selectedSha256) {
            alert(
                "This ROM does not match the missing game."
            );
            reuploadInput.value = "";
            return;
        }

        await saveRom({
            sha256,
            file,
            filename:file.name,
            size:file.size,
            added:Date.now()
        });

        markRomInstalled(
            sha256
        );
        reuploadInput.value = "";
    }
);

async function loadCollection() {
    loadingBG.classList.remove("hidden");
    try {
        const games =
            await syncCollection();
            collectionGames = {};
        for (const game of games) {
            collectionGames[game.sha256] = game;
            const local = await loadRom(game.sha256);
            const rom =
                local ??
                {
                    sha256: game.sha256,
                    filename: game.filename,
                    missing: true
                };
            const metadata =
                await getGameMetadata(
                    rom.sha256,
                    getPlatform(rom.filename)
                );
            addGameToList({
                ...rom,
                ...metadata
            });
        }
    } catch (err) {
        console.error(
            "Collection loading failed:",
            err
        );
    } finally {
        loadingBG.classList.add("hidden");
    }
}

loadCollection();

setEmulatorCloseCallback(
    (sha256, seconds) => {

        const game =
            collectionGames[sha256];

        if (!game)
            return;

        game.playtime =
            (game.playtime ?? 0)
            + seconds;

        if (selectedSha256 === sha256) {
            recordHours.textContent =
                (
                    game.playtime / 3600
                ).toFixed(1);
        }
    }
);

function updateEmptyState(){

    noneFound.hidden =
        gameListEl.children.length > 0;

}

async function hashFile(file){
    const buffer =
        await file.arrayBuffer();
    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            buffer
        );
    return [...new Uint8Array(hash)]
        .map(
            b =>
            b.toString(16)
            .padStart(2,"0")
        )
        .join("");
}

runBtn.addEventListener("click", () => {
    if (!selectedRom)
        return;

    runGame(selectedRom);
});

saveLocally.addEventListener("click", async()=> {
    const metadata = await getGameMetadata(selectedRom.sha256, getPlatform(selectedRom.filename));
    const extension = selectedRom.filename.substring(
        selectedRom.filename.lastIndexOf(".")
    );
    localSaveRom(selectedRom.sha256, `${metadata.title}${extension}` || selectedRom.filename);
});

// shortcuts
document.addEventListener("keydown", (e)=> {
    if (e.code === "Enter") {
        runBtn.click()
    } else if (e.code === "KeyR") {
        reuploadBtn.click();
    } else if (e.code === "KeyS") {
        document.getElementById("injectSave").click();
    } else if (e.code === "Backspace") {
        removeGameBtn.click();
    } else if (e.code === "Delete") {
        document.getElementById("removeGame").click();
    }
});