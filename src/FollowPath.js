var FollowPath = function(pointsArray, type, direction) {
	if(pointsArray.length <= 1) {
		throw new Error("Parameter to FollowPath has less than two points in it!!");
	}
	
	this.pointsToFollow = pointsArray;
	this.type = type;
	
	if(direction != 1 && direction != -1) {
		throw new Error("Direction improperly set in FollowPath! Use either Forward or Backward!");
	}
	this.direction = direction;
	
	// Initializing Stuff
	this.iterator = 0;
	this.currentPoint = pointsArray[0];
}

FollowPath.FORWARD = 1;
FollowPath.BACKWARD = -1;
FollowPath.Directions = [FollowPath.FORWARD, FollowPath.BACKWARD];

FollowPath.PING_PONG = 0;
FollowPath.LOOP = 1;
FollowPath.MOVE_POSITION = 2;

FollowPath.prototype.goToNextPoint = function() {
	var iterator = this.iterator;
	var pointsArray = this.pointsToFollow;
	var direction = this.direction;
	var length = pointsArray.length;
	var type = this.type;
	
	if(iterator == pointsArray.length - 1) {
		if(direction != FollowPath.BACKWARD) {
			switch(type) {
				case FollowPath.LOOP:
					iterator = -1;
					break;
					
				case FollowPath.PING_PONG:
					// iterator = length - 1;
					direction = FollowPath.BACKWARD;
					break;
			}	
		}
	}
	
	if(iterator == 0) {
		if(direction != FollowPath.FORWARD) {
			switch(type) {
				case FollowPath.LOOP:
					iterator = length;
					break;
					
				case FollowPath.PING_PONG:
					// iterator = 0;
					direction = FollowPath.FORWARD;
					break;
			}
		}
	}
	
	iterator += direction;
	this.currentPoint = pointsArray[iterator];
	this.direction = direction;
	this.iterator = iterator;
}