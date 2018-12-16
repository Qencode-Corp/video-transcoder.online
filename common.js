var token = '';
$.get("/backend/get_access_token.php", function (data, status) {
    token = data;
});

$.file = '';

$("input[type=file]").on("change", function () {
    $.file = this.files[0];
});

//updates progress bar displaying upload progress
function update_upload_progress (upload_progress) {
    var percentage = upload_progress.percentage;
    if (percentage <= 0) {
        $('.progress-bar').css("width", percentage + "%").text("Starting");
    } else {
        $('.progress-bar').css("width", percentage + "%").text("Uploading: " + percentage + " %");
    }
}

//this method will be called each 15 seconds to get job status, display progress and play video on completion
function poll_job_status(task_token, response) {
    var status_or = response.statuses[task_token].status;
    var status = status_or.charAt(0).toUpperCase() + status_or.slice(1);
    var percent = response.statuses[task_token].percent;
    if(percent == 0){
        $('.progress-bar').hide();
        $('.progress-bar-0').show();
        $('.progress-bar-0').css("width", "100%").text(status + ": 0%");
    }else {
        $('.progress-bar-0').hide();
        $('.progress-bar').show();
        $('.progress-bar').css("width", percent + "%").text(status + ": " + percent.toFixed(2) + " %");
        if (status_or == "completed" && response.statuses[task_token].videos.length > 0) {
            var manifestUri = response.statuses[task_token].videos[0].url;
            console.log('Output video url: ' + manifestUri);
            $('#video').css("display", "block");
            if (manifestUri.endsWith('.mpd') || manifestUri.endsWith('.m3u8')){
                initApp();
            }else{
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