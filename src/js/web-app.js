let webApp = null;
let game = null;

// Start the application once DOM is loaded
window.onload = function(event) {
    game = new GameClass(16, 16, 40);    
    webApp = new WebApp('container');
};

class WebApp {
    /**
     * Class constructor
     * @param {String} containerId HTML Container's ID
     */
    constructor(containerId) {
        /** @type {HTMLElement} The container for the application's view */
        this.container = document.getElementById(containerId);

        // Manage window resize
        window.onresize = (event) => { this.onResize(event); };
        this.onResize();

        // Attach events to buttons
        document.
            getElementById("toggleFullScreen").
            addEventListener("click", (event) => { this.swapFullScreen(event); } );

        document.
            getElementById("play").
            addEventListener("click", (event) => { game.unlockGame(event); } );

        document.
            getElementById("swap").
            addEventListener("click", (event) => { game.swapMode(event); } );
    }

    /**
     * Called when window is resized
     * @param {DomEvent} event Event definition
     */
    onResize(event) {
        this.container.style.width  = (window.innerWidth) + "px";
        this.container.style.height = (window.innerHeight) + "px";

        // Compute cell size
        let cellSize = Math.min(window.innerHeight, window.innerWidth);
        cellSize = Math.floor(cellSize / game.width) - 1;

        if (game !== null) {
            // Change game field size
            game.htmlTerrain.style.width  = (cellSize * game.width)  + "px";
            game.htmlTerrain.style.height = (cellSize * game.height) + "px";

            // Change overlay field size
            game.htmlOverlay.style.width  = (cellSize * game.width)  + "px";
            game.htmlOverlay.style.height = (cellSize * game.height) + "px";
            game.htmlOverlay.style.lineHeight = (cellSize * game.height) + "px";
            game.htmlOverlay.style.left   = game.htmlTerrain.offsetLeft + "px";
            game.htmlOverlay.style.top    = game.htmlTerrain.offsetTop + "px";
            
            // Change the size of all cells
            game.field.forEach(element => {
                element.html.style.width  = cellSize + "px";
                element.html.style.height = cellSize + "px";
                element.html.style.lineHeight = (cellSize - 1) + "px";
            });

            // Change line height
            game.htmlTerrain.style.lineHeight = 0 + "px";
        }
    }

    /**
     * Enter fullscreen mode
     */
    enterFullScreen(elem) {
        // use main container if no element was provided
        elem = elem || this.container;
    
        // Use the first defined method (depending on navigators)
        if      (elem.webkitRequestFullScreen) elem.webkitRequestFullScreen();
        else if (elem.mozRequestFullScreen)    elem.mozRequestFullScreen();
        else if (elem.requestFullScreen)       elem.requestFullScreen();
        else if (elem.msRequestFullscreen)     elem.msRequestFullscreen();
        else throw("The browser does not support fullscreen mode");
    }

    /**
     * Leave fullscreen mode
     */
    leaveFullScreen(elem) {
        // Use the first defined method (depending on navigators)
        if      (elem.exitFullscreen)         elem.exitFullscreen();
        else if (elem.webkitCancelFullScreen) elem.webkitCancelFullScreen();
        else if (elem.mozCancelFullScreen)    elem.mozCancelFullScreen();
        else if (elem.cancelFullScreen)       elem.cancelFullScreen();
        else throw("The browser does not support fullscreen mode");
    }

    /**
     * Indicates whether the browser is in fullscreen or not
     * @returns {boolean} true for fullscreen, false otherwise
     */
    isFullScreen() {
        return (document.fullScreenElement && document.fullScreenElement !== null) ||
               (document.mozFullScreen     || document.webkitIsFullScreen);
    }

    swapFullScreen(element) {
        // use main container if no element was provided
        element = element || this.container;

        if (this.isFullScreen())  {
            this.leaveFullScreen(document);
        }
        else {
            this.enterFullScreen(element);
        }
    }
}
