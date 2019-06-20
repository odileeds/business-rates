#!/usr/bin/perl

if($ARGV[0]){ $place = $ARGV[0]; }


if(!$place){
	print "Make a GeoJSON file for the Local Authority.\nUsage: perl geojson.pl leeds\n\n";
	exit;
}

$lafile = "LA.geojson";
$status = "index.csv";

open(FILE,$status);
@lines = <FILE>;
close(FILE);
$code = "";
foreach $line (@lines){
	if($line =~ /^([0-9A-Z]+)\,$place/i){
		$code = $1;
	}
}


if(!-e $lafile){
	`wget -q -O $lafile "https://opendata.arcgis.com/datasets/85305f03b26547ac8ef62c0ad13aaa52_0.geojson"`;
}

print $code."\n";

open(GEOJSON,$lafile);
@lines = <GEOJSON>;
close(GEOJSON);

if($lines[0] =~ /(\{"type":"Feature","properties":\{"objectid":[0-9]+,"lad19cd":"$code.*?\{"type":"Polygon","coordinates":[\[\]\,\.\-\+0-9]+\}\})/){
	$json = "{\"type\":\"FeatureCollection\",\"features\":[$1]}\n";
	$json =~ s/([0-9]\.[0-9]{5})[0-9]+/$1/g;
}
$place =~ s/\s/-/g;
open(FILE,">","data/$place.geojson");
print FILE $json;
close(FILE);