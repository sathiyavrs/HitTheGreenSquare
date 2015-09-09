attribute vec2 a_position;

uniform vec2 u_resolution;

void main()
{
	vec2 position = a_position;
	
	position.x *= 2.0 / u_resolution.x;
	position.y *= 2.0 / u_resolution.y;
	
	position.x -= 1.0;
	position.y -= 1.0;

	gl_Position = vec4(position.xy, 0, 1);
}