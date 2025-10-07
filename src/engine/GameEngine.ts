import { Application, Graphics, Container } from "pixi.js";

import { Entity, EntityManager } from "../lib/ecs/core";
import { InputSystem } from "../lib/ecs/systems/input";
import { MovementSystem } from "../lib/ecs/systems/movement";
import { RenderSystem } from "../lib/ecs/systems/render";
import { ControllableComponent } from "../lib/ecs/components/control";
import { VisualComponent } from "../lib/ecs/components/visual";
import { VelocityComponent } from "../lib/ecs/components/velocity";
import { PositionComponent } from "../lib/ecs/components/position";
import { TileMapSystem } from "../lib/ecs/systems/tilemapSystem";

export class GameEngine {
  private app: Application | null = null;
  private gameContainer: Container | null = null;
  private isRunning: boolean = false;

  // Update cycle config
  private updateRate = 10;
  private updateAccumulator = 0; // ms accumulated since last logic step
  private updateInterval = 1000 / this.updateRate; // default 4 updates per second (250ms)

  // cached ticker callback so we can remove it cleanly on destroy
  private readonly tick = (ticker: any) => {
    if (!this.isRunning) return;
    // Accumulate elapsed time (deltaMS provided by Pixi ticker)
    this.updateAccumulator += ticker.deltaMS;
    // Run logic in fixed steps; may catch up with multiple in a single frame if tab was inactive
    while (this.updateAccumulator >= this.updateInterval) {
      this.updateAccumulator -= this.updateInterval;
      this.runLogicStep();
    }
    // (Rendering is handled automatically by Pixi each frame)
  };

  // systems
  private entityManager: EntityManager = new EntityManager();
  private inputSystem: InputSystem = new InputSystem();
  private movementSystem: MovementSystem = new MovementSystem();
  private renderSystem: RenderSystem = new RenderSystem();
  private tileMapSystem: TileMapSystem | undefined = undefined
  private player: Entity | undefined = undefined;

  // Application config
  private height!: number;
  private width!: number;

  constructor() {
    this.init = this.init.bind(this);
    this.destroy = this.destroy.bind(this);
    this.resize = this.resize.bind(this);
    this.setUpdateRate = this.setUpdateRate.bind(this);
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
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      this.tileMapSystem = new TileMapSystem(this.app)

      // Create main game container
      this.gameContainer = new Container();
      this.app.stage.addChild(this.gameContainer);
      this.width = width;
      this.height = height;

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

    const rows = 48;
    const cols = 48;
    const box = 10; // box size

    const gap = 2; // spacing between boxes

    const color = 0xffffff; // green

    // Container to hold the grid
    const grid = new Container();
    this.gameContainer.addChild(grid);

    // Build grid using Graphics (good for small–medium counts)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // In Pixi v8 the typical order is shape -> fill(); calling fill() before rect() results in nothing rendered.
        const g = new Graphics()
          .rect(c * (box + gap), r * (box + gap), box, box)
          .fill({ color });
        grid.addChild(g);
      }
    }

    const playerColor = 0x0e123b;
    // Same order fix for player square
    const playerGraphic = new Graphics()
      .rect(0, 0, box, box)
      .fill({ color: playerColor });

    playerGraphic.zIndex = 1


    this.gameContainer.addChild(playerGraphic);
    this.tileMapSystem?.generateWorld(this.entityManager, this.gameContainer, rows, box, gap)

    this.player = this.entityManager.createEntity();
    this.player.addComponent(new ControllableComponent());
    this.player.addComponent(new VisualComponent(gap, box, playerGraphic));
    this.player.addComponent(new VelocityComponent(12, 12));
    this.player.addComponent(new PositionComponent(0, 0, this.width));
    console.log("Setup Called", this.player, grid);
  }

  private gameLoop(): void {
    if (!this.isRunning || !this.app) return;
    // Add the stored ticker callback (idempotent if called once)
    this.app.ticker.add(this.tick);
    console.log("Ticker Called", this.app.ticker);
  }

  // Manual render loop removed; relying on Pixi's internal ticker + auto render.

  resize(width: number, height: number): void {
    if (!this.app) return;
    // Let renderer manage canvas size; avoids mid-frame GL state issues.
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
      // Ensure ticker callback is removed before destroying GL resources.
      this.app.ticker.remove(this.tick);
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

  /**
   * Adjust the number of logic updates per second (UPS). Rendering can still occur at display refresh.
   * @param rate Updates per second (e.g. 2, 4, 10). Clamped to [1, 120].
   */
  setUpdateRate(rate: number): void {
    if (!Number.isFinite(rate)) return;
    const clamped = Math.max(1, Math.min(120, rate));
    this.updateInterval = 1000 / clamped;
    this.updateAccumulator = 0; // reset accumulator to avoid burst after rate change
    console.log(
      `Logic update rate set to ${clamped} UPS (interval=${this.updateInterval.toFixed(2)}ms)`,
    );
  }

  // Run one logic step (ECS systems)
  private runLogicStep(): void {
    this.inputSystem.update(this.entityManager);
    this.movementSystem.update(this.entityManager);
    this.renderSystem.update(this.entityManager);
  }
}
