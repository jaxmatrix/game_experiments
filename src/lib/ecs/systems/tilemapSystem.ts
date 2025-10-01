import { Application, Graphics, Texture } from "pixi.js";
import type { TileType } from "../components/tile";
import { PerlinNoise } from "../lib/perlinNoise";

export class TileMapSystem {
	private app: Application;
	private tileTexture: Record<string, Graphics> = {};
	private terrainNoise = new PerlinNoise();
	private treeNoise = new PerlinNoise();

	constructor(app: Application) {
		this.app = app;
	}

	public async loadAssets(size: number, gap: number) {
		this.tileTexture["grass"] = new Graphics().rect(
			0,
			0,
			size + gap,
			size + gap,
		);

		this.tileTexture["water"] = new Graphics().rect(
			0,
			0,
			size + gap,
			size + gap,
		);

		this.tileTexture["home"] = new Graphics().rect(
			0,
			0,
			size + gap,
			size + gap,
		);

		this.tileTexture["tree"] = new Graphics().rect(
			0,
			0,
			size + gap,
			size + gap,
		);
	}

	public async generateWorld(world_size: number) {}
}
