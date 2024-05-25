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
