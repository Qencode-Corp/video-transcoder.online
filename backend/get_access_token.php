<?php

$result = curl_request("https://api-qa.qencode.com/v1/access_token", "api_key=5a1d8a395cca6");
$decode = json_decode($result);
$token = $decode->{'token'};
echo $token;

function curl_request($url, $params)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS,
        $params);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $server_output = curl_exec($ch);
    curl_close($ch);
    return $server_output;
}