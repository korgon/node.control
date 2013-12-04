# Startup script for nodes controllers
#
# version 1.1

clear
echo "Running controller initialization." >> controller.log

# load device tree overlay
echo sprinkler-system > /sys/devices/bone_capemgr.8/slots

# wifi startup
sleep 6;  # wait for usb drivers...
ifconfig wlan0 up;
rm /var/run/wpa_supplicant/wlan0

wpa_supplicant -B -Dwext -iwlan0 -c /etc/wpa_supplicant.conf;
sleep 3;

chown node /dev/ttyO[1-9]
chown node /dev/i2c-[0-9]

udhcpc -i wlan0
wait;


# Disable annoying flashies
echo none > /sys/class/leds/beaglebone:green:usr0/trigger
echo none > /sys/class/leds/beaglebone:green:usr1/trigger
echo none > /sys/class/leds/beaglebone:green:usr2/trigger
echo none > /sys/class/leds/beaglebone:green:usr3/trigger

# eth0 bootup
#ifconfig eth0 up;
# Force a NTP update
/usr/bin/ntpdate -b -s -u pool.ntp.org
