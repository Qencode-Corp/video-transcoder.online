var token = '';
$.get("/backend/get_access_token.php", function(data, status) {
    token = data;
});

$.file = undefined;

$("input[type=file]").on("change", function() {
    $.file = this.files[0];
});

//updates progress bar displaying upload progress
function update_upload_progress(upload_progress) {
    var percentage = upload_progress.percentage;
    if (percentage <= 0) {
        $('.progress-bar').css("width", percentage + "%").text("Starting");
    } else {
        $('.progress-bar').css("width", percentage + "%").text("Uploading: " + percentage + " %");
    }
}

function update_multiple_upload_progress(upload_progress) {

    var percentage = upload_progress.percentage;
    var task_id = upload_progress.task_token;
    var file_name = upload_progress.filename;
    var name = '#progress-bar_' + task_id
    if (percentage <= 0) {
        $(name).css("width", percentage + "%").text("Starting uploading" + file_name);
    } else {
        $(name).css("width", percentage + "%").text("Uploading file " + file_name + ": " + percentage + " %");
    }
}

function poll_job_status_multiple_uploads(task_token, response, filename) {
    var id_progress_bar = '#progress-bar_' + task_token;
    var id_progress_bar_0 = '#progress-bar-0_' + task_token;
    var id_a = '#link_' + task_token;
    var status_or = response.statuses[task_token].status;
    var status = status_or.charAt(0).toUpperCase() + status_or.slice(1);
    var percent = response.statuses[task_token].percent;
    if (percent == 0) {
        $(id_progress_bar).hide();
        $(id_progress_bar_0).show();
        $(id_progress_bar_0).css("width", "100%").text(status + ": 0%");
    } else {
        $(id_progress_bar_0).hide();
        $(id_progress_bar).show();
        $(id_progress_bar).css("width", percent + "%").text('Status ' + filename + ' - ' + status + ": " + percent.toFixed(2) + " %");
        if (status_or == "completed" && response.statuses[task_token].videos.length > 0) {
            var manifestUri = response.statuses[task_token].videos[0].url;
            $(id_a).text('Download ' + filename).attr("href", manifestUri);
            $(id_a).show();
            console.log('Output video url: ' + manifestUri);
            if (qencode_arr.length == 1) {
                $('#video').css("display", "block");
                if (manifestUri.endsWith('.mpd') || manifestUri.endsWith('.m3u8')) {
                    initApp();
                } else {
                    var video = $('#video')[0];
                    video.src = manifestUri;
                    video.load();
                    video.play();
                }
            }
        }
    }
}



function add_progress_bar(task_token) {
    var id_progress_bar = 'progress-bar_' + task_token;
    var id_progress_bar_0 = 'progress-bar-0_' + task_token;
    var id_a = 'link_' + task_token;
    var iDiv = document.createElement("div");
    iDiv.className = 'progress-striped active';
    iDiv.style.width = '100%';
    var iDiv_progress_bar = document.createElement("div");
    var iDiv_progress_bar_0 = document.createElement("div");
    var ia_progress_bar = document.createElement("a");

    ia_progress_bar.id = id_a;
    iDiv_progress_bar.id = id_progress_bar;
    iDiv_progress_bar_0.id = id_progress_bar_0;


    iDiv_progress_bar.className = 'progress-bar';
    iDiv_progress_bar_0.className = 'progress-bar-0';

    iDiv_progress_bar.style.height = '20px';
    iDiv_progress_bar_0.style.height = '20px';

    iDiv.appendChild(iDiv_progress_bar);
    iDiv.appendChild(iDiv_progress_bar_0);
    iDiv.appendChild(ia_progress_bar);
    document.getElementById('file_list').appendChild(iDiv);

    var id_bar = '#' + id_progress_bar;
    var id_bar_0 = '#' + id_progress_bar_0;
    var id_aa = '#' + id_a;
    $(id_bar).show();
    $(id_bar_0).hide();
    $(id_aa).hide();
}



//this method will be called each 15 seconds to get job status, display progress and play video on completion
function poll_job_status(task_token, response) {
    var status_or = response.statuses[task_token].status;
    var status = status_or.charAt(0).toUpperCase() + status_or.slice(1);
    var percent = response.statuses[task_token].percent;
    if (percent == 0) {
        $('.progress-bar').hide();
        $('.progress-bar-0').show();
        $('.progress-bar-0').css("width", "100%").text(status + ": 0%");
    } else {
        $('.progress-bar-0').hide();
        $('.progress-bar').show();
        $('.progress-bar').css("width", percent + "%").text(status + ": " + percent.toFixed(2) + " %");
        if (status_or == "completed" && response.statuses[task_token].videos.length > 0) {
            var manifestUri = response.statuses[task_token].videos[0].url;
            console.log('Output video url: ' + manifestUri);
            $('#video').css("display", "block");
            if (manifestUri.endsWith('.mpd') || manifestUri.endsWith('.m3u8')) {
                initApp();
            } else {
                var video = $('#video')[0];
                video.src = manifestUri;
                video.load();
                video.play();
            }
        }
    }
}

//clears previous job data from the page
function clear_previous_job(qencode) {
    $('.progress-bar').hide();
    $('.progress-bar-0').show();
    qencode.clear();
    $('#video').css("display", "none");
}

function clear_previous_job_miltiple_uploads(qencode_arr) {
    const myNode = document.getElementById("file_list");
    myNode.textContent = '';
    for (var i = 0; i < qencode_arr.length; i++) {
        qencode_arr[i].clear();
    }
    qencode_arr = [];
    $('#video').css("display", "none");
}


/**** Shaka Player initialization - used to play adaptive streaming media (HLS or MPEG-DASH)****/
function initApp(url) {
    shaka.polyfill.installAll();
    if (shaka.Player.isBrowserSupported()) {
        initPlayer(url);
    } else {
        console.error('Browser not supported!');
    }
}

function initPlayer(url) {
    var video = document.getElementById('video');
    var player = new shaka.Player(video);
    window.player = player;
    player.addEventListener('error', onErrorEvent);
    player.load(url).then(function() {
        console.log('The video has now been loaded!');
    }).catch(onError);
}

function onErrorEvent(event) {
    onError(event.detail);
}

function onError(error) {
    console.error('Error code', error.code, 'object', error);
}

function get_name_id_element(value1 = '', value2 = '', value3 = '') {
    return value1 + value2 + value3;

}


function new_form(num_form) {
    var array_output_format = [{ value: 'mp4', name: "MP4" }, { value: 'advanced_hls', name: "HLS" },
        { value: 'advanced_dash', name: "MPEG - DASH" }, { value: 'webm', name: "MPWEBM" }
    ]

    var input_file_id = get_name_id_element('file', num_form);
    var output_format_id = get_name_id_element('output_format', num_form);
    var video_codec_id = get_name_id_element('video_codec', num_form);
    var destination_id = get_name_id_element('destination', num_form);
    var size_w_id = get_name_id_element('size_w', num_form);
    var size_h_id = get_name_id_element('size_h', num_form);

    var parent_div = document.createElement("div");

    var choos_file_text_div = document.createElement("div");
    choos_file_text_div.innerText = 'Choose file';
    var input_file_text_div = document.createElement("div");
    var input_file_text = document.createElement("input");
    input_file_text.type = 'file';
    input_file_text.id = input_file_id;
    input_file_text.setAttribute("multiple", "");
    input_file_text.className = 'form-element';
    input_file_text_div.appendChild(input_file_text);

    var inserct_url_div = document.createElement("div");
    inserct_url_div.innerText = 'Or insert URL';
    var inserct_url_input_div = document.createElement("div");
    var inserct_url_imput = document.createElement("input");
    var inserct_url_imput_id = get_name_id_element('video_url', num_form);
    inserct_url_imput.type = 'text';
    inserct_url_imput.value = 'https://qa.qencode.com/static/1.mp4';
    inserct_url_imput.id = inserct_url_imput_id;
    inserct_url_imput.className = 'form-element';
    inserct_url_input_div.appendChild(inserct_url_imput);


    var output_format_div = document.createElement("div");
    output_format_div.innerText = 'Output Format';
    var input_output_format_div = document.createElement("div");
    var select_output = document.createElement("select");
    select_output.className = 'form-element';

    select_output.id = output_format_id;
    input_output_format_div.appendChild(select_output);

    for (var i = 0; i < array_output_format.length; i++) {
        var option = document.createElement("option");
        option.value = array_output_format[i].value;
        option.text = array_output_format[i].name;
        select_output.appendChild(option);
    }

    var video_codec_div = document.createElement("div");
    video_codec_div.innerText = 'Video Codec';
    var input_video_codec_div = document.createElement("div");
    var select_video_codec = document.createElement("select");
    select_video_codec.className = 'form-element';
    select_video_codec.id = video_codec_id;
    input_video_codec_div.appendChild(select_video_codec);



    var Destination_div = document.createElement("div");
    Destination_div.innerText = 'Destination';
    var input_Destination_div = document.createElement("div");
    var input_file_text = document.createElement("input");
    input_file_text.type = 'text';
    input_file_text.id = destination_id;
    input_file_text.className = 'form-element';
    input_Destination_div.appendChild(input_file_text);


    var size_div = document.createElement("div");
    size_div.innerText = 'Size, px';
    var input_size_div = document.createElement("div");
    var input_size_w = document.createElement("input");
    input_size_w.type = 'text';
    input_size_w.id = size_w_id;
    input_size_w.className = 'form-element-2';
    input_size_w.value = "320"
    input_size_div.appendChild(input_size_w);

    input_size_div.append(" x ");

    var input_size_h = document.createElement("input");
    input_size_h.type = 'text';
    input_size_h.id = size_h_id;
    input_size_h.value = "240"
    input_size_h.className = 'form-element-2';
    input_size_div.appendChild(input_size_h);




    var btn_ok_div = document.createElement("div");
    var btn_ok = document.createElement("button");
    btn_ok.className = 'form-element';
    btn_ok.innerText = "Ok";
    btn_ok.onclick = function() { click_ok_btn_multiple(num_form); };
    btn_ok_div.appendChild(btn_ok);

    var btn_add_div = document.createElement("div");
    var btn_add = document.createElement("button");
    btn_add.className = 'form-element';
    btn_add.innerText = "Add Form " + (num_form + 1);
    btn_add.onclick = function() { Creae_form(); };
    btn_add_div.appendChild(btn_add);


    parent_div.appendChild(choos_file_text_div);
    parent_div.appendChild(input_file_text_div);

    parent_div.appendChild(inserct_url_div);
    parent_div.appendChild(inserct_url_input_div);

    parent_div.appendChild(output_format_div);
    parent_div.appendChild(input_output_format_div);

    parent_div.appendChild(video_codec_div);
    parent_div.appendChild(input_video_codec_div);

    parent_div.appendChild(Destination_div);
    parent_div.appendChild(input_Destination_div);


    parent_div.appendChild(size_div);
    parent_div.appendChild(input_size_div);

    parent_div.appendChild(btn_ok_div);
    parent_div.appendChild(btn_add_div);

    document.getElementById('list_forms').appendChild(parent_div);
    select_output.onchange = function() { load_codecs_multiple(num_form); };
    load_codecs_multiple(num_form);
}

var webm_codecs_multiple = {
    "VP8": "libvpx",
    "VP9": "libvpx-vp9"
};

var codecs_multiple = {
    "H.264 (MPEG-4 Part 10)": "libx264",
    "H.265 (MPEG-H PART2/HEVC)": "libx265"
};

function load_codecs_multiple(num_id = '') {
    var id_video_codec = "#video_codec" + num_id;
    var id_output_format = "#output_format" + num_id + " option:selected";
    var $el = $(id_video_codec);
    $el.empty();
    var output_format = $(id_output_format).val();
    if (output_format == 'webm') {
        $.each(webm_codecs_multiple, function(key, value) {
            $el.append($("<option></option>")
                .attr("value", value).text(key));
        });
    } else {
        $.each(codecs_multiple, function(key, value) {
            $el.append($("<option></option>")
                .attr("value", value).text(key));
        });
    }
};

function click_ok_btn_multiple(num_form = '') {

    var input_file_id = "input[id=file]".replace("file", "file" + num_form);
    var id_video_url = "#video_url" + num_form;
    var id_output_format = "#output_format" + num_form + " option:selected";
    var video_codec_id = "#video_codec" + num_form + " option:selected";
    var destination_id = "#" + get_name_id_element('destination', num_form);
    var size_w_id = "#" + get_name_id_element('size_w', num_form);
    var size_h_id = "#" + get_name_id_element('size_h', num_form);

    if (token != '') {
        var output_format = $(id_output_format).val();
        var format = {
            "output": $(id_output_format).val(),
            "destination": $(destination_id).val()
        };

        if (output_format == "advanced_hls" || output_format == "advanced_dash") {
            var stream = {
                "size": $(size_w_id).val() + "x" + $(size_h_id).val(),
                "video_codec": $(video_codec_id).val(),
            };
            format["stream"] = [stream];
        } else {
            format["size"] = $(size_w_id).val() + "x" + $(size_h_id).val();
            format["video_codec"] = $(video_codec_id).val();
        }
        var data = [];
        var file_input = $(input_file_id).get(0);
        if (file_input.files.length == 0) {
            data.push({
                "source": $(id_video_url).val(),
                "format": [format]
            });
        } else {

            for (var i = 0; i < file_input.files.length; ++i) {
                data.push({
                    "file": file_input.files[i],
                    "format": [format]
                });
            }

        }

        var options = {
            interval: 15, //status polling interval
            endpoint: 'https://api.qencode.com' //api endpoint
        };

        for (var i = 0; i < data.length; i++) {
            // var nn = 'Name'+i;
            // var oo = new TestObject(nn);
            // oo.start_custom();
            run_qencode(data[i], options)
        }
    }
}


async function run_qencode_multiple(data, options) {
    var name = '';
    if (data.file) {
        name = data.file.name;
    } else {
        var url = data.source.split("/");
        var file_uuid = url[url.length - 1];
        name = file_uuid;
    }
    var ss = new Qencode(token, {
        "query": data
    }, options);
    qencode_arr.push(ss);
    var is_good = ss.create_task(function(start_response) {
        if (!start_response.error) {

            ss.status({
                    token: start_response.task_token,
                    url: start_response.status_url,
                    filename: name
                },
                poll_job_status_multiple_uploads
            );
        } else {
            console.log("Error!!!")
            console.log(start_response)
        }
    });
    if (is_good) {
        add_progress_bar(ss.task_token);
        ss.start_custom(function(start_response) {
            if (!start_response.error) {
                ss.status({
                        token: start_response.task_token,
                        url: start_response.status_url,
                        filename: name
                    },
                    poll_job_status_multiple_uploads
                );
            } else {
                console.log("Error!!!")
                console.log(start_response)
            }
        }, update_multiple_upload_progress);
    }

}