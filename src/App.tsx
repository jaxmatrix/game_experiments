import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { GameView } from "./ui/GameView";
import { PixiGame } from "./ui/PixiGame";

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<div className="w-full h-full">
				<PixiGame height={400} widht={400} />
			</div>
		</>
	);
}

export default App;
