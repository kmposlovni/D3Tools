let initialCash = 400.0;
let finalProfitLoss = initialCash;
let portfolioErrorOccurred = false;
const portfolioValues = {};
const cryptoColors = {};
cryptoColors["Bitcoin"] = "Gold";
cryptoColors["Ethereum"] = "RebeccaPurple";
cryptoColors["BNB"] = "DarkKhaki";
cryptoColors["Solana"] = "LightSeaGreen";
cryptoColors["XRP"] = "DarkSlateGray";
cryptoColors["Dogecoin"] = "DarkKhaki";
cryptoColors["Cardano"] = "DodgerBlue";
cryptoColors["Tron"] = "IndianRed";
cryptoColors["Polygon"] = "DarkOrchid";
cryptoColors["Polkadot"] = "MediumVioletRed";
cryptoColors["Litecoin"] = "RoyalBlue";
cryptoColors["Stellar"] = "DimGray";
cryptoColors["Chainlink"] = "DeepSkyBlue";
cryptoColors["cash"] = "DarkOliveGreen";

function prettyPrintDate(date) {
    if(date === null || date === undefined)return "-";
    const day = date.getDate();
    const month = date.toLocaleDateString("default", { month: "short" });
    const year = date.getFullYear();
    return month + " " + day + " " + year;
}
function defaultStringDate(date) {
    if(date === null || date === undefined)return "-";
    else return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function changeInitialCash() {
    let cash = prompt("Change initial cash:", "400");
    if(cash !== undefined && cash !== null) {
        const temp = parseFloat(cash);
        if(!isNaN(temp) && temp > 0.0)initialCash = temp;
        else initialCash = 400.0;
    }
}

function getDateMinMaxAndCryptos(csvData) {
    const cryptos = [];
    const dates = [];
    for(const i in csvData.columns)if(csvData.columns[i] !== "date")cryptos.push(csvData.columns[i]);
    for(const i in csvData)if(i !== "columns")dates.push(new Date(csvData[i]["date"]));
    dates.sort((a, b) => a.getTime() - b.getTime());
    return {cryptos: cryptos, dates: [defaultStringDate(dates[0]), defaultStringDate(dates[dates.length - 1])]};
}

function modifyCrypto() {
    const selectedCrypto = document.getElementById("cryptoSelect").options[document.getElementById("cryptoSelect").selectedIndex].text;
    const cryptoQuantity = document.getElementById("quantityText").value;
    let cryptoQuantityValue = 0.0;
    const temp = parseFloat(cryptoQuantity);
    if(!isNaN(temp) && temp > 0.0)cryptoQuantityValue = temp;
    const selectedStartDate = new Date(document.getElementById("startDate").value);
    const selectedEndDate = new Date(document.getElementById("endDate").value);
    if(cryptoQuantityValue >= 0.0) {
        let currentDate = new Date(selectedStartDate);
        while(currentDate.getTime() <= selectedEndDate.getTime()) {
            const currentDateStr = defaultStringDate(currentDate);
            if(portfolioValues[currentDateStr] === null || portfolioValues[currentDateStr] === undefined)portfolioValues[currentDateStr] = {};
            if(cryptoQuantityValue === 0.0)delete portfolioValues[currentDateStr][selectedCrypto];
            else portfolioValues[currentDateStr][selectedCrypto] = cryptoQuantityValue;
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
}

function formatPortfolioDataForPrint() {
    const temp = [];
    for(const i in portfolioValues) {
        for(const j in portfolioValues[i]) {
            if(portfolioValues[i][j] === 0.0)continue;
            const match = temp.find(u => u["name"] === j && u["held"] === portfolioValues[i][j]);
            if(match !== null && match !== undefined)match["dates"].push(new Date(i));
            else temp.push({ name: j, held: portfolioValues[i][j], dates: new Array(new Date(i)) });
        }
    }
    temp.forEach(t => t.dates.sort((a, b) => a.getTime() - b.getTime()));
    const result = [];
    for(const i in temp) {
        for(const j in temp[i].dates) {
            const datePrevious = new Date(temp[i].dates[j]);
            datePrevious.setDate(temp[i].dates[j].getDate() - 1);
            const match = result.find(u => u["name"] === temp[i]["name"] && u["held"] === temp[i]["held"] && (Math.abs(u["endDate"].getTime() - datePrevious.getTime()) <= 3600000));
            if(match !== null && match !== undefined)match["endDate"] = temp[i].dates[j];
            else result.push({ name: temp[i]["name"], held: temp[i]["held"], startDate: temp[i].dates[j], endDate: temp[i].dates[j] });
        }
    }
    return result;
}

function prepareCrypto(data) {
    for(const i in data) {
        if(i === "columns") {
            data[i].shift();
            data[i].unshift("cash");
            data[i].unshift("date");
            continue;
        }
        data[i]["cash"] = { currentValue: initialCash, held: 0.0, coinPrice: 0.0 };
        if(data[i - 1] !== null && data[i - 1] !== undefined)data[i]["cash"]["currentValue"] = data[i - 1]["cash"]["currentValue"];
        let allocatedCrypto = null;
        for(const j in data[i]) {
            if(j === "date") {
                allocatedCrypto = portfolioValues[data[i][j]];
                continue;
            }
            if(j === "cash") {
                finalProfitLoss = data[i][j]["currentValue"];
                continue;
            }
            const coinPrice = parseFloat(data[i][j]);
            let previouslyHeld = 0.0;
            let previousCoinPrice = coinPrice;
            if(data[i - 1] !== null && data[i - 1] !== undefined) {
                if(data[i - 1][j] !== null && data[i - 1][j] !== undefined) {
                    if(data[i - 1][j]["held"] !== null && data[i - 1][j]["held"] !== undefined)previouslyHeld = data[i - 1][j]["held"];
                    if(data[i - 1][j]["coinPrice"] !== null && data[i - 1][j]["coinPrice"] !== undefined)previousCoinPrice = data[i - 1][j]["coinPrice"];
                }
            }
            let requestedHeld = 0.0;
            if(allocatedCrypto !== null && allocatedCrypto !== undefined) {
                if(allocatedCrypto[j] !== null && allocatedCrypto[j] !== undefined)requestedHeld = allocatedCrypto[j];
                if(requestedHeld < 0.0)requestedHeld = 0.0;
            }
            const deltaHeld = requestedHeld - previouslyHeld;
            if(deltaHeld === 0.0)data[i][j] = { currentValue: requestedHeld * coinPrice, held: requestedHeld, coinPrice: coinPrice };
            else if(deltaHeld < 0.0) {
                data[i]["cash"]["currentValue"] -= previousCoinPrice * deltaHeld;
                data[i][j] = { currentValue: requestedHeld * coinPrice, held: requestedHeld, coinPrice: coinPrice };
            }
            else {
                if(coinPrice * deltaHeld > data[i]["cash"]["currentValue"]) {
                    if(!portfolioErrorOccurred) {
                        portfolioErrorOccurred = true;
                        window.alert("Not enough cash to buy " + j + " at " + prettyPrintDate(new Date(data[i]["date"])) + "; coin price is " + coinPrice + "$");
                    }
                    console.error("Not enough cash to buy " + j + " at " + data[i]["date"] + "; coin price is " + coinPrice + "$");
                    requestedHeld = previouslyHeld;
                }
                else data[i]["cash"]["currentValue"] -= coinPrice * deltaHeld;
                data[i][j] = { currentValue: requestedHeld * coinPrice, held: requestedHeld, coinPrice: coinPrice };
            }
        }
    }
}

function redrawCrypto(divId, data) {
    const height = 0.5 * window.innerHeight;
    const width = 2.9 * height;
    d3.select(document.getElementById(divId)).selectAll("*").remove();
    const svg = d3.select(document.getElementById(divId)).append("svg").attr("width", width).attr("height", height).append("g");

    let yLimit = 400.0;
    const dataForStackedArea = [];
    for(const i in data) {
        dataForStackedArea[i] = [];
        if(i === "columns") {
            dataForStackedArea[i] = data[i];
            continue;
        }
        let currentSum = 0.0;
        for(const j in data[i]) {
            if(j === "date") {
                dataForStackedArea[i][j] = data[i][j];
                continue;
            }
            const value = parseFloat(data[i][j]["currentValue"]);
            dataForStackedArea[i][j] = value;
            currentSum += value;
        }
        if(currentSum > yLimit)yLimit = currentSum;
    }

    const marginValues = { translation: 60, scale: 0.9 };
    const xAxis = d3.scaleLinear().domain(d3.extent(data, function(d) { return new Date(d.date); })).range([marginValues.translation, width]);
    svg.append("g").attr("transform", `translate(0, ${marginValues.scale * height})`).call(d3.axisBottom(xAxis).ticks(8).tickFormat(d3.timeFormat("%b %d %y"))).selectAll(".tick text").attr("font-family", "Verdana,serif");
    const yAxis = d3.scaleLinear().domain([0, yLimit]).range([marginValues.scale * height, 0]);
    svg.append("g").attr("transform", `translate(${marginValues.translation}, 0)`).call(d3.axisLeft(yAxis).ticks(8)).selectAll(".tick text").attr("font-family", "Verdana,serif");

    const keys = dataForStackedArea.columns.slice(1);
    const stackedData = d3.stack().order(d3.stackOrderAppearance).keys(keys)(dataForStackedArea);

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
    style("padding", "10px").
    style("right", "5%").
    style("top", "30%");
    let highlightedKey = null;
    const mouseover = function(d, i) {
        tooltip.style("visibility", "visible");
        d3.selectAll(".stackedareaclass").style("opacity", 0.2);
        d3.select(this).style("opacity", 1);
        highlightedKey = i.key;
    }
    const mousemove = function(d) {
        const timeSlice = new Date(Math.floor(xAxis.invert(d3.pointer(d)[0])));
        let dataForTimeSlice = [];
        for(const i in data) {
            if(i === "columns")continue;
            data[i]["date"] = new Date(data[i]["date"]);
            if(timeSlice.getFullYear() === data[i]["date"].getFullYear() && timeSlice.getMonth() === data[i]["date"].getMonth() && timeSlice.getDate() === data[i]["date"].getDate())dataForTimeSlice = data[i];
        }
        let tooltipText = "<p style = \"font-family: Verdana,serif; font-size: 14px\">";
        const keys = Object.keys(dataForTimeSlice);
        let datePrettyPrint = "--";
        let totalProfitLoss = 0.0;
        keys.forEach(u => {
            if(u === "date") {
                datePrettyPrint = prettyPrintDate(dataForTimeSlice[u]);
                return;
            }
            if(dataForTimeSlice[u]["currentValue"] === 0.0)return;
            totalProfitLoss += dataForTimeSlice[u]["currentValue"];
            let text;
            if(u === "cash")text = "Cash: " + (dataForTimeSlice[u]["currentValue"]).toFixed(2) + "$";
            else text = u + ": currentValue = " + (dataForTimeSlice[u]["currentValue"]).toFixed(2) + "$; held = " + dataForTimeSlice[u]["held"] + "; coinPrice = " + (dataForTimeSlice[u]["coinPrice"]).toFixed(2) + "$";
            if(u === highlightedKey)text = "<b>" + text + "</b>";
            tooltipText += text + "<br>";
        });
        tooltipText += "--------<br>Total profit / loss at " + datePrettyPrint + ": " + totalProfitLoss.toFixed(2) + "$";
        tooltipText += "</p>";
        tooltip.html(tooltipText);
    }
    const mouseleave = function() {
        tooltip.style("visibility", "hidden");
        d3.selectAll(".stackedareaclass").style("opacity", 1);
    }

    svg.selectAll("stackedarea").data(stackedData).join("path").attr("class", "stackedareaclass").
    style("fill", (d, i) => d3.color(cryptoColors[dataForStackedArea["columns"][i + 1]])).
    attr("d", d3.area().
        x(function(d){ return xAxis(new Date(d.data.date).getTime()); }).
        y0(function(d){ return yAxis(d[0]); }).
        y1(function(d){ return yAxis(d[1]); })).
    on("mouseover", mouseover).
    on("mousemove", mousemove).
    on("mouseleave", mouseleave);
}
