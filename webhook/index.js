const request = require('request');
const MAX_COMPANIES_IN_RESPONSE = 2;

function sendResponse(response,responseTxt, context, end){
      let responseJson = {};
      responseJson.speech = responseTxt; // spoken response
      responseJson.displayText = responseTxt; // displayed response
      responseJson.contextOut = context;
      if(end) {
        responseJson.data =  {google:{expect_user_response: false}};
      }
      response.json(responseJson); // Send response to Dialogflow    
}

function fetchPrice(res, symbol) {
      var lastPrice;
      var options = {
        url: 'https://trade-junky.appspot.com/api/getquote?name=' + symbol,
        headers: {
        'api-key': '2246696acd8638f0fbfe5d6e4d515a3eaefed5c19b5a2c18'
        }
      };
      request.get(options, function(error, response, body) {
          console.log('error:', error); // Print the error if one occurred 
          console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
          console.log('body:', body); //Prints the response of the request. 
        responseOut = JSON.parse(body);
          lastPrice = responseOut["lastPrice"];
          sendResponse(res, "The price for "+symbol+" is "+ lastPrice + " INR.", [], true);
      });
}

/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.dialogflowFulfillment = function stockTellerWebHook(req, res) {
    console.log(req.body.result.parameters);
    var companyname = req.body.result.parameters.company_name;
    var options = {
      url: 'https://trade-junky.appspot.com/api/companysearch?name=' + companyname,
      headers: {
      'api-key': '2246696acd8638f0fbfe5d6e4d515a3eaefed5c19b5a2c18'
      }
    };
    
    request.get(options, function(error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body); //Prints the response of the request. 
        var respJson = JSON.parse(body);
        var keys = Object.keys(respJson);
        var count = keys.length;
        if(count === 0 ) {
            sendResponse(res, "No such company found",[], false);
        } else if(count === 1) {
            fetchPrice(res, keys[0])
        } else if(count > 1) {
            var contexts = [{name:"stock-teller-followup",parameters:{symbols:keys.join(';')}}];
            var outStr = respJson[keys[0]]+" or "+respJson[keys[1]]+".";
          sendResponse(res, "More than one company found. Which one do you want? "+outStr,contexts, false);   
        }
    });
}
