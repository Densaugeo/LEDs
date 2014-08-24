LEDs
=========

LEDs dimmed by web interface through RPi!

Installation on Raspberry Pi:

# Might need to remove 'i2c-dev' or 'i2c-bcm2708' kernel module from autostart blacklist in /etc/modprobe.d/raspi-blacklist.conf
sudo vi /etc/etc/modprobe.d/raspi-blacklist.conf

# Install packages
sudo apt-get install python-smbus python-pip
sudo pip install tornado

# Get the code and install npm dependencies
git clone https://github.com/Densaugeo/LEDs

# Start the server
sudo python ./LEDs/server.py

To start the server automatically when the Pi boots, add it to Cron:

crontab -e

And add the line '@reboot sudo python [install location]/LEDs/server.py'

While the server is running, the PWM channels can be controlled by a simple web page at http://[Raspberry Pi IP]:8080/

To my surprise, no firewall adjustments on the Pi were necessary to access this page