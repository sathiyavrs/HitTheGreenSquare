var DevelopmentScene = cc.Scene.extend({
    space: null,
	PhysicsDebug: false,
	debugDrawNode: null,
	background: null,
	light: null,
	updateTheBackground: true,
	
	LIGHT_RADIUS: 120,
	
	ENEMY_DEATH_PARTICLE_SIZE: 60,
	ENEMY_DEATH_PARTICLE_SPEED: 30,
	ENEMY_DEATH_PARTICLE_LIFETIME: 0.5,
	
	FRIENDLY_DEATH_PARTICLE_SIZE: 40,
	FRIENDLY_DEATH_PARTICLE_SPEED: 30,
	
	initPhysics: function() {
		this.space = new cp.Space();
		this.space.gravity = cp.v(0, 0);
		this.scheduleUpdate();
	},
	
	onEnter: function () {
        this._super();
        this.initPhysics();
		this.setDebugMode(this.PhysicsDebug);
		
		this.debugDrawNode = new cc.DrawNode();
		this.addChild(this.debugDrawNode);
		
		var particleSystem = new BurstEffect(res.WhiteParticle, this.FRIENDLY_DEATH_PARTICLE_SPEED, 
										cc.p(0, 0), cc.color(200, 200, 200, 255), this.FRIENDLY_DEATH_PARTICLE_SIZE);
		
		var friendlySprite = new FriendlySprite(
					[res.WhiteFriendly, res.WhiteFriendly_1, res.WhiteFriendly_2, res.WhiteFriendly_3],
					cc.p(cc.winSize.width/2, cc.winSize.height / 2 - 120), 
					this.space, -1, this.LIGHT_RADIUS, 
					FriendlySprite.DETECTION_OCCLUSION, 
					this.debugDrawNode,
					[100, 75, 50, 25]);
		
		friendlySprite.getBody().applyImpulse(cp.v(0, -70), cp.v(0, 0));
		
		this.addChild(friendlySprite);
		this.light = friendlySprite;
		
		var sprite = null;
		// var sprite = new EnemySprite(res.BrownEnemy, res.WhiteEnemy, this.space, 
		// 								cc.p(cc.winSize.width / 2 - 50, cc.winSize.height / 2), 30, -1, this.debugDrawNode);
		
		/*
		cc.eventManager.addListener({
			event: cc.EventListener.KEYBOARD,
			onKeyPressed:  function(keyCode, event){
				sprite.Detected = true;
			},
			onKeyReleased: function(keyCode, event){
				sprite.Detected = false;
			}
		}, sprite);
		*/ 
		
		
		// this.addChild(sprite);
		var TwoPath = new FollowPath([cc.p(100, 200), cc.p(400, 400), cc.p(300, 100)], FollowPath.LOOP, FollowPath.FORWARD);
		// sprite.setPathToFollow(TwoPath, Movement.CONSTANT, 300);
		// sprite.Shape.setElasticity(1.5);
		
		sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
										cc.p(cc.winSize.width / 2 - 1000, cc.winSize.height / 2 + 50), 25, -1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
		this.addChild(sprite);
		
		
		sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
										cc.p(cc.winSize.width / 2 - 25, cc.winSize.height / 2 + 50), 25, -1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
		this.addChild(sprite);
		
		sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
										cc.p(cc.winSize.width / 2 - 25, cc.winSize.height / 2 - 50), 25, -1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
		this.addChild(sprite);
		
		sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
										cc.p(cc.winSize.width / 2 + 25, cc.winSize.height / 2 + 50), 25, -1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
		this.addChild(sprite);
		
		sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
										cc.p(cc.winSize.width / 2 + 50, cc.winSize.height / 2 - 50), 25, -1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
		this.addChild(sprite);
		
		sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
										cc.p(cc.winSize.width / 2 + 80, cc.winSize.height / 2), -25, -1, this.debugDrawNode, EnemySprite.TYPE_BROWN);
		this.addChild(sprite);
		
		sprite = new EnemySprite(res.BrownEnemy, res.BrownEnemyShaded, this.space, 
										cc.p(cc.winSize.width / 2 + 80, cc.winSize.height / 2 + 60), 25, -1, 
										this.debugDrawNode, EnemySprite.TYPE_BROWN);
		this.addChild(sprite);
		
		for(var i = 3; i < 8; i++) {
			sprite = new EnemySprite(res.WhiteEnemy, res.WhiteEnemyShaded, this.space, 
										cc.p(cc.winSize.width - 150, 20 + i * 40), 0, -1, this.debugDrawNode, 
										EnemySprite.TYPE_WHITE);
			this.addChild(sprite);
		}
		
		
		for(var i = 3; i < 8; i++) {
			sprite = new EnemySprite(res.WhiteEnemy, res.WhiteEnemyShaded, this.space, 
										cc.p(150, 20 + i * 40), 0, -1, this.debugDrawNode,
 										EnemySprite.TYPE_WHITE);
			this.addChild(sprite);
		}
		
		var background = new Background(this.light.getPosition(), this.LIGHT_RADIUS);
		this.addChild(background, -1);
		this.background = background;
		
		var paddle = new Paddle(this.space, cc.p(cc.winSize.width / 2, cc.winSize.height / 2), Paddle.DOWN, 
												this.light.getContentSize().width, this.light.getContentSize().height);
		this.addChild(paddle);
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