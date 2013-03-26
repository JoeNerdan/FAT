//last steps: callQunit does not need a list of input-elements but just the ids. __getIdListFromElements needs to be finished, after that continue with callQunit


var FAT = (function(){

		if (typeof(Storage) === 'undefined') {
			alert("Could not init. Looks like you have no storage support.");
			return false;
		}


		// TODO this is for the maintainer!!! make it more visible and understandable
		// FIXME if these change we have to compare with the saved stuff and adjust the localStorage
		/*
		 *the predefined rules are saved to localStorage and can NOT be modified. 
		 * possible enhancement: add parameter to __saveToStorage, sth. like storageType which can be userTests or basicTests 
		 then use it to check against the coresponding object
		 */

		var predefinedbasicTests = {
			moduleSliderID:	{
				testCode: "someCode",
				message: "Any moduleSlider has an ID",
				type: "xpath"
			},
			metaSection:	{
				testCode: "//div[@class = 'meta']",
				message: "Any moduleSlider has an ID",
				func: function(data){
					console.log(data);
					console.log("in callback");
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

		//	console.log(basicTests);
		//	console.log(userTests);

		function __saveToStorage(name, obj){
			//		console.log("saveTo");
			//FIXME have to append to existing rules


			localStorage.setItem(name, JSON.stringify(obj));
			var data = __readFromStorage(name);
			return data;
		}

		function __readFromStorage(name){
			//	console.log("readFrom");
			var data = JSON.parse(localStorage.getItem(name))
			, returnObj = {}
			, test = {}
			;

			if (!data) { return false; }

			for(test in data){
				if (data.hasOwnProperty(test)) {
					returnObj[test] = data[test];
					returnObj[test].func = eval('(function(){return '+data[test].func+'})()');
				}
			}

			//console.log("returnObj:");
			//console.log(returnObj);
			return returnObj;
		}



		// read all rules and make a checkbox list out of them
		function __makeList (tests) {
			//console.log(tests);

			var container = d.createDocumentFragment();

			var test = {};
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
					container.appendChild(lineBreak);

				}
			}

			return container;
		}

		//TODO move to top... motherfing jsLint
		basicTestsCon.appendChild(__makeList(basicTests));
		userTestsCon.appendChild(__makeList(userTests));



		/*
		 end of initialisation code
		 */



		function _addTest(name, testCode, func, message, type){
			//FIXME check if we have this already, right now it is overwritten
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

			__saveToStorage("Fat_userTests", userTests);

			return this;
		}

		function _removeTest(){

		}

		function _runTests(){
			console.log("tests running");
			fitml = __getFITML();
			testsToRun = __findTestsToRun();

			__callQunit(testsToRun.basicTests, basicTests);
			__callQunit(testsToRun.userTests, userTests);


			console.log("tests ended");
		}

		function __findTestsToRun(){

			// FIXME TODO HELPER REMOVE
			H_checkAllBoxes();
			//HELPER REMOVE

			var basicInputs = basicTestsCon.getElementsByTagName('input')
			, userInputs = userTestsCon.getElementsByTagName('input')
			, tests2run = {}
			, basicTests2Run = __filterCheckedBoxes(basicInputs)
			, userTests2Run = __filterCheckedBoxes(userInputs)
			;

			basicTests2Run = __getIdListFromElements(basicTests2Run);
			userTests2Run = __getIdListFromElements(userTests2Run);


			tests2run.userTests = userTests2Run;
			tests2run.basicTests = basicTests2Run;

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
			console.log(fitml);
			/*
			 resultTypes
			 https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIDOMXPathResult#type_constants
			 1 number
			 2 string
			 3 boolean
			 4-9 nodeSets
			*/

			var i = 0
			, y = 0
			, test2run = {}
			, testCode = ""
			, cb = {}
			, testID = ""
			, testResult = ""
			;

			for (y = testIds.length; y--;) {
				testID = testIds[y];
				test2run = tests[testID];
				testResult = __runTest(test2run.testCode, test2run.type);

	//			console.log(testResult);
			}


			test("hallo", function() {
					ok(1 === 1, "passed");
				});

		}

		//TODO this api should be expanded to cover more test-types 
		function __runTest (testCode, type) {
			var f = fitml.evaluate(testCode, fitml, null, XPathResult.ANY_TYPE, null);
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
FAT.addTest("image have Alt", "count(//img[not(@alt)])", function(data){
		if (data > 0) {
			return false;
		} else {
			return true;
		}
	}, "All images have an alt attribute" ,"xpath");
FAT.addTest("image have src", "count(//img[not(@src)])", function(data){
		if (data > 0) {
			return false;
		} else {
			return true;
		}
	}, "All images have an src attribute" ,"xpath");

//FAT.addTest("fooboo", "count(//img[not(@alt)])", "0","All images have an alt attribute" ,"xpath");
//console.log(localStorage.Fat_userTests);
		FAT.runTests();

