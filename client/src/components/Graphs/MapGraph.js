import "components/Graphs/HeatmapGraph3d.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, usePinnedFeatures, useFileInfo } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import GraphWrapper from "components/Graphs/GraphWrapper";
import * as graphFunctions from "components/Graphs/graphFunctions";
import * as uiTypes from "constants/uiTypes";
import * as utils from "utils/utils";

import { filterBounds } from "./graphFunctions";
import { usePrevious } from "../../hooks/UtilHooks";

const DEFAULT_MAP_TYPE = uiTypes.MAP_USGS;
const DEFAULT_ZOOM = 0;
const DEFAULT_TITLE = "Map Graph";

function getMapConfig(mapType) {
    switch (mapType) {
        case uiTypes.MAP_USGS:
            return {
                style: "white-bg",
                layers: [
                    {
                        sourcetype: "raster",
                        source: [
                            "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}"
                        ],
                        below: "traces"
                    }
                ]
            };
        case uiTypes.MAP_OPEN_STREET_MAP:
            return { style: "open-street-map" };
    }
}

function MapGraph(props) {
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());
    // Changing things in map mode requires a total re-render instead of just a revision increment
    // Changing the `key` attribute of the Plot causes React to trash it and make a new one.
    const [renderKey, setRenderKey] = useState(0);

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = graphFunctions.interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    const baseCols = utils.removeSentinelValuesRevised(props.data, props.fileInfo);
    const cols = filterBounds(
        props.win.data.features,
        baseCols.map(col => col.data),
        props.win.data.bounds
    ).map((data, idx) => ({ ...baseCols[idx], data }));

    const featureDisplayNames = props.win.data.features.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );
    useEffect(_ => {
        if (!props.win.title) props.win.setTitle(featureDisplayNames.join(" vs "));
        props.win.setData(data => ({
            ...data.toJS(),
            mapType: uiTypes.MAP_USGS,
            xAxis: props.win.data.features[0],
            yAxis: props.win.data.features[1],
            zAxis: props.win.data.features[2] || null,
            bounds:
                props.win.bounds ||
                cols.reduce((acc, col) => {
                    acc[col.feature] = { min: Math.min(...col.data), max: Math.max(...col.data) };
                    return acc;
                }, {})
        }));
    }, []);

    const heatMode = props.win.data.features.length === 3;
    const dataset = heatMode
        ? {
              type: "densitymapbox",
              lon: cols[1].data,
              lat: cols[0].data,
              z: cols[2].data,
              colorscale: interpolatedColors
          }
        : {
              type: "scattermapbox",
              lon: cols[1].data,
              lat: cols[0].data,
              marker: { color: "fuchsia", size: 4 }
          };

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [dataset],
        layout: {
            dragmode: "zoom",
            mapbox: {
                ...getMapConfig(DEFAULT_MAP_TYPE),
                zoom: DEFAULT_ZOOM
            },
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: false, // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            annotations: []
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    });

    // Effect to keep map type updated if it's changed
    useEffect(
        _ => {
            if (props.win.data.mapType) {
                setChartState(state => ({
                    ...state,
                    layout: {
                        ...state.layout,
                        mapbox: { ...getMapConfig(props.win.data.mapType), zoom: DEFAULT_ZOOM }
                    }
                }));
                setRenderKey(renderKey + 1);
            }
        },
        [props.win.data.mapType]
    );

    // Effect to keep axes updated if they've been changed
    const oldData = usePrevious(JSON.stringify(props.win.data));
    useEffect(
        _ => {
            if (oldData === JSON.stringify(props.win.data)) return; // Avoid unneccessary rerenders
            if (!props.win.data.xAxis) return;
            const newData = [...chartState.data];

            // this is a little kludgy, but if the user switches to from the singlex multipley map,
            // the z-index can be set to GRAPH_INDEX,
            // which doesn't apply here
            const xAxis = cols.find(col => col.feature === props.win.data.xAxis);
            newData[0].lat = xAxis ? xAxis.data : props.win.data.features[0];

            newData[0].lon = cols.find(col => col.feature === props.win.data.yAxis).data;
            if (props.win.data.zAxis)
                newData[0].z = cols.find(col => col.feature === props.win.data.zAxis).data;
            setChartState(state => ({ ...state, data: newData }));
            setRenderKey(renderKey + 1);
        },
        [props.win.data]
    );

    return (
        <GraphWrapper chart={chart} chartId={chartId} win={props.win}>
            <Plot
                key={renderKey}
                ref={chart}
                data={chartState.data}
                layout={chartState.layout}
                config={chartState.config}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                onInitialized={figure => setChartState(figure)}
                onUpdate={figure => setChartState(figure)}
                onClick={e => {
                    if (e.event.button === 2) return;
                    props.setCurrentSelection([]);
                }}
                onSelected={e => {
                    if (e) props.setCurrentSelection(e.points.map(point => point.pointIndex));
                }}
                divId={chartId}
            />
        </GraphWrapper>
    );
}

export default MapGraph;
