import { Component } from "../core";

export class PositionComponent extends Component {
	public x: number;
	public y: number;
	public loopSize: number = Infinity;
	constructor(x: number, y: number, loopSize: number = Infinity) {
		super();
		this.loopSize = loopSize;
		this.x = x;
		this.y = y;
	}
}
