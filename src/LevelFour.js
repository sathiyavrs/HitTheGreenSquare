var LevelFourScene = cc.Scene.extend({
    space: null,
	PhysicsDebug: false,
	debugDrawNode: null,
	background: null,
	light: null,
	updateTheBackground: true,
	isDay: false,
	isSonar: false,
	
	LIGHT_RADIUS: 120,
	
	ENEMY_DEATH_PARTICLE_SIZE: 60,
	ENEMY_DEATH_PARTICLE_SPEED: 30,
	ENEMY_DEATH_PARTICLE_LIFETIME: 0.5,
	
	FRIENDLY_DEATH_PARTICLE_SIZE: 40,
	FRIENDLY_DEATH_PARTICLE_SPEED: 30,
	
	LEVEL_START_POSITION: cc.p(140, 330),
	
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
		
		friendlySprite.getBody().applyImpulse(cp.v(0, -70), cp.v(0, 0));
		
		
		this.addChild(friendlySprite, 2);
		this.light = friendlySprite;
		
		this.addObjects();
		
		var background = new Background(this.light.getPosition(), this.LIGHT_RADIUS);
		this.addChild(background, -1);
		this.background = background;
		
		var paddle = new Paddle(this.space, cc.p(cc.winSize.width / 2, cc.winSize.height / 2), Paddle.DOWN, 
												this.light.getContentSize().width, this.light.getContentSize().height);
		this.addChild(paddle);
    },
	
	addObjects: function() {
		var objects = LevelFourObjects;
		
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
		var path = null;
		
		for(var i = 0; i < objects.length; i++) {
			switch(objects[i].type) {
				case "White" :
					sprite = new EnemySprite(res.WhiteEnemy, res.WhiteEnemyShaded, this.space, 
											cc.p(objects[i].x, objects[i].y),
											objects[i].rotation,
											-1, this.debugDrawNode, EnemySprite.TYPE_WHITE);
					this.addChild(sprite);
				
					break;
				
				case "Brown" :
					sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
											cc.p(objects[i].x, objects[i].y),
											objects[i].rotation,
											-1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
					this.addChild(sprite);
					break;
				
				case "Green" :
					greenSprite = new EnemySprite(res.GreenEnemy, res.GreenEnemyShaded, this.space, 
											cc.p(objects[i].x, objects[i].y),
											objects[i].rotation,
											-1, this.debugDrawNode, EnemySprite.TYPE_GREEN);
					this.addChild(greenSprite);
					break;
					
				case "Path" :
					points.push(cc.p(objects[i].x, objects[i].y));
					break;
					
				default:
					console.error("This isn't supposed to happen. Check the Level Resources file.");
					break;
			}
		}
		
		path = new FollowPath(points, FollowPath.LOOP, FollowPath.FORWARD);
		greenSprite.setPathToFollow(path, Movement.CONSTANT, 300);
		/* 
			sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
											cc.p(cc.winSize.width / 2 - 25, cc.winSize.height / 2 + 50), 25, -1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
			this.addChild(sprite);
		*/
		
		console.log(objects);
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
		this.space.step(dt);
		if(this.updateTheBackground)
			this.updateBackground(dt);
		
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