/*
 *  The main processing part of the game (Visuals, Game Mechanics, Menu, Pause, etc)
 *
 *  Author: Cycnus Studio
 *
 *  Date: May 12th, 2019  
 *
 */


// Set all containers, this is the different scenes of the game along with how sprites are layered

/*

    splash           => Splash screen
    main_menu        => Main menu
    zone             => Playing zone
    bullet_container => Container for all bullets
    mine_container   => Container for all mines

*/

let splash, main_menu, zone, bullet_container, mine_container;

/* 
    
    PIXI.js has an interesting approach to loading sprites:

        app.stage is the main scene, you add and remove containers/sprites from it as you please. This is where everything is displayed.

    For different scenes, we'll need to add all sprites related to a scene into a container
        
        To display, simply do:

            container.addChild(scene_name);
        
        To hide it, simply do:

            container.removeChild(scene_name);

*/

// Set all sprites used for the game

/*

    sprite           => User player
    start            => Game button in the menu
    round_title      => Game text in the game used to display round ID
    health_bar       => User health bar (The outline)
    active_health    => User's active health portion
    pause            => Pause button
    boss_bar         => Boss health bar (The outline)
    boss_health      => Boss' active health portion
    boss             => Boss sprite
    point_title      => Game text for user score
    credits          => Credit text

*/


let sprite, start, round_title, health_bar, active_health, pause, boss_bar, boss_health, boss, point_title, credits;

// Counter of number of enemies left

let enemies_left = 0;

// Counter of player's score

let user_score   = 0;

// Keeps track of game state

let new_game         = true;  // Haven't started a game yet
let is_title_screen  = false; // Prevent duplicate menus
let is_loaded        = false; // Is round title done loading
let is_ready_to_load = true;  // Is round title ready to be loaded

// Audio tracks are loaded now. See music.js for more info

let music = new PlaylistManager();
let shoot_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/fire%20sound.mp3", 0.1);
let death_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/death%20sound.mp3", 1);
let hit_sound   = new SFXManager("https://cycnus-studio.github.io/Project/audio/hit%20sound.mp3", 0.05);

// Particles are loaded now. See particles.js for more info

let particle_manager = new ParticleManager();

// Style all text in game with these.

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
    strokeThickness: 2, // Slightly thicker
    stroke: "white",
    align: "center",
});

let round_style = new PIXI.TextStyle({
    fontFamily: "Roboto Th",
    fontSize: 36, // Smaller
    fill: WHITE,
    strokeThickness: 0,
    align: "center",
});

let instructions_style = new PIXI.TextStyle({
    fontFamily: "Roboto Th",
    fontSize: 20, // Much smaller
    fill: WHITE,
    strokeThickness: 0,
    align: "center",
});


/*********************** SCENE HANDLER FUNCTIONS ***************************/

function set_splash_screen(){

    /*
            
        Sets the splash screen and many game sprites.

        [Input]
            None

        [Output]
            None

    */

    // Set splash container

    splash = new PIXI.Container();
    app.stage.addChild(splash);

    // Create company name

    let title = new PIXI.Text("cycnus", {
        fontFamily: "Modern Sans",
        fontSize: 36,
        fill: WHITE,
    });

    splash.addChild(title);

    // Place it in the center

    title.anchor.set(0.5, 0.5);
    title.position.set(MID_WIDTH, MID_HEIGHT);
    title.alpha = 0;

    app.ticker.add(function fade_in(){

        /*
            
            Fades-in the title.

            [Input]
                None

            [Output]
                None

        */

        title.alpha += (1 - title.alpha) / 8;

        // Checks whether it has fully done the fading-in

        if(1 - title.alpha < 1e-2)
            app.ticker.remove(fade_in);

    });

    // Set the playing area

    zone = new PIXI.Container();
    zone.alpha = 0; // Make the container invisible for now.

    // Set event handler for user clicks (For shooting)

    zone.on('mousedown', (event) => {

        /*
            
            Handles a mouseclick in zone for shooting.

            [Input]
                event => The information related to the click.

            [Output]
                None

        */

        if(sprite.shots == 0) // Ignore if player has no more bullets
            return;

        // Grabs position of cursor in the game.

        event = event.data.getLocalPosition(app.stage);

        // Shoots a bullet

        shoot(0, sprite.position.x, sprite.position.y, event.x, event.y, true);

    });

    // Draw the playing zone.

    let area = new PIXI.Graphics();
    area.lineStyle(1, WHITE, 1);
    area.beginFill(BLACK);
    area.drawRect(0, 0, WIDTH - PADDING * 2, HEIGHT - PADDING * 2); // Leave some padding around
    area.endFill();
    area.position.set(PADDING, PADDING);

    // Create the player

    sprite = new PIXI.Graphics();

    // Assign a random colour to the player

    sprite.colour = COLOURS[rand_range(0, 5)];

    // Draws the player

    sprite.lineStyle(1, sprite.colour, 1);
    sprite.beginFill(sprite.colour); // Set colour here
    sprite.drawRect(0, 0, SPRITE_SIZE * 2, SPRITE_SIZE * 2);
    sprite.endFill();

    // Set position, key point, velocities, and many other improtant game attributes.

    sprite.anchor = {x: 0.5, y: 0.5};
    
    sprite.position.x = MID_WIDTH;
    sprite.position.y = MID_HEIGHT; // set x and y

    sprite.vx = 0;
    sprite.vy = 0;

    sprite.hp = PLAYER_HEALTH;
    sprite.shots = PLAYER_SHOTS;

    sprite.spriteID = -1;   // Sprite identification 
    sprite.isPlayer = true; // Is it a movable character?
    sprite.isUser = true;   // Is it the player?

    // Set hitbox of player

    sprite.hitArea = new PIXI.Polygon([0, 0, SPRITE_SIZE * 2, 0, SPRITE_SIZE * 2, SPRITE_SIZE * 2, 0, SPRITE_SIZE * 2]);
    
    // Make particles around player

    particle_manager.follow_particles(sprite);

    sprite.lose_hp = function(){

        /*
            
            Makes the player lose an hp.

            [Input]
                None

            [Output]
                None

        */

        // Play sound effect

        hit_sound.play();

        sprite.hp--;

        // Check if player is dead
        
        if(sprite.hp == 0){

            // Stop the music

            music.pause();
            
            // Make everything slow down to indicate game end

            freeze_duration = 500;
            
            app.ticker.add(function shrink(){

                /*
            
                    Shrinks the player out of existence.

                    [Input]
                        None

                    [Output]
                        None

                */

                // Scale down in a non-linear manner

                sprite.scale.x -= sprite.scale.x / 8;
                sprite.scale.y -= sprite.scale.y / 8;

                if(sprite.scale.x < 1e-5){

                    // If sprite is small enough we can remove it.
                
                    app.ticker.remove(shrink);

                    // Set game over screen after a small bit of time.

                    setTimeout(set_game_over, 500);
                
                }

            });

        }

        // Update health bar

        health_update();
    
    }


    // Create the round title

    round_title = new PIXI.Text("", round_style);

    round_title.position.set(30, HEIGHT - PADDING * 0.5);

    // Add all relevant sprites to zone

    zone.addChild(background_particle_container);
    zone.addChild(area);
    zone.addChild(round_title);
    zone.addChild(particle_container);

    // Create bullets container

    bullet_container = new PIXI.Container();
    zone.addChild(bullet_container);

    // Create mine container

    mine_container = new PIXI.Container();
    bullet_container.addChild(mine_container);

    // User sprite should be on top of all of the other sprites

    zone.addChild(sprite);

    app.stage.addChild(zone);

}

function create_credits(){

    /*
            
        Sets the credit screen for the game.

        [Input]
            None

        [Output]
            None

    */

    // Pause the interactivity

    start.interactive = start.buttonMode = credits.interactive = credits.buttonMode = false;

    // Set text style

    let text_style = new PIXI.TextStyle({
        fontFamily: "Roboto Th",
        fontSize: 36,
        fill: WHITE,
        align: "center",
        lineHeight: 50
    });

    // Set credits container

    let credits_container = new PIXI.Container();
    credits_container.alpha = 1e-5;
    app.stage.addChild(credits_container);

    // Set background as all black

    let background = new PIXI.Graphics();
    background.beginFill(BLACK);
    background.drawRect(0, 0, WIDTH, HEIGHT);
    background.endFill();

    credits_container.addChild(background);

    // Create text

    let credit_roles = new PIXI.Text(" team manager \n design director \n lead programmer ", text_style);

    let credit_names = new PIXI.Text(
        " jonathan ma \n jamie tsai \n zeyu chen ", text_style);

    // Position the text

    credit_roles.anchor.set(0.5, 0.5);
    credit_roles.position.set(MID_WIDTH - credit_names.width, MID_HEIGHT);

    credit_names.anchor.set(0.5, 0.5);
    credit_names.position.set(MID_WIDTH + credit_names.width, MID_HEIGHT);

    // Add to container

    credits_container.addChild(credit_roles);
    credits_container.addChild(credit_names);

    // Make credits fade in

    app.ticker.add(function fade_in(){

        // Update opacity in a non-linear way

        credits_container.alpha += (1 - credits_container.alpha) / 8;
        
        if(1 - credits_container.alpha < 1e-4){

            // Container's opacity is very close to 100%

            app.ticker.remove(fade_in);

            // Make credits fade out after 2 seconds
            
            setTimeout(function(){

                app.ticker.add(function fade_out(){

                    // Decrease opacity

                    credits_container.alpha -= credits_container.alpha / 8;
                    
                    if(credits_container.alpha < 1e-4){

                        // Opacity is very close to 0 again

                        // Make buttons in main menu interactive again

                        start.interactive = start.buttonMode = credits.interactive = credits.buttonMode = true;
                        
                        app.ticker.remove(fade_out);
                        app.stage.removeChild(credits_container);
                    
                    }

                });

            }, 2000);

        }

    });

}

function set_title_screen(message = "play"){

    /*
            
        Sets a titled screen.

        [Input]
            message => A string representing the text in the middle of the screen.

        [Output]
            None

    */


    // Prevent setting multiple title screens

    if(is_title_screen == true)
        return;

    // Pause everything in the game

    app.ticker.remove(gameLoop);
    is_title_screen = on_pause = true;

    // Create menu container

    let main_menu = new PIXI.Container();

    // Add a black background

    let background = new PIXI.Graphics();

    background.beginFill(BLACK);
    background.drawRect(0, 0, WIDTH, HEIGHT);
    background.endFill();

    main_menu.addChild(background);

    // Load the brightness icon

    let brightness_icon = new PIXI.Sprite(PIXI.loader.resources["https://cycnus-studio.github.io/Project/img/brightness.png"].texture);
    
    // Position the icon

    brightness_icon.anchor.set(0.5, 0.5);
    brightness_icon.position.set(MID_WIDTH, MID_HEIGHT);
    brightness_icon.scale.set(0.6, 0.6);

    main_menu.addChild(brightness_icon);

    // Load all text items and buttons

    // Create title of the game + position it

    let title = new PIXI.Text("glow", style);
    title.anchor.set(0.5, 0.5);
    title.position.set(WIDTH - title.width - 20, HEIGHT - title.height - 20);

    // Create help button

    let help_button = new PIXI.Text("help", bolded_style);
    help_button.anchor.set(0.5, 0.5);
    help_button.position.set(WIDTH - help_button.width - 20, help_button.height + 20);

    help_button.interactive = help_button.buttonMode = true;

    // Add event handler for the hover

    help_button.on('mouseover', (event) => {

        // Scale out the text a bit 

        app.ticker.add(function scale(){

            // Increase to 1.15 times scale

            help_button.scale.x += (1.15 - help_button.scale.x) / 8;
            help_button.scale.y += (1.15 - help_button.scale.y) / 8;

            if(1.15 - help_button.scale.x < 1e-2) // Check if it reached 1.15 scale target
                app.ticker.remove(scale);

        });

    });

    // Add event handler for the mouseout hover

    help_button.on('mouseout', (event) => {

        // Scale the text back down to 1

        app.ticker.add(function scale(){

            // Decrease to a scale of 1

            help_button.scale.x += (1 - help_button.scale.x) / 8;
            help_button.scale.y += (1 - help_button.scale.y) / 8;

            if(help_button.scale.x - 1 < 1e-2) // Check if it reached the scale target of 1
                app.ticker.remove(scale);

        });

    });

    // Add event handler for the click

    help_button.on('click', function open_help(){

        // Loads the help page, saving the web page as a variable then focusing it is a nice trick

        let help_page = window.open("https://cycnus-studio.github.io/help_page.html", "_blank");

        help_page.focus; // https://developer.mozilla.org/en-US/docs/Web/API/Window/focus

    });

    // Create credits button

    credits = new PIXI.Text("about", bolded_style);
    credits.anchor.set(0.5, 0.5);
    credits.position.set(credits.width + 20, HEIGHT - credits.height - 20);

    credits.interactive = credits.buttonMode = true;

    // Add event handler for the hover

    credits.on('mouseover', (event) => {

        // Scale out the text a bit 

        app.ticker.add(function scale(){

            // Increase to 1.15 times scale

            credits.scale.x += (1.15 - credits.scale.x) / 8;
            credits.scale.y += (1.15 - credits.scale.y) / 8;

            if(1.15 - credits.scale.x < 1e-2) // Check if it reached 1.15 scale target
                app.ticker.remove(scale);

        });

    });

    // Add event handler for the mouseout hover

    credits.on('mouseout', (event) => {

        // Scale the text back down to 1

        app.ticker.add(function scale(){

            // Decrease to a scale of 1

            credits.scale.x += (1 - credits.scale.x) / 8;
            credits.scale.y += (1 - credits.scale.y) / 8;

            if(credits.scale.x - 1 < 1e-2) // Check if it reached the scale target of 1
                app.ticker.remove(scale);
            
        })
    });

    // Add event handler for the click

    credits.on('click', create_credits);

    // Create the center text

    /*
        We're aiming for the invert one half look, but that was quite tricky to get:
        
        - Create 2 identical texts.

        - Mask one side for one of the texts, essentially cutting it in half

        - Put the masked one over the other, creating the inverted effect.

    */

    // First half of the text

    let start_white = new PIXI.Text(message, style);
    start_white.anchor.set(0.5, 0.5);
    start_white.position.set(MID_WIDTH, MID_HEIGHT);

    // Second half of the text

    let start_black = new PIXI.Text(message, style);
    start_black.anchor.set(0.5, 0.5);
    start_black.position.set(MID_WIDTH, MID_HEIGHT);

    // Group these two halves with a container

    start = new PIXI.Container();

    start.addChild(start_black);
    start.addChild(start_white);

    start.interactive = start.buttonMode = true;

    // Add a hovering effect to the icon and text

    let hover, degrees = 0;

    app.ticker.add(hover = function(){

        // Abusing the sin function again, this time to make it move up then down.

        brightness_icon.position.y += Math.sin(degrees * Math.PI / 180) / 10;
        start.position.y += Math.sin(degrees * Math.PI / 180) / 10;

        degrees = ++degrees % 360;

        if(degrees % 90 == 0) // Change colour of the icon every 90 frames
            start_white.tint = brightness_icon.tint = COLOURS[rand_range(0, 7)];

    });

    // Creating the text mask

    let mask = new PIXI.Graphics();
    mask.beginFill(BLACK);
    mask.drawRect(0, 0, MID_WIDTH, HEIGHT); // Fill the left side only
    mask.endFill();

    // Mask the left side

    let filter = new PIXI.filters.ColorMatrixFilter();
    start_black.filters = [filter];
    start_white.mask = mask;
    filter.negative();

    // Set main menu opacity, and add a fade-in effect

    main_menu.alpha = 1e-5;

    app.ticker.add(function fade_in() {

        // Fade in effect

        main_menu.alpha += (1 - main_menu.alpha) / 8;

        if(1 - main_menu.alpha < 1e-2) // Stop fading if opacity is very close to 1
            app.ticker.remove(fade_in);

    });

    // Add event handler for the click on play

    start.on('click', (event) => {

        // Make zone visible

        zone.visible = true;
        zone.alpha = 1;

        // Load all sound effects (Chrome won't let you load automatically and it gives some weird issues)

        if(new_game == true){
            music = new PlaylistManager();
            hit_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/hit%20sound.mp3", 0.05);
            shoot_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/fire%20sound.mp3", 0.1);
            death_sound = new SFXManager("https://cycnus-studio.github.io/Project/audio/death%20sound.mp3", 1);
        }

        music.play();

        // Start the game

        start_game();

        // Make menu fade out

        app.ticker.add(function fade_out() {

            // Change opacity

            main_menu.alpha -= main_menu.alpha / 4;

            if(main_menu.alpha < 1e-5){ // Remove if opacity is close to 0

                // Remove animations

                app.ticker.remove(hover);
                app.ticker.remove(fade_out);
                app.stage.removeChild(main_menu);

                main_menu.visible = is_title_screen = false;

            }

        });

    });

    // Add a scaling effect to the play button

    start.on('mouseover', (event) => {

        // Scale it up to 1.15

        app.ticker.add(function scale(){

            // Despite having a start container, we're forced to scale the items individually :s

            start_black.scale.x += (1.15 - start_black.scale.x) / 8;
            start_black.scale.y += (1.15 - start_black.scale.y) / 8;
            start_white.scale.x += (1.15 - start_white.scale.x) / 8;
            start_white.scale.y += (1.15 - start_white.scale.y) / 8;

            if(1.15 - start_black.scale.x < 1e-2) // If it's close enough to 1.15 scale
                app.ticker.remove(scale);

        });

    });

    // Add another scaling effect to the play button

    start.on('mouseout', (event) => {

        // Scale it down to 1

        app.ticker.add(function scale(){

            // Despite having a start container, we're forced to scale the items individually :s

            start_black.scale.x += (1 - start_black.scale.x) / 8;
            start_black.scale.y += (1 - start_black.scale.y) / 8;
            start_white.scale.x += (1 - start_white.scale.x) / 8;
            start_white.scale.y += (1 - start_white.scale.y) / 8;

            if(start_black.scale.x - 1 < 1e-2) // If it's close enough to 1 scale
                app.ticker.remove(scale);

        });

    });

    // Add all relevant items to main menu

    main_menu.addChild(start);
    main_menu.addChild(mask);
    main_menu.addChild(title);
    main_menu.addChild(credits);
    main_menu.addChild(help_button);

    // Add main menu to screen

    app.stage.addChild(main_menu);

}


function setup(){

    /*
            
        Initializes and calls all important functions of the game.

        [Input]
            None

        [Output]
            None

    */

    app.ticker.add(function fade_splash() {

        /*
            
            Removes the splash screen.

            [Input]
                None

            [Output]
                None

        */

        splash.alpha -= splash.alpha / 20; // Non-linear fade

        if(splash.alpha <= 1e-3){

            // If splash page is transparent enough, we can remove it.

            app.ticker.remove(fade_splash);
            app.stage.removeChild(splash);
            splash.visible = false;
        }

    });

    //Capture the keyboard arrow keys + WASD

    keyboard_listen();

    // Set the main screen

    set_title_screen();
    
    // Load all powerups

    setup_powerups();

}

function start_game(){

    /*
            
        Initializes all game elements.

        [Input]
            None

        [Output]
            None

    */

    on_pause = false; // Game is not paused anymore.

    if(new_game == true){

        // Create a new game

        new_game = false;

        // Initialize and reset all used variables.
        
        initialize();

        // Generate all obstacles of the game.

        for(let wall of get_obstacles()){
            
            let shape = new PIXI.Polygon(wall.points);

            // Draw obstacle

            let obstacle = new PIXI.Graphics();
            obstacle.lineStyle(10, WHITE, 1);
            obstacle.beginFill(BLACK); // Set colour here
            obstacle.drawPolygon(shape.points.slice(0));
            obstacle.endFill();

            // Set positions and other characteristics

            shape.x = obstacle.x = wall.x;
            shape.y = obstacle.y = wall.y;
            shape.width = obstacle.width;
            shape.height = obstacle.height;

            shape.graphics = obstacle;

            // Add a small buffer to the wall's hitbox (Lines of the polygon are drawn on the outside, meaning they aren't part of the hitbox itself)

            // This fixes it by extending the hitbox by the line's thickness.
            
            let vertice = 0;

            // Go through all 4 corners and extend the hitbox

            for(let [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){
            
                shape.points[vertice] += dx * BORDER_THICKNESS;
                shape.points[vertice + 1] += dy * BORDER_THICKNESS;
                vertice += 2;
            
            }
            
            shape.isObstacle = true;
            
            // Add particles around obstacles

            particle_manager.surround_particles(obstacle);

            zone.addChild(obstacle);
            obstacles.push(shape);
            
        }

        // Create pause button

        pause = new PIXI.Sprite(PIXI.loader.resources["https://cycnus-studio.github.io/Project/img/pauseButton.png"].texture);
        
        // Set shape and position of pause button.

        pause.anchor.set(0.5, 0.5);
        pause.scale.set(0.1, 0.1);
        pause.position.set(WIDTH + pause.width + 30, pause.height / 2 + 30);

        // Turn it into a button

        pause.interactive = pause.buttonMode = true;

        // Add event handler

        pause.on('click', (event) => {

            // Pause music

            music.pause();

            // Set pause screen
            
            set_title_screen("resume");

            // Remove interactivity
            
            zone.interactive = zone.buttonMode = false;
        
        });

        // Add small mouse hover handler

        pause.on('mouseover', (event) => {

            // Make button slightly larger

            app.ticker.add(function scale(){

                // Scale up a bit (non-linearly)
                
                pause.scale.x += (0.15 - pause.scale.x) / 8;
                pause.scale.y += (0.15 - pause.scale.y) / 8;

                if(0.15 - pause.scale.x < 1e-2) // Stop scaling when reached target (0.15 scale)
                    app.ticker.remove(scale);

            });

        });

        // Scale back out when done hovering

        pause.on('mouseout', (event) => {

            // Make button slightly larger

            app.ticker.add(function scale(){

                // Scale down a bit (non-linearly)

                pause.scale.x += (0.1 - pause.scale.x) / 8;
                pause.scale.y += (0.1 - pause.scale.y) / 8;

                if(pause.scale.x - 0.1 < 1e-2){

                    // Stop scaling when reached target (0.15 scale)

                    app.ticker.remove(scale);
                
                }
            
            });
        
        });

        zone.addChild(pause);
        
        // Make in-game tutorial

        // Load arrows

        let arrows       = new PIXI.Sprite(PIXI.loader.resources["https://cycnus-studio.github.io/Project/img/directions.png"].texture);
        
        // Load instruction text

        let instructions = new PIXI.Text("Click to shoot. Avoid enemy bullets.", instructions_style);

        // Position the arrows and instructions
        
        arrows.anchor.set(0.5, 0.5);
        instructions.anchor.set(0.5, 0.5);
        arrows.scale.set(0.1, 0.1);

        // Center the two objects

        arrows.position.set(MID_WIDTH + sprite.width / 2, MID_HEIGHT + sprite.height / 2);
        instructions.position.set(MID_WIDTH + sprite.width / 2, MID_HEIGHT + 100);

        let frame_count = 0; // Count frames. This is used for highlighting an item by scaling

        app.ticker.add(function scale(){

            // We can abuse the properties of trigonometric functions to make items go out and in repeatedly.

            arrows.scale.x += Math.sin(frame_count * Math.PI / 180) / 2048;
            arrows.scale.y += Math.sin(frame_count * Math.PI / 180) / 2048;

            // Increment while making sure it does not overflow (We'll just keep it at 360 max just in case)

            frame_count = ++frame_count % 360;

            // We'll make the instructions disappear once the player finally moves

            if(sprite.position.x != MID_WIDTH || sprite.position.y != MID_HEIGHT){

                // Make them fade after 1 second

                setTimeout(function() {

                    app.ticker.add(function fade(){

                        // Make both fade out slowly
                        
                        arrows.alpha -= arrows.alpha / 32;
                        instructions.alpha -= instructions.alpha / 1024;
                        
                        if(instructions.alpha < 1e-4){

                            // Remove both objects when they're close to 0 in opacity.

                            app.ticker.remove(fade);
                            app.ticker.remove(scale);

                            bullet_container.removeChild(arrows);
                            bullet_container.removeChild(instructions);

                        }

                    });

                }, 1000);
            
            }
        
        });

        // Add them to the lowest container so they don't draw over anything else (bullet_container)

        bullet_container.addChild(arrows);
        bullet_container.addChild(instructions);

        // Generate the health bar and player's score text

        generateHealthBar();
        generateScore();

        obstacles.push(sprite);

    }

    // Enable zone interactivity

    zone.interactive = true;
    zone.buttonMode = true;
    zone.cursor = "crosshair"; // Adds a nice "+" symbol to the game and makes it more like shooting

    // Start moving objects

    app.ticker.add(gameLoop);

}

function initialize(){

    /*
            
        Resets all in-game variables.

        [Input]
            None

        [Output]
            None

    */

    // Reset sprite position

    sprite.position.x = MID_WIDTH;
    sprite.position.y = MID_HEIGHT; 

    // Reset velocity to 0

    sprite.vx = sprite.vy = 0;

    // Reset to default values

    sprite.hp = PLAYER_HEALTH;
    sprite.shots = PLAYER_SHOTS;
    sprite.scale.set(1, 1);

    // Resets powerup effects

    freeze_duration = 0;
    slowing_factor = 1;

    // Reset round text

    if(enemies.length != 0)
        round_title.text = "Round 1";

    // Removes all enemies, bullets, mines, obstacles, and other relevant sprites

    for(let enemy of enemies)
        zone.removeChild(enemy);
    for(let obstacle of obstacles)
        zone.removeChild(obstacle);
    for(let bullet of bullets)
        bullet_container.removeChild(bullet);
    for(let mine of mines)
        mine_container.removeChild(mine);

    zone.addChild(sprite); // Add sprite back into the game
    zone.removeChild(point_title);
    zone.removeChild(boss_bar);
    zone.removeChild(boss_health);
    zone.removeChild(health_bar);
    zone.removeChild(active_health);
    zone.removeChild(pause);

    // Reset all past game objects and scores

    enemies = [];
    obstacles = [];
    bullets = [];
    mines = [];
    user_score = 0;
    enemies_left = 0;
    wave_id = 0;

    // Set variables to be ready to load round title and the game itself

    is_loaded = false;
    is_ready_to_load = true;
    blue_colour_bg = false;

}

function set_game_over(){

    /*
            
        Sets the game over screen.

        [Input]
            None

        [Output]
            None

    */

    // Stop all game animations

    app.ticker.remove(gameLoop);
    
    // Play death sound effect

    death_sound.play();

    // Pause screen

    zone.interactive = zone.buttonMode = false;

    // We can start a new game again
    
    new_game = true;

    // Set screen

    set_title_screen("restart");

}

/******************* LOAD GAME VISUALS (HEALTH BARS AND SCORES) *******************/


function move_round_title_out(){

    /*
            
        Moves round title out.

        [Input]
            None

        [Output]
            None

    */

    let target = -round_title.width - 30;

    // Add animation to move out

    app.ticker.add(function move_title_out() {

        // Change x position non-linearly

        round_title.position.x -= Math.abs(target - round_title.position.x) / 16;

        if(round_title.position.x < target + 2){ // If title is close enough to coordinate
            app.ticker.remove(move_title_out);
            is_ready_to_load = true;
            is_loaded = false;
        }

    });

}

function generateScore(){

    /*
            
        Generates the user score text.

        [Input]
            None

        [Output]
            None

    */

    // Create text

    point_title = new PIXI.Text("0", round_style);
    point_title.position.set(600 - point_title.width, HEIGHT - point_title.height - 20);
    zone.addChild(point_title);

    point_title.update = function(){

        /*
            
            Updates the point text value.

            [Input]
                None

            [Output]
                None

        */

        point_title.text = `${user_score}`;
    
    }

}

function generateHealthBar(){

    /*
            
        Generates the user health bar (and pause button).

        [Input]
            None

        [Output]
            None

    */

    // Outline of health bar

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

    // Create animation of moving in the health bar

    app.ticker.add(function move_in(){

        // Moves both items in

        let distance = Math.abs(health_bar.position.x - target) / 4;
        
        health_bar.position.x -= distance;
        active_health.position.x -= distance;

        if(health_bar.position.x - target < 3){ // Checks if location is close enough

            app.ticker.remove(move_in);

            health_update(); // Stretch/compress the active health portion to match with current HP

        }

    });

    // Create animation of moving in the pause button

    let pause_target = WIDTH - pause.width / 2 - 30;

    app.ticker.add(function move_in_pause(){

        // Move item in
        
        pause.position.x -= Math.abs(pause.position.x - pause_target) / 8;

        if(pause.position.x - pause_target < 3) // Check if item is close enough
            app.ticker.remove(move_in_pause);

    });

    zone.addChild(health_bar);
    zone.addChild(active_health);

}

function generateBossBar(){

    /*
            
        Generates the boss' health bar.

        [Input]
            None

        [Output]
            None

    */

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

    // Create animation of moving in the health bar

    app.ticker.add(function move_in(){

        // Move both items in

        let distance = Math.abs(boss_bar.position.x - target) / 4;
        
        boss_bar.position.x += distance;
        boss_health.position.x += distance;

        if(target - boss_bar.position.x < 3){ // Checks if location is close enough

            app.ticker.remove(move_in);

            updateBossBar(); // Stretch/compress boss health to match with current HP

        }

    });

    zone.addChild(boss_bar);
    zone.addChild(boss_health);

}

// These variables prevent multiple health update animations from running at the same time

let move_health_func, still_running = false;

function health_update(){

    /*
            
        Updates the user's health bar to match with their current HP.

        [Input]
            None

        [Output]
            None

    */

    // Prevent multiple updates going on at once

    if(still_running == true)
        app.ticker.remove(move_health_func);

    still_running = true;

    let start        = active_health.width;
    let target_width = (400 / PLAYER_HEALTH) * sprite.hp;

    // Add animation of updating health

    app.ticker.add(move_health_func = function move_health(){

        // Move and stretch health bar
        
        active_health.width += (target_width - active_health.width) / 4;
        active_health.position.x += (health_bar.position.x + health_bar.width - active_health.width) - active_health.getBounds().x;
        
        if(Math.abs(target_width - active_health.width) < 1e-4){ // Check if size is close enough to target
            app.ticker.remove(move_health);
            still_running = false; // Not running anymore
        }

    });

}

// These variables prevent multiple boss health update animations from running at the same time

let move_boss_health_func, boss_still_running = false;

function updateBossBar(){

    /*
            
        Updates the boss' health bar to match with their current HP.

        [Input]
            None

        [Output]
            None

    */

    if(boss_still_running == true)
        app.ticker.remove(move_boss_health_func);

    boss_still_running = true;

    let start        = boss_health.width;
    let target_width = (400 / boss.max_hp) * boss.hp;

    // Add animation of updating health

    app.ticker.add(move_boss_health_func = function move_boss_health(){

        // Move and stretch health bar
        
        boss_health.width += (target_width - boss_health.width) / 4;
        boss_health.position.x += boss_bar.position.x - boss_health.getBounds().x;
        
        if(Math.abs(target_width - boss_health.width) < 1e-4){ // Check if size is close enough to target
            app.ticker.remove(move_boss_health);
            boss_still_running = false; // Not running anymore
        }

    });
    
}

function boss_bar_out(){

    /*
            
        Move the boss health bar out of the screen.

        [Input]
            None

        [Output]
            None

    */


    let target = -HEALTH_WIDTH - 20;

    // Add animation of moveing out

    app.ticker.add(function move_out(){

        // Move both objects out

        let distance = Math.abs(boss_bar.position.x - target) / 8;
        
        boss_bar.position.x -= distance;
        boss_health.position.x -= distance;

        if(Math.abs(target - boss_bar.position.x) < 3){ // Check if object is out of sight

            // Remove objects from the container

            app.ticker.remove(move_out);
            zone.removeChild(boss_bar);
            zone.removeChild(boss_health);

        }

    });

}


function generateTitle(number){

    /*
            
        Generates a new round title to match with current wave.

        [Input]
            number => An integer representing the wave number

        [Output]
            None

    */

    // Update text

    round_title.text = `Round ${number}`;

    // Add animation to make the title move in

    app.ticker.add(function move_title_in() {

        // Update x coordinate

        round_title.position.x += Math.abs(round_title.position.x - 30) / 16;

        if(round_title.position.x > 28){ // If the position is close enough to target coordinate
            app.ticker.remove(move_title_in);
            is_loaded = is_ready_to_load = false; // Reset loading variables for next wave
        }

    });

}

/***************************** GAME MECHANICS ********************************/

function generateWave(){

    /*
            
        Generates a new wave of enemies.

        [Input]
            None

        [Output]
            None

    */

    // If wave isn't ready to load yet (such as title not done moving)

    if(is_ready_to_load == false)
        return;

    // Clear all previously dead enemies

    clearDeleted();

    // Generate wave title

    generateTitle(++wave_id);

    let enemy_count = 0; // Used for labelling enemies
    let highest = 0;     // Keep track of highest unlocked monster type
    enemies_left = 0;    // Keep track of number of alive enemies

    // Generate a boss every 5th wave

    if(wave_id % 5 == 4){

        // Load the boss health bar

        generateBossBar();

        // Find the highest enemy type that we're available to choose from

        for(let sides = 0; sides < ENEMY_TYPES.length - 1; ++sides){
            if(wave_id > STARTING_ROUNDS[sides])
                highest = Math.max(STARTING_ROUNDS[sides], highest);
        }

        // Generate the boss

        enemies[0] = boss = generateBoss(ENEMY_TYPES[rand_range(highest == 0 ? 1 : 0, Math.min(3, Math.floor(highest / 10)))], rand_range(6, 6 + Math.floor(wave_id / 10)));

        // Label the boss with a number

        boss.spriteID = enemy_count++;

        zone.addChild(boss);
        obstacles.push(boss);

        // One mor enemy to kill now
            
        enemies_left++;
        
    }

    // Generate the rest of the enemies 

    for(let sides = 0; sides < ENEMY_TYPES.length - 1; ++sides){

        // Check if we're past minimum round

        if(wave_id > STARTING_ROUNDS[sides]){

            // Generate a max of 2 enemies for this shape

            for(let units = 0; units < Math.min(2, Math.ceil((wave_id - STARTING_ROUNDS[sides]) / (sides + 1))); units++){
                
                // Generate it by random (colours are also slowly unlocked one by one)

                let enemy = generateEnemy(ENEMY_TYPES[sides], rand_range(6, 6 + Math.floor(Math.min(53, wave_id - 5) / 8)));
                
                // Label enemy

                enemy.spriteID = enemy_count++;

                if(wave_id == 1){

                    // If it's the first round, make sure the reader reads the instructions by waiting for a few seconds to add the enemy

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

                // More enemies to kill now
                
                enemies_left++;
            }

        }

    }

 }
 

function clearDeleted(){

    /*
            
        Clear all enemies and dead obstacles from the drawing queue.

        [Input]
            None

        [Output]
            None

    */

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

    // Saves it to previous arrays

    enemies = new_enemies.slice(0);
    obstacles = new_obstacles.slice(0);

}

function shoot(id, src_x, src_y, tgt_x, tgt_y, is_player = false, ignore_constraints = false){

    /*
            
        Shoots a bullet on the screen.

        [Input]
            id                 => An integer representing the enemy/player who shot it
            src_x              => The starting x coordinate
            src_y              => The starting y coordinate
            tgt_x              => The clicked x coordinate
            tgt_y              => The clicked y coordinate
            is_player          => A boolean for whether the player shot it
            ignore_constraints => If the bullet counter should be ignored

        [Output]
            None

    */

    // Prevent shooting a bullet if clicked outside of main region

    if(is_player == true && (tgt_x < PADDING || tgt_x > WIDTH - PADDING || tgt_y < PADDING || tgt_y > HEIGHT - PADDING || sprite.scale.x < 1))
        return;

    // Check if shooter has enough bullets and waited long enough to shoot the next bullet

    if(is_player == true){

        if(sprite.shots <= 0)
            return;

        sprite.shots--;

    } else if(ignore_constraints == false){ // If ignore_constraints is true then we can ignore this

        if(enemies[id].shots <= 0)
            return;

        if(enemies[id].previousShot-- > 0)
            return;

        enemies[id].shots--;
        enemies[id].previousShot = 5;

    }

    // Play the shooting sound

    if(is_player == true)
        shoot_sound.play();

    // Get size of shooter

    let unit_size = is_player ? SPRITE_SIZE : enemies[id].height;

    // Draw the bullet

    let bullet = new PIXI.Graphics();
    bullet.beginFill(is_player ? sprite.colour : enemies[id].colour); // Set colour here
    bullet.drawCircle(0, 0, 3);
    bullet.endFill();

    // Get slope and set bullet position

    let mx = tgt_x - src_x - unit_size;
    let my = tgt_y - src_y - unit_size;

    bullet.x = src_x + unit_size;
    bullet.y = src_y + unit_size;
    
    let angle = Math.atan2(my, mx); // Generate angle
    
    // Use angle to set direction

    bullet.vx = Math.cos(angle); 
    bullet.vy = Math.sin(angle);

    // Set bullet max speed

    bullet.max_veloc = is_player ? PLAYER_BULLET_SPEED : enemies[id].bullet_speed;

    // Set rest of attributes

    bullet.anchor = {x: 1, y: 1};
    bullet.isBullet = true;
    bullet.isBossSpreadBullet = ignore_constraints;

    bullet.isPlayerShot = is_player;
    bullet.spriteID = is_player == true ? 0 : enemies[id].spriteID;

    // Add to bullet drawing queue

    bullets.push(bullet);

    bullet_container.addChild(bullet);

}

function explode(x, y, radius, colour = 0xBC1E1E){

    /*
            
        Shoots a bullet on the screen.

        [Input]
            x        => The x coordinate
            y        => The y coordinate
            radius   => The radius of the explosion
            colour   => The colour of the explosion

        [Output]
            None

    */

    // Draw the explosion

    let enemy_explosion_circle = new PIXI.Graphics();

    enemy_explosion_circle.beginFill(colour); // Set colour here

    enemy_explosion_circle.drawCircle(x, y, radius);
    enemy_explosion_circle.endFill();

    zone.addChild(enemy_explosion_circle);

    // Add animation for the explosion (fading out)

    app.ticker.add(function boom_out() {

        // Modify opacity

        enemy_explosion_circle.alpha -= enemy_explosion_circle.alpha / 16;

        if(enemy_explosion_circle.alpha <= 1e-4){ // Check if opacity is close to 0
            app.ticker.remove(boom_out);
            zone.removeChild(enemy_explosion_circle);
        }

    });

}

/**************************** MAIN GAME LOOP *******************************/


function gameLoop(){

    /*
            
        Updates all the interactions of the sprites

        [Input]
            None

        [Output]
            None

    */

    // Update music information, see music.js for more info

    music.update();

    // Check if enemies can be generated once again

    if(enemies_left == 0 && is_loaded == false && is_title_screen == false){

        is_loaded = true;

        // Check if round title needs to be moved out
        
        if(wave_id > 0 && is_ready_to_load == false)
            move_round_title_out();

        // Generate the wave
        
        generateWave();
    
    }

    // Update particle positions

    let new_particles = [];

    for(let particle of particles){
        
        particle.update();
        
        if(particle.alpha > 1e-4){ // Not transparent enough to be removed

            new_particles.push(particle);
        
        } else {

            // Check which container to remove the particle from
            
            if(particle._particle.is_background == false)

                particle_container.removeChild(particle._particle);
            
            else
            
                background_particle_container.removeChild(particle._particle);
        
        }
    
    }

    // Save the particles that are still "alive"

    particles = new_particles.slice(0);

    // Update colour to obstacles if there's a music beat

    if(music.is_on_beat(0, 15, false) == true){

        // Update every obstacle's colours

        for(let obstacle_ID = 0; obstacle_ID < 6; obstacle_ID++){

            if(obstacles[obstacle_ID].isObstacle !== true)
                break;

            // Update colour as accordingly (if everything is slowed down, it will use blue colours to update itself with)

            obstacles[obstacle_ID].graphics.tint = blue_colour_bg ? BLUE_COLOURS[rand_range(0, 6)] : COLOURS[rand_range(0, 5)];
        
        }

    }

    // Update the current game's enemies and bullets

    play();

}


function play(){

    /*
            
        Update the current game's enemies and bullets.

        [Input]
            None

        [Output]
            None

    */

    // Freeze powerup checker

    if(freeze_duration-- > 0){

        blue_colour_bg = true;
        slowing_factor /= 1.05; // Slow it down

    } else if(freeze_duration <= 0 && slowing_factor < 1){

        // Bring it back up

        slowing_factor *= 1.05;
        freeze_duration = 0;

    } else {

        // Otherwise do nothing

        blue_colour_bg = false;
        slowing_factor = 1;
    }

    // Mines detonation checker

    for(let ID = 0; ID < mines.length; ++ID){

        if(mines[ID].detonated == true)
            continue;

        // Check if mines are still being generated

        if(mines[ID].scale.x != 1){

            // Keep generating
            
            mines[ID].scale.x += (1 - mines[ID].scale.x) / 8;
            mines[ID].scale.y += (1 - mines[ID].scale.y) / 8;

            if(1 - mines[ID].scale.x < 1e-2) // Done generating?
                mines[ID].scale.set(1, 1);

            continue;

        }

        // Find all enemies that are in range of the mine

        for(let enemy_ID = 0; enemy_ID < enemies.length; ++enemy_ID){
            
            if(enemies[enemy_ID].dead === true) // Dead enemy?
                continue;

            // Check if enemy stepped on mine

            if(intersectPolygon(mines[ID], enemies[enemy_ID]) == true){

                // Remove from mine counter

                mines[ID].detonated = true;
                mines_left--;

                // Detonate!!

                explode(mines[ID].position.x, mines[ID].position.y, mines[ID].blast_radius, sprite.colour);

                // Find all enemies in blast radius

                for(;enemy_ID < enemies.length; ++enemy_ID){

                    if(enemies[enemy_ID].dead === true) // Enemy dead?
                        continue;

                    // Check if close enough to blast radius

                    if(in_radius(mines[ID].position.x, mines[ID].position.y, mines[ID].blast_radius, enemies[enemy_ID])){
                        
                        // Decrease HP

                        enemies[enemy_ID].lose_hp(enemies[enemy_ID].hp);

                    }

                }

                // Add animation to shrink the mine

                app.ticker.add(function shrink(){

                    // Scale it down

                    mines[ID].scale.x /= 1.2;
                    mines[ID].scale.y /= 1.2;

                    if(mines[ID].scale.x < 0.01){ // Check if mine is very very small

                        // Remove it

                        mines[ID].visible = false;

                        mine_container.removeChild(mines[ID]);
                        app.ticker.remove(shrink);
                    
                    }

                });

                // Done checking, can break out now

                break;

            }
        
        }

    }

    // Move the player sprite

    sprite = move(sprite, 1)[0];

    // Move the bullets

    let is_hit;
    let valid_bullets = []; // Save bullets that are still moving

    for(let ID = 0; ID < bullets.length; ID++){

        // Move bullet

        let [new_bullet, is_hit] = move(bullets[ID], bullets[ID].max_veloc);

        // Make sure bullet didn't hit player

        let hit_player = intersectPolygon(new_bullet, sprite);
        
        if(is_hit === false && hit_player == false){

            // Keep it moving

            valid_bullets.push(new_bullet);

        } else {

            // Bullet has hit something (enemy, wall, player)

            // Explode!! (it's harmless though)

            explode(bullets[ID].position.x, bullets[ID].position.y, rand_range(5, 20), bullets[ID].isPlayerShot ? sprite.colour : enemies[Math.min(enemies.length - 1, bullets[ID].spriteID)].colour);

            if(hit_player == true){

                // Make player lose HP if hit

                sprite.lose_hp();

            } else if(is_hit !== true && obstacles[is_hit].isObstacle !== true && obstacles[is_hit].scale.x == 1){
                
                // Make enemy lose hp if hit

                obstacles[is_hit].lose_hp(1);

            }

            // Remove bullet

            bullets[ID].visible = false;
            zone.removeChild(bullets[ID]);

            // Add bullet back to counter

            if(bullets[ID].isPlayerShot == true){

                // Add back to player bullets

                sprite.shots++;

            } else if(bullets[ID].isBossSpreadBullet == false){ // Make sure boss' extra spreading bullets don't add to the counter (Or else they get a loooooooooot of bullets)

                if(bullets[ID].spriteID >= enemies.length) // Prevent indexing out of bounds (Happens when boss dies but his bullets are still flying around and end up in some other enemy's bullet counter, which gets messy)
                    continue;

                if(enemies[bullets[ID].spriteID].dead) // Don't add it back if enemy is dead
                    continue;

                // Make sure to keep a cap to be safe

                enemies[bullets[ID].spriteID].shots = Math.min(3, enemies[bullets[ID].spriteID].shots + 1);

            }
            
        }

    }

    // Save the good bullets

    bullets = valid_bullets.slice(0);

    // Move the enemies

    for(let ID = 0; ID < enemies.length; ID++){

        // Scale them up when first generated

        if(enemies[ID].scale.x != 1 && enemies[ID].dead != true){

            // Scale up

            enemies[ID].scale.x += (1 - enemies[ID].scale.x) / enemies[ID].generation_rate;
            enemies[ID].scale.y += (1 - enemies[ID].scale.y) / enemies[ID].generation_rate;

            if(1 - enemies[ID].scale.x < 0.01) // If close enough to max scale
                enemies[ID].scale.set(1, 1);

        } else {

            // Get path to player

            enemies[ID] = setDirection(enemies[ID], sprite);
            
            // Move to player

            enemies[ID] = move(enemies[ID], 1)[0];

            // Check if enemy is allowed to shoot

            // This means enemy isn't dead, music is on beat, and enemies aren't slowed down

            if(enemies[ID].dead != true && music.is_on_beat(Math.min(ID * 2)) && slowing_factor > 1e-4){
                
                if(isVisible(enemies[ID].position, sprite.position) == true){

                    // Shoot if player is visible to enemy

                    shoot(ID,
                        enemies[ID].position.x - enemies[ID].width * (1 - enemies[ID].anchor.x),
                        enemies[ID].position.y - enemies[ID].height * (1 - enemies[ID].anchor.y),
                        sprite.position.x + sprite.width * (1 - sprite.anchor.x),
                        sprite.position.y + sprite.height * (1 - sprite.anchor.y));
                
                }

                // Boss spread checker

                if(enemies[ID].isBoss === true && enemies[ID].previousSpread-- <= 0){

                    enemies[ID].previousSpread = 15;

                    // Shoot in all the sides

                     let offset = enemies[ID].offset;
                     let sides  = enemies[ID].hitArea.points.length / 2;

                     for(let side = 0; side < sides; side++){

                        // Same concept as the polygon points generator (see generator.js)

                         shoot(ID,
                            enemies[ID].position.x - enemies[ID].width * (1 - enemies[ID].anchor.x),
                            enemies[ID].position.y - enemies[ID].height * (1 - enemies[ID].anchor.y),
                            enemies[ID].position.x + BOSS_SIZE * Math.cos(2 * Math.PI * side / sides + offset),
                            enemies[ID].position.y + BOSS_SIZE * Math.sin(2 * Math.PI * side / sides + offset),
                            false,
                            true
                        );

                     }

                }

            }

            // Check if enemy can explode on player (see pentagons)

            let radius = enemies[ID].isBoss ? 60 : 30;

            if(enemies[ID].dead != true && enemies[ID].is_explode == true && in_radius(enemies[ID].position.x, enemies[ID].position.y, radius, sprite)){

                enemies[ID].lose_hp(enemies[ID].hp, radius);

            }

        }

    }

}

// Create a Pixi Application

let app = new PIXI.Application({ 
    width: WIDTH,          // default: 800
    height: HEIGHT,        // default: 600
    antialias: true,       // default: false
    transparent: false,    // default: false
    resolution: 1,         // default: 1
});

let container = document.getElementById("container");

//Add the canvas that Pixi automatically created for the HTML document

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
    .load(setup);


function keyboard(keyCodeA, keyCodeB) {

    /*
            
        Sets event listeners for specific keys.

        [Input]
            keyCodeA => Key 1 to listen to
            keyCodeb => Key 2 to listen to

        [Output]
            key => An object representing the key itself

    */

    //The keyboard helper functions

    // Concept is inspired from https://github.com/kittykatattack/learningPixi#keyboard

    let key = {};

    key.codeA = keyCodeA;
    key.codeB = keyCodeB;
    
    // Check if keys are pressed

    key.isDown = false;
    key.isUp = true;
    
    key.press = undefined;
    key.release = undefined;

    //The keypress event handler
    
    key.downHandler = event => {

        // Check if keys are valid

        if (event.keyCode === key.codeA || event.keyCode === key.codeB) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
        }

        // Prevent its normal actions

        event.preventDefault();
    
    };

    //The keypress up event handler
    
    key.upHandler = event => {

        // Check if keys are valid

        if (event.keyCode === key.codeA || event.keyCode === key.codeB) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
        }

        // Prevent its normal actions

        event.preventDefault();
    
    };

    //Attach event listeners to the up/down handlers
    
    window.addEventListener(
        "keydown", key.downHandler.bind(key), false
    );
    
    window.addEventListener(
        "keyup", key.upHandler.bind(key), false
    );
    
    return key;

}

function keyboard_listen(){

    /*
            
        Sets all directional keys for game interactivity.

        [Input]
            None

        [Output]
            None

    */

    // Set all 4 directions

    let left  = keyboard(37, 65),
        up    = keyboard(38, 87),
        right = keyboard(39, 68),
        down  = keyboard(40, 83);

    // Set functions to handle keypresses

    // Left keypress
    
    left.press = () => {
        sprite.vx = -PLAYER_SPEED;
    };

    left.release = () => {
        sprite.vx = right.isDown ? PLAYER_SPEED : 0;
    };

    // Up keypress

    up.press = () => {
        sprite.vy = -PLAYER_SPEED;
    };

    up.release = () => {
        sprite.vy = down.isDown ? PLAYER_SPEED : 0;
    };

    // Right keypress

    right.press = () => {
        sprite.vx = PLAYER_SPEED;
    };

    right.release = () => {
        sprite.vx = left.isDown ? -PLAYER_SPEED : 0;
    };

    // Down keypress

    down.press = () => {
        sprite.vy = PLAYER_SPEED;
    };

    down.release = () => {
        sprite.vy = up.isDown ? -PLAYER_SPEED : 0;
    };

}
