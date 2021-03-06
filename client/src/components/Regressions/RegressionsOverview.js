// This component creates a window that allows users to configure a new regression run.

import React, { useEffect, useState, useReducer } from "react";
import * as regressionTypes from "constants/classificationRegressionTypes";
import * as regressionFunctions from "components/Regressions/regressionFunctions";
import * as regressionActions from "actions/classificationRegressionActions";
import Button from "@material-ui/core/Button";
import { bindActionCreators } from "redux";
import * as classifierRegressionUtils from "utils/classifierRegressionUtils";
import "components/Regressions/regressions.scss";
import { connect } from "react-redux";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import classnames from "classnames";
import HelpContent from "components/Help/HelpContent";
import HelpOutline from "@material-ui/icons/HelpOutline";
import Close from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import { useWindowManager } from "hooks/WindowHooks";

function RegressionHeaderBar(props) {
    return (
        <div className="headerBar">
            <FormControl className="labelDropdown">
                <InputLabel>Labels</InputLabel>
                <Select value={props.label} onChange={e => props.setLabel(e.target.value)}>
                    {props.selectedFeatures.map(f => (
                        <MenuItem key={f} value={f}>
                            {f}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <div>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={_ => props.createAlgoOutput(...props.regressionOutputParams)}
                >
                    Run
                </Button>
                <IconButton onClick={_ => props.setHelpModeState(state => !state)}>
                    <HelpOutline />
                </IconButton>
            </div>
        </div>
    );
}

function HelpBarHeader(props) {
    return (
        <div className="headerBar">
            <h2>{props.title}</h2>
            <IconButton
                className="closeButton"
                onClick={_ => props.setHelpModeState(state => !state)}
            >
                <Close />
            </IconButton>
        </div>
    );
}

function RegressionsOverview(props) {
    const win = useWindowManager(props, {
        width: 850,
        height: 600,
        minSize: {
            width: 750,
            height: 500
        },
        resizeable: true,
        title: "Regression"
    });

    // Create and store regression states
    const [regressionStates, regressionStateDispatch] = useReducer(
        classifierRegressionUtils.stateReducer,
        classifierRegressionUtils.getInitialParamState(regressionTypes.REGRESSION_PARAMS)
    );

    const selectedFeatures = props.featureList
        .filter(f => f.get("selected"))
        .map(f => f.get("name"))
        .toJS();

    // Create and store global options for this regression run
    const [crossVal, setCrossVal] = useState(3);

    const searchTypeOptions = ["grid", "random"];
    const [searchType, setSearchType] = useState(searchTypeOptions[0]);

    //todo refactor these out
    const scoringOptions = [
        "explained_variance",
        "max_error",
        "neg_mean_absolute_error",
        "neg_mean_squared_error",
        "neg_mean_squared_log_error",
        "neg_median_absolute_error",
        "r2"
    ];
    const [scoring, setScoring] = useState(scoringOptions[0]);

    const [label, setLabel] = useState(selectedFeatures[0]);
    const [activeRegressionName, setActiveRegressionName] = useState(regressionStates[0].name);

    // When the window loads, we request time estimates from the server for each regression -- this effect
    // handles those Promise returns and updates the regression states as necessary. It also includes
    // a cleanup function that will cancel all requests if the user closes the window.
    useEffect(_ => {
        const requests = Object.keys(regressionTypes.REGRESSION_PARAMS).map(regression => {
            const { req, cancel } = regressionFunctions.getEta(regression, selectedFeatures, 100);
            req.then(data =>
                regressionStateDispatch({
                    type: "updateEta",
                    name: regression,
                    eta: data.eta && Math.ceil(data.eta)
                })
            );
            return cancel;
        });

        return function cleanup() {
            requests.forEach(cancel => cancel());
        };
    }, []);

    const [helpModeState, setHelpModeState] = useState(false);
    const algoVerb = "regression";

    const regressionOutput = [
        regressionTypes.REGRESSION_ALGO,
        regressionStates,
        selectedFeatures,
        crossVal,
        label,
        searchType,
        scoring,
        props.winId,
        regressionTypes.REGRESSION_RESULTS_WINDOW
    ];

    // Render the HTML for the page.
    // When the user clicks "run", we fire an action that closes this window, creates server requests for data for each selected
    // regression, and then hands them off to a new window defined in RegressionResults.js
    const regressionsSelected = regressionStates.filter(c => c.selected).length;
    const waitTime = regressionStates.reduce((acc, c) => acc + c.eta, 0);
    const waitTimeString = regressionStates.every(c => c.etaLoaded)
        ? waitTime
            ? `${Math.ceil(waitTime / 60)} minutes approximate run time`
            : "Run time not available"
        : "Calculating approximate run time...";

    return (
        <div className="regressionsContainer">
            {!helpModeState ? (
                <RegressionHeaderBar
                    selectedFeatures={selectedFeatures}
                    regressionOutputParams={regressionOutput}
                    createAlgoOutput={props.createAlgoOutput}
                    setHelpModeState={setHelpModeState}
                    label={label}
                    setLabel={setLabel}
                />
            ) : (
                <HelpBarHeader setHelpModeState={setHelpModeState} title={"Regression Page Help"} />
            )}
            <hr />
            <HelpContent
                hidden={!helpModeState}
                guidancePath={`${algoVerb}_page:general_${algoVerb}`}
            />
            <div className="body" hidden={helpModeState}>
                <div className="leftCol">
                    <Typography variant="subtitle1">Select and Configure regression(s)</Typography>
                    <div>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={_ =>
                                regressionStateDispatch({
                                    type: "setAllSelections",
                                    selected: true
                                })
                            }
                        >
                            Select All
                        </Button>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={_ =>
                                regressionStateDispatch({
                                    type: "setAllSelections",
                                    selected: false
                                })
                            }
                        >
                            Select None
                        </Button>
                    </div>
                    <FormGroup classes={{ root: "regressionList" }}>
                        {regressionStates.map(regression =>
                            classifierRegressionUtils.makeAlgoRow(
                                activeRegressionName,
                                setActiveRegressionName,
                                regressionStateDispatch,
                                regression
                            )
                        )}
                    </FormGroup>
                </div>
                <div className="rightCol">
                    <div className="paramHeader">
                        <div className="row">
                            <div className="regressionCounts">
                                <span>{regressionsSelected} regressions selected</span>
                                <span>{waitTimeString}</span>
                            </div>
                            <TextField
                                className="parameterInput"
                                label="Cross Val"
                                margin="normal"
                                variant="filled"
                                type="number"
                                value={crossVal}
                            />
                        </div>
                        <div className="row">
                            <FormControl classes={{ root: "dropdown" }}>
                                <InputLabel>Search Type</InputLabel>
                                <Select
                                    value={searchType}
                                    onChange={e => setSearchType(e.target.value)}
                                >
                                    {searchTypeOptions.map(o => (
                                        <MenuItem key={o} value={o}>
                                            {o.charAt(0).toUpperCase() + o.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl classes={{ root: "dropdown" }}>
                                <InputLabel>Scoring</InputLabel>
                                <Select value={scoring} onChange={e => setScoring(e.target.value)}>
                                    {scoringOptions.map(o => (
                                        <MenuItem key={o} value={o}>
                                            {o.charAt(0).toUpperCase() + o.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                    </div>
                    <hr />
                    <div className="regressionParams">
                        <Typography variant="subtitle1">{activeRegressionName}</Typography>
                        {regressionStates
                            .find(c => c.name === activeRegressionName)
                            .paramData.map(param => (
                                <React.Fragment key={param.name}>
                                    <hr />
                                    <div>{param.name}</div>
                                    {param.subParams.map((subParam, idx) =>
                                        classifierRegressionUtils.makeSubParamInput(
                                            param.name,
                                            subParam,
                                            activeRegressionName,
                                            regressionStateDispatch,
                                            idx === 0,
                                            props.featureList
                                        )
                                    )}
                                </React.Fragment>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {
        featureList: state.data.get("featureList")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        createAlgoOutput: bindActionCreators(regressionActions.createAlgoOutput, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RegressionsOverview);
