import "components/PropertyEditor/PropertyEditor.scss";

import { InputAdornment } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import EditIcon from "@material-ui/icons/Edit";
import Immutable from "immutable";
import React from "react";
import TextField from "@material-ui/core/TextField";

import { NUM_FEATURES_REQUIRED } from "components/Graphs/GraphWindow";
import {
    useActiveWindow,
    useWindowList,
    useWindowFeatureList,
    useWindowFeatureInfoList,
    useWindowXAxis,
    useWindowTitle
} from "hooks/WindowHooks";
import SwapAxesIcon from "components/Icons/SwapAxes";
import * as scatterGraphTypes from "constants/scatterGraphTypes";
import * as uiTypes from "constants/uiTypes";
import * as windowTypes from "constants/windowTypes";

import { useFeatureDisplayNames } from "../../hooks/DataHooks";
import {
    useSwapAxes,
    useWindowAxisLabels,
    useWindowDotOpacity,
    useWindowDotShape,
    useWindowDotSize,
    useWindowGraphBinSize,
    useWindowGraphBounds,
    useWindowMapType,
    useWindowType,
    useWindowYAxis,
    useWindowZAxis
} from "../../hooks/WindowHooks";

function ScatterOptionsEditor(props) {
    const [dotSize, setDotSize] = useWindowDotSize(props.activeWindowId);
    const [dotOpacity, setDotOpacity] = useWindowDotOpacity(props.activeWindowId);
    const [dotShape, setDotShape] = useWindowDotShape(props.activeWindowId);

    function handleChangeDotSize(e) {
        const val = parseInt(e.target.value);
        if (!val) setDotSize(0);
        if (val > 0 && val <= 10) setDotSize(val);
    }

    function handleChangeDotOpacity(e) {
        const val = parseFloat(e.target.value);
        if (!val) setDotOpacity(0);
        if (val >= 0 && val <= 100) setDotOpacity(val / 100);
    }

    function handleChangeDotShape(e) {
        setDotShape(e.target.value);
    }

    return (
        <React.Fragment>
            <div className="input-field-container">
                <TextField
                    label="Dot size"
                    variant="filled"
                    className="text-input with-helper-text"
                    value={dotSize || ""}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeDotSize}
                    helperText="1-10 pixel dot size"
                    InputProps={{ classes: { root: "input-box" } }}
                    FormHelperTextProps={{ classes: { root: "helper-text" } }}
                />
                <TextField
                    label="Dot opacity (%)"
                    variant="filled"
                    className="text-input with-helper-text"
                    value={dotOpacity ? (dotOpacity * 100) | 0 : ""}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeDotOpacity}
                    helperText="1-100% opacity"
                    InputProps={{ classes: { root: "input-box" } }}
                    FormHelperTextProps={{ classes: { root: "helper-text" } }}
                />
            </div>
            <div className="axis">
                <label>Dot Shape</label>
                <select value={dotShape} onChange={handleChangeDotShape}>
                    {scatterGraphTypes.SYMBOLS.map(f => (
                        <option value={f} key={f}>
                            {f}
                        </option>
                    ))}
                </select>
            </div>
        </React.Fragment>
    );
}

function ChangeGraphType(props) {
    const [windowType, setWindowType] = useWindowType(props.activeWindowId);
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);

    const availableWindowTypes = windowTypes.graphs.filter(type => {
        const featuresRequired = NUM_FEATURES_REQUIRED[type];
        if (!featuresRequired || !features) return true;
        return (
            (typeof featuresRequired === "number" && features.size === featuresRequired) ||
            (features.size >= featuresRequired[0] && features.size <= featuresRequired[1])
        );
    });

    return (
        <div className="axis">
            <label>Graph Type</label>
            <select value={windowType} onChange={e => setWindowType(e.target.value)}>
                {availableWindowTypes.map(f => (
                    <option value={f} key={f}>
                        {f}
                    </option>
                ))}
            </select>
        </div>
    );
}

function WindowRenameInput(props) {
    const [windowTitle, setWindowTitle] = useWindowTitle(props.activeWindowId);
    return (
        <TextField
            className="title-field"
            value={windowTitle}
            onChange={e => setWindowTitle(e.target.value)}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <EditIcon />
                    </InputAdornment>
                )
            }}
        />
    );
}

function XYAxisRename(props) {
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.activeWindowId);
    function handleChangeAxisLabels(axis) {
        return e => setAxisLabels(axisLabels.set(axis, e.target.value));
    }

    return (
        <div className="input-field-container">
            <TextField
                label="X axis label"
                variant="filled"
                className="text-input"
                value={axisLabels ? axisLabels.get("x") : ""}
                type="text"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeAxisLabels("x")}
            />
            <TextField
                label="Y axis label"
                variant="filled"
                className="text-input"
                value={axisLabels ? axisLabels.get("y") : ""}
                type="text"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeAxisLabels("y")}
            />
        </div>
    );
}

function WindowGraphBounds(props) {
    const [graphBounds, setGraphBounds] = useWindowGraphBounds(props.activeWindowId);
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);

    function handleChangeBounds(axis, bound) {
        return e => setGraphBounds(graphBounds.setIn([axis, bound], parseFloat(e.target.value)));
    }

    if (!features) return null;

    return (
        <div className="input-field-container">
            <TextField
                label="X axis min"
                variant="filled"
                className="text-input"
                value={graphBounds ? graphBounds.getIn([features.get(0), "min"]) : ""}
                type="number"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeBounds(features.get(0), "min")}
            />
            <TextField
                label="X axis max"
                variant="filled"
                className="text-input"
                value={graphBounds ? graphBounds.getIn([features.get(0), "max"]) : ""}
                type="number"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeBounds(features.get(0), "max")}
            />
            <TextField
                label="Y axis min"
                variant="filled"
                className="text-input"
                value={graphBounds ? graphBounds.getIn([features.get(1), "min"]) : ""}
                type="number"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeBounds(features.get(1), "min")}
            />
            <TextField
                label="Y axis max"
                variant="filled"
                className="text-input"
                value={graphBounds ? graphBounds.getIn([features.get(1), "max"]) : ""}
                type="number"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeBounds(features.get(1), "max")}
            />
            {features.size < 3 ? null : (
                <React.Fragment>
                    <TextField
                        label="Z axis min"
                        variant="filled"
                        className="text-input"
                        value={graphBounds ? graphBounds.getIn([features.get(2), "min"]) : ""}
                        type="number"
                        InputLabelProps={{ shrink: true }}
                        onChange={handleChangeBounds(features.get(2), "min")}
                    />
                    <TextField
                        label="Z axis max"
                        variant="filled"
                        className="text-input"
                        value={graphBounds ? graphBounds.getIn([features.get(2), "max"]) : ""}
                        type="number"
                        InputLabelProps={{ shrink: true }}
                        onChange={handleChangeBounds(features.get(2), "max")}
                    />
                </React.Fragment>
            )}
        </div>
    );
}

function MultipleWindowGraphBounds(props) {
    const [graphBounds, setGraphBounds] = useWindowGraphBounds(props.activeWindowId);
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [featureNameList] = useFeatureDisplayNames();

    function handleChangeBounds(axis, bound) {
        return e => setGraphBounds(graphBounds.setIn([axis, bound], parseFloat(e.target.value)));
    }

    if (!features) return null;

    return (
        <div className="input-field-container">
            {features.map((feature, idx) => {
                const featureName = featureNameList.get(feature, feature);
                return (
                    <React.Fragment key={feature}>
                        <TextField
                            label={`${featureName} min`}
                            variant="filled"
                            className="text-input"
                            value={graphBounds ? graphBounds.getIn([features.get(idx), "min"]) : ""}
                            type="number"
                            InputLabelProps={{ shrink: true }}
                            onChange={handleChangeBounds(features.get(idx), "min")}
                        />
                        <TextField
                            label={`${featureName} max`}
                            variant="filled"
                            className="text-input"
                            value={graphBounds ? graphBounds.getIn([features.get(idx), "max"]) : ""}
                            type="number"
                            InputLabelProps={{ shrink: true }}
                            onChange={handleChangeBounds(features.get(idx), "max")}
                        />
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function MultiAxisGraphEditor(props) {
    const [featureInfo, setFeatureInfo] = useWindowFeatureInfoList(props.activeWindowId);
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [xAxis, setXAxis] = useWindowXAxis(props.activeWindowId);
    const [featureNameList] = useFeatureDisplayNames();

    if (!features) return null;

    const xAxisSelect =
        features.size > 1 ? (
            <select onChange={e => setXAxis(e.target.value)} value={xAxis}>
                <option value={uiTypes.GRAPH_INDEX}>Index</option>
                {features.map(f => (
                    <option value={f} key={f}>
                        {featureNameList.get(f, f)}
                    </option>
                ))}
            </select>
        ) : (
            <span className="feature-name">{xAxis}</span>
        );

    return (
        <React.Fragment>
            <div className="axis">
                <label>X-Axis</label>
                {xAxisSelect}
            </div>
            <div className="axis">
                <label>Line Plots</label>
                {featureInfo
                    .filter(feature => feature.get("name") !== xAxis)
                    .map(feature => (
                        <div className="line-plot" key={feature.get("name")}>
                            <span>
                                {featureNameList.get(feature.get("name"), feature.get("name"))}
                            </span>
                            <div
                                className="color-swatch"
                                style={{ background: feature.get("color") }}
                            />
                        </div>
                    ))}
            </div>
        </React.Fragment>
    );
}

function HeatmapGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [binSize, setBinSize] = useWindowGraphBinSize(props.activeWindowId);
    const [featureNameList] = useFeatureDisplayNames();
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.activeWindowId);

    function handleChangeAxisLabels(axis) {
        return e => {
            setAxisLabels(
                axisLabels
                    ? axisLabels.set(axis, e.target.value)
                    : Immutable.fromJS({ [axis]: e.target.value })
            );
        };
    }

    function handleChangeBinSize(axis) {
        return e => {
            setBinSize(binSize.set(axis, parseInt(e.target.value)));
        };
    }

    if (!features) return null;

    return (
        <React.Fragment>
            <div className="axis">
                <label>X-Axis</label>
                <TextField
                    className="title-field axis-label"
                    value={
                        (axisLabels && axisLabels.get(features.get(0))) ||
                        featureNameList.get(features.get(0), features.get(0))
                    }
                    onChange={handleChangeAxisLabels(features.get(0))}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <EditIcon />
                            </InputAdornment>
                        )
                    }}
                />
            </div>
            <div className="axis">
                <label>Y-Axis</label>
                <TextField
                    className="title-field axis-label"
                    value={
                        (axisLabels && axisLabels.get(features.get(1))) ||
                        featureNameList.get(features.get(1), features.get(1))
                    }
                    onChange={handleChangeAxisLabels(features.get(1))}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <EditIcon />
                            </InputAdornment>
                        )
                    }}
                />
            </div>
            <Button className="swap-button" onClick={_ => setFeatures(features.reverse())}>
                Swap Axes <SwapAxesIcon width="14" height="14" />
            </Button>
            <div className="input-field-container">
                <TextField
                    label="Grid-width"
                    variant="filled"
                    className="text-input"
                    value={binSize ? binSize.get("x") : ""}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("x")}
                />
                <TextField
                    label="Grid-height"
                    variant="filled"
                    className="text-input"
                    value={binSize ? binSize.get("y") : ""}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("y")}
                />
            </div>
        </React.Fragment>
    );
}

function TwoAxisGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [featureNameList] = useFeatureDisplayNames();
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.activeWindowId);

    function handleChangeAxisLabels(axis) {
        return e => {
            setAxisLabels(
                axisLabels
                    ? axisLabels.set(axis, e.target.value)
                    : Immutable.fromJS({ [axis]: e.target.value })
            );
        };
    }

    if (!features) return null;

    return (
        <React.Fragment>
            <div className="axis">
                <label>X-Axis</label>
                <TextField
                    className="title-field axis-label"
                    value={
                        (axisLabels && axisLabels.get(features.get(0))) ||
                        featureNameList.get(features.get(0), features.get(0))
                    }
                    onChange={handleChangeAxisLabels(features.get(0))}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <EditIcon />
                            </InputAdornment>
                        )
                    }}
                />
            </div>
            <div className="axis">
                <label>Y-Axis</label>
                <TextField
                    className="title-field axis-label"
                    value={
                        (axisLabels && axisLabels.get(features.get(1))) ||
                        featureNameList.get(features.get(1), features.get(1))
                    }
                    onChange={handleChangeAxisLabels(features.get(1))}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <EditIcon />
                            </InputAdornment>
                        )
                    }}
                />
            </div>
            <Button className="swap-button" onClick={_ => setFeatures(features.reverse())}>
                Swap Axes <SwapAxesIcon width="14" height="14" />
            </Button>
        </React.Fragment>
    );
}

function ThreeAxisGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [xAxis, setXAxis] = useWindowXAxis(props.activeWindowId);
    const [yAxis, setYAxis] = useWindowYAxis(props.activeWindowId);
    const [zAxis, setZAxis] = useWindowZAxis(props.activeWindowId);
    const [binSize, setBinSize] = useWindowGraphBinSize(props.activeWindowId);
    const [featureNameList] = useFeatureDisplayNames();

    if (!features) return null;

    function handleChangeBinSize(axis) {
        return e => {
            setBinSize(binSize.set(axis, parseInt(e.target.value)));
        };
    }

    return (
        <React.Fragment>
            <div className="axis">
                <label>X-Axis</label>
                <select onChange={e => setXAxis(e.target.value)} value={xAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {featureNameList.get(f, f)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="axis">
                <label>Y-Axis</label>
                <select onChange={e => setYAxis(e.target.value)} value={yAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {featureNameList.get(f, f)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="axis">
                <label>Z-Axis</label>
                <select onChange={e => setZAxis(e.target.value)} value={zAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {featureNameList.get(f, f)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="input-field-container">
                <TextField
                    label="Grid-width"
                    variant="filled"
                    className="text-input"
                    value={binSize && binSize.get("x")}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("x")}
                />
                <TextField
                    label="Grid-height"
                    variant="filled"
                    className="text-input"
                    value={binSize && binSize.get("y")}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("y")}
                />
            </div>
        </React.Fragment>
    );
}

function HistogramGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [binSize, setBinSize] = useWindowGraphBinSize(props.activeWindowId);

    if (!features) return null;

    function handleChangeBinSize(axis) {
        return e => {
            setBinSize(Immutable.fromJS({ x: parseInt(e.target.value) }));
        };
    }

    return (
        <React.Fragment>
            <div className="input-field-container">
                <TextField
                    label="Number of bins"
                    variant="filled"
                    className="text-input"
                    value={binSize && binSize.get("x")}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("x")}
                />
            </div>
        </React.Fragment>
    );
}

function MapGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [mapType, setMapType] = useWindowMapType(props.activeWindowId);
    const [xAxis, setXAxis] = useWindowXAxis(props.activeWindowId);
    const [yAxis, setYAxis] = useWindowYAxis(props.activeWindowId);
    const [zAxis, setZAxis] = useWindowZAxis(props.activeWindowId);
    const swapAxes = useSwapAxes(props.activeWindowId);
    const [graphBounds, setGraphBounds] = useWindowGraphBounds(props.activeWindowId);
    const [featureNameList] = useFeatureDisplayNames();

    function handleChangeBounds(axis, bound) {
        return e => setGraphBounds(graphBounds.setIn([axis, bound], parseFloat(e.target.value)));
    }

    if (!features) return null;

    const axisFields = (
        <div className="input-field-container">
            <TextField
                label="Latitude min"
                variant="filled"
                className="text-input"
                value={graphBounds && graphBounds.getIn([features.get(0), "min"])}
                type="number"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeBounds(features.get(0), "min")}
            />
            <TextField
                label="Latitude max"
                variant="filled"
                className="text-input"
                value={graphBounds && graphBounds.getIn([features.get(0), "max"])}
                type="number"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeBounds(features.get(0), "max")}
            />
            <TextField
                label="Longitude min"
                variant="filled"
                className="text-input"
                value={graphBounds && graphBounds.getIn([features.get(1), "min"])}
                type="number"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeBounds(features.get(1), "min")}
            />
            <TextField
                label="Longitude max"
                variant="filled"
                className="text-input"
                value={graphBounds && graphBounds.getIn([features.get(1), "max"])}
                type="number"
                InputLabelProps={{ shrink: true }}
                onChange={handleChangeBounds(features.get(1), "max")}
            />
            {features.size === 2 ? null : (
                <React.Fragment>
                    <TextField
                        label="Heat min"
                        variant="filled"
                        className="text-input"
                        value={graphBounds && graphBounds.getIn([features.get(2), "min"])}
                        type="number"
                        InputLabelProps={{ shrink: true }}
                        onChange={handleChangeBounds(features.get(2), "min")}
                    />
                    <TextField
                        label="Heat max"
                        variant="filled"
                        className="text-input"
                        value={graphBounds && graphBounds.getIn([features.get(2), "max"])}
                        type="number"
                        InputLabelProps={{ shrink: true }}
                        onChange={handleChangeBounds(features.get(2), "max")}
                    />
                </React.Fragment>
            )}
        </div>
    );

    if (features.size === 2)
        return (
            <React.Fragment>
                <div className="axis">
                    <label>Latitude</label>
                    <span className="feature-name">{featureNameList.get(xAxis, xAxis)}</span>
                </div>
                <div className="axis">
                    <label>Longitude</label>
                    <span className="feature-name">{featureNameList.get(yAxis, yAxis)}</span>
                </div>
                <div className="axis">
                    <label>Map Type</label>
                    <select onChange={e => setMapType(e.target.value)} value={mapType}>
                        {uiTypes.MAP_TYPES.map(f => (
                            <option value={f} key={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </div>
                <Button className="swap-button" onClick={swapAxes}>
                    Swap Axes <SwapAxesIcon width="14" height="14" />
                </Button>
                {axisFields}
            </React.Fragment>
        );

    return (
        <React.Fragment>
            <div className="header">Graph Details</div>
            <div className="axis">
                <label>Latitude</label>
                <select onChange={e => setXAxis(e.target.value)} value={xAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {featureNameList.get(f, f)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="axis">
                <label>Longitude</label>
                <select onChange={e => setYAxis(e.target.value)} value={yAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {featureNameList.get(f, f)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="axis">
                <label>Heat</label>
                <select onChange={e => setZAxis(e.target.value)} value={zAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {featureNameList.get(f, f)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="axis">
                <label>Map Type</label>
                <select onChange={e => setMapType(e.target.value)} value={mapType}>
                    {uiTypes.MAP_TYPES.map(f => (
                        <option value={f} key={f}>
                            {f}
                        </option>
                    ))}
                </select>
            </div>
            {axisFields}
        </React.Fragment>
    );
}

function PropertyEditor(props) {
    const [activeWindowId] = useActiveWindow();
    const windowList = useWindowList();

    const activeWindow = windowList.find(win => win.get("id") === activeWindowId);

    if (!activeWindow) return null;

    const panelContent = (function() {
        switch (activeWindow.get("windowType")) {
            case windowTypes.SCATTER_GRAPH:
                return (
                    <React.Fragment>
                        <TwoAxisGraphEditor activeWindowId={activeWindowId} />
                        <WindowGraphBounds activeWindowId={activeWindowId} />
                        <ScatterOptionsEditor activeWindowId={activeWindowId} />
                    </React.Fragment>
                );
            case windowTypes.CONTOUR_GRAPH:
                return (
                    <React.Fragment>
                        <TwoAxisGraphEditor activeWindowId={activeWindowId} />
                        <WindowGraphBounds activeWindowId={activeWindowId} />
                    </React.Fragment>
                );
            case windowTypes.HEATMAP_GRAPH:
                return (
                    <React.Fragment>
                        <HeatmapGraphEditor activeWindowId={activeWindowId} />
                        <WindowGraphBounds activeWindowId={activeWindowId} />
                    </React.Fragment>
                );
            case windowTypes.HEATMAP_3D_GRAPH:
                return (
                    <React.Fragment>
                        <ThreeAxisGraphEditor activeWindowId={activeWindowId} />
                        <WindowGraphBounds activeWindowId={activeWindowId} />
                    </React.Fragment>
                );
            case windowTypes.SINGLE_X_MULTIPLE_Y:
                return (
                    <React.Fragment>
                        <MultiAxisGraphEditor activeWindowId={activeWindowId} />
                        <MultipleWindowGraphBounds activeWindowId={activeWindowId} />
                    </React.Fragment>
                );
            case windowTypes.MAP_GRAPH:
                return <MapGraphEditor activeWindowId={activeWindowId} />;
            case windowTypes.HISTOGRAM_GRAPH:
                return (
                    <React.Fragment>
                        <HistogramGraphEditor activeWindowId={activeWindowId} />
                        <MultipleWindowGraphBounds activeWindowId={activeWindowId} />
                    </React.Fragment>
                );
            case windowTypes.VIOLIN_PLOT_GRAPH:
            case windowTypes.TIME_SERIES_GRAPH:
            case windowTypes.BOX_PLOT_GRAPH:
                return <MultipleWindowGraphBounds activeWindowId={activeWindowId} />;
            default:
                return null;
        }
    })();

    const graphSelection = windowTypes.graphs.includes(activeWindow.get("windowType")) ? (
        <ChangeGraphType activeWindowId={activeWindowId} />
    ) : null;

    return (
        <div className="propertyEditorContainer">
            <div className="header">Graph Details</div>
            <WindowRenameInput activeWindowId={activeWindowId} />
            {graphSelection}
            {panelContent}
        </div>
    );
}

export default PropertyEditor;
