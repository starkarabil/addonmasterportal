import * as d3 from "d3-array";

/* eslint-disable */
const evaluate = {
    /** Compute Pearson's correlation coefficient */
    computePearsons: function (arrX, arrY) {
        const num = this.covar(arrX, arrY),
          denom = d3.deviation(arrX) * d3.deviation(arrY);
        return num / denom;
    },

    /** Kendall's tau-a (does not handle tie breaking) */
    computeKendalls: function (arrX, arrY) {
        const n = arrX.length;

        return con_dis_diff(arrX,arrY)/(n*(n-1)/2);
    },

    /** Computes the covariance between random variable observations
     * arrX and arrY
     */
    covar: function (arrX, arrY) {
        const u = d3.mean(arrX),
            v = d3.mean(arrY),
            arrXLen = arrX.length,
            sq_dev = new Array(arrXLen);
        for (let i = 0; i < arrXLen; i++)
            sq_dev[i] = (arrX[i] - u) * (arrY[i] - v);
        return d3.sum(sq_dev) / (arrXLen - 1);
    },

    /** Computes the difference between concordant and discordant observation pairs in X and Y
     * Does not elegantly handle ties
     */
    con_dis_diff: function (arrX,arrY) {
        const n = arrX.length;
        let nc = 0,
            nd = 0;

        for (let i=0;i<n;i++){
            for (let j=i+1;j<n;j++){
                if (i === j) continue;
                (arrX[i]-arrX[j]>0) === (arrY[i]-arrY[j]>0) ? nc++ : nd++; 
            }
        }
        return nc-nd;
    },

    /**
     * Computes the standard deviation from the regression line for each value and in total
     */
    standardError: function (data, xAttr, yAttr) {
        data.forEach(d => {
            d.Abweichung = Math.pow(d[yAttr] - d.yEst, 2);
        });
    }
}

export default evaluate;
