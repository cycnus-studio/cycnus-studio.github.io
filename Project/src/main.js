/*
 *  A collection of map and enemy generators
 *
 *  Author: Cycnus Studio
 *  Date: May 14th, 2019
 *
 */
 

// Set dimentsions of obstacle sizes

const BLOCK_LENGTH  = 80; // Side length of one corner block
 
const BUFFER_LENGTH = 100; // Distance of obstacle to outer wall
 
const WALL_LENGTH   = WIDTH - BUFFER_LENGTH * 4.5 - PADDING * 2 - BLOCK_LENGTH * 2; // Lengthwise side length of middle obstacles
 
const WALL_BUFFER   = (WIDTH - WALL_LENGTH) / 2; // Distance of middle obstacle to wall

const BOSS_RESET_DISTANCE = 25; // Max distance a boss needs to be within a key point in order to move onto the next region.

// Location of the key points/regions in the map

const KEY_POINTS = [
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
];

// Adjacency list representation of the compressed graph, GRAPH[i] represents the neighbors of node i

const GRAPH = [
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


 
function get_obstacles(){
     
    /*
        
        Generates a list of in-game obstacles

        [Input]
            None

        [Output]
            array => A list of obstacles represented as objects

    */

    // Set positions of obstacles
    
    const CORNER_PLACEMENTS = [
        [PADDING + BUFFER_LENGTH,                          PADDING + BUFFER_LENGTH],
        [WIDTH   - BUFFER_LENGTH - BLOCK_LENGTH - PADDING, PADDING + BUFFER_LENGTH],
        [PADDING + BUFFER_LENGTH,                          HEIGHT  - BUFFER_LENGTH - BLOCK_LENGTH - PADDING],
        [WIDTH   - BUFFER_LENGTH - BLOCK_LENGTH - PADDING, HEIGHT  - BUFFER_LENGTH - BLOCK_LENGTH - PADDING]
    ];
    
    const WALL_PLACEMENTS = [
        [WALL_BUFFER, PADDING + BUFFER_LENGTH + BLOCK_LENGTH * 0.25],
        [WALL_BUFFER, HEIGHT - BUFFER_LENGTH - BLOCK_LENGTH * 0.75 - PADDING]
    ];
    
    let obstacles = [];

    for(let [x, y] of CORNER_PLACEMENTS){

        // Create an object of the obstacle
        
        let shape = {
            x: x,
            y: y,
            points: [0, 0, BLOCK_LENGTH, 0, BLOCK_LENGTH, BLOCK_LENGTH, 0, BLOCK_LENGTH]
        };
        
        obstacles.push(shape);
        
    }
    
    for(let [x, y] of WALL_PLACEMENTS){

        // Create an object of the obstacle
        
        let shape = {
            x: x,
            y: y,
            points: [0, 0, WALL_LENGTH, 0, WALL_LENGTH, BLOCK_LENGTH / 2, 0, BLOCK_LENGTH / 2]
        }
        
        obstacles.push(shape);
        
    }
    
    return obstacles;
    
}

function getZone(sprite){

    /*
        
        Finds the closest key zone a sprite is located in the map.

        [Input]
            sprite  => An object representing a sprite (player, enemy, boss)

        [Output]
            integer => The distance of the sprite to the closest key point
            integer => The ID representing the key point.

    */

    /*

        A point is allowed to be used IFF the sprite can move towards it (fully visible with no obstacles)

        From there we want to find the closest point, this will be very important when chasing the player.

    */

    
    let best = [1e9, 0];
    
    for(let vertex = 0; vertex < KEY_POINTS.length; vertex++){

        // Gets the euclidean distance
        
        let dist = Math.hypot(KEY_POINTS[vertex][0] - sprite.position.x, KEY_POINTS[vertex][1] - sprite.position.y);
        
        let pointA = {
            x: KEY_POINTS[vertex][0],
            y: KEY_POINTS[vertex][1]
        };

        // Check if it's a better point AND if the sprite can move towards it (or else the sprite will get stuck at a wall)
        
        if(dist < best[0] && isFullyVisible(sprite, pointA))
            best = [dist, vertex];
        
    }
    
    return [best[0], best[1] + 1];

}

function setDirection(enemy, player){

    /*
        
        Sets the direction for an enemy to move towards.

        [Input]
            enemy  => An object representing an enemy sprite (enemy, boss)
            player => An object representing the user player

        [Output]
            object => The enemy sprite with updated directions that will follow the player.

    */

    /*
        
        There a few ways to go about:

            1 - Chase player greedily (Always move towards player)

                Advantages:

                    - Easy to compute, just grab the slope.

                Disadvantages:
                    
                    - Not always efficient at getting to the player.

                    - Has no sense of obstacles, and will very easily get stuck.
                
                Overall not a good and flawed strategy.

            2 - Use one of the path-finding algorithms (Breadth-First Search, Dijkstra, A* Search)

                Advantages:

                    - Reliable, will always get shortest path.

                    - Foolproof way to get around obstacles.

                    - Around 550 000 nodes + 1 050 000 edges

                        - BFS has a O(nodes + edges) complexity, making this a feasible choice

                        - Since this is a grid graph (All edges weigh the same), Dijkstra and A* are not needed and will not outperform BFS (O(edges * log(nodes)) complexity, which is a few times more)
    
                Disadvantages:

                    - Too inefficient.

                        - If we look closer, we have to do this for all enemies alive.

                        - The real complexity is thus O(enemies * (nodes + edges))

                        - Now do this 60 times a second and you get a fried computer (Almost 1 billion operations, and this is ignoring the hidden constants and everything else we need to do)!

            3 -  Same as option 2, but we group nodes together

                What does this mean? If we look closer at how the graph functions, plenty of nodes will always return the same directions.

                We can reduce calculations by bunching these nodes up, and perform option 2 as described.

                Turns out you can group these nodes very easily given the map:

                    01 = 02 = 19 = 05 = 06 
                    || X || XXXXXX || X ||
                    03 = 04 = 17 = 07 = 08
                    ||   ||   ||   ||   ||
                    09 = 10 = 18 = 13 = 14
                    || X || XXXXXX || X ||
                    11 = 12 = 20 = 15 = 16

                    (Numbers are the ID of the nodes, X denotes an area taken by the obstacle, =/|| denote a connection between two nodes)

                Now it's only 20 nodes and 28 edges, and will do ~34800 calculations in a second, which is barely anything compared to before.

                Since all the nodes are still the same distance to each other (identical weights), we can do still do BFS without any issues.

    */

    // Find the representative node for sprite and enemy

    let [dist, src] = getZone(enemy);
    let tgt = getZone(player)[1];

    // Initialize the queue, the important information we need are the current node and the next node we want to go to.

    // Distance isn't required, the first output we get will be guaranteed shortest distance (as how all well-implemented BFS naturally work)

    // For more info https://en.wikipedia.org/wiki/Breadth-first_search is a good place to start

    let queue = [[src, -1]];

    // Save the position we want to go to (This is the case if the player and enemy are in the same region or are visible to each other)

    let tgt_pos = {
        x: player.position.x,
        y: player.position.y
    };

    // Quite often bosses get stuck at walls so we need to make sure they move closer to the key point first before cutting corners

    if(enemy.isBoss == true){

        if(dist < BOSS_RESET_DISTANCE) 
        
            enemy.nextZone = -1; // .nextZone represents where the enemy needs to go next. -1 indicates that the enemy does not know where to go

        else if(enemy.nextZone != -1 && isFullyVisible(enemy, sprite) == false)
            
            [tgt_pos.x, tgt_pos.y] = KEY_POINTS[enemy.nextZone - 1]; // If it already knows where to go we can make it keep getting closer to that point.

    }

    /*
        Only get the shortest path if:
             - The enemy does not know what their next key point is
            - The enemy does not see the player
            - The enemy cannot walk through walls (Orange enemy type)

    */

    if((enemy.isBoss === false || (enemy.nextZone == -1 || isFullyVisible(enemy, tgt_pos) == false)) && enemy.is_ghost === false && isFullyVisible(enemy, sprite) === false){

        // Set an array to keep track of which nodes we've already visited.

        let visited = new Array(GRAPH.length);

        while(queue.length != 0){

            // Grab current node
            
            let [node, first_neighbor] = queue.shift();

            if(node == tgt){

                // If we've found a valid path, then use it (it's our shortest path!)

                // Sometimes they are in the same region but still can't see each other, which is represented through -1

                if(first_neighbor == -1)
                    first_neighbor = tgt;

                // Save point as destination we want to go to

                [tgt_pos.x, tgt_pos.y] = KEY_POINTS[first_neighbor - 1];
                enemy.nextZone = first_neighbor;

                break; // We're done looking for a path

            }

            // Go through the current node's neighbours

            for(let next_node of GRAPH[node - 1]){
                
                // Check if we've been at this node before (Prevent cycles in our graph)

                if(visited[next_node] == true)
                    continue;

                // Mark as visited
                
                visited[next_node] = true;
                
                // The important info we need to keep track is the node and the next node we want to go (in order for the enemy to reach the player)

                // Add to the queue

                if(first_neighbor == -1)
                    queue.push([next_node, next_node]);
                else
                    queue.push([next_node, first_neighbor]);

            }

        }

    }

    // We have our target location, now we need to set the enemy to move towards the targeted location

    let angle = Math.atan2(tgt_pos.y - enemy.position.y, tgt_pos.x - enemy.position.x);

    enemy.vx = slowing_factor * enemy.max_veloc * Math.cos(angle);
    enemy.vy = slowing_factor * enemy.max_veloc * Math.sin(angle);

    return enemy;

}

function getPolygonPoints(sides, radius){

    /*
        
        Get points of a regular n-sided polygon.

        [Input]
            sides  => An integer representing the number of sides we want (3 => triangle, 4 => square, etc)
            radius => The radius/size of the polygon (If we pretend it's a circle)

        [Output]
            float  => The amount of offset/rotation for the polygon
            array  => An array of points to represent the polygon

    */

    // Since it's a regular polygon, we can pretend it's a circle, and pick N points on the circumference that haven an equal distance to each other.

    // This may seem more complicated, but equal distance here represents the angle, which can easily be calculated.

    let points = [];
    let offset = Math.random() * Math.PI; // Rotate the polygon by a specific amount

    for(let side = 0; side < sides; side++){

        // Angle is 2PI * (side / sides), which can be rotated by adding an offset

        // If we want to make the polygon larger we can multiply it by radius

        let x_coordinate = radius * Math.cos(2 * Math.PI * side / sides + offset);
        let y_coordinate = radius * Math.sin(2 * Math.PI * side / sides + offset);

        // Add it to the points

        points.push(x_coordinate); points.push(y_coordinate);

    }

    return [offset, points];

}
 
function getAttributes(type, colour){

    /*
        
        Sets the special attributes of an enemy

        See https://cycnus-studio.github.io/help_page.html for more info on how enemies are buffed/nerfed

        [Input]
            type   => The shape/type of the enemy
            colour => The colour/type of the enemy

        [Output]
            object  => The statistics/attributes of the enemy

    */
    
    const attributes = {
        colour: COLOURS[colour], // Enemy colour
        hp: 1,                   // Base hitpoints (number of shots required to kill)
        speed: 3.5,              // Base speed 
        bullet_speed: 4,         // Base bullet Speed
        is_explode: false,       // If they explode when close to player
        is_ghost: false,         // If they can go through walls/enemies
        explode_on_death: false, // If they will explode when killed
    }

    // Shape Attributes

    if(type == "triangle"){

        // Triangles move and shoot faster

        attributes.bullet_speed += 0.6;
        attributes.speed += 0.8;

    } else if(type == "square"){

        // Squares have more hitpoints and are harder to kill

        attributes.hp += 1;

    } else if(type == "pentagon"){

        // Pentagons will blow up when near the player or when killed, are slightly faster, and are also harder to kill off

        attributes.speed += 0.2;
        attributes.hp += 1;
        attributes.is_explode = true;
        attributes.explode_on_death = true;

    } else if(type == "hexagon"){

        // Hexagons are much harder to kill but are much slower

        attributes.hp += 2;
        attributes.speed -= 0.8;

    }

    // Colour Attributes

    if(colour == 7){ // Yellow

        // Yellow enemies move and shoot faster

        attributes.bullet_speed += 0.6;
        attributes.speed += 0.6;

    } else if(colour == 8){ // Green

        // Green enemies have more health

        attributes.hp += 1;

    } else if(colour == 9){ // Blue

        // Blue enemies are much faster but shoot slightly slower

        attributes.speed += 1.2;
        attributes.bullet_speed -= 0.3;

    } else if(colour == 10){ // Purple

        // Purple enemies have more health and are faster (Basically an upgraded green)

        attributes.hp += 1;
        attributes.speed += 0.6;

    } else if(colour == 11){ // Red

        // Red enemies explode when killed

        attributes.explode_on_death = true;

    } else if(colour == 12){ // Orange

        // Orange enemies go through walls and enemies

        attributes.is_ghost = true;

    }

    return attributes;

}

function generateEnemy(type, colour, size = SPRITE_SIZE * 1.5, is_boss = false){

    /*
        
        Generates a specific enemy on the map.

        [Input]
            type      => The shape/type of the enemy
            colour    => The colour/type of the enemy
            size      => The size of the enemy (Default value is the size of a normal sprite)
            is_boss   => A boolean indicating if it is a boss (Has some distinct attributes)

        [Output]
            object  => The statistics/attributes of the enemy

    */

    // Get special attributes of enemy

    const attributes = getAttributes(type, colour);

    // Get polygon points for hitbox and shape

    let points = getPolygonPoints(ENEMY_TYPES.indexOf(type) + 3, size)[1];
    
    // Generate enemy for the canvas

    let enemy = new PIXI.Graphics();
    
    enemy.beginFill(attributes.colour == WHITE ? BLACK : attributes.colour);
    
    // Draw outline

    enemy.lineStyle(rand_range(2, 6), WHITE);
    
    // Draw polygon

    enemy.drawPolygon(points);
    enemy.endFill();

    enemy.position.set(0, 0);
    enemy.anchor = {x: 0, y: 0}; // anchor is for determining the key point of the sprite

    enemy.vx = enemy.vy = 0;  // Moving velocities
    enemy.type = type;        // Shape of polygon
    enemy.isPlayer = true;    // Is it a movable object?
    enemy.isUser = false;     // Is it the player?
    enemy.isBoss = is_boss;   // Is it a boss?
    
    // Set key game attributes

    // Bosses have more health but are slower

    enemy.hp = enemy.max_hp = attributes.hp * (is_boss == true ? 5 : 1); // Set hp values of enemy
    enemy.max_veloc = attributes.speed * (is_boss == true ? 0.7 : 1);    // Set maximum possible speed of enemy
    enemy.bullet_speed = attributes.bullet_speed;                        // Set shooting speed


    // Apply rest of attributes

    enemy.colour = attributes.colour;
    enemy.is_explode = attributes.is_explode;
    enemy.explode_on_death = attributes.explode_on_death;
    enemy.is_ghost = attributes.is_ghost;

    // Set maximum bullets an enemy can shoot at once

    enemy.shots = is_boss == true ? 6 : 3; // Bosses get double the shots
    enemy.previousShot = 0;                // Previous time the enemy has shot
    enemy.previousSpread = 0;              // Previous boss spread

    // Set hitbox and next destination to reach

    enemy.hitArea = new PIXI.Polygon(points);
    enemy.nextZone = -1;

    // Set hp decrease function when shot

    enemy.lose_hp = function(damage, explosion_radius = 40) {

        /*
        
            Decreases a specific enemy's hitpoints

            [Input]
                damage           => How much health the enemy is losing
                explosion_radius => How large the blast radius should be if the enemy does explode

            [Output]
                None

        */

        this.hp -= damage;

        if(this.isBoss) // Update boss health bar
        	updateBossBar();

        if(this.hp <= 0){

            if(this.explode_on_death == true){

                // Explode on death

                explode(this.position.x, this.position.y, explosion_radius, this.colour);

                // Kill player if in radius

                if(in_radius(this.position.x, this.position.y, explosion_radius, sprite)){
                    sprite.lose_hp();
                }

            }

            let enemy = this;

            // Update score

            user_score += this.isBoss ? BOSS_BONUS : ENEMY_BONUS; // Add different bonuses
            point_title.update();

            app.ticker.add(function shrink(){

                /*
        
                    Shrinks an enemy out of existence when killed

                    [Input]
                        None

                    [Output]
                        None

                */

                // Make enemy smaller (in an exponential rate)

                enemy.scale.x /= 1.2;
                enemy.scale.y /= 1.2;

                // If enemy gets small enough

                if(enemy.scale.x < 0.01){

                    // Destroy enemy

                    enemy.visible = false;

                    // Decrease counter here so next wave loads only when the last enemy is shrunk out of existence

                    enemies_left--;

                    zone.removeChild(enemy);

                    // Stop the shrinking
                    
                    app.ticker.remove(shrink);

                }

            });

            // Cannot shoot anymore, enemy died

            this.dead = true;

            if(this.isBoss)
            	boss_bar_out();

        }
        
    }

    // Generate a valid position to load an enemy (Cannot be inside an obstacle, enemy, or be out of bounds)

    do {

        enemy.position.x = rand_range(PADDING + enemy.width, WIDTH - PADDING - enemy.width);
        enemy.position.y = rand_range(PADDING + enemy.height, HEIGHT - PADDING - enemy.height);

    } while(hit_obstacle(enemy) == true);

    // Set as very minuscule at first

    enemy.scale.set(1e-5, 1e-5);

    // Set the speed the enemy will pop out

    enemy.generation_rate = Math.random() * 9 + 5;
    
    return enemy;
    
}
 
 
function generateBoss(type, colour){

    /*
        
        Generates a specific boss on the map.

        [Input]
            type      => The shape/type of the enemy
            colour    => The colour/type of the enemy

        [Output]
            object  => The statistics/attributes of the enemy

    */

    return generateEnemy(type, colour, BOSS_SIZE, true);
 
}
