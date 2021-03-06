'''
Author: Jack Lightholder
Date  : 7/15/18

Brief : CODEX plotting functionality

Notes :

'''
import sys
import h5py
import time
import os
import logging

import numpy as np

from random import randint
from scipy  import misc

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.image  as mpimg

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

def getColorMap():
    '''
    Inputs:
        NONE

    Outputs:
        NONE

    '''
    colors = np.array([x for x in 'bgrcmykbgrcmykbgrcmykbgrcmyk'])
    colors = np.hstack([colors] * 20)

    return colors


def plot_regression(regr, X_test, Y_test):
    '''
    Inputs:
        regr     - sklearn linear regression model
        X_test   - feature test data
        Y_test   - target test data

    Outputs:
        NONE

    '''
    plt.scatter(X_test, Y_test, color='black')
    plt.xlabel("Features")
    plt.ylabel("Targets")
    plt.title("Linear Regression")
    plt.plot(X_test, regr.predict(X_test), color='blue', linewidth=3)
    plt.show()


def plot_clustering(X, y_pred, centers, pltTitle, save=False, show=False):
    '''
    Inputs:
        X (2d array)       - data to plot
        y_pred (1d array)  - cluster group label for each data point in X
        pltTitle (string)  - title for the produced plot.

    Outputs:
        NONE

    '''
    colors = getColorMap()
    plt.scatter(X[:, 0], X[:, 1], color=colors[y_pred].tolist(), s=10)
    plt.title(pltTitle)

    if(centers is not None):
        center_colors = colors[:len(centers)]
        plt.scatter(centers[:, 0], centers[:, 1], s=100, c=center_colors)

    if show:
        plt.show()
    if save:
        savePath = CODEX_ROOT + "/debug/"
        if not os.path.exists(savePath):
            os.makedirs(savePath)
        plt.savefig(savePath + pltTitle.replace(" ", "_") + ".png")

    plt.close()
    plt.clf()


def plot_dimensionality(explained_variance, pltTitle, save=False, show=False):
    '''
    Inputs:

    Outputs:

    '''
    plt.figure(1)
    plt.clf()
    plt.plot(explained_variance, linewidth=2)
    plt.axis('tight')
    plt.xlabel('Number of Components')
    plt.ylabel('Explained Variance Ratio')
    plt.title(pltTitle)

    if show:
        plt.show()

    if save:
        savePath = CODEX_ROOT + "/debug/"
        if not os.path.exists(savePath):
            os.makedirs(savePath)
        plt.savefig(savePath + pltTitle.replace(" ", "_") + ".png")

    plt.close()


def plot_peak(data, indexes):
    '''
    Inputs:
        data (array) - data to be plotted (1d)
        indexes		 - index locations where peak indicators should be placed

    Outputs:
        NONE

    '''
    num_samples = len(data)
    X = np.arange(num_samples)
    plt.plot(X, data, '-D', markevery=indexes)
    plt.show()


