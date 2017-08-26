var http = require('http')
var createHandler = require('gitlab-webhook-handler')
var handler = createHandler({ path: '/webhook' })
var fs = require('fs')

function getQueryString(url,name) {
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
        }
    }
    return theRequest;
}

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
    var mode = getQueryString(req.url,'mode')['webhook?mode'];
    if(mode!='node'&&mode!='java'){
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end('{"code":400,"msg":"mode参数只能为java或者node."}')
        return;
    }
    fs.readFile('./password.txt', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        if(data==req.headers['x-gitlab-token']){
            handler(req, res, function (err) {
                res.statusCode = 404
                res.end('没有这个地扯')
            })
        }else{
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end('{"code":400,"msg":"密码错误."}')
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

    run_cmd('sh', ['./test.sh', event.payload.repository.name], function (text) {
        console.log(text)
    });
})

handler.on('issues', function (event) {
    // console.log('Received an issue event for %s action=%s: #%d %s',
    //     event.payload.repository.name,
    //     event.payload.action,
    //     event.payload.issue.number,
    //     event.payload.issue.title)
})
