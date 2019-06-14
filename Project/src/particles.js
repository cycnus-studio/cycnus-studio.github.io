
// Create particles, lots of particles


class Particle {

	constructor(x_coordinate, y_coordinate, veloc_x, veloc_y, is_background = false, size = rand_range(1, 4, true), degen_rate = 64, colour = blue_colour_bg){
	
		this._particle = new PIXI.Graphics();
		
		this._particle.beginFill(colour == false ? COLOURS[rand_range(0, 3)] : BLUE_COLOURS[rand_range(0, 3)], 0.8);
		this._particle.drawPolygon(getPolygonPoints(rand_range(3, 10), size)[1]);
		this._particle.endFill();
		
		this._particle.position.set(x_coordinate, y_coordinate);
		this._particle.is_background = is_background;

		this._particle.degen_rate = degen_rate;
		
		let container = particle_container;
		
		if(is_background == true){
			container = background_particle_container;
		}
		
		this._particle.vx = veloc_x + rand_range(-2, 2);
		this._particle.vy = veloc_y + rand_range(-2, 2);

		if(degen_rate > 64){
			this._particle.vx += rand_range(-20, 20);
			this._particle.vy += rand_range(-20, 20);
		}
		
		container.addChild(this._particle);
		
	}

	get alpha(){
		return this._particle.alpha;
	}

	update() {
		this._particle.alpha -= this._particle.alpha / this._particle.degen_rate;
		this._particle.position.x += this._particle.vx / 32;
		this._particle.position.y += this._particle.vy / 32;
	}
	
}

class ParticleManager {
	
	constructor() {

		// Set background particles

		setInterval(function add_particles(){

			if(on_pause == true)
				return;
		
			// The 4 sides
				
			let sides = [
				[rand_range(0, PADDING, true), rand_range(0, HEIGHT, true)],
				[WIDTH - PADDING + rand_range(0, PADDING, true), rand_range(0, HEIGHT, true)],
				[rand_range(0, WIDTH, true), rand_range(0, PADDING, true)],
				[rand_range(0, WIDTH, true), HEIGHT - PADDING + rand_range(0, PADDING, true)],
			];
				
			let [x_coordinate, y_coordinate] = sides[rand_range(0, 3)];
				
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
		
		setInterval(function add_particles(){

			if(on_pause == true)
				return;
		
			particles.push(new Particle(
				sprite.position.x + rand_range(-sprite.width * 1.1, sprite.width * 1.1, true),
				sprite.position.y + rand_range(-sprite.height * 1.1, sprite.height * 1.1, true),
				sprite.vx,
				sprite.vy
			));
			
		}, 100);
		
	}
	
	surround_particles(sprite) {
		
		setInterval(function add_particles(){

			if(on_pause == true)
				return;
			
			// The 4 sides
				
			let sides = [
				[sprite.position.x + rand_range(-30, sprite.width * 1.1, true), sprite.position.y + rand_range(-30, 30, true)],
				[sprite.position.x + rand_range(-30, sprite.width * 1.1, true), sprite.position.y + sprite.height + rand_range(-30, 30, true)],
				[sprite.position.x + rand_range(-30, 30, true), sprite.position.y + rand_range(-30, sprite.height * 1.1, true)],
				[sprite.position.x + sprite.width + rand_range(-30, 30, true), sprite.position.y + rand_range(-30, sprite.height * 1.1, true),],
			];
				
			let [x_coordinate, y_coordinate] = sides[rand_range(0, 3)];
				
			particles.push(new Particle(
				x_coordinate,
				y_coordinate,
				0,
				0
			));
			
		}, 150);
		
	}
	
}