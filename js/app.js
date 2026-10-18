document.addEventListener("DOMContentLoaded", function() {
    loadData();
    autoCleanupExpiredPhotos();
    setupDefaultDatetime();
    updateRoomOptions();
    renderItemPhotoDropzones();
    renderAllViews();
});
