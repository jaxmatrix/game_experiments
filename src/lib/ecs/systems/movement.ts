import { ControllableComponent } from "../components/control";
import { PositionComponent } from "../components/position";
import { VelocityComponent } from "../components/velocity";
import type { EntityManager } from "../core";

export class MovementSystem {
	public update(entityManager: EntityManager): void {
		const entities = entityManager.getEntityWith(
			PositionComponent,
			VelocityComponent,
			ControllableComponent,
		);

		const speed = 12;

		for (const entity of entities) {
			const pos = entity.getComponent(PositionComponent);
			const vel = entity.getComponent(VelocityComponent);
			const control = entity.getComponent(ControllableComponent);

			vel.x = 0;
			vel.y = 0;
			if (control.isLeftPressed) vel.x = -speed;
			if (control.isRightPressed) vel.x = speed;
			if (control.isUpPressed) vel.y = -speed;
			if (control.isDownPressed) vel.y = speed;

			pos.x =
				pos.x > pos.loopSize - speed
					? 0
					: pos.x < 0
						? pos.loopSize - speed
						: pos.x + vel.x;
			pos.y =
				pos.y > pos.loopSize - speed
					? 0
					: pos.y < 0
						? pos.loopSize - speed
						: pos.y + vel.y;

			console.log(pos.x, pos.y, pos.loopSize, speed);
		}
	}
}
