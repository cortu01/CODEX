import * as actionTypes from "constants/actionTypes";
import { getSubAlgorithmData } from "components/Algorithms/algorithmFunctions";
import * as algorithmTypes from "constants/algorithmTypes";
import * as graphActions from "actions/graphActions";
import * as uiTypes from "constants/uiTypes";
import * as utils from "utils/utils";
import { usePinnedFeatures, useNewFeature } from "hooks/DataHooks";

export function createAlgorithm(algoMode) {
    return (dispatch, getState) => {
        dispatch({
            type: actionTypes.OPEN_NEW_WINDOW,
            info: {
                windowType: algoMode,
                selectedFeatures: getState()
                    .data.get("featureList")
                    .filter(f => f.get("selected"))
                    .map(f => f.get("name")),
                filename: getState().data.get("filename")
            }
        });
    };
}

function findOutputParam(subalgoState, paramName) {
    return subalgoState.outputParams.find(param => param.name === paramName).value;
}

// Saves the returned algorithm data to the state and spawns a new graph window if requested.
function handleAlgorithmReturn(inMsg, subalgoState, dispatch) {
    // Update data store with new feature columns
    const basename = findOutputParam(subalgoState, "name");

    const newFeature = useNewFeature(dispatch);
    for (let i = 0; i < inMsg.data[0].length; i++) {
        const featureName = `${basename}_PCA${i + 1}`;
        const data = inMsg.data.map(row => row[i]);
        newFeature(featureName, data);
    }

    // Create a new selection for each cluster if requested
    if (findOutputParam(subalgoState, "clusters")) {
        //get unique name
        const uniqueName = utils.getUniqueGroupID("Clustering");
        //create a group with a unique name
        dispatch({
            type: actionTypes.CREATE_SELECTION_GROUP,
            id: uniqueName
        });

        for (let i = 0; i <= inMsg.numClusters - 1; i++) {
            const rowIndices = inMsg.clusters.reduce((acc, val, idx) => {
                if (val === i) acc.push(idx);
                return acc;
            }, []);
            //create new selection with unique name as id
            dispatch({
                type: actionTypes.SAVE_NEW_SELECTION,
                name: `${basename}_${i + 1}`,
                rowIndices: rowIndices,
                groupID: uniqueName
            });
        }
    }

    // Add a feature per cluster if requested
    if (findOutputParam(subalgoState, "clusterId")) {
        const features = inMsg.clusters.reduce(
            (acc, val, idx) => {
                acc[val][idx] = 1;
                return acc;
            },
            Array(inMsg.numClusters)
                .fill(0)
                .map(_ => Array(inMsg.data.length).fill(0))
        );

        features.forEach((f, idx) => {
            const featureName = `${basename}_${idx}`;
            newFeature(featureName, f);
        });
    }

    // Spawn graph window if requested
    if (findOutputParam(subalgoState, "graph")) {
        const features = ["xAxis", "yAxis"].map(axis => {
            const axisName = findOutputParam(subalgoState, axis);
            if (axisName.match(/pca\d/i)) {
                return `${findOutputParam(subalgoState, "name")}_${axisName}`;
            }
            return axisName;
        });
        dispatch({
            type: actionTypes.OPEN_NEW_WINDOW,
            info: { windowType: uiTypes.SCATTER_GRAPH, data: { features } }
        });
    }
}

export function runAlgorithm(subalgoState, selectedFeatures, winId) {
    return (dispatch, getState) => {
        dispatch({ type: actionTypes.CLOSE_WINDOW, id: winId });

        // Give our new loading "window" an ID
        const loadingWindowId = Math.random()
            .toString(36)
            .substring(7);

        dispatch({
            type: actionTypes.OPEN_NEW_WINDOW,
            info: {
                windowType: algorithmTypes.ALGO_LOADING_WINDOW,
                minimized: true,
                minimizedOnly: true,
                id: loadingWindowId
            }
        });

        // Right now, the only metric we have of algorithm processing time is the ETA we got from
        // the preview run, so we set a timer. The "window" object contains the latest ETA for the algo run.
        const expectedEndTime = Date.now() + subalgoState.serverData.eta * 1000;
        const loadingTimerInterval = setInterval(_ => {
            const secRemaining = (expectedEndTime - Date.now()) / 1000;
            if (secRemaining > 0) {
                dispatch({
                    type: actionTypes.UPDATE_WINDOW_INFO,
                    id: loadingWindowId,
                    info: { loadingSecRemaining: secRemaining || 0 }
                });
                return;
            }
            clearInterval(loadingTimerInterval);
        }, 1000);

        getSubAlgorithmData(
            subalgoState,
            selectedFeatures,
            getState().data.get("filename"),
            false,
            getState().selections.savedSelections,
            inMsg => {
                clearInterval(loadingTimerInterval);
                dispatch({ type: actionTypes.CLOSE_WINDOW, id: loadingWindowId });
                handleAlgorithmReturn(inMsg, subalgoState, dispatch);
            }
        );
    };
}
