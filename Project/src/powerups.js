/*
 *  Loads the functions for all the powerup effects as well as their respective.
 *
 *  Author: Cycnus Studio
 *
 *  Date: June 3rd, 2019  
 *
 */


let freeze = function(){

    /*
        
        Activates the freezing ability

        [Input]
            None

        [Output]
            boolean => Whether the powerup has been successfully activated

    */

    if(slowing_factor != 1) // If it's already frozen, don't freeze again.
        return false;

    freeze_duration = 400; // Freeze for 400 frames

    return true;

};

let generateMines = function(){

    /*
        
        Activates 3 miness on screen.

        [Input]
            None

        [Output]
            boolean => Whether the powerup has been successfully activated

    */

    if(mines_left != 0) // If there are still mines on the screen then ignore it
        return false;

    // Now there are 3 mines left.

    mines_left = MINES_COUNT;

    for(let mine_counter = 0; mine_counter < MINES_COUNT; mine_counter++){

        // Generate points

        let points = new Array(32).fill(0);
        let side_length = 30;
        let angle = 0;

        // This ratio was calculated on paper

        let dist = side_length * Math.cos(45 * Math.PI / 180) / Math.cos(22.5 * Math.PI / 180);

        for(let side = 0; side < points.length; side += 4){

            // Generate two points at a time (It's easier this way)

            // The cardinal corners

            let x = Math.cos(angle * Math.PI / 180) * side_length;
            let y = Math.sin(angle * Math.PI / 180) * side_length;

            points[side] = x;
            points[side + 1] = y;

            // The diagonal corners

            x = Math.cos((angle + 22.5) * Math.PI / 180) * dist;
            y = Math.sin((angle + 22.5) * Math.PI / 180) * dist;

            points[side + 2] = x;
            points[side + 3] = y;

            // Rotate

            angle += 45;

        }

        // Draw the mine

        let mine = new PIXI.Graphics();

        mine.lineStyle(5, WHITE);
        mine.drawPolygon(points);

        mine.hit_radius = 20;   // Hitbox
        mine.blast_radius = 60; // Impact radius

        mine.hitArea = new PIXI.Polygon(points); // For generating a valid position

        // Generate a position that's not covered by an obstacle.

        do {

            mine.position.x = Math.floor(Math.random() * (WIDTH - PADDING - mine.width) + PADDING + mine.width);
            mine.position.y = Math.floor(Math.random() * (HEIGHT - PADDING - mine.height) + PADDING + mine.height);

        } while(hit_obstacle(mine) == true);

        // Set it to very small (will pop out using animations)

        mine.scale.set(1e-2, 1e-2);
        mine_container.addChild(mine);

        // Add to the list of mines

        mines.push(mine);

    }

    return true;

};

let laser_count = 0; // Count number of lasers on screen (This will always be either 0 or 1)

let activateLaser = function(){

    /*
        
        Activates the laser powerup.

        [Input]
            None

        [Output]
            boolean => Whether the powerup has been successfully activated

    */

    if(enemies_left <= 0 || laser_count > 0)
        return false;

    laser_count = 1;

    // Draw the laser

    let laser = new PIXI.Graphics();

    laser.position.set(PADDING, PADDING + 2);

    // Draw a line

    laser.lineStyle(5, sprite.colour);
    laser.moveTo(0, 0);
    laser.lineTo(WIDTH - PADDING * 2, 0);

    zone.addChild(laser);

    // Keep track of which ones have been shot already by the laser

    let shot = new Array(enemies.length).fill(false);

    app.ticker.add(function sweep_grid(){

        /*
        
            Moves the laser while burning the enemies.

            [Input]
                None

            [Output]
                None

        */

        laser.position.y += (HEIGHT - PADDING - laser.position.y) / 24; // Non-linear growth

        // Look through which enemies have just gotten affected by the laser (If we're sweeping from top to bottom, we're only dealing damage as the laser moves)

        for(let enemy_ID = 0; enemy_ID < enemies.length; enemy_ID++){

            if(enemies[enemy_ID].dead === true) // Dead enemy.
                continue;

            if(shot[enemy_ID] == true) // We've already removed 1 hp from it.
                continue;

            // Check if laser just got to the enemy as it sweeps

            if(enemies[enemy_ID].position.y - enemies[enemy_ID].height * 0.5 < laser.position.y){

                shot[enemy_ID] = true; // Prevent it from further killing
                
                enemies[enemy_ID].lose_hp(1); // Make it lose a health

            }

        }

        // Check if it has reached the bottom

        if(HEIGHT - PADDING - laser.position.y < 5){

            app.ticker.remove(sweep_grid);

            app.ticker.add(function fade_laser(){

                /*
        
                    Slowly fades the laser out.

                    [Input]
                        None

                    [Output]
                        None

                */

                laser.alpha -= laser.alpha / 4; // Non-linear fade-out

                // If the laser is transparent enough

                if(laser.alpha < 1e-3){

                    // Remove the laser

                    zone.removeChild(laser);
                    laser.visible = false;
                    app.ticker.remove(fade_laser);

                }

            });

            laser_count = 0; // Allow more lasers by resetting the count

        }

    });

    return true;

}

/*

    Buttons for powerups

*/

// Save the powerup functions into an array (Notice how the functions are variables unlike ordinary functions)

const POWERUP_FUNCTIONS = [freeze, generateMines, activateLaser];

class Powerup {

    /*

        A class to manage the in-game powerups

    */

    constructor(button_normal, button_down, button_up, button_disabled, position, powerup_function, baseline_points) {

        /*
            
            Creates a button for the powerup.

            [Input]
                button_normal     => A URL string of the powerup button
                button_down       => A URL string of the powerup button when clicked
                button_up         => A URL string of the powerup button when hovered on
                button_disabled   => A URL string of the powerup button when disabled
                position          => The position/index of the button among the 3 powerups
                powerup_function  => The function to activate when clicked
                baseline_points   => Minimum amount of points required to activate

            [Output]
                None

        */

        // Load the picture
        
        let texture = PIXI.loader.resources[button_normal].texture;

        // Draw the sprite

        this.button = new PIXI.Sprite(texture);

        // Label it as a button
        
        this.button.interactive = this.button.buttonMode = true;

        // Save the textures/pictures

        this.button._button_texture = texture;
        this.button._button_texture_down = PIXI.loader.resources[button_down].texture;
        this.button._button_texture_over = PIXI.loader.resources[button_up].texture;
        this.button._button_texture_disabled = PIXI.loader.resources[button_disabled].texture;
    
        // Position the button
        
        this.button.width = 80;
        this.button.height = 80;
        this.button.x = position;
        this.button.y = 710;

        // Keep track of the button state

        this.button.is_down = this.button.is_over = false;

        this.button.powerup_function = powerup_function; // Powerup activating function
        this.button.baseline_points = baseline_points;   // Minimum required points
        
        zone.addChild(this.button);

        // Add all the event listeners
        
        this.button 
            .on('mousedown', this.onButtonDown) 
            .on('touchstart', this.onButtonDown)

            .on('mouseup', this.onButtonUp)
            .on('touchend', this.onButtonUp)
            .on('mouseupoutside', this.onButtonUp)
            .on('touchendoutside', this.onButtonUp)

            .on('mouseover', this.onButtonOver)

            .on('mouseout', this.onButtonOut)
            
    }

    onButtonDown() {

        /*
            
            Changes the button texture to the clicked state.

            [Input]
                None

            [Output]
                None

        */

        this.is_down = true;

        // Check if user has enough points to use powerup

        if(user_score >= this.baseline_points){

            // Check if powerup activation was successful (Prevent reducting 150 from player if activation failed)
            
            if(this.powerup_function() == true){
                user_score -= 150;
                point_title.update();
            }

        }

    }

    onButtonUp() {

        /*
            
            Changes the button texture to the hovered state.

            [Input]
                None

            [Output]
                None

        */

        this.is_down = false;

    }

    onButtonOver() {

        /*
            
            Changes the button texture to the hovered state.

            [Input]
                None

            [Output]
                None

        */

        this.is_over = true;

    }

    onButtonOut() {

        /*
            
            Changes the button texture to the normal state after moving cursor out of button.

            [Input]
                None

            [Output]
                None

        */

        this.is_over = false;

    }

    updateState() {

        /*
            
            Updates button state depending on user interactions.

            [Input]
                None

            [Output]
                None

        */

        if(user_score >= this.button.baseline_points){

            if(this.button.is_down) {

                // If the button is clicked it should have highest priority

                this.button.texture = this.button._button_texture_down;

            } else if(this.button.is_over){ 

                // A hovered button should have higher priority than the normal button

                this.button.texture = this.button._button_texture_over;

            } else {

                // If it isn't hovered nor clicked it should display the normal button.

                this.button.texture = this.button._button_texture;

            }

        } else {

            // If button is disabled it should override all other states.

            this.button.texture = this.button._button_texture_disabled;

        }

    }

}

function setup_powerups() {

    /*
            
        Sets up the powerup buttons.

        [Input]
            None

        [Output]
            None

    */

    // Go through all 3 powerups
    
    for(let button_ID = 0; button_ID < POWER_NAMES.length; button_ID++) {

        // Grab button information:
        
        let powerup_name = POWER_NAMES[button_ID];              // Name of powerup (For URL purposes)
        let button_position = BUTTON_POSITIONS[button_ID];      // X-coordinate of powerup button
        let activating_function = POWERUP_FUNCTIONS[button_ID]; // Linked function
        let base_score = BASE_POWERUP_SCORES[button_ID];        // Minimum score

        // Load the button

        let button = new Powerup(`https://cycnus-studio.github.io/Project/img/${powerup_name}Button.png`,
            `https://cycnus-studio.github.io/Project/img/${powerup_name}ButtonDown.png`,
            `https://cycnus-studio.github.io/Project/img/${powerup_name}ButtonOver.png`,
            `https://cycnus-studio.github.io/Project/img/${powerup_name}ButtonDisabled.png`, 
            button_position,
            activating_function,
            base_score);

        // Add a checker that updates the button

        app.ticker.add(function update_button(){
            button.updateState();
        })

    }
        
}
