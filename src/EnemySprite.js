var deg2Rad = Math.PI / 180;
/**********************************************************************************************
	* TO DO:
	* MAKE TRANSITION ANIMATIONS FROM DETECTED TO UNDETECTED (?)
***********************************************************************************************/
var EnemySprite = cc.Sprite.extend({
	
	DEATH_PARTICLE_SPEED: 60,
	DEATH_PARTICLE_SIZE: 30,
	DEATH_PARTICLE_COLOR: cc.color(179, 111, 1, 255),
	
	isEnemy: true,
    Space: null,
    Shape: null,
	Body: null,
	LayerMask: null,
	isDay: false,
	
	LKPBody: null,
	LKPShape: null,
	LKPLayerMask: null,
	
	Group: GlobalConstant.ENEMY_SPRITE_GROUP_NO,
	
	LightingHelper: null,
	DrawNode: null,
	
	Path: null,
	MovementType: Movement.CONSTANT,
	Speed: null,
	_minDistanceToMoveAhead: 5,
	
	DetectedOnce: false,
	Detected: false,
	lastKnownTransform: null,
	currentTransform: null,
	
	FogTexture: null,
	NormalTexture: null,
	
	MaxHealth: 100,
	Health: 50,
	DamagePerHit: 50,
	DeathParticleSystem: null,
	DeathNotScheduled: true,
	DebugHealth: false,
	
	EnemyType: null,
	
	OriginalPosition: false,
	
	VibrationAttributes: {
		Amplitude: 15	
	},
	
	TakeDamage: function(override) {
		this.Health -= this.DamagePerHit;
		
		if(override == undefined)
			return;
		
		this.Health = -1;
	},
	
    ctor: function (resourceNormal, resourceLKP, space, position, rotation, layerMask, debugDrawNode, enemyType) {
		this._super(resourceNormal, cc.Rect(0, 0, 0, 0));
		this.scheduleUpdate();
		
		this.Space = space;
		this.LayerMask = layerMask;
		this.LKPLayerMask = layerMask;
		this.currentTransform = new Transform(position, rotation);
		this.lastKnownTransform = new Transform(this.currentTransform.position, this.currentTransform.rotation);
		
		this.FogTexture = cc.textureCache.getTextureForKey(resourceLKP);
		this.NormalTexture = cc.textureCache.getTextureForKey(resourceNormal);
		// this.TransparentTexture = cc.textureCache.getTextureForKey(resourceTransparent);
		// this.setTexture(this.NormalTexture);
		
		this.setVisible(false);
		
		
		/*
			this.setPosition(position);
			this.setRotation(rotation);
		*/
		
		var body = this.Body = new cp.Body(Infinity, Infinity);
		var shape = this.Shape = new cp.BoxShape(this.Body, this.getContentSize().width, this.getContentSize().height);
		
		this.Body.setPos(this.currentTransform.position);
		this.Body.setAngle(rotation * -deg2Rad);
		this.Space.addShape(this.Shape);
		
		/*if(this._debugDraw) {
			this._debugNode = new cc.PhysicsDebugNode(this.space);
			this.addChild(this._debugNode);
		}*/
		
		this.Shape.Sprite = this;
		this.Shape.isLKP = false;
		this.Shape.setElasticity(1);
		this.Shape.setFriction(0);
		this.Shape.group = this.Group;
		this.Shape.layer = getLayerValueFromLayerMask(this.LayerMask);
		this.Shape.setCollisionType(GlobalConstant.ENEMY_COLLISION_TYPE);
		
		this.DrawNode = debugDrawNode;
		
		this.LightingHelper = new RectLightingHelper(this, this.DrawNode);
		
		this.LKPBody = new cp.Body(Infinity, Infinity);
		this.LKPBody.setPos(this.lastKnownTransform.position);
		this.LKPBody.setAngle(this.lastKnownTransform.rotation * -deg2Rad);
		
		this.Health = 50;
		
		if(this.DebugHealth)
			this.Health = 0;
		
		this.initVibrationMovements();
		this.OriginalPosition = this.currentTransform.position;
		
		this.EnemyType = enemyType;
		this.setEnemyProperties();
		this.initDeathParticleSystem();
	},
	
	initDeathParticleSystem: function() {
		switch(this.EnemyType) {
			case EnemySprite.TYPE_BROWN: 
				this.DeathParticleSystem = new BurstEffect(res.WhiteParticle,
							this.DEATH_PARTICLE_SPEED,
							cc.p(0, 0),
							this.DEATH_PARTICLE_COLOR,
							this.DEATH_PARTICLE_SIZE);
							
				this.DeathParticleSystem.setPosition(this.currentTransform.position);
				break;
				
			case EnemySprite.TYPE_WHITE:
				this.DEATH_PARTICLE_COLOR = cc.color(180, 180, 180, 255);
			
				this.DeathParticleSystem = new BurstEffect(res.WhiteParticle,
							this.DEATH_PARTICLE_SPEED,
							cc.p(0, 0),
							this.DEATH_PARTICLE_COLOR,
							this.DEATH_PARTICLE_SIZE);
							
				this.DeathParticleSystem.setPosition(this.currentTransform.position);
				
				break;
				
			case EnemySprite.TYPE_GREEN:
				this.DEATH_PARTICLE_COLOR = cc.color(10, 100, 0, 255);
			
				this.DeathParticleSystem = new BurstEffect(res.WhiteParticle,
							this.DEATH_PARTICLE_SPEED,
							cc.p(0, 0),
							this.DEATH_PARTICLE_COLOR,
							this.DEATH_PARTICLE_SIZE);
							
				this.DeathParticleSystem.setPosition(this.currentTransform.position);
				
				break;
		}
	},
	
	setEnemyProperties: function() {
		switch(this.EnemyType) {
			
			case EnemySprite.TYPE_BROWN: 
				this.Health = 50;
				this.DamagePerHit = 50;
				break;
				
			case EnemySprite.TYPE_WHITE:
				this.DamagePerHit = 0;
				this.Health = 100;
				break;
				
			case EnemySprite.TYPE_GREEN:
				this.Health = 50;
				this.DamagePerHit = 50;
				break;
		}
	},
	
	setPathToFollow: function(path, movementType, speed) {
		if(this.Path != null) {
			throw new Error("Path already set to the Sprite!");
		}
		
		if(!(path instanceof FollowPath)) {
			throw new Error("Path set is not an instance of FollowPath!");
		}
		
		this.Path = path;
		this.MovementType = movementType;
		this.Speed = speed;
		
		this.currentTransform.position = path.currentPoint;
		path.goToNextPoint();
	},
	
	update: function(dt) {
		this.isDay = this.getParent().isDay;
		if(this.isDay) {
			this.Detected = true;
		}
		
		this.updateVibrations(dt);
		
		if(this.DebugHealth)
			this.Health -= dt;
		
		if(this.Health <= 0) {
			this.die();
		}
		
		this.setVisible(true);
		var path = this.Path;
		
		if(path == null) {
			// this.lastKnownTransform = new Transform(this.currentTransform.position, this.currentTransform.rotation);
		} else {
			this.updateMovement(dt);
		}
		
		// this.updateVibrationMovements();
		
		this.setDetectionTextures();
		this.updatePhysics();
		this.updateSprite();
		this.LightingHelper.update(dt);
		
	},
	
	once: 0,
	
	updateVibrations: function(dt) {
		
		var position = cc.p(0, 0);
		var angle = Math.random() * Math.PI * 2;
		var amplitude = this.VibrationAttributes.Amplitude
		
		position.x = Math.cos(angle) * dt * amplitude;
		position.y = Math.sin(angle) * dt * amplitude;

		var currentPosition = this.currentTransform.position;
		currentPosition = cc.pAdd(currentPosition, position);
		
		if(cc.pDistance(currentPosition, this.OriginalPosition) > amplitude) {
			currentPosition = cc.pAdd(currentPosition, cc.p(-position.x, -position.y));
		}
		
		this.currentTransform.position = currentPosition;
	},
	
	initVibrationMovements: function() {
		var position = cc.p(0, 0);
		var angle = Math.random() * Math.PI * 2;
		position.x = Math.cos(angle) * this.VibrationAttributes.Amplitude;
		position.y = Math.sin(angle) * this.VibrationAttributes.Amplitude;
		
		this.VibrationAttributes.Position = position;
		this.VibrationAttributes.ToPoint = position;
		this.VibrationAttributes.OriginalPosition = this.currentTransform.position;
	},
	
	die: function() {
		this.setVisible(false);
		
		this.Path = null;
		
		if(this.DeathNotScheduled) {
			this.DeathParticleSystem.setPosition(this.currentTransform.position);
			this.getParent().addChild(this.DeathParticleSystem);
			
			cc.Director._getInstance()._scheduler.scheduleCallbackForTarget(this, function() {
				if(this.LKPShape != null)
					this.Space.removeShape(this.LKPShape);
				
				if(this.EnemyType == EnemySprite.TYPE_GREEN) {
					/*****************************************************************************/
					// MATCH_WIN LOGIC
					
					alert("You've won!");
					
					/*****************************************************************************/
				}
				
				this.Space.removeShape(this.Shape);
				this.getParent().removeChild(this);
				
			}, this.DeathParticleSystem.life, false, 0, false);
			
			this.DeathNotScheduled = false;
		}
	},
	
	updateMovement: function(dt) {
		var path = this.Path;
		
		switch(this.MovementType) {
			
			case Movement.CONSTANT:
				var start = this.currentTransform.position;
				var end = path.currentPoint;
				var speed = this.Speed;
				
				var direction = GetDirection(start, end); // From Start to End
				var velocity = cc.p(direction.x * speed, direction.y * speed);
				var deltaMovement = cc.p(velocity.x * dt, velocity.y * dt);
				
				var toPosition = cc.p(this.currentTransform.position.x + deltaMovement.x, 
										this.currentTransform.position.y + deltaMovement.y);
										
				this.currentTransform.position = toPosition;
				
				if(DistanceBetweenTwoPoints(toPosition, end) < this._minDistanceToMoveAhead) {
					// this.currentTransform.position = new cc.p(path.currentPoint.x, path.currentPoint.y);
					this.Path.goToNextPoint();
				}
				
				break;
				
			case Movement.LERP:
				throw new Error("Lerp Movement has not been Implemented yet!");
				break;
				
			case Movement.SIN_WAVE:
				throw new Error("Sin Wave Movement has not been Implemented yet!");
				break;
		}
	},
	
	setDetectionTextures: function() {
		if(this.Detected) {
			this.setTexture(this.NormalTexture);
			this.lastKnownTransform = new Transform(this.currentTransform.position, this.currentTransform.rotation);
			
			if(this.LKPShape != null) {
				if(this.Space.containsShape(this.LKPShape))
					this.Space.removeShape(this.LKPShape);
				
				this.LKPShape = null; // TODO: Verify Validity and check for memory leak
			}
			
			if(!this.DetectedOnce)
				this.DetectedOnce = true;
			
		} else {
			if(this.DetectedOnce) {
				if(this.LKPShape == null) {
					this.LKPShape = new cp.BoxShape(this.LKPBody, this.getContentSize().width, this.getContentSize().height);
					this.LKPBody.setPos(this.lastKnownTransform.position);
					this.LKPBody.setAngle(this.lastKnownTransform.rotation * -deg2Rad);
					this.Space.addShape(this.LKPShape);
					this.LKPShape.Sprite = this;
					this.LKPShape.isLKP = true;
					this.LKPShape.group = this.Group;
					this.LKPShape.setCollisionType(GlobalConstant.ENEMY_COLLISION_TYPE);
				}
				
				this.setTexture(this.FogTexture);
			} else {
				
				this.setVisible(false);
			}
		}
	},
	
	updatePhysics: function() {
		this.Body.setPos(this.currentTransform.position);
		this.Body.setAngle(this.currentTransform.rotation * -deg2Rad);
		
		if(!this.LKPBody) {
			return;
		}
		this.LKPBody.setPos(this.lastKnownTransform.position);
		this.LKPBody.setAngle(this.lastKnownTransform.rotation * -deg2Rad);
	},
	
	updateSprite: function() {
		this.setPosition(this.lastKnownTransform.position);
		this.setRotation(this.lastKnownTransform.rotation);
	},
	
	setDetectedOnce: function(value) {
		this.DetectedOnce = false;
		
		if(this.LKPShape == null)
			return;
		
		if(this.Space.containsShape(this.LKPShape))
			this.Space.removeShape(this.LKPShape);
		
		// this.Space.removeBody(this.LKPBody);
	}
});

EnemySprite.TRANSFROM_OUTSIDE_WINDOW = new Transform(cc.p(1000, 0), 0);
EnemySprite.GROUP_NO = 1;

EnemySprite.TYPE_BROWN = 2;
EnemySprite.TYPE_WHITE = 3;
EnemySprite.TYPE_GREEN = 4;