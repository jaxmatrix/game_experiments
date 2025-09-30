export abstract class Component {}

export type ComponentClass<T extends Component> = new (...args: any[]) => T;

export class Entity {
	public readonly id: string;
	private components: Map<Function, Component>;

	constructor() {
		this.id = crypto.randomUUID();
		this.components = new Map();
	}

	public addComponent<T extends Component>(component: T): this {
		this.components.set(component.constructor, component);
		return this;
	}

	public getComponent<T extends Component>(
		componentClass: ComponentClass<T>,
	): T {
		const component = this.components.get(componentClass) as T;

		if (!component) {
			throw new Error(
				`Component ${componentClass.name} not found on entity ${this.id}`,
			);
		}

		return component;
	}

	public hasComponent<T extends Component>(
		componentClass: ComponentClass<T>,
	): boolean {
		return this.components.has(componentClass);
	}
}

export class EntityManager {
	private entities: Map<string, Entity>;

	constructor() {
		this.entities = new Map();
	}

	public createEntity(): Entity {
		const entity = new Entity();
		this.entities.set(entity.id, entity);

		return entity;
	}

	public getEntityWith<T extends Component[]>(
		...componentClasses: { [K in keyof T]: ComponentClass<T[K]> }
	): Entity[] {
		const results: Entity[] = [];
		for (const entity of this.entities.values()) {
			if (componentClasses.every((cls) => entity.hasComponent(cls))) {
				results.push(entity);
			}
		}

		return results;
	}
}
