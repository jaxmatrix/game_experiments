import { useRef, useState, useEffect } from "react";
import { GameEngine } from "../engine/GameEngine";

interface PixiGameProps {
	width: number;
	height: number;
}

export function PixiGame({ width, height }: PixiGameProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameEngineRef = useRef<GameEngine | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Initialize PixiJS when component mounts
	useEffect(() => {
		const initGame = async () => {
			if (!canvasRef.current || gameEngineRef.current) return;

			try {
				const gameEngine = new GameEngine();
				await gameEngine.init(canvasRef.current, width, height);

				gameEngineRef.current = gameEngine;
				setIsInitialized(true);
				setError(null);
			} catch (err) {
				console.error("Failed to initialize game:", err);
				setError("Failed to initialize game engine");
				setIsInitialized(false);
			}
		};

		initGame();

		// Cleanup on unmount
		return () => {
			if (gameEngineRef.current) {
				console.log("Destruction of pixi game started");
				gameEngineRef.current.destroy();
				gameEngineRef.current = null;
			}
			setIsInitialized(false);
		};
	}, []); // Only run once on mount

	// Handle resize when dimensions change
	useEffect(() => {
		if (gameEngineRef.current && isInitialized) {
			gameEngineRef.current.resize(width, height);
		}
	}, [width, height, isInitialized]);

	return (
		<div className="w-full h-full">
			<canvas
				ref={canvasRef}
				className="absolute top-0 left-0 w-full h-full block"
				style={{
					width: "100%",
					height: "100%",
					display: "block",
					zIndex: 0,
				}}
			/>

			{/* Loading state */}
			{!isInitialized && !error && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
					<div className="text-white font-mighty text-center">
						<div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
						<p>Loading Game Engine...</p>
					</div>
				</div>
			)}

			{/* Error state */}
			{error && (
				<div className="absolute inset-0 flex items-center justify-center bg-red-900/20 z-10">
					<div className="text-white font-mighty text-center p-6 bg-red-900/50 rounded-lg">
						<h3 className="text-xl mb-2">Game Engine Error</h3>
						<p className="text-sm text-red-200">{error}</p>
						<button
							className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors text-white"
							onClick={() => window.location.reload()}
						>
							Reload
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
