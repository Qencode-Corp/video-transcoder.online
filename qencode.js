/* ========================================================================
 * Qencode: qencode.js v1.2
 * https://www.qencode.com/lib/qencode.js
 * ========================================================================
 * Copyright 2016-2020 Qencode, Inc.
 * Licensed under MIT (https://www.qencode.com/lib/LICENSE)
  ======================================================================== */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }


var Qencode = (function() {
    var call_server = async function(url, data, error_text, is_get, send_files) {
        var request_type = is_get === true ? 'GET' : 'POST';
        data = data === undefined ? {} : data;
        if (error_text === undefined || error_text === null) {
            error_text = 'error execute ' + url;
        }
        try {
            const response = await fetch(url, {
                method: request_type,
                mode: 'cors',
                cache: 'no-cache',
                body: data
            });
            if (response.status === 0) {
                console.log('Not connect.\n Verify Network.');
            } else if (response.status == 404) {
                console.log('Requested page not found. [404]');
            } else if (response.status == 500) {
                console.log('Internal Server Error [500].');
            }
            var result = await response.json();
            console.log("Response:" + result);
            if (!result) {
                result = {
                    'error': false,
                    'message': error_text
                };
            }


        } catch (err) {
            result = {
                'error': true,
                'message': 'Error description: ' + err.message + '\n'
            };
            console.log("Connection error", err);
        }
        return result;


    };

    var call_server_get = async function(url, data, error_text) {
        return await call_server(url, data, error_text, true);
    };

    var call_server_post = async function(url, data, error_text, send_files) {
        return await call_server(url, data, error_text, false, send_files);
    };

    async function _create_task(url, token) {
        var data = new FormData();
        data.append('token', token);
        return await call_server_post(url, data, null, true);
    }

    async function _start_encode(url, task_token, options) {
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
        return await call_server_post(url, data, null, true);
    }

    async function _start_encode2(url, task_token, options) {
        var data = new FormData();
        data.append('task_token', task_token);
        data.append('query', JSON.stringify({ "query": options.query }));
        if (options.payload) {
            data.append('payload', options.payload);
        }
        return await call_server_post(url, data, null, true);
    }

    var tus_upload = [];

    function _upload_file(file, options) {
        var ss = new tus.Upload(file, options);
        tus_upload.push(ss);
        try {
            ss.start();
        } catch (e) {
            console.log('Tus error ' + e.name + ":" + e.message + "\n" + e.stack);
        }
    }



    async function _get_status(url, tokens) {
        var data = new FormData();
        data.append('task_tokens', tokens);
        data
        return await call_server_post(url, data, null, true);
    }

    var defaultOptions = {
        interval: 15,
        endpoint: 'https://api.qencode.com1'
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
        } else {
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
        this.tus_url = null;
    }

    Qencode.prototype.start = function(job_done_callback, upload_progress_callback, chunk_size = 0, parallel_num = 1) {
        this._launch_job(
            this._start_encode_with_callback,
            job_done_callback,
            upload_progress_callback,
            chunk_size, parallel_num
        );
    };

    Qencode.prototype.start_custom = async function(job_done_callback, upload_progress_callback, chunk_size = 0, parallel_num = 1) {
        await this._launch_job(
            this._start_encode2_with_callback,
            job_done_callback,
            upload_progress_callback,
            chunk_size, parallel_num
        );
    };

    Qencode.prototype.start_custom_parallel = async function(job_done_callback, upload_progress_callback, chunk_size = 0) {
        await this._launch_job_parallel(
            this._start_encode2_with_callback,
            job_done_callback,
            upload_progress_callback,
            chunk_size
        );
    };

    Qencode.prototype.create_task = async function(job_done_callback) {
        var token = this.options.token;
        var create_task_response = await _create_task(this.options.endpoint + '/v1/create_task', token);
        this.task_token = create_task_response.task_token;
        this.upload_url = create_task_response.upload_url;
        if (create_task_response.error) {
            job_done_callback(create_task_response);
            return false;
        }
        return true;
    }



    Qencode.prototype._launch_job = async function(launch_job_func, job_done_callback, upload_progress_callback, chunk_size, parallel_num) {
        if (this.task_token == '' || this.task_token == null || this.task_token === undefined) {
            var isTaskCreate = await this.create_task(job_done_callback);
            if (isTaskCreate === false)
                return;
        }

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
                } else {
                    if (chunk_size_file > max_size) {
                        chunk_size_file = max_size;
                    }
                }
            }

            var upload_options = this._get_upload_options(task_token,
                upload_url,
                encode_options.file.name,
                chunk_size_file,
                parallel_num,
                encode_options,
                launch_job_func,
                upload_progress_callback,
                job_done_callback
            );
            _upload_file(encode_options.file, upload_options);
        } else if (this.options.uri || this.options.stitch || this.options.query) {
            launch_job_func(this.task_token, this.options, job_done_callback)
        } else {
            job_done_callback({ error: true, message: 'File or video url is required' });
        }
    };

    Qencode.prototype._get_upload_options = function(task_token, upload_url,
        filename,
        chunk_size,
        parallel_num,
        encode_options,
        launch_job_func,
        upload_progress_callback,
        job_done_callback) {
        return {
            endpoint: upload_url,
            chunkSize: chunk_size,
            parallelUploads: parallel_num,
            retryDelays: [0, 1000, 3000, 5000],
            metadata: { filename: filename },
            onProgress: function(bytesUploaded, bytesTotal) {
                var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
                var tus_upload_response = {
                    'percentage': percentage,
                    'task_token': task_token,
                    'filename': filename
                };
                if (upload_progress_callback)
                    upload_progress_callback(tus_upload_response);
            },
            onSuccess: function() {
                if (tus_upload.length > 0) {
                    var tt_tus_upload = tus_upload.find(tt => tt.file.name == filename);
                    const index = tus_upload.indexOf(tt_tus_upload);
                    var url = tt_tus_upload.url.split("/");
                    if (index > -1) {
                        tus_upload.splice(index, 1);
                    }
                    var file_uuid = url[url.length - 1];

                    var uri = 'tus:' + file_uuid;
                    if ('query' in encode_options) {
                        encode_options.query.source = uri;
                    } else {
                        encode_options.uri = uri;
                    }
                    launch_job_func(task_token, encode_options, job_done_callback);

                }
            }
        }
    };

    Qencode.prototype._start_encode_with_callback = function(task_token, options, callback) {
        _start_encode(options.endpoint + '/v1/start_encode',
            task_token,
            options
        ).then((start_encode_response) => {
            _process_launch_job_callback(task_token, start_encode_response, callback);

        });


    };

    Qencode.prototype._start_encode2_with_callback = function(task_token, options, callback) {
        _start_encode2(options.endpoint + '/v1/start_encode2',
            task_token,
            options
        ).then((start_encode_response) => {
            _process_launch_job_callback(task_token, start_encode_response, callback);
        });


    };

    function _process_launch_job_callback(task_token, start_encode_response, callback) {
        if (start_encode_response.error) {
            callback(start_encode_response);
            return;
        }
        start_encode_response.task_token = task_token;
        callback(start_encode_response);
    }

    Qencode.prototype.status = function(data, callback) {

        if ((data.token == undefined || data.token == '' || data.token == null) ||
            (data.url == undefined || data.url == '' || data.url == null)) {
            callback(data.token, data.filename, { error: true, message: 'token and url is required' });
            return;
        }

        var interval = this.options.interval >= 15 ? this.options.interval : 15;

        _get_status(data.url, [data.token]).then((statuses) => {
            callback(data.token, statuses, data.filename);
            if (statuses.error) return;

            var status_url = data.url;
            var timer = setInterval(function() {
                _get_status(status_url, [data.token]).then((statuses) => {
                    callback(data.token, statuses, data.filename);
                    if (statuses.error) clearInterval(timer);
                    var status = statuses.statuses[data.token];
                    if (status['status_url'])
                        status_url = status['status_url'];
                    if (status['status'] == "completed" || status['error'] == 1) clearInterval(timer);
                });

            }, interval * 1000);
            this.timer = timer;
        });


    };





    Qencode.prototype.clear = function() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.task_token = undefined;
        this.tus_url = undefined;
        this.options = undefined;
    }

    return Qencode;

})();