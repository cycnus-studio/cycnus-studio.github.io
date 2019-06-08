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
 
 function randint(low, high){
	 
	let range = high - low + 1;
	
	return Math.floor(range * Math.random() + low);
	
 }
 
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
	[150, 150],
	[330, 150],
	[150, 330],
	[330, 330],
	
	[850,  150],
	[1030, 150],
	[830,  330],
	[1030, 330],
	
	[150, 460],
	[330, 460],
	[150, 640],
	[330, 640],
	
	[850,  460],
	[1030, 460],
	[830,  640],
	[1030, 640],
	
	[600, 330],
	[600, 460]
]

 function getZone(x, y){
	
	let best = [1e9, 0];
	
 	for(let vertex = 0; vertex < POINTS.length; vertex++){
		
		let dist = Math.hypot(POINTS[vertex][0] - x, POINTS[vertex][1] - y);
        
        let pointA = {
            x: POINTS[vertex][0],
            y: POINTS[vertex][1],
        }
        
        let pointB = {
            x: x,
            y: y,
        }
		
		if(dist < best[0] && isVisible(pointA, pointB, false))
			best = [dist, vertex];
		
	}
	
	return best[1] + 1;

 }

 function getPath(player, enemy){

 	let src = getZone(enemy.position.x, enemy.position.y);
 	let tgt = getZone(player.position.x, player.position.y);

 	let queue = [[src, -1]];

 	let tgt_pos = {
 		x: player.position.x,
 		y: player.position.y
 	}

 	let adj = [
 		[2, 3],
 		[1, 4, 5],
 		[1, 4, 9],
 		[2, 3, 10, 17],
 		[2, 6, 7],
 		[5, 8],
		[5, 8, 13, 17],
 		[6, 7, 14],
		[3, 10, 11],
		[4, 9, 12, 18],
		[9, 12],
		[10, 11, 15],
		[7, 14, 15, 18],
		[8, 13, 16],
		[12, 13, 16],
		[14, 15],
		[4, 7, 18],
		[10, 13, 17]
 	]
    
    let visited = new Array(30);

 	while(queue.length != 0){
 		
 		let [node, first] = queue.shift();

 		if(node == tgt || isFullyVisible(player, enemy) || enemy.is_ghost == true){

 			if(first == -1 || isFullyVisible(player, enemy) || enemy.is_ghost == true)
 				break;

 			[tgt_pos.x, tgt_pos.y] = POINTS[first - 1];

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

 	let angle = Math.atan2(tgt_pos.y - enemy.position.y, tgt_pos.x - enemy.position.x);

	enemy.vx = enemy.max_veloc * Math.cos(angle);
	enemy.vy = enemy.max_veloc * Math.sin(angle);

 	return enemy;

 }

 function getPoints(sides, radius){

 	// Since it's a regular polygon, just pick equal distance points of the circumference.

 	let points = [];
 	let offset = Math.random() * Math.PI;

 	for(let side = 0; side < sides; side++){
 		let x, y;

 		x = radius * Math.cos(2 * Math.PI * side / sides + offset);
 		y = radius * Math.sin(2 * Math.PI * side / sides + offset);

 		points.push(x); points.push(y);

 	}

 	return points;

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

		attributes.speed += 0.6;
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

 	let points = getPoints(ENEMY_TYPES.indexOf(type) + 3, SPRITE_SIZE * 1.5);
	 
	let enemy = new PIXI.Graphics();//new PIXI.Sprite(PIXI.loader.resources[`https://cycnus-studio.github.io/Project/img/triangle_${COLOUR_NAMES[colour - 6]}.png`].texture);
    
    enemy.beginFill(attributes.colour == WHITE ? BLACK : attributes.colour); // Set colour here
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
	
	
	// pop up? scale up? appear from wall?

	do {
		enemy.position.x = Math.floor(Math.random() * (WIDTH - PADDING - enemy.width) + PADDING);
		enemy.position.y = Math.floor(Math.random() * (HEIGHT - PADDING - enemy.height) + PADDING);
	} while(hit_wall(enemy, obstacles) == true);

	//console.log(enemy.position.x);

	enemy.scale.set(1e-5, 1e-5);
	enemy.generation_rate = Math.random() * 9 + 2.5;
	
	return enemy;
	
 }
 
 
 function generateBoss(type, colour, obstacles){

 	let attributes = getAttributes(type, colour);

 	let points = getPoints(ENEMY_TYPES.indexOf(type) + 3, BOSS_SIZE);
	 
	let enemy = new PIXI.Graphics();
    
    enemy.beginFill(attributes.colour == WHITE ? BLACK : attributes.colour); // Set colour here
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

	enemy.colour = attributes.colour;

	enemy.shots = 6;
	enemy.previousShot = 0;

	enemy.hitArea = new PIXI.Polygon(points);
	
	
	// pop up? scale up? appear from wall?

	do {
		enemy.position.x = Math.floor(Math.random() * (WIDTH - PADDING - enemy.width) + PADDING);
		enemy.position.y = Math.floor(Math.random() * (HEIGHT - PADDING - enemy.height) + PADDING);
	} while(hit_wall(enemy, obstacles) == true);

	//console.log(enemy.position.x);

	enemy.scale.set(1e-5, 1e-5);
	enemy.generation_rate = Math.random() * 8 + 1.5;
	
	return enemy;
 
 }
