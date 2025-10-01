import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { EntityManager } from "../lib/ecs/core";
import { InputSystem } from "../lib/ecs/systems/input";
import { MovementSystem } from "../lib/ecs/systems/movement";
import { ControllableComponent } from "../lib/ecs/components/control";
import { VelocityComponent } from "../lib/ecs/components/velocity";
import { PositionComponent } from "../lib/ecs/components/position";
import { VisualComponent } from "../lib/ecs/components/visual";
import { RenderSystem } from "../lib/ecs/systems/render";

export const GameView: React.FC = () => {
	const renderBox = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!renderBox.current) {
			return;
		}

		const app = new PIXI.Application({
			width: 400,
			height: 400,
			background: "#000000",
		});

		renderBox.current.appendChild(app.canvas as HTMLCanvasElement);

		const entityManager = new EntityManager();
		const inputSystem = new InputSystem();
		const movementSystem = new MovementSystem();
		const renderSystem = new RenderSystem();

		const setup = async () => {
			// Drawing a grid wihtin the application
			const rows = 10;
			const cols = 16;
			const box = 32; // box size

			const gap = 4; // spacing between boxes

			const color = 0x2ecc71; // green

			// Container to hold the grid
			const grid = new PIXI.Container();
			app.stage.addChild(grid);

			// Build grid using Graphics (good for small–medium counts)
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const g = new PIXI.Graphics()
						.fill(color)
						.rect(c * (box + gap), r * (box + gap), box, box);

					grid.addChild(g);
				}
			}

			const playerColor = 0x0e123b;
			const playerGraphic = new PIXI.Graphics()
				.fill(playerColor)
				.rect(0, 0, box, box);
			app.stage.addChild(playerGraphic);

			const player = entityManager.createEntity();
			player.addComponent(new ControllableComponent());
			player.addComponent(new VisualComponent(gap, box, playerGraphic));
			player.addComponent(new VelocityComponent(0, 0));
			player.addComponent(new PositionComponent(0, 0));
		};

		app.ticker.add(() => {
			inputSystem.update(entityManager);
			movementSystem.update(entityManager);
			renderSystem.update(entityManager);
		});

		return () => {
			// Destory the instace of app for pixi js
			app.destroy();
		};
	}, []);

	return (
		<>
			<div>
				Game Blob
				<div ref={renderBox}></div>
			</div>
		</>
	);
};
