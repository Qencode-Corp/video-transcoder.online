var token = '';
$.get("/backend/get_access_token.php", function(data, status) {
    token = data;
});

// $.file = '';

// $("input[type=file]").on("change", function () {
//     $.file = this.files[0];
// });

//updates progress bar displaying upload progress
function update_upload_progress(upload_progress) {

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

//this method will be called each 15 seconds to get job status, display progress and play video on completion
function poll_job_status(task_token, filename, response) {
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
            if (qencode.length == 1) {
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




//clears previous job data from the page
function clear_previous_job(qencode) {
    const myNode = document.getElementById("file_list");
    myNode.textContent = '';
    for (var i = 0; i < qencode.length; i++) {
        qencode[i].clear();
    }
    qencode = [];
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