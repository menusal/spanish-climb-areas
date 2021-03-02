import React, { useState, useEffect } from "react";
import { StaticMap } from "react-map-gl";
import { AmbientLight, PointLight, LightingEffect } from "@deck.gl/core";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import DeckGL from "@deck.gl/react";
import { FlyToInterpolator } from "deck.gl";

// Source data CSV
const DATA_URL =
  "https://raw.githubusercontent.com/menusal/dataviz/main/escuelas_escalada.csv"; // eslint-disable-line

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0,
});

const pointLight1 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-0.144528, 49.739968, 80000],
});

const pointLight2 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-3.807751, 54.104682, 8000],
});

const lightingEffect = new LightingEffect({
  ambientLight,
  pointLight1,
  pointLight2,
});

const material = {
  ambient: 0.64,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [51, 51, 51],
};

const INITIAL_VIEW_STATE = {
  longitude: -3.74922,
  latitude: 40.463669,
  zoom: 5.8,
  minZoom: 2,
  maxZoom: 15,
  pitch: 40.5,
  bearing: -45,
  transitionDuration: 4000,
  transitionInterpolator: new FlyToInterpolator(),
};

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

export const colorRange = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78],
];

function getTooltip({ object }) {
  if (!object) {
    return null;
  }
  const count = object.elevationValue;

  return {
    html: `<h2>${object.points[0].source.name}</h2><div><p><b>${count}</b> Vías</p></div>`,
    style: {
      backgroundColor: "#f3f3f3",
      fontSize: "0.8em",
      color: "#111",
    },
  };
}

/* eslint-disable react/no-deprecated */
export default function App({
  mapStyle = MAP_STYLE,
  radius = 2000,
  upperPercentile = 100,
  coverage = 1,
}) {
  const [data, setData] = useState([]);
  const [rawdata, setRawData] = useState([]);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [info, setInfo] = useState("");
  useEffect(() => {
    require("d3-request").csv(DATA_URL, (error, response) => {
      if (!error) {
        const _data = [];
        response.map((d) =>
          _data.push({
            COORDINATES: [Number(d.lat), Number(d.lng)],
            value: Number(d.num),
            name: d.escuela,
          })
        );
        setInfo(`${_data.length} results`)
        setData(_data);
        setRawData(_data);
      }
    });
  }, []);
  // Elevation
  function getCount(points) {
    return points[0].value;
  }

  // Color category
  function getMean(points) {
    return points.reduce((sum, p) => (sum += p.value), 0);
  }

  function randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function flyTo(e, item) {
    setViewState({
      longitude: item.COORDINATES[0],
      latitude: item.COORDINATES[1],
      zoom: 11.8,
      minZoom: 2,
      maxZoom: 15,
      pitch: 40.5,
      bearing: randomIntFromInterval(-120, 240),
      transitionDuration: 4000,
      transitionInterpolator: new FlyToInterpolator(),
    });
  }

  function resetMap() {
    setViewState(INITIAL_VIEW_STATE);
  }

  function filter(e) {
    console.log(e)
    if (e.target.value.length > 1) {
      const filteredData = data.filter((x) => x.name.toUpperCase().includes(e.target.value.toUpperCase()));
      if (filteredData.length > 0) {
        setData(filteredData);
        setInfo(`${filteredData.length} results`)
      }  else {
        setInfo(`No results found`);
        setData(rawdata);
      }
    } else {
      setData(rawdata);
    }
  }

  const layers = [
    new HexagonLayer({
      id: "heatmap",
      colorRange,
      coverage,
      data,
      elevationRange: [0, 5000],
      elevationScale: data && data.length ? 50 : 0,
      extruded: true,
      getPosition: (d) => d.COORDINATES,
      pickable: true,
      radius,
      upperPercentile,
      material,
      getColorValue: getMean,
      getElevationValue: getCount,
      transitions: {
        elevationScale: 5000,
      },
    }),
  ];

  return (
    <div>
      <div className="list">
        <div className="control" onClick={resetMap}>
          Reset position
        </div>
        <div className="search">
          <input
            type="text"
            placeholder="Search climb area"
            onChange={filter}
          />
        </div>
        <div className="result" >{info}</div>
        {data &&
          data.map((item, index) => (
            <div key={index} onClick={(e) => flyTo(e, item)} className="item">
              {item.name}
            </div>
          ))}
      </div>
      <div className="title">
        <h1>Spanish Climb Areas</h1>
      </div>
      <DeckGL
        layers={layers}
        effects={[lightingEffect]}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        getTooltip={getTooltip}
        viewState={viewState}
        onViewStateChange={(e) => setViewState(e.viewState)}
      >
        <StaticMap reuseMaps mapStyle={mapStyle} preventStyleDiffing={true} />
      </DeckGL>
    </div>
  );
}
