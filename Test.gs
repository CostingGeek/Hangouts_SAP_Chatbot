var TOKEN = '<<TOKEN>>';

function testAPI() {
  var url = 'https://api.graph.sap/beta/SalesOrders'; // SAP Graph API
  var headers = {'Authorization':'Bearer ' + TOKEN }
  var options = {
    'method': 'GET',
    'contentType': 'application/json',
    'headers': headers
  };
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());
  var valueList = data['value'];
  
  console.log(valueList); 
}
