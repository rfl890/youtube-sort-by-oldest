(async function () {
    // utiltiies
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const getAllItemsInPlaylist = async (playlistId, progressCb, apiKey) => {
        let currentPageToken = "not-set";
        const items = [];
        let amount = 0;
        let itemsProcessed = 0;
        while (true) {
            if (currentPageToken === "not-set") {
                const data = await (
                    await fetch(
                        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
                    )
                ).json();
                data.items.forEach((item) => items.push(item));
                amount = data.pageInfo.totalResults;
                currentPageToken = data.nextPageToken;
                itemsProcessed += data.items.length;
                if (!currentPageToken) break;
            } else {
                const data = await (
                    await fetch(
                        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${currentPageToken}`
                    )
                ).json();
                currentPageToken = data.nextPageToken;
                data.items.forEach((item) => items.push(item));
                itemsProcessed += data.items.length;
                progressCb(
                    `Processed ${itemsProcessed}/${amount} videos | ${(
                        (itemsProcessed / amount) *
                        100
                    ).toFixed(2)}% done`
                );
                if (currentPageToken == undefined) {
                    console.log("\nDone");
                    break;
                }
            }
            await sleep(50);
        }
        return items.reverse();
    };
    function createElementWithAttributes(elementName, attributeTable) {
        const element = document.createElement(elementName);
        Object.keys(attributeTable).forEach((key) => {
            const value = attributeTable[key];
            element.setAttribute(key, value);
        });
        return element;
    }
    function toggleImportantChangesHappening(toggle) {
        if (toggle) {
            window.onbeforeunload = function () {
                return "";
            };
        } else {
            window.onbeforeunload = null;
        }
    }
    function formatDate(date) {
        return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: "medium", hour12: true });
    }
    function generateVideoColumn(videoData) {
        const colDiv = createElementWithAttributes("div", { class: "col" });
        const thumbnailImageLink = createElementWithAttributes("a", {
            href: `https://youtube.com/watch?v=${videoData.contentDetails.videoId}`,
            target: "_blank",
            rel: "noreferrer noopener",
        });
        const thumbnailImage = createElementWithAttributes("img", {
            src: videoData.snippet.thumbnails.high.url,
            class: "img-thumbnail",
            alt: videoData.snippet.title,
        });
        const videoTitleAndDate = createElementWithAttributes("p", {});
        videoTitleAndDate.innerText = `${
            videoData.snippet.title
        }\nUploaded on ${formatDate(
            new Date(videoData.contentDetails.videoPublishedAt)
        )}`;
        thumbnailImageLink.appendChild(thumbnailImage);
        colDiv.appendChild(thumbnailImageLink);
        colDiv.appendChild(videoTitleAndDate);
        return colDiv;
    }
    // vars
    const queryParams = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, param) => searchParams.get(param),
    });
    const title = $("#channel-title");
    const loadButton = $("#loadMore");
    const videosContainer = $("#videos");
    if (!queryParams.playlistId) {
        title.text("Missing query parameter playlistId");
        loadButton.hide();
        return;
    }
    const playlistId = queryParams.playlistId;
    // checking if the playlist data is in cache
    let cacheResult;
    try {
        cacheResult = await localforage.getItem(playlistId);
    } catch (e) {
        console.error(e);
        title.text("Error checking cache for playlistId");
        loadButton.hide();
        return;
    }
    let data;
    if (!cacheResult) {
        // no cache, we'll fetch new data
        toggleImportantChangesHappening(true);
        try {
            data = await getAllItemsInPlaylist(playlistId, async (prog) => {
                title.text(prog);
            }, localStorage.getItem("key"));
        } catch (e) {
            title.text(
                "Error getting data, make sure you have set an API key in settings"
            );
            loadButton.hide();
            return;
        }
        // now we store the data in the cache
        try {
            await localforage.setItem(playlistId, data);
        } catch (e) {
            // there was an error saving to cache
            console.error(e);
            toggleImportantChangesHappening(false);
        }
        toggleImportantChangesHappening(false);
    } else {
        // we have data in the cache
        console.log("Grabbed data from cache");
        data = cacheResult;
    }
    if (data.length > 0) {
        // just add a single row
        if (data.length <= 3) {
            const row = createElementWithAttributes("div", { class: "row" });
            data.forEach((video) => {
                row.appendChild(generateVideoColumn(video));
            });
            videosContainer.append(row);
            title.text(data[0].snippet.channelTitle);
            $("#page_title").text(data[0].snippet.channelTitle);
            return;
        }
        // otherwise
        let at = 0;
        title.text("Loading...");
        let chunkedData = [];
        const chunkSize = 3;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            chunkedData.push(chunk);
        }
        title.text(data[0].snippet.channelTitle);
        $("#page_title").text(data[0].snippet.channelTitle)
        if (chunkedData.size <= 4) {
            chunkedData.forEach((chunk) => {
                const row = createElementWithAttributes("div", {
                    class: "row",
                });
                chunk.forEach((video) => {
                    row.appendChild(generateVideoColumn(video));
                });
                videosContainer.append(row);
            });
            return;
        }
        for (let i = 0; i <= 4; i++) {
            if (chunkedData[at]) {
                const row = createElementWithAttributes("div", {
                    class: "row",
                });
                chunkedData[at].forEach((video) => {
                    row.appendChild(generateVideoColumn(video));
                });
                videosContainer.append(row);
            }
            at++;
        }
        document.addEventListener("scroll", function (event) {
            if (
                window.innerHeight + window.pageYOffset >=
                document.body.offsetHeight - 15
            ) {
                for (let i = 0; i <= 4; i++) {
                    if (chunkedData[at]) {
                        const row = createElementWithAttributes("div", {
                            class: "row",
                        });
                        chunkedData[at].forEach((video) => {
                            row.appendChild(generateVideoColumn(video));
                        });
                        videosContainer.append(row);
                    }
                    at++;
                }
            }
        });
    } else {
        title.text("This user has no videos uploaded!");
    }
})().catch((err) => console.error(err));
