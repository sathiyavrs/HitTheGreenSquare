// Specifically created for rectangles; Holds and updates the positions of the vertices of the rectangle in real time;

var RectLightingHelper = cc.Class.extend({
	Sprite: null,
	DrawNode: null,
	LineWidth: 1,
	debugDraw: false,
	
	points: [],
	rotation: null,
	centerPosition: null,
	width: null,
	height: null,

	getPoints: function() {
		return this.points;
	},
	
	ctor: function(sprite, drawNode) {
		this.Sprite = sprite;
		this.rotation = sprite.currentTransform.rotation; // In Degrees
		this.centerPosition = sprite.currentTransform.position;
		this.width = sprite.getContentSize().width;
		this.height = sprite.getContentSize().height;
	
		this.DrawNode = drawNode;
		
		this.CalculatePointValues();
	},
	
	// Essentially Perform the same function as the Constructor
	update: function(dt) {
		var sprite = this.Sprite;
		
		this.rotation = sprite.currentTransform.rotation; // In Degrees
		this.centerPosition = sprite.currentTransform.position;
		this.width = sprite.getContentSize().width;
		this.height = sprite.getContentSize().height;
		
		this.CalculatePointValues();
		
		if(this.debugDraw)
			this.drawPoints();
	},
	
	drawPoints: function() {
		this.DrawNode.clear();
		
		var points = this.points;
		
		for(var i = 1; i < points.length; i++) {
			this.DrawNode.drawSegment(points[i - 1], points[i], this.LineWidth, cc.Color(255, 255, 255, 255));
		}
		
		this.DrawNode.drawSegment(points[points.length - 1], points[0], this.LineWidth, cc.Color(255, 255, 255, 255));
	},
	
	CalculatePointValues: function() {
		var points = this.points = [];
		var center = this.centerPosition;
		var angle = this.rotation;
		var width = this.width;
		var height = this.height;
		
		points.push(cc.p(-width / 2, height / 2));
		points.push(cc.p(width / 2, height / 2));
		points.push(cc.p(width / 2, -height / 2));
		points.push(cc.p(-width / 2, -height / 2));
		
		for(var i = 0; i < points.length; i++) {
			points[i] = RotatePositionClockwiseAboutOrigin(points[i], angle);
			points[i] = cc.pAdd(points[i], center);
		}
		
		this.points = points;
	},
	
	GetLightingCoordinates: function(lightPosition) {
		var position = lightPosition;
		var center = this.centerPosition;
		var points = this.points;
		
		position = cc.p(position.x - center.x, position.y - center.y);
		
		position = RotateCoordinateSystem(position, this.rotation);
		
		// Now for the eight Cases....
		
		var width = this.width;
		var height = this.height;
		var x = position.x;
		var y = position.y;
		
		if(x > -width / 2 && x < width / 2 && y > height / 2) {
			// UP
			return [points[0], points[1]];
		}
		
		if(x > width / 2 && y > height / 2) {
			// UP RIGHT
			return [points[0], points[2]];
		}
		
		if(x > width / 2 && y > -height / 2 && y < height / 2) {
			// RIGHT
			return [points[1], points[2]];
		}
		
		if(x > width / 2 && y < -height / 2) {
			// BOTTOM RIGHT
			return [points[1], points[3]];
		}
		
		if(x > -width / 2 && x < width / 2 && y < -height/2) {
			// BOTTOM
			return [points[2], points[3]];
		}
		
		if(x < -width / 2 && y < -height / 2) {
			// BOTTOM LEFT
			return [points[0], points[2]];
		}
		
		if(x < -width / 2 && y > -height / 2 && y < height / 2) {
			// LEFT
			return [points[0], points[3]];
		}
		
		if(x < -width / 2 && y > height / 2) {
			// TOP LEFT
			return [points[1], points[3]];
		}
		
		// phew.
	}
});