precision highp float;

varying vec2 v_position;

uniform vec2 u_center_location;
uniform float u_blurring;
uniform float u_radius;
uniform vec2 u_resolution;
uniform vec4 u_inner_color;
uniform vec4 u_background_color;

float distanceBetweenPoints(vec2 start, vec2 end)
{
	return((start.x - end.x) * (start.x - end.x) + (start.y - end.y) * (start.y - end.y));
}

void convertToProperCoordinates(inout vec2 position)
{
	position.x += 1.0;
	position.x /= 2.0;
	position.x *= u_resolution.x;
	
	position.y += 1.0;
	position.y *= u_resolution.y / 2.0;
}

void main()
{
	vec2 position = v_position;
	convertToProperCoordinates(position);
	float distance = distanceBetweenPoints(position, u_center_location);
		
	if(distance > u_radius * u_radius)
	{
		gl_FragColor = u_background_color;
	}
	else
	{
		if(distance > (u_radius - u_blurring) * (u_radius - u_blurring))
		{
			distance = sqrt(distance);
			float alpha = 1.0 - (u_radius - distance) / (u_blurring);
			
			alpha *= u_background_color.r - u_inner_color.r;
			alpha += u_inner_color.r;
			
			alpha /= u_inner_color.r;
			
			gl_FragColor = vec4(u_inner_color.r * alpha, u_inner_color.g * alpha, u_inner_color.b * alpha, 1.0);
		}
		else
		{
			gl_FragColor = vec4(u_inner_color.rgba);
		}
	}
}