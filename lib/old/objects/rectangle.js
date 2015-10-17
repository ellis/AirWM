/**
 * Rectangle: represents the location (x,y) and size (width,height) of a container
 */
export default function Rectangle(x = 0, y = 0, width = 1, height = 1) {
	this.x      = x;
	this.y      = y;
	this.width  = width;
	this.height = height;
}
