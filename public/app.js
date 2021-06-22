'use strict';

window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    },
    svg: {
      fontCache: 'global'
    }
};
(function () {
    
    window.addEventListener("load", init);
    math.config({
        number: 'Fraction'
    });
    const STARTING_INPUTS = 3;


    function init() {
        let script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
        script.async = true;
        document.head.appendChild(script);
        
        addPointListener();
        setInputs();
        let calculator = handleDesmos();
        calculateListener(calculator);
        randListener();
        rangeSliderListener();
        showWorkListener();
    }

    function setInputs() {
        for(let i = 1; i < STARTING_INPUTS; i++) {
            addPoint(i+1);
            delCoordListener(i+1);
        }
        
    }

    async function handleMathJax() {
        return await new Promise( (resolve, reject) => {
            window.MathJax = {
                startup: {
                ready: () => {
                    console.log("22222");
                    MathJax.startup.defaultReady();
                    MathJax.startup.promise.then(() => {
                        console.log("MathJax ready");
                        resolve();
                    });
                }
                }
            };
        });
    }

    function rangeSliderListener() {
        let slider = id("slider");
        
        slider.addEventListener("change", function() {
            console.log("slider changed")
        });
    }

    function updateOutput(eq) {
        console.log(eq);
    }

    function calculateListener(calculator) {
        let form = id("input-fields")
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            id("error-message").classList.add("hidden");
            let points = getPoints();
            if(points != "") {
                let url = "/cubic?" + points;
                fetch(url)
                .then(statusCheck)
                .then(response => response.json())
                .then(response => {setGraph(response, calculator, getDecimals());})
                .catch(handleError);
            }
            return false;
        });
    }

    function getDecimals() {
        return id("slider").value;
    }

    function getPoints() {
        let numPoints = getNumCoords();
        let points = "";
        if(numPoints == 1 && (id("x1-input" ).value.trim() == "" || id("y1-input" ).value.trim() == "")) {
            return  "";
        }
        for(let i = 1; i <= numPoints; i++) {
            let xPoint = id("x" + i + "-input" ).value;
            let yPoint = id("y" + i + "-input" ).value;
            points += "x" + i + "=" + xPoint;
            points += "&y" + i + "=" + yPoint;
            if(i != numPoints) {
                points += "&";
            }
        }      
        return points;
    }

    function addPointListener() {
        let addBtn = id('addCoord');
        let formWrap = id("form-wrapper");
        addBtn.addEventListener("click", function() {
            let num = getNumCoords();
            addPoint(num+1);
            delCoordListener(num+1);
            formWrap.scrollTop = formWrap.scrollHeight - (formWrap.clientHeight * 0.1);
        });
    }

    function addPoint(num) {
        let coordForm = id('input-fields');
        let coordSect = gen('section');
        let xSect = gen('section');
        let ySect = gen('section');
        let xLabel = gen('label');
        let yLabel = gen('label');
        let xInput = gen('input');
        let yInput = gen('input');
        let xImg = gen('img');
        coordSect.appendChild(xSect);
        coordSect.appendChild(ySect);
        xSect.appendChild(xLabel);
        xSect.appendChild(xInput);
        ySect.appendChild(yLabel);
        ySect.appendChild(yInput);
        ySect.appendChild(xImg);


        coordSect.classList.add("coord");
        xSect.id = "x" + num;
        ySect.id = "y" + num;
        xLabel.htmlFor = "x" + num + "-input";
        xLabel.textContent = "x" + num + ": "; 
        yLabel.htmlFor = "y" + num + "-input";
        yLabel.textContent = "y" + num + ": "; 
        xInput.id = "x" + num + "-input";
        yInput.id = "y" + num + "-input";
        xInput.classList.add("coord-input");
        yInput.classList.add("coord-input");
        xInput.name = "x" + num;
        yInput.name = "y" + num;
        xInput.type = "text";
        yInput.type = "text";
        xInput.pattern = "[-]?[0-9]+[,.]?[0-9]*([\/][0-9]+[,.]?[0-9]*)*";
        yInput.pattern = "[-]?[0-9]+[,.]?[0-9]*([\/][0-9]+[,.]?[0-9]*)*";
        xInput.title = "Required x value* format: 'Integer, decimal, or fraction'";
        yInput.title = "Required y value* format: 'Integer, decimal, or fraction'";
        xInput.required = true;
        yInput.required = true;
        xImg.src = "images/x-icon-compressed.png";
        xImg.alt = "x icon";
        xImg.classList.add('del-coord');

        coordForm.insertBefore(coordSect, id('addCoord'));
    }

    function getNumCoords() {
        let coords = qsa('#input-fields > section');
        return coords.length;
    }
    
    function handleDesmos() {
        let elt = document.getElementById('calculator');
        let calculator = Desmos.GraphingCalculator(elt);
        calculator.setBlank();
        console.log(calculator);
        calculator.setExpression({ id: 'graph1', latex: 'y=x^2' });
        delCoordListener(1);
        return calculator
    }

    function setGraph(data, calculator, decimals) {
        calculator.setBlank();
        let equations = data["equations"];
        let domains = data["domains"];
        for(let i = 0; i < equations.length; i++) {
            equations[i] = equations[i].replaceAll(/(?<=\d)(e[-+]\d+)/g, (num) => {
                let n = num.split("e")[1];
                return "*10^{" + n + "}";
            });
            let latexVal = equations[i] + "\\left\\{" + domains[i]["min"] + "\\le x\\le " + domains[i]["max"] + "\\right\\}";
            console.log(String.raw`${latexVal}`);
            calculator.setExpression({ 
                id: 'graph' + (i+1),
                type: "expression", 
                latex: String.raw`${latexVal}`,
                polarDomain: { min: "0", max: "1" },
                secret: false,
                label: "graph" + (i+1),
                showLabel: false
            });
        }
        let avg = (array) => array.reduce((a, b) => a + b) / array.length;
        let avgX = Math.abs(avg(data["x"]));
        let avgY = Math.abs(avg(data["y"]));
        calculator.setViewport([
            Math.round(data["x"][0] - avgX), 
            Math.round(data["x"][data["x"].length-1] + avgX), 
            Math.round(Math.min(...data["y"]) - avgY), 
            Math.round(Math.max(...data["y"]) + avgY)
        ]);

        //calculator.setState();
        plotPoints(data, calculator, decimals);
        updateEquationsLatex(data);
        
    }

    function plotPoints(data, calculator, decimals) {
        for(let i = 0; i < data["x"].length; i++) {
            let point = "\\left(" + data["x"][i] + "," + data["y"][i] + "\\right)";
            calculator.setExpression({ 
                id: 'point' + (i+1),
                type: "expression", 
                latex: String.raw`${point}`,
                secret: false,
                label: "(" + data["x"][i].toFixed(decimals) + ", " + data["y"][i].toFixed(decimals) + ")",
                showLabel: true
            });
        }
        
        
    }

    function delCoordListener(num) {
        let xNode = qs("#y" + num + " > img");
        xNode.addEventListener("click", function() {
            qs("#input-fields > section:nth-child(" + num + ")").remove();
            let xVals = [];
            let yVals = [];
            let numCoords = getNumCoords();
            for(let i = 0; i <= numCoords - num; i++) {
                let xInput = id("x" + ((numCoords+1) - i) + "-input");
                let yInput = id("y" + ((numCoords+1) - i) + "-input");
                xVals.push(xInput.value);
                yVals.push(yInput.value);
                
            }
            console.log(xVals);
            console.log(yVals);
            let remainingCoords = qsa("#input-fields > section:nth-child(n+" + (num) + ")");
            for(const coord of remainingCoords) {
                coord.remove();
            }
            for(let i = 0; i < xVals.length; i++) {
                console.log(num+i);
                addPoint(num+i);
                delCoordListener(num+i);
                let xInput = id("x" + (num+i) + "-input");
                let yInput = id("y" + (num+i) + "-input");
                xInput.value = xVals[i];
                yInput.value = yVals[i];
            }
        });
    }

    function randListener() {
        let randBtn = id("rand-btn");
        randBtn.addEventListener("click", function() {
            generateRand();
        });
    }

    function generateRand() {
        let numCoords = getNumCoords();
        let min = -500 * numCoords;
        let max = 500 * numCoords;
        let decimals = getDecimals();
        for(let i = 1; i <= numCoords; i++) {
            let x = genRandVal(min, (max / genRandVal(1, numCoords, decimals)), 10);
            let y = genRandVal(min, (max / genRandVal(1, numCoords, decimals)), 10);
            min = x + 1;
            id("x" + i + "-input").value = "" + x;
            id("y" + i + "-input").value = "" + y;
        }
    }

    function genRandVal(min, max, decimals) {  
        let rand = Math.random()*(max-min) + min;
        let power = Math.pow(10, decimals);
        return Math.floor(rand*power) / power;
    }

    function updateEquationsLatex(data) {
        let cleanEquations = data["simplified-equations"];
        let domains = data["domains"];
        let latex = "";
        for(let i = 0; i < cleanEquations.length; i++) {
            latex += cleanEquations[i] 
            + " & \\text{if } " 
            + domains[i]["min"] + "≤x≤" + domains[i]["max"] + " \\\\"; 
        }
        insertCasesLatex(latex);
        setSteps(data, getDecimals());
    }

    function insertCasesLatex(latex) {
        let equations = id("equation");
        let start = "$$ f(x) = \\begin{cases} ";
        let end = " \\end{cases} $$";
        equations.textContent = start + latex + end;
        setDecimals(getDecimals());
    }

    async function setDecimals(num) {
        let equations = id("equation");
        formatEQ(equations, num);
        await MathJax.typesetPromise().then(() => {
            MathJax.typeset(["#equation"]);
        }).catch((err) => console.log(err.message));
        await MathJax.typesetPromise().then(() => {
            MathJax.typeset([".eq"]);
        }).catch((err) => console.log(err.message));
    }

    function formatEQ(equations, decimals) {
        equations.textContent = equations.textContent.replaceAll(/[-+]?[0-9]*\.?[0-9]+/g, (val) => { 
            return Number(val).toFixed(decimals); 
        });
        
        //console.log(equations.textContent.replaceAll(/(?<=\d)(e)/g, "*10^"));
        equations.textContent = equations.textContent.replaceAll(/(?<=\d)(e[-+]\d+)/g, (num) => {
            let n = num.split("e")[1];
            return "*10^{" + n + "}";
        });
        equations.textContent = equations.textContent.replaceAll(/(?<=\d)(e)/g, "*10^");
        equations.textContent = equations.textContent.replaceAll(/((?<=\^\s)(\d.0+)|(?<=\d})(.0+))/g, (num) => {
            let newNum = parseFloat(num);
            if(newNum == 0) {
                return "";
            }
            return newNum;
        });
        combineSigns(equations);
    }

    function combineSigns(node) {
        node.textContent = node.textContent.replaceAll(/(\+\s?-)/g, "-");
        node.textContent = node.textContent.replaceAll(/(-\s?-)/g, "\+");
    }

    function setSteps(data, decimals) {
        setStep1(data, decimals);
        setStep2(data);
        setStep3(data, decimals);
        setStep4(data, decimals);
        setStep5(data, decimals);
        setStep6(data, decimals);
    }

    function setStep1(data, decimals) {
        let arrX = [];
        let arrY = [];
        arrX.push(data["x"]);
        arrY.push(data["y"]);
        let xMatrix = createMatrix(arrX, "x", decimals);
        let yMatrix = createMatrix(arrY, "y", decimals);
        let step = id("setup-steps");
        let xEQ = qs("#setup-steps > p:nth-child(1)");
        let yEQ = qs("#setup-steps  > p:nth-child(2)");
        xEQ.textContent = xMatrix;
        yEQ.textContent = yMatrix;

        while(step.childElementCount > 4) {
            step.removeChild(step.lastChild);
        }

        for(let i = 0; i < data["x"].length-1; i++) {
            let subVal = data["x"][i+1] - data["x"][i];
            /*
            let hVal = toFraction(subVal);
            console.log(math.fraction(hVal));
            if(hVal.includes("/")) {
                hVal = toLatexFraction(hVal);
            } else {
               hVal = parseFloat(hVal).toFixed(decimals)
            } */
            addStep("h_{" + (i+1) + "} = " + parseFloat(subVal).toFixed(decimals), step);
        }
    }

    function setStep2(data) {
        let hVals = data["h"];
        let yVals = data["y"];

        let iterSteps = qs("#iter-steps");
        const maxDenom = 10000;
        while(iterSteps.childElementCount > 1) {
            iterSteps.removeChild(iterSteps.lastChild);
        }
        for(let i = 0; i < data["x"].length-2; i++) {
            let latex = "";
            let start = "\\text{i = " + (i+1) + ": }\\quad";
            let a0Coeff = toLatexFraction(toFract(hVals[i] / 6)) + "a_{" + (i) + "}";
            let a1Coeff = toLatexFraction(toFract((hVals[i] + hVals[i+1]) / 3)) + "a_{" + (i+1) + "}";
            let a2Coeff = toLatexFraction(toFract(hVals[i+1] / 6)) + "a_{" + (i+2) + "}";
            let yi2 = toLatexFraction(toFract(yVals[i+2]));
            let yi1 = toLatexFraction(toFract(yVals[i+1]));
            let yi0 = toLatexFraction(toFract(yVals[i]));
            let hi1 = toLatexFraction(toFract(hVals[i+1]));
            let hi0 = toLatexFraction(toFract(hVals[i]));
            let yLeft = toLatexFractionSplit(yi2 + "-" + yi1, hi1);
            let yRight = toLatexFractionSplit(yi1 + "-" + yi0, hi0); 
            let end = toLatexFraction(toFract(((yVals[i+2] - yVals[i+1]) / hVals[i+1]) - ((yVals[i+1] - yVals[i]) / hVals[i])));
            console.log(((yVals[i+2] - yVals[i+1]) / hVals[i+1]) - ((yVals[i+1] - yVals[i]) / hVals[i]));   
            latex += start + a0Coeff + "+" + a1Coeff + "+" + a2Coeff + " = (" + yLeft + ")-(" + yRight + ") = " + end;
            console.log(latex);
            addStep(latex, iterSteps);
        }
    }

    function setStep3(data, decimals) {
        let matrix = id("matrix-before");
        let rrefMatrix = id("matrix-after");
        let solvedAVals = id("solved-a")
        let matrixData = data["matrix-before"];
        let rrefMatrixData = data["matrix-after"];
        let aData = data["a"];
        let format = "";
        for(let i = 0; i < matrixData[0].length; i++) {
            if(i == matrixData[0].length - 1) {
                format += "|";
            }
            format += "c";
        }
        let start = "$$ \\left[ \\begin{array}{" + format + "}";
        let latex = "";
        let rrefLatex = "";
        let end = "\\end{array} \\right] $$";

        for(let col = 0; col < matrixData.length; col++) {
            for(let row = 0; row < matrixData[col].length; row++) {
                latex += parseFloat(matrixData[col][row]).toFixed(decimals).toString();
                rrefLatex += parseFloat(rrefMatrixData[col][row]).toFixed(decimals).toString();
                if(row != matrixData[col].length - 1) {
                    latex += " & ";
                    rrefLatex += " & ";
                }
            }
            latex += "\\\\";
            rrefLatex += "\\\\";
        }
        matrix.textContent = start + latex + end;
        rrefMatrix.textContent = start + rrefLatex + end;

        let aLatex = "$$ ";
        for(let i = 0; i < aData.length; i++) {
            if(i != 0) {
                aLatex += " \\quad ";
            }
            aLatex += "a_{" + i + "} = " + parseFloat(aData[i]).toFixed(decimals).toString();
        }
        aLatex += " $$"
        solvedAVals.textContent = aLatex;
    }

    function setStep4(data, decimals) {
        let bSteps = id("b-steps");
        let yVals = data["y"];
        let hVals = data["h"];
        let aVals = data["a"];
        while(bSteps.childElementCount > 1) {
            bSteps.removeChild(bSteps.lastChild);
        }
        for(let i = 0; i < data["b"].length; i++) {
            let latex = "b_{" + (i+1) + "} = ";
            let y = toLatexFraction(toFract(yVals[i]));
            let h = toLatexFraction(toFract(hVals[i]));
            let a = toLatexFraction(toFract(aVals[i]));
            let result = eval((yVals[i] / hVals[i]) - ((aVals[i] * hVals[i]) / 6));
            latex += toLatexFractionSplit(y, h) + "-" + toLatexFractionSplit("(" + a + ")*(" + h + ")", 6) + " = " + result;
            addStep(latex, bSteps);
        }
    }

    function setStep5(data, deicmals) {
        let cSteps = id("c-steps");
        let yVals = data["y"];
        let hVals = data["h"];
        let aVals = data["a"];
        while(cSteps.childElementCount > 1) {
            cSteps.removeChild(cSteps.lastChild);
        }
        for(let i = 0; i < data["b"].length; i++) {
            let latex = "c_{" + (i+1) + "} = ";
            let y = toLatexFraction(toFract(yVals[i+1]));
            let h = toLatexFraction(toFract(hVals[i]));
            let a = toLatexFraction(toFract(aVals[i+1]));
            let result = eval((yVals[i+1] / hVals[i]) - ((aVals[i+1] * hVals[i]) / 6));
            latex += toLatexFractionSplit(y, h) + "-" + toLatexFractionSplit("(" + a + ")*(" + h + ")", 6) + " = " + result;
            addStep(latex, cSteps);
        }
    }

    function setStep6(data, decimals) {
        let finalSteps = id("final-steps");
        let xVals = data["x"];
        let hVals = data["h"];
        let aVals = data["a"];
        let bVals = data["b"];
        let cVals = data["c"];
        while(finalSteps.childElementCount > 1) {
            finalSteps.removeChild(finalSteps.lastChild);
        }
        for(let i = 0; i < data["b"].length; i++) {
            let latex = "";
            let x0 = xVals[i];
            let x1 = xVals[i+1];
            let h = hVals[i];
            let a0 = aVals[i];
            let a1 = aVals[i+1];
            let b = bVals[i];
            let c = cVals[i];
            latex += a0 + "*" + toLatexFractionSplit("(" + x1 + " - x)^{3}", "6*(" + h + ")") + " + " 
            + a1 + "*" + toLatexFractionSplit("(x - " + x0 + ")^{3}", "6*(" + h + ")") + " + "
            + b + "*(" + x1 + " - x) + " 
            + c + "*(x - " + x0 + ")"; 
            console.log(latex);
            addStep(latex, finalSteps);
        }
    }

    function addStep(latex, parentNode) {
        let eq = gen("p");
        let decimals = getDecimals();
        eq.classList.add("eq");
        eq.textContent = "$$" + latex + "$$";
        parentNode.appendChild(eq);
        combineSigns(eq);
        eq.textContent = eq.textContent.replaceAll(/(?<!_{)([-]?\d+(.{1}?\d+)?)/g, (num) => {
            return parseFloat(num).toFixed(decimals).toString();
        });
        eq.textContent = eq.textContent.replaceAll(/(?<=_{)([+-]?\d+.\d+)/g, (num) => {
            return parseFloat(num).toString();
        });
        eq.textContent = eq.textContent.replaceAll(/(?<=[text|_]{i = )([+-]?\d+.\d+)/g, (num) => {
            return parseFloat(num).toString();
        });
        /* remove decimals from whole fractions
        eq.textContent = eq.textContent.replaceAll(/(?<=\\frac{)([+-]?\d+\.0+}{)([+-]?\d+\.0+)?/g, (vals) => {
            let nums = vals.split("}{");
            console.log("nums: " + nums);
            if(nums[1] != "") {
                console.log(parseFloat(nums[0]) + "}{" + parseFloat(nums[1]));
                return parseFloat(nums[0]) + "}{" + parseFloat(nums[1]);
            }
            return vals;
        })
        */
        
    }
    
    function createMatrix(arr, eqName, decimals) {
        let start = "$$ " + eqName + " = \\left[ \\begin{array}-";
        let end = "\\end{array} \\right] $$";
        let latex = "";
        for(let col = 0; col < arr.length; col++) {
            for(let row = 0; row < arr[col].length; row++) {
                latex += arr[col][row].toFixed(decimals);
                if(row != arr[col].length-1) {
                    latex += "&";
                }
            }
            latex += " \\\\ ";
        }
        return start + latex + end;
    }


    function getScreenWidth() {
        let width = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;
        return width;
    }

    function multFrations(val1, val2) {
        let frac1 = math.fraction(val1);
        let frac2 = math.fraction(val2);
        let frac = math.multiply(frac1, frac2).toString();
        let num = frac["n"];
        let den = frac["d"];
        if(den > 1 && num != den) return num + "/" + den;
        return val1 + "/" + val2;
    }

    function toFraction(val) {
        let frac = math.fraction(math.number(parseFloat(val)));
        let num = frac["n"];
        let den = frac["d"];
        if(den > 1 && num != den) return num + "/" + den;
        return val.toString();
    }

    function toLatexFraction(frac) {
        let nums = frac.toString().split("/");
        console.log(frac);
        return toLatexFractionSplit(parseFloat(nums[0]), parseFloat(nums[1]));
    }

    function toLatexFractionSplit(numerator, denominator) {
        let decimals = getDecimals();
        if(denominator == 1) {
            return numerator.toString();
        }
        console.log("\\frac{" + numerator + "}{" + denominator + "}");
        return "\\frac{" + numerator + "}{" + denominator + "}";
    }

    function toFract(value, maxDenom) {
        value = parseFloat(value);
        console.log( "Looking up: " + value );
        let best = { numerator: 1, denominator: 1, error: Math.abs(value - 1) }
        if ( !maxDenom ) maxDenom = 10000;
        for ( let denominator = 1; best.error > 0 && denominator <= maxDenom; denominator++ ) {
            let numerator = Math.round( value * denominator );
            let error = Math.abs( value - numerator / denominator );
            if ( error >= best.error ) continue;
            best.numerator = numerator;
            best.denominator = denominator;
            best.error = error;
            console.log( "Intermediate result: "
                            + best.numerator + "/" + best.denominator
                            + " (" + ( best.numerator/best.denominator)
                            + " error " + best.error + " )" );
        }
        console.log( "Final result: " + JSON.stringify( best ) );
        if(best.denominator > 1000 || best.numerator > 1000) {
            return value + "/1";
        }
        console.log(best.numerator.toString() + "/" + best.denominator.toString());
        return best.numerator.toString() + "/" + best.denominator.toString();
      }
        

    function showWorkListener() {
        let btn = id("see-work");
        btn.addEventListener("click", function() {
            console.log("clicked");
            scrollTo(id("steps-wrapper"));
        });
    }

    function scrollTo(element) {
        element.scrollIntoView({behavior: "smooth", block: 'start'})
    }

    function getNumIterSteps() {
        return qsa("iter-steps > p").length;
    }



    ////////////////////////////////////////////////////////////////

    async function statusCheck(response) {
        if (!response.ok) {
          throw new Error(await response.text());
        }
        return response;
    }
    
    function handleError(error) {
        let errorNode = id("error");
        errorNode.textContent = error.message;
        id("error-message").classList.remove("hidden");
        console.error(error);
    }

    function id(idName) {
		return document.getElementById(idName);
	}
	function qs(selector) {
    	return document.querySelector(selector);
  	}
	function qsa(selector) {
		return document.querySelectorAll(selector);
	}
	function gen(tagName) {
		return document.createElement(tagName);
	}
     
 })();