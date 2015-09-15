var LevelFiveScene = cc.Scene.extend({
    space: null,
	PhysicsDebug: false,
	debugDrawNode: null,
	background: null,
	light: null,
	updateTheBackground: true,
	isDay: false,
	isSonar: false,
	objective: null,
	
	isPaused: false,
	hasWon: false,
	hasEnded: false,
	
	hasBeenPaused: false,
	debugMode: false,
	
	// LevelSpecific stuff
	
	thingsToKillUponVictory: [],
	
	LIGHT_RADIUS: 120,
	
	ENEMY_DEATH_PARTICLE_SIZE: 60,
	ENEMY_DEATH_PARTICLE_SPEED: 30,
	ENEMY_DEATH_PARTICLE_LIFETIME: 0.5,
	
	FRIENDLY_DEATH_PARTICLE_SIZE: 40,
	FRIENDLY_DEATH_PARTICLE_SPEED: 30,
	
	LEVEL_START_POSITION: cc.p(160, 350),
	
	VibrationIDs: [26, 28],
	
	TimeAfterDeclaringWinner: 0.6,
	
	setWin: function() {
		if(this.hasEnded) {
			
			return;
		}
		
		this.hasWon = true;
		this.hasEnded = true;
		
		// alert("Victory!");
		
		cc.Director._getInstance()._scheduler.scheduleCallbackForTarget(this, function () {
					this.isPaused = true;
				}, this.TimeAfterDeclaringWinner, false, 0, false);
	},
	
	setLose: function() {
		if(this.hasEnded) {
			return;
		}
		
		this.hasWon = false;
		this.hasEnded = true;
		
		// alert("Defeat");
		cc.Director._getInstance()._scheduler.scheduleCallbackForTarget(this, function () {
					this.isPaused = true;
				}, this.TimeAfterDeclaringWinner, false, 0, false);
	},
	
	initPhysics: function() {
		this.space = new cp.Space();
		this.space.gravity = cp.v(0, 0);
		this.scheduleUpdate();
	},
	
	onEnter: function () {
		this._super();
        this.initPhysics();
		this.setDebugMode(this.PhysicsDebug);
		this.isDay = false;
		
		this.debugDrawNode = new cc.DrawNode();
		this.addChild(this.debugDrawNode);
		
		var friendlySprite = new FriendlySprite(
					[res.WhiteFriendly, res.WhiteFriendly_1, res.WhiteFriendly_2, res.WhiteFriendly_3],
					[res.RedFriendly, res.RedFriendly_1, res.RedFriendly_2, res.RedFriendly_3],
					cc.p(cc.winSize.width/2, 66), 
					this.space, -1, this.LIGHT_RADIUS, 
					FriendlySprite.DETECTION_OCCLUSION, 
					this.debugDrawNode,
					[100, 75, 50, 25]);
		
		friendlySprite.getBody().applyImpulse(cp.v(2, -10), cp.v(0, 0));
		friendlySprite.DisableSmashHit();
		friendlySprite.MarkNumber = 2;
		
		this.addChild(friendlySprite, 2);
		this.light = friendlySprite;
		
		this.addObjects();
		
		var background = new Background(this.light.getPosition(), this.LIGHT_RADIUS);
		this.addChild(background, -1);
		this.background = background;
		
		var paddle = new Paddle(this.space, cc.p(cc.winSize.width / 2, cc.winSize.height / 2), Paddle.DOWN, 
												this.light.getContentSize().width, this.light.getContentSize().height);
		this.addChild(paddle);
		
		cc.eventManager.addListener({
			event: cc.EventListener.KEYBOARD,
			
			onKeyPressed:  function(keyCode, event){
				
				if(keyCode == cc.KEY.escape) {
					if(this.isPaused && !this.hasBeenPaused) {
						
						if(this.hasEnded) {
							return;
						}
						this.isPaused = false;
						cc.director.resume();
						return;
					}
					
					if(this.isPaused && this.hasBeenPaused) {
						return;
					}
					
					if(!this.isPaused) {
						this.isPaused = true;
						this.hasBeenPaused = true;
						
						
					}
						// this.isPaused = true;
				}
				
			}.bind(this),
			
			onKeyReleased: function(keyCode, event){
				this.IsMoving = false;
				
				if(keyCode == cc.KEY.escape) {
					this.hasBeenPaused = false;
				}
				
			}.bind(this)
		}, this);
		
		this.initializeTutorialMessages();
		this.changeBackgroundColor();
    },
	
	BACKGROUND_COLOR: [0.4, 0.0, 0.1, 1],
	INNER_COLOR: [0.4, 0.0, 0.1, 1.0],
	SHADOW_COLOR: [0.1, 0.0, 0.025, 1.0],
	LIMITATION_BACKGROUND_COLOR: [0.1, 0.0, 0.025, 1.0],
	
	changeBackgroundColor: function() {
		this.background.BACKGROUND_COLOR = this.BACKGROUND_COLOR;
		this.background.INNER_COLOR = this.INNER_COLOR;
		this.background.SHADOW_COLOR = this.SHADOW_COLOR;
		this.background.LIMITATION_BACKGROUND_COLOR = this.LIMITATION_BACKGROUND_COLOR;
	},
	
	TutorialMessageAttributes: null,
	
	initializeTutorialAttributes: function() {
		this.TutorialMessageAttributes = Object.create(Object.prototype);
		
		this.TutorialMessageAttributes.AnchorPoint = cc.p(0.5, 0.5);
		this.TutorialMessageAttributes.YOffset = 180;
		this.TutorialMessageAttributes.PositionOne = cc.p(cc.winSize.width / 2, cc.winSize.height / 2 + this.TutorialMessageAttributes.YOffset);
		this.TutorialMessageAttributes.YIncrement = -30;
		this.TutorialMessageAttributes.PositionTwo = cc.p(cc.winSize.width / 2 + 120, cc.winSize.height / 2 - 60);
		this.TutorialMessageAttributes.PositionThree = cc.p(cc.winSize.width / 2 + 120, cc.winSize.height / 2 - 80);
		this.TutorialMessageAttributes.PositionFour = cc.p(cc.winSize.width / 2 + 350, cc.winSize.height / 2);
		
		this.TutorialMessageAttributes.Color = cc.color(255, 255, 255, 255);
		
		this.TutorialMessageAttributes.FontSize = 24;
		this.TutorialMessageAttributes.Font = "AmaticBoldFont";
		this.TutorialMessageAttributes.StringOne = "Tap M to enter marking mode.";
		this.TutorialMessageAttributes.StringTwo = "This allows you to track";
		this.TutorialMessageAttributes.StringThree = "moving enemies!";
		this.TutorialMessageAttributes.StringSix = "Even in the dark!";
		this.TutorialMessageAttributes.StringFour = "Look";
		this.TutorialMessageAttributes.StringFive = "Here";
	},
	
	TutorialLabel: null,
	
	initializeTutorialMessages: function() {
		this.initializeTutorialAttributes();
		
		// var label = new cc.LabelTTF(stringToSet, "Arial");
		// label.setFontSize(fontSizeTitle);
		// label.setColor(255, 255, 255, 255);
		// label.setAnchorPoint(0.5, 0.5);
		// label.setPosition(cc.winSize.width / 2, currentY);
		// this.addChild(label, 2);
		
		var attributes = this.TutorialMessageAttributes;
		var label = this.TutorialLabel = new cc.LabelTTF(attributes.StringOne, attributes.Font);
		label.setFontSize(attributes.FontSize);
		label.setColor(attributes.Color);
		label.setAnchorPoint(attributes.AnchorPoint);
		label.setPosition(attributes.PositionOne);
		this.addChild(label, -0.5);
		
		var smallFontSize = 20;
		
		label = this.TutorialLabel = new cc.LabelTTF(attributes.StringTwo, attributes.Font);
		label.setFontSize(smallFontSize);
		label.setColor(attributes.Color);
		label.setAnchorPoint(attributes.AnchorPoint);
		label.setPosition(attributes.PositionTwo);
		this.addChild(label, 0);
		
		label = this.TutorialLabel = new cc.LabelTTF(attributes.StringThree, attributes.Font);
		label.setFontSize(smallFontSize);
		label.setColor(attributes.Color);
		label.setAnchorPoint(cc.p(0.5, 0.5));
		label.setPosition(attributes.PositionThree);
		this.addChild(label, 0);
		
		label = this.TutorialLabel = new cc.LabelTTF(attributes.StringSix, attributes.Font);
		label.setFontSize(smallFontSize);
		label.setColor(attributes.Color);
		label.setAnchorPoint(cc.p(0.5, 0.5));
		label.setPosition(cc.pAdd(attributes.PositionThree, cc.p(0, -30)));
		this.addChild(label, 0);
		
		label = this.TutorialLabel = new cc.LabelTTF(attributes.StringFour, attributes.Font);
		label.setFontSize(smallFontSize);
		label.setColor(attributes.Color);
		label.setAnchorPoint(cc.p(0.0, 0.0));
		label.setPosition(attributes.PositionFour);
		this.addChild(label, 0-0.5);
		
		
		label = this.TutorialLabel = new cc.LabelTTF(attributes.StringFive, attributes.Font);
		label.setFontSize(smallFontSize);
		label.setColor(attributes.Color);
		label.setAnchorPoint(cc.p(0.0, 0.0));
		label.setPosition(cc.pAdd(attributes.PositionFour, cc.p(0, -20)));
		this.addChild(label, 0-0.5);
	},
	
	hasRetried: false,	
	
	pauseButtonAdded: false,
	pauseObjects: [],
	
	updatePauseMenu: function() {
		if(this.pauseButtonAdded && !this.isPaused) {
			this.removePauseMenu();
			this.pauseButtonAdded = false;
		}
		
		if(this.pauseButtonAdded && this.isPaused) {
			
		}
		
		if(!this.pauseButtonAdded && this.isPaused) {
			this.initializePauseMenu();
			this.pauseButtonAdded = true;
		}
		
		if(!this.pauseButtonAdded && !this.isPaused) {
			
		}
	},
	
	initializePauseMenu: function() {
		var width = 200;
		var height = 300;
		
		var widthOffset = 20;
		var heightOffset = 20;
		
		var sprite = new cc.Sprite(res.WhiteStuff, cc.rect(0, 0, width, height));
		sprite.setAnchorPoint(0.5, 0.5);
		sprite.setPosition(cc.p(cc.winSize.width / 2, cc.winSize.height / 2));
		this.addChild(sprite, 1);
		this.pauseObjects.push(sprite);
		
		var retryButton = new cc.MenuItemImage(res.RetryButtonNormal, res.RetryButtonSelected, function() {
			cc.director.resume();
			cc.director.runScene(new LevelFiveScene());
			
		});
		
		var retryPosition = cc.p(cc.winSize.width / 2, cc.winSize.height / 2);
		retryPosition = cc.pAdd(retryPosition, cc.p(-1 * (width / 2 - widthOffset), -1 * (height / 2 - heightOffset)));
		retryButton.setPosition(retryPosition);
		
		var mainScreenButton = new cc.MenuItemImage(res.MenuNormal, res.MenuSelected, function() {
			console.log("MainMenu Selected!");
		});
		
		var mainScreenButtonPosition = cc.p(cc.winSize.width / 2, cc.winSize.height / 2);
		mainScreenButtonPosition = cc.pAdd(mainScreenButtonPosition, 
								cc.p(-1 * (width / 2 - widthOffset), 1 * (height / 2 - heightOffset)));
		mainScreenButton.setPosition(mainScreenButtonPosition);
		
		var closeButton = new cc.MenuItemImage(res.CrossNormal, res.CrossSelected, function() {
			this.isPaused = false;
			this.hasBeenPaused = false;
			cc.director.resume();
		}.bind(this));
		
		var closeButtonPosition = cc.p(cc.winSize.width / 2, cc.winSize.height / 2);
		closeButtonPosition = cc.pAdd(closeButtonPosition, 
								cc.p(1 * (width / 2 - widthOffset), 1 * (height / 2 - heightOffset)));
		closeButton.setPosition(closeButtonPosition);
		
		var forwardButton = new cc.MenuItemImage(res.RightNormal, res.RightSelected, function() {
			cc.director.resume();
			cc.director.runScene(new LevelFourteenScene());
			
		});
		
		var forwardButtonPosition = cc.p(cc.winSize.width / 2, cc.winSize.height / 2);
		forwardButtonPosition = cc.pAdd(forwardButtonPosition, 
								cc.p(1 * (width / 2 - widthOffset), -1 * (height / 2 - heightOffset)));
		forwardButton.setPosition(forwardButtonPosition);
		
		if(this.debugMode) {
			var menu = new cc.Menu(retryButton, closeButton, forwardButton);
			menu.setPosition(cc.p(0, 0));
			this.addChild(menu, 2);
			this.pauseObjects.push(menu);
		
		} else {
			
			if(this.hasEnded) {
				
				if(this.hasWon) {
					var menu = new cc.Menu(retryButton, forwardButton);
					menu.setPosition(cc.p(0, 0));
					this.addChild(menu, 2);
					this.pauseObjects.push(menu);
				} else {
					var menu = new cc.Menu(retryButton);
					menu.setPosition(cc.p(0, 0));
					this.addChild(menu, 2);
					this.pauseObjects.push(menu);
				}
			
			} else {
				var menu = new cc.Menu(retryButton, closeButton);
				menu.setPosition(cc.p(0, 0));
				this.addChild(menu, 2);
				this.pauseObjects.push(menu);
				
			}
		}
		
		var labelHeightOffset = heightOffset + 30;
		var deathString = "Level Failed";
		var winString = "Level Cleared";
		var pauseString = "Game Paused";
		
		var stringToSet = "";
		
		if(this.isPaused) {
			stringToSet = pauseString;
		}
		
		if(this.hasEnded) {
			if(this.hasWon) {
				stringToSet = winString;
			} else {
				stringToSet = deathString;
			}
		}
		
		var dyDown = 30;
		var fontSizeTitle = 36;
		var fontSizeObjective = 12;
		var typeLeftOffset = 10;
		
		var currentY = cc.winSize.height / 2 + height / 2 - labelHeightOffset;
		
		var label = new cc.LabelTTF(stringToSet, "NHFont");
		label.setFontSize(fontSizeTitle);
		label.setColor(255, 255, 255, 255);
		label.setAnchorPoint(0.5, 0.5);
		label.setPosition(cc.winSize.width / 2, currentY);
		this.addChild(label, 2);
		this.pauseObjects.push(label);
		currentY -= 10;
		
		currentY -= dyDown;
		
		cc.director.pause();
	},
	
	removePauseMenu: function() {
		for(var i = 0; i < this.pauseObjects.length; i++) {
			this.removeChild(this.pauseObjects[i]);
		}
		
		this.pauseObjects = [];
	},
	
	addObjects: function() {
		var objects = JSON.parse(JSON.stringify(LevelFiveObjects));
		
		for(var i = 0; i < objects.length; i++) {
			var position = cc.p(objects[i].width / 2, objects[i].height / 2);
			position = cc.p(20, 20);
			position = RotatePositionClockwiseAboutOrigin(position, -1 * objects[i].rotation);
			
			objects[i].x += position.x;
			objects[i].y += position.y;
		}
		
		for(var i = 0; i < objects.length; i++) {
			objects[i].y *= -1;
			objects[i].y += cc.winSize.height;
		}
		
		for(var i = 0; i < objects.length; i++) {
			objects[i].x += this.LEVEL_START_POSITION.x;
			objects[i].y += this.LEVEL_START_POSITION.y - cc.winSize.height;
		}
		
		var sprite = null;
		var greenSprite = null;
		var points = [];
		var paths = {};
		var sprites = {};
		
		for(var i = 0; i < objects.length; i++) {
			
			switch(objects[i].type) {
				case "White" :
					
						sprite = new EnemySprite(res.WhiteEnemy, res.WhiteEnemyShaded, this.space, 
												cc.p(objects[i].x, objects[i].y),
												objects[i].rotation,
												-1, this.debugDrawNode, EnemySprite.TYPE_WHITE);
						this.addChild(sprite);
						sprites[objects[i].id] = sprite;
						
						for(var j = 0; j < this.VibrationIDs.length; j++) {
							if(this.VibrationIDs[j] == objects[i].id) {
								sprites[objects[i].id].VibrationAmplitude = 10;
							}
						}
					break;
				
				case "Brown" :
						sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
												cc.p(objects[i].x, objects[i].y),
												objects[i].rotation,
												-1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
						this.addChild(sprite);
						sprites[objects[i].id] = sprite;
						
						for(var j = 0; j < this.VibrationIDs.length; j++) {
							if(this.VibrationIDs[j] == objects[i].id) {
								sprites[objects[i].id].VibrationAmplitude = 7;
							}
						}
						
					break;
				
				case "Green" :
					greenSprite = new EnemySprite(res.GreenEnemy, res.GreenEnemyShaded, this.space, 
											cc.p(objects[i].x, objects[i].y),
											objects[i].rotation,
											-1, this.debugDrawNode, EnemySprite.TYPE_GREEN);
					this.addChild(greenSprite);
					this.objective = greenSprite;
					
					sprites[objects[i].id] = greenSprite;
					
					for(var j = 0; j < this.VibrationIDs.length; j++) {
						if(this.VibrationIDs[j] == objects[i].id) {
							sprites[objects[i].id].VibrationAmplitude = 7;
						}
					}
					
					break;
					
				case "Path" :
					if(paths[objects[i].width] == undefined) {
						paths[objects[i].width] = [];
					}
					
					paths[objects[i].width].push(cc.p(objects[i].x, objects[i].y));
					break;
					
				default:
					console.error("This isn't supposed to happen. Check the Level Resources file.");
					break;
			}
		}
		
		/* 
			sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
											cc.p(cc.winSize.width / 2 - 25, cc.winSize.height / 2 + 50), 25, -1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
			this.addChild(sprite);
		*/
		
		this.setPathToObjects(paths, objects, sprites);
},
	
	setPathToObjects: function(paths, objects, sprites) {

		for(var i = 0; i < objects.length; i++) {
			if(paths[objects[i].id] == undefined)
				continue;
			
			path = new FollowPath(paths[objects[i].id], FollowPath.PING_PONG, FollowPath.FORWARD);
			speed = 450;
			sprites[objects[i].id].setPathToFollow(path,  Movement.CONSTANT, 100);
		}
	},
	
	doNotUpdateTheBackground: function() {
		this.updateTheBackground = false;
	},
	
	destroyLights: function() {
		this.updateTheBackground = false;
		this.light.setPosition(-100, -100);
		this.updateBackground(2);
		this.light = null;
		
		// Create another Light Here.
	},
	
	update: function(dt) {
		this.space.step(dt / 2);
		this.space.step(dt / 2);
		if(this.updateTheBackground)
			this.updateBackground(dt);
		
		if(this.objective.Health < 0) {
			console.log("hey");
			for(var i = 0; i < this.thingsToKillUponVictory.length; i++) {
				this.thingsToKillUponVictory[i].Health = -1;
			}
		}
		this.updatePauseMenu();
	},
	
	once: 0,
	
	updateBackground: function(dt) {
		this.background.LightLocation = this.light.getPosition();
		this.background.ShadowObjectsPositions = this.light.ShadowPoints;
		if(this.once < 20) {
			// console.log(this.light.ShadowPoints);
			this.once++;
		}
	},
	
	normalizePosition: function(position) {
		var width = cc.winSize.width;
		var height = cc.winSize.height;
		
		position.x /= width;
		position.x *= 2;
		position.x -= 1;
		
		position.y *= 2 / height;
		position.y -= 1;
		
		return position;
	},
	
	normalizeRadius: function(radius) {
		radius /= cc.winSize.height;
		radius *= 2;
		return radius;
	},
	
	setDebugMode: function (boolValue) {
        if (boolValue) {
            var debugNode = new cc.PhysicsDebugNode(this.space);
            this.addChild(debugNode);
        }
    }
});