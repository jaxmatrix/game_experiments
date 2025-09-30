import { ControllableComponent } from "../components/control";
import type { EntityManager } from "../core";

export const keyboard: Record<string, boolean> = {};

window.addEventListener("keydown", (e: KeyboardEvent) => {
	keyboard[e.key] = true;
});

window.addEventListener("keyup", (e: KeyboardEvent) => {
	keyboard[e.key] = false;
});

export class InputSystem {
	public update(entityManager: EntityManager): void {
		const entities = entityManager.getEntityWith(ControllableComponent);

		for (const entity of entities) {
			const control = entity.getComponent(ControllableComponent);

			control.isUpPressed = keyboard["w"] || keyboard["ArrowUp"];
			control.isDownPressed = keyboard["s"] || keyboard["ArrowDown"];
			control.isLeftPressed = keyboard["a"] || keyboard["ArrowLeft"];
			control.isRightPressed = keyboard["d"] || keyboard["ArrowRight"];
		}
	}
}
