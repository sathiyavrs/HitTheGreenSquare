var deg2Rad = Math.PI / 180;

var Paddle = cc.Sprite.extend({
	
	isPaddle: true,
	
	SPEED_FAST: 600,
	SPEED_SLOW: 200,
	
	MOVEMENT_SPEED: 600,
	DISTANCE_FROM_EDGE_VERTICAL: 40,
	DISTANCE_FROM_EDGE_HORIZONTAL: 40,
	CURVE_RADIUS: 80,
	LENGTH_OF_DASH: 12,
	WIDTH_BETWEEN_DASHES: 15,
	MAX_NUMBER_OF_DASHES_DRAWN: 10,
	
	PARTICLE_SIZE: 10,
	PARTICLE_SPEED: 50,
	PARTICLE_COLOR: cc.color(200, 200, 200, 255),
	
	Space: null,
	Body: null,
	Shape: null,
	
	FriendlyPlayer: null,
	PositionOfFriendly: null,
	FriendlyCollisionParticleSystem: null,
	
	FriendlyWidth: null,
	FriendlyHeight: null,
	
	State: null,
	Direction: null,
	
	Velocity: null,
	AngularVelocity: null,
	RotationAngle: null,
	IsMoving: false,
	
	AimDrawNode: null,
	AimAttributes: {
		LINE_WIDTH: 2,
		COLOR: cc.color(255, 255, 255, 255)
	},
	CanAim: false,
	MousePosition: null,
	
	SetFriendlyPosition: false,
	
	ctor: function(space, position, state, friendlyWidth, friendlyHeight) {
		this._super(res.Paddle, cc.Rect(0, 0, 0, 0));
		
		this.Space = space;
		this.State = state;
		this.setInitialPosition(position);
		
		this.DetermineState();
		
		this.FriendlyHeight = friendlyHeight;
		this.FriendlyWidth = friendlyWidth;
		
		this.initShape();
		this.scheduleUpdate();
		this.updateFriendlyPosition();
		
		this.Velocity = cp.v(0, 0);
		this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
		
		this.FriendlyCollisionParticleSystem = new BurstEffect(res.WhiteParticle, 20, cc.p(0, 0), 
							cc.color(200, 200, 200, 200), 10);
							
		this.AimDrawNode = new cc.DrawNode();
	},
	
	setInitialPosition: function(position) {
		// Doesn't yet check whether the other values are in place.
		
		switch(this.State) {
			
			case Paddle.UP:
				var top = cc.winSize.height - this.DISTANCE_FROM_EDGE_VERTICAL;
				this.setPosition(cc.p(position.x, top));
				this.RotationAngle = 180;
				break;
				
			case Paddle.DOWN:
				var bottom = this.DISTANCE_FROM_EDGE_VERTICAL;
				this.setPosition(cc.p(position.x, bottom));
				this.setRotation(180);
				this.RotationAngle = 0;
				break;
				
			case Paddle.LEFT:
				var left = this.DISTANCE_FROM_EDGE_HORIZONTAL;
				this.setPosition(cc.p(left, position.y));
				this.setRotation(90);
				this.RotationAngle = 90;
				break;
				
			case Paddle.RIGHT:
				var right = cc.winSize.width - this.DISTANCE_FROM_EDGE_HORIZONTAL;
				this.setPosition(cc.p(right, position.y));
				this.setRotation(270);
				this.RotationAngle = 270;
				break;
		}
	},
	
	initShape: function() {
		this.Body = new cp.Body(1, cp.momentForBox(10, this.getContentSize().width, this.getContentSize().height));
		this.Shape = new cp.BoxShape(this.Body, this.getContentSize().width, this.getContentSize().height);
		this.Body.setPos(this.getPosition());
		
		this.Shape.setSensor(true);
		this.Shape.setCollisionType(GlobalConstant.PADDLE_COLLISION_TYPE);
		this.Shape.Sprite = this;
		
		this.Space.addShape(this.Shape);
		
		this.Space.addCollisionHandler(GlobalConstant.FRIENDLY_COLLISION_TYPE, GlobalConstant.PADDLE_COLLISION_TYPE, 
			this.onCollisionEnter.bind(this), null, null, null);
			
		
		
		cc.eventManager.addListener({
			
			event: cc.EventListener.MOUSE,
			
			onMouseMove: function(event){
				var str = "MousePosition X: " + event.getLocationX() + "  Y:" + event.getLocationY();
				// do something...
				
				this.MousePosition = cc.p(event.getLocationX(), event.getLocationY());
			}.bind(this),
			
			onMouseUp: function(event){
				var str = "Mouse Up detected, Key: " + event.getButton();
				// do something...
			}.bind(this),
			
			onMouseDown: function(event){
				var str = "Mouse Down detected, Key: " + event.getButton();
				// do something...
				
				if(event.getButton() == 0) {
					return;
				}
				
				if(this.FriendlyPlayer != null) {
					var position = cc.p(0, 0);
					position.y += this.getContentSize().height / 2;
					position = RotatePositionClockwiseAboutOrigin(position, this.RotationAngle);
					position = cc.pAdd(this.getPosition(), position);
					
					this.FriendlyCollisionParticleSystem = new BurstEffect(res.WhiteParticle, 
								this.PARTICLE_SPEED, position, 
			 					this.PARTICLE_COLOR, 
								this.PARTICLE_SIZE);
			
					this.FriendlyCollisionParticleSystem.setPosition(position);
					
					this.getParent().addChild(this.FriendlyCollisionParticleSystem);	
					
					var direction = GetDirection(this.PositionOfFriendly, this.MousePosition);
					direction = cc.p(direction.x * this.FriendlyPlayer.SPEED, direction.y * this.FriendlyPlayer.SPEED);
					this.FriendlyPlayer.getBody().applyImpulse(direction, cp.v(0, 0));
					this.FriendlyPlayer.Free();
					this.FriendlyPlayer = null;
				}
			}.bind(this)
			
		},this);
		
		cc.eventManager.addListener({
			event: cc.EventListener.KEYBOARD,
			
			onKeyPressed:  function(keyCode, event){
				
				if(keyCode == cc.KEY.shift) {
					this.MOVEMENT_SPEED = this.SPEED_SLOW;
					if(this.FriendlyPlayer != null)
						this.FriendlyPlayer.setPosition(this.PositionOfFriendly);
					
					if(this.FriendlyPlayer != null)
						this.SetFriendlyPosition = true;
				}
				
				if(keyCode == cc.KEY.f) {
					if(this.FriendlyPlayer != null)
						this.FriendlyPlayer.setPosition(this.PositionOfFriendly);
				}
				
				if(keyCode == cc.KEY.q) {
					this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
					this.IsMoving = true;
					
					return;
				}
				
				if(keyCode == cc.KEY.e) {
					this.Direction = Paddle.DIRECTION_CLOCKWISE;
					this.IsMoving = true;
					
					return;
				}
				
				if(keyCode == cc.KEY.z) {
					this.Direction = Paddle.DIRECTION_CLOCKWISE;
					this.IsMoving = true;
					
					return;
				}
				
				if(keyCode == cc.KEY.c) {
					this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
					this.IsMoving = true;
					
					return;
				}
				
				if(this.IsMoving)
					return;
				
				switch(this.State) {
				
					case Paddle.DOWN:
					
						if(keyCode == cc.KEY.a || keyCode == cc.KEY.left) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.d || keyCode == cc.KEY.right) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						break;
						
					case Paddle.UP:
					
						if(keyCode == cc.KEY.a || keyCode == cc.KEY.left) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.d || keyCode == cc.KEY.right) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						break;
						
					case Paddle.RIGHT:
						
						if(keyCode == cc.KEY.w || keyCode == cc.KEY.up) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.s || keyCode == cc.KEY.down) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						break;
						
					case Paddle.LEFT:
						
						if(keyCode == cc.KEY.w || keyCode == cc.KEY.up) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.s || keyCode == cc.KEY.down) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						break;
						
					case Paddle.UP_LEFT:
						
						if(keyCode == cc.KEY.a || keyCode == cc.KEY.left) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.d || keyCode == cc.KEY.right) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.w || keyCode == cc.KEY.up) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.s || keyCode == cc.KEY.down) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						break;
					
					case Paddle.UP_RIGHT: 
					
						if(keyCode == cc.KEY.a || keyCode == cc.KEY.left) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.d || keyCode == cc.KEY.right) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.w || keyCode == cc.KEY.up) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.s || keyCode == cc.KEY.down) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						
						break;
						
					case Paddle.DOWN_LEFT:
					
						if(keyCode == cc.KEY.a || keyCode == cc.KEY.left) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.d || keyCode == cc.KEY.right) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.w || keyCode == cc.KEY.up) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.s || keyCode == cc.KEY.down) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						break;
						
					case Paddle.DOWN_RIGHT:
					
						if(keyCode == cc.KEY.a || keyCode == cc.KEY.left) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.d || keyCode == cc.KEY.right) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.w || keyCode == cc.KEY.up) {
							this.Direction = Paddle.DIRECTION_ANTI_CLOCKWISE;
							this.IsMoving = true;
						}
						
						if(keyCode == cc.KEY.s || keyCode == cc.KEY.down) {
							this.Direction = Paddle.DIRECTION_CLOCKWISE;
							this.IsMoving = true;
						}
						
						break;
					
					default:
						console.error("This isn't supposed to happen...");
						break;
				}
			}.bind(this),
			
			onKeyReleased: function(keyCode, event){
				this.IsMoving = false;
				
				if(keyCode == cc.KEY.shift) {
					this.MOVEMENT_SPEED = this.SPEED_FAST;
					
					this.SetFriendlyPosition = false;
				
				}
				
			}.bind(this)
		}, this);
		
	},
	
	onCollisionEnter: function(arbiter, shape) {
		var shapes = arbiter.getShapes();
		
		var position = cc.p(0, 0);
		position.y += this.getContentSize().height / 2;
		position = RotatePositionClockwiseAboutOrigin(position, this.RotationAngle);
		position = cc.pAdd(this.getPosition(), position);
		
		if(this.FriendlyPlayer == null) {
			this.FriendlyCollisionParticleSystem = new BurstEffect(res.WhiteParticle, 
								this.PARTICLE_SPEED, position, 
			 					this.PARTICLE_COLOR, 
								this.PARTICLE_SIZE);
			
			if(this.getParent().isSonar) {
				this.FriendlyCollisionParticleSystem.setStartColor(cc.color(200, 0, 0, 255));
				this.FriendlyCollisionParticleSystem.setEndColor(cc.color(200, 0, 0, 255));
			}
			
			this.FriendlyCollisionParticleSystem.setPosition(position);
			
			this.getParent().addChild(this.FriendlyCollisionParticleSystem);	
		}
		
		// this.FriendlyCollisionParticleSystem = new BurstEffect(res.WhiteParticle, 15, position, 
		// 					cc.color(200, 200, 200, 200), 10);
		
		// this.FriendlyCollisionParticleSystem.setPosition(position);
		
		// this.getParent().addChild(this.FriendlyCollisionParticleSystem);					
		
		for(var i = 0; i < shapes.length; i++) {
			if(!shapes[i].Sprite.isFriendly) {
				continue;
			}
			
			shapes[i].body.setVel(cp.v(0, 0));
			this.FriendlyPlayer = shapes[i].Sprite;
			this.FriendlyPlayer.Caught(this.PositionOfFriendly, 600);
			this.FriendlyPlayer.RestoreHealth();
			// this.FriendlyPlayer.setPosition(this.PositionOfFriendly);
			break;
		}
		
		return false;
	},
	
	AimDrawNodeAdded: false,
	
	update: function(dt) {
		
		if(this.FriendlyPlayer != null) {
			this.FriendlyPlayer.Health = this.FriendlyPlayer.MaxHealth;
			if(this.SetFriendlyPosition)
				this.FriendlyPlayer.setPosition(this.PositionOfFriendly);
		}
		
		if(!this.AimDrawNodeAdded) {
			this.getParent().addChild(this.AimDrawNode);
			this.AimDrawNodeAdded = true;
		}
		
		this.AimDrawNode.clear();
		
		this.DetermineState();
		this.updateMovement(dt);
		this.updateFriendlyPosition();
		this.updatePhysics();
		this.updateFriendly();
		
		if(this.FriendlyPlayer != null) {
			this.FriendlyPlayer.setAttractedToPosition(this.PositionOfFriendly);
			
			if(this.MousePosition == undefined) {
				return;
			}
			
			var mousePosition = this.MousePosition;
			var friendlyPosition = this.FriendlyPlayer.getPosition();
			
			var distance = cc.pDistance(mousePosition, friendlyPosition);
			var numberOfDashes = distance / (this.LENGTH_OF_DASH + this.WIDTH_BETWEEN_DASHES);
			
			if(numberOfDashes > this.MAX_NUMBER_OF_DASHES_DRAWN) {
				numberOfDashes = this.MAX_NUMBER_OF_DASHES_DRAWN;
			}
			
			this.drawDashedLines(friendlyPosition, mousePosition, this.LENGTH_OF_DASH,
																numberOfDashes, this.WIDTH_BETWEEN_DASHES);
		}
	},
	
	drawDashedLines: function(Start, End, LengthOfDash, NumberOfDashes, Width) {
		var dashesCovered = 0;
		var direction = GetDirection(Start, End);
		var width = cc.p(direction.x * Width, direction.y * Width);
		direction = cc.p(direction.x * LengthOfDash, direction.y * LengthOfDash);
		
		var head = Start;
		var tail = cc.pAdd(Start, direction);
		var startColor = this.AimAttributes.COLOR;
		
		var alpha = 255;
		var totalDistance = (LengthOfDash + Width) * NumberOfDashes;
		
		var coveredDistance = 0;
		
		while (dashesCovered < NumberOfDashes) {
			this.AimDrawNode.drawSegment(head, tail, this.AimAttributes.LINE_WIDTH,
							cc.color(startColor.r, startColor.g, startColor.b, alpha));
			
			head = tail;
			head = cc.pAdd(tail, width);
			tail = cc.pAdd(head, direction);
			
			coveredDistance += LengthOfDash + Width;
			alpha = 1 - (coveredDistance / totalDistance);
			alpha *= 255;
			
			dashesCovered++;
		}
	},
	
	once: 0,
	
	updateMovement: function(dt) {
		if(!this.IsMoving)
			return;
		
		var distance = this.MOVEMENT_SPEED * dt;
		var position = this.getPosition();
		
		var leftEdge = this.DISTANCE_FROM_EDGE_HORIZONTAL;
		var rightEdge = cc.winSize.width - this.DISTANCE_FROM_EDGE_HORIZONTAL;
		var bottomEdge = this.DISTANCE_FROM_EDGE_VERTICAL;
		var topEdge = cc.winSize.height - this.DISTANCE_FROM_EDGE_VERTICAL;
		
		switch(this.State) {
			
			case Paddle.UP:
				
				if(this.Direction == Paddle.DIRECTION_CLOCKWISE) {
					position.x += distance;
					
					if(position.x > rightEdge - this.CURVE_RADIUS) {
						
						var difference = position.x - (rightEdge - this.CURVE_RADIUS);
						position.x = rightEdge - this.CURVE_RADIUS;
						
						var center = cc.p(rightEdge - this.CURVE_RADIUS, topEdge - this.CURVE_RADIUS);
						var angleToTravel = difference / this.CURVE_RADIUS;
						angleToTravel /= deg2Rad;
						
						// RotatePositionClockwiseAboutOrigin
						
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, angleToTravel);
						point = cc.pAdd(point, center);
						
						position = cc.p(point.x, point.y);
						this.RotationAngle += angleToTravel;
						
					} else {
						
					}
						
					
					
				} else {
					position.x -= distance;
					
					if(position.x < leftEdge + this.CURVE_RADIUS) {
						var difference = leftEdge + this.CURVE_RADIUS - position.x;
						position.x = leftEdge + this.CURVE_RADIUS;
						
						var center = cc.p(leftEdge + this.CURVE_RADIUS, topEdge - this.CURVE_RADIUS);
						var angleToTravel = difference / this.CURVE_RADIUS;
						angleToTravel /= deg2Rad;
						
						// RotatePositionClockwiseAboutOrigin
						
						var point = cc.p(position.x - center.x, position.y - center.y);
						angleToTravel *= -1;
						point = RotatePositionClockwiseAboutOrigin(point, angleToTravel);
						point = cc.pAdd(point, center);
						
						position = cc.p(point.x, point.y);
						// console.log(p);
						this.RotationAngle += angleToTravel;
						
					} else {
						
					}
						
				}
				
				this.setPosition(position);
				this.setRotation(this.RotationAngle);
				
				break;
				
			case Paddle.DOWN:
				
				if(this.Direction == Paddle.DIRECTION_CLOCKWISE) {
					position.x -= distance;
					
					if(position.x < leftEdge + this.CURVE_RADIUS) {
						
						var distanceRemaining = leftEdge + this.CURVE_RADIUS - position.x;
						var angleToTravel = distanceRemaining / this.CURVE_RADIUS;
						angleToTravel /= deg2Rad;
						position = cc.p(leftEdge + this.CURVE_RADIUS, bottomEdge);
						
						var center = cc.p(leftEdge + this.CURVE_RADIUS, bottomEdge + this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, angleToTravel);
						position = cc.pAdd(point, center);
						this.RotationAngle += angleToTravel;
						
					} else {
						
					}
					
				} else {
					position.x += distance;
					
					if(position.x > rightEdge - this.CURVE_RADIUS) {
						
						var distanceRemaining = position.x - (rightEdge - this.CURVE_RADIUS);
						var angleToTravel = distanceRemaining / this.CURVE_RADIUS;
						angleToTravel /= deg2Rad;
						position = cc.p(rightEdge - this.CURVE_RADIUS, bottomEdge);
						this.RotationAngle = 360;
						
						var center = cc.p(rightEdge - this.CURVE_RADIUS, bottomEdge + this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, -angleToTravel);
						position = cc.pAdd(point, center);
						this.RotationAngle -= angleToTravel;
					} else {
						
					}
				}
				
				this.setPosition(position);
				this.setRotation(this.RotationAngle);
				
				break;
				
			case Paddle.LEFT:
			
				if(this.Direction == Paddle.DIRECTION_CLOCKWISE) {
					
					position.y += distance;
					
					if(position.y > topEdge - this.CURVE_RADIUS) {
						var distanceRemaining = position.y - (topEdge - this.CURVE_RADIUS);
						var angleToTravel = distanceRemaining / this.CURVE_RADIUS;
						angleToTravel /= deg2Rad;
						
						position = cc.p(leftEdge, topEdge - this.CURVE_RADIUS);
						var center = cc.p(leftEdge + this.CURVE_RADIUS, topEdge - this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, angleToTravel);
						position = cc.pAdd(point, center);
						this.RotationAngle += angleToTravel;
						
					} else {
						
					}
					
				} else {
					position.y -= distance;
					
					if(position.y < bottomEdge + this.CURVE_RADIUS) {
						
						var distanceRemaining = bottomEdge + this.CURVE_RADIUS - position.y;
						var angleToTravel = distanceRemaining / this.CURVE_RADIUS;
						angleToTravel /= deg2Rad;
						
						position = cc.p(leftEdge, bottomEdge + this.CURVE_RADIUS);
						var center = cc.p(leftEdge + this.CURVE_RADIUS, bottomEdge + this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, -angleToTravel);
						position = cc.pAdd(point, center);
						this.RotationAngle -= angleToTravel;
						
					} else {
						
					}
				}
				
				this.setPosition(position);
				this.setRotation(this.RotationAngle);
				
				break;
				
			case Paddle.RIGHT:
				
				if(this.Direction == Paddle.DIRECTION_CLOCKWISE) {
					position.y -= distance;
					
					if(position.y < bottomEdge + this.CURVE_RADIUS) {
						var distanceRemaining = (bottomEdge + this.CURVE_RADIUS) - position.y;
						position.y = bottomEdge + this.CURVE_RADIUS;
						
						var angleToTravel = distanceRemaining / this.CURVE_RADIUS;
						angleToTravel /= deg2Rad;
						
						var center = cc.p(rightEdge - this.CURVE_RADIUS, bottomEdge + this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						
						// RotatePositionClockwiseAboutOrigin
						
						point = RotatePositionClockwiseAboutOrigin(point, angleToTravel);
						position = cc.pAdd(point, center);
						this.RotationAngle += angleToTravel;
					} else {
						
					}
					
				} else {
					position.y += distance;
					
					if(position.y > topEdge - this.CURVE_RADIUS) {
						var distanceRemaining = position.y - (topEdge - this.CURVE_RADIUS);
						position.y = topEdge - this.CURVE_RADIUS;
						
						var angleToTravel = distanceRemaining / this.CURVE_RADIUS;
						angleToTravel /= deg2Rad;
						
						var center = cc.p(rightEdge - this.CURVE_RADIUS, topEdge - this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, -angleToTravel);
						position = cc.pAdd(point, center);
						this.RotationAngle -= angleToTravel;
					} else {
						
					}
				}
				
				this.setPosition(position);
				this.setRotation(this.RotationAngle);
				
				break;
				
			case Paddle.UP_LEFT:
			
				var angleToTravel = distance / this.CURVE_RADIUS;
				angleToTravel /= deg2Rad;
			
				if(this.Direction == Paddle.DIRECTION_CLOCKWISE) {
					
					if(angleToTravel + this.RotationAngle > 180) {

						angleToTravel = 180 - this.RotationAngle;
						var distanceCovered = angleToTravel * this.CURVE_RADIUS * deg2Rad;
						var distanceRemaining = distance - distanceCovered;
						
						position = cc.p(leftEdge + this.CURVE_RADIUS, topEdge);
						position.x += distanceRemaining;
						this.RotationAngle = 180;
					
					} else {
						
						var center = cc.p(leftEdge + this.CURVE_RADIUS, topEdge - this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, angleToTravel);
						position = cc.pAdd(point, center);
						
						this.RotationAngle += angleToTravel;
						
					}
					
				} else {
					
					if(this.RotationAngle - angleToTravel < 90) {
						
						angleToTravel = this.RotationAngle - 90;
						var distanceCovered = angleToTravel * this.CURVE_RADIUS * deg2Rad;
						var distanceRemaining = distance - distanceCovered;
						
						position = cc.p(leftEdge, topEdge - this.CURVE_RADIUS);
						position.y -= distanceRemaining;
						this.RotationAngle = 90;
						
					} else {
						
						var center = cc.p(leftEdge + this.CURVE_RADIUS, topEdge - this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, -angleToTravel);
						position = cc.pAdd(point, center);
						
						this.RotationAngle -= angleToTravel;
						
					}
					
				}
				
				this.setPosition(position);
				this.setRotation(this.RotationAngle);
				
				break;
				
			case Paddle.UP_RIGHT:
				
				if(this.Direction == Paddle.DIRECTION_CLOCKWISE) {
					
					var angleToTravel = distance / this.CURVE_RADIUS;
					angleToTravel /= deg2Rad;
					
					if(angleToTravel + this.RotationAngle > 270) {
						
						angleToTravel = 270 - this.RotationAngle;
						var distanceCovered = angleToTravel * this.CURVE_RADIUS * deg2Rad;
						this.RotationAngle = 270;
						
						position = cc.p(rightEdge, topEdge - this.CURVE_RADIUS);
						var distanceRemaining = distance - distanceCovered;
						position.y -= distanceRemaining;
						
					} else {
						
						var center = cc.p(rightEdge - this.CURVE_RADIUS, topEdge - this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						
						// RotatePositionClockwiseAboutOrigin
						point = RotatePositionClockwiseAboutOrigin(point, angleToTravel);
						position = cc.pAdd(point, center);
						this.RotationAngle += angleToTravel;
					}
					
				} else {
					
					var angleToTravel = distance / this.CURVE_RADIUS;
					angleToTravel /= deg2Rad;
					
					if(this.RotationAngle - angleToTravel < 180) {
						
						angleToTravel = this.RotationAngle - 180;
						var distanceCovered = angleToTravel * this.CURVE_RADIUS * deg2Rad;
						this.RotationAngle = 180;
						
						position = cc.p(rightEdge - this.CURVE_RADIUS, topEdge);
						var distanceRemaining = distance - distanceCovered;
						position.x -= distanceRemaining;
						
					} else {
						
						var center = cc.p(rightEdge - this.CURVE_RADIUS, topEdge - this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						
						// RotatePositionClockwiseAboutOrigin
						point = RotatePositionClockwiseAboutOrigin(point, -angleToTravel);
						position = cc.pAdd(point, center);
						this.RotationAngle -= angleToTravel;
					}
				}
				
				this.setPosition(position);
				this.setRotation(this.RotationAngle);
				
				break;
				
			case Paddle.DOWN_LEFT:
			
				if(this.Direction == Paddle.DIRECTION_CLOCKWISE) {
					
					var angleToTravel = distance / this.CURVE_RADIUS;
					angleToTravel /= deg2Rad;
					
					if(angleToTravel + this.RotationAngle > 90) {
						
						angleToTravel = 90 - this.RotationAngle;
						var distanceCovered = angleToTravel * this.CURVE_RADIUS * deg2Rad;
						var distanceRemaining = distance - distanceCovered;
						
						position = cc.p(leftEdge, bottomEdge + this.CURVE_RADIUS);
						position.y += distanceRemaining;
						this.RotationAngle = 90;
						
					} else {
						
						var center = cc.p(leftEdge + this.CURVE_RADIUS, bottomEdge + this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						
						point = RotatePositionClockwiseAboutOrigin(point, angleToTravel);
						position = cc.pAdd(center, point);
						this.RotationAngle += angleToTravel;
					}
					
				} else {

					var angleToTravel = distance / this.CURVE_RADIUS;
					angleToTravel /= deg2Rad;
				
					if(this.RotationAngle - angleToTravel < 0) {
						
						angleToTravel = this.RotationAngle;
						var distanceCovered = angleToTravel * this.CURVE_RADIUS * deg2Rad;
						var distanceRemaining = distance - distanceCovered;
						
						position = cc.p(leftEdge + this.CURVE_RADIUS, bottomEdge);
						position.x += distanceRemaining;
						this.RotationAngle = 0;
						
					} else {
						var center = cc.p(leftEdge + this.CURVE_RADIUS, bottomEdge + this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						
						point = RotatePositionClockwiseAboutOrigin(point, -angleToTravel);
						position = cc.pAdd(center, point);
						this.RotationAngle -= angleToTravel;
					}
				}
				
				this.setPosition(position);
				this.setRotation(this.RotationAngle);
				
				break;
				
			case Paddle.DOWN_RIGHT:
			
				if(this.Direction == Paddle.DIRECTION_CLOCKWISE) {
					
					var angleToTravel = distance / this.CURVE_RADIUS;
					angleToTravel /= deg2Rad;
					
					if(angleToTravel + this.RotationAngle > 360) {
						
						angleToTravel = 360 - this.RotationAngle;
						this.RotationAngle = 0;
						var distanceCovered = angleToTravel * this.CURVE_RADIUS * deg2Rad;
						var distanceRemaining = distance - distanceCovered;
						
						position = cc.p(rightEdge - this.CURVE_RADIUS, bottomEdge);
						position.x -= distanceRemaining;
						
					} else {
						var center = cc.p(rightEdge - this.CURVE_RADIUS, bottomEdge + this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, angleToTravel);
						position = cc.pAdd(center, point);
						
						this.RotationAngle += angleToTravel;
					}
					
				} else {
					var angleToTravel = distance / this.CURVE_RADIUS;
					angleToTravel /= deg2Rad;
					
					if(this.RotationAngle - angleToTravel < 270) {
						angleToTravel = this.RotationAngle - 270;
						this.RotationAngle = 270;
						
						var distanceCovered = angleToTravel * this.CURVE_RADIUS * deg2Rad;
						var distanceRemaining = distance - distanceCovered;
						
						position = cc.p(rightEdge, bottomEdge + this.CURVE_RADIUS);
						position.y += distanceRemaining;
						
					} else {
						
						var center = cc.p(rightEdge - this.CURVE_RADIUS, bottomEdge + this.CURVE_RADIUS);
						var point = cc.p(position.x - center.x, position.y - center.y);
						point = RotatePositionClockwiseAboutOrigin(point, -angleToTravel);
						position = cc.pAdd(center, point);
						
						this.RotationAngle -= angleToTravel;	
					}
				}
				
				this.setPosition(position);
				this.setRotation(this.RotationAngle);
				
				break;
		}
	},
	
	calculateVelocity: function() {
		// State is already determined
		
		
	},
	
	updateFriendlyPosition: function() {
		var position = cc.p(0, 0);
		position.y += this.getContentSize().height / 2;
		position.y += this.FriendlyHeight / 2;
		
		position = RotatePositionClockwiseAboutOrigin(position, this.RotationAngle);
		position = cc.pAdd(this.getPosition(), position);
		this.PositionOfFriendly = position;
	},
	
	DetermineState: function() {
		var position = this.getPosition();
		var leftEdge = this.DISTANCE_FROM_EDGE_HORIZONTAL;
		var rightEdge = cc.winSize.width - this.DISTANCE_FROM_EDGE_HORIZONTAL;
		var bottomEdge = this.DISTANCE_FROM_EDGE_VERTICAL;
		var topEdge = cc.winSize.height - this.DISTANCE_FROM_EDGE_VERTICAL;
		
		if(position.x <= leftEdge) {
			this.State = Paddle.LEFT;
			return;
		}
		
		if(position.x >= rightEdge) {
			this.State = Paddle.RIGHT;
			return;
		}
		
		if(position.y >= topEdge) {
			this.State = Paddle.UP;
			return;
		}
		
		if(position.y <= bottomEdge) {
			this.State = Paddle.DOWN;
			return;
		}
		
		if((position.x > leftEdge && position.x <= leftEdge + this.CURVE_RADIUS)) {
			
			if(position.y > bottomEdge && position.y <= bottomEdge + this.CURVE_RADIUS) {
				this.State = Paddle.DOWN_LEFT;
				return;
			}
			
			if(position.y < topEdge && position.y >= topEdge - this.CURVE_RADIUS) {
				this.State = Paddle.UP_LEFT;
				return;
			}
		}
		
		if(position.x < rightEdge && position.x >= rightEdge - this.CURVE_RADIUS) {
			
			if(position.y > bottomEdge && position.y <= bottomEdge + this.CURVE_RADIUS) {
				this.State = Paddle.DOWN_RIGHT;
				return;
			}
			
			if(position.y < topEdge && position.y >= topEdge - this.CURVE_RADIUS) {
				this.State = Paddle.UP_RIGHT;
				return;
			}
		}
		
		this.State = Paddle.IMPOSSIBLE_STATE;
		if(this.once <= 1) {
			console.log(position);
			console.log(rightEdge);
			console.error("Impossible State!");
			this.once++;
		}
		
		
	},
	
	updateFriendly: function() {
		if(this.FriendlyPlayer == null) {
			return;
		}
		
		// this.FriendlyPlayer.setPosition(this.PositionOfFriendly);
	},
	
	updatePhysics: function() {
		this.Body.setPos(this.getPosition());
		this.Body.setAngle(this.RotationAngle * -deg2Rad);
	}
});

Paddle.DOWN = 0;
Paddle.UP = 1;
Paddle.RIGHT = 2;
Paddle.LEFT = 3;
Paddle.UP_RIGHT = 4;
Paddle.RIGHT_UP = 4;
Paddle.LEFT_UP = 5;
Paddle.UP_LEFT = 5;
Paddle.DOWN_LEFT = 6;
Paddle.LEFT_DOWN = 6;
Paddle.DOWN_RIGHT = 7;
Paddle.RIGHT_DOWN = 7;
Paddle.IMPOSSIBLE_STATE = 8;

Paddle.DIRECTION_CLOCKWISE = 9;
Paddle.DIRECTION_ANTI_CLOCKWISE = 10;