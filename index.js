/* global $, sessionStorage*/

////////////////////////////////////////////////////////////////////////////////
///////////////////////// VARIABLE DECLARATIONS ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Constant Variables
var BOARD = $('#board');
var BOARD_HEIGHT = $(window).height();
var BOARD_WIDTH = BOARD.width();
var HELICOPTER_HEIGHT = 30;
var HELICOPTER_WIDTH = 50;
var KEY = {
  UP: 38,
  DOWN: 40,
  P: 80
};
var MAX_WALL_HEIGHT = BOARD_HEIGHT / 8;
var MIN_WALL_HEIGHT = 50;
var OBSTACLE_WALL_HEIGHT = 150;
var OBSTACLE_WALL_WIDTH = 50;
var REFRESH_RATE = 20;
var WALL_WIDTH = 10;
var WALL_SPEED = 10;

var caveWalls,
helicopter,
isPaused,
keysDown,
obstacleWall,
score,
updateInterval;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// GAME SETUP //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

init();

function init() {
  caveWalls = [];
  fillCave();

  makeObstacleWall();

  score = {};
  score.points = 0;
  score.element = $('#score');

  helicopter = {}
  helicopter.element = $('#helicopter');
  helicopter.x = 20;
  helicopter.y = BOARD_HEIGHT / 2;
  helicopter.verticalVelocity = 0;
  
  // turn on keyboard inputs
  keysDown = {};
  $(document).on('keydown', handleKeyDown);
  $(document).on('keyup', handleKeyUp);
  
  // start update interval
  updateInterval = setInterval(update, REFRESH_RATE);

  isPaused = false;
}

////////////////////////////////////////////////////////////////////////////////
///////////////////////// UPDATE FUNCTIONS /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* 
 * On each update tick update each bubble's position and check for
 * collisions with the caveWalls.
 */
function update() {  
  moveCaveWalls();
  moveHelicopter();
  moveObstacleWall();

  if (checkForCollision()) {
    reset();
  }
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////// KEYBOARD FUNCTIONS //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/* 
event.which returns the keycode of the key that is pressed when the
keydown event occurs
*/
function handleKeyDown(event) {
  if (event.which === KEY.UP || event.which === KEY.DOWN) {
    keysDown[event.which] = true;
  }
  
  if (event.which === KEY.P) {
    pause();
  }
}

function handleKeyUp(event) {
  delete keysDown[event.which];
}

function pause() {
  if (!isPaused) {
    isPaused = true;
    $('#paused').toggle();
    clearInterval(updateInterval);
  } else {
    isPaused = false;
    $('#paused').toggle();
    updateInterval = setInterval(update, REFRESH_RATE);
  }
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////// HELPER FUNCTIONS ////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function checkForCollision() {
  // check for collisions with the obstacleWall
  if (helicopter.y <= obstacleWall.y + OBSTACLE_WALL_HEIGHT && 
    helicopter.y + HELICOPTER_HEIGHT >= obstacleWall.y && 
    helicopter.x + HELICOPTER_WIDTH >= obstacleWall.x &&
    helicopter.x <= obstacleWall.x + OBSTACLE_WALL_WIDTH) {
    return true;
  }

  for (var i = 0; i < caveWalls.length; i++) {
    var topWall = caveWalls[i].topWall;
    var bottomWall = caveWalls[i].bottomWall;

    // stop checking for collisions with caveWalls that are in
    // front of the helicopter.
    if (caveWalls[i].x >= helicopter.x + HELICOPTER_WIDTH) {
      return false;
    }

    var topWallY = pixelPropToNum(topWall, 'top') + pixelPropToNum(topWall, 'height');
    var bottomWallY = pixelPropToNum(bottomWall, 'top');

    if (helicopter.y <= topWallY || helicopter.y + HELICOPTER_HEIGHT >= bottomWallY) {
      return true;
    }
  }

  return false;
}

function fillCave() {
  do {
    makeCaveWall();
  } 
  while(caveWalls[caveWalls.length - 1].x < BOARD_WIDTH + WALL_WIDTH);
}

function makeObstacleWall() {
  obstacleWall = {
    element: $('<div>').addClass('caveWall obstacleWall').appendTo(BOARD),
    x: BOARD_WIDTH,
    y: (BOARD_HEIGHT * .6) - (Math.random() * (OBSTACLE_WALL_HEIGHT + 100)) // TODO: improve the random wall y position
  };
  moveElementTo(obstacleWall.element, obstacleWall.x, obstacleWall.y);
}

function makeCaveWall() {
  var caveWall = {
    topWall: $('<div>').addClass('caveWall').css('height', MIN_WALL_HEIGHT),
    bottomWall: $('<div>').addClass('caveWall').css('height', MIN_WALL_HEIGHT),
    x: 0  
  };
  
  if (caveWalls.length > 0) {
    var lastWall = caveWalls[caveWalls.length - 1];
  
    // set the x of the current caveWall to be 1 WALL_WIDTH away from the previous
    caveWall.x = lastWall.x + WALL_WIDTH;

    // randomly increase or decrease height from last caveWall
    var topWallHeight = pixelPropToNum(lastWall.topWall, 'height') + (Math.random() > .5 ? -5 : 5);
    var bottomWallHeight = pixelPropToNum(lastWall.bottomWall, 'height') + (Math.random() > .5 ? -5 : 5);

    // ensure caveWall height is balanced between the minimum and maximum caveWall height
    topWallHeight = Math.min(Math.max(topWallHeight, MIN_WALL_HEIGHT), MAX_WALL_HEIGHT);
    bottomWallHeight = Math.min(Math.max(bottomWallHeight, MIN_WALL_HEIGHT), MAX_WALL_HEIGHT);
    
    // apply the newly calculated caveWall height
    caveWall.topWall.css('height', topWallHeight);
    caveWall.bottomWall.css('height', bottomWallHeight);
  }  

  // add the topWall and bottomWall jQuery elements as children of the board
  BOARD.append(caveWall.topWall, caveWall.bottomWall);

  // set their CSS positions
  moveElementTo(caveWall.topWall, caveWall.x, 0);
  moveElementTo(caveWall.bottomWall, caveWall.x, BOARD_HEIGHT - pixelPropToNum(caveWall.bottomWall, 'height'));

  // add the caveWall to the Array of caveWalls
  caveWalls.push(caveWall);
}

function moveCaveWalls() {
  // move the cave caveWalls first
  for (var i = 0; i < caveWalls.length; i++) {
    var caveWall = caveWalls[i];

    caveWall.x -= WALL_SPEED;
    moveElementTo(caveWall.topWall, caveWall.x);
    moveElementTo(caveWall.bottomWall, caveWall.x);
  }

  // if the first caveWall has gone out of the left side of the screen
  if (caveWalls[0].x < 0 - WALL_WIDTH) {
    // remove it's topWall and bottomWall jQuery elements from the board
    caveWalls[0].topWall.remove();
    caveWalls[0].bottomWall.remove();

    // remove it from the Array
    caveWalls.shift();

    // make a new Cave caveWall
    makeCaveWall();
  }
}

function moveElementTo(element, x, y) {
  element.css('left', x);
  element.css('top', y);
}

function moveHelicopter() {
  if (keysDown[KEY.UP]) {
    helicopter.verticalVelocity -= .3;
  } else {
    helicopter.verticalVelocity += .5;
  }

  helicopter.y += helicopter.verticalVelocity;
  moveElementTo(helicopter.element, helicopter.x, helicopter.y);
}

function moveObstacleWall() {
  obstacleWall.x -= WALL_SPEED;
  moveElementTo(obstacleWall.element, obstacleWall.x, obstacleWall.y);

  if (obstacleWall.x + OBSTACLE_WALL_WIDTH < 0) {
    obstacleWall.element.remove();
    makeObstacleWall();
    updateScore(1);
  }
}

/* Convet a given CSS property of a given jQuery element from
the pixel String value to just the Number */
function pixelPropToNum(jQueryElement, prop) {
  var heightStr = jQueryElement.css(prop);  // get the string pixel prop ending in "px"
  heightStr = heightStr.slice(0, heightStr.length - 2); // remove "px"
  return Number(heightStr);
}

function reset() {
  // display the proper score
  score.element.text();

  // stop update function from running
  clearInterval(updateInterval);

  // turn off keyboard inputs
  $(document).off();

  // empty the board of elements
  BOARD.empty();
  
  // restart the game after 500 ms
  setTimeout(function() {
    
    // anything else you might want to do between points...

    // reset positions of Objects
    init();
  }, 500);
 
}

function updateScore(points) {
  score.points += points;
  score.element.text(score.points);
}