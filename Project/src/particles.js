/*
 *  Loads the particles into the game.
 *
 *  Author: Cycnus Studio
 *
 *  Date: June 10th, 2019  
 *
 */


class Particle {

    /*

        A class to create particles of different shapes and sizes.

    */


    constructor(x_coordinate, y_coordinate, veloc_x, veloc_y, is_background = false, size = rand_range(1, 4, true), degen_rate = 64){
    
        /*
            
            Creates a particle for the map.

            [Input]
                x_coordinate     => X-coordinate of the particle
                y_coordinate     => Y-coordinate of the particle
                veloc_x          => X direction the particle is moving
                veloc_y          => Y direction the particle is moving
                is_background    => Whether the particle is in the front or back of the playing area
                size             => Size of particle
                degen_rate       => Fading out and shrinking rate

            [Output]
                None

        */

        // Create particle

        this._particle = new PIXI.Graphics();
        
        this._particle.beginFill(blue_colour_bg == false ? COLOURS[rand_range(0, 3)] : BLUE_COLOURS[rand_range(0, 3)], 0.8);
        
        // Generate a polygon to draw for particle

        this._particle.drawPolygon(getPolygonPoints(rand_range(3, 10), size)[1]);
        this._particle.endFill();

        // Set position/specifications of particle
        
        this._particle.position.set(x_coordinate, y_coordinate);
        this._particle.vx = veloc_x + rand_range(-2, 2); // Add a bit of randomization so it looks a bit more chaotic
        this._particle.vy = veloc_y + rand_range(-2, 2);

        // Save more particle traits

        this._particle.is_background = is_background;
        this._particle.degen_rate = degen_rate;

        // Add to correct container

		let container = particle_container;

        if(is_background == true){ // For background container
         	
         	container = background_particle_container;

         	// Make background particles faster

            this._particle.vx += rand_range(-20, 20);
            this._particle.vy += rand_range(-20, 20);

        }
        
        container.addChild(this._particle);
        
    }

    get alpha(){

    	/*
            
            Gets transparency of a particle.

            [Input]
                None

            [Output]
                None

        */

        return this._particle.alpha;
    }

    update() {

    	/*
            
            Moves and fades the particle out.

            [Input]
                None

            [Output]
                None

        */

        // Change opacity

        this._particle.alpha -= this._particle.alpha / this._particle.degen_rate;
        
        // Change position

        this._particle.position.x += this._particle.vx / 32;
        this._particle.position.y += this._particle.vy / 32;
    
    }
    
}

class ParticleManager {

	/*

        A class to create manage particles on a larger scale.

    */
    
    constructor() {

    	/*
            
            Sets the background particles.

            [Input]
                None

            [Output]
                None

        */

        // Add particles periodically

        setInterval(function add_particles(){

        	// Don't add if game is on pause

            if(on_pause == true)
                return;
        
            // The 4 sides of the border
                
            const sides = [
                [rand_range(0, PADDING, true), rand_range(0, HEIGHT, true)],
                [WIDTH - PADDING + rand_range(0, PADDING, true), rand_range(0, HEIGHT, true)],
                [rand_range(0, WIDTH, true), rand_range(0, PADDING, true)],
                [rand_range(0, WIDTH, true), HEIGHT - PADDING + rand_range(0, PADDING, true)],
            ];

            // Pick a side to make a particle on
                
            let [x_coordinate, y_coordinate] = sides[rand_range(0, 3)];

            // Add to list of particles
                
            particles.push(new Particle(
                x_coordinate,
                y_coordinate,
                0,
                0,
                true,
                rand_range(20, 60),
                128
            ));
            
        }, 500);

    }
    
    follow_particles(sprite) {

    	/*
            
            Create particles that follow an object.

            [Input]
                sprite => The target to create particles with.

            [Output]
                None

        */

        // Periodically add a particle.
        
        setInterval(function add_particles(){

        	// Don't add particles if game is on pause.

            if(on_pause == true)
                return;

            // Create a random particle near the player and add it to the list of particles.
        
            particles.push(new Particle(
                sprite.position.x + rand_range(-sprite.width * 1.1, sprite.width * 1.1, true),
                sprite.position.y + rand_range(-sprite.height * 1.1, sprite.height * 1.1, true),
                sprite.vx,
                sprite.vy
            ));
            
        }, 150);
        
    }
    
    surround_particles(sprite) {

    	/*
            
            Create particles that are around (not inside) an object.

            [Input]
                sprite => The target to create particles with.

            [Output]
                None

        */
        
        setInterval(function add_particles(){

        	// Don't add particles if game is on pause.

            if(on_pause == true)
                return;
            
            // Get the 4 sides of the sprite

            // The extra rand_range is to give more space to the particles rather than stay right beside the object.
                
            let sides = [
                [sprite.position.x + rand_range(-30, sprite.width * 1.1, true), sprite.position.y + rand_range(-30, 30, true)],
                [sprite.position.x + rand_range(-30, sprite.width * 1.1, true), sprite.position.y + sprite.height + rand_range(-30, 30, true)],
                [sprite.position.x + rand_range(-30, 30, true),                 sprite.position.y + rand_range(-30, sprite.height * 1.1, true)],
                [sprite.position.x + sprite.width + rand_range(-30, 30, true),  sprite.position.y + rand_range(-30, sprite.height * 1.1, true),],
            ];

            // Pick a side to create a particle
                
            let [x_coordinate, y_coordinate] = sides[rand_range(0, 3)];
            
            // Add to list of particles

            particles.push(new Particle(
                x_coordinate,
                y_coordinate,
                0,
                0
            ));
            
        }, 250);
        
    }
    
}
