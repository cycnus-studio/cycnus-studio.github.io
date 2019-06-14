function loadProgressHandler(loader, resource) {

    // This could be changed to create a loading bar

    //Display the file `url` currently being loadProgressHandler

    console.log("loading: " + resource.url); 

    //Display the percentage of files currently loaded

    console.log("progress: " + loader.progress + "%");

}

let splash, main_menu, menu, play_screen, zone, bullet_container, mine_container; // Set all containers, this is the different scenes the game will have

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

let sprite, title, start, round_title, health_bar, active_health, pause, boss_bar, boss_health, boss, point_title, credits; // Set all sprites here
let state;

let enemies_left = 0;
let user_score   = 0;

let music = new PlaylistManager();
let shoot_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/fire%20sound.mp3", 0.1);
let death_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/death%20sound.mp3", 1);
let hit_sound   = new SFXManager("https://cycnus-studio.github.io/Project/audio/hit%20sound.mp3", 0.05);

let particle_manager = new ParticleManager();

// style all text in game with this (you can style it with http://pixijs.download/release/docs/PIXI.TextStyle.html)

let style = new PIXI.TextStyle({
    fontFamily: "Roboto Th",
    fontSize: 72,
    fill: WHITE,
    align: "center",
});

let bolded_style = new PIXI.TextStyle({
    fontFamily: "Roboto Th",
    fontSize: 72,
    fill: WHITE,
    strokeThickness: 2,
    stroke: "white",
    align: "center",
});

let round_style = new PIXI.TextStyle({
    fontFamily: "Roboto Th",
    fontSize: 36,
    fill: WHITE,
    strokeThickness: 0,
    align: "center",
});

let instructions_style = new PIXI.TextStyle({
    fontFamily: "Roboto Th",
    fontSize: 20,
    fill: WHITE,
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

    console.log("Setup done");

    //Capture the keyboard arrow keys + WASD

    keyboard_listen();
    set_title_screen();
    setup_powerups();

    state = play;

}

// Sets the splash screen + Loading bar

function set_splash_screen(){

    splash = new PIXI.Container();

    let title = new PIXI.Text("cycnus", {
        fontFamily: "Modern Sans",
        fontSize: 36,
        fill: WHITE,
    });

    title.anchor.set(0.5, 0.5);
    title.position.set(MID_WIDTH, MID_HEIGHT);
    title.alpha = 0;

    app.ticker.add(function fade_in(){
    	title.alpha += (1 - title.alpha) / 8;
    	if(1 - title.alpha < 1e-2)
    		app.ticker.remove(fade_in);
    });

    splash.addChild(title);

    app.stage.addChild(splash);

    // Set playing zone

    zone = new PIXI.Container();
    zone.alpha = 0;

    zone.on('mousedown', (event) => {

        if(sprite.shots == 0)
            return;

        event = event.data.getLocalPosition(app.stage);

        shoot(0, sprite.position.x, sprite.position.y, event.x, event.y, true);

    });

    let area = new PIXI.Graphics();
    area.lineStyle(1, WHITE, 1);
    area.beginFill(BLACK);
    area.drawRect(0, 0, WIDTH - PADDING * 2, HEIGHT - PADDING * 2);
    area.endFill();
    area.position.set(PADDING, PADDING);

    // Create player

    sprite = new PIXI.Graphics();

	sprite.colour = COLOURS[rand_range(0, 5)];

    sprite.lineStyle(1, sprite.colour, 1);
    sprite.beginFill(sprite.colour); // Set colour here
    sprite.drawRect(0, 0, SPRITE_SIZE * 2, SPRITE_SIZE * 2);
    sprite.endFill();

    sprite.anchor = {x: 0.5, y: 0.5};
    
    sprite.position.x = MID_WIDTH;
    sprite.position.y = MID_HEIGHT; // set x and y

    sprite.vx = 0;
    sprite.vy = 0;

    sprite.hp = MAX_HEALTH;
    sprite.shots = MAX_SHOTS;

    sprite.spriteID = -1;
    sprite.isPlayer = true;
    sprite.isUser = true;
    sprite.hitArea = new PIXI.Polygon([0, 0, SPRITE_SIZE * 2, 0, SPRITE_SIZE * 2, SPRITE_SIZE * 2, 0, SPRITE_SIZE * 2]);
	
	particle_manager.follow_particles(sprite);

    sprite.lose_hp = function(){
    	hit_sound.play();
	    sprite.hp--;
	    if(sprite.hp == 0){
	        music.pause();
	        freeze_duration = 500;
	        app.ticker.add(function pop(){
	        	sprite.scale.x -= sprite.scale.x / 8;
	        	sprite.scale.y -= sprite.scale.y / 8;
	        	if(sprite.scale.x < 1e-5){
	        		app.ticker.remove(pop);
	        		setTimeout(set_game_over, 500);
	        	}
	        });
	    }
	    health_update();
	}


    // Create Round Title

    round_title = new PIXI.Text("", round_style);

    round_title.position.set(30, HEIGHT - PADDING * 0.5);

    zone.addChild(background_particle_container);
    zone.addChild(area);
    zone.addChild(round_title);
	
	// Create particles container
	
	zone.addChild(particle_container);

    // Create bullets container

    bullet_container = new PIXI.Container();
    zone.addChild(bullet_container);

    // Create mine container

    mine_container = new PIXI.Container();
    bullet_container.addChild(mine_container);

    zone.addChild(sprite);

    app.stage.addChild(zone);

}

// Start game

let new_game = true;

function start_game(){

    // generate map

    on_pause = false;

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
         *          - Makes this so much f*cking easier to code holy shit
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
		
		initialize();

		for(let wall of get_obstacles()){
			
			let shape = new PIXI.Polygon(wall.points);

			let obstacle = new PIXI.Graphics();
			obstacle.lineStyle(10, WHITE, 1);
			obstacle.beginFill(BLACK); // Set colour here
			obstacle.drawPolygon(shape.points.slice(0));
			obstacle.endFill();

			shape.x = obstacle.x = wall.x;
			shape.y = obstacle.y = wall.y;
			shape.width = obstacle.width;
            shape.height = obstacle.height;

            shape.graphics = obstacle;
			
			let vertice = 0;
			for(let [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){
				shape.points[vertice] += dx * BORDER;
				shape.points[vertice + 1] += dy * BORDER;
				vertice += 2;
			}
			
            shape.isObstacle = true;
			
			particle_manager.surround_particles(obstacle);

			zone.addChild(obstacle);
			obstacles.push(shape);
			
		}

		// Create pause button

	    pause = new PIXI.Sprite(PIXI.loader.resources["https://cycnus-studio.github.io/Project/img/pauseButton.png"].texture);
	    
		pause.anchor.set(0.5, 0.5);
	    pause.scale.set(0.1, 0.1);

	    pause.position.set(WIDTH + pause.width + 30, pause.height / 2 + 30);

	    pause.interactive = true;
	    pause.buttonMode = true;

	    pause.on('click', (event) => {
	        music.pause();
	        set_title_screen("resume");
	        zone.interactive = false;
	        zone.buttonMode = false;
	        zone.cursor = "crosshair";
	    });

	    pause.on('mouseover', (event) => {
	    	app.ticker.add(function zoom(){
	    		pause.scale.x += (0.15 - pause.scale.x) / 8;
	    		pause.scale.y += (0.15 - pause.scale.y) / 8;
	    		if(0.15 - pause.scale.x < 1e-2)
	    			app.ticker.remove(zoom);
	    	})
	    });

	    pause.on('mouseout', (event) => {
	    	app.ticker.add(function zoom(){
	    		pause.scale.x += (0.1 - pause.scale.x) / 8;
	    		pause.scale.y += (0.1 - pause.scale.y) / 8;
	    		if(pause.scale.x - 0.1 < 1e-2){
	    			pause.scale.set(0.1, 0.1);
	    			app.ticker.remove(zoom);
	    		}
	    	})
	    });

	    zone.addChild(pause);
		
		// Make in-game tutorial

		let arrows       = new PIXI.Sprite(PIXI.loader.resources["https://cycnus-studio.github.io/Project/img/directions.png"].texture);
		let instructions = new PIXI.Text(
			`Click to shoot.
			Avoid enemy bullets.`, instructions_style);
	    
		arrows.anchor.set(0.5, 0.5);
		instructions.anchor.set(0.5, 0.5);
	    arrows.scale.set(0.1, 0.1);

	    arrows.position.set(MID_WIDTH + sprite.width / 2, MID_HEIGHT + sprite.height / 2);
	    instructions.position.set(MID_WIDTH + sprite.width / 2, MID_HEIGHT + 100);

	    let frame_count = 0;

		app.ticker.add(function scale(){
	    	arrows.scale.x += Math.sin(frame_count * Math.PI / 180) / 2048;
	    	arrows.scale.y += Math.sin(frame_count * Math.PI / 180) / 2048;
	    	if(frame_count >= 360)
	    		frame_count -= 360;
	    	frame_count++;

	    	if(sprite.position.x != MID_WIDTH || sprite.position.y != MID_HEIGHT){
	    		setTimeout(function() {app.ticker.add(function fade(){
	    			arrows.alpha -= arrows.alpha / 32;
	    			instructions.alpha -= instructions.alpha / 1024;
	    			if(instructions.alpha < 1e-4){
	    				app.ticker.remove(fade);
	    				app.ticker.remove(scale);
	    				bullet_container.removeChild(arrows);
	    				bullet_container.removeChild(instructions);
	    			}
	    		});}, 1000); 
	    	}
	    });

	    zone.addChild(pause);
	    bullet_container.addChild(arrows);
	    bullet_container.addChild(instructions);

        generateHealthBar();
        generateScore();

        obstacles.push(sprite);

    }

    zone.interactive = true;
    zone.buttonMode = true;
    zone.cursor = "crosshair";

    app.ticker.add(gameLoop);

}


function create_credits(){

	start.interactive = start.buttonMode = credits.interactive = credits.buttonMode = false;

	let category_style = new PIXI.TextStyle({
	    fontFamily: "Roboto Th",
	    fontSize: 56,
	    fill: WHITE,
	    strokeThickness: 2,
	    stroke: "white",
	    align: "center",
	    lineHeight: 50
	});

	let text_style = new PIXI.TextStyle({
	    fontFamily: "Roboto Th",
	    fontSize: 36,
	    fill: WHITE,
	    align: "center",
	    lineHeight: 50
	});

	let credits_container = new PIXI.Container();
	credits_container.alpha = 1e-5;
	app.stage.addChild(credits_container);

	let background = new PIXI.Graphics();
	background.beginFill(BLACK);
	background.drawRect(0, 0, WIDTH, HEIGHT);
	background.endFill();

	credits_container.addChild(background);

	let credit_roles = new PIXI.Text(
		`team manager
		design director
		lead programmer`, text_style);

	let credit_names = new PIXI.Text(
		`jonathan ma
		jamie tsai
		zeyu chen`, text_style);

	credit_roles.anchor.set(0.5, 0.5);
	credit_roles.position.set(MID_WIDTH - credit_names.width, MID_HEIGHT);

	credit_names.anchor.set(0.5, 0.5);
	credit_names.position.set(MID_WIDTH + credit_names.width, MID_HEIGHT);

	credits_container.addChild(credit_roles);
	credits_container.addChild(credit_names);

	app.ticker.add(function fade_in(){
		credits_container.alpha += (1 - credits_container.alpha) / 8;
		if(1 - credits_container.alpha < 1e-4){
			app.ticker.remove(fade_in);
			setTimeout(function(){
				app.ticker.add(function fade_out(){
					credits_container.alpha -= credits_container.alpha / 8;
					if(credits_container.alpha < 1e-4){
						start.interactive = start.buttonMode = credits.interactive = credits.buttonMode = true;
						app.ticker.remove(fade_out);
						app.stage.removeChild(credits_container);
					}
				});
			}, 2000);
		}
	});


}


// Sets the title screen

let is_title = false; // Prevent duplicate menus

function set_title_screen(message = "play"){

    if(is_title == true)
        return;

    app.ticker.remove(gameLoop);

    is_title = true;
    on_pause = true;

    let main_menu = new PIXI.Container();

    // Add black background

    let background = new PIXI.Graphics();

    background.beginFill(BLACK);
    background.drawRect(0, 0, WIDTH, HEIGHT);
    background.endFill();

    main_menu.addChild(background);

    // Brightness icon

    let brightness_icon = new PIXI.Sprite(PIXI.loader.resources["https://cycnus-studio.github.io/Project/img/brightness.png"].texture);
    brightness_icon.anchor.set(0.5, 0.5);
    brightness_icon.position.set(MID_WIDTH, MID_HEIGHT);
    brightness_icon.scale.set(0.6, 0.6);

    main_menu.addChild(brightness_icon);

    // text

    let title = new PIXI.Text("glow", style);
    title.anchor.set(0.5, 0.5);
    title.position.set(WIDTH - title.width - 20, HEIGHT - title.height - 20);

    let help_button = new PIXI.Text("help", bolded_style);
    help_button.anchor.set(0.5, 0.5);
    help_button.position.set(WIDTH - help_button.width - 20, help_button.height + 20);

    help_button.interactive = true;
    help_button.buttonMode = true;

    help_button.on('mouseover', (event) => {
    	app.ticker.add(function zoom(){
    		help_button.scale.x += (1.15 - help_button.scale.x) / 8;
    		help_button.scale.y += (1.15 - help_button.scale.y) / 8;
    		if(1.15 - help_button.scale.x < 1e-2)
    			app.ticker.remove(zoom);
    	})
    });

    help_button.on('mouseout', (event) => {
    	app.ticker.add(function zoom(){
    		help_button.scale.x += (1 - help_button.scale.x) / 8;
    		help_button.scale.y += (1 - help_button.scale.y) / 8;
    		if(help_button.scale.x - 1 < 1e-2){
    			help_button.scale.set(1, 1);
    			help_button.scale.set(1, 1);
    			app.ticker.remove(zoom);
    		}
    	})
    });

    help_button.on('click', function openHelp(){
    	let help_page = window.open("https://cycnus-studio.github.io/help_page.html", "_blank");
    	help_page.focus;
    });

    credits = new PIXI.Text("about", bolded_style);
    credits.anchor.set(0.5, 0.5);
    credits.position.set(credits.width + 20, HEIGHT - credits.height - 20);

    credits.interactive = true;
    credits.buttonMode = true;

    credits.on('mouseover', (event) => {
    	app.ticker.add(function zoom(){
    		credits.scale.x += (1.15 - credits.scale.x) / 8;
    		credits.scale.y += (1.15 - credits.scale.y) / 8;
    		if(1.15 - credits.scale.x < 1e-2)
    			app.ticker.remove(zoom);
    	})
    });

    credits.on('mouseout', (event) => {
    	app.ticker.add(function zoom(){
    		credits.scale.x += (1 - credits.scale.x) / 8;
    		credits.scale.y += (1 - credits.scale.y) / 8;
    		if(credits.scale.x - 1 < 1e-2){
    			credits.scale.set(1, 1);
    			credits.scale.set(1, 1);
    			app.ticker.remove(zoom);
    		}
    	})
    });

    credits.on('click', create_credits);


    let start_white = new PIXI.Text(message, style);
    start_white.anchor.set(0.5, 0.5);
    start_white.position.set(MID_WIDTH, MID_HEIGHT);

    let start_black = new PIXI.Text(message, style);
    start_black.anchor.set(0.5, 0.5);
    start_black.position.set(MID_WIDTH, MID_HEIGHT);

    start = new PIXI.Container();

    start.addChild(start_black);
    start.addChild(start_white);

    let hover, degrees = 0;

    app.ticker.add(hover = function(){
    	brightness_icon.position.y += Math.sin(degrees * Math.PI / 180) / 10;
    	start.position.y += Math.sin(degrees * Math.PI / 180) / 10;
    	degrees++;
    	if(degrees > 360)
    		degrees -= 360;
    	if(degrees % 90 == 0)
    		start_white.tint = brightness_icon.tint = COLOURS[rand_range(0, 7)];
    })

    // text mask

    let mask = new PIXI.Graphics();
    mask.beginFill(BLACK);
    mask.drawRect(0, 0, MID_WIDTH, HEIGHT);
    mask.endFill();

    let filter = new PIXI.filters.ColorMatrixFilter();
    start_black.filters = [filter];

    start_white.mask = mask;

    filter.negative();

    main_menu.alpha = 1e-5;

    app.ticker.add(function fade_in(delta) {

        main_menu.alpha += (1 - main_menu.alpha) / 8;

        if(1 - main_menu.alpha < 1e-2){
            app.ticker.remove(fade_in);
        }

    });

    start.interactive = true; 
    start.buttonMode = true;

    start.on('click', (event) => {

		zone.visible = true;
		zone.alpha = 1;
		main_menu.alpha = 1;

		if(new_game == true){
            music = new PlaylistManager();
            hit_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/hit%20sound.mp3", 0.05);
            shoot_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/fire%20sound.mp3", 0.1);
			death_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/death%20sound.mp3", 1);
		}

		music.play();

        start_game();

		app.ticker.add(function fade_out(delta) {

            main_menu.alpha -= main_menu.alpha / 4;

            if(main_menu.alpha < 1e-5){

            	app.ticker.remove(hover);

            	zone.alpha = 1;

                app.ticker.remove(fade_out);
                app.stage.removeChild(main_menu);
                main_menu.visible = false;
                is_title = false;

            }

        });

	});

	start.on('mouseover', (event) => {
    	app.ticker.add(function zoom(){
    		start_black.scale.x += (1.15 - start_black.scale.x) / 8;
    		start_black.scale.y += (1.15 - start_black.scale.y) / 8;
    		start_white.scale.x += (1.15 - start_white.scale.x) / 8;
    		start_white.scale.y += (1.15 - start_white.scale.y) / 8;
    		if(1.15 - start_black.scale.x < 1e-2)
    			app.ticker.remove(zoom);
    	})
    });

    start.on('mouseout', (event) => {
    	app.ticker.add(function zoom(){
    		start_black.scale.x += (1 - start_black.scale.x) / 8;
    		start_black.scale.y += (1 - start_black.scale.y) / 8;
    		start_white.scale.x += (1 - start_white.scale.x) / 8;
    		start_white.scale.y += (1 - start_white.scale.y) / 8;
    		if(start_black.scale.x - 1 < 1e-2){
    			start_black.scale.set(1, 1);
    			start_white.scale.set(1, 1);
    			app.ticker.remove(zoom);
    		}
    	})
    });

    main_menu.addChild(start);
    main_menu.addChild(mask);
    main_menu.addChild(title);
    main_menu.addChild(credits);
    main_menu.addChild(help_button);

    app.stage.addChild(main_menu);

}

function initialize(){

	sprite.position.x = MID_WIDTH;
    sprite.position.y = MID_HEIGHT; // set x and y

    sprite.vx = 0;
    sprite.vy = 0;

    sprite.hp = MAX_HEALTH;
    sprite.shots = MAX_SHOTS;
    sprite.scale.set(1, 1);

    freeze_duration = 0;
    slowing_factor = 1;

    if(enemies.length != 0)
    	round_title.text = "Round 1";

    for(let enemy of enemies)
    	zone.removeChild(enemy);
    for(let obstacle of obstacles)
    	zone.removeChild(obstacle);
    for(let bullet of bullets)
    	bullet_container.removeChild(bullet);
    for(let mine of mines)
    	mine_container.removeChild(mine);

    zone.addChild(sprite)
  	zone.removeChild(point_title)
    zone.removeChild(boss_bar)
    zone.removeChild(boss_health)
    zone.removeChild(health_bar)
    zone.removeChild(active_health);
    zone.removeChild(pause);

    enemies = [];
    obstacles = [];
    bullets = [];
    mines = [];
    user_score = 0;
    enemies_left = 0;
    wave_id = 0;

    is_loaded = false;
    is_ready_to_load = true;
    blue_colour_bg = false;

}

function set_game_over(){

	app.ticker.remove(gameLoop);
    death_sound.play();

    zone.interactive = false;
    zone.buttonMode = false;

    new_game = true;
    set_title_screen("restart");

}




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

function generateScore(){

	point_title = new PIXI.Text("0", round_style);
    point_title.position.set(600 - point_title.width, HEIGHT - point_title.height - 20);
	zone.addChild(point_title);

	point_title.update = function(){
		point_title.text = `${user_score}`;
	}

}

function generateHealthBar(){

    // Outline

    health_bar = new PIXI.Graphics();
    health_bar.beginFill(BLACK);
    health_bar.lineStyle(1, WHITE);
    health_bar.drawRect(0, 0, HEALTH_WIDTH, HEALTH_HEIGHT);
    health_bar.endFill();
    health_bar.position.set(WIDTH + HEALTH_WIDTH + 20, HEIGHT - HEALTH_HEIGHT - 20);

    // Active health portion

    active_health = new PIXI.Graphics();
    active_health.lineStyle(1, WHITE);
    active_health.drawRect(0, 0, 1, HEALTH_HEIGHT);

    active_health.position.set(WIDTH + HEALTH_WIDTH * 2 + 20, HEIGHT - HEALTH_HEIGHT - 20);

    let target = WIDTH - HEALTH_WIDTH - 20;

    app.ticker.add(function move_in(delta){

        let distance = Math.abs(health_bar.position.x - target) / 4;
        
        health_bar.position.x -= distance;
        active_health.position.x -= distance;

        if(health_bar.position.x - target < 3){

            app.ticker.remove(move_in);

            health_update();

        }

    });

    let pause_target = WIDTH - pause.width / 2 - 30;

    app.ticker.add(function move_in_pause(delta){
        
        pause.position.x -= Math.abs(pause.position.x - pause_target) / 8;

        if(pause.position.x - pause_target < 3){
            app.ticker.remove(move_in_pause);
        }

    });

    zone.addChild(health_bar);
    zone.addChild(active_health);

}

function generateBossBar(){

    // Outline

    boss_bar = new PIXI.Graphics();
    boss_bar.beginFill(BLACK);
    boss_bar.lineStyle(1, WHITE);
    boss_bar.drawRect(0, 0, HEALTH_WIDTH, HEALTH_HEIGHT);
    boss_bar.endFill();
    boss_bar.position.set(-HEALTH_WIDTH - 20, 20);

    // Active health portion

    boss_health = new PIXI.Graphics();
    boss_health.lineStyle(1, WHITE);
    boss_health.drawRect(0, 0, 1, HEALTH_HEIGHT);

    boss_health.position.set(-HEALTH_WIDTH - 20, 20);

    let target = 20;

    app.ticker.add(function move_in(delta){

        let distance = Math.abs(boss_bar.position.x - target) / 4;
        
        boss_bar.position.x += distance;
        boss_health.position.x += distance;

        if(target - boss_bar.position.x < 3){

            app.ticker.remove(move_in);

            updateBossBar();

        }

    });

    zone.addChild(boss_bar);
    zone.addChild(boss_health);

}

function win(){
    sprite.hp++;
    health_update();
}

function setWave(n){
	wave_id = n;
}

let move_health_func, still_running = false;

function health_update(){

    if(still_running == true)
        app.ticker.remove(move_health_func);

    still_running = true;

    let start        = active_health.width;
    let target_width = (400 / MAX_HEALTH) * sprite.hp;

    app.ticker.add(move_health_func = function move_health(delta){
		
        active_health.width += (target_width - active_health.width) / 4;
		active_health.position.x += (health_bar.position.x + health_bar.width - active_health.width) - active_health.getBounds().x;
        
        if(Math.abs(target_width - active_health.width) < 0.001){
            app.ticker.remove(move_health);
            still_running = false;
        }

    });

}

let move_boss_health_func, boss_still_running = false;

function updateBossBar(){

    if(boss_still_running == true)
        app.ticker.remove(move_boss_health_func);

    boss_still_running = true;

    let start        = boss_health.width;
    let target_width = (400 / boss.max_hp) * boss.hp;

    app.ticker.add(move_boss_health_func = function move_boss_health(delta){
		
        boss_health.width += (target_width - boss_health.width) / 4;
		boss_health.position.x += boss_bar.position.x - boss_health.getBounds().x;
        
        if(Math.abs(target_width - boss_health.width) < 0.001){
            app.ticker.remove(move_boss_health);
            boss_still_running = false;
        }

    });
	
}

function boss_bar_out(){

	let target = -HEALTH_WIDTH - 20;

    app.ticker.add(function move_out(delta){

        let distance = Math.abs(boss_bar.position.x - target) / 8;
        
        boss_bar.position.x -= distance;
        boss_health.position.x -= distance;

        if(Math.abs(target - boss_bar.position.x) < 3){

            app.ticker.remove(move_out);
            zone.removeChild(boss_bar);
            zone.removeChild(boss_health);

        }

    });
}


function generateTitle(number){

    round_title.text = `Round ${wave_id}`;

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

    let enemy_count = 0;
    let highest = 0;
    enemies_left = 0;

    if(wave_id % 5 == 4){

		generateBossBar();

		for(let sides = 0; sides < ENEMY_TYPES.length - 1; ++sides){
			if(wave_id > STARTING_ROUNDS[sides])
				highest = Math.max(STARTING_ROUNDS[sides], highest);
		}

		enemies[0] = boss = generateBoss(ENEMY_TYPES[rand_range(highest == 0 ? 1 : 0, Math.min(3, Math.floor(highest / 10)))], rand_range(6, 6 + Math.floor(wave_id / 10)), obstacles);

		boss.spriteID = enemy_count++;

		zone.addChild(boss);
		obstacles.push(boss);
			
		enemies_left++;
		
	}

    // Max of 2 of the same unit 

    for(let sides = 0; sides < ENEMY_TYPES.length - 1; ++sides){

    	if(wave_id > STARTING_ROUNDS[sides]){

    		for(let units = 0; units < Math.min(2, Math.ceil((wave_id - STARTING_ROUNDS[sides]) / (sides + 1))); units++){
    			let enemy = generateEnemy(ENEMY_TYPES[sides], Math.min(12, rand_range(6, 6 + Math.floor((wave_id - 5) / 8))), obstacles);
    			enemy.spriteID = enemy_count++;

    			if(wave_id == 1){
    				setTimeout(function add(){
    					zone.addChild(enemy);
				        obstacles.push(enemy);
				        enemies.push(enemy);
    				}, 2000);
    			} else {
			        zone.addChild(enemy);
			        obstacles.push(enemy);
			        enemies.push(enemy);
			    }
		        
		        enemies_left++;
    		}

    	}

    }

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

function shoot(id, src_x, src_y, tgt_x, tgt_y, is_player = false, ignore_constraints = false){

	if(is_player == true && (tgt_x < PADDING || tgt_x > WIDTH - PADDING || tgt_y < PADDING || tgt_y > HEIGHT - PADDING || sprite.scale.x < 1))
    	return;

    if(is_player == true){
        if(sprite.shots <= 0)
            return;
        sprite.shots--;
    } else if(ignore_constraints == false){
        if(enemies[id].shots <= 0)
            return;
        if(enemies[id].previousShot-- > 0){
            return;
        }
        console.log(id, enemies[id].shots);
        enemies[id].shots--;
        enemies[id].previousShot = 5;
    }

    if(is_player == true)
    	shoot_sound.play();

    let unit_size = is_player ? SPRITE_SIZE : enemies[id].height;

    let bullet = new PIXI.Graphics();
    bullet.beginFill(is_player ? sprite.colour : enemies[id].colour); // Set colour here
    bullet.drawCircle(0, 0, 3);
    bullet.endFill();

    let mx = tgt_x - src_x - unit_size;
    let my = tgt_y - src_y - unit_size;

    bullet.x = src_x + unit_size;
    bullet.y = src_y + unit_size;
    
    let angle = Math.atan2(my, mx);
    
    bullet.vx = Math.cos(angle);
    bullet.vy = Math.sin(angle);

    bullet.max_veloc = is_player ? BULLET_SPEED : enemies[id].bullet_speed;

    bullet.anchor = {x: 1, y: 1};
    bullet.isBullet = true;
    bullet.isBossSpreadBullet = ignore_constraints;

    bullet.isPlayerShot = is_player;
    bullet.spriteID = enemies[id].spriteID;

    bullets.push(bullet);

    bullet_container.addChild(bullet);

}

function explode(x, y, radius, colour = 0xBC1E1E){

	let enemy_explosion_circle = new PIXI.Graphics();

	enemy_explosion_circle.beginFill(colour); // Set colour here

	enemy_explosion_circle.drawCircle(x, y, radius);
	enemy_explosion_circle.endFill();

	zone.addChild(enemy_explosion_circle);

	app.ticker.add(function boom(delta) {

		enemy_explosion_circle.alpha -= delta * 0.04;

		if(enemy_explosion_circle.alpha <= 0){
			app.ticker.remove(boom);
			enemy_explosion_circle.alpha.visible = false;
			zone.removeChild(enemy_explosion_circle);
		}

	});

}







// Actual loop

let is_loaded = false;
let is_ready_to_load = true;

function gameLoop(delta){

    music.update();

    if(enemies_left == 0 && is_loaded == false && is_title == false){
        is_loaded = true;
        if(wave_id > 0 && is_ready_to_load == false)
            move_out();
        generateWave();
    }

    // Update particles

    let new_particles = [];
    for(let particle of particles){
        particle.update();
        if(particle.alpha > 1e-4){
            new_particles.push(particle);
        } else {
            if(particle._particle.is_background == false)
                particle_container.removeChild(particle._particle);
            else
                background_particle_container.removeChild(particle._particle);
        }
    }
    particles = new_particles.slice(0);

    // Update colour to obstacles

    if(music.is_on_beat(0, 15, false) == true){

	    for(let obstacle_ID = 0; obstacle_ID < 6; obstacle_ID++){
	        if(obstacles[obstacle_ID].isObstacle !== true)
	            break;
	        obstacles[obstacle_ID].graphics.tint = blue_colour_bg ? BLUE_COLOURS[rand_range(0, 6)] : COLOURS[rand_range(0, 5)];
	    }

	}

	// Update current game state
    state(delta);

}

// Actual movement

function play(delta){

    // Powerups

    if(freeze_duration-- > 0){

        blue_colour_bg = true;
    	slowing_factor /= 1.05;

    } else if(freeze_duration <= 0 && slowing_factor < 1){

    	slowing_factor *= 1.05;
    	freeze_duration = 0;

    } else {

        blue_colour_bg = false;
    	slowing_factor = 1;
    }

    for(let ID = 0; ID < mines.length; ++ID){

    	if(mines[ID].detonated == true)
    		continue;

    	if(mines[ID].scale.x != 1){
    		
    		mines[ID].scale.x += (1 - mines[ID].scale.x) / 8;
    		mines[ID].scale.y += (1 - mines[ID].scale.y) / 8;

    		if(1 - mines[ID].scale.x < 1e-2){
    			mines[ID].scale.set(1, 1);
    		}

    		continue;
    	}


    	for(let enemy_ID = 0; enemy_ID < enemies.length; ++enemy_ID){
    		
    		if(enemies[enemy_ID].dead === true)
    			continue;

    		if(in_polygon(mines[ID], enemies[enemy_ID]) == true){

    			mines[ID].detonated = true;
    			mines_left--;

    			explode(mines[ID].position.x, mines[ID].position.y, mines[ID].blast_radius, sprite.colour);

    			// Find all enemies in blast radius

    			for(;enemy_ID < enemies.length; ++enemy_ID){

    				if(enemies[enemy_ID].dead === true)
    					continue;

    				if(in_radius(mines[ID].position.x, mines[ID].position.y, mines[ID].blast_radius, enemies[enemy_ID])){
						
						enemies[enemy_ID].lose_hp(enemies[enemy_ID].hp);

    				}

    			}

    			app.ticker.add(function pop(delta){
					mines[ID].scale.x /= 1.2;
					mines[ID].scale.y /= 1.2;

					if(mines[ID].scale.x < 0.01){
						mines[ID].visible = false;

						mine_container.removeChild(mines[ID]);
						app.ticker.remove(pop);
					}

				});

    			break;

    		}
    	
    	}

    }

    sprite = move(sprite, delta, obstacles)[0];

    // Draw bullets

    // Need a good datastructure for:

    // Quick removal of objects

    // Indexing an item

    let is_hit;
    let valid_bullets = [];

    for(let ID = 0; ID < bullets.length; ID++){

        let [new_bullet, is_hit] = move(bullets[ID], bullets[ID].max_veloc, obstacles);

        let hit_player = in_polygon(new_bullet, sprite);
		
        if(is_hit === false && hit_player == false){
			valid_bullets.push(new_bullet);
        } else {

        	explode(bullets[ID].position.x, bullets[ID].position.y, rand_range(5, 20), bullets[ID].isPlayerShot ? sprite.colour : enemies[Math.min(enemies.length - 1, bullets[ID].spriteID)].colour);

            if(hit_player == true){

                sprite.lose_hp();

            } else if(is_hit !== true && obstacles[is_hit].isObstacle !== true && obstacles[is_hit].scale.x == 1){
				
				obstacles[is_hit].lose_hp(1);

            }

            bullets[ID].visible = false;
			zone.removeChild(bullets[ID]);

            if(bullets[ID].isPlayerShot == true){
                sprite.shots++;
            } else if(bullets[ID].isBossSpreadBullet == false){
				if(bullets[ID].spriteID >= enemies.length)
					continue;
                if(enemies[bullets[ID].spriteID].dead)
                    continue;
				enemies[bullets[ID].spriteID].shots = Math.min(3, enemies[bullets[ID].spriteID].shots + 1);
            }
			
        }

    }

    bullets = valid_bullets.slice(0);

    let interval = 1;

    for(let ID = 0; ID < enemies.length; ID++){

    	if(enemies[ID].scale.x != 1 && enemies[ID].dead != true){
    		enemies[ID].scale.x += (1 - enemies[ID].scale.x) / enemies[ID].generation_rate;
    		enemies[ID].scale.y += (1 - enemies[ID].scale.y) / enemies[ID].generation_rate;

    		if(1 - enemies[ID].scale.x < 0.01)
    			enemies[ID].scale.set(1, 1);

    	} else {
	        enemies[ID] = getPath(sprite, enemies[ID]);
	        enemies[ID] = move(enemies[ID], delta, obstacles)[0];

	        if(enemies[ID].dead != true && music.is_on_beat(Math.min(ID * 2)) && slowing_factor > 1e-4){
	            
	        	if(isVisible(enemies[ID], sprite) == true){
		            shoot(ID,
		                enemies[ID].position.x - enemies[ID].width * (1 - enemies[ID].anchor.x),
		                enemies[ID].position.y - enemies[ID].height * (1 - enemies[ID].anchor.y),
		                sprite.position.x + sprite.width * (1 - sprite.anchor.x),
		                sprite.position.y + sprite.height * (1 - sprite.anchor.y));
		        }

		        if(enemies[ID].isBoss === true && enemies[ID].previousSpread-- <= 0){

		        	enemies[ID].previousSpread = 15;

				 	let offset = enemies[ID].offset;
				 	let sides  = enemies[ID].hitArea.points.length / 2;

				 	for(let side = 0; side < sides; side++){

				 		shoot(ID,
			                enemies[ID].position.x - enemies[ID].width * (1 - enemies[ID].anchor.x),
			                enemies[ID].position.y - enemies[ID].height * (1 - enemies[ID].anchor.y),
			                enemies[ID].position.x + BOSS_SIZE * Math.cos(2 * Math.PI * side / sides + offset),
			                enemies[ID].position.y + BOSS_SIZE * Math.sin(2 * Math.PI * side / sides + offset),
			                false, true
			            );

				 	}

		        }

	        }

	        let radius = enemies[ID].isBoss ? 60 : 30;

	        if(enemies[ID].dead != true && enemies[ID].is_explode == true && in_radius(enemies[ID].position.x, enemies[ID].position.y, radius, sprite)){

	        	enemies[ID].lose_hp(enemies[ID].hp, radius);

			}

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
app.renderer.backgroundColor = BLACK;


// Start splash screen

set_splash_screen();


/*
 *    Load important files (Audio, Pictures, etc)
 */

PIXI.loader
    .add([
        "https://cycnus-studio.github.io/Project/img/brightness.png",
        "https://cycnus-studio.github.io/Project/img/freezeButton.png",
        "https://cycnus-studio.github.io/Project/img/freezeButtonDown.png",
        "https://cycnus-studio.github.io/Project/img/freezeButtonOver.png",
        "https://cycnus-studio.github.io/Project/img/freezeButtonDisabled.png",
        "https://cycnus-studio.github.io/Project/img/mineButton.png",
        "https://cycnus-studio.github.io/Project/img/mineButtonDown.png",
        "https://cycnus-studio.github.io/Project/img/mineButtonOver.png",
        "https://cycnus-studio.github.io/Project/img/mineButtonDisabled.png",
        "https://cycnus-studio.github.io/Project/img/laserButton.png",
        "https://cycnus-studio.github.io/Project/img/laserButtonDown.png",
        "https://cycnus-studio.github.io/Project/img/laserButtonOver.png",
        "https://cycnus-studio.github.io/Project/img/laserButtonDisabled.png",
        "https://cycnus-studio.github.io/Project/img/pauseButton.png",
        "https://cycnus-studio.github.io/Project/img/directions.png"
    ])
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
