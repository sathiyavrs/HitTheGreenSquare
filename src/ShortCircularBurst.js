var BurstEffect = cc.ParticleSystem.extend({
	
	TIME_OF_EFFECT: 0.2,
	SPEED_VARIANCE: 2,
	PARTICLE_LIFE: 0.5,
	EMISSION_RATE: 150,
	DEFAULT_SPEED: 40,
	
	ctor: function(imageResource, speed, position, color, initialSize) {
		this._super();
		this.texture = cc.textureCache.getTextureForKey(imageResource);
		
		this.setAutoRemoveOnFinish(true);
        
        this.duration = this.TIME_OF_EFFECT;

        this.angle = 0;
        this.angleVar = 360;

        this.speed = speed;
        this.speedVar = this.SPEED_VARIANCE;

        this.x = position.x;
        this.y = position.y;
        this.posVar = cc.p(0, 0);

        this.life = this.PARTICLE_LIFE;
        this.lifeVar = 0;

        this.setStartColor(color);
		this.startColorVar = cc.color(0, 0, 0, 0);
		this.endColorVar = cc.color(0, 0, 0, 0);
		this.setEndColor(color);
		
        this.startSize = initialSize;
        this.startSizeVar = 0.0;
        this.endSize = 0;

        this.emissionRate = this.EMISSION_RATE;

        this.setBlendAdditive(false);
		// this.setBlendFunc(gl.ZERO, gl.ONE);

        this.setEmitterPosition();
	},

	setEmitterPosition:function () {
        var sourcePos = this.getSourcePosition();
        if (sourcePos.x === 0 && sourcePos.y === 0)
            this.x = 200;
            this.y = 70;
    }
});