docker build -t ghcr.io/tbdavid2019/8888ip:latest .

docker push ghcr.io/tbdavid2019/8888ip:latest


docker run -d -p 6001:6001 \
  --env-file .env \
  --restart unless-stopped \
  --name 8888ip \
  ghcr.io/tbdavid2019/8888ip:latest
