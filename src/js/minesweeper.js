/**
 * MineSweeper game, minimalist example
 */
var game = null;

/**
 * Start a new game
 */
function startGame() {
  game = new GameClass(20, 20, 50); 
  game.score   = document.getElementById('score');
  game.display = document.getElementById('terrain');
  game.display.innerHTML = game.toString();
  game.resize();
}

/**
 * Switch play mode
 */
function switchMode(event) {
  if (game) game.swapMode(event);
}

/** Exit from fullscreen mode
 *  @param el = The element to apply the request (document)
 */
function cancelFullScreen(el) {
  // Supports most browsers and their versions.
  var requestMethod = el.webkitCancelFullScreen || el.mozCancelFullScreen ||
                el.cancelFullScreen       || el.exitFullscreen;
  // Call the right method
  if (requestMethod) {
    // cancel full screen exist in the browser
    requestMethod.call(el);
  }
  else if (typeof window.ActiveXObject !== "undefined") {
    // For older IE, simulate F11 key press
    var wscript = new ActiveXObject("WScript.Shell");
    if (wscript !== null) { wscript.SendKeys("{F11}"); }
  }
}

/** Enter the fullscreen mode
 *  @param el = The element to apply the request (body or other)
 */
function requestFullScreen(el) {
  // Supports most browsers and their versions.
  var requestMethod = el.webkitRequestFullScreen || el.mozRequestFullScreen ||
                el.requestFullScreen       || el.msRequestFullscreen;

  // Call the right method
  if (requestMethod) {
    // Native full screen.
    requestMethod.call(el);
  }
  else if (typeof window.ActiveXObject !== "undefined") {
    // For older IE, simulate the F11 key press
    var wscript = new ActiveXObject("WScript.Shell");
    if (wscript !== null) { wscript.SendKeys("{F11}"); }
  }
}

/** Toggle fullscreen mode (on/off)
 */
function switchScreen(event) {
  var elem = document.body; // Make the body go full screen.
  var isInFullScreen = (document.fullScreenElement && document.fullScreenElement !== null) ||
                (document.mozFullScreen     || document.webkitIsFullScreen);
  if (isInFullScreen)  { cancelFullScreen(document); }
  else                 { requestFullScreen(elem);    }
} 





/** @type {Object} Game modes */
const MODES = {
  dig  : "dig",           // Click on cell will dig the cell
  flag : "flag"           // Click on cell will place a flag
};


/** @type {Object} Game states */
const STATES = {
  idle : "idle",          // Not yet started
  play : "play",          // Game is playing
  winn : "winn",          // Field cleared
  dead : "dead"           // Player is dead
};

/** The main class for minesweeper game */
class GameClass {
  /**
   * Minesweeper game constructor
   * @param  {Number} width   Width of the play area
   * @param  {Number} height  Height of the play area
   * @param  {Number} mines   Number of mines in the game
   */
  constructor(width, height, mines) {
    this.field  = this.newField(width,height);   // Mine field as 2D array
    this.width  = width;                         // Field width
    this.height = height;                        // Field height
    this.mines  = mines;                         // Count mines
    this.flags  = 0;                             // Count flags
    this.remain = width * height - mines;        // Count cell to uncover
    this.dummy  = new CellClass(-1,-1);          // Dummy cell
    this.state  = STATES.idle;                   // Game state                       
    this.mode   = MODES.dig;                     // Click on cell action
    this.time   = -1;                            // Game duration

    // Output management
    this.score   = null;                         // Tag to write score
    this.display = null;                         // Tag to display terrain

    // Start "background" task
    setInterval( () => this.updateTime(), 100);
  }

  /**
   * Create an empty field of the requested dimensions
   * @param  {Number} width  Field width
   * @param  {Number} height Field height
   * @return {Array}         The 2D array with empty cells
   */
  newField(width, height) {
    let result = [];

    for(let y=0; y<height; y++) {
      result[y] = [];
      for(let x=0; x<width; x++) {
        result[y][x] = new CellClass(x,y);
      }
    }
    return result;
  }

  /**
   * Timer callback, updates some part of the screen
   */
  updateTime() {
    if (this.state == STATES.play) {
      if (this.remain === 0) {
        return this.winnGame();
      }
      this.time += 0.1;         
      this.score.innerHTML = (this.mines-this.flags) +
                             " / " + this.mines + " " + this.time.toFixed(1);
    }
  }

  /**
   * Start the game : Place mines on the field
   * @param  {number} x Start position which won't be mined  
   * @param  {number} y Start position which won't be mined  
   */
  startGame(x, y) {
    var x1, y1;

    // Place a mine on the start position
    this.field[y][x].update("mine", true);

    // Place the requested number of mines
    while(this.flags < this.mines) {
      y1 = Math.floor(Math.random() * this.height);
      x1 = Math.floor(Math.random() * this.width);

      if (!this.field[y1][x1].mine) {
        this.field[y1][x1].update("mine", true);
        this.flags += 1;
      }
    }

    // Remove the mine from the start position
    this.field[y][x].update("mine", false);

    // update the mine count for each cell
    for( y1=0; y1<this.height; y1++) {
      for( x1=0; x1<this.width; x1++) {
        this.field[y1][x1].update( "count",
          this.cellGet(x1-1, y1-1).mine + this.cellGet(x1,   y1-1).mine +
          this.cellGet(x1+1, y1-1).mine + this.cellGet(x1-1, y1  ).mine +
          this.cellGet(x1+1, y1  ).mine + this.cellGet(x1-1, y1+1).mine +
          this.cellGet(x1,   y1+1).mine + this.cellGet(x1+1, y1+1).mine
        );
      }
    }

    // Game is now started
    this.state = STATES.play;
  }

  /**
   * Game is finished. You win
   */
  winnGame() {
    this.state = STATES.winn;
    this.display.innerHTML += '<div id="overlay">Congratulation</div>';
  }

  /**
   * Game is finished. You lose
   */
  loseGame() {
    this.state = STATES.winn;
    this.display.innerHTML += '<div id="overlay">Game over</div>';
  }

  /**
   * Is the given position in the play field
   * @param  {Number}  x Cell position
   * @param  {Number}  y Cell position
   * @return {Boolean}   true when inside, false otherwise
   */
  isInside(x,y) {
    return !((x<0) || (x>=this.width) ||
          (y<0) || (y>=this.height) );
  }

  /**
   * Get the cell at a given position
   * @param  {number} x   The position in the grid
   * @param  {number} y   The position in the grid
   * @return {CellClass}  The cell object
   */
  cellGet(x,y) {
    if (this.isInside(x,y)) return this.field[y][x];
    return this.dummy;
  }

  /**
   * Uncover recursievely cells
   * @param  {Number} x Position to uncover
   * @param  {Number} y Position to uncover
   */
  uncover(x, y) {
    if ( (this.state==STATES.play) && this.isInside(x,y) && !this.field[y][x].digg && !this.field[y][x].flag) {
      this.field[y][x].update("digg", true);
      this.remain -= 1;

      // Change state if uncover a mined cell
      if (this.field[y][x].mine) {
        return this.loseGame();
      }

      if (this.field[y][x].count === 0) {
        this.uncover(x-1, y-1);
        this.uncover(x,   y-1);
        this.uncover(x+1, y-1);

        this.uncover(x-1, y  );
        this.uncover(x+1, y  );

        this.uncover(x-1, y+1);
        this.uncover(x,   y+1);
        this.uncover(x+1, y+1);
      }
    }
  }

  /**
   * Digg the given cell
   * @param  {Number}    x    Cell position
   * @param  {Number}    y    Cell position
   * @param  {CellClass} cell the cell that was clicked
   */
  digCell(x, y, cell) {
    if (cell.flag === false) {
      if (cell.digg) {
        // Cell already digged, dig the 8 cells around
        this.uncover(x-1, y-1);
        this.uncover(x,   y-1);
        this.uncover(x+1, y-1);
        this.uncover(x-1, y  );
        this.uncover(x+1, y  );
        this.uncover(x-1, y+1);
        this.uncover(x,   y+1);
        this.uncover(x+1, y+1);
      }
      else {
        // Hidden cell, uncover it
        this.uncover(x, y);
      }

    }
  }

  /**
   * Flag the given cell
   * @param  {Number}    x    Cell position
   * @param  {Number}    y    Cell position
   * @param  {CellClass} cell the cell that was clicked
   */
  flagCell(x, y, cell) {
    // Avoid placing flags on digged cell
    if (cell.digg) return;

    // Place a flag
    if (!cell.flag && (this.flags > 0)) {
      this.flags -= 1;
      cell.update("flag", true);
    }
    else if (cell.flag) {
      this.flags += 1;
      cell.update("flag", false);
    }
  }

  /**
   * A cell was clicked
   * @param {Event} event Event description
   */
  onClickCell( event ) {
    var pos  = event.target.id.split("_");          // [1]->x, [2]->y
    var x    = 1 * pos[1];
    var y    = 1 * pos[2];
    var cell = this.field[y][x];

    if (this.state == STATES.idle) {
      this.time = 0;
      this.startGame(x,y);
    }

    if (this.mode == MODES.dig ) {
      this.digCell(x, y, cell);
    }
    else {
      this.flagCell(x, y, cell);
    }
  }

  /**
   * A cell was clicked
   * @param {Event} event Event description
   */
  onRightClick( event ) {
    var pos  = event.target.id.split("_");          // [1]->x, [2]->y
    var x    = 1 * pos[1];
    var y    = 1 * pos[2];
    var cell = this.field[y][x];

    this.flagCell(x, y, cell);

    event.preventDefault();
  }

  /**
   * Change the action mode (dig <-> flag)
   * @param  {Event} event event description
   */
  swapMode(event) {
    if (this.state == STATES.play) {
      this.mode = (this.mode == MODES.flag) ? MODES.dig : MODES.flag;
      event.target.value = this.mode;
    }
  }

  /**
   * Generate the HTLM representation of the mine field
   * @return {string} The HTML representation
   */
  resize() {
    var pxW = Math.floor(800 / this.width);
    var pxH = Math.floor(800 / this.height);

    for(var y=0; y<this.field.length; y++) {
      for(var x=0; x<this.field[y].length; x++) {
        var tag = document.getElementById('_'+x+'_'+y);
        tag.style.width  = pxW + "px";
        tag.style.height = pxH + "px";
      }
    }
  }

  /**
   * Generate the HTLM representation of the mine field
   * @return {string} The HTML representation
   */
  toString() {
    var tmp = "";
    for(var y=0; y<this.field.length; y++) {
      for(var x=0; x<this.field[y].length; x++) {
        tmp += this.field[y][x].toString();
      }
      tmp += '<br>\n';
    }
    console.log( tmp);
    return tmp;
  }
}

/** The class that defines the content of one game cell */
class CellClass {
  /**
   * Class constructor
   * @param x, y = cell position
   */
  constructor(x, y) {
    this.tag   = null;      // The HTLM tag
    this.x     = 1*x;       // Cell position
    this.y     = 1*y;       // Cell position
    this.mine  = false;     // Is the cell mined
    this.flag  = false;     // Is the cell flagged by the user
    this.digg  = false;     // Is the cell uncovered ?
    this.count = 0;         // How many mines in the neighborhood
  }

  /**
   * Print the cell as a HTML tag
   * @return string HTML content
   */
  toString() {
    var result = '<span id="_%X_%Y" class="%CLASS" onclick="game.onClickCell(event);" oncontextmenu="game.onRightClick(event);">%COUNT</span>';
    result = result.replace("%X",     this.x);
    result = result.replace("%Y",     this.y);
    result = result.replace("%CLASS", this.getClass());
    result = result.replace("%COUNT", this.digg ? this.count : '&nbsp;');
    return result;
  }

  /**
   * Return the CSS class for the current cell
   * @return string The class name
   */
  getClass() {
    return "c" + (this.mine ? '1' : '0') + 
             (this.flag ? '1' : '0') +
             (this.digg ? '1' : '0') + " v" + this.count;
  }

  /**
   * Update one field and the HTML/CSS representation in the page
   */
  update(name, val) {
    // Update the internal value
    this[name] = val;

    // find the element in the page
    if (this.tag === null) {
      this.tag = document.getElementById('_' + this.x + '_' + this.y);
    }

    // Update HTML and class in DOM
    this.tag.className = this.getClass();
    this.tag.innerHTML = this.digg ? this.count : '&nbsp;'
  }
}