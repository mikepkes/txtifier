var express = require('express'); var router = express.Router();
var xlsx = require('node-xlsx').default;

let formatPhoneNumber = (str) => {
  //Filter only numbers from the input
  let cleaned = ('' + str).replace(/\D/g, '');
  
  //Check if the input is of correct length
  let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  };

  return null
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/upload', function(req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;



  const workSheets = xlsx.parse(sampleFile.tempFilePath);
    /*
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('/somewhere/on/your/server/filename.jpg', function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
      */

    var conversations = {};

    name = workSheets[0]['name'];
    data = workSheets[0]['data'];
    headers = data[0];
    var threadIdColumn = headers.indexOf("ThreadId");
    var dateColumn = headers.indexOf("Date (UTC)");
    var senderColumn = headers.indexOf("Sender");
    var recipientsColumn = headers.indexOf("Recipients");
    var bodyColumn = headers.indexOf("Body");
    for(i=1; i < data.length; i++) {
        var recipients = (data[i][recipientsColumn]).toString().split(/, /);
        var tid = data[i][threadIdColumn]
        var sender = data[i][senderColumn];
        if (!(tid in conversations)) {
            conversations[tid] = {
                'recipients' : recipients.map(formatPhoneNumber),
                'messageGroups' : [
                {
                    'sender' : sender, 
                    'messages' : []
                }
            ]};
        }
        var body = data[i][bodyColumn];
        if (body) {
            body = body.replace(/^"|"$/g, ''); 
        }
        if (sender != conversations[tid]['messageGroups'][conversations[tid]['messageGroups'].length-1]['sender']) {
            conversations[tid]['messageGroups'].push(
                {
                    'sender' : sender, 
                    'messages' : []
                }
            );
        }
        var lastConv = conversations[tid]['messageGroups'].length-1;

        var msgCount = conversations[tid]['messageGroups'][lastConv]['messages'].length;
        if (msgCount > 0) {
            conversations[tid]['messageGroups'][lastConv]['messages'][msgCount-1]['last'] = false;
        }
        conversations[tid]['messageGroups'][lastConv]['messages'].push({
            'sender' : data[i][senderColumn],
            'date'   : data[i][dateColumn],
            'body'   : body,
            'last'   : true
        });
        
    }

    res.render('messages', {conversations:conversations});
});

module.exports = router;
