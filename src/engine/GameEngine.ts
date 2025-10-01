import {
	Application,
	Graphics,
	Container,
	Text,
	Sprite,
	Assets,
} from "pixi.js";

import { Entity, EntityManager } from "../lib/ecs/core";
import { InputSystem } from "../lib/ecs/systems/input";
import { MovementSystem } from "../lib/ecs/systems/movement";
import { RenderSystem } from "../lib/ecs/systems/render";
import { ControllableComponent } from "../lib/ecs/components/control";
import { VisualComponent } from "../lib/ecs/components/visual";
import { VelocityComponent } from "../lib/ecs/components/velocity";
import { PositionComponent } from "../lib/ecs/components/position";

export class GameEngine {
	private app: Application | null = null;
	private gameContainer: Container | null = null;
	private isRunning: boolean = false;

	// systems
	private entityManager: EntityManager = new EntityManager();
	private inputSystem: InputSystem = new InputSystem();
	private movementSystem: MovementSystem = new MovementSystem();
	private renderSystem: RenderSystem = new RenderSystem();
	private player: Entity | undefined = undefined;

	constructor() {
		this.init = this.init.bind(this);
		this.destroy = this.destroy.bind(this);
		this.resize = this.resize.bind(this);
		this.update = this.update.bind(this);
	}

	async init(
		canvas: HTMLCanvasElement,
		width: number,
		height: number,
	): Promise<void> {
		try {
			// Create PixiJS application
			this.app = new Application();

			await this.app.init({
				canvas: canvas,
				width: width,
				height: height,
				backgroundColor: 0x1a1a2e,
				resolution: window.devicePixelRatio || 1,
				autoDensity: true,
			});

			// Create main game container
			this.gameContainer = new Container();
			this.app.stage.addChild(this.gameContainer);

			// Set up basic scene
			this.setupScene();

			// Start game loop
			this.isRunning = true;
			this.gameLoop();

			console.log("PixiJS Game Engine initialized");
		} catch (error) {
			console.error("Failed to initialize PixiJS:", error);

			throw error;
		}
	}

	private setupScene(): void {
		if (!this.gameContainer || !this.app) return;

		// Create a visible background with gradient effect
		const background = new Graphics();
		background
			.rect(0, 0, this.app.canvas.width, this.app.canvas.height)
			.fill({ color: 0x1a1a2e, alpha: 1 });

		this.gameContainer.addChild(background);

		const rows = 10;
		const cols = 16;
		const box = 32; // box size

		const gap = 4; // spacing between boxes

		const color = 0x2ecc71; // green

		// Container to hold the grid
		const grid = new Container();
		this.gameContainer.addChild(grid);

		// Build grid using Graphics (good for small–medium counts)
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const g = new Graphics()
					.fill(color)
					.rect(c * (box + gap), r * (box + gap), box, box);

				grid.addChild(g);
			}
		}

		const playerColor = 0x0e123b;
		const playerGraphic = new Graphics().fill(playerColor).rect(0, 0, box, box);

		this.gameContainer.addChild(playerGraphic);

		this.player = this.entityManager.createEntity();
		this.player.addComponent(new ControllableComponent());
		this.player.addComponent(new VisualComponent(gap, box, playerGraphic));
		this.player.addComponent(new VelocityComponent(0, 0));
		this.player.addComponent(new PositionComponent(0, 0));
	}

	private gameLoop(): void {
		if (!this.isRunning) return;

		if (!this.app) {
			console.warn("game application not created");
			return;
		}

		this.app.ticker.add(() => {
			this.inputSystem.update(this.entityManager);
			this.movementSystem.update(this.entityManager);
			this.renderSystem.update(this.entityManager);
		});

		this.update();
	}

	private update(): void {
		if (!this.gameContainer || !this.app) return;

		this.app.render();
	}

	resize(width: number, height: number): void {
		if (!this.app) return;

		this.app.canvas.width = width;
		this.app.canvas.height = height;
		this.app.renderer.resize(width, height);

		// Update scene elements for new size
		if (this.gameContainer) {
			const background = this.gameContainer.children[0] as Graphics;
			if (background) {
				background.clear();
				background
					.rect(0, 0, width, height)
					.fill({ color: 0x0f0f23, alpha: 1 });
			}

			// Reposition stars

			const stars = this.gameContainer.children.slice(1, 101);
			stars.forEach((star) => {
				if (star.x > width) star.x = Math.random() * width;
				if (star.y > height) star.y = Math.random() * height;
			});

			// Reposition text elements
			const welcomeText = this.gameContainer.children[101];
			const subtitleText = this.gameContainer.children[102];

			if (welcomeText) {
				welcomeText.x = width / 2;
				welcomeText.y = height / 2;
			}

			if (subtitleText) {
				subtitleText.x = width / 2;
				subtitleText.y = height / 2 + 50;
			}
		}
	}

	destroy(): void {
		this.isRunning = false;

		if (this.app) {
			this.app.destroy(true, {
				children: true,
				texture: true,
				textureSource: true,
			});
			this.app = null;
		}

		this.gameContainer = null;
		console.log("PixiJS Game Engine destroyed");
	}

	getApp(): Application | null {
		return this.app;
	}
}
