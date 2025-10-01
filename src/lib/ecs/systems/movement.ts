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

		for (const entity of entities) {
			const pos = entity.getComponent(PositionComponent);
			const vel = entity.getComponent(VelocityComponent);
			const control = entity.getComponent(ControllableComponent);

			let speedx = 0;
			let speedy = 0;
			if (control.isLeftPressed) speedx = -vel.x;
			if (control.isRightPressed) speedx = vel.x;
			if (control.isUpPressed) speedy = -vel.y;
			if (control.isDownPressed) speedy = vel.y;

			pos.x =
				pos.x > pos.loopSize - vel.x
					? 0
					: pos.x < 0
						? pos.loopSize - vel.x
						: pos.x + speedx;

			pos.y =
				pos.y > pos.loopSize - vel.y
					? 0
					: pos.y < 0
						? pos.loopSize - vel.y
						: pos.y + speedy;

			console.log(pos.x, pos.y, pos.loopSize, vel.x, vel.y);
		}
	}
}
