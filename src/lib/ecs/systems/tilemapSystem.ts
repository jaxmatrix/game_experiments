import { Application, Container, Graphics, Texture } from "pixi.js";
import { TileComponent, type TileType } from "../components/tile";
import { PerlinNoise } from "../lib/perlinNoise";
import type { Entity, EntityManager } from "../core";
import { PositionComponent } from "../components/position";
import { VisualComponent } from "../components/visual";

export class TileMapSystem {
  private app: Application;
  private terrainNoise = new PerlinNoise();
  private treeNoise = new PerlinNoise();

  constructor(app: Application) {
    this.app = app;
  }

  public async loadAssets(size: number, gap: number, tileType: TileType) {
    switch (tileType) {
      case "grass":
        return new Graphics().rect(
          0,
          0,
          size + gap,
          size + gap,
        ).fill('yellow');

      case "water":
        return new Graphics().rect(
          0,
          0,
          size + gap,
          size + gap,
        ).fill('blue');
      case "home":
        return new Graphics().rect(
          0,
          0,
          size + gap,
          size + gap,
        ).fill('brown');
      case "tree":
        return new Graphics().rect(
          0,
          0,
          size + gap,
          size + gap,
        ).fill('green');
      default: return null
    }
  }

  public async generateWorld(entityManager: EntityManager, container: Container, world_size: number, size: number, gap: number) {
    const grassTile: { x: number; y: number }[] = []
    const terrainScale = 0.1
    const treeScale = 0.4
    const numberOfHouse = 57;

    for (let i = 0; i < world_size; i++) {
      for (let j = 0; j < world_size; j++) {
        const terrainValue = this.terrainNoise.noise(i * terrainScale, j * terrainScale, 0)

        // Creating water tile and grass tile 
        let tileType: 'grass' | 'water' = 'grass';
        let isSolid = true

        if (terrainValue < 0.4) {
          tileType = 'water';
          isSolid = false;
        }
        else {
          grassTile.push({ x: i, y: j })
        }

        this.createTile(entityManager, container, i, j, tileType, isSolid, size, gap);

        // Generating tree on the grass
        if (tileType == 'grass') {
          const treeValue = this.treeNoise.noise(i * treeScale, j * treeScale, 0.3);
          if (treeValue > 0.65) {
            this.createTile(entityManager, container, i, j, "tree", true, size, gap)
          }
        }
      }
    }

    for (let i = 0; i < numberOfHouse; i++) {
      if (grassTile.length === 0) break;

      const randomIndex = Math.floor(Math.random() * grassTile.length)
      const { x, y } = grassTile.splice(randomIndex, 1)[0];

      this.createTile(entityManager, container, x, y, 'home', true, size, gap);
    }
  }

  private async createTile(entityManager: EntityManager, container: Container, x: number, y: number, tileType: TileType, isSolid: boolean, size: number, gap: number) {

    const tileGraphic: Graphics | null = await this.loadAssets(size, gap, tileType);
    if (!tileGraphic) {
      return
    }

    const tileEntity = entityManager.createEntity()

    tileEntity.addComponent(new PositionComponent(x * (size + gap), y * (size + gap)))
    tileEntity.addComponent(new TileComponent(tileType, isSolid));
    tileEntity.addComponent(new VisualComponent(gap, size, tileGraphic))

    // Add this tile grpahic to the stage 
    container.addChild(tileGraphic)
  }
}
