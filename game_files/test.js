let BULLET_SPEED = 5;
let PLAYER_SPEED = 4;

const HEALTH_WIDTH  = 400;
const HEALTH_HEIGHT = 50;

let MAX_HEALTH    = 3;
// tutorial at https://github.com/kittykatattack/learningPixi

let type = "WebGL";
let render = PIXI.autoDetectRenderer();

if(!PIXI.utils.isWebGLSupported())
    type = "canvas";

PIXI.utils.sayHello(type);

function loadProgressHandler(loader, resource) {

    // This could be changed to create a loading bar

    //Display the file `url` currently being loadProgressHandler

    console.log("loading: " + resource.url); 

    //Display the percentage of files currently loaded

    console.log("progress: " + loader.progress + "%");

}

/*
    
    UPDATE: okay nvm don't set them globally, all it does is create weird issues when recreating the scenes

    Keep them as local as possible

*/

let splash, main_menu, menu, play_screen, zone; // Set all containers, this is the different scenes the game will have

/* Main idea 

    app.stage is your main scene, we add and remove containers/sprites from it as we please

    For different scenes, we'll need to add all sprites related to a scene into a container
        
        To display, simply do:

            app.stage.addChild(scene_name);
        
        To hide it, simply do:

            app.stage.removeChild(scene_name);


    IMPORTANT NOTE: EVERY SPRITE CAN ONLY BELONG TO **1** CONTAINER

                    EVERY TIME YOU ASSIGN IT TO ANOTHER CONTAINER, IT LOSES MEMBERSHIP OF ITS PREVIOUS CONTAINER

*/

let enemies = [];
let bullets = [];
let obstacles = [];

let sprite, title, start, round_title, health_bar, active_health; // Set all sprites here
let state;

let enemies_left = 0;
let killed = 0;

// style all text in game with this (you can style it with http://pixijs.download/release/docs/PIXI.TextStyle.html)

let style = new PIXI.TextStyle({
    fontFamily: "Pixellari",
    fontSize: 36,
    fill: 0x999999,
    strokeThickness: 0,
    align: "center",
});

// Initialized when all pictures/music/fonts/whatever has been fully loaded

function setup(){

    app.ticker.add(function fade_splash(delta) {

        // Remove splash screen

        splash.alpha -= delta / 20;

        if(splash.alpha <= 0){
            app.ticker.remove(fade_splash);
            app.stage.removeChild(splash);
            splash.visible = false;
        }

    });

    console.log("Setup doned");

    //Capture the keyboard arrow keys + WASD

    keyboard_listen();
    set_title_screen();

    state = play;

    app.ticker.add(delta => gameLoop(delta));

}

// Sets the splash screen + Loading bar

function set_splash_screen(){

    splash = new PIXI.Container();

    let title = new PIXI.Text("cycnus", {
        fontFamily: "Modern Sans",
        fontSize: 36,
        fill: 0x000000,
    });

    title.anchor.set(0.5, 0.5);
    title.position.set(MID_WIDTH, MID_HEIGHT);

    splash.addChild(title);

    app.stage.addChild(splash);

    // Set playing zone

    zone = new PIXI.Container();
    zone.alpha = 0;
    zone.interactive = true;
    zone.buttonMode  = true;

    zone.on('mousedown', (event) => {

        if(sprite.shots == 0)
            return;

        event = event.data.getLocalPosition(app.stage);

        shoot(0, sprite.position.x, sprite.position.y, event.x, event.y, true);

    });

    let area = new PIXI.Graphics();
    area.lineStyle(1, 0x262626, 1);
    area.beginFill(0xe6e6e6);
    area.drawRect(0, 0, WIDTH - PADDING * 2, HEIGHT - PADDING * 2);
    area.endFill();
    area.position.set(PADDING, PADDING);

    // Create player

    sprite = new PIXI.Graphics();
    sprite.lineStyle(1, 0x737373, 1);
    sprite.beginFill(0xf2f2f2); // Set colour here
    sprite.drawRect(0, 0, SPRITE_SIZE * 2, SPRITE_SIZE * 2);
    sprite.endFill();

    sprite.anchor = {x: 0.5, y: 0.5};
    
    sprite.position.x = MID_WIDTH;
    sprite.position.y = MID_HEIGHT; // set x and y

    sprite.vx = 0;
    sprite.vy = 0;

    sprite.hp = MAX_HEALTH;

    sprite.interactive = true;
    sprite.buttonMode = true;

    sprite.spriteID = -1;
    sprite.isPlayer = true;
    sprite.isUser = true;
    sprite.hitArea = new PIXI.Polygon([0, 0, SPRITE_SIZE * 2, 0, SPRITE_SIZE * 2, SPRITE_SIZE * 2, 0, SPRITE_SIZE * 2]);

    sprite.on('click', (event) => {
       set_title_screen();
    });


    // Create Round Title

    round_title = new PIXI.Text("", style);

    round_title.position.set(-round_title.width - 30, HEIGHT - PADDING * 0.5);

    zone.addChild(area);
    zone.addChild(sprite);
    zone.addChild(round_title);

    app.stage.addChild(zone);

}

// Start game

let new_game = true;

function start_game(){

    // generate map

    if(new_game == true){

        new_game = false;

        /*
         *  Current issues:
         *
         *      - How to uniformly/randomly distribute these shapes without having any stage issues?
         *          Issues include:
         *              - Corridors too narrow for anything to pass
         *              - Empty zones (too boring)
         *              - Intense zones (too crowded)
         *              - Intersecting with wall, other obstacles
         *
         *      - How to generate random-looking (but not too random) polygons?
         *          - Too irregular and the obstacle is just too weird to play with
         *          - Too regular and the game is too boring
         *
         *  Potential Solutions:
         *
         *      - Split map into zones/regions; each region will have 1-2 obstacles
         *          - Can be done with generating a few points that have at least N distance in between
         *          - This way we can avoid using a Voronoi Diagram to get seemingly random regions
         *      
         *      - Generate squares, create random tree-like shapes with these big blocks of squares
         *          - Makes this so much easier to code holy shit
		 *		
		 *		- Make a hardcoded map
         */

        /*
		 *	Generate random # of components (# of obstacles)
		 *  	Randomly set edges (Connecting blocks)
		 *		Make sure they don't accidentally connect to other obstacles and block off a screen region
		 *	
		 *	Different block sizes? Other things we want?
		 *
		 */
		

		for(let wall of get_obstacles()){
			
			let shape = new PIXI.Polygon(wall.points);

			let obstacle = new PIXI.Graphics();
			obstacle.lineStyle(1, 0x737373, 1);
			obstacle.beginFill(0xFFFFFF); // Set colour here
			obstacle.drawPolygon(shape);
			obstacle.endFill();

			shape.x = obstacle.x = wall.x;
			shape.y = obstacle.y = wall.y;
            shape.isObstacle = true;

			zone.addChild(obstacle);
			obstacles.push(shape);
			
		}

        generateHealthBar();

        obstacles.push(sprite);

    }

}



// Sets the title screen

let is_title = false; // Prevent duplicate menus

function set_title_screen(){

    if(is_title == true)
        return;

    is_title = true;

    let main_menu = new PIXI.Container();

    // text

    let title = new PIXI.Text("BLOCK BUSTER", style);
    title.anchor.set(0.5, 0.5);
    title.position.set(MID_WIDTH, -MID_HEIGHT + MID_HEIGHT / 2);

    let start = new PIXI.Text("PLAY", style);
    start.anchor.set(0.5, 0.5);
    start.position.set(MID_WIDTH, MID_HEIGHT + MID_HEIGHT * 3 / 2);


    start.interactive = true; 
    start.buttonMode = true;
    //start.cursor = 'pointer';

    app.ticker.add(function move_in(delta) {

        title.y += delta * 20;
        start.y -= delta * 20;

        if(zone.alpha > 0)
            zone.alpha -= delta / 10;

        if(title.y >= MID_HEIGHT / 2 && zone.alpha <= 0){
            app.ticker.remove(move_in);
            zone.visible = false;
        }

    });

    start.on('click', (event) => {

        zone.visible = true;

        app.ticker.add(function move_out(delta) {

            title.y -= delta * 20;
            start.y += delta * 20;

            if(zone.alpha < 1)
                zone.alpha += delta / 10;

            if(title.y <= -MID_HEIGHT / 2 && zone.alpha >= 1){

                // Removing the function in the ticker

                app.ticker.remove(move_out);
                app.stage.removeChild(main_menu);
                main_menu.visible = false;
                is_title = false;

                start_game();

            }

        });

    });

    start.on('mouseover', (event) => {
       start.style = {
          fontFamily: "Pixellari",
          fontSize: 36,
          fill: 0xb3b3b3, // changed
          strokeThickness: 0,
        }
    });

    start.on('mouseout', (event) => {
       start.style = {
          fontFamily: "Pixellari",
          fontSize: 36,
          fill: 0x999999, // changed
          strokeThickness: 0,
        }
    });

    main_menu.addChild(start);
    main_menu.addChild(title);

    app.stage.addChild(main_menu);

}

function set_game_over(){

    let title = new PIXI.Text("GAME OVER", style);
    title.anchor.set(0.5, 0.5);
    title.position.set(MID_WIDTH, -MID_HEIGHT + MID_HEIGHT / 2);

    app.stage.addChild(title);

    app.ticker.add(function move_in(delta) {

        title.y += delta * 20;
        //start.y -= delta * 20;

        if(zone.alpha > 0)
            zone.alpha -= delta / 10;

        if(title.y >= MID_HEIGHT / 2 && zone.alpha <= 0){
            app.ticker.remove(move_in);
            zone.visible = false;
        }

    });

}



let wave_id = 0;

function move_out(){

    let target = -round_title.width - 30;

    app.ticker.add(function move_title_out(delta) {

        round_title.position.x -= Math.abs(round_title.position.x - target) / 16;

        if(round_title.position.x < target + 2){
            app.ticker.remove(move_title_out);
            is_ready_to_load = true;
            is_loaded = false;
        }

    });

}

function generateHealthBar(){

    // Outline

    health_bar = new PIXI.Graphics();
    health_bar.lineStyle(10, 0x000000);
    health_bar.drawRect(0, 0, HEALTH_WIDTH, HEALTH_HEIGHT);
    health_bar.position.set(WIDTH + HEALTH_WIDTH + 20, HEIGHT - HEALTH_HEIGHT - 20);

    // Active health portion

    active_health = new PIXI.Graphics();
    active_health.lineStyle(10, 0x000000);
    active_health.beginFill(0x000000);
    active_health.drawRect(0, 0, 1, HEALTH_HEIGHT - 24);
    active_health.endFill();

    active_health.position.set(WIDTH + HEALTH_WIDTH * 2 + 20, HEIGHT - HEALTH_HEIGHT - 8);

    let target = WIDTH - HEALTH_WIDTH - 20;

    app.ticker.add(function move_in(delta){

        let distance = Math.abs(health_bar.position.x - target) / 8;
        
        health_bar.position.x -= distance;
        active_health.position.x -= distance;

        if(health_bar.position.x - target < 3){

            app.ticker.remove(move_in);

            target = health_bar.position.x + health_bar.width * 0.5 - 22.5;

            app.ticker.add(function move_health(delta){

                let distance = ((health_bar.width - 24) - active_health.width) / 16;

                active_health.position.x -= Math.abs(active_health.position.x - target) / 16;
                active_health.width += distance;

                //console.log(active_health.width, HEALTH_WIDTH)

                if(Math.abs((health_bar.width - 24) - active_health.width) < 0.5){
                    app.ticker.remove(move_health);
                    console.log("load bar done")
                }

            });

        }

    });

    zone.addChild(health_bar);
    zone.addChild(active_health);

}

function lose(){
    sprite.hp--;
    health_update();
}

function win(){
    sprite.hp++;
    health_update();
}

let move_health_func, still_running = false;

function health_update(){

    if(still_running == true)
        app.ticker.remove(move_health_func);

    still_running = true;

    let start        = active_health.width;
    let target_width = (386 / 3) * sprite.hp;

    let target_x     = health_bar.position.x + 386 / 2 + (386 - target_width) / 2 - [-7.5, -1.5, 4.5, 10.5][sprite.hp];

    app.ticker.add(move_health_func = function move_health(delta){

        active_health.position.x += (target_x - active_health.position.x) / 4;
        active_health.width += (target_width - active_health.width) / 4;
        
        if(Math.abs(target_width - active_health.width) < 0.02){
            app.ticker.remove(move_health);
            still_running = false;
        }

    });

    zone.addChild(active_health);

}


function generateTitle(number){

    round_title.text = `ROUND ${wave_id}`;

    app.ticker.add(function move_title_in(delta) {

        round_title.position.x += Math.abs(round_title.position.x - 30) / 16;

        if(round_title.position.x > 28){
            app.ticker.remove(move_title_in);
            is_loaded = false;
            is_ready_to_load = false;
        }

    });

}

function generateWave(){

    if(is_ready_to_load == false)
        return;

    clearDeleted();

    console.log(`WAVE NUMBER ${wave_id}`);

    generateTitle(wave_id++);

    let enemy_count = Math.min(10, Math.ceil(wave_id / 3));

    enemies_left = enemy_count;

    for(let counter = 0; counter < enemy_count; ++counter){
        let enemy = generateEnemy("triangle", obstacles);

        enemy.spriteID = counter;

        zone.addChild(enemy);
        obstacles.push(enemy);
        enemies.push(enemy);
    }

    // Countdown to nex

 }
 

function clearDeleted(){

    // Clears deleted enemies to prevent further checking

    let new_enemies = [];

    for(let enemy of enemies){
        if(enemy.dead == true)
            continue;
        new_enemies.push(enemy);
    }

    let new_obstacles = [];

    for(let obstacle of obstacles){
        if(obstacle.dead == true)
            continue;
        new_obstacles.push(obstacle);
    }

    enemies = new_enemies.slice(0);
    obstacles = new_obstacles.slice(0);

}

function shoot(id, src_x, src_y, tgt_x, tgt_y, is_player = false){

    if(is_player == true){
        if(sprite.shots <= 0)
            return;
        sprite.shots--;
    } else {
        if(enemies[id].shots <= 0)
            return;
        if(enemies[id].previousShot-- > 0){
            return;
        }
        enemies[id].shots--;
        enemies[id].previousShot = 15;
    }

    let unit_size = is_player ? SPRITE_SIZE : enemies[id].height;

    let bullet = new PIXI.Graphics();
    bullet.beginFill(0x000000); // Set colour here
    bullet.drawCircle(0, 0, 2);
    bullet.endFill();

    let mx = tgt_x - src_x - unit_size;
    let my = tgt_y - src_y - unit_size;

    if(is_player == true && Math.abs(mx) <= SPRITE_SIZE && Math.abs(my) <= SPRITE_SIZE)
        return;

    bullet.position.set(src_x + unit_size, src_y + unit_size);
    bullet.angle = Math.atan2(my, mx);
    bullet.vx = Math.cos(bullet.angle);
    bullet.vy = Math.sin(bullet.angle);
    bullet.anchor = {x: 1, y: 1};
    bullet.isBullet = true;

    bullet.isPlayerShot = is_player;
    bullet.spriteID = enemies[id].spriteID;

    bullets.push(bullet);

    zone.addChild(bullet);

}









// Actual loop

let previous = 0;
let is_loaded = false;
let is_ready_to_load = true;

function gameLoop(delta){

    // Update current game state
    state(delta);

    if(enemies_left == 0 && is_loaded == false && is_title == false){
        is_loaded = true;
        if(wave_id > 0 && is_ready_to_load == false)
            move_out();
        generateWave();
    }

}

// Actual movement

function play(delta){

    sprite = move(sprite, delta, obstacles)[0];

    // Draw bullets

    // Need a good datastructure for:

    // Quick removal of objects

    // Indexing an item

    let is_hit;
    let valid_bullets = [];

    for(let ID = 0; ID < bullets.length; ID++){

        let [new_bullet, is_hit] = move(bullets[ID], BULLET_SPEED, obstacles);

        let hit_player = in_polygon(new_bullet, sprite);
		
        if(is_hit === false && hit_player == false){
			valid_bullets.push(new_bullet);
        } else {
            // maybe add a small explosion animation here

            if(hit_player == true){

                sprite.hp--;
                if(sprite.hp == 0){
                    setTimeout(set_game_over, 1000);
                    app.ticker.remove(gameLoop);
                }

                health_update();

            } else if(is_hit !== true && obstacles[is_hit].isObstacle !== true){

                obstacles[is_hit].dead = true;
                obstacles[is_hit].visible = false;
			    zone.removeChild(obstacles[is_hit]);

                enemies_left--;
                killed++;
            }

            let explosion_circle = new PIXI.Graphics();
            explosion_circle.beginFill(0x404040, 1); // Set colour here
            explosion_circle.drawCircle(bullets[ID].position.x, bullets[ID].position.y, Math.floor(Math.random() * 15 + 5));
            explosion_circle.endFill();

            zone.addChild(explosion_circle);

            app.ticker.add(function boom(delta) {

                explosion_circle.alpha -= delta * 0.1;

                if(explosion_circle.alpha <= 0){
                    app.ticker.remove(boom);
                    explosion_circle.alpha.visible = false;
                    zone.removeChild(explosion_circle);
                }

            });

            bullets[ID].visible = false;

            if(bullets[ID].isPlayerShot == true){
                sprite.shots++;
            } else {
                if(enemies[bullets[ID].spriteID].dead)
                    continue;
                enemies[bullets[ID].spriteID].shots++;
            }

            zone.removeChild(bullets[ID]);
        }

    }

    bullets = valid_bullets.slice(0);

    for(let ID = 0; ID < enemies.length; ID++){
        enemies[ID] = getPath(sprite, enemies[ID]);
        enemies[ID] = move(enemies[ID], delta, obstacles)[0];

        if(enemies[ID].dead != true && isVisible(enemies[ID], sprite) == true){
            shoot(ID, enemies[ID].position.x, enemies[ID].position.y, sprite.position.x, sprite.position.y);
        }

    }

}

//Create a Pixi Application

let app = new PIXI.Application({ 
    width: WIDTH,         // default: 800
    height: HEIGHT,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1,       // default: 1
});

let container = document.getElementById("container");

//Add the canvas that Pixi automatically created for you to the HTML document



container.appendChild(app.view);
app.renderer.backgroundColor = 0xF2F2F2; // Background colour


// Start splash screen

set_splash_screen();

/*app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);*/


/*
 *    Load important files (Audio, Pictures, etc)
 */

PIXI.loader
  .add(["https://cycnus-studio.github.io/enemy_1.png"])
  .on("progress", loadProgressHandler) 
  .load(setup);


//The `keyboard` helper functions

function keyboard(keyCodeA, keyCodeB) {
    var key = {};
    key.codeA = keyCodeA;
    key.codeB = keyCodeB;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.keyCode === key.codeA || event.keyCode === key.codeB) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }
        event.preventDefault();
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.keyCode === key.codeA || event.keyCode === key.codeB) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }
        event.preventDefault();
    };

    //Attach event listeners
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    return key;
}

function keyboard_listen(){
    let left  = keyboard(37, 65),
        up    = keyboard(38, 87),
        right = keyboard(39, 68),
        down  = keyboard(40, 83);
    
    left.press = () => {
        sprite.vx = -PLAYER_SPEED;
    };
    left.release = () => {
        sprite.vx = right.isDown ? PLAYER_SPEED : 0;
    };

    up.press = () => {
        sprite.vy = -PLAYER_SPEED;
    };
    up.release = () => {
        sprite.vy = down.isDown ? PLAYER_SPEED : 0;
    };

    right.press = () => {
        sprite.vx = PLAYER_SPEED;
    };
    right.release = () => {
        sprite.vx = left.isDown ? -PLAYER_SPEED : 0;
    };

    down.press = () => {
        sprite.vy = PLAYER_SPEED;
    };
    down.release = () => {
        sprite.vy = up.isDown ? -PLAYER_SPEED : 0;
    };
}
