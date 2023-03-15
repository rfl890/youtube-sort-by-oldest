const getPlaylistIdFromYoutubeChannelUrl = async (url) => {
    const data = await (await fetch("https://uncors.vercel.app/?" + new URLSearchParams({
        url: url
    }))).text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");
    if (doc.querySelector('meta[itemProp="channelId"]')) {
        return "UU" + doc.querySelector('meta[itemProp="channelId"]').content.slice(2);
    }
}

const youtubeUrlInput = $("#youtube_url");
const sortBtn = $("#sort-btn");
const sortBtnText = $("#sort-btn-text");
const sortBtnSpinner = $("#sort-btn-spinner");
const errorText = $("#error");
let x = false;
sortBtn.click(function() {
    if (!x) {
        x = true;
        sortBtnText.addClass("d-none");
        sortBtnSpinner.removeClass("d-none");
        errorText.addClass("d-none");
        getPlaylistIdFromYoutubeChannelUrl(youtubeUrlInput.val().trim())
            .then(result => {
                if (result) {
                    window.location.href = `/load_channel.html?playlistId=${result}`
                } else {
                    errorText.removeClass("d-none");
                    sortBtnText.removeClass("d-none");
                    sortBtnSpinner.addClass("d-none");
                    x = false
                }
            })
            .catch(error => {
                errorText.removeClass("d-none");
                sortBtnText.removeClass("d-none");
                sortBtnSpinner.addClass("d-none");
                x = false
            });
    }
});