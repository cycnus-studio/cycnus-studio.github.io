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

		//[(WIDTH - BLOCK_LENGTH) / 2, PADDING + BUFFER_LENGTH],
		//[(WIDTH - BLOCK_LENGTH) / 2, HEIGHT - BUFFER_LENGTH - BLOCK_LENGTH - PADDING],
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

 		if(node == tgt || isVisible(player, enemy)){

 			if(first == -1 || isVisible(player, enemy))
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

	enemy.vx = 4 * Math.cos(angle);
	enemy.vy = 4 * Math.sin(angle);

 	return enemy;

 }

 function generateEnemy(type, obstacles){
	 
	let enemy = new PIXI.Graphics();
    enemy.lineStyle(1, 0x737373, 1);
    enemy.beginFill(0xf2f2f2); // Set colour here
    enemy.drawRect(0, 0, SPRITE_SIZE * 2, SPRITE_SIZE * 2);
    enemy.endFill();
    enemy.position.set(0, 0);
	enemy.anchor = {x: 0.5, y: 0.5};
	enemy.vx = 1;
	enemy.vy = 0;
	enemy.type = type;
	enemy.isPlayer = true;
	enemy.isUser = false;

	enemy.shots = 3;
	enemy.previousShot = 0;

	enemy.hitArea = new PIXI.Polygon([0, 0, SPRITE_SIZE * 2, 0, SPRITE_SIZE * 2, SPRITE_SIZE * 2, 0, SPRITE_SIZE * 2]);
	
	
	// pop up? scale up? appear from wall?

	do {
		enemy.position.x = Math.floor(Math.random() * (WIDTH - PADDING - enemy.width) + PADDING);
		enemy.position.y = Math.floor(Math.random() * (HEIGHT - PADDING - enemy.height) + PADDING);
	} while(hit_wall(enemy, obstacles) == true);

	//console.log(enemy.position.x);
	
	return enemy;
	
 }
