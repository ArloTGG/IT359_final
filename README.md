# Phishlink Scanner
This Firefox extension allows the scanning of links in your browser to check and see if they are a phishing link or not. Program makes a call to Gemini API to generate a report explaining if the link is safe as well as why it may be unsafe. The file structure is as follows:
```
background.js: API call and link handling
content.js: Popup formatting
manifest.json: The file loaded/necessary for Firefox extensions
options.html: Formatting for key input
options.js: API key is stored here
```
# Requirements
Only requirements is that Firefox is installed on your system as it is only compatible with Firefox.
# Installation
After downloading the code, extract the files to a desired location and load up Firefox. Go to FireFox settings in the top right and access the "Extensions and themes tab" and click the cog wheel and select "Install Add-Ons from file" and select the "manifest.json" located within the folder. After, click on the extension tab in the top right to open a window to input your Gemini API key. When successful, you may now right click any link on your page and select "Scan with Gemini AI" to generate the report and safety status.
