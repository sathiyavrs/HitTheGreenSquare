var FriendlySprite = cc.PhysicsSprite.extend({
	
	/**********************************************************************************************
	* TO DO:
	* BUG WITH THE DETECTION WHEN THERE ARE WAY TOO MANY OBJECTS STACKED UP IN A STRAIGHT LINE.
	* FIX BUG QUICKLY
	* OCCURS ON MIN ANGLE > 100
	* DOESN'T OCCUR FOR ANGLE = 100
	* HAPPENS ON COLLISION AT ANGLE = 110
	* REDUCING SKIN ANGLE REDUCED THE ISSUE
	* ISSUE WHEN THE DRAWING IS DONE BEFORE EVERYTHING ELSE
	* THE ENEMIES ARE BEING DRAWN BEFORE THEY'RE BEING SET TO DETECTED.
	* SOLUTION: CHANGE UNDETECTED TO DETECTED TRANSITION
	* I'LL PROBABLY DO SOME OTHER STUFF TO CHANGE THAT.
	* THE BUG OCCURANCE IS INDEPENDENT OF SPEED.
	* BUG AT MOST LASTS ONE FRAME, BUT IT STILL HURTS.
	* PRETTY SURE THERE'S SOMETHING WRONG WITH THE ALGORITHM, NOT THE DRAWING.
	***********************************************************************************************/
	
	SPEED: 270,
	SMASH_SPEED: 400,
	NORMAL_SPEED: 270,
	PARTICLE_SPEED: 40,
	PARTICLE_SIZE: 30,
	PARTICLE_COLOR: cc.color(180, 180, 180, 255),
	
	MAX_SONAR_TIME: 1.5,
	SONAR_DECREMENT_PER_SECOND: 1,
	SONAR_INCREMENT_PER_SECOND: 0.2,
	CurrentSonarTime: 2,
	
	isEnemy: false,
	isFriendly: true,
	isDay: false,
	
    Space: null,
    Shape: null,
	Body: null,
	LayerMask: null,
	
	SonarShape: null,
	SonarBody: null,
	SonarLKPShapes: [],
	SonarDetectedShapes: [],
	
	Resources: [],
	SonarResources: [],
	Textures: [],
	HealthValues: [],
	SonarTextures: [],
	
	DebugDraw: null,
	DrawNode: null,
	
	DRAW_NODE_SONAR_COLOR_MID: cc.color(150, 150, 0, 255),
	DRAW_NODE_SONAR_COLOR_END: cc.color(100, 0, 0, 255),
	DRAW_NODE_SONAR_COLOR_START: cc.color(0, 100, 0, 255),
	SONAR_FULL_LENGTH: 40,
	SONAR_BAR_POSITION: cc.p(20, 20),
	SONAR_BAR_LINE_WIDTH: 2,
	
	DRAW_NODE_SMASH_COLOR: cc.color(200, 200, 200, 255),
	DRAW_NODE_SMASH_USING_COLOR: cc.color(0, 0, 75, 255),
	SMASH_BAR_DASH_LENGTH: 32,
	SMASH_BAR_LENGTH_BETWEEN_DASHES: 20,
	SMASH_BAR_POSITION: 20,
	SMASH_BAR_LINE_WIDTH: 3,
	
	HEALTH_BAR_LENGTH: 500,
	HEALTH_BAR_POSITION: cc.p(40, 20),
	HEALTH_BAR_LINE_WIDTH: 4,
	
	Radius: null,
	DetectionType: null,
	DetectedBodies: [],
	ShadowPoints: [],
	MinAngle: 0,
	SkinAngle: 0.1,
	SkinLength: 5,
	
	ShowDebugValues: false,
	
	Health: 100,
	MaxHealth: 100,
	DebugHealth: false,
	DeathNotScheduled: true,
	DeathParticleSystem: null,
	
	HurtAmountPerHit: 17,
	EnemyHurt: 50,
	TimeBeforeNextTakeDamage: 0.016,
	_currentTimeForNext: -0.1,
	
	Attraction: false,
	AttractedToPosition: null, 
	AttractionMagnitude: 0,
	
	SmashHitNumber: 4,
	SmashHit: false,
	SunParticleSystem: null,
	OriginalEmissionRate: 0,
	
	MarkNumber: 3,
	MarkNow: false,
	
	SonarEnable: true,
	SmashHitEnable: true,
	MarkAndTrackEnable: true,
	
	DisableMarkAndTrack: function() {
		this.MarkAndTrackEnable = false;
	},
	
	DisableSonar: function() {
		this.SonarEnable = false;
	},
	
	DisableSmashHit: function() {
		this.SmashHitEnable = false;
	},
	
	CollisionParticleSystemAttributes: {
		Speed: 40,
		Color: cc.color(255, 255, 0, 255),
		ColorWhite: cc.color(225, 255, 225, 255),
		ColorGreen: cc.color(0, 255, 10, 255),
		InitialSize: 20
	},
	
	Caught: function(position, magnitude) {
		this.Attraction = true;
		this.AttractedToPosition = position;
		this.AttractionMagnitude = magnitude;
	},
	
	Free: function(position) {
		this.Attraction = false;
		this.AttractedToPosition = null;
	},
	
	setVariousHealthValues: function(health, hurtAmount, enemyHurtAmount) {
		this.Health = health;
		this.HurtAmountPerHit = hurtAmount;
		this.EnemyHurt = enemyHurtAmount;
	},
	
	initializeInputHandler: function() {
		cc.eventManager.addListener({
			event: cc.EventListener.KEYBOARD,
			
			onKeyPressed:  function(keyCode, event){
				if(keyCode == cc.KEY.g) {
					if(!this.SmashHitEnable)
						return;
					
					if(this.SmashHit) {
						this.SmashHit = false;
						this.SunParticleSystem.setEmissionRate(0);
					
					} else if(this.SmashHitNumber > 0) {
						
						this.SmashHit = true;
						this.SunParticleSystem.setEmissionRate(this.OriginalEmissionRate);
					}
				}
				
				if(this.isDay) {
					return;
				}
				
				if(keyCode == cc.KEY.m) {
					if(this.MarkNumber < 0) {
						
					} else {
						this.MarkNow = !this.MarkNow;
					}
					
				}
				
				if(keyCode == cc.KEY.r) {
					if(this.CurrentSonarTime < 0)
						return;
					
					if(!this.SonarEnable)
						return;
					
					this.DetectionType = FriendlySprite.DETECTION_SONAR;
				}
			}.bind(this),
			
			onKeyReleased: function(keyCode, event){
				if(this.isDay)
					return;
				
				if(keyCode == cc.KEY.r) {
					this.DetectionType = FriendlySprite.DETECTION_OCCLUSION;
					
					for(var i = 0; i < this.SonarDetectedShapes.length; i++) {
						this.SonarDetectedShapes[i].Sprite.Detected = false;
					}
				}
			}.bind(this)
		}, this);
		
	},
	
    ctor: function (resources, sonarResources, position, space, layerMask, radius, detectionType, drawNode, healthValues) {
        this._super(resources[0], cc.Rect(0, 0, 0, 0));
		
		this.SMASH_BAR_POSITION = cc.p(cc.winSize.width - this.SMASH_BAR_POSITION, this.SMASH_BAR_POSITION);
		this.SONAR_FULL_LENGTH = cc.winSize.height - this.SONAR_FULL_LENGTH;
		// this.SMASH_BAR_POSITION = cc.p(20, cc.winSize.width - 20);
		
		this.CurrentSonarTime = this.MAX_SONAR_TIME;
		
		this.initializeInputHandler();
		
		this.Resources = resources;
		this.SonarResources = sonarResources;
		this.HealthValues = healthValues;
		for(var i = 0; i < this.Resources.length; i++) {
			this.Textures.push(cc.textureCache.getTextureForKey(this.Resources[i]));
			this.SonarTextures.push(cc.textureCache.getTextureForKey(this.SonarResources[i]));
		}
		
		this.LayerMask = layerMask;
		this.Space = space;
		this.Radius = radius;
		this.DetectionType = detectionType;
		this.DebugDraw = drawNode;
		
		var body = this.Body = new cp.Body(1, cp.momentForCircle(10, 0, this.getContentSize().width / 2, cp.v(0, 0)));
		var shape = this.Shape = new cp.CircleShape(body, this.getContentSize().width / 2, cp.v(0, 0));
		
		this.setBody(body);
		this.setPosition(position);
		this.Body.setPos(position);
		this.Space.addBody(this.Body);
		this.Space.addShape(this.Shape); 
		this.Shape.setCollisionType(GlobalConstant.FRIENDLY_COLLISION_TYPE);
		this.Shape.setElasticity(1);
		this.Shape.setFriction(0);
		this.Shape.Sprite = this;
		this.CalculateLayer();
		
		this.CalculateMinAngle();
		this.scheduleUpdate();
		
		this.InitiateSonar();
		
		this.DeathParticleSystem = new BurstEffect(res.WhiteParticle, 
							this.PARTICLE_SPEED, 
							cc.p(0, 0), 
							this.PARTICLE_COLOR, 
							this.PARTICLE_SIZE);
		
		this.Health = this.MaxHealth;
		
		if(this.DebugHealth)
			this.Health = 2;
		
		this.Space.addCollisionHandler(GlobalConstant.FRIENDLY_COLLISION_TYPE, GlobalConstant.ENEMY_COLLISION_TYPE, 
			this.OnCollisionEnter.bind(this), null, null, null);
			
		
		this.initializeSunParticleSystem();
		this.DrawNode = new cc.DrawNode();
    },
	
	initializeSunParticleSystem: function() {
		this.SunParticleSystem = cc.ParticleSun.create();
		this.SunParticleSystem.setStartSize(30);
		this.SunParticleSystem.setEndSize(20);
		this.SunParticleSystem.setPosition(cc.p(this.getContentSize().width / 2, this.getContentSize().height / 2));
		this.SunParticleSystem.setTexture(cc.textureCache.getTextureForKey(res.WhiteParticle));
		this.SunParticleSystem.setDuration(-1);
		this.OriginalEmissionRate = this.SunParticleSystem.getEmissionRate();
		this.SunParticleSystem.setEmissionRate(0);
		
		this.addChild(this.SunParticleSystem);
	},
	
	ConfigureCollisionParticle: function(particleEffect) {
		particleEffect.startColorVar = cc.color(50, 50, 0, 0);
		particleEffect.endColorVar = cc.color(50, 50, 0, 0);
	},
	
	OnCollisionEnter: function(arbiter, shape) {
		var shapes = arbiter.getShapes();
		
		var pointOfContact = arbiter.getPoint(0);
		
		var isWhite = false;
		var isGreen = false;
		
		for(var i = 0; i < shapes.length; i++) {
			if(shapes[i].Sprite) {
				if(shapes[i].Sprite.EnemyType != null) {
					if(shapes[i].Sprite.EnemyType == EnemySprite.TYPE_WHITE)
						isWhite = true;
					
					if(shapes[i].Sprite.EnemyType == EnemySprite.TYPE_GREEN)
						isGreen = true;
						
					break;
				}
			}
		}
		
		if(isWhite)
			var particleEffect = new BurstEffect(res.WhiteParticle, 
				this.CollisionParticleSystemAttributes.Speed,
				cc.p(0, 0),
				this.CollisionParticleSystemAttributes.ColorWhite,
				this.CollisionParticleSystemAttributes.InitialSize
				);
		else if(isGreen)
			var particleEffect = new BurstEffect(res.WhiteParticle, 
				this.CollisionParticleSystemAttributes.Speed,
				cc.p(0, 0),
				this.CollisionParticleSystemAttributes.ColorGreen,
				this.CollisionParticleSystemAttributes.InitialSize
				);
		else
			var particleEffect = new BurstEffect(res.WhiteParticle, 
				this.CollisionParticleSystemAttributes.Speed,
				cc.p(0, 0),
				this.CollisionParticleSystemAttributes.Color,
				this.CollisionParticleSystemAttributes.InitialSize
				);
		
		this.ConfigureCollisionParticle(particleEffect);
		particleEffect.setPosition(pointOfContact);
		
		this.getParent().addChild(particleEffect);
		
		var sh = null;
		for(var i = 0; i < shapes.length; i++) {
			if(shapes[i].Sprite.isEnemy)
				sh = shapes[i].Sprite;
		}
		
		if(isGreen) {
			if(this.SmashHit) {
				sh.TakeDamage(100);
			}
			else {
				sh.TakeDamage();
			}
			
			this.getParent().setWin();
		}
		
			
		
		for(var i = 0; i < shapes.length; i++) {
			if(!shapes[i].Sprite.isEnemy) {
				
				if(this.SmashHit)
					shapes[i].Sprite.TakeDamage(25);
				else
					shapes[i].Sprite.TakeDamage();
				
				continue;
			}
			
			if(this.MarkNow) {
				shapes[i].Sprite.setPermanentDetection(true);
			}
			
			if(isGreen)
				continue;
			
			if(this.SmashHit) {
				shapes[i].Sprite.TakeDamage(100);
				
			}
			else {
				shapes[i].Sprite.TakeDamage();
				
			}
		}
		
		if(this.SmashHit) {

			this.SmashHit = false;
			this.SunParticleSystem.setEmissionRate(0);
			this.SmashHitNumber -= 1;
		}
		
		if(this.MarkNow) {
			this.MarkNow = false;
			this.MarkNumber -= 1;
			
		}
		return true;
	},
	
	TakeDamage: function(override) {
		
		if(this._currentTimeForNext > 0)
			return;
		
		this.Health -= this.HurtAmountPerHit;
		this._currentTimeForNext = this.TimeBeforeNextTakeDamage;
		
		if(override == undefined) {
			return;
		}
		
		this.Health -= this.HurtAmountPerHit;
	},
	
	
	InitiateSonar: function() {
		var radius = this.Radius;
		var body = this.SonarBody = new cp.Body(1, cp.momentForCircle(10, 0, this.getContentSize().width / 2, cp.v(0, 0)));
		var shape = this.SonarShape = new cp.CircleShape(body, radius, cp.v(0, 0));
		
		this.SonarBody.setPos(this.getPosition());
		this.SonarShape.setSensor(true);
		// this.SonarShape.group = GlobalConstant.ENEMY_SPRITE_GROUP_NO;
		this.SonarShape.setCollisionType(GlobalConstant.FRIENDLY_SONAR_TYPE);
		this.Space.addShape(this.SonarShape);
		
		this.Space.addCollisionHandler(GlobalConstant.FRIENDLY_SONAR_TYPE, GlobalConstant.ENEMY_COLLISION_TYPE, 
			this.SonarCollisionEnter.bind(this),
			null, null, 
			this.SonarCollisionExit.bind(this));
	},
		
	SonarCollisionEnter: function(arbiter, shape) {
		var shapes = arbiter.getShapes();
		for(var i = 0; i < shapes.length; i++) {
			if(shapes[i].Sprite == null) {
				continue;
			}
			
			var sprite = shapes[i].Sprite;
			
			if(sprite.isEnemy) {
				
				if(sprite.Detected == null) {
						continue;
				}
				
				if(shapes[i].isLKP) {
					
					var alreadyIn = false;
					for(var j = 0; j < this.SonarLKPShapes.length; j++) {
						if(this.SonarLKPShapes[j].Sprite === shapes[i].Sprite){
							alreadyIn = true;
							break;
						}
					}
					
					if(alreadyIn)
						continue;
					
					this.SonarLKPShapes.push(shapes[i]);
				
				} else {
					
					var alreadyIn = false;
					for(var j = 0; j < this.SonarDetectedShapes.length; j++) {
						if(this.SonarDetectedShapes[j].Sprite === shapes[i].Sprite){
							alreadyIn = true;
							break;
						}
					}
					
					if(alreadyIn)
						continue;
					
					this.SonarDetectedShapes.push(shapes[i]);
					// console.log(this.SonarDetectedShapes);
				}
			}
		}
		
		return false;
	},
	
	SonarCollisionExit: function(arbiter, shape) {
		var shapes = arbiter.getShapes();
		for(var i = 0; i < shapes.length; i++) {
			if(!shapes[i].Sprite) {
				continue;
			}
			
			var sprite = shapes[i].Sprite;
			
			if(sprite.isEnemy) {
				
				if(shapes[i].isLKP) {
					// shapes[i].Sprite.setDetectedOnce(false);
					var index = this.SonarLKPShapes.indexOf(shapes[i]);
					if(index > -1) {
						this.SonarLKPShapes.splice(index, 1);
						// sprite.setDetectedOnce(false);
					}
				} else {
					
					if(sprite.Detected == null) {
						continue;
					}
					
					var index = this.SonarDetectedShapes.indexOf(shapes[i]);
					if(index > -1) {
						this.SonarDetectedShapes.splice(index, 1);
						sprite.Detected = false;
						// console.log(this.SonarDetectedShapes);
					}
				}
			}
		}
		
		return false;
	},
		
	CalculateLayer: function() {
		
	},
	
	CalculateMinAngle: function() {
		var radiusSquared = this.Radius * this.Radius;
		var minDistanceSquared = FriendlySprite.MIN_EDGE_LENGTH * FriendlySprite.MIN_EDGE_LENGTH;
		
		var cosine = (2 * radiusSquared - minDistanceSquared) / (2 * radiusSquared);
		this.MinAngle = Math.acos(cosine) * 180 / Math.PI;
		
		// Short shoddy illogical attempt at a fix.
		// this.MinAngle = 1;
		// Didn't work :(
	},
	
	setAttractedToPosition: function(position) {
		this.AttractedToPosition = position;
	},
	
	distanceBetweenPoints: function(start, end) {
		var distance2 = (start.x - end.x) * (start.x - end.x) + (start.y - end.y) * (start.y - end.y);
		return Math.sqrt(distance2);
	},
	
	once: 0,
	
	/*Math.abs(this.getPosition().y - this.AttractedToPosition.y) < 2 &&
										this.getPosition().y - this.AttractedToPosition.y >= 0)*/
	
	updateSonar: function(dt) {
		if(this.DetectionType == FriendlySprite.DETECTION_SONAR) {
			this.CurrentSonarTime -= dt * this.SONAR_DECREMENT_PER_SECOND;
			
			if(this.CurrentSonarTime < 0) 
				this.DetectionType = FriendlySprite.DETECTION_OCCLUSION;
		
		} else {
			this.CurrentSonarTime += dt * this.SONAR_INCREMENT_PER_SECOND;
		
			if(this.CurrentSonarTime > this.MAX_SONAR_TIME) {
				this.CurrentSonarTime = this.MAX_SONAR_TIME;
			}
		}
	},
	
	DrawNodeAdded: false,
	
	updateSpeed: function() {
		if(this.SmashHit)
			this.SPEED = this.SMASH_SPEED;
		else
			this.SPEED = this.NORMAL_SPEED;
	},
	
	DrawMarkCircleAroundPlayer: function() {
		// this.DebugDraw.drawCircle(this.getPosition(), this.Radius, 2 * Math.PI, 60, true, 1, new cc.Color(0, 0, 255, 255));
		
		var componentValue = Math.random() * 75 + 160;
		var color = cc.color(255 - componentValue, 255 - componentValue, 255 - componentValue, 255);
		var radius = this.getContentSize().width / 2 - 2 * Math.random();
		var original = this.getContentSize().width / 2 - 1;
		this.DrawNode.drawCircle(this.getPosition(), radius, 2 * Math.PI, 60, false, 4, color);
	},
	
	update: function(dt) {
		
		this.updateSpeed();
		this.SonarBody.setPos(this.getPosition());
		this.updateSonar(dt);
		
		if(!this.DrawNodeAdded) {
			this.getParent().addChild(this.DrawNode, 3);
			this.DrawNodeAdded = true;
		}
		
		this._currentTimeForNext -= dt;
		if(this._currentTimeForNext < 0) {
			this._currentTimeForNext = -0.1;
		}
		
		if(this.DetectionType == FriendlySprite.DETECTION_SONAR) {
			this.getParent().isSonar = true;
		} else {
			this.getParent().isSonar = false;
		}
		this.DrawNode.clear();
		
		
		if(this.Attraction) {
			
			if(this.distanceBetweenPoints(this.getPosition(), this.AttractedToPosition) < 10)
										 {
			
				this.getBody().setVel(cp.v(0, 0));
				// this.setPosition(this.AttractedToPosition);
			
			} else {
				
				var direction = GetDirection(this.getPosition(), this.AttractedToPosition);
				direction = cc.p(direction.x * this.AttractionMagnitude * dt, direction.y * this.AttractionMagnitude * dt);
				this.setPosition(cc.pAdd(this.getPosition(), direction));
			
			}
		}
		
		if(this.DebugHealth)
			this.Health -= dt;
		
		this.updateHealthStatus();
		
		if(!this.getParent()) {
			return;
		}
		
		this.isDay = this.getParent().isDay;
		if(this.isDay) {
			return;
		}
		
		this.EnsureVelocitySpeed();
		
		this.DebugDraw.clear();
		
		switch(this.DetectionType) {
			case FriendlySprite.DETECTION_OCCLUSION:
				this.InitializeForDetection();
				this.OcclusionDetection();
				break;
			
			case FriendlySprite.DETECTION_SONAR: 
				this.DetectedBodies = [];
				this.ShadowPoints = [];
				this.SonarDetection();
				break;
				
			default:
				console.error("Its not supposed to come here...");
				break;
		}
		
		this.drawOcclusionCircleAroundPlayer();
		this.CalculateLightingPoints();
		
		this.updateTexture();
		this.updateForBounds();
		
		if(!this.isDay && this.SonarEnable)
			this.DrawSonarBar();
		
		if(!this.isDay && this.MarkAndTrackEnable)
			this.DrawMarkAndTrackMeter();
		
		if(this.SmashHitEnable)
			this.DrawSmashBar();
		
		this.DrawHealthBar();
		
		if(!this.isDay && this.MarkNow) {
			this.DrawMarkCircleAroundPlayer();
		}
		
	},
	
	EnsureVelocitySpeed : function() {
		if(this.Attraction)
			return;
		
		var velocity = this.getBody().getVel();
		var calculatedSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
		
		if(calculatedSpeed < 200) {
			
			var vector = cp.v(velocity.x, velocity.y);
			vector.x /= calculatedSpeed;
			vector.y /= calculatedSpeed;
			
			vector.x *= this.SPEED;
			vector.y *= this.SPEED;
			
			this.getBody().setVel(vector);
		}
		
		if(calculatedSpeed > this.SPEED + 50) {
			var vector = cp.v(velocity.x, velocity.y);
			vector.x /= calculatedSpeed;
			vector.y /= calculatedSpeed;
			
			vector.x *= this.SPEED;
			vector.y *= this.SPEED;
			
			this.getBody().setVel(vector);
		}
	},
	
	MARK_AND_TRACK_POSITION: cc.p(40, 40),
	MARK_AND_TRACK_LENGTH_BETWEEN_DASHES: 20,
	MARK_AND_TRACK_DASH_LENGTH: 30,
	MARK_AND_TRACK_COLOR: cc.color(255, 255, 0, 255),
	MARK_AND_TRACK_COLOR_ON: cc.color(255, 0, 0, 255),
	MARK_AND_TRACK_LINE_WIDTH: 3,
	
	DrawMarkAndTrackMeter: function() {
		/*
			var number = this.SmashHitNumber;
			var lowerPosition = this.SMASH_BAR_POSITION;
			var width = this.SMASH_BAR_LENGTH_BETWEEN_DASHES;
			var upperPosition = cc.pAdd(lowerPosition, cc.p(0, this.SMASH_BAR_DASH_LENGTH));
			
			for(var i = 0; i < number; i++) {
				this.DrawNode.drawSegment(lowerPosition, upperPosition, this.SMASH_BAR_LINE_WIDTH, this.DRAW_NODE_SMASH_COLOR);
				
				if(i == number - 1 && this.SmashHit) {
					this.DrawNode.drawSegment(lowerPosition, upperPosition,
													this.SMASH_BAR_LINE_WIDTH, this.DRAW_NODE_SMASH_USING_COLOR);
				}
				
				lowerPosition = cc.pAdd(lowerPosition, cc.p(0, width + this.SMASH_BAR_DASH_LENGTH));
				upperPosition = cc.pAdd(upperPosition, cc.p(0, width + this.SMASH_BAR_DASH_LENGTH));
			}
		*/
		
		var number = this.MarkNumber;
		this.MARK_AND_TRACK_POSITION = cc.p(cc.winSize.width - 20, cc.winSize.height / 2 + 60);
		var upperPosition = this.MARK_AND_TRACK_POSITION;
		var width = this.MARK_AND_TRACK_LENGTH_BETWEEN_DASHES;
		var lowerPosition = cc.pAdd(upperPosition, cc.p(0, -this.SMASH_BAR_DASH_LENGTH));
		
		for(var i = 0; i < number; i++) {
			this.DrawNode.drawSegment(lowerPosition, upperPosition, this.SMASH_BAR_LINE_WIDTH, this.MARK_AND_TRACK_COLOR);
				
				if(i == 0 && this.MarkNow) {
					this.DrawNode.drawSegment(lowerPosition, upperPosition,
													this.MARK_AND_TRACK_LINE_WIDTH, this.MARK_AND_TRACK_COLOR_ON);
				}
				
				lowerPosition = cc.pAdd(lowerPosition, cc.p(0, -(width + this.SMASH_BAR_DASH_LENGTH)));
				upperPosition = cc.pAdd(upperPosition, cc.p(0, -(width + this.SMASH_BAR_DASH_LENGTH)));
		}
	},
	
	DrawHealthBar: function() {
		this.HEALTH_BAR_LENGTH = 100;
		this.HEALTH_BAR_POSITION = cc.p(cc.winSize.width - this.HEALTH_BAR_LENGTH - 50, cc.winSize.height - 10)
		
		var amount = this.Health;
		var max = this.MaxHealth;
		
		if(amount < 0)
			return;
		
		if(amount > max)
			return;
		
		var leftPosition = this.HEALTH_BAR_POSITION;
		var rightPosition = cc.p(this.HEALTH_BAR_POSITION.x + amount / max * this.HEALTH_BAR_LENGTH,
																						this.HEALTH_BAR_POSITION.y);
		var rightPositionFull = cc.p(this.HEALTH_BAR_POSITION.x + this.HEALTH_BAR_LENGTH, this.HEALTH_BAR_POSITION.y);
		
		var color = null;
		var mode = 1;
		if(amount > max / 3)
			mode = 2;
		
		if(amount > 2 * max / 3) 
			mode = 3;
		
		switch(mode) {
			case 1: 
				color = this.DRAW_NODE_SONAR_COLOR_END;
				break;
				
			case 2:
				color = this.DRAW_NODE_SONAR_COLOR_MID;
				break;
				
			case 3:
				color = this.DRAW_NODE_SONAR_COLOR_START;
				break;
		}
		
		// Override Color
		
		color = cc.color(150, 0, 0, 255);
		var backColor = cc.color(200, 200, 200, 255);
		
		this.DrawNode.drawSegment(leftPosition, rightPositionFull, this.HEALTH_BAR_LINE_WIDTH, backColor);
		this.DrawNode.drawSegment(leftPosition, rightPosition, this.HEALTH_BAR_LINE_WIDTH, color);
	},
	
	DrawSmashBar: function() {
		var number = this.SmashHitNumber;
		var lowerPosition = this.SMASH_BAR_POSITION;
		var width = this.SMASH_BAR_LENGTH_BETWEEN_DASHES;
		var upperPosition = cc.pAdd(lowerPosition, cc.p(0, this.SMASH_BAR_DASH_LENGTH));
		
		for(var i = 0; i < number; i++) {
			this.DrawNode.drawSegment(lowerPosition, upperPosition, this.SMASH_BAR_LINE_WIDTH, this.DRAW_NODE_SMASH_COLOR);
			
			if(i == number - 1 && this.SmashHit) {
				this.DrawNode.drawSegment(lowerPosition, upperPosition,
												this.SMASH_BAR_LINE_WIDTH, this.DRAW_NODE_SMASH_USING_COLOR);
			}
			
			lowerPosition = cc.pAdd(lowerPosition, cc.p(0, width + this.SMASH_BAR_DASH_LENGTH));
			upperPosition = cc.pAdd(upperPosition, cc.p(0, width + this.SMASH_BAR_DASH_LENGTH));
		}
	},
	
	DrawSonarBar: function() {
		var amount = this.CurrentSonarTime;
		var max = this.MAX_SONAR_TIME;
		
		if(amount <= 0)
			return;
		
		var mode = 1;
		var color = null;
		var lowerPosition = this.SONAR_BAR_POSITION;
		var upperPosition = cc.p(lowerPosition.x, this.SONAR_FULL_LENGTH * (amount / max) + lowerPosition.y)
		
		if(amount > max / 3)
			mode = 2;
		
		if(amount > 2 * max / 3) 
			mode = 3;
		
		switch(mode) {
			case 1: 
				color = this.DRAW_NODE_SONAR_COLOR_END;
				break;
				
			case 2:
				color = this.DRAW_NODE_SONAR_COLOR_MID;
				break;
				
			case 3:
				color = this.DRAW_NODE_SONAR_COLOR_START;
				break;
		}
		
		this.DrawNode.drawSegment(lowerPosition, upperPosition, this.SONAR_BAR_LINE_WIDTH, color);
		
	},
	
	updateForBounds: function() {
		var position = this.getPosition();
		
		if(position.x + this.Radius < 0) {
			this.Health = -1;
			return;
		}
		
		if(position.y + this.Radius < 0) {
			this.Health = -1;
			return;
		}
		
		if(position.x - this.Radius > cc.winSize.width) {
			this.Health = -1;
			return;
		}
		
		if(position.y - this.Radius > cc.winSize.height) {
			this.Health = -1;
			return;
		}
	},
	
	updateTexture: function() {
		for(var i = this.HealthValues.length; i > -1; i--) {
			if(this.Health <= this.HealthValues[i]) {
				
				if(this.DetectionType == FriendlySprite.DETECTION_SONAR)
					this.setTexture(this.SonarTextures[i]);
				else
					this.setTexture(this.Textures[i]);
				
				break;
			}
		}
	},
	
	drawOcclusionCircleAroundPlayer: function() {
		if(this.ShowDebugValues)
			this.DebugDraw.drawCircle(this.getPosition(), this.Radius, 2 * Math.PI, 60, true, 1, new cc.Color(0, 0, 255, 255));
	},
	
	OcclusionDetection: function() {
		var angle = 0;
		var radius = this.Radius + this.SkinLength;
		
		while(angle < 360) {
			var start = this.getPosition();
			var direction = cc.p(Math.sin(angle * Math.PI / 180), Math.cos(angle * Math.PI / 180));
			var ray = cc.p(radius * direction.x, radius * direction.y);
			var end = cc.pAdd(start, ray);
			
			var raycastHit = this.Space.segmentQueryFirst(start, end, cp.ALL_LAYERS, GlobalConstant.FRIENDLY_RAYCAST_GROUP);
			if(!raycastHit) {
				angle += this.MinAngle;
				continue;
			}
			
			if(this.ShowDebugValues)
				this.DebugDraw.drawSegment(start, raycastHit.hitPoint(start, end), 0.5, new cc.Color(255, 255, 255, 255));
			
			if(raycastHit.shape.isLKP) {
				raycastHit.shape.Sprite.setDetectedOnce(false);
				continue;
			}
			
			if(raycastHit.shape.Sprite.Detected == undefined) {
				angle += this.MinAngle;
				continue;
			}
			
			if(!this.AddToDetectedBodies(raycastHit.shape)) {
				return;
			}
			
			// console.log(raycastHit.shape.Sprite);
			
			raycastHit.shape.Sprite.Detected = true;
			var points = raycastHit.shape.Sprite.LightingHelper.GetLightingCoordinates(this.getPosition());
			
			if(points == undefined) {
				angle += this.MinAngle;
				continue;
			}
			
			var angle1 = angleWith_plusYClockWise(points[0], this.getPosition());
			var angle2 = angleWith_plusYClockWise(points[1], this.getPosition());
			var angles = DetermineLowerAndHigherAmongAngles(angle1, angle2);
			this.OcclusionDetectionUpward(angles[0] - this.SkinAngle);
			angle = this.OcclusionDetectionDownward(angles[1] + this.SkinAngle);
			
			// angle += this.MinAngle;
		}
		
		// this.DetectAllBodies();
	},
	
	OcclusionDetectionUpward: function(angle) {
		var radius = this.Radius + this.SkinLength;
		
		var start = this.getPosition();
		var direction = cc.p(Math.sin(angle * Math.PI / 180), Math.cos(angle * Math.PI / 180));
		var ray = cc.p(radius * direction.x, radius * direction.y);
		var end = cc.pAdd(start, ray);
		
		// return;
		var raycastHit = this.Space.segmentQueryFirst(start, end, cp.ALL_LAYERS, GlobalConstant.FRIENDLY_RAYCAST_GROUP);
		if(!raycastHit) {
			return;
		}
		
		if(this.ShowDebugValues)
			this.DebugDraw.drawSegment(start, raycastHit.hitPoint(start, end), 0.5, new cc.Color(0, 255, 0, 255));
		
		if(raycastHit.shape.isLKP) {
			raycastHit.shape.Sprite.setDetectedOnce(false);
			this.OcclusionDetectionUpward(angle);
			return;
		}
		
		if(raycastHit.shape.Sprite.Detected == undefined) {
			return;
		}
		
		raycastHit.shape.Sprite.Detected = true;
		var points = raycastHit.shape.Sprite.LightingHelper.GetLightingCoordinates(this.getPosition());
		if(!this.AddToDetectedBodies(raycastHit.shape)) {
			return;
		}
		
		if(points == undefined) {
			return;
		}
		
		var angle1 = angleWith_plusYClockWise(points[0], this.getPosition());
		var angle2 = angleWith_plusYClockWise(points[1], this.getPosition());
		var angles = DetermineLowerAndHigherAmongAngles(angle1, angle2);
		this.OcclusionDetectionUpward(angles[0] - this.SkinAngle);
	},
	
	OcclusionDetectionDownward: function(angle) {
		var radius = this.Radius + this.SkinLength;
		
		var start = this.getPosition();
		var direction = cc.p(Math.sin(angle * Math.PI / 180), Math.cos(angle * Math.PI / 180));
		var ray = cc.p(radius * direction.x, radius * direction.y);
		var end = cc.pAdd(start, ray);
		
		var raycastHit = this.Space.segmentQueryFirst(start, end, cp.ALL_LAYERS, GlobalConstant.FRIENDLY_RAYCAST_GROUP);
		if(!raycastHit) {
			return angle + this.MinAngle;
		}
		
		if(this.ShowDebugValues)
			this.DebugDraw.drawSegment(start, raycastHit.hitPoint(start, end), 0.5, new cc.Color(255, 0, 0, 255));
		
		if(raycastHit.shape.isLKP) {
			raycastHit.shape.Sprite.setDetectedOnce(false);
			return this.OcclusionDetectionUpward(angle);
		}
		
		if(raycastHit.shape.Sprite.Detected == undefined) {
			return angle;
		}
		
		var points = raycastHit.shape.Sprite.LightingHelper.GetLightingCoordinates(this.getPosition());
		raycastHit.shape.Sprite.Detected = true;
		if(!this.AddToDetectedBodies(raycastHit.shape)) {
			return 360;
		}
		
		if(points == undefined) {
			return angle;
		}

		
		var angle1 = angleWith_plusYClockWise(points[0], this.getPosition());
		var angle2 = angleWith_plusYClockWise(points[1], this.getPosition());
		var angles = DetermineLowerAndHigherAmongAngles(angle1, angle2);
		return this.OcclusionDetectionDownward(angles[1] + this.SkinAngle);
	},
	
	SonarDetection: function() {
		
		for(var i = 0; i < this.SonarLKPShapes.length; i++) {
		
			if(this.SonarLKPShapes[i].Sprite.LKPShape)
				this.SonarLKPShapes[i].Sprite.setDetectedOnce(false);
		}
		
		this.SonarLKPShapes = [];
		
		for(var i = 0; i < this.SonarDetectedShapes.length; i++) {
			
			if(this.SonarDetectedShapes[i].Sprite)
				this.SonarDetectedShapes[i].Sprite.Detected = true;
		}

	},
	
	DetectAllBodies: function() {
		for(var i = 0; i < this.DetectedBodies.length; i++) {
			this.DetectedBodies[i].Sprite.Detected = true;
		}
	},
	
	AddToDetectedBodies: function(shape) {
		for(var i = 0; i < this.DetectedBodies.length; i++) {
			if(this.DetectedBodies[i] === shape)
				return false;
		}
		
		this.DetectedBodies.push(shape);
		return true;
	},
	
	InitializeForDetection: function() {
		for(var i = 0; i < this.DetectedBodies.length; i++) {
			this.DetectedBodies[i].Sprite.Detected = false;
		}
		
		this.DetectedBodies = [];
		this.ShadowPoints = [];
	},
	
	once: 0,
	
	CalculateLightingPoints: function() {
		var points = [];
		switch(this.DetectionType) {
			case FriendlySprite.DETECTION_OCCLUSION:
				for(var i = 0; i < this.DetectedBodies.length; i++) {
					points = this.DetectedBodies[i].Sprite.LightingHelper.GetLightingCoordinates(this.getPosition());
					
					if(points == undefined)
						continue;
					
					this.ShadowPoints.push(points[0]);
					this.ShadowPoints.push(points[1]);
				}
				break;
			
			case FriendlySprite.DETECTION_SONAR: 
				// You don't get Shadows in SONAR

				/*
					for(var i = 0; i < this.SonarDetectedShapes.length; i++) {
						points = this.SonarDetectedShapes[i].Sprite.LightingHelper.GetLightingCoordinates(this.	getPosition())
						
						this.ShadowPoints.push(points[0]);
						this.ShadowPoints.push(points[1]);
					}
				*/
				break;
				
			default:
				console.error("Its not supposed to come here...");
				break;
		}
	},
	
	DetectedOnDeath: [],
	Parent: null,
	
	updateParticleSystem: function() {
		if(this.DetectionType == FriendlySprite.DETECTION_SONAR) {
			this.DeathParticleSystem.setStartColor(cc.color(180, 0, 0, 255));
			this.DeathParticleSystem.setEndColor(cc.color(180, 0, 0, 255));
		}
	},
	
	updateHealthStatus: function() {
		if(this.Health <= 0) {
			this.setVisible(false);
			this.DrawNode.clear();
			
			if(this.DeathNotScheduled) {
				this.Space.removeShape(this.Shape);
				this.getParent().setLose();
				this.Parent = this.getParent();
				this.getParent().removeChild(this);	
				
				this.DetectedOnDeath = this.DetectedBodies;
				
				this.DeathParticleSystem.setPosition(this.getPosition());
				this.updateParticleSystem();
				
				this.Parent.addChild(this.DeathParticleSystem);
				this.Parent.doNotUpdateTheBackground();
		
				cc.Director._getInstance()._scheduler.scheduleCallbackForTarget(this, function() {
					this.InitializeForDetection();
					this.DetectedOnDeath = this.DetectedBodies;
					for(var i = 0; i < this.DetectedOnDeath.length; i++) {
						if(this.DetectedOnDeath.Sprite)
							this.DetectedOnDeath.Sprite.Detected = false;
					}
					
					this.Parent.destroyLights();
					
					
				}, this.DeathParticleSystem.life, false, 0, false);
				
				this.DeathNotScheduled = false;
			}
		}
	},
	
	RestoreHealth: function() {
		this.Health = this.MaxHealth;
	},
	
	NullifySonarDetection: function() {
		for(var i = 0; i < this.SonarDetectedShapes.length; i++) {
			this.SonarDetectedShapes[i].Sprite.Detected = false;
		}
		
		this.SonarDetectedShapes = [];
	}
});

FriendlySprite.DETECTION_OCCLUSION = 0;
FriendlySprite.DETECTION_SONAR = 1;

FriendlySprite.MIN_EDGE_LENGTH = 40;