(function () {
    function initWorldMapOverlay() {
        const worldMapButton = document.querySelector('.world-map-ui-button');
        const legacyModal = document.getElementById('world-map-modal');
        const overlay = document.getElementById('world-map-overlay');
        const closeButton = document.getElementById('world-map-overlay-close');
        const parchment = overlay ? overlay.querySelector('.world-map-parchment') : null;
        const heading = overlay ? overlay.querySelector('.world-map-heading') : null;
        const canvas = overlay ? overlay.querySelector('.world-map-canvas') : null;
        const image = overlay ? overlay.querySelector('.world-map-overlay-image') : null;
        let lastFocusedElement = null;

        if (!worldMapButton || !legacyModal || !overlay || !closeButton || !parchment || !heading || !canvas || !image) {
            return;
        }

        function isLegacyModalOpen() {
            return window.getComputedStyle(legacyModal).display !== 'none';
        }

        function isOverlayOpen() {
            return overlay.classList.contains('is-open');
        }

        function fitCanvasToImage() {
            const naturalWidth = image.naturalWidth || 1024;
            const naturalHeight = image.naturalHeight || 723;
            const aspectRatio = naturalWidth / naturalHeight;
            const parchmentStyles = window.getComputedStyle(parchment);
            const paddingX = parseFloat(parchmentStyles.paddingLeft) + parseFloat(parchmentStyles.paddingRight);
            const paddingY = parseFloat(parchmentStyles.paddingTop) + parseFloat(parchmentStyles.paddingBottom);
            const headingStyles = window.getComputedStyle(heading);
            const headingHeight = heading.offsetHeight + parseFloat(headingStyles.marginBottom || 0);
            const availableWidth = Math.max(0, parchment.clientWidth - paddingX);
            const availableHeight = Math.max(0, parchment.clientHeight - paddingY - headingHeight);

            let fittedWidth = availableWidth;
            let fittedHeight = fittedWidth / aspectRatio;

            if (fittedHeight > availableHeight) {
                fittedHeight = availableHeight;
                fittedWidth = fittedHeight * aspectRatio;
            }

            canvas.style.width = `${Math.floor(fittedWidth)}px`;
            canvas.style.height = `${Math.floor(fittedHeight)}px`;
        }

        function openOverlay() {
            lastFocusedElement = document.activeElement;
            legacyModal.style.display = 'none';
            overlay.classList.add('is-open');
            overlay.setAttribute('aria-hidden', 'false');
            fitCanvasToImage();
            closeButton.focus();
        }

        function closeOverlay() {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        }

        worldMapButton.addEventListener('click', function () {
            window.requestAnimationFrame(function () {
                if (isLegacyModalOpen()) {
                    openOverlay();
                }
            });
        });

        closeButton.addEventListener('click', closeOverlay);
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                closeOverlay();
            }
        });
        window.addEventListener('resize', fitCanvasToImage);
        image.addEventListener('load', fitCanvasToImage);

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isOverlayOpen()) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                closeOverlay();
            }
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWorldMapOverlay);
    } else {
        initWorldMapOverlay();
    }
})();
