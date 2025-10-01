import {
	Application,
	Graphics,
	Container,
	Text,
	Sprite,
	Assets,
} from "pixi.js";

export class GameEngine {
	private app: Application | null = null;
	private gameContainer: Container | null = null;
	private isRunning: boolean = false;

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

		// Add some animated stars
		for (let i = 0; i < 100; i++) {
			const star = new Graphics();
			star
				.circle(0, 0, Math.random() * 2 + 0.5)
				.fill({ color: 0xffffff, alpha: Math.random() * 0.8 + 0.2 });

			star.x = Math.random() * this.app.canvas.width;
			star.y = Math.random() * this.app.canvas.height;
			star.tint = Math.random() > 0.5 ? 0xffffff : 0x87ceeb;

			this.gameContainer.addChild(star);
		}
	}

	private gameLoop(): void {
		if (!this.isRunning) return;

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
