function makeReadable(value) {
    const suffixes = ["$", "k$", "M$", "B$", "T$", "Qa$"];
    const e = Math.floor(Math.log10(value) / 3);
    const b = value / Math.pow(1000, e);
    const num = b.toFixed(2);
    return num + suffixes[e];
}

function redrawVisualisation(divId) {
    fetch("./countries.json.gz").then(d => d.arrayBuffer()).then(arrayCountries => {
        const dataGeo = JSON.parse(pako.inflate(arrayCountries, { to: "string" }));
        fetch("./marketCap.json.gz").then(d => d.arrayBuffer()).then(arrayMarketCaps => {
            const dataMarketCap = JSON.parse(pako.inflate(arrayMarketCaps, { to: "string" }));
            const height = 0.95 * window.innerHeight;
            const width = 1.9 * height;

            d3.select(document.getElementById(divId)).selectAll("*").remove();

            let mousePositionForTooltip = { x: 0, y: 0 };
            const tooltip = d3.select("#" + divId).
            append("div").
            attr("class", "tooltip").
            style("visibility", "hidden").
            style("background-color", "white").
            style("border", "solid").
            style("border-width", "1px").
            style("border-radius", "20px").
            style("position", "fixed").
            style("max-width", "40%").
            style("padding", "10px");
            let mouseover = function() {
                const data = d3.select(this)._groups[0][0].__data__;
                d3.select(this).style("fill", d3.color(data.data.data.color).brighter());
                tooltip.style("visibility", "visible");
            }
            let mousemove = function(d) {
                if("ontouchstart" in window) {
                    mousePositionForTooltip.x = 0;
                    mousePositionForTooltip.y = 0;
                }
                else {
                    const mousePositionForTooltipOffset = 10;
                    const tooltipRect = (tooltip._groups[0][0]).getBoundingClientRect();
                    mousePositionForTooltip.x += mousePositionForTooltipOffset;
                    if(mousePositionForTooltip.x + tooltipRect.width >= window.innerWidth)mousePositionForTooltip.x -= tooltipRect.width + mousePositionForTooltipOffset;
                    mousePositionForTooltip.y += mousePositionForTooltipOffset;
                    if(mousePositionForTooltip.y + tooltipRect.height >= window.innerHeight)mousePositionForTooltip.y -= tooltipRect.height + mousePositionForTooltipOffset;
                }
                let tooltipText = "<p style = \"font-family: Verdana,serif;\">";
                tooltipText += d.target.__data__.data.data.logo + "<br>";
                tooltipText += "ticker: " + d.target.__data__.data.data.ticker + "<br>";
                tooltipText += "name: " + d.target.__data__.data.data.name + "<br>";
                tooltipText += "market capitalization: " + makeReadable(d.target.__data__.data.data.marketCapitalization) + "<br>";
                tooltipText += "sector: " + d.target.__data__.data.data.sector + "<br>";
                tooltipText += "country: " + d.target.__data__.data.data.country;
                tooltipText += "</p>";
                tooltip.style("left", mousePositionForTooltip.x + "px").
                style("top", mousePositionForTooltip.y + "px").
                html(tooltipText);
            }
            let mouseleave = function() {
                const data = d3.select(this)._groups[0][0].__data__;
                d3.select(this).style("fill", data.data.data.color);
                tooltip.style("visibility", "hidden");
            }
            window.addEventListener("mousemove", event => {
                mousePositionForTooltip = { x: event.clientX, y: event.clientY };
            });
            
            const svg = ("ontouchstart" in window) ? d3.select(document.getElementById(divId)).append("svg").attr("width", width).attr("height", height).append("g") : d3.select(document.getElementById(divId)).append("svg").attr("width", width).attr("height", height).call(d3.zoom().scaleExtent([1, 100]).translateExtent([[0, 0], [width, height]]).on("zoom", function(d) {
                svg.attr("transform", d.transform);
            })).append("g");
            
            const projection = d3.geoNaturalEarth1().scale(width / 1.5 / Math.PI).translate([width / 2, height / 2]);
            svg.append("g").
            selectAll("path").
            data(dataGeo.features).
            join("path").
            attr("fill", "#CDCDCD").
            attr("d", d3.geoPath().projection(projection)).
            style("stroke", "none");

            const root = d3.hierarchy(dataMarketCap);
            for(const country of root.children) {
                const sum = country.children.reduce((accumulator, currentValue) => accumulator + currentValue.data.marketCapitalization, 0);
                const pieData = d3.pie().value(d => d.data.marketCapitalization)(country.children);
                svg.selectAll("pie").data(pieData).
                join("path").
                attr("d", d3.arc().innerRadius(0).outerRadius(Math.sqrt(sum / 20000000000))).
                attr("transform", function(d) {
                    const coordinates = projection([d.data.parent.data.x, d.data.parent.data.y]);
                    return "translate(" + coordinates[0] + ", " + coordinates[1] + ")";
                }).
                attr("fill", function(d){ return d.data.data.color; }).
                style("stroke", "none").
                on("mouseover", mouseover).
                on("mousemove", mousemove).
                on("mouseleave", mouseleave);
            }
        });
    });
}
