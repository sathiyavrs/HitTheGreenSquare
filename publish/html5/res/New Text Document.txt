precision highp float;

varying vec2 v_position;

uniform vec2 u_center_location;
uniform float u_blurring;
uniform float u_radius;
uniform float u_alpha_final;
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
	// distance = sqrt(distance);

	if(distance > u_radius * u_radius)
	{
		gl_FragColor = u_background_color;
	}
	else
	{
		if(distance > (u_radius - u_blurring) * (u_radius - u_blurring))
		{
			distance = sqrt(distance);
			float alpha = (distance - u_blurring) / (u_radius - u_blurring);
			// When Distance = u_blurring , alpha = 0
			// When Distance = u_radius, alpha = 1

			alpha *= u_background_color.r - u_inner_color.r;
			alpha += u_inner_color.r;
			
			alpha *= 4.5;
			
			// alpha *= u_alpha_final;

			gl_FragColor = vec4(alpha, 0.0, alpha, 1.0);
		}
		else
		{
			gl_FragColor = vec4(u_inner_color.rgba);
		}
	}
}