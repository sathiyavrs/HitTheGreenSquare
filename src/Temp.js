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
