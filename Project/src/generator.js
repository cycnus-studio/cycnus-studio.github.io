/*
 *	A library of map and enemy generator
 *    
 *	Works hand-in-hand with pixi.js
 *
 *  Author: cycnus studio
 *  Date: May 14, 2019
 *
 */
 
 const BLOCK_LENGTH  = 80;
 
 const BUFFER_LENGTH = 100;
 
 const WALL_LENGTH   = WIDTH - BUFFER_LENGTH * 4.5 - PADDING * 2 - BLOCK_LENGTH * 2;
 
 const WALL_BUFFER   = (WIDTH - WALL_LENGTH) / 2;
 
 
 function get_obstacles(){
	 
	// Make corner squares
	
	let PLACEMENTS = [
		[PADDING + BUFFER_LENGTH,                        PADDING + BUFFER_LENGTH],
		[WIDTH - BUFFER_LENGTH - BLOCK_LENGTH - PADDING, PADDING + BUFFER_LENGTH],
		[PADDING + BUFFER_LENGTH,                        HEIGHT - BUFFER_LENGTH - BLOCK_LENGTH - PADDING],
		[WIDTH - BUFFER_LENGTH - BLOCK_LENGTH - PADDING, HEIGHT - BUFFER_LENGTH - BLOCK_LENGTH - PADDING]
	];
	
	let WALL_PLACEMENTS = [
		[WALL_BUFFER,     PADDING + BUFFER_LENGTH + BLOCK_LENGTH * 0.25],
		[WALL_BUFFER,     HEIGHT - BUFFER_LENGTH - BLOCK_LENGTH * 0.75 - PADDING]
	]
	
	let obstacles = [];

	for(let [x, y] of PLACEMENTS){
		
		let shape = {
			is_square: true,
			size: BLOCK_LENGTH,
			x: x,
			y: y,
			points: [0, 0, BLOCK_LENGTH, 0, BLOCK_LENGTH, BLOCK_LENGTH, 0, BLOCK_LENGTH]
		}
		
		obstacles.push(shape);
		
	}
	
	for(let [x, y] of WALL_PLACEMENTS){
		
		let shape = {
			is_square: false,
			size: BLOCK_LENGTH,
			x: x,
			y: y,
			points: [0, 0, WALL_LENGTH, 0, WALL_LENGTH, BLOCK_LENGTH / 2, 0, BLOCK_LENGTH / 2]
		}
		
		obstacles.push(shape);
		
	}
	
	return obstacles;
	
 }
 
 
 // Generate enemies
 
 
const POINTS = [
	[150, 145],
	[345, 145],
	[150, 330],
	[345, 330],
	
	[850,  145],
	[1050, 145],
	[850,  330],
	[1050, 330],
	
	[150, 460],
	[345, 460],
	[150, 640],
	[345, 640],
	
	[850,  460],
	[1050, 460],
	[850,  640],
	[1050, 640],
	
	[605, 330],
	[605, 460],

	[605, 145],
	[605, 640]
]

 function getZone(sprite){
	
	let best = [1e9, 0];
	
 	for(let vertex = 0; vertex < POINTS.length; vertex++){
		
		let dist = Math.hypot(POINTS[vertex][0] - sprite.position.x, POINTS[vertex][1] - sprite.position.y);
        
        let pointA = {
            x: POINTS[vertex][0],
            y: POINTS[vertex][1],
            hitArea: null
        }
		
		if(dist < best[0] && isFullyVisible(sprite, pointA))
			best = [dist, vertex];
		
	}
	
	return [best[0], best[1] + 1];

 }

 function getPath(player, enemy){

 	let [dist, src] = getZone(enemy);
 	let tgt = getZone(player)[1];

 	let queue = [[src, -1]];

 	//console.log("ENEMY: ", src);

 	let tgt_pos = {
 		x: player.position.x,
 		y: player.position.y
 	}

 	if(enemy.isBoss == true){

	 	if(dist < 25)
	 		enemy.nextZone = -1;
	 	else if(enemy.nextZone != -1)
	 		[tgt_pos.x, tgt_pos.y] = POINTS[enemy.nextZone - 1];

	}

 	let adj = [
 		[2, 3],
 		[1, 4, 19],
 		[1, 4, 9],
 		[2, 3, 10, 17],
 		[6, 7, 19],
 		[5, 8],
		[5, 8, 13, 17],
 		[6, 7, 14],
		[3, 10, 11],
		[4, 9, 12, 18],
		[9, 12],
		[10, 11, 20],
		[7, 14, 15, 18],
		[8, 13, 16],
		[13, 16, 20],
		[14, 15],
		[4, 7, 18],
		[10, 13, 17],
		[2, 5],
		[12, 15]
 	];
    

    if(enemy.isBoss === false || (enemy.nextZone == -1 || isFullyVisible(enemy, tgt_pos) == false)){

	    let visited = new Array(30);

	 	while(queue.length != 0){
	 		
	 		let [node, first] = queue.shift();

	 		if(node == tgt || isFullyVisible(player, enemy) || enemy.is_ghost == true){

	 			if(first == -1 || isFullyVisible(player, enemy) || enemy.is_ghost == true)
	 				break;

	 			//console.log(first);

	 			[tgt_pos.x, tgt_pos.y] = POINTS[first - 1];
	 			enemy.nextZone = first;

	 			break;

	 		}

	 		for(let next of adj[node - 1]){
	            
	            if(visited[next] == 1)
	                continue;
	            
	            visited[next] = 1;
	            
	 			if(first == -1)
	 				queue.push([next, next]);
	 			else
	 				queue.push([next, first]);
	 		}

	 	}

	}

 	let angle = Math.atan2(tgt_pos.y - enemy.position.y, tgt_pos.x - enemy.position.x);

	enemy.vx = slowing_factor * enemy.max_veloc * Math.cos(angle);
	enemy.vy = slowing_factor * enemy.max_veloc * Math.sin(angle);

 	return enemy;

 }

 function getPolygonPoints(sides, radius){

 	// Since it's a regular polygon, just pick equal distance points of the circumference.

 	let points = [];
 	let offset = Math.random() * Math.PI;

 	for(let side = 0; side < sides; side++){
 		let x, y;

 		x = radius * Math.cos(2 * Math.PI * side / sides + offset);
 		y = radius * Math.sin(2 * Math.PI * side / sides + offset);

 		points.push(x); points.push(y);

 	}

 	return [offset, points];

 }
 
 function getAttributes(type, colour){
	
	let attributes = {
		colour: COLOURS[colour],
		hp: 1,             // Baseline HP
		speed: 3.5,        // Baseline Speed 
		bullet_speed: 4,   // Basline Bullet Speed
		is_explode: false, // If they can detonate by will
		is_ghost: false,   // Can go through walls
		explode_on_death: false, // Will explode when killed
	}

	// Shape Attributes

	if(type == "triangle"){

		attributes.bullet_speed += 0.6;
		attributes.speed += 0.8;

	} else if(type == "square"){

		attributes.hp += 1;

	} else if(type == "pentagon"){

		attributes.speed += 0.2;
		attributes.hp += 1;
		attributes.is_explode = true;
		attributes.explode_on_death = true;

	} else if(type == "hexagon"){

		attributes.hp += 2;
		attributes.speed -= 0.8;

	}

	// Colour Attributes

	if(colour == 7){ // Yellow

		attributes.bullet_speed += 0.6;
		attributes.speed += 0.6;

	} else if(colour == 8){ // Green

		attributes.hp += 1;

	} else if(colour == 9){ // Blue

		attributes.speed += 1.2;
		attributes.bullet_speed -= 0.3;

	} else if(colour == 10){ // Purple

		attributes.hp += 1;
		attributes.speed += 0.6;

	} else if(colour == 11){ // Red

		attributes.explode_on_death = true;

	} else if(colour == 12){ // Orange

		attributes.is_ghost = true;

	}

	return attributes;

 }

 function generateEnemy(type, colour, obstacles){

 	let attributes = getAttributes(type, colour);

 	let points = getPolygonPoints(ENEMY_TYPES.indexOf(type) + 3, SPRITE_SIZE * 1.5)[1];
	 
	let enemy = new PIXI.Graphics();
    
    enemy.beginFill(attributes.colour == WHITE ? BLACK : attributes.colour);
	enemy.lineStyle(rand_range(2, 6), WHITE);
    enemy.drawPolygon(points);
    enemy.endFill();

    enemy.position.set(0, 0);
	enemy.anchor = {x: 0, y: 0};

	enemy.vx = enemy.vy = 0;
	enemy.type = type;
	enemy.isPlayer = true;
	enemy.isUser = false;
	
	enemy.hp = enemy.max_hp = attributes.hp;
	enemy.max_veloc = attributes.speed;
	enemy.bullet_speed = attributes.bullet_speed;

	enemy.colour = attributes.colour;

	enemy.is_explode = attributes.is_explode;
	enemy.explode_on_death = attributes.explode_on_death;
	enemy.is_ghost = attributes.is_ghost;

	enemy.shots = 3;
	enemy.previousShot = 0;

	enemy.hitArea = new PIXI.Polygon(points);
	enemy.nextZone = -1;

	enemy.lose_hp = function(damage, explosion_radius = 40) {

		this.hp -= damage;

		if(this.hp <= 0){

			if(this.explode_on_death == true){

				explode(this.position.x, this.position.y, explosion_radius, this.colour)

		        // Kill player if in radius

		        if(in_radius(this.position.x, this.position.y, explosion_radius, sprite)){
		            sprite.lose_hp();
		        }

		    }

		    let enemy = this;

		    user_score += ENEMY_BONUS;
			point_title.update();

			app.ticker.add(function pop(delta){
				enemy.scale.x /= 1.2;
				enemy.scale.y /= 1.2;

				if(enemy.scale.x < 0.01){

					enemy.visible = false;
					enemies_left--;

					zone.removeChild(enemy);
					app.ticker.remove(pop);
				}

			});

			this.dead = true;
		}
		
	}

	do {

		enemy.position.x = rand_range(PADDING + enemy.width, WIDTH - PADDING - enemy.width);
		enemy.position.y = rand_range(PADDING + enemy.height, HEIGHT - PADDING - enemy.height);

	} while(hit_wall(enemy, obstacles) == true);

	//console.log(enemy.position.x);

	enemy.scale.set(1e-5, 1e-5);
	enemy.generation_rate = Math.random() * 9 + 5;
	
	return enemy;
	
 }
 
 
 function generateBoss(type, colour, obstacles){

 	let attributes = getAttributes(type, colour);

 	let [angle, points] = getPolygonPoints(ENEMY_TYPES.indexOf(type) + 3, BOSS_SIZE);
	 
	let enemy = new PIXI.Graphics();
    
    enemy.beginFill(attributes.colour == WHITE ? BLACK : attributes.colour);
	enemy.lineStyle(rand_range(2, 6), WHITE, 1);
    enemy.drawPolygon(points);
    enemy.endFill();

    enemy.position.set(0, 0);
	enemy.anchor = {x: 0, y: 0};

	enemy.vx = enemy.vy = 0;
	enemy.type = type;
	enemy.isPlayer = true;
	enemy.isUser = false;
	enemy.isBoss = true;
	
	enemy.hp = enemy.max_hp = attributes.hp * 5;
	enemy.max_veloc = attributes.speed * 0.7;
	enemy.bullet_speed = attributes.bullet_speed;

	enemy.is_explode = attributes.is_explode;
	enemy.explode_on_death = attributes.explode_on_death;
	enemy.is_ghost = attributes.is_ghost;

	enemy.colour = attributes.colour;
	enemy.offset  = angle;

	enemy.shots = 6;
	enemy.previousShot = 0;
	enemy.previousSpread = 0;

	enemy.hitArea = new PIXI.Polygon(points);
	enemy.nextZone = -1;


	enemy.lose_hp = function(damage, explosion_radius = 80) {

		this.hp -= damage;

		updateBossBar();

		if(this.hp <= 0){

			if(this.explode_on_death == true){

				explode(this.position.x, this.position.y, explosion_radius, this.colour)

		        // Kill player if in radius

		        if(in_radius(this.position.x, this.position.y, explosion_radius, sprite)){
		            sprite.lose_hp();
		        }

		    }

		    let enemy = this;

		    user_score += BOSS_BONUS;
			point_title.update();

			app.ticker.add(function pop(delta){

				enemy.scale.x /= 1.2;
				enemy.scale.y /= 1.2;

				if(enemy.scale.x < 0.01){

					enemy.visible = false;
					enemies_left--;

					zone.removeChild(enemy);
					app.ticker.remove(pop);
				}

			});

			this.dead = true;

			boss_bar_out();

		}

	}

	do {

		enemy.position.x = rand_range(PADDING + enemy.width, WIDTH - PADDING - enemy.width);
		enemy.position.y = rand_range(PADDING + enemy.height, HEIGHT - PADDING - enemy.height);
	
	} while(hit_wall(enemy, obstacles) == true);

	enemy.scale.set(1e-5, 1e-5);
	enemy.generation_rate = Math.random() * 9 + 5;
	
	return enemy;
 
 }
