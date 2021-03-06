import "components/Graphs/ContourGraph.css";

import Immutable from "immutable";
import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, usePinnedFeatures, useFileInfo } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import GraphWrapper from "components/Graphs/GraphWrapper";
import * as utils from "utils/utils";

import { filterBounds } from "./graphFunctions";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_BUCKET_COUNT = 50;
const DEFAULT_TITLE = "Heat Map Graph";

// Returns a single rgb color interpolation between given rgb color
// based on the factor given; via https://codepen.io/njmcode/pen/axoyD?editors=0010
function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) {
        factor = 0.5;
    }
    let result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
}

// My function to interpolate between two colors completely, returning an array
function interpolateColors(color1, color2, steps, scaling) {
    let stepFactor = 1 / steps,
        interpolatedColorArray = [];

    color1 = color1.match(/\d+/g).map(Number);
    color2 = color2.match(/\d+/g).map(Number);

    let percentage = 0.0;

    if (scaling === "log") {
        percentage = 1.0 / Math.pow(10, steps);
    } else {
        //assumed linear
        percentage = 0.0;
    }

    for (let i = 0; i <= steps; i++) {
        const interpolatedColor = interpolateColor(color1, color2, stepFactor * i);
        interpolatedColorArray.push([
            percentage,
            "rgb(" +
                interpolatedColor[0] +
                "," +
                interpolatedColor[1] +
                "," +
                interpolatedColor[2] +
                ")"
        ]);

        if (scaling === "log") {
            percentage *= 10;
        } else {
            //assumed linear
            percentage += 1.0 / steps;
        }
    }

    return interpolatedColorArray;
}

function dataRange(data) {
    let min = data[0];
    let max = data[0];
    data.forEach(row => {
        min = row < min ? row : min;
        max = row > max ? row : max;
    });

    return [min, max];
}

function squashDataIntoBuckets(data, numBuckets) {
    const maxes = data.map(col => Math.max(...col));
    const mins = data.map(col => Math.min(...col));
    const bucketSizes = data.map((_, idx) => (maxes[idx] - mins[idx]) / numBuckets[idx]);

    return utils.unzip(data).reduce(
        (acc, dataPoint) => {
            const [xIdx, yIdx] = dataPoint.map((val, idx) =>
                val === maxes[idx]
                    ? numBuckets[idx] - 1
                    : Math.floor((val - mins[idx]) / bucketSizes[idx])
            );
            acc[yIdx][xIdx] = acc[yIdx][xIdx] + 1;
            return acc;
        },
        Array(numBuckets[1])
            .fill(0)
            .map(_ => Array(numBuckets[0]).fill(0))
    );
}

function generateRange(low, high, increment) {
    let range = [];
    for (let i = low; i < high; i += increment) {
        range.push(i);
    }

    return range;
}

function generateDataAxis(col) {
    const [min, max] = dataRange(col);
    return generateRange(min, max, (max - min) / DEFAULT_BUCKET_COUNT);
}

function HeatmapGraph(props) {
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    const sanitizedCols = utils.removeSentinelValues(
        props.win.data.features.map(colName =>
            props.data
                .find(col => col.get("feature") === colName)
                .get("data")
                .toJS()
        ),
        props.fileInfo
    );
    const cols = filterBounds(props.win.data.features, sanitizedCols, props.win.data.bounds);

    const xAxis =
        (props.win.data.axisLabels && props.win.data.axisLabels[props.win.data.features[0]]) ||
        props.data
            .find(feature => feature.get("feature") === props.win.data.features[0])
            .get("displayName");

    const yAxis =
        (props.win.data.axisLabels && props.win.data.axisLabels[props.win.data.features[1]]) ||
        props.data
            .find(feature => feature.get("feature") === props.win.data.features[1])
            .get("displayName");

    const featureDisplayNames = props.win.data.features.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );
    useEffect(_ => {
        if (!props.win.title) props.win.setTitle(featureDisplayNames.join(" vs "));
        props.win.setData(data => ({
            ...data.toJS(),
            binSize: props.win.data.binSize || {
                x: DEFAULT_BUCKET_COUNT,
                y: DEFAULT_BUCKET_COUNT
            },
            bounds:
                props.win.data.bounds ||
                props.win.data.features.reduce((acc, colName, idx) => {
                    acc[colName] = { min: Math.min(...cols[idx]), max: Math.max(...cols[idx]) };
                    return acc;
                }, {}),
            axisLabels: props.win.data.axisLabels
        }));
    }, []);

    function getCols() {
        return squashDataIntoBuckets(
            cols,
            props.win.data.binSize
                ? Object.values(props.win.data.binSize)
                : [DEFAULT_BUCKET_COUNT, DEFAULT_BUCKET_COUNT]
        );
    }

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: generateDataAxis(cols[0]),
                y: generateDataAxis(cols[1]),
                z: getCols(),
                type: "heatmap",
                showscale: true,
                colorscale: interpolatedColors
            }
        ],
        layout: {
            dragmode: "lasso",
            xaxis: {
                title: xAxis,
                automargin: true,
                ticklen: 0,
                scaleratio: 1.0
            },
            yaxis: {
                title: yAxis,
                automargin: true,
                ticklen: 0,
                anchor: "x"
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

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    // Effect to keep axes updated if they've been swapped
    useEffect(
        _ => {
            chartState.data[0].x = generateDataAxis(cols[0]);
            chartState.data[0].y = generateDataAxis(cols[1]);
            chartState.data[0].z = getCols();

            chartState.layout.xaxis.title =
                props.win.data.axisLabels && props.win.data.axisLabels[props.win.data.features[0]]
                    ? props.win.data.axisLabels[props.win.data.features[0]]
                    : xAxis;

            chartState.layout.yaxis.title =
                props.win.data.axisLabels && props.win.data.axisLabels[props.win.data.features[1]]
                    ? props.win.data.axisLabels[props.win.data.features[1]]
                    : yAxis;

            updateChartRevision();
        },
        [props.win.data.features]
    );

    return (
        <GraphWrapper chart={chart} chartId={chartId} win={props.win}>
            <Plot
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

export default HeatmapGraph;
