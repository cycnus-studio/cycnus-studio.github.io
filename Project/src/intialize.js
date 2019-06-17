/*
 *  Sets all important variables to be used in between files.
 *
 *  Author: Cycnus Studio
 *  Date: May 14th, 2019
 *
 */

// Set dimensions

const HEIGHT  = 800;  // Height of canvas
const WIDTH   = 1200; // Width of canvas
const PADDING = 100;  // Padding around playing area

const MID_HEIGHT = HEIGHT / 2; // Mid canvas height (Useful for centering objects)
const MID_WIDTH  = WIDTH / 2;  // Mid canvas width  (Useful for centering objects)

const SPRITE_SIZE = 10; // Base size of an enemy
const BOSS_SIZE   = 30; // Base size of a boss

const BORDER_THICKNESS = 5; // Thickness of obstacle walls 

const HEALTH_WIDTH  = 400; // Width of health bar
const HEALTH_HEIGHT = 50;  // Height of health bar

const BINARY_SEARCH_ROUNDS  = 20; // Number of iterations for binary search, higher will have a better precision while lower would be faster

// Set game mechanic constants

const PLAYER_BULLET_SPEED  = 4; // Player's bullet velocity
const PLAYER_SPEED         = 4; // Player's movement speed
const PLAYER_HEALTH           = 4; // Player's max health  
const PLAYER_SHOTS         = 5; // Player's bullet counter

const ENEMY_BONUS = 25; // Score player receives for killing an enemy
const BOSS_BONUS  = 50; // Score player receives for killing a boss

let wave_id = 0;      // Wave/Round counter
let on_pause = true;  // Boolean for checking if game is paused

// Powerups

let freeze_duration = 0; // Duration counter for freeze powerup (ex: 500 indicates a freeze powerup that will last for 500 frames)
let slowing_factor  = 1; // Current slowing down factor (ex: 0.5 means all enemy movement is reduced by half the speed)
let mines_left        = 0; // Number of mines left on screen (ex: 1 means there is 1 mine on screen)

const MINES_COUNT = 3; // Numbr of mines to be generated

const POWER_NAMES = ["freeze", "mine", "laser"]; // Powerup names
const BUTTON_POSITIONS    = [220, 320, 420];       // Powerup button x coordinates
const BASE_POWERUP_SCORES = [300, 800, 1600];    // Minimum point value required to unlock each respective powerup

// Set design choices here

const COLOURS = [0x75D5FD, 0x09FBD3, 0xFE53BB, 0xFFDEF3, 0xFF2281, 0x13CA91,            // Player colours (In hexadecimal)
                 0xFFFFFF, 0xFFE66D, 0xBCE784, 0xA4FFEE, 0x915E87, 0xBC1E1E, 0xF4A261]; // Enemy colours  (In hexadecimal)

const BLUE_COLOURS = [0x50c0ed, 0x98d7e2, 0x2da9ff, 0x0d1dc6, 0x2dfff8, 0xc2f2f9, 0x7dc2ed]; // Colours when screen is frozen

const WHITE = 0xFFFFFF; // White (In hexadecimal)
const BLACK = 0x000000; // Black (In hexadecimal)

const ENEMY_TYPES = ["triangle", "square", "pentagon", "hexagon", "octagon"];         // Enemy type labels
const COLOUR_NAMES = ["black", "yellow", "green", "blue", "purple", "red", "orange"]; // Colour name labels (Lined up with second row of COLOURS)

const STARTING_ROUNDS = [9, 0, 19, 39]; // Starting rounds for each enemy shape ([Triangle, Square, Pentagon, Hexagon])

// Containers for all in-game objects

let enemies   = [];
let bullets   = [];
let obstacles = [];
let mines      = [];
let particles = [];

let blue_colour_bg = false; // Sets the blue background

// Load the canvas

// The reason we decided to use PIXI.js is for its fast performance, which will allow a better experience

// The majority of its features could all be replicated with normal canvas operations, but would be faster with PIXI.js

let type = "WebGL";
const renderer = PIXI.autoDetectRenderer();

if(!PIXI.utils.isWebGLSupported())
    type = "canvas";

PIXI.utils.sayHello(type); // Loads a nice console message :)

// Set important containers for to be used with particles.js

let particle_container = new PIXI.Container();
let background_particle_container = new PIXI.Container();

// Load important functions

function rand_range(low, high, is_float = false){

    /*
        
        Returns a random interger/float from low to high, inclusive.

        [Input]
            low      => The lower bound of the range.
            high     => The upper bound of the range.
            is_float => Whether to round to an integer or not.

        [Output]
            integer/float => A random value in the given range.

    */

    // Set range of [low, high]

    let range = high - low + 1;

    // Check whether or not to round.
    
    if(is_float == true)
        return Math.random() * range + low;

    return Math.floor(Math.random() * range + low);

}
