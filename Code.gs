/**
* Default Values
*/
var TOKEN = '<<TOKEN>>';

/**
 * Responds to a MESSAGE event in Hangouts Chat.
 *
 * @param {Object} event the event object from Hangouts Chat
 */
function onMessage(event) {
  var widgets = buildCardMenu();
  return createCardResponse(widgets);
}

/**
 * Responds to an ADDED_TO_SPACE event in Hangouts Chat.
 *
 * @param {Object} event the event object from Hangouts Chat
 */
function onAddToSpace(event) {
  var message = '';

  if (event.space.type == 'DM') {
    message = 'Thank you for adding me to a DM, ' + event.user.displayName + '!';
  } else {
    message = 'Thank you for adding me to ' + event.space.displayName;
  }

  if (event.message) {
    // Bot added through @mention.
    message = message + ' and you said: \'' + event.message.text + '\'';
  }

  return { 'text': message };
}

/**
 * Responds to a REMOVED_FROM_SPACE event in Hangouts Chat.
 *
 * @param {Object} event the event object from Hangouts Chat
 */
function onRemoveFromSpace(event) {
  console.info('Bot removed from ', event.space.name);
}

/**
 * Responds to a CARD_CLICKED event triggered in Hangouts Chat.
 * @param {object} event the event object from Hangouts Chat
 * @return {object} JSON-formatted response
 * @see https://developers.google.com/hangouts/chat/reference/message-formats/events
 */
function onCardClick(event) {
  // React to buttons clicked on the cards based on the actionMethodName
  var content = '';
  var widgets = '';
  switch( event.action.actionMethodName ) {
    case 'displaySalesOrders': // Display all sales orders
      content = getSalesOrders();
      widgets = buildCardList(content);
      break;
      
    case 'displaySalesOrderById': // Display a single sales order by id
      content = getSalesOrderById(event.action.parameters[0]['value']);
      widgets = buildCardDetails(content);
      break;
      
    default:
      return { 'text': 'Unknown command' };
  }
  
  // Convert response to the right card format
  return createCardResponse(widgets);
}

/**
* Build Card for default Menu
*/
function buildCardMenu() {
  // Prepare a collection of buttons
  var buttonList = [];
  
  // Add button for Sales Orders
  var button = {textButton: {
    text: 'Sales Orders<br/>',
    onClick: {
      action: {
        actionMethodName: 'displaySalesOrders'
          }
        }
    }};
  buttonList.push(button);

  // Collect all buttons and add header
  var widgets = [{
    textParagraph: {
      text: '<b>Please select a command</b><br/>'
    }
  }, {
    buttons: buttonList
  }];
  
  return widgets;
}

/**
* Build Card Format for Lists
* @param(array) content - list of values with id / amount / currency code
*/
function buildCardList(content) {

  // Build a array of buttons with item as id / amount / currency_code
  // Use id as parameter for the button
  var buttons = [];

  // Process each of the order items in the content array
  for( var i = 0; i < content['values'].length; i++ ) {
    
    var content_line = content['values'][i];
    
    // Convert id / amount / currency as string
    // Such as 1234: 245 USD
    // Each line becomes a button for the use to click
    var button_text = {textButton: {
      text: content_line['id'] + ' : ' + content_line['amount'] + ' ' + content_line['currency'] + '<br/>',
        onClick: {
          action: {
            actionMethodName: 'displaySalesOrderById',
            parameters: [{
              key: 'id',
              value: content_line['id']
            }]
          }
        }
    }};
    buttons.push(button_text);
  }

  // Collect all buttons and add header
  var widgets = [{
    textParagraph: {
      text: '<b>' + content['type'] + '</b>'
    }
  }, {
    buttons: buttons
  }];

  return widgets;
}

/**
* Build Card Details
*/
function buildCardDetails(content) {
  // Build the return card showing each field and value
  // Values were passed in content as a array of field name / value pairs
  // Example: {‘field’:’Sales Order ID’, ‘value’: 1234 }
  // Convert to a string, such as Sales Order ID : 1234
  var text = "";
  for( var i = 0; i < content['values'].length; i++ ) {
    var content_line = content['values'][i];
    text += content_line['field'] + ' : ' + content_line['value'] + '<br/>';
  }

  // Return the header and the content
  var widgets = [{
    textParagraph: {
      text: '<b>' + content['type'] + '</b><br/>' + text
    }
  }];

  return widgets;
}

/**
* Create Card Response
* @widgets {object} content for the card
*/
function createCardResponse(widgets) {
  
  return {
    cards: [{
      sections: [{
        widgets: widgets
      }]
    }]
  };
  
}

/**
* Get Sales Orders from the SAP Graph API
*/
function getSalesOrders() {

  // Build the call to the SAP Graph API
  // URL to the API
  var url = 'https://api.graph.sap/beta/SalesOrders?$top=5&$orderby=grossAmount desc'; // SAP Graph API
  
  // Pass the security credentials
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
  var value_list = data['value'];

  // Build the return list as an array with id / amount / currency
  var order_list = [];
  for( var i = 0; i < value_list.length; i++ )
  {
    order_list.push( {'id' : value_list[i]['id'],
                      'amount' : value_list[i]['grossAmount'],
                      'currency' : value_list[i]['currency_code']} );
  }

  // Build header and combine with order list
  var content = { 'type' : 'Top 5 Sales Orders by Gross Amount',
                 'values' : order_list };   

 return content;
}

/**
* Get Sales Orders for specific Sales Order Id from the SAP Graph API
* @param {id} Identification of the Sales Order
*/
function getSalesOrderById(id) {

  // Build the call to the SAP Graph API
  
  // URL to the API
  var url = 'https://api.graph.sap/beta/SalesOrders/' + id; // SAP Graph API
  
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

  // Collect all values as field name / value pairs as an array
  // Example: {‘field’:’Sales Order ID’, ‘value’: 1234 }
  var order_list = [];
  order_list.push( {'field' : 'Sales Order ID', 'value' : data['id'] } );
  order_list.push( {'field' : 'Gross Amount'  , 'value' : data['grossAmount'] } );
  order_list.push( {'field' : 'Tax Amount'    , 'value' : data['taxAmount'] } );
  order_list.push( {'field' : 'Net Amount'    , 'value' : data['netAmount'] } );
  order_list.push( {'field' : 'Currency'      , 'value' : data['currency_code'] } );
  order_list.push( {'field' : 'Customer ID'   , 'value' : data['customerID']  } );
  order_list.push( {'field' : 'Order Date'    , 'value' : data['orderDate'] } );

  // Build header and combine with field list
  var content = { 'type' : 'Details for Sales Order: ' + id,
                  'values' : order_list };   
 
 return content;  
}
