/**
 * MineSweeper game, minimalist example
 * 
 * Easy :   8 x  8, 10 mines
 * Medium: 16 x 16, 40 mines
 * Hard:   24 x 24, 99 mines
 */
/** @type {Object} Game modes */
const MODES = {
  dig  : "dig",           // Click on cell will dig the cell
  flag : "flag"           // Click on cell will place a flag
};


/** @type {Object} Game states */
const STATES = {
  idle : "idle",          // Not yet started
  play : "play",          // Game is playing
  win  : "win",           // Field cleared
  dead : "dead"           // Player is dead
};


class Cell {
  constructor(x, y, html) {
    this.html   = html
    this.x      = x;
    this.y      = y;
    this.mined  = false;
    this.flaged = false;
    this.digged = false;
    this.count  = 0;
    this.updateView();
  }

  /** Updates the html element's class */
  updateView() {
    if (this.html) {
      this.html.className = "cell" + 
                              " c" + (this.mined  ? '1' : '0') + 
                                     (this.flaged ? '1' : '0') +
                                     (this.digged ? '1' : '0') +
                              " v" + (this.count);
      this.html.innerHTML = this.digged ? this.count : '&nbsp';
    }
  }
}

/** The main class for minesweeper game */
class GameClass {
  constructor(width, height, mines) {
    // Output management
    this.htmlScore = document.getElementById('score');
    this.htmlTerrain = document.getElementById('terrain');
    this.htmlOverlay = document.getElementById('overlay');

    // Empty cell (0 mines, not mined, not flagged, not digged)
    this.emptyCell = new Cell(-1, -1, null);

    // Terrain dimension (given as number of cells)
    this.width  = width;
    this.height = height;

    // Number of mines, flags and cell to explore
    this.mines = mines;
    this.flags = 0;
    this.remain = width * height - mines;

    // The game field is an array of cells
    this.field = this.newField(width, height);

    // Game status, mode and score
    this.state = STATES.idle;
    this.mode = MODES.dig;
    this.time = -1;

    // Start "background" task
    setInterval( () => this.updateTime(), 100);
  }

  /** Create a cell view */
  newCellView() {
    let view = document.createElement("span");

    // Events handlers
    view.addEventListener("click",       (ev) => { this.onLeftClick(ev)  } );
    view.addEventListener("contextmenu", (ev) => { this.onRightClick(ev) } );

    return view;
  }

  /** Generate an new game terrain with no mines */
  newField(width, height) {
    let terrain = [];
    for(let i = 0; i < width * height; i++) {
      // Create the HTML element for the cell
      let html = this.newCellView();

      // link the model and the view
      html.dataMine = new Cell(i % width, Math.floor(i / width), html);

      // Store the cell model
      terrain[i] = html.dataMine;
            
      // Place the element in the HTML page
      this.htmlTerrain.appendChild(html);
    }
    return terrain;
  }

  /** Is the given position in the play field */
  isInside(x,y) {
    return ((x >= 0) && (x < this.width) && (y >= 0) && (y < this.height));
  }

  /** Get the pointed cell */
  cellGet(x, y) {
    if (this.isInside(x,y)) {
      return this.field[x + y * this.width];
    }
    return this.emptyCell;
  }

  /** Call a function for each neighbor cells */
  forEachNeighbor(center, fct) {
    fct(this.cellGet(center.x - 1, center.y - 1));
    fct(this.cellGet(center.x,     center.y - 1));
    fct(this.cellGet(center.x + 1, center.y - 1));

    fct(this.cellGet(center.x - 1, center.y    ));
    fct(this.cellGet(center.x + 1, center.y    ));
    
    fct(this.cellGet(center.x - 1, center.y + 1));
    fct(this.cellGet(center.x,     center.y + 1));
    fct(this.cellGet(center.x + 1, center.y + 1));
  }

  /** Start the game : Place mines on the field (called on first click) */
  startGame(cell) {
    // reset game counter
    this.flags = 0;
    this.remain = this.width * this.height - this.mines;

    // Place a mine on the start position, to ensure the place will be empty
    cell.mined = true;

    // Place the requested number of mines
    while(this.flags < this.mines) {
      let y1 = Math.floor(Math.random() * this.height);
      let x1 = Math.floor(Math.random() * this.width);

      if (this.cellGet(x1, y1).mined === false) {
        this.cellGet(x1, y1).mined = true;
        this.flags += 1;
      }
    }

    // Remove the mine from the start position
    cell.mined = false;

    // Update the "count" field in all cells
    this.field.forEach( center => {
      center.count = 0;
      this.forEachNeighbor(center, (c2) => {
        center.count += (c2.mined ? 1 : 0);
      })
      center.updateView();
    });

    // Game is now started
    this.state = STATES.play;
    this.time  = 0;
  }

  /** Uncover recursively cells */
  uncover(cell) {
    if ((this.state !== STATES.play) ||
        !this.isInside(cell.x, cell.y) || cell.digged || cell.flaged ) {
      return;
    }

    // Dig the cell and update the display
    cell.digged = true;
    cell.updateView();

    // Remove 1 cell from the remaining counter
    this.remain -= 1;

    // Detect end of game
    if (cell.mined) {
      return this.looser();
    }

    // Try to uncover cells around if they are not mined
    if (cell.count === 0) {
      this.forEachNeighbor( cell, (c2) => { this. uncover(c2); });
    }
  }

  /** Dig the given cell */
  digCell(cell) {
    // Do not dig a flagged cell
    if (cell.flaged) return;

    if (cell.digged) {
      // Cell already digged, dig the 8 cells around
      this.forEachNeighbor( cell, (c2) => { this.uncover(c2); });
    }
    else {
      // Cell is not yet digged, uncover it
      this.uncover(cell);
    }
  }

  /** Flag the given cell */
  flagCell(cell) {
    // Avoid placing flags on digged cell
    if (cell.digged) return;

    // Place a flag
    if (!cell.flaged && (this.flags > 0)) {
      this.flags -= 1;
      cell.flaged = true;
    }
    else if (cell.flaged) {
      this.flags += 1;
      cell.flaged = false;
    }

    cell.updateView();
  }

  /** Timer callback, updates some part of the screen */
  updateTime() {
    if (this.state == STATES.play) {
      if (this.remain === 0) {
        return this.winner();
      }
      this.time += 0.1;         
      this.htmlScore.innerHTML = (this.mines-this.flags) +
                                 " / " + this.mines + " " + this.time.toFixed(1);
    }
  }

  /** Game is finished. You win */
  winner() {
    this.state = STATES.win;
    this.htmlOverlay.innerHTML = "<p>Congratulation you are the winner</p>";
    this.htmlOverlay.style.display = "block";
  }

  /** Game is finished. You lose */
  looser() {
    this.state = STATES.dead;
    this.htmlOverlay.innerHTML = "<p>Game is over...try again</p>";
    this.htmlOverlay.style.display = "block";
  }

  /** A cell was clicked */
  onLeftClick( event ) {
    let cell = event.target.dataMine;

    if (this.state == STATES.idle) {
      this.startGame(cell);
    }

    if (this.mode == MODES.dig ) {
      this.digCell(cell);
    }
    else {
      this.flagCell(cell);
    }  
  }

  /** A cell was clicked */
  onRightClick( event ) {
    var cell = event.target.dataMine;
    this.flagCell(cell);
    event.preventDefault();
  }

  /** Change the action mode (dig <-> flag) */
  swapMode(event) {
    if (this.state == STATES.play) {
      this.mode = (this.mode == MODES.flag) ? MODES.dig : MODES.flag;
      event.target.value = this.mode;
    }
  }

  /** Hide the overlay div */
  unlockGame(event) {
    this.htmlOverlay.style.display = "none";

    // Remove all children
    this.htmlTerrain.innerHTML = "";

    // new terrain
    this.field = this.newField(this.width, this.height, this.mines);
    webApp.onResize();

    this.state = STATES.idle;
  }
}
