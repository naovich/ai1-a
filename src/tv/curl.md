# ON/OFF

curl -X POST http://localhost:3000/tv/turn-on -H "Content-Type: application/json"
curl -X POST http://localhost:3000/tv/turn-off -H "Content-Type: application/json"

# VOLUME

curl -X POST http://localhost:3000/tv/set-volume -H "Content-Type: application/json" -d '{"level": VOLUME_LEVEL}'

curl -X POST http://localhost:3000/tv/get-volume -H "Content-Type: application/json"

curl -X POST http://localhost:3000/tv/toggle-mute -H "Content-Type: application/json"

# CHANNEL

curl -X POST http://localhost:3000/tv/open-app -H "Content-Type: application/json" -d '{"appId": "youtube.leanback.v4"}'

curl -X POST http://localhost:3000/tv/open-app -H "Content-Type: application/json" -d '{"appId": "netflix"}'

curl -X POST http://localhost:3000/tv/open-app -H "Content-Type: application/json" -d '{"appId": "amazon"}'

curl -X POST http://localhost:3000/tv/open-app -H "Content-Type: application/json" -d '{"appId": "disneyplus"}'

# TOAST

curl -X POST http://localhost:3000/tv/create-toast -H "Content-Type: application/json" -d '{"message": "Bonjour Nadhoir 😍"}'

# LECTURE

curl -X POST http://localhost:3000/tv/pause -H "Content-Type: application/json"

curl -X POST http://localhost:3000/tv/play -H "Content-Type: application/json"

curl -X POST http://localhost:3000/tv/channel-up -H "Content-Type: application/json"

curl -X POST http://localhost:3000/tv/send-enter-key -H "Content-Type: application/json"

curl -X POST http://localhost:3000/tv/send-key -H "Content-Type: application/json" -d '{"key": "UP"}'

    •	Enter: "ENTER"
    •	Back: "BACK"
    •	Home: "HOME"
    •	Volume Up: "VOLUMEUP"
    •	Volume Down: "VOLUMEDOWN"
    •	Mute: "MUTE"
    •	Channel Up: "CHANNELUP"
    •	Channel Down: "CHANNELDOWN"
    •	Up: "UP"
    •	Down: "DOWN"
    •	Left: "LEFT"
    •	Right: "RIGHT"
    •	Red Button: "RED"
    •	Green Button: "GREEN"
    •	Yellow Button: "YELLOW"
    •	Blue Button: "BLUE"
    •	Play: "PLAY"
    •	Pause: "PAUSE"
    •	Stop: "STOP"
    •	Fast Forward: "FASTFORWARD"
    •	Rewind: "REWIND"
    •	Info: "INFO"
    •	Exit: "EXIT"

curl -X POST 'http://localhost:3000/tv/button' \
-H 'Content-Type: application/json' \
-d '{
"button": "MUTE"
}'
