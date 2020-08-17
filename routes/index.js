var express = require('express');
const formidable = require('formidable');
var router = express.Router();
var xlsx = require('node-xlsx').default;
var md5 = require('md5');
const md5File = require('md5-file')


var minuteSplit = 5;

function diff_minutes(dt2, dt1) 
{

 var diff =(dt2.getTime() - dt1.getTime()) / 1000;
 diff /= 60;
 return Math.abs(Math.round(diff));
 
}

const storage = require('node-persist');
storage.init().then(() => {
    storage.setItem("5038236773", "Ted Wheeler")
});

const messageStorage = require('node-persist');
messageStorage.init();

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

var userAbbreviation = function(name) {
    if (name.match(/^[()0-9\s\-]{4,}/)) {
        return name.slice(-2);
    }
    if (name.indexOf(' ') >= 0) {
        var initials = name.match(/\b\w/g) || [];
        initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
        return initials;
    }
    return name;
}

var dateTimeOptions = {
    timeZone: "America/Los_Angeles",
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric'
};

var dateTimeFormatter = new Intl.DateTimeFormat([], dateTimeOptions);

let formatDate = function (date) {
    var dt = dateTimeFormatter.format(date);
    if (dt == null) {
        dt = "";
    }
    return dt;
}

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
    async function buildConversations() {
        convos = []


        // There's probably a way to output all the contents of the conversations, but :shrug:
        var conversationKeys = await storage.keys();
        for (var i = 0; i < conversationKeys.length; i++) {
            var item = await storage.getItem(conversationKeys[i])
            if (typeof item === 'string' || item instanceof String) {
                1; // Pass?
            }
            else
            {
                console.log(item)
                convos.push({"id" : conversationKeys[i], "name": item['name']})
            }
        }

        res.render('listing', { "conversations" : convos } )
    }
    buildConversations();
});

router.get('/add', function(req,res,next) {
res.sendStatus(404);
    return;
  res.render('index', { title: 'Express' });
});

router.post('/conversation/update_contact', function(req, res) {

res.sendStatus(404);
    return;


    allSets = []
    for (var key in req.body) {
        allSets.push(storage.setItem(key.toString(), req.body[key]))
    }
    Promise.all(allSets).then((values) => {
        res.send("Updated")
        console.log("Updated Contact.")
    });
});

router.get('/conversation/:id', function(req, res) {
    async function buildPage() {
        return await messageStorage.getItem(req.params.id)
    }

    async function renderPage(response) {
        var pageData = await buildPage();

        pageData['data']['helpers'] = {
                "formatPhoneNumber" : formatPhoneNumber,
                "userAbbreviation" : userAbbreviation,
            },
        response.render('messages', pageData['data']);
    }

    renderPage(res);
});

router.post('/upload', (req, res, next) => {
  const form = formidable({ multiples: false });
 
  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }

  if (!files || Object.keys(files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = files.sampleFile;

  if (req.session.lastUploaded) {
      console.log("Prior Uploaded File: " + req.session.lastUploaded)
  }
  req.session.lastUploaded = sampleFile.path;

  const workSheets = xlsx.parse(sampleFile.path, { cellDates: true });
    /*
  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('/somewhere/on/your/server/filename.jpg', function(err) {
    if (err)
      return res.status(500).send(err);

    res.send('File uploaded!');
  });
      */

    async function buildPage() {

    var conversations = {};

    name = workSheets[0]['name'];
    data = workSheets[0]['data'];
    headers = data[0];
    var threadIdColumn = headers.indexOf("ThreadId");
    var messageIdColumn = headers.indexOf("MessageId");
    var dateColumn = headers.indexOf("Date (UTC)");
    var senderColumn = headers.indexOf("Sender");
    var recipientsColumn = headers.indexOf("Recipients");
    var bodyColumn = headers.indexOf("Body");
    var attachmentColumn = headers.indexOf("AttachmentCount");
    for(i=1; i < data.length; i++) {

        // Add both sender and receiver(s) to the contacts for this thread.
        var recipientNumbers = (data[i][recipientsColumn]).toString().split(/, /);
        recipientNumbers.push((data[i][senderColumn]).toString());

        // Remove spaces in numbers.
        recipientNumbers = recipientNumbers.map((x) => x.replace(/\s/g, ''));

        // Remove any duplicates
        recipientNumbers = recipientNumbers.filter( onlyUnique );


        var recipients = [];
        for (r=0; r<recipientNumbers.length; r++) {
            display = "";
            await storage.getItem(recipientNumbers[r]).then(function (result) {
              if (result == null) {
                  display = formatPhoneNumber(recipientNumbers[r]);
                  if (display == null) {
                      display = recipientNumbers[r]
                  }
              }
              else {
                  display = result;
              }

              recipients.push({
                  'display' : display,
                  'number'  : recipientNumbers[r],
                  'formattedPhoneNumber' : formatPhoneNumber(recipientNumbers[r])
              });
            });
        }
        var sender = data[i][senderColumn].toString().replace(/\s/g, '');

        var senderName = null
        await storage.getItem(sender).then(function (result) {
              senderName = result;
        });


        var tid = null
        if (threadIdColumn==-1) {
            participants = recipients.map((x) => x.number);
            participants.push(sender);
            participants = participants.filter( onlyUnique );
            participants.sort();
            tid = md5(participants);
        }
        else {
            tid = data[i][threadIdColumn];
        }

        var date = data[i][dateColumn];
        var userabbr = userAbbreviation(display);
        if (!(tid in conversations)) {
            conversations[tid] = {
                'recipients' : recipients,
                'messageGroups' : [
                {
                    'sender' : sender, 
                    'messages' : [],
                    'datetime' : formatDate(date),
                    'date' : date,
                    'userabbr' : userabbr,
                    'phoneformat' : formatPhoneNumber(sender),
                    'senderName' : senderName,
                    'showtime' : true,
                }
            ]};
        }

        var body = data[i][bodyColumn];
        if (body) {
            body = body.replace(/^"|"$/g, ''); 
        }

        // If the time between this message and the prior one is greater than the minuteSplit
        var showtime = (diff_minutes(date,  conversations[tid]['messageGroups'][conversations[tid]['messageGroups'].length-1]['date']) > minuteSplit);
        if (
            (sender != conversations[tid]['messageGroups'][conversations[tid]['messageGroups'].length-1]['sender']) ||
            showtime
           ) {
            conversations[tid]['messageGroups'].push(
                {
                    'sender' : sender, 
                    'messages' : [],
                    'datetime' : formatDate(date),
                    'date' : date,
                    'userabbr' : userabbr,
                    'phoneformat' : formatPhoneNumber(sender),
                    'senderName' : senderName,
                    'showtime' : showtime
                }
            );
        }
        var lastConv = conversations[tid]['messageGroups'].length-1;

        var msgCount = conversations[tid]['messageGroups'][lastConv]['messages'].length;
        if (msgCount > 0) {
            conversations[tid]['messageGroups'][lastConv]['messages'][msgCount-1]['last'] = false;
        }


        console.log(attachmentColumn)
        console.log(data[i])
        var attachments = Array();
        if (attachmentColumn > -1) {
            var ac = parseInt(data[i][attachmentColumn]);

            for(var m=0; m<ac; m++) {
                // More data to come.
                attachments.push({})
            }
        }

        conversations[tid]['messageGroups'][lastConv]['messages'].push({
            'name' : sampleFile['name'],
            'sender' : data[i][senderColumn],
            'date'   : date,
            'datetime' : formatDate(date),
            'body'   : body,
            'last'   : true,
            'id'     : data[i][messageIdColumn],
            'attachments' : attachments
        });
        
        }

        // There's probably a way to output all the contents of the contacts, but :shrug:
        var contactKeys = await storage.keys();
        var contacts = {}
        for (var i = 0; i < contactKeys.length; i++) {
            var item = await storage.getItem(contactKeys[i])
            if (typeof item === 'string' || item instanceof String) {
                contacts[contactKeys[i]] = item
            }
        }

        return {
            conversations:conversations,
            contacts:contacts,
            helpers: {
                "formatPhoneNumber" : formatPhoneNumber,
                "userAbbreviation" : userAbbreviation,
            },
            you:'5038236773'
        };
    }
    async function renderPage(response) {
        var pageData = await buildPage();


        const hash = md5File.sync(sampleFile.path);
        pageData['md5'] = hash;
        messageStorage.setItem(hash,
            {
                "name" : sampleFile['name'],
                "data" : pageData,
            });

        response.redirect("/conversation/" + hash);
    }

    



    renderPage(res);
    });


});

module.exports = router;
