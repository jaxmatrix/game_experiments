import * as PIXI from "pixi.js";

export class VisualComponent {
	gap: number;
	boxSize: number;
	graphic: PIXI.Graphics;

	constructor(gap: number, boxSize: number, graphic: PIXI.Graphics) {
		this.gap = gap;
		this.boxSize = boxSize;
		this.graphic = graphic;
	}
}
