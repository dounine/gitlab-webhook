var http = require('http')
var createHandler = require('gitlab-webhook-handler')
var handler = createHandler({ path: '/webhook' })
var fs = require('fs')
;

function run_cmd(cmd, args, callback) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var resp = "";

    child.stdout.on('data', function (buffer) {
        resp += buffer.toString();
    });
    child.stdout.on('end', function () {
        callback(resp)
    });
}

http.createServer(function (req, res) {
    fs.readFile('./password.txt', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        if(data==req.headers['x-gitlab-token']){
            handler(req, res, function (err) {
                res.statusCode = 404
                res.end('no such location')
            })
        }else{
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end('{"code":400,"msg":"password not valid."}')
        }
    })

}).listen(7777);

console.log("Gitlab Hook Server running at http://0.0.0.0:7777/webhook");

handler.on('error', function (err) {
    console.error('Error:', err.message)
})

handler.on('push', function (event) {
    console.log('Received a push event for %s to %s',
        event.payload.repository.name,
        event.payload.ref)

    run_cmd('sh', ['../nginx-restart.sh', event.payload.repository.name], function (text) {
        console.log(text)
    });
})

handler.on('issues', function (event) {
    console.log('Received an issue event for %s action=%s: #%d %s',
        event.payload.repository.name,
        event.payload.action,
        event.payload.issue.number,
        event.payload.issue.title)
})



// http.createServer(function (req, res) {
//     handler(req, res, function (err) {
//         res.statusCode = 404
//         res.end('no such location')
//     })
// }).listen(8088,function () {
//     console.log('webhook启动成功');
// })
//
// handler.on('error', function (err) {
//     console.error('Error:', err.message)
// })
//
// handler.on('push', function (event) {
//     console.log('Received a push event for %s to %s',
//         event.payload.repository.name,
//         event.payload.ref)
//     run_cmd('sh', ['../nginx-restart.sh', event.payload.repository.name], function (text) {
//         console.log(text)
//     });
// })
//
// handler.on('issues', function (event) {
//     console.log('Received an issue event for %s action=%s: #%d %s',
//         event.payload.repository.name,
//         event.payload.action,
//         event.payload.issue.number,
//         event.payload.issue.title)
// })
