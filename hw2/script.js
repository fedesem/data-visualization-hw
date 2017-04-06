/*globals alert, document, d3, console*/
// These keep JSHint quiet if you're using it



window.addEventListener('load', _ => {
    document.getElementById('staircase').addEventListener('click', staircase);
    document.getElementById('random').addEventListener('click', randomSubset);
    document.getElementById('dataset').addEventListener('change', changeData);

    changeData();
});

function staircase() {
    const barWidth = 20;

    const bc1 = document.getElementById('bar-chart-a');
    const rects = bc1.getElementsByTagName('rect');

    for (let i = 0; i < rects.length; i++) {
        if (i < 10) {
            const height = (i + 1) * 20;
            rects[i].setAttribute('width', barWidth);
            rects[i].setAttribute('height', height);
            rects[i].setAttribute('y', 200 - height);
            rects[i].setAttribute('x', i * barWidth);
        }
        else
            bc1.removeChild(rects[i]);
    }
}

function update(error, data) {
    if (error !== null) {
        alert("Couldn't load the dataset!");
        return;
    }

    // D3 loads all CSV data as strings;
    // while Javascript is pretty smart
    // about interpreting strings as
    // numbers when you do things like
    // multiplication, it will still
    // treat them as strings where it makes
    // sense (e.g. adding strings will
    // concatenate them, not add the values
    // together, or comparing strings
    // will do string comparison, not
    // numeric comparison).

    // We need to explicitly convert values
    // to numbers so that comparisons work
    // when we call d3.max()
    data.forEach(d => {
        d.a = parseInt(d.a);
        d.b = parseFloat(d.b);
    });


    // Set up the scales
    const size = 200;

    const aScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.a)])
        .range([5, size - 5]);
    const bScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.b)])
        .range([5, size - 5]);
    const iScale = d3.scaleLinear()
        .domain([0, data.length])
        .range([0, size]);

    // ****** TODO: PART III (you will also edit in PART V) ******

    // TODO: Select and update the 'a' bar chart bars
    const barChartA = d3.select('#bar-chart-a')
        .attr('width', size)
        .attr('height', size);

    const rectsA = barChartA.selectAll("rect")
        .data(data);

    rectsA.attr('width', iScale(1) - 1)
        .attr('height', (d, i) => aScale(d.a))
        .attr('x', (d, i) => iScale(i))
        .attr('y', (d, i) => size - aScale(d.a));

    rectsA.enter()
        .append("rect")
        .attr('width', iScale(1) - 1)
        .attr('height', (d, i) => aScale(d.a))
        .attr('x', (d, i) => iScale(i))
        .attr('y', (d, i) => size - aScale(d.a));

    rectsA.exit().remove();


    // TODO: Select and update the 'b' bar chart bars
    const barChartB = d3.select('#bar-chart-b')
        .attr('width', size)
        .attr('height', size);
    const rectsB = barChartB.selectAll("rect")
        .data(data);

    rectsB.attr('width', iScale(1) - 1)
        .attr('height', (d, i) => bScale(d.b))
        .attr('x', (d, i) => iScale(i))
        .attr('y', (d, i) => size - bScale(d.b));

    rectsB.enter()
        .append("rect")
        .attr('width', iScale(1) - 1)
        .attr('height', (d, i) => bScale(d.b))
        .attr('x', (d, i) => iScale(i))
        .attr('y', (d, i) => size - bScale(d.b));

    rectsB.exit().remove();

    // TODO: Select and update the 'a' line chart path using this line generator
    const aLineGenerator = d3.line()
        .x((d, i) => iScale(i))
        .y(d => size - aScale(d.a));

    const lineChartA = d3.select('#line-chart-a')
        .attr('width', size)
        .attr('height', size);
    lineChartA.selectAll('*').remove();
    lineChartA.append('path')
        .attr('d', aLineGenerator(data))

    // TODO: Select and update the 'b' line chart path (create your own generator)
    const bLineGenerator = d3.line()
        .x((d, i) => iScale(i))
        .y(d => size - bScale(d.b));

    const lineChartB = d3.select('#line-chart-b')
        .attr('width', size)
        .attr('height', size);
    lineChartB.selectAll('*').remove();
    lineChartB.append('path')
        .attr('d', bLineGenerator(data))

    // TODO: Select and update the 'a' area chart path using this line generator
    const aAreaGenerator = d3.area()
        .x((d, i) => iScale(i))
        .y0(size)
        .y1(d => size - aScale(d.a));

    const areaChartA = d3.select('#area-chart-a')
        .attr('width', size)
        .attr('height', size);
    areaChartA.selectAll('*').remove();
    areaChartA.append('path')
        .attr('d', aAreaGenerator(data));

    // TODO: Select and update the 'b' area chart path (create your own generator)
    const bAreaGenerator = d3.area()
        .x((d, i) => iScale(i))
        .y0(size)
        .y1(d => size - aScale(d.b));

    const areaChartB = d3.select('#area-chart-b')
        .attr('width', size)
        .attr('height', size);
    areaChartB.selectAll('*').remove();
    areaChartB.append('path')
        .attr('d', bAreaGenerator(data));

    // TODO: Select and update the scatterplot points
    const scatterplot = d3.select('#scatterplot')
        .attr('width', size)
        .attr('height', size);

    const circles = scatterplot.selectAll("circle")
        .data(data);

    circles.attr('cx', (d, i) => aScale(d.a))
        .attr('cy', (d, i) => size - bScale(d.b))
        .attr('r', 5);

    circles.enter()
        .append("circle")
        .attr('cx', (d, i) => aScale(d.a))
        .attr('cy', (d, i) => size - bScale(d.b))
        .attr('r', 5);

    circles.exit().remove();

    // ****** TODO: PART IV ******

    barChartA.selectAll('rect')
        .on('mouseover', changeColor(barChartB))
        .on('mouseout', restoreColor(barChartB))

    barChartB.selectAll('rect')
        .on('mouseover', changeColor(barChartA))
        .on('mouseout', restoreColor(barChartA))

    scatterplot.selectAll('circle')
        .on('mouseover', showTooltip)
        .on('click', logCoordinates);
}

function changeColor(chart) {
    return function (obj, index, elements) {
        chart.selectAll('rect')
            .filter((d, i) => i === index)
            .style("fill", "red");
    }
}

function restoreColor(chart) {
    return function (obj, index, elements) {
        chart.selectAll('rect')
            .style("fill", "");
    }
}

function showTooltip(obj, index, elements) {
    const coordinates = d3.mouse(this);
    console.log(coordinates);
    const scatterplot = d3.select(this.parentNode.parentNode);
    scatterplot.append('text')
        .attr('x', coordinates[0])
        .attr('y', coordinates[1])
        .text("I'm a label");
}

function logCoordinates(obj, index, elements) {
    console.log(obj);
}

function changeData() {
    // // Load the file indicated by the select menu
    var dataFile = document.getElementById('dataset').value;
    if (document.getElementById('random').checked) {
        randomSubset();
    }
    else {
        d3.csv('data/' + dataFile + '.csv', update);
    }
}

function randomSubset() {
    // Load the file indicated by the select menu,
    // and then slice out a random chunk before
    // passing the data to update()
    var dataFile = document.getElementById('dataset').value;
    if (document.getElementById('random').checked) {
        d3.csv('data/' + dataFile + '.csv', function (error, data) {
            var subset = [];
            data.forEach(function (d) {
                if (Math.random() > 0.5) {
                    subset.push(d);
                }
            });
            update(error, subset);
        });
    }
    else {
        changeData();
    }
}