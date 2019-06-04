/*
 *	A library of collision detections
 *    
 *	Works hand-in-hand with pixi.js
 *
 *  Author: cycnus studio
 *  Date: May 12, 2019
 *
 */

const ROUNDS  = 20;

function move(sprite, distance, obstacles){

	// Moves sprite, also returns whether or not it hit a wall/obstacle

	let original = {
		x: sprite.position.x,
		y: sprite.position.y,
	}

	sprite.position.x += sprite.vx * distance;
	sprite.position.y += sprite.vy * distance;

	if(hit_wall(sprite, obstacles) == false)
		return [sprite, false];

	let return_id = hit_wall(sprite, obstacles, true);

	if(sprite.isBullet != true){
		sprite.position = original;

		// Binary search for maximum distance (x and y are done independently)

		let ratio_x, ratio_y;

		ratio_x = min_dist(sprite, original, distance, obstacles, true);
		sprite.position.x = original.x + sprite.vx * distance * ratio_x;

		ratio_y = min_dist(sprite, original, distance, obstacles, false);
		sprite.position.y = original.y + sprite.vy * distance * ratio_y;
	}

	return [sprite, return_id]; 

}

function min_dist(sprite, original, distance, obstacles, is_x_axis){

	if(is_x_axis == true)
		sprite.position.x = original.x + sprite.vx * distance * 1e-5;
	else
		sprite.position.y = original.y + sprite.vy * distance * 1e-5;

	if(hit_wall(sprite, obstacles) == true)
		return 0;

	let low = 0;
	let high = 1 + 1e-5;
	let mid;

	for(let iterations = 0; iterations < ROUNDS; iterations++){
		
		mid = (low + high) / 2;

		if(is_x_axis == true)
			sprite.position.x = original.x + sprite.vx * distance * mid;
		else
			sprite.position.y = original.y + sprite.vy * distance * mid;

		if(hit_wall(sprite, obstacles) == true)
			high = mid;
		else
			low = mid;

	}

	return low;

}

function hit_wall(sprite, obstacles, return_id = false){

    // Checks sprite (enemy or player) has hit a wall

    let s_width  = sprite.width;
    let s_height = sprite.height;

    if(sprite.x <= PADDING + 1)
        return true;

    if(sprite.y <= PADDING + 1)
        return true;

    if(sprite.x + s_width >= WIDTH - PADDING)
        return true;

    if(sprite.y + s_height >= HEIGHT - PADDING)
        return true;

    // Obstacle check
    
    for(let polygon_ID = 0; polygon_ID < obstacles.length; polygon_ID++){

    	if(obstacles[polygon_ID].dead == true)
    		continue;

    	if(sprite.isBullet == true){

    		if(obstacles[polygon_ID].isObstacle != true){

		    	if(sprite.isPlayerShot == true && obstacles[polygon_ID].isUser == true)
					continue;
				if(sprite.isPlayerShot == false && obstacles[polygon_ID].isUser == false)
					continue;

			}
		}

        if(in_polygon(sprite, obstacles[polygon_ID]) == true){
        	if(return_id == true)
        		return polygon_ID;
            return true;
		}
    }

    return false;

}

function ccw(a, b, c){
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

function isVisible(a, b, isSprite = true){
    
    // Checks whether two objects are in visible sight
    
    if(isSprite == true){
        a = a.position;
        b = b.position;
    }
    
    for(let polygon of obstacles){
        
        if(!polygon.isObstacle)
            continue;
        
        for(let point = 2; point < polygon.points.length; point += 2){
            let c = {
                x: polygon.points[point - 2] + polygon.x,
                y: polygon.points[point - 1] + polygon.y,
            }
            let d = {
                x: polygon.points[point] + polygon.x,
                y: polygon.points[point + 1] + polygon.y,
            }
            if(ccw(a, c, d) != ccw(b, c, d) && ccw(a, b, c) != ccw(a, b, d))
                return false;
        }

    }
    
    return true;
    
}


function in_polygon(sprite, polygon){

	let area;

	if(sprite.isBullet == polygon.isBullet){
		if(sprite.spriteID == polygon.spriteID && polygon.spriteID != null){
			return false;
		}
	}

	if(sprite.isPlayerShot == true && polygon.isUser == true)
		return false;

	if(polygon.isPlayer == true){
		area = polygon.hitArea;
	} else {
		area = polygon;
	}

	//console.log(polygon)

	if(sprite.height < 5)
		return area.contains(sprite.position.x - polygon.x, sprite.position.y - polygon.y);

	let directions = [
		[0, 0], [0, 1],
		[1, 0], [1, 1]
	]

	for(let [off_x, off_y] of directions){
		if(area.contains(sprite.position.x - polygon.x + off_x * sprite.width - off_x, sprite.position.y - polygon.y + off_y * sprite.height - off_y))
			return true;
	}

	return false;

}


function hit_bullet(sprite, bullets){
	
	for(let bullet of bullets){
		if(bullet.isPlayerShot == true && sprite.isUser == true)
			continue;
		if(bullet.isPlayerShot == false && sprite.isUser == false)
			continue;
		if(sprite.hitArea.contains(bullet.position.x - sprite.position.x, bullet.position.y - sprite.position.y))
			return true;
	}
	
	return false;
	
}
