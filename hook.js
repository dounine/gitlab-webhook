var http = require('http')
var createHandler = require('gitlab-webhook-handler')
var handler = createHandler({path: '/webhook'})
var cmd = require('node-cmd');
var fs = require('fs')
var password = 'abc123'
var port = 7777

fs.readFile('/home/lake/github/gitlab-webhook/password.txt', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    } else {
        password = data;
    }
})

function getQueryString(url, name) {
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for (var i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = decodeURIComponent(strs[i].split("=")[1]);
        }
    }
    return theRequest;
}

http.createServer(function (req, res) {
    var mode = getQueryString(req.url, 'mode')['webhook?mode'];
    console.log('mode:' + mode)
    if (mode == undefined || (mode != undefined && mode == "")) {
        res.writeHead(200, {'content-type': 'application/json'})
        var msg = '{"code":1,"msg":"mode参数不能为空."}'
        console.log(msg)
        res.end(msg)
        return;
    }

    if (mode != 'node' && mode != 'java') {
        res.writeHead(200, {'content-type': 'application/json'})
        var msg = '{"code":1,"msg":"mode参数只能为java或者node."}'
        console.log(msg)
        res.end(msg)
        return;
    }
    if (password.trim() == req.headers['x-gitlab-token']) {
        req.headers['mode'] = mode;
        handler(req, res, function (err) {
            res.writeHead(200, {'content-type': 'application/json'})
            var msg = '{"code":404,"msg":"没有这个地扯"}'
            res.end(msg)
            console.log(msg)
        })
    } else {
        res.writeHead(200, {'content-type': 'application/json'})
        var msg = '{"code":1,"msg":"密码错误."}'
        res.end(msg)
        console.log(msg)
    }

}).listen(port, function () {
    console.log("Gitlab Hook Server running at http://0.0.0.0:" + port + "/webhook");
});


handler.on('error', function (err) {
    console.error('错误:', err.message)
})

handler.on('push', function (event) {
    console.log('event push')
    console.log(event.payload.repository.name)
    cmd.get('/root/issp/docker/' + event.mode + '/run.sh', function (err, data, stderr) {
        console.log(data)
        if (stderr) {
            console.log("脚本错误:" + stderr)
        }
    })
})

handler.on('issues', function (event) {
    console.log('Received an issue event for %s action=%s: #%d %s',
        event.payload.repository.name,
        event.payload.action,
        event.payload.issue.number,
        event.payload.issue.title)
})
