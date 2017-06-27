'use strict';
// Global var for FIFA world cup data
let allWorldCupData;
let lastWorldcupData = {};

const transition = d3.transition()
    .duration(500)
    .ease(d3.easeQuad);

/**
 * Render and update the bar chart based on the selection of the data type in the drop-down box
 *
 * @param selectedDimension a string specifying which dimension to render in the bar chart
 */
function updateBarChart(selectedDimension) {
    const data = mapData(selectedDimension);

    const barChartSvg = d3.select('#barChart');
    const svg = {
        xAxis: barChartSvg.select('#xAxis'),
        yAxis: barChartSvg.select('#yAxis'),
        bars: barChartSvg.select('#bars')
    }

    const svgBounds = barChartSvg.node().getBoundingClientRect();
    const padding = { top: 20, right: 20, bottom: 100, left: 70 };
    const barSpacing = 2;

    const chartSize = {
        width: svgBounds.width - padding.left - padding.right,
        height: svgBounds.height - padding.top - padding.bottom
    }
    const scales = createScales(chartSize, data);
    createAxis(svg, scales, chartSize, padding);

    const rects = svg.bars.selectAll('rect').data(data);

    rects.enter()
        .append('rect')
        .merge(rects)
        .transition(transition)
        .attr('class', 'bar')
        .attr('transform', 'translate(' + padding.left + ',' + padding.top + ' )')
        .attr('x', d => scales.x(d.year))
        .attr('y', d => scales.y(d.datum))
        .attr('width', scales.x.bandwidth() - barSpacing)
        .attr('height', d => chartSize.height - scales.y(d.datum))
        .style('fill', d => d3.rgb(0, 0, scales.color(d.datum)))

    rects.exit()
        .transition(transition)
        .remove();

    svg.bars.selectAll('rect').on('click', barClicked);


    function barClicked(obj, index, elements) {

        svg.bars.selectAll('rect')
            .transition(transition)
            .style('fill', d => d3.rgb(0, 0, scales.color(d.datum)));

        d3.select(elements[index])
            .transition(transition)
            .style('fill', '#FF0000');

        const oneWoldCup = allWorldCupData.find(d => d.year === obj.year)
        updateInfo(oneWoldCup);
        updateMap(oneWoldCup);
    }

}

function mapData(dimension) {
    return allWorldCupData
        .map(d => ({
            datum: d[dimension],
            year: d.year
        }))
        .sort((a, b) => a.year - b.year);
}

function createScales(size, data) {
    const x = d3.scaleBand().rangeRound([0, size.width]),
        y = d3.scaleLinear().rangeRound([size.height, 0]),
        color = d3.scaleLinear().rangeRound([200, 50]);

    x.domain(data.map(d => d.year));
    y.domain([0, d3.max(data, d => d.datum)]);
    color.domain([0, d3.max(data, d => d.datum)]);

    return { x, y, color }
}

function createAxis(svg, scales, size, padding) {
    svg.xAxis
        .transition(transition)
        .attr('transform', 'translate(' + padding.left + ',' + (padding.top + size.height) + ' )')
        .call(d3.axisBottom(scales.x))
        .selectAll('text')
        .attr('y', 0)
        .attr('x', -9)
        .attr('dy', '.35em')
        .attr('transform', 'rotate(270)')
        .style('text-anchor', 'end');

    svg.yAxis
        .transition(transition)
        .attr('transform', 'translate(' + padding.left + ',' + padding.top + ' )')
        .call(d3.axisLeft(scales.y));
}

/**
 *  Check the drop-down box for the currently selected data type and update the bar chart accordingly.
 *
 *  There are 4 attributes that can be selected:
 *  goals, matches, attendance and teams.
 */
function chooseData(v) {
    updateBarChart(v);
}

/**
 * Update the info panel to show info about the currently selected world cup
 *
 * @param oneWorldCup the currently selected world cup
 */
function updateInfo(oneWorldCup) {
    d3.select('#edition').text(oneWorldCup.EDITION);
    d3.select('#host').text(oneWorldCup.host);
    d3.select('#winner').text(oneWorldCup.winner);
    d3.select('#silver').text(oneWorldCup.runner_up);

    const teams = d3.select('#teams')
        .selectAll('li')
        .data(oneWorldCup.teams_names);

    teams.exit().remove();
    teams.enter()
        .append('li')
        .merge(teams)
        .text(d => d);
}

/**
 * Renders and updates the map and the highlights on top of it
 *
 * @param the json data with the shape of all countries
 */
function drawMap() {
    const map = d3.select('#map');

    const worker = new Worker('worker.js');
    worker.onmessage = event => {
        const data = JSON.parse(event.data);
        draw(data);
    };

    function draw(data) {
        map.append('g')
            .selectAll('.country')
            .data(data.countries)
            .enter()
            .append('path')
            .attr('d', c => c.path)
            .attr('class', 'country')
            .attr('id', c => c.id)
            .on('click', countryClicked);

        map.append('g')
            .selectAll('path.grat')
            .data(data.graticule)
            .enter()
            .append('path')
            .attr('d', l => l)
            .attr('class', 'grat');
    }
}

function countryClicked(country, index, elements) {

    const iso = country.id;
    const worldCups = allWorldCupData.filter(w => w.teams_iso.includes(iso));

    //opens popup
    const container = d3.select('body')
        .append('div')
        .attr('class', 'popup-background')
        .on('click', _ => {
            d3.select('.popup-background')
                .remove();
        })
        .append('div')
        .attr('class', 'popup');

    container.append('h2').text(iso);


    if (!worldCups.length) {
        container.append('span').text('This country has never participated in a FIFA World Cup.');
        return;
    }

    //creates table
    const columns = [{
        property: 'EDITION',
        header: 'Participating editions'
    }, {
        property: 'winner',
        header: 'Winner'
    }, {
        property: 'runner_up',
        header: 'Runner up'
    }];

    const table = container.append('table');
    const thead = table.append('thead');
    const tbody = table.append('tbody');


    thead.selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .text(c => c.header);

    const rows = tbody.selectAll('tr')
        .data(worldCups)
        .enter()
        .append('tr');

    rows.selectAll('td')
        .data(row => columns.map(c => row[c.property]))
        .enter()
        .append('td')
        .text(_ => _);
};

/**
 * Clears the map
 */
function clearMap() {
    if (lastWorldcupData.teams)
        lastWorldcupData.teams.forEach(t => d3.select('#' + t).classed("team", false));

    if (lastWorldcupData.host)
        d3.select('#' + lastWorldcupData.host).classed('host', false);

    d3.select("#points").selectAll("*").remove();
}


/**
 * Update Map with info for a specific FIFA World Cup
 * @param the data for one specific world cup
 */
function updateMap(worldcupData) {

    //Clear any previous selections;
    clearMap();

    const projection = d3.geoConicConformal().scale(150).translate([400, 350]);
    const markerRadius = 8;

    lastWorldcupData = {
        host: worldcupData.host_country_code,
        goldPos: projection(worldcupData.win_pos),
        silverPos: projection(worldcupData.ru_pos),
        teams: worldcupData.teams_iso
    };

    lastWorldcupData.teams.forEach(t => d3.select('#' + t).classed('team', true));
    d3.select('#' + lastWorldcupData.host).classed('host', true);

    d3.select('#points')
        .append('circle')
        .attr('cx', lastWorldcupData.goldPos[0])
        .attr('cy', lastWorldcupData.goldPos[1])
        .attr('r', markerRadius)
        .attr('class', 'gold');

    d3.select('#points')
        .append('circle')
        .attr('cx', lastWorldcupData.silverPos[0])
        .attr('cy', lastWorldcupData.silverPos[1])
        .attr('r', markerRadius)
        .attr('class', 'silver');
}

/* DATA LOADING */

// This is where execution begins; everything
// above this is just function definitions
// (nothing actually happens)
//Load in json data to make map
//Moved loading inside web worker for better performance
drawMap();


// Load CSV file
d3.csv('data/fifa-world-cup.csv', function (error, csv) {
    if (error) {
        console.log(error);  //Log the error.
        throw error;
    }

    csv.forEach(function (d) {

        // Convert numeric values to 'numbers'
        d.year = +d.YEAR;
        d.teams = +d.TEAMS;
        d.matches = +d.MATCHES;
        d.goals = +d.GOALS;
        d.avg_goals = +d.AVERAGE_GOALS;
        d.attendance = +d.AVERAGE_ATTENDANCE;
        //Lat and Lons of gold and silver medals teams
        d.win_pos = [+d.WIN_LON, +d.WIN_LAT];
        d.ru_pos = [+d.RUP_LON, +d.RUP_LAT];

        //Break up lists into javascript arrays
        d.teams_iso = d3.csvParse(d.TEAM_LIST).columns;
        d.teams_names = d3.csvParse(d.TEAM_NAMES).columns;

    });

    // Store csv data in a global variable
    allWorldCupData = csv;
    // Draw the Bar chart for the first time
    updateBarChart('attendance');
});
