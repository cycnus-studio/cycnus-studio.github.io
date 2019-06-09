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

        this._button_texture      = PIXI.Texture.from(buttonX);
        this._button_texture_down = PIXI.Texture.from(button_down);
        this._button_texture_over = PIXI.Texture.from(button_up);

        this.buttonX = new PIXI.Sprite(this._button_texture);

        // add the other stuff here (make sure to use the this. prefix for ALL VARIABLES)
		
		this.width = 80;
		this.height = 80;
		this.x = xValue;
		this.y = 710;
		this.scale.set = 0.5;
		
		app.stage.addChild(this.buttonX);
		
    }
	
	this.buttonX 
		.on('mousedown', onButtonDown) 
		.on('touchstart', onButtonDown)

		.on('mouseup', onButtonUp)
		.on('touchend', onButtonUp)
		.on('mouseupoutside', onButtonUp)
		.on('touchendoutside', onButtonUp)

		.on('mouseover', onButtonOver)

		.on('mouseout', onButtonOut)

    // Add functions here

    onButtonDown() {

        // reference the variables with this. prefix

    }
	
	function onButtonDown() {
		this.isdown = true;
		console.log("buttondown");
		this.texture = button_down;
		this.alpha = 1;
	}

	function onButtonUp() {
		this.isdown = false;
		console.log("buttonup");
		if (this.isOver) {
			this.texture = button_up;
		} else {
			this.texture = buttonX;
		}
	}

	function onButtonOver() {
		console.log("buttonover");
		this.isOver = true;
		if (this.isdown) {
			return;
		}
		this.texture = button_up;
	}

	function onButtonOut() {
		console.log("buttonout");
		this.isOver = false;
		if (this.isdown) {
			return;
		}
		this.texture = buttonX;
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