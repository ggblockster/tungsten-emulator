const profileSettings = document.getElementById("profile");
const settingsList = document.querySelector(".selectList");
const settingsSects = document.querySelectorAll(".settingsSect");
const themeObjects = document.querySelectorAll(".theme");
const settingChoices = document.querySelectorAll(".setting");

import { applyTheme } from "./index.js";

applyTheme();

if (settingsSects) {
    settingsSects.forEach(e => {
        e.style.display = "none";
    });
}

if (profileSettings) {
    profileSettings.style.display = "block";
}

if (settingsList) {
    settingsList.addEventListener("click", async (e)=> {
        const s = e.target.closest("li").dataset.setting;
        settingsSects.forEach(e => {
            e.style.display = "none";
        });
        settingChoices.forEach(setting => {
            setting.classList.remove("active")
        });
        e.target.closest("li").classList.add("active");
        document.getElementById(s).style.display = "block";
        document.getElementById("gameOpenBar").scrollTo(0,0);
    });
}

const themeSearch = document.getElementById("themeSearch");
const themeFilter = document.getElementById("themeFilter");

function deselectAllThemes() {
    if (themeObjects) {
        themeObjects.forEach(theme => {
            theme.classList.remove("selected");
        });
    }
}

if (themeObjects) {
    document.querySelector(`[data-theme=${localStorage.getItem("tungstenTheme")}]`).classList.add("selected");
    themeObjects.forEach(t => {
        t.addEventListener("click", ()=> {
            localStorage.setItem("tungstenTheme", t.dataset.theme);
            deselectAllThemes();
            t.classList.add("selected");
            applyTheme();
        });
    });
}

function updateThemeResults() {
    themeObjects.forEach(t => {
        t.hidden = true;
    });
    themeObjects.forEach(th => {
        if (themeFilter.value === "all") {
            if (th.dataset.search.includes(themeSearch.value.trim())) {
                th.hidden = false;
            }
        } else {
            if (th.dataset.search.includes(themeSearch.value.trim()) && th.classList.contains(themeFilter.value)) {
                th.hidden = false;
            }
        }
    });
}

themeSearch.addEventListener("input", ()=> {
    if (themeObjects) {
        updateThemeResults();
    }
});

themeFilter.addEventListener("change", ()=> {
    updateThemeResults();
});

updateThemeResults();