import "./style.css";
import Alpine from "alpinejs";
import { quadPlotApp } from "./app";

if (typeof window !== "undefined") {
	document.addEventListener("alpine:init", () => {
		Alpine.data("quadPlot", quadPlotApp);
	});
	window.Alpine = Alpine;
	Alpine.start();
}
