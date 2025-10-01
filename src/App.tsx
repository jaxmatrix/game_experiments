import "./App.css";
import { PixiGame } from "./ui/PixiGame";

function App() {
	return (
		<>
			<div className="w-full h-full">
				<PixiGame height={576} width={576} />
			</div>
		</>
	);
}

export default App;
