const apiKey = $("#apiKey");
const setApiKey = $("#setApiKey");
const clearCache = $("#clearCache");
const clearCacheText = $("#clear-cache-btn-text");
const clearCacheSpinner = $("#clear-cache-btn-spinner");

clearCacheSpinner.hide();
apiKey.val(localStorage.getItem("key"));

setApiKey.click(function () {
    const key = apiKey.val().trim().replaceAll(" ", "");
    localStorage.setItem("key", key);
    window.location.href = window.location.href;
    return false;
});
let operating = false;

clearCache.click(function () {
    if (!operating) {
        if (
            confirm(
                "Are you sure? This will delete all of the data saved in the website and may temporarily slow down loading."
            )
        ) {
            operating = true;
            clearCacheText.hide();
            clearCacheSpinner.show();
            localforage
                .clear()
                .then(() => {
                    operating = false;
                    clearCacheText.show();
                    clearCacheSpinner.hide();
                })
                .catch((e) => {
                    console.error(e);
                    1;
                    alert("Error clearing cache");
                    operating = false;
                    clearCacheText.show();
                    clearCacheSpinner.hide();
                });
        } else {
            operating = false;
        }
    }
});
