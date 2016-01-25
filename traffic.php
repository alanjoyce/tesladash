<?php
$left = floatval($_GET["left"]);
$right = floatval($_GET["right"]);
$bottom = floatval($_GET["bottom"]);
$top = floatval($_GET["top"]);

$url = "https://www.waze.com/rtserver/web/GeoRSS?os=60&atof=false&format=JSON&ma=200&mj=100&mu=100&sc=216672&jmu=0&types=alerts%2Ctraffic&left=" . $left . "&right=" . $right . "&bottom=" . $bottom . "&top=" . $top;

$json = file_get_contents($url);
echo $json;
?>
