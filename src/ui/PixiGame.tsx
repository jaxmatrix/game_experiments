import { useRef, useState, useEffect } from "react";
import { GameEngine } from "../engine/GameEngine";

interface PixiGameProps {
	width: number;
	height: number;
}

declare global {
	interface Window {
		__PIXIGAME__?: GameEngine | null;
	}
}

export function PixiGame({ width, height }: PixiGameProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameEngineRef = useRef<GameEngine | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [resetGame, setResetGame] = useState<number>(0);

	const handleUpdate = () => {
		setResetGame((n) => n + 1);
	};

	useEffect(() => {
		let cancelled = false;
		const initGame = async () => {
			if (!canvasRef.current) return;

			try {
				let engine = window.__PIXIGAME__ ?? null;
				if (!engine) {
					engine = new GameEngine();
					await engine.init(canvasRef.current, width, height);
					window.__PIXIGAME__ = engine;
				} else {
					engine.resize(width, height);
				}
				if (!cancelled) {
					gameEngineRef.current = engine;
					setIsInitialized(true);
					setError(null);
				}
			} catch (err) {
				console.error("Failed to initialize game:", err);
				if (!cancelled) {
					setError("Failed to initialize game engine");
					setIsInitialized(false);
				}
			}
		};

		initGame();

		return () => {
			gameEngineRef.current = null;
			setIsInitialized(false);
		};
	}, [resetGame, width, height]);

	useEffect(() => {
		if (import.meta.hot) {
			import.meta.hot.dispose(() => {
				if (window.__PIXIGAME__) {
					window.__PIXIGAME__!.destroy();
					window.__PIXIGAME__ = null;
				}
			});
		}
	}, []);

	useEffect(() => {
		if (window.__PIXIGAME__ && isInitialized) {
			window.__PIXIGAME__!.resize(width, height);
		}
	}, [width, height, isInitialized]);

	return (
		<div>
			<button onClick={handleUpdate}>Reset Game</button>
			<div className="w-full h-full">
				<canvas
					ref={canvasRef}
					className="absolute top-10 left-0 w-full h-full block"
					style={{ width: height, height: width, display: "block", zIndex: 0 }}
				/>
				{!isInitialized && !error && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
						<div className="text-white font-mighty text-center">
							<div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
							<p>Loading Game Engine...</p>
						</div>
					</div>
				)}
				{error && (
					<div className="absolute inset-0 flex items-center justify-center bg-red-900/20 z-10">
						<div className="text-white font-mighty text-center p-6 bg-red-900/50 rounded-lg">
							<h3 className="text-xl mb-2">Game Engine Error</h3>
							<p className="text-sm text-red-200">{error}</p>
							<button className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors text-white" onClick={() => window.location.reload()}>
								Reload
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
