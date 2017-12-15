/* ========================================================================
 * Qencode: qencode.js v0.9.1
 * https://www.qencode.com/lib/eqncode.js
 * ========================================================================
 * Copyright 2016-2017 Qencode, Inc.
 * Licensed under MIT (https://www.qencode.com/lib/LICENSE)
 * ======================================================================== */



var new_jQuery;
var jQ = false;
function initJQ() {
    if (typeof(jQuery) == 'undefined') {
        if (!jQ) {
           jQ = true;
                document.write('<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>');
        }
        setTimeout('initJQ()', 50);
    }else{
        if($.fn.jquery < '1.7.0'){
            document.write('<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>');
            new_jQuery = jQuery.noConflict();
            $ = new_jQuery;
        }
        var script = document.createElement('script');
        script.src = "https://code.jquery.com/ui/1.12.1/jquery-ui.js";
        document.head.appendChild(script);
        }
}

initJQ();


function initTUS() {
    //
}
initTUS();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }


var Qencode = (function () {
    var call_server = function (url, data, error_text, is_get, send_files) {
        var request_type = is_get === true ? 'GET' : 'POST';
        data = data === undefined ? {} : data;
        if (error_text === undefined) {
            error_text = 'error execute ' + url;
        }
        var request = {
            url: url,
            type: request_type,
            data: data,
            dataType: 'json',
            crossDomain: true,
            async: false,

            error : function(jqXHR, exception) {
                if (jqXHR.status === 0) {
                    console.log('Not connect.\n Verify Network.');
                } else if (jqXHR.status == 404) {
                    console.log('Requested page not found. [404]');
                } else if (jqXHR.status == 500) {
                    console.log('Internal Server Error [500].');
                } else if (exception === 'parsererror') {
                    console.log('Requested JSON parse failed.');
                } else if (exception === 'timeout') {
                    console.log('Time out error.');
                } else if (exception === 'abort') {
                    console.log('Ajax request aborted.');
                } else {
                    console.log('Uncaught Error.\n' + jqXHR.responseText);
                }
            }

        };

        if (request_type == 'POST' && send_files) {
            request.processData = false;
            request.contentType = false;
            request.cache = false;
        }

        var res = $.ajax(request);
        var response = null;
        try {
            response = $.parseJSON(res.responseText);
            if (!response) {
                response = {
                    'error': false,
                    'message': error_text
                };
            }
        }
        catch (err) {
            response = {
                'error': true,
                'message': error_text + '\n' +
                'Error description: ' + err.message + '\n'
            };
            // response.message += '\n' + res.responseText;
        }

        return response;
    };

    var call_server_get = function (url, data, error_text) {
        return call_server(url, data, error_text, true);


    };
    var call_server_post = function (url, data, error_text, send_files) {
        return call_server(url, data, error_text, false, send_files);

    };

    function _create_task(url, token) {
        var data = new FormData();
        data.append('token', token);
        return call_server_post(url, data, null, true);
    }

    function _start_encode(url, task_token, file_uuid, uri, profiles, transfer_method, payload) {
        var data = new FormData();
        data.append('task_token', task_token);
        data.append('tus', file_uuid);
        data.append('profiles', profiles.toString());
        data.append('uri', uri);
        data.append('payload', payload);
        if(transfer_method != null){
            data.append('transfer_method', transfer_method);
        }
        return call_server_post(url, data, null, true);
    }

    function _start_encode2(url, task_token, query) {
        var data = new FormData();
        data.append('task_token', task_token);
        data.append('query', JSON.stringify(query));
        return call_server_post(url, data, null, true);
    }

    var tus_upload = null;
    function _upload_file (file, options) {
        tus_upload = new tus.Upload(file, options);
        try{
            tus_upload.start();
        }catch (e){
            console.log('Tus error ' + e.name + ":" + e.message + "\n" + e.stack);
        }
    }

    function _get_status(url, tokens) {
        var data = new FormData();
        data.append('task_tokens', tokens);
        return call_server_post(url, data, null, true);
    }

    var defaultOptions = {
        interval: 15,
        mainServer: 'https://api-qa.qencode.com'
    };

    // --- lib ---

    function Qencode(token, options) {
        _classCallCheck(this, Qencode);
        this.options = defaultOptions;
        this.options.token = token;
        this.options.query = options;
        this.masterServer = '';
        this.task_token = '';
    }

    Qencode.prototype.start_encode = function (callback/*_success*/, callback_process) {
        var token = this.options.token;
        var create_task_response = _create_task(this.options.mainServer + '/v1/create_task', token);
        this.task_token = create_task_response.task_token;
        if (create_task_response.error){
            callback(create_task_response);
            return;
        }
        if (this.options.query.query.source != undefined && this.options.query.query.source != '' && this.options.query.query.source != null ) {
            var start_encode_response = _start_encode2(this.options.mainServer + '/v1/start_encode2',
                this.task_token,
                this.options.query
            );
            this.masterServer = start_encode_response.status_url;
            if (start_encode_response.error) {
                callback(start_encode_response);
                return;
            }
            start_encode_response.task_token = this.task_token;
            callback(start_encode_response);
        }
        else if(this.options.query.query.file != undefined && this.options.query.query.file != '' &&
            this.options.query.query.file != null ) {
            var upload_url = create_task_response.upload_url + '/' + this.task_token;
            var task_token = this.task_token;
            var transfer_method = this.options.transfer_method;
            var payload =  this.options.payload;
            var encode_options = this.options;
            var _options = {
                endpoint: upload_url,
                retryDelays: [0, 1000, 3000, 5000],
                metadata: {filename: encode_options.query.query.file.name},
                onProgress: function (bytesUploaded, bytesTotal) {
                    //console.log('tus uploading: ', bytesUploaded, bytesTotal);
                    var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
                    var tus_upload_response = {
                        'percentage': percentage
                    };
                    callback_process(tus_upload_response);
                },
                onSuccess: function () {
                    var url = tus_upload.url.split("/");
                    var file_uuid = url[url.length - 1];
                    var uri = 'tus:' + file_uuid;
                    /*var start_encode_response = _start_encode(url3,
                        task_token,
                        file_uuid,
                        uri,
                        profile_ids,
                        transfer_method,
                        payload
                    );*/
                    encode_options.query.query.source = uri;
                    var start_encode_response = _start_encode2(encode_options.mainServer + '/v1/start_encode2',
                        task_token,
                        encode_options.query
                    );
                    //if (start_encode_response.error){
                    if (start_encode_response.error == 1){
                        callback(start_encode_response);
                        return;
                    }
                    start_encode_response.task_token = task_token;
                    callback(start_encode_response);
                }
            };
            _upload_file(encode_options.query.query.file, _options);
        }
        else
        {
            callback({error: true, message: 'file or url is required'});
        }
    };

    Qencode.prototype.status = function (data, callback) {

        if((data.token == undefined || data.token == '' || data.token == null) ||
            (data.url == undefined || data.url == '' || data.url == null)){
            callback({error: true, message: 'token and url is required'});
            return;
        }

        var interval =  this.options.interval >= 15 ? this.options.interval : 15;

        var statuses = _get_status(data.url, [data.token]);
        callback(statuses);
        if(statuses.error) return;

        var timer = setInterval(function () {
            var statuses = _get_status(data.url, [data.token]);
            callback(statuses);
            if(statuses.error) clearInterval(timer);
            var status = statuses.statuses[data.token];
            if (status['status'] == "completed") clearInterval(timer);
        }, interval*1000);

    };

return Qencode;

})();

