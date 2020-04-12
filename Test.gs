var TOKEN = '<<TOKEN>>';

function testAPI() {
  // URL to the API
  var url = 'https://api.graph.sap/beta/SalesOrders'; // SAP Graph API
  
  // Pass security credentials
  var headers = {'Authorization':'Bearer ' + TOKEN }
  
  // Pass headers
  var options = {
    'method': 'GET',
    'contentType': 'application/json',
    'headers': headers
  };
  
  // Perform the call and parse the JSON result
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  
  // Only keep the ‘value’ element of the response
  var valueList = data['value'];
  
  console.log(valueList); 
}
