
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
let on_pause = true;

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

const BLUE_COLOURS = [0x50c0ed, 0x98d7e2, 0x2da9ff, 0x0d1dc6, 0x2dfff8, 0xc2f2f9, 0x7dc2ed];

const WHITE = 0xFFFFFF;
const BLACK = 0x000000;

const ENEMY_TYPES = ["triangle", "square", "pentagon", "hexagon", "octagon"];
const COLOUR_NAMES = ["black", "yellow", "green", "blue", "purple", "red", "orange"];

const STARTING_ROUNDS = [9, 0, 19, 39];

let enemies   = [];
let bullets   = [];
let obstacles = [];
let mines     = [];
let particles = [];

let blue_colour_bg = false;

/*                                      */

let type = "WebGL";
const renderer = PIXI.autoDetectRenderer();

if(!PIXI.utils.isWebGLSupported())
    type = "canvas";

PIXI.utils.sayHello(type);


let particle_container = new PIXI.Container();
let background_particle_container = new PIXI.Container();


function rand_range(low, high, is_float = false){

	let range = high - low + 1;
	
	if(is_float == true)
		return Math.random() * range + low;

	return Math.floor(Math.random() * range + low);

}
