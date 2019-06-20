#!/usr/bin/perl

$ifile = "index.csv";
$ffile = "format.html";
$sfile = "status.html";

%LAdata;

%months = ('Jan'=>"01",'Feb'=>'02','Mar'=>'03','Apr'=>'04','May'=>'05','Jun'=>'06','Jul'=>'07','Aug'=>'08','Sep'=>'09','Oct'=>'10','Nov'=>'11','Dec'=>'12');

open(FILE,$ifile);
@lines = <FILE>;
close(FILE);
@las;
for($i = 1; $i < @lines; $i++){
	$lines[$i] =~ s/[\n\r]//g;
	push(@las,$lines[$i]);
}

# Read in format definition, get the headings, and note if they are required
open(FILE,$ffile);
@lines = <FILE>;
close(FILE);
%format;
$nreq = 0;
$nhead = 0;
foreach $line (@lines){
	$req = 0;
	$line =~ s/[\n\r]//g;
	if($line =~ /<li><code>([^\<]+)<\/code>(<span class="req">)?/){
		if($2){ $req = 1; }
		$h = $1;
		$nhead++;
		$format{$h} = { 'required'=> $req, 'exact'=>1, 'got'=>0 };
		$format{simpleHeading($h)} = { 'required'=> $req };

		if($req){
			$nreq++;
		}
	}
}

for($i = 0; $i < @las; $i++){
	(@cols) = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$las[$i]);

	$hosted = 0;
	$cors = 0;
	$headings = 0;
	$empties = 0;
	$coordinates = 0;
	$okhead = 0;
	$okreq = 0;

	$file = $cols[2];

	$dateformats = 0;
	$currformats = 0;
	$latformats = 0;
	$lonformats = 0;
	$rows = 0;
	$score = 0;
	$lastmodified = "";
	$notgot = "";
	# Reset flag for if we have this column
	foreach $h (keys(%format)){
		if($format{$h}{'exact'}){
			$format{$h}{'got'} = 0;
		}
	}

	if($file){
		$lastmodified = "?";
		$cors = 0;
		if($file =~ /^http/){
			$hosted = 1;
			$score++;
			@resp = `curl -L -s -H "Origin: https://odileeds.org/projects/business-rates/" --head "$file"`;
			foreach $line (@resp){
				if($line =~ /Access-Control-Allow-Origin: (.*)/){
					$cors = 1;
				}
				if($line =~ /Last-Modified: (.*)/){
					$lastmodified = $1;
					if($lastmodified =~ /([0-9]{1,2}) ([A-Za-z]{3}) ([0-9]{4})/){
						$lastmodified = sprintf("%04d",$3)."-".$months{$2}."-".sprintf("%02d",$1);
					}
				}
			}
			if($cors == 1){
				$score++;
			}
			# Need to do a silent (no errors/progress) get that also follows redirects
			@csv = `curl -s -L "$file"`;
		}else{
			$cors = -1;
			open(FILE,$file);
			@csv = <FILE>;
			close(FILE);
			@resp = `stat $file`;
			foreach $line (@resp){
				if($line =~ /Modify: (.*)/){
					$lastmodified = $1;
					$lastmodified =~ s/.*([0-9]{4}-[0-9]{2}-[0-9]{2}).*/$1/g;
				}
			}
		}

		# Look into file
		$csv[0] =~ s/[\n\r]//g;
		@head = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$csv[0]);
		$collat = -1;
		$collon = -1;
		$colempty = -1;
		$coldate = -1;
		$colcurr = -1;
		for($j = 0; $j < (@head);$j++){
			$h = $head[$j];
			if($format{$h} && $format{$h}{'required'}){
				$okhead++;
				if($format{$h}{'exact'}){
					$format{$h}{'got'} = 1;
				}
			}
			if($format{$h}{'required'} || $format{simpleHeading($h)}{'required'}){ $okreq++; }
			
			# Empties?
			if($h eq "Occupied" || simpleHeading($h) eq "occupied"){ $colempty = $j; }
			if($h eq "Latitude" || simpleHeading($h) eq "latitude"){ $collat = $j; }
			if($h eq "Longitude" || simpleHeading($h) eq "longitude"){ $collon = $j; }
			if($h eq "Liability start date" || simpleHeading($h) eq "liabilitystartdate"){ $coldate = $j; }
			if($h eq "Rateable value" || simpleHeading($h) eq "rateablevalue"){ $colcurr = $j; }
		}
		$rows = @csv - 1;
		for($ii = 1; $ii < @csv; $ii++){
			@rcols = split(/,(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/,$csv[$ii]);
			if($coldate){
				if($rcols[$coldate] =~ /[0-9]{4}-[0-9]{2}-[0-9]{2}/){
					$dateformats++;
				}
			}
			if($colcurr >= 0){
				if($rcols[$colcurr] =~ /[0-9\.]+/){
					$currformats++;
				}
			}
			if($collat >= 0){
				if($rcols[$collat] =~ /[0-9\.\-\+]+/){
					$latformats++;
				}
			}
			if($collon >= 0){
				if($rcols[$collon] =~ /[0-9\.\-\+]+/){
					$lonformats++;
				}
			}
		}

		if($colempty >= 0){ $empties = 1; }
		if($collat >= 0){ $coordinates += 0.5; }
		if($collon >= 0){ $coordinates += 0.5; }
		
		# Add score for required headings
		if($nreq > 0){
			$score += $okreq/$nreq;
		}
		$score += $empties;
		if($rows > 0){
			$score += ($latformats+$lonformats)/(2*$rows);
			$score += $dateformats/$rows;
			$score += $currformats/$rows;
		}
		if($nreq > 0){
			$score += $okhead/$nreq;
		}
	}
	$score *= 100/8;
	$cols[1] =~ s/(^\"|\"$)//g;

	foreach $h (keys(%format)){
		if($format{$h}{'required'}){
			if($format{$h}{'exact'} && $format{$h}{'got'} == 0){
				if($notgot){ $notgot .= ", "; }
				$notgot .= "$h";
			}
		}
	}

	$LAdata{$cols[0]} = {
		'id'=>$cols[0],
		'name'=>$cols[1],
		'okhead'=>$okhead,
		'okreq'=>$okreq,
		'empties'=>$empties,
		'latformats'=>$latformats,
		'lonformats'=>$lonformats,
		'currformats'=>$currformats,
		'dateformats'=>$dateformats,
		'hosted'=>$hosted,
		'cors'=>$cors,
		'file'=>$file,
		'rows'=>$rows,
		'score'=>$score,
		'lastmodified'=>$lastmodified,
		'notgot'=>$notgot
	};

}

@LAcodes = reverse(sort{ $LAdata{$a}{'score'} <=> $LAdata{$b}{'score'}}(keys(%LAdata)));

$i = 0;
$lastscore = -1;
$previousposition = 1;
$status = "\t\t\t<table class=\"odi\">\n";
$status .= "\t\t\t\t<tr><th>Pos</th><th class=\"LA-name\">Local authority</th><th>Last updated</th><th>Rows</th><th id=\"sortby\">Score</th><th>Valid required headings</th><th>Includes required columns</th><th>Includes empties</th><th>Valid coords</th><th>Valid dates</th><th>Valid currency values</th><th>Hosted</th><th>CORS</th></tr>\n";
foreach $code (@LAcodes){

	$position = $i + 1;
	if($LAdata{$code}{'score'} == $lastscore){
		$position = $previousposition;
	}

	$status .= "\t\t\t\t<tr><td>$position</td><td class=\"LA-name\">";
	if($file){
		$status .= "<a href=\"$LAdata{$code}{'file'}\" code=\"$code\" title=\"$LAdata{$code}{'name'}\">$LAdata{$code}{'name'}</a>";
	}else{
		$status .= "<span code=\"$code\" title=\"$LAdata{$code}{'name'}\">$LAdata{$code}{'name'}</span>";
	}
	$status .= "</td><td>$LAdata{$code}{'lastmodified'}</td>";
	$status .= "<td>$LAdata{$code}{'rows'}</td>";
	$status .= "<td>".sprintf("%.1f",$LAdata{$code}{'score'})."</td>";
	$status .= "<td>".getTrafficLight($LAdata{$code}{'okhead'}/$nreq,"$LAdata{$code}{'okhead'}/$nreq","$LAdata{$code}{'okhead'}/$nreq","-","headings",($LAdata{$code}{'notgot'} ? "Missing: ".$LAdata{$code}{'notgot'} : "Got everything!"))."</td>";
	$status .= "<td>".getTrafficLight($LAdata{$code}{'okreq'}/$nreq,"$LAdata{$code}{'okreq'}/$nreq","$LAdata{$code}{'okreq'}/$nreq","-","required")."</td>";
	$status .= "<td>".getTrafficLight($LAdata{$code}{'empties'},"Yes","No","-","empties")."</td>";
	$status .= "<td>".getTrafficLight(($LAdata{$code}{'latformats'}+$LAdata{$code}{'lonformats'})/(2*($LAdata{$code}{'rows'} == 0 ? 1 : $LAdata{$code}{'rows'})),($LAdata{$code}{'latformats'}+$LAdata{$code}{'lonformats'}),($LAdata{$code}{'latformats'}+$LAdata{$code}{'lonformats'}),"-","coordinates")."</td>";
	$status .= "<td>".getTrafficLight($LAdata{$code}{'dateformats'}/($LAdata{$code}{'rows'}==0 ? 1 : $LAdata{$code}{'rows'}),"$LAdata{$code}{'dateformats'}","$LAdata{$code}{'dateformats'}","-","dateformats")."</td>";
	$status .= "<td>".getTrafficLight($LAdata{$code}{'currformats'}/($LAdata{$code}{'rows'}==0 ? 1 : $LAdata{$code}{'rows'}),"$LAdata{$code}{'currformats'}","$LAdata{$code}{'currformats'}","-","currencyformats")."</td>";
	$status .= "<td>".getTrafficLight($LAdata{$code}{'hosted'},"Yes","No","-","hosted")."</td>";
	$status .= "<td>".getTrafficLight($LAdata{$code}{'cors'},"Yes","No","-","CORS")."</td>";
	$status .= "</tr>\n";
	print "$code - $position - $LAdata{$code}{'score'}\n";
	$i++;
	$previousposition = $position;
	$lastscore = $LAdata{$code}{'score'};
}
$status .= "\t\t\t</table>";

open(HTML,$sfile);
@lines = <HTML>;
close(HTML);

$instatus = 0;
@htmllines;
foreach $line (@lines){
	if($line =~ /\<\!-- End status --\>/i){ $instatus = 0;}
	if($line =~ /\<\!-- Start status --\>/i){
		push(@htmllines,$line.$status."\n");
		$instatus = 1;
	}
	if(!$instatus){
		push(@htmllines,$line);
	}
}
open(HTML,">",$sfile);
print HTML @htmllines;
close(HTML);


sub getTrafficLight {
	my $status,$link,$yes,$no,$na,@inp,$title;
	@inp = @_;
	$status = $inp[0];
	$yes = $inp[1];
	$no = $inp[2];
	$na = $inp[3];
	$link = $_[4];
	$title = $_[5];
	if($status == 1){ return "<span class=\"green-light\"".($title ? " title=\"$title\"":"")."></span><a href=\"\#$link\">$yes</a>"; }
	elsif($status < 1 && $status > 0){ return "<span class=\"amber-light\"".($title ? " title=\"$title\"":"")."></span><a href=\"\#$link\">$no</a>"; }
	elsif($status == 0){ return "<span class=\"red-light\"".($title ? " title=\"$title\"":"")."></span><a href=\"\#$link\">$no</a>"; }
	elsif($status < 0){ return $na; }
	return ""; 
}

sub simpleHeading {
	my $heading = $_[0];
	$heading = lc($heading);
	$heading =~ s/ //g;
	$heading =~ s/ $//g;
	$heading =~ s/[^A-Za-z0-9\-]//g;
	return $heading;
}