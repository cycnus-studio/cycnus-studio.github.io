/*
 *  A library of collision detections for shapes, sprites, polygons, circles, and points.
 *
 *  Author: Cycnus Studio
 *  Date: May 12th, 2019
 *
 */

function move(sprite, distance){

    /*
        
        Moves a sprite given the maximum distance and list of obstacles to watch out for.

        [Input]
            sprite    => The sprite (player, enemy, bullets, or boss)
            distance  => An integer representing the maximum distance the sprite can move

        [Output]
            sprite    => The sprite after it has moved
            integer   => The position/index of the object the sprite has hit (If it does hit) 

    */

    // Keep a copy of sprite positions

    let original = {
        x: sprite.position.x,
        y: sprite.position.y,
    }

    // "Moves" the sprite, checks if it hits anything
    // Slowing down factor is also taken into account for all enemies and their bullets

    sprite.position.x += sprite.vx * distance * (sprite.isUser === true || sprite.isPlayerShot === true ? 1 : slowing_factor);
    sprite.position.y += sprite.vy * distance * (sprite.isUser === true || sprite.isPlayerShot === true ? 1 : slowing_factor);

    // If it doesn't hit anything, then it's all clear for it to move as far as it can.

    if(hit_obstacle(sprite) == false)
        return [sprite, false];

    // Save the object that the sprite hit

    let return_id = hit_obstacle(sprite, true);

    // Get the furthest distance the sprite can move without hitting a wall

    // If it's a bullet then there is no need for that, since they explode on impact.

    if(sprite.isBullet != true){

        // Reset sprite position to what it was before

        sprite.position = original;

        // Binary search for maximum distance it can move without hitting a wall (x and y coordinates are done independently)

        // The reason this works is that we notice if point x hits an obstacle, then point (x + 1) will hit the obstacle as well, giving a convex function to binary search on.

        // An edge case would be an object that is smaller than the max distance (ie a bullet), but that is checked differently and will not apply here.

        let ratio_x = min_dist(sprite, original, distance, true);

        // Move along the x-axis

        sprite.position.x = original.x + sprite.vx * distance * ratio_x;

        let ratio_y = min_dist(sprite, original, distance, false);

        // Move along the y-axis

        sprite.position.y = original.y + sprite.vy * distance * ratio_y;

        // And now the sprite should have moved to its furthest.

    }

    return [sprite, return_id]; 

}

function min_dist(sprite, original, distance, is_x_axis){

    /*
        
        Grabs the maximum distance a sprite can move.

        [Input]
            sprite    => The sprite (player, enemy, bullets, or boss)
            original  => The original position of the sprite
            distance  => The unit of distance the sprite can move.
            is_x_axis => A boolean to check if we are only binary searching for the x-axis (false would be the y-axis).

        [Output]
            float => A portion of the max distance the sprite can move without hitting ay obstacles.

        Time complexity is O(k), where k is the number of obstacles

    */

    // Checks if the sprite can even move at all, this happens frequently if a sprite is right against a wall or another enemy and avoids the binary search

    if(is_x_axis == true)
        sprite.position.x = original.x + sprite.vx * distance * 1e-5;
    else
        sprite.position.y = original.y + sprite.vy * distance * 1e-5;

    if(hit_obstacle(sprite) == true)
        return 0;

    // Set min/max ratio

    let low = 0;
    let high = 1 + 1e-5;
    let mid;

    // Binary search for a specified amount of iterations (BINARY_SEARCH_ROUNDS is set to 20, leaving a precision of ~1e-5)

    for(let iterations = 0; iterations < BINARY_SEARCH_ROUNDS; iterations++){
        
        mid = (low + high) / 2;

        // Modify sprite position as needed for testing

        if(is_x_axis == true)
            sprite.position.x = original.x + sprite.vx * distance * mid;
        else
            sprite.position.y = original.y + sprite.vy * distance * mid;

        // Checks if it hits a wall as specified with binary search

        if(hit_obstacle(sprite) == true)
            high = mid;
        else
            low = mid;

    }

    return low;

}

function hit_obstacle(sprite, return_id = false){

    /*
        
        Checks if a sprite has hit a wall/obstacle

        [Input]
            sprite    => The sprite (player, enemy, bullets, or boss)
            return_id => A boolean to check if the function should return the index of the hit obstacle

        [Output]
            boolean/index => The position/index of the object the sprite has hit (If it does hit). Otherwise it returns false.

        Time complexity is O(k), where k is the number of obstacles

    */

    // Checks sprite (enemy or player) has hit a wall

    let s_width  = sprite.width;
    let s_height = sprite.height;

    if(sprite.x <= PADDING + 1) // Has it hit the left wall?
        return true;

    if(sprite.y <= PADDING + 1) // Has it hit the top wall?
        return true;

    if(sprite.x + s_width >= WIDTH - PADDING) // Has it hit the right wall?
        return true;

    if(sprite.y + s_height >= HEIGHT - PADDING) // has it hit the bottom wall?
        return true;

    // Checks if it has hit any obstacles
    
    for(let polygon_ID = 0; polygon_ID < obstacles.length; polygon_ID++){

        // Some enemies could be dead at this point, make sure other sprites don't "hit" them.

        if(obstacles[polygon_ID].dead == true)
            continue;

        // Don't check if this obstacle is a "ghost" (the orange-coloured enemies) since those are invisible

        if(sprite.is_ghost != (obstacles.is_ghost == true) && sprite.is_ghost == true)
            continue;

        // Edge case for bullets, bullets originate at their respective sprites, so it must be considered "invisible" to them.

        if(sprite.isBullet == true){

            if(obstacles[polygon_ID].isObstacle != true){

                // Player bullets can't kill player
                // Enemy bullets can't kill enemies

                if(sprite.isPlayerShot == true && obstacles[polygon_ID].isUser == true)
                    continue;
                if(sprite.isPlayerShot == false && obstacles[polygon_ID].isUser == false)
                    continue;

            }
        }

        // Check if sprite intersects with obstacle

        if(intersectPolygon(sprite, obstacles[polygon_ID]) == true){

            if(return_id == true) // Returns hit obstacle as needed
                return polygon_ID;

            return true;

        }
    }

    return false;

}

function ccw(a, b, c){

    /*
        
        Checks if 3 given points are in counter-clockwise order

        [Input]
            a => Point A as a vector (x and y coordinates)
            b => Point B as a vector (x and y coordinates)
            c => Point C as a vector (x and y coordinates)

        [Output]
            boolean => Checks if A, B, C are clockwise.

    */

    // This formula does the cross product of the vectors (c - a) and (b - a)

    // Let A represent (c - a)
    // Let B represent (b - a)

    // The cross product of A and B is equal to |A| * |B| * sin(theta), where theta is the angle formed by A and B.

    // sin(theta) is important, because the cross product is only positive IFF theta < 180 from sin(theta), giving counter-clockwise

    // More info and source: https://algs4.cs.princeton.edu/91primitives/

    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

function linesIntersect(a, b, c, d){

    /*
        
        Checks if 2 line segments intersect each other

        Line segment 1's endpoints are point a and b
        Line segment 2's endpoints are point c and d

        [Input]
            a => Point A as a vector (x and y coordinates)
            b => Point B as a vector (x and y coordinates)
            c => Point C as a vector (x and y coordinates)
            d => Point D as a vector (x and y coordinates)

        [Output]
            boolean => Checks if two line segments intersect each other.

    */

    // Grab one line segment, check if the other line segment's endpoints are on opposite sides

    // Opposite sides in this case represent one forming a counter-clockwise angle and the other forming a clockwise angle.

    /*
        This becomes more obvious in a diagram:
    
            a
            |
        c-------d
            |
            b

        If (a, b, c) is clockwise, then (a, d, b) must be counter-clockwise in order for an intersection

    */

    /*
        Checking one segment isn't enough:
    
            a
            |
            |
            b

        c-------d

        While it satisfies the previous conditions, both (a, b) are on the same side of segment (c, d).
        We can fix this by checking both line segments instead.

    */

    // More info can be found here: http://jeffe.cs.illinois.edu/teaching/373/notes/x06-sweepline.pdf

    return ccw(a, c, d) != ccw(b, c, d) && ccw(a, b, c) != ccw(a, b, d);
}

function isVisible(a, b){

    /*
        
        Checks whether two objects/sprites are visible to each other with no obstacle obstructing the view.

        [Input]
            a => Sprite A's vector (x and y coordinates)
            b => Sprite B's vector (x and y coordinates)

        [Output]
            boolean => Checks if two points don't intersect any obstacles.

    */
    
    for(let polygon of obstacles){

        // Ignore enemies as obstacles
        
        if(!polygon.isObstacle)
            continue;

        // Check if polygon is blocking.

        // Let A represent the line segment between point A and B.

        // The sprites will only see each other IFF A is not intersecting with any polygons

        // We can simplify this by checking if A is intersecting with a polygon's edges
        
        for(let point = 0; point < polygon.points.length; point += 2){

            // Get the edges of the polygon

            let c = {
                x: polygon.points[point] + polygon.x,
                y: polygon.points[point + 1] + polygon.y,
            };

            let d = {
                x: polygon.points[(point + 2) % polygon.points.length] + polygon.x, // Modulo used to prevent indexing outside of the points of the polygon
                y: polygon.points[(point + 3) % polygon.points.length] + polygon.y,
            }

            // Check for intersection

            if(linesIntersect(a, b, c, d))
                return false;

        }

    }
    
    return true;
    
}

function isFullyVisible(a, b){

    /*
        
        Checks whether two objects/sprites are *fully* visible to each other with no obstacle obstructing the view.

        The difference is that isFullyVisible takes account of sprite width and height.

        [Input]
            a => Sprite A
            b => Sprite/Vector B

        [Output]
            boolean => Checks if two sprites are completely visible to each other.

    */

    for(let sprite_point = 0; sprite_point < a.hitArea.points.length; sprite_point += 2){

        // Go through all vertices of the sprite's polygon
        
        let point_a = {
            x: a.hitArea.points[sprite_point]     + a.position.x,
            y: a.hitArea.points[sprite_point + 1] + a.position.y,
        };

        // If b is a polygon as well we need to go through its vertices

        if(b.hitArea != null) {

            // Go through b's vertices

            for(let point = 0; point < b.hitArea.points.length; point += 2){
                
                let point_b = {
                    x: b.hitArea.points[point] + b.position.x,
                    y: b.hitArea.points[point + 1]  + b.position.y,
                };

                // Check if both points are visible
                
                if(isVisible(point_a, point_b, false) == false)
                    return false;
            }

        } else if(isVisible(point_a, b, false) == false){

            return false;

        }
        
    }

    return true;

}

function intersectPolygon(sprite, polygon){

    /*
        
        Checks whether two objects/sprites are intersecting each other.

        [Input]
            sprite  => A given sprite (player, enemy, bullet, boss)
            polygon => A polygon of an obstacle (enemy, obstacle)

        [Output]
            boolean => Checks if the two objects are intersecting each other.

    */

    if(sprite.isBullet == polygon.isBullet){

        // Ignore bullet - bullet collision
        // Also ignore shooter - bullet collision

        if(sprite.spriteID == polygon.spriteID && polygon.spriteID != null){
            return false;
        }

    }

    // Ignore player/bullet collision

    if(sprite.isPlayerShot == true && polygon.isUser == true)
        return false;

    // Grab polygon/hitbox of the sprites and obstacles

    let polygon_a = sprite.hitArea;
    let polygon_b = polygon;

    if(polygon.isPlayer == true)
        polygon_b = polygon.hitArea;

    // If it's a bullet, we can just check the point itself

    if(sprite.height <= 6)
        return polygon_b.contains(sprite.position.x - polygon.x, sprite.position.y - polygon.y);
    
    for(let sprite_point = 0; sprite_point < polygon_a.points.length; sprite_point += 2){

        // Grab the edges of both polygons, then check if they intersect

        // Intersecting polygons will always have at least one pair of intersecting edges

        // The only side effect is if a polygon is inside of the other (We can fix this by checking if the points are inside of the other shape)
        
        let a = {
            x: polygon_a.points[sprite_point]     + sprite.position.x,
            y: polygon_a.points[sprite_point + 1] + sprite.position.y,
        };
        
        let b = {
            x: polygon_a.points[(sprite_point + 2) % polygon_a.points.length] + sprite.position.x,
            y: polygon_a.points[(sprite_point + 3) % polygon_a.points.length] + sprite.position.y,
        };

        for(let point = 0; point < polygon_b.points.length; point += 2){

            // Grab edges of the other polygon
            
            let c = {
                x: polygon_b.points[point]     + polygon.x,
                y: polygon_b.points[point + 1] + polygon.y,
            };
            
            let d = {
                x: polygon_b.points[(point + 2) % polygon_b.points.length] + polygon.x,
                y: polygon_b.points[(point + 3) % polygon_b.points.length] + polygon.y,
            };

            // Check for intersection
            
            if(linesIntersect(a, b, c, d))
                return true;
        }

        // Check if sprite is inside of obstacle (check for both points)

        if(polygon_b.contains(a.x - polygon.x, a.y - polygon.y))
            return true;

        if(polygon_b.contains(b.x - polygon.x, b.y - polygon.y))
            return true;
        
    }

    if(sprite.isBoss === true){

        // Check if obstacle/enemy is inside of sprite (This happens when you're generating a boss)

        for(let point = 0; point < polygon_b.points.length; point += 2){
                
            let a = {
                x: polygon_b.points[point]     + polygon.x,
                y: polygon_b.points[point + 1] + polygon.y,
            };
                
            if(polygon_a.contains(a.x - sprite.position.x, a.y - sprite.position.y))
                return true;

        }

    }

    return false;

}

function in_radius(circle_x, circle_y, radius, sprite){

    /*
        
        Checks whether a circle intersects with a sprite.

        [Input]
            circle_x => X coordinate of the circle
            circle_y => Y coordinate of the circle
            radius   => Radius/size of the circle
            sprite   => A given sprite (player, enemy, bullet, boss)

        [Output]
            boolean => Checks if the circle intersects with the sprite.

    */

    let hitbox = sprite.hitArea;

    for(let sprite_point = 0; sprite_point < hitbox.points.length; sprite_point += 2){

        // Go through the edges of the hitbox of the sprite

        // Check if the line's closest point to the (x, y) coordinate of the circle is less than radius

        let a = {
            x: hitbox.points[sprite_point]     + sprite.position.x,
            y: hitbox.points[sprite_point + 1] + sprite.position.y,
        };
        
        let b = {
            x: hitbox.points[(sprite_point + 2) % hitbox.points.length] + sprite.position.x,
            y: hitbox.points[(sprite_point + 3) % hitbox.points.length] + sprite.position.y,
        };

        // Explanation by Paul Bourke at http://paulbourke.net/geometry/pointlineplane/

        let magnitude = ((circle_x - a.x) * (b.x - a.x) + (circle_y - a.y) * (b.y - a.y)) / ((a.x - b.x)**2 + (a.y - b.y)**2);

        // Keep magnitude in between [0, 1]

        if(magnitude < 0)
            magnitude = 0;
        if(magnitude > 1)
            magnitude = 1;

        // Get the closest point

        let closest = {
            x: a.x + magnitude * (b.x - a.x),
            y: a.y + magnitude * (b.y - a.y)
        }

        // Check distance is less than circle radius, indicating that the circle intersects

        if(Math.hypot(closest.x - circle_x, closest.y - circle_y) < radius){
            return true;
        }

    }

    return false;

}
