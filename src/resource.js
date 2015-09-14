var res = {
    HelloWorld_png : "res/HelloWorld.png",
    CloseNormal_png : "res/CloseNormal.png",
    CloseSelected_png : "res/CloseSelected.png",
	
	WhiteStuff: "res/WhiteStuff.png",
	BlackStuff: "res/BlackStuff.png",
	
	RetryButtonNormal: "res/ReverseNormal.png",
	RetryButtonSelected: "res/ReverseSelected.png",
	
	MenuNormal: "res/MenuNormal.png",
	MenuSelected: "res/MenuSelected.png",
	
	CrossNormal: "res/CrossNormal_16X16.png",
	CrossSelected: "res/CrossSelected_16X16.png",
	
	ForwardNormal: "res/ForwardNormal.png",
	ForwardSelected: "res/ForwardSelected.png",
	
	RightNormal: "res/RightNormal.png",
	RightSelected: "res/RightSelected.png",
	
	WhiteFriendly : "res/FriendlyBall_34X34.png",
	WhiteFriendly_1 : "res/FriendlyBall_34X34_1.png",
	WhiteFriendly_2 : "res/FriendlyBall_34X34_2.png",
	WhiteFriendly_3 : "res/FriendlyBall_34X34_3.png",
	
	RedFriendly : "res/RedBall_34X34.png",
	RedFriendly_1 : "res/RedBall_34X34_1.png",
	RedFriendly_2 : "res/RedBall_34X34_2.png",
	RedFriendly_3 : "res/RedBall_34X34_3.png",
	
	
	WhiteEnemy : "res/White_Enemy_40X40.png",
	WhiteEnemyShaded: "res/WhiteEnemyShaded_40X40.png",
	
	BrownEnemy : "res/Brown_Enemy_40X40.png",
	BrownEnemyShaded: "res/BrownEnemyShaded_40X40.png",
	
	GreenEnemy: "res/GreenEnemy_40X40.png",
	GreenEnemyShaded: "res/GreenEnemyShaded_40X40.png",
	
	TransparentEnemy : "res/Transparent_40X40.png",
	WhiteParticle: "res/White_Particle_64X64.png",
	Paddle: "res/Paddle_80X16.png",
	
	BackgroundShaderVertex: "res/Background.vsh",
	BackgroundShaderFragment: "res/Background.fsh",
	ShadowShaderVertex: "res/Shadow.vsh",
	ShadowShaderFragment: "res/Shadow.fsh",
	LimitationShaderVertex: "res/Limitation.vsh",
	LimitationShaderFragment: "res/Limitation.fsh",
	
	Explosion: "res/Explosion.wav",
	PlayerHit: "res/PlayerHit.wav",
	BackgroundMusic: "res/Background.mp3",
	PaddleCollision: "res/Shoot.wav"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}

cc.audioEngine.playMusic(res.BackgroundMusic, true);

cc.GLNode = cc.Sprite.extend({
    ctor: function(){
        this._super();
		this.setBlendFunc(new cc.BlendFunc(cc.ZERO, cc.ZERO));
        this.init();
		
    },
    init: function(){
        this._renderCmd._needDraw = true;
		
        this._renderCmd.rendering =  function(ctx) {
            cc.kmGLMatrixMode(cc.KM_GL_MODELVIEW);
            cc.kmGLPushMatrix();
            cc.kmGLLoadMatrix(this._stackMatrix);

            this._node.draw(ctx);

            cc.kmGLPopMatrix();
        };
    },
    draw: function(ctx) {
        this._super(ctx);
    }
});

// ******************************* GLOBAL CONSTANTS *********************************

var GlobalConstant = {};
GlobalConstant.ENEMY_SPRITE_GROUP_NO = 1;
GlobalConstant.FRIENDLY_RAYCAST_GROUP = 0;

GlobalConstant.FRIENDLY_SONAR_TYPE = 1;
GlobalConstant.ENEMY_COLLISION_TYPE = 2;
GlobalConstant.FRIENDLY_COLLISION_TYPE = 3;
GlobalConstant.PADDLE_COLLISION_TYPE = 4;

// ******************************* END THAT *****************************************

function isVector2(obj) {
	if(typeof(obj.x) != 'number')
		return false;
	
	if(typeof(obj.y) != 'number')
		return false;
	
	return true;
}

var VectorMultiplicationWithScalar = function(vector, scalar) {
	vector.x *= scalar;
	vector.y *= scalar;
}

var Transform = function(position, rotation) {
	if(!isVector2(position)) {
		throw new Error("Can't Initialize Transform! Position Parameter is not a Vec2!");
	}
	
	if(typeof(rotation) != 'number') {
		throw new Error("Can't Initialize Transform! Rotation Parameter is not a number!");
	}
	
	this.position = position;
	this.rotation = rotation;
}

var deg2Rad = Math.PI / 180;

var Movement = {};
Movement.CONSTANT_SPEED = 0;
Movement.LERP = 1;
Movement.SIN_WAVE = 2;

Movement.AllTypes = [Movement.CONSTANT_SPEED, Movement.LERP, Movement.SIN_WAVE];

var GetDirection = function(start, end) {
	if(start == null)
		return;
	
	if(end == null)
		return;
	
	var xComponent = end.x - start.x;
	var yComponent = end.y - start.y;
	var magnitude = Math.sqrt(xComponent * xComponent + yComponent * yComponent);
	
	return(cc.p(xComponent / magnitude, yComponent / magnitude));
}

var DistanceBetweenTwoPoints = function(start, end) {
	return Math.sqrt(DistanceBetweenTwoPointsSquared(start,end));
}

var DistanceBetweenTwoPointsSquared = function(start, end) {
	return (end.x - start.x) * (end.x - start.x) + (end.y - start.y) * (end.y - start.y)
}

var RotatePositionClockwiseAboutOrigin = function(position, angle) {
	angle *= deg2Rad;
	if(!isVector2(position)) {
		throw new Error("Cannot rotate position: Position is not a vec2");
	}
	
	var xComponent = position.x * Math.cos(angle) + position.y * Math.sin(angle);
	var yComponent = position.y * Math.cos(angle) - position.x * Math.sin(angle);
	
	return cc.p(xComponent, yComponent);
}

var RotateCoordinateSystem = function(position, angle) {
	angle *= deg2Rad;
	if(!isVector2(position)) {
		throw new Error("Cannot rotate position: Position is not a vec2");
	}
	
	var xComponent = position.x * Math.cos(angle) - position.y * Math.sin(angle);
	var yComponent = position.x * Math.sin(angle) + position.y * Math.cos(angle);
	
	return cc.p(xComponent, yComponent);
}

var direction_yAxisAngle = function(angle) {
	angle *= deg2Rad;
	
	return cc.p(Math.sin(angle), Math.cos(angle));
}

var angleWith_plusYClockWise = function(position, center) {
	var x = position.x - center.x;
	var y = position.y - center.y;
	
	if(y == 0) {
		if(x > 0)
			return 90;
		else
			return 270;
	}
	
	var inverseTangent = Math.atan(x / y) / deg2Rad;
	
	if(x >= 0 && y > 0) {
		return inverseTangent;
	}
	
	if(x >= 0 && y < 0) {
		return inverseTangent + 180;
	}
	
	if(x <= 0 && y < 0) {
		return inverseTangent + 180;
	}
	
	if(x <= 0 && y > 0) {
		return inverseTangent + 360;
	}
}

var MaxOfTwo = function(one, two) {
	if(one > two)
		return one;
	
	return two;
}

var MinOfTwo = function(one, two) {
	if(one < two)
		return one;
	
	return two;
}

var DetermineLowerAndHigherAmongAngles = function(angle1, angle2) {
	if(MaxOfTwo(angle1, angle2) > 270) {
		if(MinOfTwo(angle1, angle2) < 180) {
			return [MaxOfTwo(angle1,angle2), MinOfTwo(angle1, angle2)];
		}
	}
	
	if(MinOfTwo(angle1, angle2) < 90 && MaxOfTwo(angle1, angle2) > 180) {
		return [MaxOfTwo(angle1, angle2), MinOfTwo(angle1, angle2)];
	}
	
	return [MinOfTwo(angle1, angle2), MaxOfTwo(angle1, angle2)];
}

var getLayerValueFromLayerMask = function(layerMask) {
	return -1; // NOT IMPLEMENTED
}