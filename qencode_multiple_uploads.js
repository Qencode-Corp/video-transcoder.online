/* ========================================================================
 * Qencode: qencode.js v1.0
 * https://www.qencode.com/lib/qencode.js
 * ========================================================================
 * Copyright 2016-2018 Qencode, Inc.
 * Licensed under MIT (https://www.qencode.com/lib/LICENSE)
 * ======================================================================== */


var new_jQuery;
var jQ = false;
function initJQ() {
    if (typeof (jQuery) == 'undefined') {
        if (!jQ) {
            jQ = true;
            document.write('<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>');
        }
        setTimeout('initJQ()', 50);
    } else {
        if ($.fn.jquery < '1.7.0') {
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

            error: function (jqXHR, exception) {
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

    function _start_encode(url, task_token, options) {
        var data = new FormData();
        data.append('task_token', task_token);
        data.append('profiles', options.profile_ids.toString());
        if (options.uri) {
            data.append('uri', options.uri);
        }
        if (options.stitch) {
            data.append('stitch', options.stitch);
        }
        if (options.transfer_method) {
            data.append('transfer_method', transfer_method);
        }
        if (options.payload) {
            data.append('payload', options.payload);
        }
        if (options.output_path_variables) {
            data.append('output_path_variables', options.output_path_variables);
        }
        if (options.subtitles) {
            data.append('subtitles', subtitles);
        }
        return call_server_post(url, data, null, true);
    }

    function _start_encode2(url, task_token, options) {
        var data = new FormData();
        data.append('task_token', task_token);
        data.append('query', JSON.stringify({ "query": options.query }));
        if (options.payload) {
            data.append('payload', options.payload);
        }
        return call_server_post(url, data, null, true);
    }

    this.tus_url = null;
    tus_upload = [];
    async function _upload_file(file, options) {
        console.log('start upload file' + file.name)
        var ss = new tus.Upload(file, options);
        // var url = tus_upload.url.split("/");
        // var file_uuid = url[url.length - 1];   
        // var uri = 'tus:' + file_uuid;
        // this.tus_url=uri;
        tus_upload.push(ss);

        try {
            ss.start();
        } catch (e) {
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
        endpoint: 'https://api.qencode.com'
    };

    // --- lib ---

    function Qencode(token, data, options) {
        _classCallCheck(this, Qencode);
        if (options == undefined) {
            this.options = defaultOptions;
        } else {
            this.options = options;
        }
        this.options.token = token;


        if ('query' in data) {
            this.options.query = data.query;
            if ('file' in data.query)
                this.options.file = data.query.file;
        }
        else {
            this.options.profile_ids = data.profiles;
            if ('file' in data)
                this.options.file = data.file;
            if ('uri' in data)
                this.options.uri = data.uri;
            if ('transfer_method' in data) {
                this.options.transfer_method = data.transfer_method;
            }
            if ('payload' in data) {
                this.options.payload = data.payload;
            }
            if ('subtitles' in data) {
                this.options.subtitles = data.subtitles;
            }
            if ('start_time' in data) {
                this.options.start_time = data.start_time;
            }
            if ('duration' in data) {
                this.options.duration = data.duration;
            }
            if ('output_path_variables' in data) {
                this.options.output_path_variables = data.output_path_variables;
            }
        }
        this.task_token = '';
        this.upload_url = '';
    }

    Qencode.prototype.start = function (job_done_callback, upload_progress_callback,chunk_size=0) {
        this._launch_job(
            this._start_encode_with_callback,
            job_done_callback,
            upload_progress_callback,
            chunk_size
        );
    };

    Qencode.prototype.start_custom = async function (job_done_callback, upload_progress_callback,chunk_size=0) {
        await this._launch_job(
            this._start_encode2_with_callback,
            job_done_callback,
            upload_progress_callback,
            chunk_size
        );
    };
    Qencode.prototype.create_task = function (){
        var token = this.options.token;
        var create_task_response = _create_task(this.options.endpoint + '/v1/create_task', token);
        this.task_token = create_task_response.task_token;
        this.upload_url = create_task_response.upload_url;
        console.log('Start task token' + this.task_token)
        if (create_task_response.error) {
            job_done_callback(create_task_response);
            return false;
        }
        return true;
    }


    Qencode.prototype._launch_job = async function (launch_job_func, job_done_callback, upload_progress_callback, chunk_size) {
        console.log('File' + this.options.file.name)
        if (this.options.file) {
            var upload_url = this.upload_url + '/' + this.task_token;
            var task_token = this.task_token;
            var encode_options = this.options;
            var chunk_size_file = chunk_size;
            if (chunk_size_file <= 0) {
                chunk_size_file = Math.round(this.options.file.size / 30);
                var min_size = 200000;
                var max_size = 104857600;
                if (chunk_size_file < min_size) {
                    chunk_size_file = min_size;
                }
                else {
                    if (chunk_size_file > max_size) {
                        chunk_size_file = max_size;
                    }
                }
            }

            var upload_options = this._get_upload_options(task_token,
                upload_url,
                encode_options.file.name,
                chunk_size_file,
                encode_options,
                launch_job_func,
                upload_progress_callback,
                job_done_callback
            );
            await _upload_file(encode_options.file, upload_options);
        }
        else if (this.options.uri || this.options.stitch || this.options.query) {
            launch_job_func(this.task_token, this.options, job_done_callback)
        }
        else {
            job_done_callback({ error: true, message: 'File or video url is required' });
        }
    };




   
    Qencode.prototype._get_upload_options = function (task_token, upload_url,
        filename,
        chunk_size,
        encode_options,
        launch_job_func,
        upload_progress_callback,
        job_done_callback) {
        return {
            endpoint: upload_url,
            chunkSize: chunk_size,
            retryDelays: [0, 1000, 3000, 5000],
            metadata: { filename: filename },
            onError: async function (error) {
                console.log("Failed because: " + error)
            },
            onProgress: async function (bytesUploaded, bytesTotal) {
                var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
                var tus_upload_response = {
                    'percentage': percentage,
                    'task_token':task_token,
                    'filename':filename
                };
                if (upload_progress_callback)
                    upload_progress_callback(tus_upload_response);
            },
            onSuccess: async function () {
                console.log(tus_upload);
                if (tus_upload.length > 0) {
                   
                    var tt_tus_upload = tus_upload.find(tt => tt.file.name == filename);
                    const index = tus_upload.indexOf(tt_tus_upload);
                    var url = tt_tus_upload.url.split("/");
                    if (index > -1) {
                        tus_upload.splice(index, 1);
                    }
                    var file_uuid = url[url.length - 1];

                    var uri = 'tus:' + file_uuid;
                    console.log('tus=' + uri);
                    if ('query' in encode_options) {
                        encode_options.query.source = uri;
                    }
                    else {
                        encode_options.uri = uri;
                    }
                    launch_job_func(task_token, encode_options, job_done_callback);

                }

            }
        }
    };

    Qencode.prototype._start_encode_with_callback = function (task_token, options, callback) {
        var start_encode_response = _start_encode(options.endpoint + '/v1/start_encode',
            task_token,
            options
        );

        _process_launch_job_callback(task_token, start_encode_response, callback);
    };

    Qencode.prototype._start_encode2_with_callback = function (task_token, options, callback) {
        var start_encode_response = _start_encode2(options.endpoint + '/v1/start_encode2',
            task_token,
            options
        );

        _process_launch_job_callback(task_token, start_encode_response, callback);
    };

    function _process_launch_job_callback(task_token, start_encode_response, callback) {
        if (start_encode_response.error) {
            callback(start_encode_response);
            return;
        }
        start_encode_response.task_token = task_token;
        callback(start_encode_response);
    }

    Qencode.prototype.status = function (data, callback) {

        if ((data.token == undefined || data.token == '' || data.token == null) ||
            (data.url == undefined || data.url == '' || data.url == null)) {
            callback(data.token,data.filename, { error: true, message: 'token and url is required' });
            return;
        }

        var interval = this.options.interval >= 15 ? this.options.interval : 15;

        var statuses = _get_status(data.url, [data.token]);
        callback(data.token, data.filename, statuses);
        if (statuses.error) return;

        var status_url = data.url;
        var timer = setInterval(function () {
            var statuses = _get_status(status_url, [data.token]);
            callback(data.token,data.filename, statuses);
            if (statuses.error) clearInterval(timer);
            var status = statuses.statuses[data.token];
            if (status['status_url'])
                status_url = status['status_url'];
            if (status['status'] == "completed" || status['error'] == 1) clearInterval(timer);
        }, interval * 1000);
        this.timer = timer;

    };

    Qencode.prototype.clear = function () {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.task_token = undefined;
        this.options = undefined;
    }

    return Qencode;

})();