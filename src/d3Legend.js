function redrawLegend(divId) {
    fetch("./marketCap.json.gz").then(d => d.arrayBuffer()).then(arrayMarketCaps => {
        const dataMarketCap = JSON.parse(pako.inflate(arrayMarketCaps, {to: "string"}));
        const root = d3.hierarchy(dataMarketCap);
        const temp = root.leaves().flatMap(d => d).map(d => ({color: d.data.color, sector: d.data.sector}));
        const sectorData = temp.filter(function(d, i) {
            return temp.findIndex(function(e) {
                return e.sector === d.sector;
            }) === i;
        });

        const height = 28 * sectorData.length;
        const width = window.width;
        d3.select(document.getElementById(divId)).selectAll("*").remove();
        const svg = d3.select(document.getElementById(divId)).append("svg").attr("width", width).attr("height", height).append("g");

        svg.selectAll("sectors").data(sectorData).
        enter().
        append("text").
        html(function(d){ return d.sector; }).
        attr("font-family", "Verdana,serif").
        attr("fill", "#7F7F7F").
        attr("x", function(){ return "40px"; }).
        attr("y", function(d, i){ return (25 * (i + 1)) + "px"; }).
        attr("alignment-baseline","central");
        svg.selectAll("circle").data(sectorData).
        enter().
        append("circle").
        attr("r", function(){ return "10px"; }).
        attr("cx", function(){ return "20px"; }).
        attr("cy", function(d, i){ return (25 * (i + 1)) + "px"; }).
        style("fill", function(d){ return d.color; });
    });
}
