docker build -t tbdavid2019/iptools:latest .

docker push tbdavid2019/iptools:latest


docker run -d -p 6001:18966 \
  --env-file .env \
  --restart unless-stopped \
  --name iptools \
  tbdavid2019/iptools:latest

