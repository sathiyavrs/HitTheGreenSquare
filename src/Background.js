var Background = cc.GLNode.extend({
	/*******************************************************************************************************
	* TO DO:
	* FIX COLOR ISSUES WITH THE SHADOW SHADER
	*		FIXED BY DRAWING SOLID COLORS INSTEAD OF TRANSPARENT ONES.
	*
	* GOD FORGIVE ME, I'VE USED SOLID COLORS FOR THE SHADOWS INSTEAD OF THE AWESOME TRANSPARENCIES I WANTED.
	* HAS A NICE COMIC STYLE AESTHETIC THOUGH. I MAY BE ABLE TO CAPITALIZE ON THAT.
	********************************************************************************************************/
	
	BACKGROUND_COLOR: [0.4, 0, 0.4, 1],
	BLURRING_RADIUS: 20,
	ALPHA_FINAL: 0.7,
	INNER_COLOR: [0.4, 0.0, 0.4, 1.0],
	SHADOW_COLOR: [0.10, 0, 0.10, 1.0],
	LIMITATION_BACKGROUND_COLOR: [0.10, 0.0, 0.10, 1.0],
	BACKGROUND_RADIUS_OFFSET: 8,
	
	LightLocation: null,
	RadiusValuesForLights: null,
	RadiusValueForShadows: null,
	
	BackgroundVertexBuffer: null,
	BackgroundProgram: null,
	BackgroundPositionLocation: null,
	BackgroundColorLocation: null,
	
	LimitationAttributes: null,
	LimitationProgram: null,
	LimitationPosition: null,
	
	ShadowObjectsPositions: [],
	ShadowEndPositions: [],
	ShadowAttributes: null,
	ShadowProgram: null,
	ShadowVertexBuffer: null,
	
	ctor: function(lightLocation, radiusValue, shadowObjectPositions) {
		this._super();
		this.scheduleUpdate();
		
		this.BACKGROUND_RADIUS_OFFSET = this.BLURRING_RADIUS / 20 * 8;
		this.LightLocation = lightLocation;
		this.RadiusValuesForLights = radiusValue + this.BACKGROUND_RADIUS_OFFSET;
		this.ShadowObjectsPositions = shadowObjectPositions;
		
		this.initializeBackgroundProgram();
		this.initializeBackgroundAttributeLocation();
		this.initiateBackgroundBuffer();
		
		this.initializeLimitationProgram();
		this.initializeLimitationLocation();
		this.updateLimitation();
		
		this.initializeShadowProgram();
		this.initializeShadowBuffer();
		this.initializeShadowAttributeLocation();
		this.updateShadowProgram();
		
		this.setBlendFunc(new cc.BlendFunc(cc.CC_SRC_ALPHA, cc.CC_ONE ));
	},
	
	fillShadowEndPosition: function(iterator) {
		var point_1 = this.ShadowObjectsPositions[iterator];
		var point_2 = this.ShadowObjectsPositions[iterator + 1];
		
		var lightPosition = this.LightLocation;
		
		var directionVector_1 = GetDirection(lightPosition, point_1);
		
		VectorMultiplicationWithScalar(directionVector_1, this.RadiusValueForShadows);
		directionVector_1 = cc.pAdd(directionVector_1, lightPosition);
		this.ShadowEndPositions.push(directionVector_1);
		
		var directionVector_2 = GetDirection(lightPosition, point_2);
		VectorMultiplicationWithScalar(directionVector_2, this.RadiusValueForShadows);
		directionVector_2 = cc.pAdd(directionVector_2, lightPosition);
		this.ShadowEndPositions.push(directionVector_2);
	},
	
	drawShadows: function() {
		this.ShadowProgram.use();
		this.ShadowProgram.setUniformsForBuiltins();
		this.ShadowEndPositions = [];
		this.RadiusValueForShadows = this.RadiusValuesForLights + 100;
		
		this.updateShadowProgram();
		
		if(typeof(this.ShadowObjectsPositions) == 'undefined') {
			return;
		}
		
		var vertices = [];
		var points = [];
		
		
		for(var i = 0; i < this.ShadowObjectsPositions.length; i += 2) {
			points = [];
			vertices = [];
			
			this.fillShadowEndPosition(i);
			
			points = [
				this.ShadowObjectsPositions[i],
				this.ShadowObjectsPositions[i + 1],
				this.ShadowEndPositions[i + 1],
				this.ShadowEndPositions[i]
			];
			
			vertices = [
				points[0].x, points[0].y,
				points[1].x, points[1].y,
				points[2].x, points[2].y,
				
				points[2].x, points[2].y,
				points[3].x, points[3].y,
				points[0].x, points[0].y
			];
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.ShadowVertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
			this.ShadowVertexBuffer.itemSize = 2;
			this.ShadowVertexBuffer.numberOfItems = 6;
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.ShadowVertexBuffer);
			gl.vertexAttribPointer(this.ShadowAttributes.Position_A, this.ShadowVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
			gl.drawArrays(gl.TRIANGLES, 0, this.ShadowVertexBuffer.numberOfItems);
		}
		
		/*var vertices = [
			1, 1,
			-1, 1,
			1, -1,
			
			1, -1,
			-1, 1,
			-1, -1
		];
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.BackgroundVertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
		this.BackgroundVertexBuffer.itemSize = 2;
		this.BackgroundVertexBuffer.numberOfItems = 6;*/
	},
	
	updateShadowProgram: function() {
		this.ShadowProgram.use();
		this.ShadowProgram.setUniformsForBuiltins();
		
		this.ShadowProgram.setUniformLocationWith2f(this.ShadowAttributes.ResolutionLocation, 
																	cc.winSize.width, cc.winSize.height);
		
		this.ShadowProgram.setUniformLocationWith4fv(this.ShadowAttributes.ColorLocation, new Float32Array(this.SHADOW_COLOR));
		
	},
	
	initializeShadowAttributeLocation: function() {
		this.ShadowAttributes = Object.create(Object.prototype);
		
		this.ShadowAttributes.Position_A = gl.getAttribLocation(this.ShadowProgram.getProgram(), "a_position");
		gl.enableVertexAttribArray(this.BackgroundPositionLocation);
		
		this.ShadowAttributes.ResolutionLocation = this.ShadowProgram.getUniformLocationForName('u_resolution');
		this.ShadowAttributes.ColorLocation = this.ShadowProgram.getUniformLocationForName('u_color');
	},
	
	initializeShadowProgram: function() {
		this.ShadowProgram = new cc.GLProgram();
		this.ShadowProgram.initWithVertexShaderByteArray(cc.loader.getRes(res.ShadowShaderVertex), 
					cc.loader.getRes(res.ShadowShaderFragment));
					
		this.ShadowProgram.link();
	},
	
	initializeShadowBuffer: function() {
		this.ShadowVertexBuffer = gl.createBuffer();
	},
	
	updateLimitation: function() {
		this.LimitationProgram.use();
		
		this.LimitationProgram.setUniformLocationWith2f(this.LimitationAttributes.Position, 
															this.LightLocation.x, this.LightLocation.y);
		
		this.LimitationProgram.setUniformLocationWith1f(this.LimitationAttributes.Radius, this.RadiusValuesForLights);
		
		this.LimitationProgram.setUniformLocationWith2f(this.LimitationAttributes.Resolution, 
																	cc.winSize.width, cc.winSize.height);
		
		this.LimitationProgram.setUniformLocationWith1f(this.LimitationAttributes.Blurring, this.BLURRING_RADIUS);
		
		this.LimitationProgram.setUniformLocationWith4fv(this.LimitationAttributes.InnerColor, 
																				new Float32Array(this.INNER_COLOR));
																				
		this.LimitationProgram.setUniformLocationWith4fv(this.LimitationAttributes.BackgroundColor, 
																new Float32Array(this.LIMITATION_BACKGROUND_COLOR));
		
		
		// this.LimitationProgram.setUniformLocationWith1i(this.LimitationAttributes.Number, this.LightLocations.length);
	},
	
	initializeLimitationLocation: function() {
		this.LimitationPosition = gl.getAttribLocation(this.LimitationProgram.getProgram(), "a_position");
		gl.enableVertexAttribArray(this.LimitationPosition);
		
		this.LimitationAttributes = new Limitation();
		this.LimitationAttributes.Program = this.LimitationProgram;
		
		this.LimitationAttributes.Position = this.LimitationProgram.getUniformLocationForName('u_center_location');
		this.LimitationAttributes.Radius = this.LimitationProgram.getUniformLocationForName('u_radius');
		this.LimitationAttributes.Blurring = this.LimitationProgram.getUniformLocationForName('u_blurring');
		this.LimitationAttributes.Resolution = this.LimitationProgram.getUniformLocationForName('u_resolution');
		this.LimitationAttributes.InnerColor = this.LimitationProgram.getUniformLocationForName('u_inner_color');
		this.LimitationAttributes.BackgroundColor = this.LimitationProgram.getUniformLocationForName('u_background_color');
	},
	
	initializeLimitationProgram: function() {
		this.LimitationProgram = new cc.GLProgram();
		this.LimitationProgram.initWithVertexShaderByteArray(cc.loader.getRes(res.LimitationShaderVertex), 
					cc.loader.getRes(res.LimitationShaderFragment));
					
		this.LimitationProgram.link();
		this.LimitationProgram.updateUniforms();
	},
	
	initializeBackgroundProgram: function() {
		this.BackgroundProgram = new cc.GLProgram();
		this.BackgroundProgram.initWithVertexShaderByteArray(cc.loader.getRes(res.BackgroundShaderVertex), 
					cc.loader.getRes(res.BackgroundShaderFragment));
					
		this.BackgroundProgram.link();
		this.BackgroundProgram.updateUniforms();
	},
	
	initializeBackgroundAttributeLocation: function() {
		this.BackgroundPositionLocation = gl.getAttribLocation(this.BackgroundProgram.getProgram(), "a_position");
		gl.enableVertexAttribArray(this.BackgroundPositionLocation);
		
		this.BackgroundColorLocation = this.BackgroundProgram.getUniformLocationForName('u_color');
	},
	
	initiateBackgroundBuffer: function() {
		this.BackgroundVertexBuffer = gl.createBuffer();
		var vertices = [
			1, 1,
			-1, 1,
			1, -1,
			
			1, -1,
			-1, 1,
			-1, -1
		];
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.BackgroundVertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
		this.BackgroundVertexBuffer.itemSize = 2;
		this.BackgroundVertexBuffer.numberOfItems = 6;
	},
	
	draw: function() {
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 1);
		// gl.disable(gl.BLEND);
		// gl.enable(gl.BLEND);
		
		gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		// gl.disable(gl.DEPTH_TEST);
		
		
		this.BackgroundProgram.use();
		this.BackgroundProgram.setUniformsForBuiltins();
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.BackgroundVertexBuffer);
		gl.vertexAttribPointer(this.BackgroundPositionLocation, this.BackgroundVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		var color = this.BACKGROUND_COLOR;
		this.BackgroundProgram.setUniformLocationWith4f(this.BackgroundColorLocation, color[0], color[1], color[2], color[3]);
		
		gl.drawArrays(gl.TRIANGLES, 0, this.BackgroundVertexBuffer.numberOfItems);
		// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		// gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // Look up!
		// gl.blendFuncSeparate(gl.ZERO, gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		
		
		this.LimitationProgram.use();
		this.LimitationProgram.setUniformsForBuiltins();			
		gl.bindBuffer(gl.ARRAY_BUFFER, this.BackgroundVertexBuffer);
		gl.vertexAttribPointer(this.LimitationPosition, this.BackgroundVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
		gl.drawArrays(gl.TRIANGLES, 0, this.BackgroundVertexBuffer.numberOfItems);
	
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		this.drawShadows();
	},
	
	once: 0,
	
	update: function(dt) {
		this.updateShadowProgram();
		this.updateLimitation();
	}
});

var Limitation = function() {
	this.Program = null;
	this.Position = null;
	this.Radius = null;
	this.Number = null;
	this.Alpha = null;	
};
