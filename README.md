# Business rates
As part of the ODI Leeds Open Data Collaboration group (representatives from Barnsley, Bradford, Calderdale, Leeds, Stockport councils) we are exploring ways to improve local authority Business Rates data (NDR).


## Format
We've defined a [common format for sharing Business Rates data](https://odileeds.github.io/business-rates/format). Once Local Authorities use that format we can add them to the visualisation.

## Progress
We have a [status table](https://odileeds.github.io/business-rates/status) showing how well local authorities are publishing the data. This assigns a score based on the headings, coordinates, and dates as well as if the file is hosted externally in a way that [can be accessed from a webpage](https://www.w3.org/wiki/CORS_Enabled).

## Getting involved
If you are a Local Authority and want your data included in the [visualisation tool](https://odileeds.github.io/business-rates/) or the [status table](https://odileeds.github.io/business-rates/status), you should update your row in [index.csv](index.csv) then submit a pull request. We'll use `status.pl` to rebuild the status table. If your file contains the `Latitude`, `Longitude` and `Rateable value` columns we will be able to include you in the visualisation. 

### Useful tools
Not every local authority has the tools, time, or skills to get everything just right. So we've made some tools to help with some common issues.
* If you don't have `Latitude` or `Longitude` but have a `Postcode` column, you can add the latitude and longitude using our [postcodes to lat/lon tool](https://odileeds.github.io/Postcodes2LatLon/).
* If your dates are not in ISO8601 format and you are having trouble getting them in that format (e.g. from Excel) we have created a tool to help [clean up your CSV file](https://odileeds.github.io/CSVCleaner/).
