# LEDs #

LEDs dimmed by web interface through RPi!

## Installation on Raspberry Pi ##

~~~
# Install Node.js
# The easiest way to do this on Raspbian is get the binaries from nodejs.org/dist compiled for the RPi:
cd /opt
sudo wget http://nodejs.org/dist/v0.10.28/node-v0.10.28-linux-arm-pi.tar.gz
sudo tar -xzf node-v0.10.28-linux-arm-pi.tar.gz
sudo mv node-v0.10.28-linux-arm-pi/ node
sudo ln -s /opt/node/bin/node /bin/node
sudo ln -s /opt/node/bin/npm /bin/npm

# i2c needs to be enable on the Raspberry Pi. Run raspi-config and enable i2c in the advanced tab
raspi-config

# Might need to remove 'i2c-dev' or 'i2c-bcm2708' kernel module from autostart blacklist in /etc/modprobe.d/raspi-blacklist.conf
sudo vi /etc/modprobe.d/raspi-blacklist.conf

# May also need to load kernel the modules
lsmod | grep i2c
# If you see 'i2c-dev' and 'i2c-bcm2708' modules, they're already loaded. If not, load them manually
sudo modprobe i2c-dev i2c-bcm2708
# And to make it load automatically on boot, add the lines 'i2c-dev' and 'i2c-bcm2708' to /etc/modules

# Get the code and install npm dependencies
git clone https://github.com/Densaugeo/LEDs
cd LEDs/
npm install

# Edit config files
vi i2c-config.json
vi relay-config.json

# Start the servers
sudo node i2c-server.js # Sudo required to access i2c
node relay-server.js

# View the web interface
firefox localhost:8080/
~~~



While the server is running, the PWM channels can be controlled by a simple web page at http://[Raspberry Pi IP]:8080/

To my surprise, no firewall adjustments on the Pi were necessary to access this page.

## Licensing ##

Files beginning with 'Adafruit_' were taken from Adafruit's library of Pi code (https://github.com/adafruit/Adafruit-Raspberry-Pi-Python-Code) and are subject to Adafruit's license (it looks similar to MIT).

All other files are the work of Densaugeo, and are provided under the MIT license.
