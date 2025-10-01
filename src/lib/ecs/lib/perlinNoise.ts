// Perlin Noise implementation in TypeScript
export class PerlinNoise {
	private p: number[] = [];

	constructor() {
		// Generate a permutation table
		const permutation = Array.from({ length: 256 }, (_, i) => i);
		for (let i = 255; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[permutation[i], permutation[j]] = [permutation[j], permutation[i]];
		}
		// Duplicate the permutation table to avoid buffer overflows
		this.p = permutation.concat(permutation);
	}

	private fade(t: number): number {
		return t * t * t * (t * (t * 6 - 15) + 10);
	}

	private lerp(t: number, a: number, b: number): number {
		return a + t * (b - a);
	}

	private grad(hash: number, x: number, y: number, z: number): number {
		const h = hash & 15;
		const u = h < 8 ? x : y;
		const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
		return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
	}

	public noise(x: number, y: number, z: number = 0): number {
		const X = Math.floor(x) & 255;
		const Y = Math.floor(y) & 255;
		const Z = Math.floor(z) & 255;

		x -= Math.floor(x);
		y -= Math.floor(y);
		z -= Math.floor(z);

		const u = this.fade(x);
		const v = this.fade(y);
		const w = this.fade(z);

		const A = this.p[X] + Y;
		const AA = this.p[A] + Z;
		const AB = this.p[A + 1] + Z;
		const B = this.p[X + 1] + Y;
		const BA = this.p[B] + Z;
		const BB = this.p[B + 1] + Z;

		const res = this.lerp(
			w,
			this.lerp(
				v,
				this.lerp(
					u,
					this.grad(this.p[AA], x, y, z),
					this.grad(this.p[BA], x - 1, y, z),
				),
				this.lerp(
					u,
					this.grad(this.p[AB], x, y - 1, z),
					this.grad(this.p[BB], x - 1, y - 1, z),
				),
			),
			this.lerp(
				v,
				this.lerp(
					u,
					this.grad(this.p[AA + 1], x, y, z - 1),
					this.grad(this.p[BA + 1], x - 1, y, z - 1),
				),
				this.lerp(
					u,
					this.grad(this.p[AB + 1], x, y - 1, z - 1),
					this.grad(this.p[BB + 1], x - 1, y - 1, z - 1),
				),
			),
		);

		// Return value in range [0, 1]
		return (res + 1) / 2;
	}
}
