PIXI.loader
	.add([
		"https://cycnus-studio.github.io/Project/img/freezeButton.png",
		"https://cycnus-studio.github.io/Project/img/freezeButtonDown.png",
		"https://cycnus-studio.github.io/Project/img/freezeButtonOver.png",
		"https://cycnus-studio.github.io/Project/img/speedButton.png",
		"https://cycnus-studio.github.io/Project/img/speedButtonDown.png",
		"https://cycnus-studio.github.io/Project/img/speedButtonOver.png",
		"https://cycnus-studio.github.io/Project/img/helperButton.png",
		"https://cycnus-studio.github.io/Project/img/helperButtonDown.png",
		"https://cycnus-studio.github.io/Project/img/helperButtonOver.png", 
		"https://cycnus-studio.github.io/Project/img/laserButton.png",
		"https://cycnus-studio.github.io/Project/img/laserButtonDown.png",
		"https://cycnus-studio.github.io/Project/img/laserButtonOver.png"
	])
	.load(setup1);
	  
class Powerup {

    constructor(buttonX, button_down, button_up, xValue) {
		
		let texture = PIXI.Texture.from(buttonX)

        this.buttonX = new PIXI.Sprite(texture);
		
		this.buttonX.interactive = true; 
		this.buttonX.buttonMode = true;

        this.buttonX._button_texture = texture;
        this.buttonX._button_texture_down = PIXI.Texture.from(button_down);
        this.buttonX._button_texture_over = PIXI.Texture.from(button_up);
	
        // add the other stuff here (make sure to use the this. prefix for ALL VARIABLES)
		
		this.buttonX.width = 80;
		this.buttonX.height = 80;
		this.buttonX.x = xValue;
		this.buttonX.y = 710;
		
		app.stage.addChild(this.buttonX);
		
		this.buttonX 
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
		this.isdown = true;
		console.log("buttondown");
		this.texture = this._button_texture_down;
		this.alpha = 1;
	}

	onButtonUp() {
		this.isdown = false;
		console.log("buttonup");
		if (this.isOver) {
			this.texture = this._button_texture_over;
		} else {
			this.texture = this._button_texture;
		}
	}

	onButtonOver() {
		console.log("buttonover");
		this.isOver = true;
		if (this.isdown) {
			return;
		}
		this.texture = this._button_texture_over;
	}

	onButtonOut() {
		console.log("buttonout");
		this.isOver = false;
		if (this.isdown) {
			return;
		}
		this.texture = this._button_texture;
	}

}
var powerStringArr, xArr;

powerStringArr = ["freeze", "speed", "helper", "laser"]; 
xArr = [220, 320, 420, 520];

function setup1() {
	
	for (x = 0; x < powerStringArr.length; x++) {
		
		powerName = powerStringArr[x];
		xValue = xArr[x];
	
		let buttonX = new Powerup("https://cycnus-studio.github.io/Project/img/" + powerName + "Button.png",
			"https://cycnus-studio.github.io/Project/img/" + powerName + "ButtonDown.png",
			"https://cycnus-studio.github.io/Project/img/" + powerName + "ButtonOver.png", 
			xValue);	

	}
		
}
