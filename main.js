var FAT = (function(){

    if (typeof(Storage) === 'undefined') {
        alert("Could not init. Looks like you have no storage support.");
        return false;
    }



document.getElementById('helpButton').addEventListener("click", function() {
    document.getElementById('helpTextCon').style.display = '';
});
document.getElementById('closeButton').addEventListener("click", function() {
    document.getElementById('helpTextCon').style.display = 'none';
});


    // TODO this is for the maintainer!!! make it more visible and understandable
    // FIXME if these change we have to compare with the saved stuff and adjust the localStorage
    /*
     *the predefined rules are saved to localStorage and can NOT be modified. 
     * possible enhancement: add parameter to __saveToStorage, sth. like storageType which can be userTests or basicTests 
     then use it to check against the coresponding object
     */

    var predefinedbasicTests = {
        
        //FIXME this does not what it says it does
           moduleSliderID:	{
            testCode: "count(//div[@class = 'moduleSlider'])",
            message: "A moduleSlider needs a ID",
            func: function(data){
                if (data > 0) {
                    return false;
                };
                return true;
            },
            type: "xpath"
           },
           
        metaSection:	{
            testCode: "//div[@class = 'meta']",
            message: "A meta section has to be defined!",
            func: function(data){

                if (data > 0) {
                    return true;
                } else {
                    return false;   
                };
            },
            type: "xpath"
        }
    };



    var d = document
        , basicTestsCon = d.getElementById("basicTests")
        , userTestsCon = d.getElementById("userTests")
        , i = 0
        , basicTests = __readFromStorage("Fat_basicTests") || __saveToStorage("Fat_basicTests", predefinedbasicTests)
        , userTests =  __readFromStorage("Fat_userTests") || __saveToStorage("Fat_userTests", {})
        , fitml = {}
    , testsToRun = {}
    ;


    function __saveToStorage(name, obj){
        //console.log("saveTo");

        var data2save = JSON.stringify(obj, function (key, val) {
            if (typeof val === 'function') {
                return val + ''; // implicitly `toString` it
            }
            return val;
        });

        localStorage.setItem(name, data2save);

        var data = __readFromStorage(name) || {};
        return data;
    }

    /**
     * returns an object containing
     *  - the mixed object, b is mixed into a without the duplicates
     *  - an array of strings containing the dups
     */
    function __mixObj(a, b) {
        var dups = [];
        // console.log(a);
        //console.log(b);

        for(prop in b){
            if (b.hasOwnProperty(prop)) {
                if (a[prop]) {
                    dups.push(prop);
                }else{
                    a[prop] = b[prop];
                }
            }
        }

        return {
            result: a,
                dups: dups
        }
    }

    function __readFromStorage(name){
        //	console.log("readFrom");
        var data = JSON.parse(localStorage.getItem(name))
            , returnObj = {}
        , test = {}
        ;

        if (!data) { return false; }

        //make functions out of json-strings
        //TODO dont recreate data object, just overwrite .func
        for(test in data){
            if (data.hasOwnProperty(test)) {
                returnObj[test] = data[test];
                returnObj[test].func = eval('(function(){return '+data[test].func+'})()');
            }
        }

        return returnObj;
    }



    // read all rules and make a checkbox list out of them
    function __makeList (tests, withDeleteButton) {
        //console.log(tests);

        var container = d.createDocumentFragment();

        var test = null;
        for(test in tests){
            if (tests.hasOwnProperty(test)) {

                var label = d.createElement("label")
                    , desc = document.createTextNode(test)
                    , lineBreak = d.createElement("br") 
                    , newCheckbox = d.createElement("input")
                    ;

                newCheckbox.type = "checkbox";
                label['for'] = test;
                newCheckbox.id = test;

                label.appendChild(newCheckbox);
                label.appendChild(desc);

                container.appendChild(label);
                if (withDeleteButton) {
                    var delButton = d.createElement("input");
                    delButton.type = "button";
                    delButton.setAttribute("class", "deleteButton");
                    delButton.value = "X";
                    delButton.onclick = function (name) {
                        return function(){
                            FAT.removeTest(name);
                        }
                    }(test);
                    container.appendChild(delButton);
                }else{
                    newCheckbox.checked = true;
                }
                container.appendChild(lineBreak);

            }
        }

        return container;
    }

    //TODO move to top... motherfing jsLint
    function __redrawLists() {
        basicTestsCon.innerHTML = "";
        userTestsCon.innerHTML = "";
        basicTestsCon.appendChild(__makeList(basicTests));
        userTestsCon.appendChild(__makeList(userTests, true));
    }
    __redrawLists();



    /*
       end of initialisation code
       */



    function _addTest(name, testCode, func, message, type){

        if (userTests[name]) {
            //user can override
            if (!confirm("The test '"+name+"' exists.\n Do you want to override it?")) {
                return false;
            }
        }

        //TODO better checks
        if (!name || !testCode || !func || !message || !type) {
            return "Check your arguments. Should be: (name, testCode, function, message, type)";
        }

        userTests[name] = {
            'testCode': testCode,
            'func': func.toString(),
            'message': message,
            'type': type
        };

        var data = __saveToStorage("Fat_userTests", userTests);
        __redrawLists();

        return this;
    }

    function _removeTest(name){
        if (confirm("Test '"+ name + "' will be deleted. Are you sure?")) {
 //       console.log(userTests);
        delete userTests[name];
   //     console.log(userTests);
        }

        __saveToStorage("Fat_userTests", userTests);
        __redrawLists();
    }

    function _runTests(){
     //   console.log("tests running");

        basicTests = __readFromStorage("Fat_basicTests");
        userTests = __readFromStorage("Fat_userTests");
        fitml = __getFITML();
        testsToRun = __findTestsToRun();

        __callQunit(testsToRun.basicTests, basicTests);
        __callQunit(testsToRun.userTests, userTests);


 //       console.log("tests ended");
    }

    function __findTestsToRun(){

        // FIXME TODO HELPER REMOVE
 //       H_checkAllBoxes();
        //HELPER REMOVE

        var basicInputs = basicTestsCon.getElementsByTagName('input')
            , userInputs = userTestsCon.getElementsByTagName('input')
            , tests2run = null
            , basicTests2Run = __filterCheckedBoxes(basicInputs)
            , userTests2Run = __filterCheckedBoxes(userInputs)
            ;

        basicTests2Run = __getIdListFromElements(basicTests2Run);
        userTests2Run = __getIdListFromElements(userTests2Run);

        tests2run = {
            "userTests" : userTests2Run,
            "basicTests" : basicTests2Run
        }

        return tests2run;
    }

    function H_checkAllBoxes () {
        var boxes = d.getElementsByTagName('input');
        var i = 0;
        for (i = boxes.length; i--;) {
            if (boxes[i].type === 'checkbox') {
                boxes[i].checked = true;
            }
        }
    }

    function __getIdListFromElements (arr) {
        var returnArr = [];

        var i = 0;
        for (i = arr.length; i--;) {
            returnArr.push(arr[i].id);
        }

        return returnArr;
    }

    /*takes an array of html elements e.g. inputs and returns an array which contains only the cehcked ones*/
    function __filterCheckedBoxes (boxes) {
        var i = 0
            , returnArray = []
            ;

        for (i = boxes.length; i--;) {
            if (boxes[i].checked) {
                returnArray.push(boxes[i]);
            }
        }
        return returnArray;
    }




    function __getFITML() {
        var userInput = new DOMParser().parseFromString(d.getElementById('fitmlInput').value, 'text/xml');

        //TODO check for parseErrors
        // http://stackoverflow.com/questions/11563554/how-do-i-detect-xml-parsing-errors-when-using-javascripts-domparser-in-a-cross

        return userInput;

    }


    function __callQunit (testIds, tests) {
        //		console.log(fitml);

        var i = 0
            , y = 0
            , test2run = null
            , cb = null
            , testID = ""
            , testResult = ""
            , cbTestResult = ""
            ;
        function __testCbResult(id, text) {
            test(id, function() {
                ok( cbTestResult === true, text);
            });

        }


        for (y = testIds.length; y--;) {
            testID = testIds[y];
            test2run = tests[testID];
            testResult = __runTest(test2run.testCode, test2run.type);

            if (typeof test2run.func === 'function') {
                cbTestResult = test2run.func(testResult) || false;
            }else{
                cbTestResult = false;
 //               console.dir(test2run);
                console.log("There was a problem with the user callback for test: " + testID);
            }
            __testCbResult(testID, test2run.message);

        }


    }

    //TODO this api should be expanded to cover more test-types 
    function __runTest (testCode, type) {
            //console.log(testCode);
        //	console.log(fitml);
        var testResult = fitml.evaluate(testCode, fitml, null, XPathResult.ANY_YTPE, null);

        /*
           possible resultTypes
           https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIDOMXPathResult#type_constants
           1 number
           2 string
           3 boolean
           4-9 nodeSets // when ANY_TYPE is expected, nodeSets are always UNORDERED_NODE_ITERATOR_TYPE
           */

        var result = "";
        var resultType = testResult.resultType;

        ////TODO use constants instead of constant-values
        if(resultType === 1) {
            //console.log("resultType is 1 / number");
            result = testResult.numberValue;
        }else if(resultType === 2){
            //console.log("resultType is 2 / string");
            result = testResult.stringValue;
        }else if(resultType >= 4 && resultType <= 9){
            //   console.log("resultType is 4-9 / nodeSet");
            if (testResult.length) {
                result = testResult;
            } else {
                result = {};
            }
        }

        return result; 
    }


    return {
        addTest: _addTest, 
        removeTest: _removeTest,
        runTests: _runTests

    };

})();
//console.log(FAT);
//localStorage.clear();
//FAT.addTest("image have Alt", "count(//img[not(@alt)])", function(data){
    //if (data > 0) {
        //return false;
    //} else {
        //return true;
    //}
//}, "All images have an alt attribute" ,"xpath");

//FAT.addTest("image have src", "count(//img[not(@src)])", function(data){
    //if (data > 0) {
        //return false;
    //} else {
        //return true;
    //}
//}, "All images have an src attribute" ,"xpath");

//FAT.addTest("fooboo", "count(//img[not(@alt)])", "0","All images have an alt attribute" ,"xpath");
//console.log(localStorage.Fat_userTests);
//FAT.runTests();

