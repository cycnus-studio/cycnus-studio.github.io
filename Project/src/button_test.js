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
	
var freezeTexture, freezeTextureDown, freezeTextureOver;
var speedTexture, speedTextureDown, speedTextureOver; 
var helperTexture, helperTextureDown, helperTextureOver; 
var laserTexture, laserTextureDown, laserTextureOver; 
    
var freezeArr, speedArr, helperArr, laserArr;

powerArr = [freezeTexture, speedTexture, helperTexture, laserTexture];
powerDownArr = [freezeTextureDown, speedTextureDown, helperTextureDown, laserTextureDown];
powerOverArr = [freezeTextureOver, speedTextureOver, helperTextureOver, laserTextureOver];
powerStringArr = ["freeze", "speed", "helper", "laser"]; 
xArr = [220, 320, 420, 520];

var buttonTexture, buttonTextureDown, buttonTextureOver, xValue, buttonString;

function setup1() {
	
	for (x = 0; x < powerArr.length; x++) {
		
		buttonTexture = powerArr[x];
		buttonTextureDown = powerDownArr[x];
		buttonTextureOver = powerOverArr[x];
		buttonString = powerStringArr[x];
		xValue = xArr[x];
	
		buttonTexture = PIXI.Texture.from("https://cycnus-studio.github.io/Project/img/" + buttonString + "Button.png");
		buttonTextureDown = PIXI.Texture.from("https://cycnus-studio.github.io/Project/img/" + buttonString + "ButtonDown.png");
		buttonTextureOver = PIXI.Texture.from("https://cycnus-studio.github.io/Project/img/" + buttonString + "ButtonOver.png");

		console.log(x, ": ", buttonTexture);
		
		var powerButton = new PIXI.Sprite(buttonTexture);

		powerButton.interactive = true; 
		powerButton.buttonMode = true;
		
		powerButton.width = 80;
		powerButton.height = 80;
		powerButton.x = xValue;
		powerButton.y = 710;
		powerButton.scale.set = 0.5;
		
		app.stage.addChild(powerButton);
	
		function onButtonDown() {
			this.isdown = true;
			console.log("buttondown");
			this.texture = buttonTextureDown;
			this.alpha = 1;
		}

		function onButtonUp() {
			this.isdown = false;
			console.log("buttonup");
			if (this.isOver) {
				this.texture = buttonTextureOver;
			} else {
				this.texture = buttonTexture;
			}
		}

		function onButtonOver() {
			console.log("buttonover");
			this.isOver = true;
			if (this.isdown) {
				return;
			}
			this.texture = buttonTextureOver;
		}

		function onButtonOut() {
			console.log("buttonout");
			this.isOver = false;
			if (this.isdown) {
				return;
			}
			this.texture = buttonTexture;
		}
		
		powerButton 
			.on('mousedown', onButtonDown()) //can you pass variables into these functions
			.on('touchstart', onButtonDown)

			.on('mouseup', onButtonUp)
			.on('touchend', onButtonUp)
			.on('mouseupoutside', onButtonUp)
			.on('touchendoutside', onButtonUp)

			.on('mouseover', onButtonOver)

			.on('mouseout', onButtonOut)
			
	}
  
}
/*
function onButtonDown() {
    this.isdown = true;
	console.log("buttondown");
    this.texture = freezeTextureDown;
    this.alpha = 1;
}

function onButtonUp() {
    this.isdown = false;
	console.log("buttonup");
    if (this.isOver) {
        this.texture = freezeTextureOver;
    } else {
        this.texture = freezeTexture;
    }
}

function onButtonOver() {
	console.log("buttonover");
    this.isOver = true;
    if (this.isdown) {
        return;
    }
    this.texture = freezeTextureOver;
}

function onButtonOut() {
	console.log("buttonout");
    this.isOver = false;
    if (this.isdown) {
        return;
    }
    this.texture = freezeTexture;
}*/
