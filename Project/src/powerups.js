let freeze = function(){

	if(slowing_factor != 1)
		return;

	freeze_duration = 500;
	slowing_factor  = 1;

};

let generateMines = function(){

	if(mines_left != 0)
		return;

	mines_left = 3;

	for(let mine_counter = 0; mine_counter < MINES_COUNT; mine_counter++){

		let points = new Array(32).fill(0);
		let side_length = 30;
		let angle = 0;

		for(let side = 0; side < points.length; side += 4){

			let x = Math.cos(angle * Math.PI / 180) * side_length;
			let y = Math.sin(angle * Math.PI / 180) * side_length;

			points[side] = x;
			points[side + 1] = y;

			let dist = side_length * Math.cos(45 * Math.PI / 180) / Math.cos(22.5 * Math.PI / 180);

			x = Math.cos((angle + 22.5) * Math.PI / 180) * dist;
			y = Math.sin((angle + 22.5) * Math.PI / 180) * dist;

			points[side + 2] = x;
			points[side + 3] = y;

			angle += 45;

		}

		let mine = new PIXI.Graphics();

		mine.lineStyle(5, WHITE);
		mine.drawPolygon(points);

		mine.hit_radius = 20;
		mine.blast_radius = 60;

		mine.hitArea = new PIXI.Polygon(points);

		do {
			mine.position.x = Math.floor(Math.random() * (WIDTH - PADDING - mine.width) + PADDING + mine.width);
			mine.position.y = Math.floor(Math.random() * (HEIGHT - PADDING - mine.height) + PADDING + mine.height);
		} while(hit_wall(mine, obstacles) == true);

		mine.scale.set(1e-2, 1e-2);
		mine_container.addChild(mine);
		mines.push(mine);

	}

};

let laser_count = 0;

let activateLaser = function(){

	if(enemies_left <= 0 || laser_count > 0)
		return;

	laser_count++;

	let laser = new PIXI.Graphics();

	laser.position.set(PADDING, PADDING + 2);

	laser.lineStyle(5, sprite.colour)
		 .moveTo(0, 0)
		 .lineTo(WIDTH - PADDING * 2, 0);

	zone.addChild(laser);

	let shot = new Array(enemies.length).fill(false);
	let total_killed = 0;

	app.ticker.add(function destroy(){

		laser.position.y += (HEIGHT - PADDING - laser.position.y) / 24;

		for(let enemy_ID = 0; enemy_ID < enemies.length; enemy_ID++){

			if(enemies[enemy_ID].dead === true)
				continue;

			if(shot[enemy_ID] == true)
				continue;

			if(enemies[enemy_ID].position.y - enemies[enemy_ID].height * 0.5 < laser.position.y){

				shot[enemy_ID] = true;
				
				enemies[enemy_ID].lose_hp(1);

    		}

    	}


		if(HEIGHT - PADDING - laser.position.y < 5){
			app.ticker.remove(destroy);

			app.ticker.add(function fade(){

				laser.alpha -= laser.alpha / 4;

				if(laser.alpha < 1e-3){
					zone.removeChild(laser);
					laser.visible = false;
					app.ticker.remove(fade);
				}

			});

			enemies_left -= total_killed;
			user_score += 25 * total_killed;
			point_title.update();
			laser_count--;

		}

	});

}

/*

	Buttons for powerups

*/


const POWERUP_FUNCTIONS = [freeze, generateMines, activateLaser];

class Powerup {

    constructor(button_normal, button_down, button_up, button_disabled, position, powerup_function, baseline_points) {
        
        let texture = PIXI.loader.resources[button_normal].texture;

        this.button = new PIXI.Sprite(texture);
        
        this.button.interactive = true; 
        this.button.buttonMode = true;

        this.button._button_texture = texture;
        this.button._button_texture_down = PIXI.loader.resources[button_down].texture;
        this.button._button_texture_over = PIXI.loader.resources[button_up].texture;
        this.button._button_texture_disabled = PIXI.loader.resources[button_disabled].texture;
    
        // add the other stuff here (make sure to use the this. prefix for ALL VARIABLES)
        
        this.button.width = 80;
        this.button.height = 80;
        this.button.x = position;
        this.button.y = 710;

        this.button.is_down = false;
        this.button.is_over = false;

        this.button.powerup_function = powerup_function;
        this.button.baseline_points = baseline_points;
        
        zone.addChild(this.button);
        
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
        this.is_down = true;
        this.texture = this._button_texture_down;
        this.alpha = 1;

        if(user_score >= this.baseline_points){
            this.powerup_function();
            user_score -= 150;
            point_title.update();
        }

    }

    onButtonUp() {
        this.is_down = false;
        if (this.is_over) {
            this.texture = this._button_texture_over;
        } else {
            this.texture = this._button_texture;
        }
    }

    onButtonOver() {
        this.is_over = true;
        if (this.is_down) {
            return;
        }
        this.texture = this._button_texture_over;
    }

    onButtonOut() {
        this.is_over = false;
        if (this.is_down) {
            return;
        }
        this.texture = this._button_texture;
    }

    updateState() {

    	if(user_score >= this.button.baseline_points){
            this.button.texture = this.button._button_texture;
        } else {
        	this.button.texture = this.button._button_texture_disabled;
        }

    }

}

function setup_powerups() {
    
    for(let button_ID = 0; button_ID < POWER_NAMES.length; button_ID++) {
        
        let powerup_name = POWER_NAMES[button_ID];
        let button_position = BUTTON_POSITIONS[button_ID];
        let activating_function = POWERUP_FUNCTIONS[button_ID];
        let base_score = BASE_POWERUP_SCORES[button_ID];

        let button = new Powerup(`https://cycnus-studio.github.io/Project/img/${powerup_name}Button.png`,
            `https://cycnus-studio.github.io/Project/img/${powerup_name}ButtonDown.png`,
            `https://cycnus-studio.github.io/Project/img/${powerup_name}ButtonOver.png`,
            `https://cycnus-studio.github.io/Project/img/${powerup_name}ButtonDisabled.png`, 
            button_position,
            activating_function,
            base_score);

        app.ticker.add(function update_button(){
        	button.updateState();
        })

    }
        
}
