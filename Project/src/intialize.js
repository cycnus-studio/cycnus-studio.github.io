
// Set dimensions

const HEIGHT  = 800;
const WIDTH   = 1200;
const PADDING = 100;

const MID_HEIGHT = HEIGHT / 2; 
const MID_WIDTH  = WIDTH / 2;

const SPRITE_SIZE = 10;
const BOSS_SIZE   = 30;

const MIN_OBSTACLES = 2;
const MAX_OBSTACLES = 6;

const MIN_BLOCK_SIZE = 10;
const MAX_BLOCK_SIZE = 40;

const HEALTH_WIDTH  = 400;
const HEALTH_HEIGHT = 50;

const BORDER = 5;

const ENEMY_BONUS = 25;
const BOSS_BONUS  = 50;

const MINES_COUNT = 3;


let BULLET_SPEED  = 4;
let PLAYER_SPEED  = 4;
let ENEMY_SPEED   = 3.5;
let MAX_HEALTH    = 4;
let MAX_SHOTS     = 5;

let wave_id = 0;

// Powerups

let freeze_duration = 0;
let slowing_factor  = 1;
let mines_left      = 0;

const POWER_NAMES         = ["freeze", "mine", "laser"]; 
const BUTTON_POSITIONS    = [220, 320, 420];
const BASE_POWERUP_SCORES = [300, 800, 1500];


const ROUNDS  = 20;

const COLOURS = [0x75D5FD, 0x09FBD3, 0xFE53BB, 0xFFDEF3, 0xFF2281, 0x13CA91,  // Player colours
				 0xFFFFFF, 0xFFE66D, 0xBCE784, 0xA4FFEE, 0x915E87, 0xBC1E1E, 0xF4A261]; // Enemy colours

const WHITE = 0xFFFFFF;
const BLACK = 0x000000;

const ENEMY_TYPES = ["triangle", "square", "pentagon", "hexagon", "octagon"];
const COLOUR_NAMES = ["black", "yellow", "green", "blue", "purple", "red", "orange"];

const STARTING_ROUNDS = [9, 0, 19, 39];


function rand_range(low, high){

	let range = high - low + 1;

	return Math.floor(Math.random() * range + low);

}
