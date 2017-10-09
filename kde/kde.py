import csv
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm
from sklearn.neighbors import KernelDensity


N = 100
np.random.seed(1)
X = np.concatenate((np.random.normal(0, 1, int(0.3 * N)),
                    np.random.normal(5, 1, int(0.7 * N))))[:, np.newaxis]

with open('calc.txt') as csvfile:
    readCSV = csv.reader(csvfile, delimiter=',')
    temp = []
    for row in readCSV:
        temp.append(int(row[1]))

    X = temp



