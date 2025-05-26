#!/bin/bash
current=$(brightnessctl get | awk '{printf "%.0f", $1/$(brightnessctl max)*100}')
new_brightness=$(echo -e "10%\n20%\n30%\n40%\n50%\n60%\n70%\n80%\n90%\n100%" | wofi --dmenu --prompt "Brightness: ${current}%")
if [ -n "$new_brightness" ]; then
    brightnessctl set $new_brightness
fi
