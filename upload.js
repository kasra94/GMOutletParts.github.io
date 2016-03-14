var express = require('express');
var http = require('http');
var url = require('url');
var bodyParser = require('body-parser');
var app = express();
var pg = require('pg');
var port = process.env.PORT || 5000
var fs = require('fs');
var parse = require('csv-parse');
var async = require('async');
var multer  =   require('multer');
var csv = require("fast-csv");
var request = require('request');
var cheerio = require('cheerio');

var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, 'lastuploadedfile.csv');
  }
});
var upload = multer({ storage : storage}).single('userPhoto');

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Authorization, Content-Type');
  next();
});

app.listen(port);
app.timeout = 100000;
console.log('Listening at ' + port);
var records = [];

var inputFile='uploads/file.csv';
var totalLength = 0;
var counterLength = 0;

var parser = parse({delimiter: ','}, function (err, data) {
  console.log('Length: ' + data.length);
  totalLength = data.length;
  var datetime = new Date();
  // console.log(datetime);
  var csvStream = csv.createWriteStream({headers: true, quoteColumns: {'Product Description': true}}),
  writableStream = fs.createWriteStream("outputfiles/"+getCurrentDateAndTime()+".csv");
 
  writableStream.on("finish", function(){
    console.log("DONE!");
  });
   
  csvStream.pipe(writableStream);
  counterLength = 0;

  async.eachSeries(data, function (line, callback) {
  
    var url = 'http://www.gmoutletparts.com/oe-gm/' + line[4];

    request(url, ( function(line) {
        return function(err, resp, body) {
            if (err)
                throw err;
            $ = cheerio.load(body);
            // TODO: scraping goes here!
            var salePrice = '0';
            var listPrice = '0';

            $('#product_price').each( function () {
                salePrice = $(this).text();
            });

            $('#product_price2').each( function () {
                listPrice = $(this).text();
            });

            //use old price
            if(salePrice == '0' || listPrice == '0'){
              // console.log('old price')
              salePrice = line[10];
              listPrice = line[12];
            }else{
              salePrice = salePrice.substring(1, salePrice.length);
              listPrice = listPrice.substring(1, listPrice.length);
              // console.log('new price::::', salePrice, listPrice);
            }

            if(line[0] != 'Item Type'){
              csvStream.write({
                'Item Type': line[0],
                'Product ID': line[1],
                'Product Name': line[2],
                'Product Type': line[3],
                'Product Code/SKU': line[4],
                'Bin Picking Number': line[5],
                'Brand Name': line[6],
                'Option Set': line[7],
                'Option Set Align': line[8],
                'Product Description': line[9],
                'Price': salePrice,
                'Cost Price': line[11],
                'Retail Price': listPrice,
                'Sale Price': line[13],
                'Fixed Shipping Cost': line[14],
                'Free Shipping': line[15],
                'Product Warranty': line[16],
                'Product Weight': line[17],
                'Product Width': line[18],
                'Product Height': line[19],
                'Product Depth': line[20],
                'Allow Purchases?': line[21],
                'Product Visible?': line[22],
                'Product Availability': line[23],
                'Track Inventory': line[24],
                'Current Stock Level': line[25],
                'Low Stock Level': line[26],
                'Category': line[27],
                'Product File - 1': line[28],
                'Product File Description - 1': line[29],
                'Product File Max Downloads - 1': line[30],
                'Product File Expires After - 1': line[31],
                'Product Image ID - 1': line[32],
                'Product Image File - 1': line[33],
                'Product Image Description - 1': line[34],
                'Product Image Is Thumbnail - 1': line[35],
                'Product Image Sort - 1': line[36],
                'Product Image ID - 2': line[37],
                'Product Image File - 2': line[38],
                'Product Image Description - 2': line[39],
                'Product Image Is Thumbnail - 2': line[40],
                'Product Image Sort - 2': line[41],
                'Product Image ID - 3': line[42],
                'Product Image File - 3': line[43],
                'Product Image Description - 3': line[44],
                'Product Image Is Thumbnail - 3': line[45],
                'Product Image Sort - 3': line[46],
                'Search Keywords': line[47],
                'Page Title': line[48],
                'Meta Keywords': line[49],
                'Meta Description': line[50],
                'MYOB Asset Acct': line[51],
                'MYOB Income Acct': line[52],
                'MYOB Expense Acct': line[53],
                'Product Condition': line[54],
                'Event Date Required?': line[55],
                'Event Date Name': line[56],
                'Event Date Is Limited?': line[57],
                'Event Date Start Date': line[58],
                'Event Date End Date': line[59],
                'Sort Order': line[60],
                'Product Tax Class': line[61],
                'Product UPC/EAN': line[62],
                'Stop Processing Rules': line[63],
                'Product URL': line[64],
                'Redirect Old URL?': line[65],
                'GPS Global Trade Item Number': line[66],
                'GPS Manufacturer Part Number': line[67],
                'GPS Gender': line[68],
                'GPS Age Group': line[69],
                'GPS Color': line[70],
                'GPS Size': line[71],
                'GPS Material': line[72],
                'GPS Pattern': line[73],
                'GPS Item Group ID': line[74],
                'GPS Category': line[75],
                'GPS Enabled': line[76],
                'Avalara Product Tax Code': line[77],
                'Product Custom Fields': line[78]
              });
              counterLength++;
              console.log(counterLength + ' of ' + (totalLength - 1));
              if(counterLength == totalLength - 1){
                csvStream.end();
              }
            }
        }
    } )(line));

    
    callback();
  });
}
);
// fs.createReadStream(inputFile).pipe(parser);
var dir = require('node-dir');

app.get('/getfiles',function(req,res){
  

  dir.files(__dirname+'/outputfiles', function(err, files) {
    if (err) throw err;

    res.json(files);
    console.log(files);

  });

});


var path = require('path');
var mime = require('mime');

app.get('/download', function(req, res){

  var file = __dirname + '/' + req.query.url;

  var filename = path.basename(file);
  var mimetype = mime.lookup(file);

  res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  res.setHeader('Content-type', mimetype);

  var filestream = fs.createReadStream(file);
  filestream.pipe(res);
});

var currentProgressPercentage = 100;
app.get('/currentProgress', function(req, res){
  res.json(currentProgressPercentage);
});

app.post('/upload',function(req,res){
    res.setTimeout(0);
    upload(req,res,function(err) {
        if(err) {
          console.log(err)
            res.redirect('http://GMOutletParts.github.io/upload.html?uploaded=false');
            // res.redirect('http://localhost/GMOutletParts.github.io/upload.html?uploaded=false');
        }
        console.log('success...')
        records = [];






        var parser = parse({delimiter: ','}, function (err, data) {
        console.log('Length: ' + data.length);
        totalLength = data.length;
        var datetime = new Date();
        // console.log(datetime);
        var csvStream = csv.createWriteStream({headers: true, quoteColumns: {'Product Description': true}}),
        // fs.closeSync(fs.openSync('outputfiles/outputfile4.csv', 'w'));

    //     fs.writeFile('message.txt', 'Just now, we have created this file', function (err) {
    //     console.log('It\'s saved! in same location.');
    // });

        writableStream = fs.createWriteStream("outputfiles/"+getCurrentDateAndTime()+".csv");
       
        writableStream.on("finish", function(){
          console.log("DONE!");
          // res.redirect('http://GMOutletParts.github.io/showfiles.html?uploaded=' + (totalLength - 1));

        });
         
        csvStream.pipe(writableStream);
        counterLength = 0;

        async.eachSeries(data, function (line, callback) {
        
          var url = 'http://www.gmoutletparts.com/oe-gm/' + line[4];

          request(url, ( function(line) {
              return function(err, resp, body) {
                  if (err)
                      throw err;
                  $ = cheerio.load(body);
                  // TODO: scraping goes here!
                  var salePrice = '0';
                  var listPrice = '0';

                  $('#product_price').each( function () {
                      salePrice = $(this).text();
                  });

                  $('#product_price2').each( function () {
                      listPrice = $(this).text();
                  });

                  //use old price
                  if(salePrice == '0' || listPrice == '0'){
                    // console.log('old price')
                    salePrice = line[10];
                    listPrice = line[12];
                  }else{
                    salePrice = salePrice.substring(1, salePrice.length);
                    listPrice = listPrice.substring(1, listPrice.length);
                    // console.log('new price::::', salePrice, listPrice);
                  }

                  if(line[0] != 'Item Type'){
                    csvStream.write({
                      'Item Type': line[0],
                      'Product ID': line[1],
                      'Product Name': line[2],
                      'Product Type': line[3],
                      'Product Code/SKU': line[4],
                      'Bin Picking Number': line[5],
                      'Brand Name': line[6],
                      'Option Set': line[7],
                      'Option Set Align': line[8],
                      'Product Description': line[9],
                      'Price': salePrice,
                      'Cost Price': line[11],
                      'Retail Price': listPrice,
                      'Sale Price': line[13],
                      'Fixed Shipping Cost': line[14],
                      'Free Shipping': line[15],
                      'Product Warranty': line[16],
                      'Product Weight': line[17],
                      'Product Width': line[18],
                      'Product Height': line[19],
                      'Product Depth': line[20],
                      'Allow Purchases?': line[21],
                      'Product Visible?': line[22],
                      'Product Availability': line[23],
                      'Track Inventory': line[24],
                      'Current Stock Level': line[25],
                      'Low Stock Level': line[26],
                      'Category': line[27],
                      'Product File - 1': line[28],
                      'Product File Description - 1': line[29],
                      'Product File Max Downloads - 1': line[30],
                      'Product File Expires After - 1': line[31],
                      'Product Image ID - 1': line[32],
                      'Product Image File - 1': line[33],
                      'Product Image Description - 1': line[34],
                      'Product Image Is Thumbnail - 1': line[35],
                      'Product Image Sort - 1': line[36],
                      'Product Image ID - 2': line[37],
                      'Product Image File - 2': line[38],
                      'Product Image Description - 2': line[39],
                      'Product Image Is Thumbnail - 2': line[40],
                      'Product Image Sort - 2': line[41],
                      'Product Image ID - 3': line[42],
                      'Product Image File - 3': line[43],
                      'Product Image Description - 3': line[44],
                      'Product Image Is Thumbnail - 3': line[45],
                      'Product Image Sort - 3': line[46],
                      'Search Keywords': line[47],
                      'Page Title': line[48],
                      'Meta Keywords': line[49],
                      'Meta Description': line[50],
                      'MYOB Asset Acct': line[51],
                      'MYOB Income Acct': line[52],
                      'MYOB Expense Acct': line[53],
                      'Product Condition': line[54],
                      'Event Date Required?': line[55],
                      'Event Date Name': line[56],
                      'Event Date Is Limited?': line[57],
                      'Event Date Start Date': line[58],
                      'Event Date End Date': line[59],
                      'Sort Order': line[60],
                      'Product Tax Class': line[61],
                      'Product UPC/EAN': line[62],
                      'Stop Processing Rules': line[63],
                      'Product URL': line[64],
                      'Redirect Old URL?': line[65],
                      'GPS Global Trade Item Number': line[66],
                      'GPS Manufacturer Part Number': line[67],
                      'GPS Gender': line[68],
                      'GPS Age Group': line[69],
                      'GPS Color': line[70],
                      'GPS Size': line[71],
                      'GPS Material': line[72],
                      'GPS Pattern': line[73],
                      'GPS Item Group ID': line[74],
                      'GPS Category': line[75],
                      'GPS Enabled': line[76],
                      'Avalara Product Tax Code': line[77],
                      'Product Custom Fields': line[78]
                    });
                    counterLength++;
                    currentProgressPercentage = 100* counterLength / (totalLength - 1);
                    console.log(counterLength + ' of ' + (totalLength - 1));
                    if(counterLength == totalLength - 1){
                      csvStream.end();
                    }
                  }
              }
          } )(line));

          
          callback();
        });
        res.redirect('http://GMOutletParts.github.io/showfiles.html?uploaded=' + (totalLength - 1));
        // res.redirect('http://localhost/GMOutletParts.github.io/showfiles.html?uploaded=' + (totalLength - 1));
        
    });
    fs.createReadStream(inputFile).pipe(parser);



  });
});

function getCurrentDateAndTime(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    var time = today.getHours()+ '' +today.getMinutes()+ '' +today.getSeconds();
    if(dd<10){
        dd='0'+dd
    } 
    if(mm<10){
        mm='0'+mm
    } 
    var today = yyyy+mm+dd+time;
    return today;
}



