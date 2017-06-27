importScripts('d3/d3.js');
importScripts('d3/topojson.js');

d3.json('data/world.json', (error, world) => {
    if (error) {
        console.log(error);
        throw error;
    }
    const projection = d3.geoConicConformal().scale(150).translate([400, 350]);
    const p = d3.geoPath().projection(projection);

    const features = topojson.feature(world, world.objects.countries).features;
    countries = features.map(f => ({
        id: f.id,
        path: p(f)
    }));

    const lines = d3.geoGraticule().lines();
    graticule = lines.map(l => p(l));

    postMessage(JSON.stringify({ countries, graticule }));
});
