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

# Might need to remove 'i2c-dev' or 'i2c-bcm2708' kernel module from autostart blacklist in /etc/modprobe.d/raspi-blacklist.conf
sudo vi /etc/modprobe.d/raspi-blacklist.conf

# May also need to load kernel the module
lsmod | grep i2c
# If you see a 'i2c-bcm2708' module, it's already loaded. If not, load it manually
sudo modprobe i2c-bcm2708
# And to make it load automatically on boot, add the line 'i2c-bcm2708' to /etc/modules

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
~~~



While the server is running, the PWM channels can be controlled by a simple web page at http://[Raspberry Pi IP]:8080/

To my surprise, no firewall adjustments on the Pi were necessary to access this page.

## Licensing ##

Files beginning with 'Adafruit_' were taken from Adafruit's library of Pi code (https://github.com/adafruit/Adafruit-Raspberry-Pi-Python-Code) and are subject to Adafruit's license (it looks similar to MIT).

All other files are the work of Densaugeo, and are provided under the MIT license.
