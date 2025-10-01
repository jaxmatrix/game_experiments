import { Component } from "../core";

export type TileType = "grass" | "water" | "home" | "tree";

export class TileComponent extends Component {
	public tileType: TileType;
	public isSolid: boolean;

	constructor(tileType: TileType, isSolid: boolean = true) {
		super();
		this.tileType = tileType;
		this.isSolid = isSolid;
	}
}
