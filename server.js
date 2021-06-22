
const express = require('express');
const multer = require('multer');
const app = express();
var rref = require('rref');
const { simplify, parse } = require('mathjs')

const STATUS_OK = 200;
const CLIENT_ERROR_CODE = 400;
const SERVER_ERROR_CODE = 500;
const CLIENT_ERROR_MESSAGE = "Missing one or more of the required params.";
const SERVER_ERROR_MESSAGE = "An error occurred on the server. Try again later.";
const MIN_POINTS = 3;


app.use(multer().none());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get('/', async (req, res) => {
    res.redirect('/index.html');
});

app.get('/cubic', async (req, res) => {
    let points = Object.values(req.query);
    if(!points) {
        res.status(CLIENT_ERROR_CODE).send(CLIENT_ERROR_MESSAGE);
    } else if(points.length < (MIN_POINTS*2)) {
        res.type("text");
        res.status(CLIENT_ERROR_CODE).send("Invalid number of points. Must provide 3 or more points.");
    } else {
        xPoints = [];
        yPoints = [];
        unfilteredXPoints = [];
        unfilteredYPoints = [];
        for(let i = 0; i < points.length; i++) {
            let num = eval(points[i]);
            let uNum = points[i];
            if(i % 2 === 0) {
                xPoints.push(num);
                unfilteredXPoints.push(uNum);
            } else {
                yPoints.push(num);
                unfilteredYPoints.push(uNum);
            }
        }
        if(containsDuplicate(xPoints)) {
            res.type("text");
            res.status(CLIENT_ERROR_CODE).send("Invalid coordinates, x-coordinates cannot be repeated. Leads to infinite slope.");
        }
        let result = calculateCubic(xPoints, yPoints);
        res.json(result);
    }
});


/////////////////////////////////////////////////////////////


function calculateCubic(xPoints, yPoints) {
    // sorting points by x-coordinates 

    let points = [];
    for(let i = 0; i < xPoints.length; i++) {
        points.push({
            x: xPoints[i],
            y: yPoints[i]
        });
    }
    points.sort(function(a, b) {
        return ((a.x < b.x) ? -1 : ((a.x == b.x) ? 0 : 1));
    });
    for (var i = 0; i < points.length; i++) {
        xPoints[i] = points[i].x;
        yPoints[i] = points[i].y;
    }

    let hVals = [];
    for(let i = 0; i < xPoints.length-1; i++) {
        hVals.push(xPoints[i+1] - xPoints[i]);
    }
    
    let rows = []; // a coefficients 
    let matrix = [];
    for(let i = 0; i < xPoints.length-2; i++) {
        let row = [];
        for(let x = 0; x < i; x++) {
            row.push(0);
        }
        let a0 = hVals[i] / 6;  
        let a1 = (hVals[i] + hVals[i+1]) / 3;
        let a2 = hVals[i+1] / 6;
        let y = ((yPoints[i+2] - yPoints[i+1]) / hVals[i+1]) - ((yPoints[i+1] - yPoints[i]) / hVals[i]);
        //console.log(a0);
        //console.log(a1);
        //console.log(a2);
        //console.log(y);
        if(i == 0) {
            row.push(0);
        } else {
            row.push(a0);
        }
        row.push(a1);
        if(i == xPoints.length-3) {
            row.push((0));
        } else {
            row.push(a2);
        }
        for(let j = 0; j < (xPoints.length-3)-i; j++) {
            row.push(0);
        }
        row.push(y);
        rows.push(row);  
    }
    matrix = JSON.parse(JSON.stringify(rows));
    let rrefResult = rref(rows);
    let aVals = [];
    aVals.push(0);
    for(const row of rrefResult) { 
        aVals.push(row[row.length-1]);
    }
    aVals.push(0);
    console.log(aVals);
    let bVals = getBVals(aVals, hVals, yPoints);
    let cVals = getCVals(aVals, hVals, yPoints);
    console.log(bVals);
    console.log(cVals);
    let equations = getEQs(aVals, bVals, cVals, hVals, xPoints);
    let simplifiedEQ = [];
    for(const eq of equations) {
        simplifiedEQ.push(simplify(parse(eq)).toString());
    }
    let domain = getDomain(xPoints);
    let result = {
        "equations": equations,
        "simplified-equations": simplifiedEQ,
        "domains": domain,
        "matrix-before": matrix,
        "matrix-after": rrefResult,
        "x": xPoints,
        "y": yPoints,
        "a": aVals,
        "b": bVals,
        "c": cVals,
        "h": hVals
    };
    return result;

}

function getBVals(aVals, hVals, yPoints,) {
    let bVals = [];
    for(let i = 0; i < hVals.length; i++) {
        bVals.push((yPoints[i] / hVals[i]) - ((aVals[i] * hVals[i]) / 6));
    }
    return bVals;
}

function getCVals(aVals, hVals, yPoints,) {
    let cVals = [];
    for(let i = 0; i < hVals.length; i++) {
        cVals.push((yPoints[i+1] / hVals[i]) - ((aVals[i+1] * hVals[i]) / 6));
    }
    return cVals;
}

function getEQs(aVals, bVals, cVals, hVals, xPoints) {
    let equations = [];
    for(let i = 0; i < xPoints.length-1; i++) {
        let eq = "" 
        + aVals[i] + "*(((" + xPoints[i+1] + "-x)^3) / (6*" + hVals[i] + "))+" 
        + aVals[i+1] + "*(((x-" + xPoints[i] + ")^3) / (6*" + hVals[i] + "))+"
        + bVals[i] + "*(" + xPoints[i+1] + "-x)+" 
        + cVals[i] + "*(x-" + xPoints[i] + ")";
        equations.push(eq);
        console.log(eq);
        //simplify(parse(eq)).toString()
    }
    return equations;
}

function getDomain(xPoints) {
    let domain = [];
    for(let i = 0; i < xPoints.length-1; i++) {
        let result = {
            min: xPoints[i],
            max: xPoints[i+1]
        };
        domain.push(result); 
    }
    return domain;
}

function containsDuplicate(arr){
    return new Set(arr).size !== arr.length 
}

app.use(express.static("public"));
const PORT = process.env.PORT || 8080;
app.listen(PORT);