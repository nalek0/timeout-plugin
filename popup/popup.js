function removeSite(siteURL) {
    console.log("Removing site", siteURL)
    chrome.runtime.sendMessage({"command": "remove-site", "site": siteURL}, response => {
        updateSites()
    })
}

function createSite(siteURL) {
    const site = document.createElement("div")
    site.className = "site_block"
    const textNode = document.createTextNode(siteURL)
    const removeButton = document.createElement("div")
    removeButton.className = "remove_button"
    removeButton.title = "Remove this site from blacklist"
    const dash = document.createElement("div")
    dash.className = "dash"
    removeButton.appendChild(dash)
    removeButton.onclick = () => removeSite(siteURL)
    site.appendChild(textNode)
    site.appendChild(removeButton)

    document.getElementById("data").appendChild(site)
}

function updateSites() {
    chrome.runtime.sendMessage({"command": "get-data"}, (response) => {
        document.getElementById("data").innerHTML = ""
        let currentTime = Date.now()
        for (site in response) {
            let time = response[site]
            if (time > currentTime) 
                createSite(site)
        }
    })
}

updateSites()