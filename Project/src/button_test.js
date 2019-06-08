PIXI.loader
	.add([
		"https://cycnus-studio.github.io/Project/img/freezeButton.png",
		"https://cycnus-studio.github.io/Project/img/freezeButtonDown.png",
		"https://cycnus-studio.github.io/Project/img/freezeButtonOver.png"
	])
	.load(setup1);
    
function setup1() {
	
	var freezeTexture = PIXI.Texture.from("https://cycnus-studio.github.io/Project/img/freezeButton.png");
	var freezeTextureDown = PIXI.Texture.from("https://cycnus-studio.github.io/Project/img/freezeButtonDown.png");
	var freezeTextureOver = PIXI.Texture.from("https://cycnus-studio.github.io/Project/img/freezeButtonOver.png");

	var freezeButton = new PIXI.Sprite(freezeTexture);

  	freezeButton.interactive = true; 
	freezeButton.buttonMode = true;
	
	freezeButton.width = 80;
	freezeButton.height = 80;
	freezeButton.x = 220;
	freezeButton.y = 710;
	freezeButton.scale.set = 0.5;
	  
	app.stage.addChild(freezeButton);
  
	freezeButton //,speedButton, 
        // set the mousedown and touchstart callback...
        .on('mousedown', onButtonDown)
        .on('touchstart', onButtonDown)

        // set the mouseup and touchend callback...
        .on('mouseup', onButtonUp)
        .on('touchend', onButtonUp)
        .on('mouseupoutside', onButtonUp)
        .on('touchendoutside', onButtonUp)

        // set the mouseover callback...
        .on('mouseover', onButtonOver)

        // set the mouseout callback...
        .on('mouseout', onButtonOut)
  
}

function onButtonDown() {
    this.isdown = true;
    this.texture = freezeTextureDown;
    this.alpha = 1;
}

function onButtonUp() {
    this.isdown = false;
    if (this.isOver) {
        this.texture = freezeTextureOver;
    } else {
        this.texture = freezeTexture;
    }
}

function onButtonOver() {
    this.isOver = true;
    if (this.isdown) {
        return;
    }
    this.texture = freezeTextureOver;
}

function onButtonOut() {
    this.isOver = false;
    if (this.isdown) {
        return;
    }
    this.texture = freezeTexture;
}