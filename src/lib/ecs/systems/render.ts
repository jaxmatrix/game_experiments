import { PositionComponent } from "../components/position";
import { VisualComponent } from "../components/visual";
import type { EntityManager } from "../core";

export class RenderSystem {
	public update(entityManager: EntityManager): void {
		const entities = entityManager.getEntityWith(
			PositionComponent,
			VisualComponent,
		);

		for (const entity of entities) {
			const pos = entity.getComponent(PositionComponent);
			const vis = entity.getComponent(VisualComponent);

			vis.graphic.x = pos.x;
			vis.graphic.y = pos.y;
		}
	}
}
