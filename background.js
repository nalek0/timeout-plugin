const readLocalStorage = async (key) => {
	return new Promise((resolve, reject) => {
	  chrome.storage.local.get([key], function (result) {
	    if (result[key] === undefined) {
	      reject();
	    } else {
	      resolve(result[key]);
	    }
	  });
	});
};

class TimeoutWorkerClass {
	addSite(urlPath, time) {
		let urlObject = new URL(urlPath)
		let currentTime = Date.now()
		let blockUntil = currentTime + time
		let newNote = {}
		newNote[urlObject.origin] = blockUntil
		chrome.storage.local.set(newNote, () => {
			console.log(`Set item: ${urlObject.origin} = ${blockUntil}`)
		})
	}

	removeAllSites() {
		chrome.storage.local.clear(() => {
			console.log("Removed all sites")
		})
	}

	removeSite(urlPath) {
		let urlObject = new URL(urlPath)
		chrome.storage.local.remove(urlObject.origin, () => {
			console.log(`Removed item: ${urlObject.origin}`)
		})
	}

	blockTab(tab) {
		console.log("Blocking tab:", tab)
		chrome.tabs.remove(tab.id)
	}

	checkTab(tab) {
		let urlObject = new URL(tab.url)
		let currentTime = Date.now()
		chrome.storage.local.get(urlObject.origin, results => {
			let blockUntil = results[urlObject.origin]
			if (blockUntil != null) {
				blockUntil = parseInt(blockUntil)
				if (!isNaN(blockUntil) && currentTime < blockUntil) 
					this.blockTab(tab)
			}
		})
	}

	async sendBlockedSites(sendResponse) {
		chrome.storage.local.get(null, (results) => sendResponse(results))
	}
}

var TimeoutWorker = new TimeoutWorkerClass()

chrome.tabs.onUpdated.addListener( (tabId, changeInfo, tab) => checkTab(tabId, changeInfo, tab))

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true }
  let [tab] = await chrome.tabs.query(queryOptions)
  return tab
}

async function checkTab(tabId, changeInfo, tab) {
	if (tab.status == "complete")
		TimeoutWorker.checkTab(tab)
}

chrome.contextMenus.create({
	id: "block-current",
	title: "Block current site for 30 minutes",
	contexts: ["all"]
})

chrome.contextMenus.create({
	id: "ama-free",
	title: "Unblock all sites",
	contexts: ["all"]
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
	if (info.menuItemId == "block-current") {
		let currentTab = await getCurrentTab()
		TimeoutWorker.addSite(currentTab.url, 30 * 60 * 1000)
		TimeoutWorker.blockTab(currentTab)
	}
	else if (info.menuItemId == "ama-free") {
		TimeoutWorker.removeAllSites()
	}
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.command === "get-data") {
		TimeoutWorker.sendBlockedSites(sendResponse)
	} else if (message.command === "remove-site") {
		TimeoutWorker.removeSite(message.site)
		sendResponse(true)
	}

	return true
})