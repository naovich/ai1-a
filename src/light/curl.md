curl -X POST http://localhost:3000/light/turn-on -H "Content-Type: application/json"

curl -X POST http://localhost:3000/light/turn-off -H "Content-Type: application/json"

curl -X POST http://localhost:3000/light/set-brightness -H "Content-Type: application/json" -d '{"brightness": 50}'

curl -X POST 'http://localhost:3000/light/set-hsl' \
-H 'Content-Type: application/json' \
-d '{
"hue": 240,
"saturation": 100
}'

curl -X POST 'http://localhost:3000/light/set-color-temperature' \
-H 'Content-Type: application/json' \
-d '{
"temperature": 5000
}'
